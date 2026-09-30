// Library feature flags must be defined before the include, and this must be
// the only translation unit that includes FirebaseClient.h.
#define ENABLE_USER_AUTH
#define ENABLE_DATABASE

#include "FirebaseLink.h"

#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <FirebaseClient.h>
#include <WiFiClientSecure.h>

#include "../../config.h"
#include "../../secrets.h"
#include "../core/Log.h"
#include "../net/Network.h"

namespace cloud {

namespace {

// Firebase ID tokens live 1 h; refresh a bit earlier.
constexpr size_t kTokenTtlSec = 3000;

// When the database denies access (device missing from /access/devices, or
// removed), the library would retry the stream every 5 s — ~17k denied
// requests a day. Instead, pause all traffic and retry with backoff.
constexpr uint32_t kDeniedRetryMinMs = 30UL * 1000;
constexpr uint32_t kDeniedRetryMaxMs = 15UL * 60 * 1000;

// One TLS connection for regular requests and a dedicated one for the
// long-lived command stream (the library requires them to be separate).
WiFiClientSecure sslClient;
WiFiClientSecure streamSslClient;
AsyncClientClass client(sslClient);
AsyncClientClass streamClient(streamSslClient);

UserAuth userAuth(secrets::FIREBASE_API_KEY, secrets::DEVICE_EMAIL,
                  secrets::DEVICE_PASSWORD, kTokenTtlSec);
FirebaseApp app;
RealtimeDatabase db;

CommandCallback commandCallback = nullptr;
String devicePath;  // "/devices/<id>"
bool started = false;
bool streamRunning = false;
bool infoPublished = false;
bool heartbeatSent = false;
uint32_t lastHeartbeatMs = 0;

bool accessDenied = false;  // set by callbacks, handled in loop()
uint32_t pausedAtMs = 0;
uint32_t pauseMs = 0;
uint32_t nextRetryDelayMs = kDeniedRetryMinMs;

// ─── Result callbacks ─────────────────────────────────────────────────

bool isAccessDenied(AsyncResult& result) {
  const int code = result.error().code();
  return code == FIREBASE_ERROR_HTTP_CODE_UNAUTHORIZED ||
         code == FIREBASE_ERROR_HTTP_CODE_FORBIDDEN;
}

void logErrors(AsyncResult& result) {
  if (!result.isError()) return;
  LOG("cloud", "%s failed: %s (%d)", result.uid().c_str(),
      result.error().message().c_str(), result.error().code());
  if (isAccessDenied(result)) accessDenied = true;
}

void onAuthResult(AsyncResult& result) {
  if (result.isEvent()) {
    LOG("cloud", "auth: %s", result.eventLog().message().c_str());
  }
  logErrors(result);
}

void onWriteResult(AsyncResult& result) { logErrors(result); }

// ─── Incoming commands ────────────────────────────────────────────────

void dispatch(const String& id, JsonObjectConst json) {
  if (json.isNull() || commandCallback == nullptr) return;

  Command cmd;
  cmd.id = id;
  cmd.action = json["action"] | "";
  cmd.issuedAt = json["issuedAt"] | static_cast<uint64_t>(0);
  commandCallback(cmd);
}

// Stream events arrive as {path, data} relative to /commands:
//   path "/"      data {"<id>": {...}, ...}   initial snapshot or merge
//   path "/<id>"  data {...}                  one new command
//   data null                                 a command was removed
void onStreamEvent(RealtimeDatabaseResult& stream) {
  const String event = stream.event();
  if (!event.startsWith("put") && !event.startsWith("patch")) return;

  const String data = stream.data();
  if (data == "null") return;

  JsonDocument doc;
  const DeserializationError error = deserializeJson(doc, data);
  if (error) {
    LOG("cloud", "ignoring malformed command payload: %s", error.c_str());
    return;
  }

  const String path = stream.dataPath();
  if (path == "/") {
    for (JsonPairConst child : doc.as<JsonObjectConst>()) {
      dispatch(child.key().c_str(), child.value().as<JsonObjectConst>());
    }
  } else if (path.indexOf('/', 1) < 0) {
    dispatch(path.substring(1), doc.as<JsonObjectConst>());
  }
  // Deeper paths would be partial edits; commands are always written whole.
}

void onStreamResult(AsyncResult& result) {
  logErrors(result);
  if (!result.available()) return;

  RealtimeDatabaseResult& stream = result.to<RealtimeDatabaseResult>();
  if (!stream.isStream()) return;

  nextRetryDelayMs = kDeniedRetryMinMs;  // stream works: reset backoff
  onStreamEvent(stream);
}

// ─── Outgoing writes ──────────────────────────────────────────────────

String toJson(const JsonDocument& doc) {
  String json;
  serializeJson(doc, json);
  return json;
}

void publishInfo() {
  JsonDocument doc;
  doc["name"] = config::DEVICE_NAME;
  doc["type"] = config::DEVICE_TYPE;
  doc["firmware"] = config::FIRMWARE_VERSION;
  doc["hardware"] = "NodeMCU v3 (ESP8266)";
  doc["mac"] = WiFi.macAddress();
  doc["bootedAt"][".sv"] = "timestamp";
  db.set<object_t>(client, devicePath + "/info", object_t(toJson(doc)),
                   onWriteResult, "info");
}

void publishStatus() {
  JsonDocument doc;
  doc["lastSeen"][".sv"] = "timestamp";
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["uptimeSec"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  db.set<object_t>(client, devicePath + "/status", object_t(toJson(doc)),
                   onWriteResult, "status");
}

void start() {
  // TLS certificates are not verified: the ESP8266 has too little RAM for
  // Google's full CA chain. See docs/ARCHITECTURE.md → Security.
  sslClient.setInsecure();
  streamSslClient.setInsecure();
  sslClient.setBufferSizes(4096, 1024);
  streamSslClient.setBufferSizes(4096, 1024);

  initializeApp(client, app, getAuth(userAuth), onAuthResult, "auth");
  app.getApp<RealtimeDatabase>(db);
  db.url(secrets::FIREBASE_DATABASE_URL);
  streamClient.setSSEFilters("get,put,patch,cancel,auth_revoked");

  started = true;
  LOG("cloud", "started for %s", devicePath.c_str());
}

// The stream reconnects on its own after network drops or token refreshes;
// it is only stopped and restarted by hand when access is denied.
void startStream() {
  accessDenied = false;
  db.get(streamClient, devicePath + "/commands", onStreamResult,
         true /* SSE stream */, "commands");
  streamRunning = true;
}

void pauseForDeniedAccess() {
  streamClient.stopAsync();
  streamRunning = false;
  infoPublished = false;  // the denied info write is re-sent after resuming
  pausedAtMs = millis();
  pauseMs = nextRetryDelayMs;
  nextRetryDelayMs = min(nextRetryDelayMs * 2, kDeniedRetryMaxMs);
  LOG("cloud", "access denied: is /access/devices/%s set to this device's UID?"
      " Retrying in %u s", config::DEVICE_ID, static_cast<unsigned>(pauseMs / 1000));
}

}  // namespace

void begin(CommandCallback onCommand) {
  commandCallback = onCommand;
  devicePath = String("/devices/") + config::DEVICE_ID;
}

void loop() {
  if (!started) {
    if (network::isConnected()) start();
    return;
  }

  app.loop();
  if (!app.ready()) return;

  if (accessDenied && streamRunning) pauseForDeniedAccess();
  if (!streamRunning) {
    if (millis() - pausedAtMs < pauseMs) return;  // backing off: no traffic
    startStream();
  }

  if (!infoPublished) {
    publishInfo();
    infoPublished = true;
  }
  if (!heartbeatSent ||
      millis() - lastHeartbeatMs >= config::HEARTBEAT_INTERVAL_MS) {
    publishStatus();
    heartbeatSent = true;
    lastHeartbeatMs = millis();
  }
}

bool isReady() { return started && app.ready(); }

void acknowledge(const Command& cmd, const char* result) {
  // One multi-path update: dequeue the command and record the outcome.
  JsonDocument doc;
  doc["commands/" + cmd.id] = nullptr;
  JsonObject ack = doc["lastAck"].to<JsonObject>();
  ack["id"] = cmd.id;
  ack["action"] = cmd.action;
  ack["result"] = result;
  ack["at"][".sv"] = "timestamp";
  if (strcmp(result, command_result::OK) == 0) {
    doc["state/lastAction"] = cmd.action;
    doc["state/lastActionAt"][".sv"] = "timestamp";
  }

  db.update<object_t>(client, devicePath, object_t(toJson(doc)),
                      onWriteResult, "ack");
  LOG("cloud", "ack %s %s -> %s", cmd.id.c_str(), cmd.action.c_str(), result);
}

void discard(const Command& cmd) {
  db.remove(client, devicePath + "/commands/" + cmd.id, onWriteResult,
            "discard");
  LOG("cloud", "discarded duplicate %s", cmd.id.c_str());
}

}  // namespace cloud
