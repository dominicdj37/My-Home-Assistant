import { h, mount } from "./dom.js";
import { icon } from "./icons.js";

/**
 * Header actions: optional nav (admins), avatar and sign-out.
 * @param {{ user: object|null,
 *           nav?: {label: string, icon: string, href: string, active: boolean, badge?: number}[],
 *           onSignOut: () => void }} options
 */
export function renderHeader(container, { user, nav = [], onSignOut }) {
  if (!user) {
    mount(container);
    return;
  }

  const initial = (user.displayName ?? user.email ?? "?").trim().charAt(0).toUpperCase();

  mount(
    container,
    nav.length
      ? h(
          "nav",
          { class: "nav glass" },
          nav.map((item) =>
            h(
              "a",
              { href: item.href, class: "nav__link", "aria-current": item.active ? "page" : false },
              icon(item.icon),
              h("span", { class: "nav__label" }, item.label),
              item.badge ? h("span", { class: "count" }, String(item.badge)) : null,
            ),
          ),
        )
      : null,
    h(
      "span",
      { class: "avatar-ring", title: user.email ?? "" },
      user.photoURL
        ? h("img", { class: "avatar", src: user.photoURL, alt: user.displayName ?? "", referrerpolicy: "no-referrer" })
        : h("span", { class: "avatar avatar--initial" }, initial),
    ),
    h("button", { type: "button", class: "icon-btn glass", onclick: onSignOut, "aria-label": "Sign out", title: "Sign out" }, icon("logout")),
  );
}
