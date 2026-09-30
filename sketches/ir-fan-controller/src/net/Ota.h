#pragma once

// Over-the-air firmware updates on the local network. Once the first build
// is flashed over USB, later uploads can target the "fan-1" network port in
// the Arduino IDE (Tools → Port).
namespace ota {

void loop();  // starts the OTA service once Wi-Fi is up, then services it

}  // namespace ota
