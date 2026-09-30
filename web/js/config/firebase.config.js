// Firebase web app config: Firebase console → Project settings → General →
// Your apps → Web app → SDK setup and configuration → Config.
//
// These values identify the project; they are not secrets and are safe to
// commit. Access is enforced by Authentication + firebase/database.rules.json.
const projectConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
};

// Local development against the Firebase emulators (see docs/SETUP.md):
// open http://localhost:<port>/?emulator
export const useEmulators =
  ["localhost", "127.0.0.1"].includes(location.hostname) &&
  new URLSearchParams(location.search).has("emulator");

const emulatorConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-home.firebaseapp.com",
  databaseURL: "http://127.0.0.1:9000?ns=demo-home-default-rtdb",
  projectId: "demo-home",
  appId: "demo-app",
};

export const firebaseConfig = useEmulators ? emulatorConfig : projectConfig;

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => !value.includes("YOUR_"),
);
