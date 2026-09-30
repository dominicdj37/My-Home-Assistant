#include "Network.h"

#include <ESP8266WiFi.h>

#include "../../config.h"
#include "../../secrets.h"
#include "../core/Log.h"

namespace network {

namespace {
bool wasConnected = false;
}  // namespace

void begin() {
  WiFi.persistent(false);  // don't wear flash rewriting credentials each boot
  WiFi.mode(WIFI_STA);
  WiFi.hostname(config::HOSTNAME);
  WiFi.setAutoReconnect(true);
  WiFi.begin(secrets::WIFI_SSID, secrets::WIFI_PASSWORD);
  LOG("wifi", "connecting to \"%s\"...", secrets::WIFI_SSID);
}

void loop() {
  const bool connected = isConnected();
  if (connected == wasConnected) return;
  wasConnected = connected;

  if (connected) {
    LOG("wifi", "connected, ip=%s rssi=%d dBm",
        WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    LOG("wifi", "disconnected, retrying in background");
  }
}

bool isConnected() { return WiFi.status() == WL_CONNECTED; }

}  // namespace network
