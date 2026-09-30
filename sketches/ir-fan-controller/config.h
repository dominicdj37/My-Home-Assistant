#pragma once

#include <stdint.h>

// Non-secret, per-device configuration. Secrets live in secrets.h (gitignored).
namespace config {

// ─── Identity ─────────────────────────────────────────────────────────
// DEVICE_ID must match the key under /devices and /access/devices in Firebase.
constexpr char DEVICE_ID[] = "fan-1";
constexpr char DEVICE_NAME[] = "BLDC FAN";  // shown in the web app
constexpr char DEVICE_TYPE[] = "ir_fan";  // tells the web app which card to render
constexpr char FIRMWARE_VERSION[] = "1.0.0";
constexpr char HOSTNAME[] = "fan-1";  // Wi-Fi hostname and OTA port name

// ─── Hardware ─────────────────────────────────────────────────────────
constexpr uint8_t IR_LED_PIN = 4;  // NodeMCU D2 (GPIO4)

// ─── Timing ───────────────────────────────────────────────────────────
// Minimum gap between IR transmissions. Protects the LED (driven without a
// resistor) and gives the fan time to register each code.
constexpr uint32_t IR_COOLDOWN_MS = 1000;
// Commands older than this are discarded instead of executed, so a queued
// "power" never toggles the fan long after someone pressed it.
constexpr uint32_t COMMAND_TTL_MS = 60 * 1000;
// How often the device reports it is alive (drives the online badge).
constexpr uint32_t HEARTBEAT_INTERVAL_MS = 60 * 1000;

}  // namespace config
