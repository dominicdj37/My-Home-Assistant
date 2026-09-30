#include "Ntp.h"

#include <Arduino.h>
#include <sys/time.h>
#include <time.h>

namespace ntp {

namespace {
// Any time before this means SNTP has not delivered a real time yet.
constexpr time_t kValidEpoch = 1700000000;  // Nov 2023
}  // namespace

void begin() {
  // UTC; the SNTP client runs in the background and resyncs on its own.
  configTime(0, 0, "pool.ntp.org", "time.google.com");
}

bool isSynced() { return time(nullptr) > kValidEpoch; }

uint64_t nowMs() {
  if (!isSynced()) return 0;
  timeval tv;
  gettimeofday(&tv, nullptr);
  return static_cast<uint64_t>(tv.tv_sec) * 1000ULL + tv.tv_usec / 1000;
}

}  // namespace ntp
