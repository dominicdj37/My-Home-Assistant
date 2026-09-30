#include "IrFan.h"

#include "../core/Log.h"

namespace {

struct IrCode {
  const char* action;
  uint32_t code;
};

// Codes captured from the Atomberg remote, sent as 32-bit NEC frames.
constexpr IrCode kCodes[] = {
    {"power", 0xCF8976},
    {"speed_1", 0xCFD12E},
    {"speed_2", 0xCF09F6},
    {"speed_3", 0xCF51AE},
    {"speed_4", 0xCFC936},
    {"speed_5", 0xCF11EE},
    {"boost", 0xCFF10E},
};

const IrCode* findCode(const String& action) {
  for (const IrCode& entry : kCodes) {
    if (action == entry.action) return &entry;
  }
  return nullptr;
}

}  // namespace

IrFan::IrFan(uint8_t irPin, uint32_t cooldownMs)
    : ir_(irPin), cooldownMs_(cooldownMs) {}

void IrFan::begin() { ir_.begin(); }

bool IrFan::supports(const String& action) {
  return findCode(action) != nullptr;
}

bool IrFan::isReady() const {
  return !hasSent_ || millis() - lastSendMs_ >= cooldownMs_;
}

bool IrFan::send(const String& action) {
  const IrCode* entry = findCode(action);
  if (entry == nullptr) return false;

  ir_.sendNEC(entry->code);
  lastSendMs_ = millis();
  hasSent_ = true;
  LOG("ir", "sent %s (0x%06X)", entry->action, entry->code);
  return true;
}
