import { UI_REFRESH_INTERVAL_MS } from "../../config/app.config.js";
import { createDeviceCard } from "../../devices/device-card.js";
import {
  CommandTimeoutError,
  isOnline,
  sendCommand,
  watchDevices,
} from "../../services/device.service.js";
import { serverNow } from "../../services/server-time.js";
import { h, mount } from "../dom.js";
import { showToast } from "../toast.js";

const RESULT_MESSAGES = {
  expired: "Command expired before the device got it",
  unknown_action: "Device doesn't support that command",
  busy: "Device is busy — try again",
};

/** Sends a command and reports failures to the user. Resolves true on success. */
async function runCommand(deviceId, action) {
  try {
    const result = await sendCommand(deviceId, action);
    if (result === "ok") return true;
    showToast(RESULT_MESSAGES[result] ?? `Device replied: ${result}`, { error: true });
  } catch (error) {
    const message =
      error instanceof CommandTimeoutError
        ? "Device didn't respond — command cancelled"
        : `Couldn't send: ${error.message}`;
    showToast(message, { error: true });
  }
  return false;
}

const cardContext = { runCommand, isOnline, now: serverNow };

/** Renders all devices and keeps them live. Returns a dispose function. */
export function renderDashboard(container) {
  const cards = new Map(); // deviceId → { el, update }
  let latestDevices = [];
  const list = h("div", { class: "device-list" });
  mount(container, h("p", { class: "muted center" }, "Loading devices…"));

  function render(devices) {
    latestDevices = devices;
    if (devices.length === 0) {
      mount(container, h("p", { class: "muted center" }, "No devices yet. Power on a device to register it."));
      return;
    }

    const sorted = [...devices].sort((a, b) => (a.info.name ?? a.id).localeCompare(b.info.name ?? b.id));
    const seen = new Set();
    for (const device of sorted) {
      seen.add(device.id);
      const existing = cards.get(device.id);
      if (existing) existing.update(device);
      else cards.set(device.id, createDeviceCard(device, cardContext));
    }
    for (const id of cards.keys()) {
      if (!seen.has(id)) cards.delete(id);
    }

    list.replaceChildren(...sorted.map((device) => cards.get(device.id).el));
    if (list.parentNode !== container) mount(container, list);
  }

  const unsubscribe = watchDevices(render, (error) => {
    mount(container, h("p", { class: "muted center" }, `Couldn't load devices: ${error.message}`));
  });

  // Refresh time-based labels (online badge, "x min ago") between updates.
  const refreshTimer = setInterval(() => {
    for (const device of latestDevices) cards.get(device.id)?.update(device);
  }, UI_REFRESH_INTERVAL_MS);

  return () => {
    unsubscribe();
    clearInterval(refreshTimer);
  };
}
