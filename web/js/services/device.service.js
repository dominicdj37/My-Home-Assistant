import {
  onValue,
  push,
  ref,
  remove,
  serverTimestamp,
  set,
} from "firebase/database";

import { ACK_TIMEOUT_MS, ONLINE_THRESHOLD_MS } from "../config/app.config.js";
import { currentUserId } from "./auth.service.js";
import { db } from "./firebase.js";
import { serverNow } from "./server-time.js";

/**
 * @typedef {object} Device
 * @property {string} id
 * @property {{name?: string, type?: string, firmware?: string, hardware?: string, mac?: string}} info
 * @property {{lastSeen?: number, ip?: string, rssi?: number, uptimeSec?: number, freeHeap?: number}} status
 * @property {{lastAction?: string, lastActionAt?: number}} state
 */

export class CommandTimeoutError extends Error {
  constructor() {
    super("Device did not respond");
    this.name = "CommandTimeoutError";
  }
}

/**
 * Subscribes to all devices the user can see.
 * @param {(devices: Device[]) => void} onChange
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe
 */
export function watchDevices(onChange, onError) {
  return onValue(
    ref(db, "devices"),
    (snapshot) => {
      const devices = [];
      snapshot.forEach((child) => {
        const value = child.val() ?? {};
        devices.push({
          id: child.key,
          info: value.info ?? {},
          status: value.status ?? {},
          state: value.state ?? {},
        });
      });
      onChange(devices);
    },
    onError,
  );
}

/** @param {Device} device */
export function isOnline(device) {
  const lastSeen = device.status.lastSeen;
  return typeof lastSeen === "number" && serverNow() - lastSeen < ONLINE_THRESHOLD_MS;
}

/**
 * Queues a command for a device and waits for its acknowledgement.
 * Resolves with the device's result ("ok", "expired", "unknown_action",
 * "busy"). Rejects with CommandTimeoutError if the device doesn't answer, in
 * which case the command is cancelled so it can't run later by surprise.
 */
export async function sendCommand(deviceId, action) {
  const commandRef = push(ref(db, `devices/${deviceId}/commands`));
  const ack = waitForAck(deviceId, commandRef.key);

  try {
    await set(commandRef, {
      action,
      issuedAt: serverTimestamp(),
      issuedBy: currentUserId(),
    });
    return await ack.result;
  } catch (error) {
    ack.cancel();
    if (error instanceof CommandTimeoutError) {
      await remove(commandRef).catch(() => {}); // may already be consumed
    }
    throw error;
  }
}

function waitForAck(deviceId, commandId) {
  let unsubscribe = () => {};
  let timer;

  const result = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      unsubscribe();
      reject(new CommandTimeoutError());
    }, ACK_TIMEOUT_MS);

    unsubscribe = onValue(ref(db, `devices/${deviceId}/lastAck`), (snapshot) => {
      const ack = snapshot.val();
      if (ack?.id !== commandId) return;
      clearTimeout(timer);
      unsubscribe();
      resolve(ack.result);
    });
  });

  const cancel = () => {
    clearTimeout(timer);
    unsubscribe();
  };
  return { result, cancel };
}
