#pragma once

#include <stdint.h>

// Wall-clock time via SNTP. Used to discard stale commands.
namespace ntp {

void begin();
bool isSynced();
// Milliseconds since the Unix epoch, or 0 while not yet synced.
uint64_t nowMs();

}  // namespace ntp
