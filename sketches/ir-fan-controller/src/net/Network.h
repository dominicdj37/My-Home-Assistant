#pragma once

// Wi-Fi station connection. Non-blocking: the rest of the firmware keeps
// running while (re)connecting, and the SDK reconnects automatically.
namespace network {

void begin();
void loop();
bool isConnected();

}  // namespace network
