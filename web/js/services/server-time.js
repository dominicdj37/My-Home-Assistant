import { onValue, ref } from "firebase/database";

import { db } from "./firebase.js";

// Offset between this device's clock and Firebase server time, so "online"
// checks against server-written timestamps work even if the phone clock is off.
let offsetMs = 0;

onValue(ref(db, ".info/serverTimeOffset"), (snapshot) => {
  offsetMs = snapshot.val() ?? 0;
});

export function serverNow() {
  return Date.now() + offsetMs;
}
