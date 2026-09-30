import { h, mount } from "./dom.js";

/**
 * Header actions: optional nav (admins), avatar and sign-out.
 * @param {{ user: object|null, nav?: {label: string, href: string, active: boolean, badge?: number}[], onSignOut: () => void }} options
 */
export function renderHeader(container, { user, nav = [], onSignOut }) {
  if (!user) {
    mount(container);
    return;
  }

  mount(
    container,
    nav.length
      ? h(
          "nav",
          { class: "nav" },
          nav.map((item) =>
            h(
              "a",
              { href: item.href, class: "nav__link", "aria-current": item.active ? "page" : false },
              item.label,
              item.badge ? h("span", { class: "count" }, String(item.badge)) : null,
            ),
          ),
        )
      : null,
    user.photoURL
      ? h("img", { class: "avatar", src: user.photoURL, alt: user.displayName ?? "", referrerpolicy: "no-referrer" })
      : null,
    h("button", { type: "button", class: "btn btn-ghost", onclick: onSignOut }, "Sign out"),
  );
}
