import { watchMyAccess, watchRequests } from "./services/access.service.js";
import { onUserChanged, signInWithGoogle, signOut } from "./services/auth.service.js";
import { h, mount } from "./ui/dom.js";
import { renderHeader } from "./ui/header.js";
import { showToast } from "./ui/toast.js";
import { renderDashboard } from "./ui/views/dashboard-view.js";
import { renderLogin } from "./ui/views/login-view.js";
import { renderNoAccess } from "./ui/views/no-access-view.js";
import { renderPeople } from "./ui/views/people-view.js";

const IGNORED_SIGN_IN_ERRORS = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request"]);
const PEOPLE_ROUTE = "#/people";

async function handleSignIn() {
  try {
    await signInWithGoogle();
  } catch (error) {
    if (!IGNORED_SIGN_IN_ERRORS.has(error.code)) showToast(`Sign-in failed: ${error.message}`, { error: true });
  }
}

/** Switches between login and a signed-in session as auth state changes. */
export function startApp(container) {
  const headerActions = document.getElementById("header-actions");
  let disposeSession = () => {};

  onUserChanged((user) => {
    disposeSession();
    disposeSession = () => {};

    if (user) {
      disposeSession = startSession(container, headerActions, user);
    } else {
      renderHeader(headerActions, { user: null, onSignOut: signOut });
      renderLogin(container, { onSignIn: handleSignIn });
    }
  });
}

/**
 * A signed-in session. Access is watched live, so approving, granting or
 * revoking someone takes effect on their screen immediately.
 * Routes: "#/" devices, "#/people" admin screen.
 */
function startSession(container, headerActions, user) {
  let access = null; // { hasAccess, isAdmin } once known
  let pendingRequests = 0;
  let currentView = null;
  let disposeView = () => {};
  let unsubscribeRequests = () => {};

  function resolveView() {
    if (!access) return "loading";
    if (!access.hasAccess) return "no-access";
    return access.isAdmin && location.hash === PEOPLE_ROUTE ? "people" : "devices";
  }

  function renderNav() {
    const nav = access?.isAdmin
      ? [
          { label: "Devices", icon: "grid", href: "#/", active: currentView === "devices" },
          { label: "People", icon: "users", href: PEOPLE_ROUTE, active: currentView === "people", badge: pendingRequests },
        ]
      : [];
    renderHeader(headerActions, { user, nav, onSignOut: signOut });
  }

  function route() {
    const view = resolveView();
    if (view !== currentView) {
      disposeView();
      currentView = view;
      disposeView = mountView(view) ?? (() => {});
    }
    renderNav();
  }

  function mountView(view) {
    switch (view) {
      case "no-access": return renderNoAccess(container, user);
      case "people": return renderPeople(container, user);
      case "devices": return renderDashboard(container, user);
      default: mount(container, h("p", { class: "muted center" }, "Checking access…"));
    }
  }

  const unsubscribeAccess = watchMyAccess(user, (next) => {
    const becameAdmin = next.isAdmin && !access?.isAdmin;
    const lostAdmin = !next.isAdmin && access?.isAdmin;
    access = next;

    if (becameAdmin) {
      unsubscribeRequests = watchRequests((requests) => {
        pendingRequests = requests.length;
        renderNav();
      }, () => {});
    } else if (lostAdmin) {
      unsubscribeRequests();
      unsubscribeRequests = () => {};
      pendingRequests = 0;
    }
    route();
  });

  window.addEventListener("hashchange", route);
  route();

  return () => {
    window.removeEventListener("hashchange", route);
    unsubscribeAccess();
    unsubscribeRequests();
    disposeView();
  };
}
