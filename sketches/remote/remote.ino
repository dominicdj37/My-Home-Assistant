#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <IRremoteESP8266.h>
#include <IRsend.h>

// ==========================================
// LEGACY: superseded by sketches/ir-fan-controller (Firebase-based).
// 1. WiFi Credentials (CHANGE THESE!)
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";


// ==========================================
// 2. Hardware & IR Setup
// ==========================================
const uint16_t kIrLed = 4; // NodeMCU pin D2 (GPIO 4)
IRsend irsend(kIrLed);
ESP8266WebServer server(80);

// ==========================================
// 3. Atomberg Hex Codes
// ==========================================
const uint32_t CMD_POWER  = 0xCF8976;
const uint32_t CMD_SPEED1 = 0xCFD12E;
const uint32_t CMD_SPEED2 = 0xCF09F6;
const uint32_t CMD_SPEED3 = 0xCF51AE;
const uint32_t CMD_SPEED4 = 0xCFC936;
const uint32_t CMD_SPEED5 = 0xCF11EE;
const uint32_t CMD_BOOST  = 0xCFF10E;

// ==========================================
// 4. Mobile-Friendly Web Interface (HTML/CSS/JS)
// ==========================================
const char* htmlPage = R"=====(
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Malayalam Fan Remote</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #121212; color: #ffffff; text-align: center; padding: 20px; margin: 0; }
    h2 { margin-bottom: 20px; font-weight: 400; color: #bb86fc; font-size: 28px;}
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; max-width: 400px; margin: 0 auto; }
    .btn { background-color: #1f1f1f; color: white; border: 1px solid #333; padding: 20px; border-radius: 12px; font-size: 15px; font-weight: bold; cursor: pointer; transition: 0.1s; display: flex; align-items: center; justify-content: center; touch-action: manipulation; line-height: 1.3;}
    .btn:active { background-color: #333; transform: scale(0.95); }
    .btn-power { grid-column: span 2; background-color: #cf6679; color: black; border: none; font-size: 18px; padding: 25px; }
    .btn-boost { grid-column: span 2; background-color: #03dac6; color: black; border: none; font-size: 18px;}
    #toast { visibility: hidden; min-width: 250px; background-color: #bb86fc; color: #000; text-align: center; border-radius: 8px; padding: 12px; position: fixed; z-index: 1; left: 50%; bottom: 30px; transform: translateX(-50%); font-size: 15px; font-weight: bold; }
    #toast.show { visibility: visible; animation: fadein 0.3s, fadeout 0.3s 1.7s; }
    @keyframes fadein { from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;} }
    @keyframes fadeout { from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;} }
  </style>
</head>
<body>
  <h2>മണിച്ചിത്രത്താഴ് BLDC 🦇</h2>
  <div class="grid">
    <button class="btn btn-power" onclick="sendCmd('power', 'തോമസ്‌കുട്ടി വിട്ടോടാ!! 🏃')">സാധനം കയ്യിലുണ്ടോ? (Power)</button>
    <button class="btn" onclick="sendCmd('s1', 'ആഹാ! അന്തസ്സ്! 😌')">അന്തസ്സ്! (Sp 1)</button>
    <button class="btn" onclick="sendCmd('s2', 'ഒരു രക്ഷയുമില്ല... 😅')">കുറച്ചുകൂടി... (Sp 2)</button>
    <button class="btn" onclick="sendCmd('s3', 'എന്റെ അമ്മേ! കത്തി! 🔥')">പി.ടി ഉഷ (Sp 3)</button>
    <button class="btn" onclick="sendCmd('s4', 'വണ്ടിയെടുക്കെടാ വറുവേ! 🚐')">പറക്കും തളിക (Sp 4)</button>
    <button class="btn btn-boost" onclick="sendCmd('boost', 'പണ്ടേ ഞാൻ ഒരു സിംഹമാ! 🦁')">കിട്ടുന്നുണ്ട്.. നല്ലപോലെ കിട്ടുന്നുണ്ട്! (BOOST)</button>
  </div>
  <div id="toast">Command Sent</div>

  <script>
    let isCooldown = false;
    function sendCmd(action, msg) {
      if(isCooldown) return; // Prevent spam-clicking (Protects your pin!)
      
      fetch('/action?type=' + action);
      
      // UI Feedback
      const toast = document.getElementById("toast");
      toast.innerText = msg;
      toast.className = "show";
      setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 2000);

      // 1-second cooldown to protect the resistor-less LED
      isCooldown = true;
      setTimeout(() => { isCooldown = false; }, 1000);
    }
  </script>
</body>
</html>
)=====";

// ==========================================
// 5. Server Routing
// ==========================================
void setup() {
  Serial.begin(115200);
  irsend.begin();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nConnected!");
  Serial.print("Open this IP in your phone browser: http://");
  Serial.println(WiFi.localIP());

  // Serve the HTML page
  server.on("/", []() {
    server.send(200, "text/html", htmlPage);
  });

  // Handle Button Clicks from the App
  server.on("/action", []() {
    if (server.hasArg("type")) {
      String type = server.arg("type");
      Serial.println("Received Action: " + type);

      if (type == "power") irsend.sendNEC(CMD_POWER);
      else if (type == "s1") irsend.sendNEC(CMD_SPEED1);
      else if (type == "s2") irsend.sendNEC(CMD_SPEED2);
      else if (type == "s3") irsend.sendNEC(CMD_SPEED3);
      else if (type == "s4") irsend.sendNEC(CMD_SPEED4);
      else if (type == "boost") irsend.sendNEC(CMD_BOOST);
      
      // Respond to the fetch request
      server.send(200, "text/plain", "OK");
    }
  });

  server.begin();
}

void loop() {
  server.handleClient(); // Keep listening for web requests
}