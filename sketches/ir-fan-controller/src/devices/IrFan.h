#pragma once

#include <Arduino.h>
#include <IRsend.h>

// Drives an Atomberg BLDC fan by replaying its IR remote codes (NEC).
// Action names ("power", "speed_1".."speed_5", "boost") are the wire
// contract shared with the web app — see web/js/devices/ir-fan/actions.js.
class IrFan {
 public:
  IrFan(uint8_t irPin, uint32_t cooldownMs);

  void begin();

  static bool supports(const String& action);

  // True once the cooldown since the previous transmission has passed.
  bool isReady() const;

  // Transmits the IR code for `action`. Returns false for unknown actions.
  bool send(const String& action);

 private:
  IRsend ir_;
  uint32_t cooldownMs_;
  uint32_t lastSendMs_ = 0;
  bool hasSent_ = false;
};
