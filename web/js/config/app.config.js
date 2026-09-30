// A device counts as online if its last heartbeat is newer than this.
// Devices send one every 60 s, so this tolerates one missed beat.
export const ONLINE_THRESHOLD_MS = 150_000;

// How long to wait for a device to acknowledge a command before giving up
// and cancelling it (so it can't fire unexpectedly later).
export const ACK_TIMEOUT_MS = 8_000;

// How often time-based labels ("2 min ago", online badge) refresh.
export const UI_REFRESH_INTERVAL_MS = 15_000;
