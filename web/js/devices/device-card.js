import { h } from "../ui/dom.js";
import { formatAgo, formatDuration } from "../ui/format.js";
import { createControls } from "./registry.js";

/**
 * Card shell shared by every device type: name, online badge, details.
 * The type-specific controls come from the registry.
 */
export function createDeviceCard(device, context) {
  const controls = createControls(device, context);

  const name = h("h2", { class: "device-card__name" });
  const badge = h("span", { class: "badge" });
  const details = h("dl");

  const el = h(
    "article",
    { class: "device-card" },
    h("div", { class: "device-card__header" }, name, badge),
    controls?.el ?? h("p", { class: "muted" }, `Unsupported device type "${device.info.type ?? "unknown"}".`),
    h("details", { class: "device-card__details" }, h("summary", {}, "Details"), details),
  );

  function update(nextDevice) {
    device = nextDevice;
    const { info, status } = device;
    const online = context.isOnline(device);

    name.textContent = info.name ?? device.id;

    badge.classList.toggle("badge--online", online);
    badge.textContent = online
      ? "Online"
      : status.lastSeen
        ? `Offline · ${formatAgo(status.lastSeen, context.now())}`
        : "Never connected";

    details.replaceChildren(
      ...detailRows({
        "Device ID": device.id,
        "IP address": status.ip,
        "Wi-Fi signal": status.rssi != null ? `${status.rssi} dBm` : null,
        Uptime: status.uptimeSec != null ? formatDuration(status.uptimeSec) : null,
        "Free memory": status.freeHeap != null ? `${Math.round(status.freeHeap / 1024)} KB` : null,
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
    .flatMap(([label, value]) => [h("dt", {}, label), h("dd", {}, String(value))]);
}
