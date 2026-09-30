import { h, mount } from "../dom.js";
import { fanGraphic, icon } from "../icons.js";

export function renderLogin(container, { onSignIn }) {
  const orb = fanGraphic();
  orb.classList.add("fan-graphic--hero");

  mount(
    container,
    h(
      "section",
      { class: "panel glass panel--hero" },
      h("div", { class: "fan is-spinning", style: "--spin-duration:6s" }, orb),
      h("p", { class: "eyebrow" }, "Home control"),
      h("h1", { class: "panel__title" }, "Welcome ", h("span", { class: "gradient-text" }, "home")),
      h("p", { class: "muted" }, "Your devices, from anywhere. Sign in to continue."),
      h("button", { type: "button", class: "btn btn-light", onclick: onSignIn }, icon("google"), "Continue with Google"),
    ),
  );
}
