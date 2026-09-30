import { h, mount } from "./dom.js";

/** Shows the signed-in user's avatar and a sign-out button. */
export function renderHeader(container, user, { onSignOut }) {
  if (!user) {
    mount(container);
    return;
  }

  mount(
    container,
    user.photoURL
      ? h("img", { class: "avatar", src: user.photoURL, alt: user.displayName ?? "", referrerpolicy: "no-referrer" })
      : null,
    h("button", { type: "button", class: "btn btn-ghost", onclick: onSignOut }, "Sign out"),
  );
}
