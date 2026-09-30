import { h } from "../ui/dom.js";
import { formatAgo, formatDuration } from "../ui/format.js";
import { icon } from "../ui/icons.js";
import { createControls } from "./registry.js";

/**
 * Card shell shared by every device type: name, live status, details.
 * The type-specific controls come from the registry.
 */
export function createDeviceCard(device, context) {
  const controls = createControls(device, context);

  const name = h("h2", { class: "device-card__name" });
  const status = h("span", { class: "status-chip" });
  const details = h("dl", { class: "details-grid" });

  const el = h(
    "article",
    { class: "device-card glass" },
    h("header", { class: "device-card__header" }, name, status),
    controls?.el ?? h("p", { class: "muted" }, `Unsupported device type "${device.info.type ?? "unknown"}".`),
    h("details", { class: "device-card__details" }, h("summary", {}, icon("wifi"), "Device details"), details),
  );

  function update(nextDevice) {
    device = nextDevice;
    const { info, status: health } = device;
    const online = context.isOnline(device);

    name.textContent = info.name ?? device.id;

    el.classList.toggle("is-online", online);
    status.classList.toggle("status-chip--online", online);
    status.textContent = online
      ? "Online"
      : health.lastSeen
        ? `Offline · ${formatAgo(health.lastSeen, context.now())}`
        : "Never connected";

    details.replaceChildren(
      ...detailRows({
        "Device ID": device.id,
        "IP address": health.ip,
        "Wi-Fi signal": health.rssi != null ? `${health.rssi} dBm` : null,
        Uptime: health.uptimeSec != null ? formatDuration(health.uptimeSec) : null,
        "Free memory": health.freeHeap != null ? `${Math.round(health.freeHeap / 1024)} KB` : null,
        Firmware: info.firmware,
        Hardware: info.hardware,
        MAC: info.mac,
      }),
    );

    controls?.update(device);
  }

  update(device);
  return { el, update };
}

function detailRows(entries) {
  return Object.entries(entries)
    .filter(([, value]) => value != null)
    .map(([label, value]) => h("div", { class: "details-grid__item" }, h("dt", {}, label), h("dd", {}, String(value))));
}
