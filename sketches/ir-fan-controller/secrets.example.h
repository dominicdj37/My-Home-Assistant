#pragma once

// Copy this file to secrets.h and fill in real values.
// secrets.h is gitignored — never commit real credentials.
namespace secrets {

// ─── Wi-Fi ────────────────────────────────────────────────────────────
constexpr char WIFI_SSID[] = "YOUR_WIFI_SSID";
constexpr char WIFI_PASSWORD[] = "YOUR_WIFI_PASSWORD";

// ─── Firebase ─────────────────────────────────────────────────────────
// Project settings → General → Web API key.
constexpr char FIREBASE_API_KEY[] = "YOUR_FIREBASE_WEB_API_KEY";
// Realtime Database → Data → URL shown at the top of the page.
constexpr char FIREBASE_DATABASE_URL[] = "https://YOUR_PROJECT-default-rtdb.firebaseio.com";
// Email/password user created for this device (Authentication → Users).
constexpr char DEVICE_EMAIL[] = "fan-1@devices.local";
constexpr char DEVICE_PASSWORD[] = "YOUR_DEVICE_PASSWORD";

// ─── Over-the-air updates ─────────────────────────────────────────────
// Asked by the Arduino IDE when uploading over the network.
constexpr char OTA_PASSWORD[] = "YOUR_OTA_PASSWORD";

}  // namespace secrets
