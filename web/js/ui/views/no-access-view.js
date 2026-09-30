import { cancelRequest, requestAccess, watchMyRequest } from "../../services/access.service.js";
import { serverNow } from "../../services/server-time.js";
import { h, mount } from "../dom.js";
import { formatAgo } from "../format.js";
import { showToast } from "../toast.js";

/**
 * Signed in, but the account's email hasn't been granted access. The user
 * can send a request; the view switches to the dashboard by itself once an
 * admin approves (the app watches access live).
 */
export function renderNoAccess(container, user) {
  const status = h("div");
  mount(
    container,
    h(
      "section",
      { class: "panel" },
      h("h2", {}, "Access not granted yet"),
      h("p", { class: "muted" }, "Signed in as ", h("strong", {}, user.email ?? "unknown")),
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
        h("p", { class: "muted" }, `Request sent ${formatAgo(request.requestedAt, serverNow())}. This page opens automatically once the admin approves.`),
        h("button", { type: "button", class: "btn", onclick: () => run(() => cancelRequest(user.uid), "Couldn't cancel") }, "Cancel request"),
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
