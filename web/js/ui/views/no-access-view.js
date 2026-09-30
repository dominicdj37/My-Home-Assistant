import { h, mount } from "../dom.js";
import { showToast } from "../toast.js";

/** Signed in, but not yet listed under /access/users in the database. */
export function renderNoAccess(container, uid) {
  const copy = async () => {
    await navigator.clipboard.writeText(uid);
    showToast("UID copied");
  };

  mount(
    container,
    h(
      "section",
      { class: "panel" },
      h("h2", {}, "Access not granted yet"),
      h("p", { class: "muted" }, "Add this user ID under access/users in the Realtime Database (value: true), then reload."),
      h("code", { class: "code" }, uid),
      h("button", { type: "button", class: "btn", onclick: copy }, "Copy UID"),
    ),
  );
}
