import { createFanControls } from "./ir-fan/fan-controls.js";

// Maps a device's info.type (set in its firmware) to the UI controls that
// drive it. To support a new kind of device, add a folder next to ir-fan/
// and register its factory here.
const CONTROLS_BY_TYPE = {
  ir_fan: createFanControls,
};

/** Returns `{ el, update(device) }`, or null for unknown device types. */
export function createControls(device, context) {
  const factory = CONTROLS_BY_TYPE[device.info.type];
  return factory ? factory(device, context) : null;
}
