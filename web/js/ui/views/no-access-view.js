import { cancelRequest, requestAccess, watchMyRequest } from "../../services/access.service.js";
import { serverNow } from "../../services/server-time.js";
import { h, mount } from "../dom.js";
import { formatAgo } from "../format.js";
import { icon } from "../icons.js";
import { showToast } from "../toast.js";

/**
 * Signed in, but the account's email hasn't been granted access. The user
 * can send a request; the view switches to the dashboard by itself once an
 * admin approves (the app watches access live).
 */
export function renderNoAccess(container, user) {
  const status = h("div", { class: "panel__status" });
  mount(
    container,
    h(
      "section",
      { class: "panel glass" },
      h("span", { class: "panel__badge" }, icon("lock")),
      h("h1", { class: "panel__title" }, "Access not granted yet"),
      h("p", { class: "muted" }, "Signed in as ", h("strong", { class: "text-strong" }, user.email ?? "unknown")),
      status,
    ),
  );

  async function run(action, errorPrefix) {
    try {
      await action();
    } catch (error) {
      showToast(`${errorPrefix}: ${error.message}`, { error: true });
    }
  }

  return watchMyRequest(user.uid, (request) => {
    if (request) {
      mount(
        status,
        h("p", { class: "pending" }, h("span", { class: "pending__pulse" }), `Request sent ${formatAgo(request.requestedAt, serverNow())}`),
        h("p", { class: "muted small" }, "This page opens automatically once the admin approves."),
        h("button", { type: "button", class: "btn btn-ghost", onclick: () => run(() => cancelRequest(user.uid), "Couldn't cancel") }, "Cancel request"),
      );
    } else {
      mount(
        status,
        h("p", { class: "muted" }, "Ask the admin to add your email, or send a request."),
        h("button", { type: "button", class: "btn btn-primary", onclick: () => run(() => requestAccess(user), "Couldn't send request") }, "Request access"),
      );
    }
  });
}
