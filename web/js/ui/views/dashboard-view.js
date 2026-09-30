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
import { icon } from "../icons.js";
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

const CLOCK_INTERVAL_MS = 10_000;

function greeting(date) {
  const hour = date.getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Time-aware greeting, live clock and device summary chips. */
function createHero(user) {
  const firstName = (user.displayName ?? "").split(" ")[0];
  const clock = h("span");
  const title = h("h1", { class: "hero__title" });
  const chips = h("div", { class: "chips" });
  const el = h("section", { class: "hero" }, h("p", { class: "eyebrow hero__eyebrow" }, icon("clock"), clock), title, chips);

  function tick() {
    const date = new Date();
    clock.textContent = date.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    title.replaceChildren(
      ...(firstName ? [`${greeting(date)}, `, h("span", { class: "gradient-text" }, firstName)] : [greeting(date)]),
    );
  }

  function setSummary(devices) {
    const online = devices.filter(isOnline).length;
    chips.replaceChildren(
      h("span", { class: `chip ${online ? "chip--live" : ""}` }, h("span", { class: "chip__dot" }), `${online} online`),
      h("span", { class: "chip" }, `${devices.length} ${devices.length === 1 ? "device" : "devices"}`),
    );
  }

  tick();
  return { el, tick, setSummary };
}

/** Renders all devices and keeps them live. Returns a dispose function. */
export function renderDashboard(container, user) {
  const cards = new Map(); // deviceId → { el, update }
  let latestDevices = [];
  const hero = createHero(user);
  const list = h("div", { class: "device-list" });
  const body = h("div", {}, h("p", { class: "muted center" }, "Loading devices…"));
  mount(container, hero.el, body);

  function render(devices) {
    latestDevices = devices;
    hero.setSummary(devices);
    if (devices.length === 0) {
      mount(body, h("div", { class: "glass empty-state" }, h("p", { class: "muted" }, "No devices yet. Power on a device to register it.")));
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
    if (list.parentNode !== body) mount(body, list);
  }

  const unsubscribe = watchDevices(render, (error) => {
    mount(body, h("p", { class: "muted center" }, `Couldn't load devices: ${error.message}`));
  });

  // Refresh time-based labels (online badge, "x min ago") between updates.
  const refreshTimer = setInterval(() => {
    for (const device of latestDevices) cards.get(device.id)?.update(device);
    hero.setSummary(latestDevices);
  }, UI_REFRESH_INTERVAL_MS);
  const clockTimer = setInterval(hero.tick, CLOCK_INTERVAL_MS);

  return () => {
    unsubscribe();
    clearInterval(refreshTimer);
    clearInterval(clockTimer);
  };
}
