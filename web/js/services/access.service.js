import { onValue, ref, remove, serverTimestamp, set, update } from "firebase/database";

import { db } from "./firebase.js";

// Access is granted per Google account email. Database keys can't contain
// ".", so emails are stored with "." → "," (a@b.com → a@b,com).
export function emailKey(email) {
  return email.trim().toLowerCase().replaceAll(".", ",");
}

function keyToEmail(key) {
  return key.replaceAll(",", ".");
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FORBIDDEN_KEY_CHARS = /[#$[\]/]/;

export function isValidEmail(email) {
  const trimmed = email.trim();
  return EMAIL_PATTERN.test(trimmed) && !FORBIDDEN_KEY_CHARS.test(trimmed);
}

/**
 * Live access status of the signed-in user.
 * @param {import("firebase/auth").User} user
 * @param {(status: { hasAccess: boolean, isAdmin: boolean }) => void} onChange
 * @returns {() => void} unsubscribe
 */
export function watchMyAccess(user, onChange) {
  if (!user.email || !user.emailVerified) {
    onChange({ hasAccess: false, isAdmin: false });
    return () => {};
  }

  const key = emailKey(user.email);
  let isAdmin = null;
  let isGranted = null;
  const emit = () => {
    if (isAdmin === null || isGranted === null) return; // wait for both
    onChange({ hasAccess: isAdmin || isGranted, isAdmin });
  };

  const unsubscribeAdmin = onValue(
    ref(db, `access/admins/${key}`),
    (snapshot) => { isAdmin = snapshot.val() === true; emit(); },
    () => { isAdmin = false; emit(); },
  );
  const unsubscribeGrant = onValue(
    ref(db, `access/emails/${key}`),
    (snapshot) => { isGranted = snapshot.exists(); emit(); },
    () => { isGranted = false; emit(); },
  );

  return () => {
    unsubscribeAdmin();
    unsubscribeGrant();
  };
}

// ─── Access requests (any signed-in user) ─────────────────────────────

export function watchMyRequest(uid, onChange) {
  return onValue(ref(db, `accessRequests/${uid}`), (snapshot) => onChange(snapshot.val()));
}

export function requestAccess(user) {
  return set(ref(db, `accessRequests/${user.uid}`), {
    name: (user.displayName ?? user.email).slice(0, 100),
    email: user.email,
    ...(user.photoURL ? { photoURL: user.photoURL } : {}),
    requestedAt: serverTimestamp(),
  });
}

export function cancelRequest(uid) {
  return remove(ref(db, `accessRequests/${uid}`));
}

// ─── Administration (admins only; enforced by database rules) ─────────

/**
 * @typedef {{ email: string, isAdmin: boolean, addedAt?: number, addedBy?: string }} Member
 * @param {(members: Member[]) => void} onChange
 */
export function watchMembers(onChange, onError) {
  let admins = null;
  let emails = null;
  const emit = () => {
    if (admins === null || emails === null) return;
    const members = new Map();
    for (const key of Object.keys(admins)) {
      members.set(key, { email: keyToEmail(key), isAdmin: true });
    }
    for (const [key, grant] of Object.entries(emails)) {
      if (!members.has(key)) members.set(key, { email: keyToEmail(key), isAdmin: false, ...grant });
    }
    onChange([...members.values()]);
  };

  const unsubscribeAdmins = onValue(ref(db, "access/admins"), (s) => { admins = s.val() ?? {}; emit(); }, onError);
  const unsubscribeEmails = onValue(ref(db, "access/emails"), (s) => { emails = s.val() ?? {}; emit(); }, onError);
  return () => {
    unsubscribeAdmins();
    unsubscribeEmails();
  };
}

/**
 * @typedef {{ uid: string, name: string, email: string, photoURL?: string, requestedAt: number }} AccessRequest
 * @param {(requests: AccessRequest[]) => void} onChange
 */
export function watchRequests(onChange, onError) {
  return onValue(
    ref(db, "accessRequests"),
    (snapshot) => {
      const requests = [];
      snapshot.forEach((child) => {
        requests.push({ uid: child.key, ...child.val() });
      });
      onChange(requests.sort((a, b) => a.requestedAt - b.requestedAt));
    },
    onError,
  );
}

function grantEntry(adminEmail) {
  return { addedAt: serverTimestamp(), addedBy: adminEmail };
}

export function grantEmail(email, adminEmail) {
  return set(ref(db, `access/emails/${emailKey(email)}`), grantEntry(adminEmail));
}

export function revokeEmail(email) {
  return remove(ref(db, `access/emails/${emailKey(email)}`));
}

/** Grants the requester's email and clears the request in one write. */
export function approveRequest(request, adminEmail) {
  return update(ref(db), {
    [`access/emails/${emailKey(request.email)}`]: grantEntry(adminEmail),
    [`accessRequests/${request.uid}`]: null,
  });
}

export function denyRequest(uid) {
  return remove(ref(db, `accessRequests/${uid}`));
}
