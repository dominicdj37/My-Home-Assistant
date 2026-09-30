import { h, mount } from "../dom.js";
import { icon } from "../icons.js";

/** Shown until web/js/config/firebase.config.js has real values. */
export function renderSetupRequired(container) {
  mount(
    container,
    h(
      "section",
      { class: "panel glass" },
      h("span", { class: "panel__badge" }, icon("alert")),
      h("h1", { class: "panel__title" }, "Firebase not configured"),
      h("p", { class: "muted" }, "Fill in your project's web config in:"),
      h("code", { class: "code" }, "web/js/config/firebase.config.js"),
      h("p", { class: "muted" }, "Step-by-step guide: docs/SETUP.md"),
    ),
  );
}
