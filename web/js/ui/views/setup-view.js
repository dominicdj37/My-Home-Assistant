import { h, mount } from "../dom.js";

/** Shown until web/js/config/firebase.config.js has real values. */
export function renderSetupRequired(container) {
  mount(
    container,
    h(
      "section",
      { class: "panel" },
      h("h2", {}, "Firebase not configured"),
      h("p", { class: "muted" }, "Fill in your project's web config in:"),
      h("code", { class: "code" }, "web/js/config/firebase.config.js"),
      h("p", { class: "muted" }, "Step-by-step guide: docs/SETUP.md"),
    ),
  );
}
