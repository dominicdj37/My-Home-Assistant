import {
  approveRequest,
  denyRequest,
  grantEmail,
  isValidEmail,
  revokeEmail,
  watchMembers,
  watchRequests,
} from "../../services/access.service.js";
import { serverNow } from "../../services/server-time.js";
import { h, mount } from "../dom.js";
import { formatAgo } from "../format.js";
import { showToast } from "../toast.js";

const CONFIRM_WINDOW_MS = 3000;

/** Admin screen: grant by email, handle requests, revoke access. */
export function renderPeople(container, admin) {
  let members = [];

  const input = h("input", {
    type: "email",
    class: "input",
    placeholder: "name@gmail.com",
    autocomplete: "off",
    autocapitalize: "none",
    "aria-label": "Email address",
    required: true,
  });
  const addForm = h(
    "form",
    { class: "form-row", onsubmit: (event) => { event.preventDefault(); addEmail(); } },
    input,
    h("button", { type: "submit", class: "btn btn-primary" }, "Add"),
  );

  const requestsSection = h("section", { class: "section" });
  const membersSection = h("section", { class: "section" });

  mount(
    container,
    h(
      "section",
      { class: "section" },
      h("h2", { class: "section__title" }, "Give access"),
      h("p", { class: "muted section__hint" }, "Anyone signing in with Google using this email gets access."),
      addForm,
    ),
    requestsSection,
    membersSection,
  );

  async function run(action, success, errorPrefix) {
    try {
      await action();
      if (success) showToast(success);
      return true;
    } catch (error) {
      showToast(`${errorPrefix}: ${error.message}`, { error: true });
      return false;
    }
  }

  async function addEmail() {
    const email = input.value.trim().toLowerCase();
    if (!isValidEmail(email)) {
      showToast("Enter a valid email address", { error: true });
      return;
    }
    if (members.some((member) => member.email === email)) {
      showToast(`${email} already has access`);
      return;
    }
    if (await run(() => grantEmail(email, admin.email), `Access granted to ${email}`, "Couldn't add")) {
      input.value = "";
    }
  }

  function renderRequests(requests) {
    if (requests.length === 0) {
      mount(requestsSection);
      return;
    }
    mount(
      requestsSection,
      h("h2", { class: "section__title" }, `Requests (${requests.length})`),
      h(
        "ul",
        { class: "list" },
        requests.map((request) =>
          listRow({
            photoURL: request.photoURL,
            title: request.name,
            meta: `${request.email} · ${formatAgo(request.requestedAt, serverNow())}`,
            actions: [
              h("button", {
                type: "button",
                class: "btn btn-sm btn-primary",
                onclick: () => run(() => approveRequest(request, admin.email), `Approved ${request.email}`, "Couldn't approve"),
              }, "Approve"),
              h("button", {
                type: "button",
                class: "btn btn-sm",
                onclick: () => run(() => denyRequest(request.uid), "Request declined", "Couldn't decline"),
              }, "Deny"),
            ],
          }),
        ),
      ),
    );
  }

  function renderMembers() {
    const sorted = [...members].sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin) || a.email.localeCompare(b.email));
    mount(
      membersSection,
      h("h2", { class: "section__title" }, `People with access (${sorted.length})`),
      h(
        "ul",
        { class: "list" },
        sorted.map((member) =>
          listRow({
            title: member.email,
            meta: member.isAdmin
              ? "Admin"
              : member.addedAt
                ? `Added ${formatAgo(member.addedAt, serverNow())}${member.addedBy ? ` by ${member.addedBy}` : ""}`
                : "",
            actions: member.isAdmin
              ? []
              : [confirmButton("Revoke", "Tap to confirm", () =>
                  run(() => revokeEmail(member.email), `Revoked ${member.email}`, "Couldn't revoke"))],
          }),
        ),
      ),
    );
  }

  const showError = (error) => showToast(`Couldn't load: ${error.message}`, { error: true });
  const unsubscribeMembers = watchMembers((next) => { members = next; renderMembers(); }, showError);
  const unsubscribeRequests = watchRequests(renderRequests, showError);

  return () => {
    unsubscribeMembers();
    unsubscribeRequests();
  };
}

function listRow({ photoURL, title, meta, actions }) {
  return h(
    "li",
    { class: "list-row" },
    photoURL ? h("img", { class: "avatar", src: photoURL, alt: "", referrerpolicy: "no-referrer" }) : null,
    h("div", { class: "list-row__main" }, h("div", { class: "list-row__title" }, title), meta ? h("div", { class: "list-row__meta muted" }, meta) : null),
    h("div", { class: "list-row__actions" }, actions),
  );
}

/** Destructive button that needs a second tap within a few seconds. */
function confirmButton(label, confirmLabel, onConfirm) {
  let armedTimer = null;
  const button = h("button", {
    type: "button",
    class: "btn btn-sm",
    onclick: () => {
      if (armedTimer) {
        clearTimeout(armedTimer);
        armedTimer = null;
        button.disabled = true;
        onConfirm();
        return;
      }
      button.textContent = confirmLabel;
      button.classList.add("btn-danger");
      armedTimer = setTimeout(() => {
        armedTimer = null;
        button.textContent = label;
        button.classList.remove("btn-danger");
      }, CONFIRM_WINDOW_MS);
    },
  }, label);
  return button;
}
