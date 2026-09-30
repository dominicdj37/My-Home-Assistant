# Setup guide

Order: **Firebase → web config → firmware → GitHub Pages → grant access.**
Budget about 30 minutes. Everything fits in Firebase's free Spark plan.

## 1. Firebase project

1. <https://console.firebase.google.com> → **Add project** (Analytics not needed).
2. **Build → Authentication → Get started**, then enable two sign-in providers:
   - **Google** (for people)
   - **Email/Password** (for devices)
3. **Authentication → Users → Add user** for the fan:
   - Email: `fan-1@devices.local` (never emailed; any unique address works)
   - Password: a long random one
   - Copy the new user's **User UID**.
4. **Build → Realtime Database → Create database** → pick a region → start in
   **locked mode**. Note the database URL shown at the top of the Data tab.
5. **Realtime Database → Rules**: replace everything with the contents of
   [`firebase/database.rules.json`](../firebase/database.rules.json) and **Publish**.
   (Or use the CLI: `cd firebase && npx firebase-tools login && npx firebase-tools deploy --only database --project <project-id>`.)
6. **Project settings → General → Your apps → Add app → Web (`</>`)**. Skip
   Hosting. Copy the `firebaseConfig` values.

## 2. Web app config

Edit [`web/js/config/firebase.config.js`](../web/js/config/firebase.config.js)
and replace the `YOUR_...` placeholders in `projectConfig` with the values from
step 1.6. These are safe to commit.

## 3. Firmware (NodeMCU)

### Arduino IDE

1. **File → Preferences → Sketchbook location** →
   `D:\dominic\Projects\home assistant\sketches` and restart the IDE.
   (You moved the sketchbook into this repo, so the old path no longer exists.)
2. **Board**: *NodeMCU 1.0 (ESP-12E Module)*, esp8266 core **3.1.2**
   (Boards Manager URL `https://arduino.esp8266.com/stable/package_esp8266com_index.json`).
3. **Libraries** (Library Manager), matching `sketch.yaml`:
   - IRremoteESP8266 **2.9.0** (already in `sketches/libraries`)
   - FirebaseClient by Mobizt **2.2.13**
   - ArduinoJson by Benoit Blanchon **7.4.x**

   `sketches/libraries/` is gitignored; on a new machine reinstall these.

### Secrets

`sketches/ir-fan-controller/secrets.h` already exists locally (gitignored) with
your Wi-Fi credentials. Fill in the rest:

| Constant | Value |
| --- | --- |
| `FIREBASE_API_KEY` | `apiKey` from step 1.6 |
| `FIREBASE_DATABASE_URL` | database URL from step 1.4 |
| `DEVICE_EMAIL` / `DEVICE_PASSWORD` | the device user from step 1.3 |
| `OTA_PASSWORD` | any password; needed for wireless uploads |

On a fresh clone: copy `secrets.example.h` → `secrets.h`.

### Flash and verify

1. Upload `ir-fan-controller` over USB the first time.
2. Serial Monitor at **115200** should show:
   ```
   [wifi ] connected, ip=192.168.x.x
   [ota  ] ready as fan-1.local
   [cloud] started for /devices/fan-1
   [cloud] auth: ...
   ```
3. After that, upload wirelessly: **Tools → Port → fan-1 (network)**.

The fan appears in the database under `/devices/fan-1` once authenticated.
It is only allowed to write there after step 5, so expect permission errors
until then.

**Hardware note:** the IR LED on D2 without a resistor works, but the GPIO
is overdriven and range is limited. For a sturdier build, drive the LED
through an NPN transistor (e.g. 2N2222, ~1 kΩ base resistor) with a ~33–100 Ω
series resistor from 3V3/5V.

## 4. GitHub repo + Pages

1. Create a **public** GitHub repo (free Pages requires public). Check that
   `git status` does not list `secrets.h`, then push:
   ```bash
   git add -A
   git commit -m "Initial home assistant monorepo"
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   The *Deploy web to GitHub Pages* workflow publishes `web/` to
   `https://<you>.github.io/<repo>/`. Re-run it from the Actions tab if the
   first push happened before this setting.
3. Firebase **Authentication → Settings → Authorized domains → Add domain**:
   `<you>.github.io`.

## 5. Grant access

1. Open the Pages URL and sign in with Google. You'll see
   *"Access not granted yet"* with your UID. Tap **Copy UID**.
2. Firebase **Realtime Database → Data**: hover the root, click **+**, and
   create:
   ```
   access
     users
       <your UID>: true
     devices
       fan-1: "<device UID from step 1.3>"
   ```
   (Template: [`firebase/access.example.json`](../firebase/access.example.json).
   You can also use **⋮ → Import JSON** on an empty `access` node.)
3. Reload the page. The fan card appears, and goes **Online** within a
   minute once the NodeMCU is running.

To let family members in, they sign in once, send you their UID, and you add
it under `access/users`.

---

## Local development (no real Firebase needed)

Requires Node.js and Java 21+.

```bash
# terminal 1: Auth + Database emulators with the real rules
cd firebase
npx firebase-tools emulators:start --project demo-home --only auth,database

# terminal 2: serve the web app
python -m http.server 8080 --directory web
```

Open <http://localhost:8080/?emulator>. The `?emulator` flag (localhost only)
points the app at the emulators. Sign in with the emulator's fake Google
account, then grant yourself access in the Emulator UI
(<http://127.0.0.1:4000/database>, namespace `demo-home-default-rtdb`) under
`access/users/<uid>: true`.

### Compile firmware from the command line

The Arduino IDE bundles `arduino-cli`:

```bash
"C:/Program Files/Arduino IDE/resources/app/lib/backend/resources/arduino-cli.exe" \
  compile --profile nodemcuv2 sketches/ir-fan-controller
```

CI runs the same command on every push that touches `sketches/`.
