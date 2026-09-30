// IR fan actions. `id` is the wire contract with the firmware
// (sketches/ir-fan-controller/src/devices/IrFan.cpp) — keep them in sync.

export const POWER = {
  id: "power",
  label: "Power",
  caption: "സാധനം കയ്യിലുണ്ടോ?",
  toast: "തോമസ്‌കുട്ടി വിട്ടോടാ!! 🏃",
};

export const BOOST = {
  id: "boost",
  label: "Boost",
  caption: "കിട്ടുന്നുണ്ട്.. നല്ലപോലെ കിട്ടുന്നുണ്ട്!",
  toast: "പണ്ടേ ഞാൻ ഒരു സിംഹമാ! 🦁",
};

export const SPEEDS = [
  { id: "speed_1", level: 1, caption: "അന്തസ്സ്!", toast: "ആഹാ! അന്തസ്സ്! 😌" },
  { id: "speed_2", level: 2, caption: "കുറച്ചുകൂടി...", toast: "ഒരു രക്ഷയുമില്ല... 😅" },
  { id: "speed_3", level: 3, caption: "പി.ടി ഉഷ", toast: "എന്റെ അമ്മേ! കത്തി! 🔥" },
  { id: "speed_4", level: 4, caption: "പറക്കും തളിക", toast: "വണ്ടിയെടുക്കെടാ വറുവേ! 🚐" },
  { id: "speed_5", level: 5, caption: "റോക്കറ്റ്", toast: "റോക്കറ്റ് വിട്ടു! 🚀" },
].map((speed) => ({ ...speed, label: `Speed ${speed.level}` }));

const ALL_ACTIONS = [POWER, ...SPEEDS, BOOST];

export function findAction(id) {
  return ALL_ACTIONS.find((action) => action.id === id);
}
