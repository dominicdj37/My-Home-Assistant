const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

const UNITS = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "just now", "5 minutes ago", "yesterday"… */
export function formatAgo(timestampMs, nowMs) {
  const elapsed = nowMs - timestampMs;
  for (const [unit, size] of UNITS) {
    if (elapsed >= size) return relativeTime.format(-Math.floor(elapsed / size), unit);
  }
  return "just now";
}

export function formatDuration(totalSeconds) {
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
