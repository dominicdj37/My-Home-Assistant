// IR fan actions. `id` is the wire contract with the firmware
// (sketches/ir-fan-controller/src/devices/IrFan.cpp) — keep them in sync.

export const POWER = {
  id: "power",
  label: "Power",
  toast: "Power toggled",
};

export const BOOST = {
  id: "boost",
  label: "Boost",
  caption: "Maximum airflow",
  toast: "Boost on",
};

const SPEED_NAMES = ["Low", "Medium-low", "Medium", "High", "Very high"];

export const SPEEDS = SPEED_NAMES.map((caption, i) => ({
  id: `speed_${i + 1}`,
  level: i + 1,
  label: `Speed ${i + 1}`,
  caption,
  toast: `Speed ${i + 1} set`,
}));

const ALL_ACTIONS = [POWER, ...SPEEDS, BOOST];

export function findAction(id) {
  return ALL_ACTIONS.find((action) => action.id === id);
}
