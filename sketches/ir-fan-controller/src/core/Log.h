#pragma once

#include <Arduino.h>

// Tagged serial logging, e.g. LOG("wifi", "connected, ip=%s", ip.c_str());
#define LOG(tag, fmt, ...) \
  Serial.printf("[%8lu][%-5s] " fmt "\n", millis(), tag, ##__VA_ARGS__)
