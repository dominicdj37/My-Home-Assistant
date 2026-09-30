import { h } from "./dom.js";
import { icon } from "./icons.js";

const DISPLAY_MS = 2200;

let hideTimer;

/** Shows a short message at the bottom of the screen. */
export function showToast(message, { error = false } = {}) {
  const toast = document.getElementById("toast");
  toast.replaceChildren(
    h("span", { class: "toast__icon" }, icon(error ? "alert" : "check")),
    h("span", { class: "toast__text" }, message),
  );
  toast.classList.toggle("toast--error", error);
  toast.classList.add("toast--visible");

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => toast.classList.remove("toast--visible"), DISPLAY_MS);
}
