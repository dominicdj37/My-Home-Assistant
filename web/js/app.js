import { hasAccess, onUserChanged, signInWithGoogle, signOut } from "./services/auth.service.js";
import { h, mount } from "./ui/dom.js";
import { renderHeader } from "./ui/header.js";
import { showToast } from "./ui/toast.js";
import { renderDashboard } from "./ui/views/dashboard-view.js";
import { renderLogin } from "./ui/views/login-view.js";
import { renderNoAccess } from "./ui/views/no-access-view.js";

const IGNORED_SIGN_IN_ERRORS = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);

async function handleSignIn() {
  try {
    await signInWithGoogle();
  } catch (error) {
    if (!IGNORED_SIGN_IN_ERRORS.has(error.code)) showToast(`Sign-in failed: ${error.message}`, { error: true });
  }
}

/** Routes between login, no-access and dashboard views based on auth state. */
export function startApp(container) {
  const headerActions = document.getElementById("header-actions");
  let disposeView = () => {};
  let generation = 0;

  onUserChanged(async (user) => {
    const current = ++generation;
    disposeView();
    disposeView = () => {};
    renderHeader(headerActions, user, { onSignOut: signOut });

    if (!user) {
      renderLogin(container, { onSignIn: handleSignIn });
      return;
    }

    try {
      const allowed = await hasAccess(user.uid);
      if (current !== generation) return; // user changed while checking
      if (allowed) disposeView = renderDashboard(container);
      else renderNoAccess(container, user.uid);
    } catch (error) {
      mount(container, h("p", { class: "muted center" }, `Couldn't check access: ${error.message}`));
    }
  });
}
