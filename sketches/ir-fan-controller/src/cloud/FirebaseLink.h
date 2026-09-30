#pragma once

#include "../core/Command.h"

// Connects this device to Firebase Realtime Database:
//   reads   /devices/{id}/commands/*  (streamed, pushed by the web app)
//   writes  /devices/{id}/info        (once per boot)
//           /devices/{id}/status      (heartbeat)
//           /devices/{id}/state       (last executed action)
//           /devices/{id}/lastAck     (result of the latest command)
//
// This is the only file that knows about Firebase. Swapping the transport
// (e.g. MQTT for Home Assistant) means replacing this module only.
namespace cloud {

using CommandCallback = void (*)(const Command& cmd);

void begin(CommandCallback onCommand);
void loop();
bool isReady();

// Removes the command from the queue in Firebase and records `result`
// (one of command_result::*). Safe to call for commands never executed.
void acknowledge(const Command& cmd, const char* result);

// Removes a duplicate delivery from the queue without touching lastAck/state.
void discard(const Command& cmd);

}  // namespace cloud
