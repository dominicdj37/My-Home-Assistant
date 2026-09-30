import { h, mount } from "../dom.js";

export function renderLogin(container, { onSignIn }) {
  mount(
    container,
    h(
      "section",
      { class: "panel" },
      h("h2", {}, "Welcome home"),
      h("p", { class: "muted" }, "Sign in to control your devices."),
      h("button", { type: "button", class: "btn btn-primary", onclick: onSignIn }, "Sign in with Google"),
    ),
  );
}
