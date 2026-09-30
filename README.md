# Home Assistant (self-hosted)

A personal home-automation monorepo. It starts with one device, an IR
remote for an Atomberg BLDC fan built on a NodeMCU, and is laid out to grow
into more devices, native apps and eventually a local Home Assistant server.

```
 Phone / browser                  Firebase                         NodeMCU (ESP8266)
┌──────────────────┐        ┌─────────────────────┐          ┌──────────────────────┐
│ GitHub Pages     │ writes │ Realtime Database   │  stream  │ ir-fan-controller    │  IR   ┌─────┐
│ web dashboard    ├───────►│ /devices/fan-1/...  ├─────────►│ firmware             ├──────►│ Fan │
│ (static, no URL  │◄───────┤ + Authentication    │◄─────────┤                      │       └─────┘
│  hunting)        │  live  │ + security rules    │ ack/beat │                      │
└──────────────────┘        └─────────────────────┘          └──────────────────────┘
```

No more hunting for the device's IP address. The dashboard lives at a fixed
GitHub Pages URL and reaches the device through Firebase from any network.

## Repository layout

| Path | What it is |
| --- | --- |
| `web/` | Static dashboard (vanilla JS modules, no build step), deployed to GitHub Pages |
| `sketches/` | Arduino sketchbook: one folder per device firmware |
| `sketches/ir-fan-controller/` | NodeMCU firmware: Firebase → IR fan remote |
| `sketches/remote/` | Legacy local-web-server sketch (kept for reference) |
| `firebase/` | Database security rules + emulator config (rules as code) |
| `docs/` | [Architecture](docs/ARCHITECTURE.md) and [setup guide](docs/SETUP.md) |
| `.github/workflows/` | Pages deploy (`web/` only) and firmware compile CI |

Future apps (Flutter for Android/iOS) go in `apps/` and use the same
database contract. See [Roadmap](docs/ARCHITECTURE.md#roadmap).

### One repo, many projects, and GitHub Pages

That's fine here. Pages is deployed by a GitHub Actions workflow that
uploads **only** `web/`, so firmware, docs and rules are never served, and
other folders can grow freely. Free GitHub Pages requires a **public** repo,
so no secrets are ever committed. Firmware secrets live in the gitignored
`secrets.h`, and the Firebase web config is public by design (access is
enforced by auth and rules).

## Getting started

Follow **[docs/SETUP.md](docs/SETUP.md)**: create the Firebase project, flash
the NodeMCU, enable GitHub Pages. You can develop the web app locally against
the Firebase emulators before the real project exists.
