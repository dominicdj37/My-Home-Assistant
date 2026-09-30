#include "Ota.h"

#include <ArduinoOTA.h>

#include "../../config.h"
#include "../../secrets.h"
#include "../core/Log.h"
#include "Network.h"

namespace ota {

namespace {
bool started = false;

void start() {
  ArduinoOTA.setHostname(config::HOSTNAME);
  ArduinoOTA.setPassword(secrets::OTA_PASSWORD);
  ArduinoOTA.onStart([]() { LOG("ota", "update started"); });
  ArduinoOTA.onEnd([]() { LOG("ota", "update finished, rebooting"); });
  ArduinoOTA.onError([](ota_error_t error) { LOG("ota", "error %u", error); });
  ArduinoOTA.begin();
  started = true;
  LOG("ota", "ready as %s.local", config::HOSTNAME);
}
}  // namespace

void loop() {
  if (!started) {
    if (network::isConnected()) start();
    return;
  }
  ArduinoOTA.handle();
}

}  // namespace ota
