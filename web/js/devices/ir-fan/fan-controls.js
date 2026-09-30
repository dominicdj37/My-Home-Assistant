import { h } from "../../ui/dom.js";
import { formatAgo } from "../../ui/format.js";
import { showToast } from "../../ui/toast.js";
import { BOOST, POWER, SPEEDS, findAction } from "./actions.js";

/**
 * Controls for an IR-driven fan. IR is one-way, so the fan's real state is
 * unknown; the UI only highlights the last speed that was *sent*.
 *
 * @param {import("../../services/device.service.js").Device} device
 * @param {{ runCommand: (deviceId: string, action: string) => Promise<boolean>,
 *           isOnline: (device: object) => boolean, now: () => number }} context
 */
export function createFanControls(device, { runCommand, isOnline, now }) {
  const buttons = [];
  let busy = false;
  let online = false;

  async function trigger(action) {
    if (busy) return;
    busy = true;
    syncDisabled();
    const ok = await runCommand(device.id, action.id);
    busy = false;
    syncDisabled();
    if (ok) showToast(action.toast);
  }

  function actionButton(action, className, ...content) {
    const button = h(
      "button",
      { type: "button", class: `btn ${className}`, "aria-label": action.label, onclick: () => trigger(action) },
      ...content,
    );
    buttons.push(button);
    return button;
  }

  function syncDisabled() {
    for (const button of buttons) button.disabled = busy || !online;
  }

  const speedButtons = SPEEDS.map((speed) => actionButton(speed, "", String(speed.level)));
  const lastSent = h("p", { class: "speed-caption muted" });

  const el = h(
    "div",
    { class: "fan-controls" },
    actionButton(POWER, "btn-power", POWER.label, h("span", { class: "btn-caption" }, POWER.caption)),
    h("div", { class: "speed-row", role: "group", "aria-label": "Speed" }, speedButtons),
    lastSent,
    actionButton(BOOST, "btn-boost", BOOST.label, h("span", { class: "btn-caption" }, BOOST.caption)),
  );

  function update(nextDevice) {
    device = nextDevice;
    online = isOnline(device);
    syncDisabled();

    const { lastAction, lastActionAt } = device.state;
    SPEEDS.forEach((speed, i) => speedButtons[i].setAttribute("aria-pressed", String(speed.id === lastAction)));

    const action = findAction(lastAction);
    lastSent.textContent = action
      ? `Last sent: ${action.label}${action.caption ? ` · ${action.caption}` : ""}` +
        (lastActionAt ? ` · ${formatAgo(lastActionAt, now())}` : "")
      : "";
  }

  update(device);
  return { el, update };
}
