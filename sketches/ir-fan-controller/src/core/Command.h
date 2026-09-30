#pragma once

#include <Arduino.h>

// A control request, independent of the transport that delivered it
// (Firebase today; MQTT / Home Assistant later).
struct Command {
  String id;             // unique id assigned by the sender
  String action;         // e.g. "power", "speed_3", "boost"
  uint64_t issuedAt = 0; // sender timestamp in ms since epoch, 0 if unknown
};

// Outcome reported back to the sender. Values are part of the wire contract
// shared with the web app (see docs/ARCHITECTURE.md).
namespace command_result {
constexpr char OK[] = "ok";
constexpr char UNKNOWN_ACTION[] = "unknown_action";
constexpr char EXPIRED[] = "expired";
constexpr char BUSY[] = "busy";
}  // namespace command_result
