# ir-fan-controller

NodeMCU v3 (ESP-12E / ESP8266MOD, CH340C) firmware that receives commands
from Firebase and replays Atomberg BLDC fan remote codes over IR.

| | |
| --- | --- |
| Board | NodeMCU 1.0 (ESP-12E Module), esp8266 core 3.1.2 |
| IR LED | D2 (GPIO4) → LED → GND |
| Libraries | IRremoteESP8266 2.9.0, FirebaseClient 2.2.13, ArduinoJson 7.4.x (pinned in `sketch.yaml`) |
| Serial | 115200 baud |
| OTA | network port `fan-1`, password from `secrets.h` |

Setup: [docs/SETUP.md](../../docs/SETUP.md#3-firmware-nodemcu).
Design and command protocol: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md).

## Changing things

- **Rename / add a second fan**: change `DEVICE_ID` + `HOSTNAME` in `config.h`,
  create a matching auth user and `/access/devices/<id>` entry.
- **New IR codes**: add to `kCodes` in `src/devices/IrFan.cpp` and to
  `web/js/devices/ir-fan/actions.js` (same action name).
- **Capture codes from a remote**: use the `IRrecvDumpV2` example from
  IRremoteESP8266 with an IR receiver (e.g. TSOP38238) on a spare pin.
