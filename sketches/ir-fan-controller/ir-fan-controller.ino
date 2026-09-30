/*
 * IR Fan Controller
 * Board: NodeMCU v3 (ESP-12E / ESP8266MOD, CH340C) — "NodeMCU 1.0 (ESP-12E Module)"
 *
 * Receives commands from Firebase Realtime Database (sent by the web
 * dashboard) and replays the matching IR remote code to an Atomberg BLDC fan.
 *
 * Setup: copy secrets.example.h → secrets.h and fill it in. Full guide in
 * docs/SETUP.md at the repository root.
 *
 * This file is the composition root: it wires the modules in src/ together
 * and holds the command policy (validate → expire → queue → send → ack).
 */

#include "config.h"
#include "src/cloud/FirebaseLink.h"
#include "src/core/CommandQueue.h"
#include "src/core/Log.h"
#include "src/core/Ntp.h"
#include "src/devices/IrFan.h"
#include "src/net/Network.h"
#include "src/net/Ota.h"

IrFan fan(config::IR_LED_PIN, config::IR_COOLDOWN_MS);
CommandQueue pending;

bool isExpired(const Command& cmd) {
  const uint64_t now = ntp::nowMs();
  if (now == 0 || cmd.issuedAt == 0) return false;  // can't tell; allow it
  return now > cmd.issuedAt && now - cmd.issuedAt > config::COMMAND_TTL_MS;
}

void onCommand(const Command& cmd) {
  // Delivered again (stream reconnect, or a client retrying a write that
  // already succeeded). Never execute twice — just make sure it's dequeued.
  if (pending.hasSeen(cmd.id)) {
    if (!pending.isQueued(cmd.id)) cloud::discard(cmd);
    return;
  }

  LOG("cmd", "received %s (%s)", cmd.action.c_str(), cmd.id.c_str());
  if (!IrFan::supports(cmd.action)) {
    pending.remember(cmd.id);
    cloud::acknowledge(cmd, command_result::UNKNOWN_ACTION);
  } else if (isExpired(cmd)) {
    pending.remember(cmd.id);
    cloud::acknowledge(cmd, command_result::EXPIRED);
  } else if (!pending.push(cmd)) {
    cloud::acknowledge(cmd, command_result::BUSY);
  }
}

// Sends at most one queued command per cooldown window.
void runPendingCommand() {
  if (pending.isEmpty() || !fan.isReady()) return;

  const Command cmd = pending.pop();
  fan.send(cmd.action);
  cloud::acknowledge(cmd, command_result::OK);
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  LOG("main", "%s v%s (%s) booting", config::DEVICE_NAME,
      config::FIRMWARE_VERSION, config::DEVICE_ID);

  fan.begin();
  network::begin();
  ntp::begin();
  cloud::begin(onCommand);
}

void loop() {
  network::loop();
  ota::loop();
  cloud::loop();
  runPendingCommand();
}
