import { isFirebaseConfigured } from "./config/firebase.config.js";
import { renderSetupRequired } from "./ui/views/setup-view.js";

const container = document.getElementById("app");

// Firebase is only loaded once configured, so a fresh clone shows setup
// instructions instead of crashing on placeholder values.
if (isFirebaseConfigured) {
  const { startApp } = await import("./app.js");
  startApp(container);
} else {
  renderSetupRequired(container);
}
