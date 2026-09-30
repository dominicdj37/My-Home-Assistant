import { h } from "../../ui/dom.js";
import { formatAgo } from "../../ui/format.js";
import { fanGraphic, icon } from "../../ui/icons.js";
import { showToast } from "../../ui/toast.js";
import { BOOST, POWER, SPEEDS, findAction } from "./actions.js";

// Seconds per blade revolution in the fan animation, per last action.
const SPIN_SECONDS = { speed_1: 2.4, speed_2: 1.6, speed_3: 1.1, speed_4: 0.75, speed_5: 0.5, boost: 0.32 };

/**
 * Controls for an IR-driven fan. IR is one-way, so the fan's real state is
 * unknown; the UI reflects the last action that was *sent*.
 *
 * @param {import("../../services/device.service.js").Device} device
 * @param {{ runCommand: (deviceId: string, action: string) => Promise<boolean>,
 *           isOnline: (device: object) => boolean, now: () => number }} context
 */
export function createFanControls(device, { runCommand, isOnline, now }) {
  const buttons = [];
  let busy = false;
  let online = false;

  async function trigger(action, button) {
    if (busy) return;
    busy = true;
    button.classList.add("is-sending");
    syncDisabled();
    const ok = await runCommand(device.id, action.id);
    busy = false;
    button.classList.remove("is-sending");
    syncDisabled();
    if (ok) showToast(action.toast);
  }

  function actionButton(action, props, ...content) {
    const button = h("button", { type: "button", "aria-label": action.label, ...props }, ...content);
    button.addEventListener("click", () => trigger(action, button));
    buttons.push(button);
    return button;
  }

  function syncDisabled() {
    for (const button of buttons) button.disabled = busy || !online;
  }

  // ─── Hero: animated fan, readout, power ─────────────────────────────
  const graphic = fanGraphic();
  const value = h("div", { class: "fan__value" });
  const caption = h("div", { class: "fan__caption" });
  const meta = h("div", { class: "fan__meta" });
  const powerButton = actionButton(POWER, { class: "power-btn" }, icon("power"));

  const hero = h(
    "div",
    { class: "fan__hero" },
    graphic,
    h("div", { class: "fan__readout" }, h("div", { class: "eyebrow" }, "Last sent"), value, caption, meta),
    h("div", { class: "fan__power" }, powerButton, h("span", { class: "fan__power-caption" }, POWER.label)),
  );

  // ─── Speed meter ────────────────────────────────────────────────────
  const speedButtons = SPEEDS.map((speed) =>
    actionButton(
      speed,
      { class: "speed-step", style: `--level:${speed.level}` },
      h("span", { class: "speed-step__bar" }),
      h("span", { class: "speed-step__num" }, String(speed.level)),
    ),
  );
  const meter = h("div", { class: "speed-meter", role: "group", "aria-label": "Speed" }, speedButtons);

  // ─── Boost ──────────────────────────────────────────────────────────
  const boostButton = actionButton(
    BOOST,
    { class: "boost-btn" },
    icon("bolt"),
    h("span", { class: "boost-btn__text" }, h("span", { class: "boost-btn__label" }, BOOST.label), h("span", { class: "boost-btn__caption" }, BOOST.caption)),
  );

  const el = h("div", { class: "fan" }, hero, meter, boostButton);

  function update(nextDevice) {
    device = nextDevice;
    online = isOnline(device);
    syncDisabled();

    const { lastAction, lastActionAt } = device.state;
    const action = findAction(lastAction);
    const level = SPEEDS.find((speed) => speed.id === lastAction)?.level ?? (lastAction === BOOST.id ? SPEEDS.length : 0);

    SPEEDS.forEach((speed, i) => {
      speedButtons[i].setAttribute("aria-pressed", String(speed.id === lastAction));
      speedButtons[i].classList.toggle("is-filled", speed.level <= level);
    });
    boostButton.setAttribute("aria-pressed", String(lastAction === BOOST.id));

    const spin = SPIN_SECONDS[lastAction];
    el.classList.toggle("is-spinning", online && spin != null);
    el.classList.toggle("is-offline", !online);
    el.style.setProperty("--spin-duration", `${spin ?? 3}s`);

    if (!action) {
      value.classList.remove("fan__value--word");
      value.replaceChildren("—");
      caption.textContent = "";
      meta.textContent = online ? "Tap a control to start" : "";
      return;
    }
    const speed = SPEEDS.find((s) => s.id === action.id);
    value.classList.toggle("fan__value--word", !speed);
    value.replaceChildren(
      ...(speed ? [String(speed.level), h("span", { class: "fan__value-unit" }, "/5")] : [action.label]),
    );
    caption.textContent = action.caption ?? "";
    meta.textContent = lastActionAt ? formatAgo(lastActionAt, now()) : "";
  }

  update(device);
  return { el, update };
}
