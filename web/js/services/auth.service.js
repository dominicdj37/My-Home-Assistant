import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { get, ref } from "firebase/database";

import { auth, db } from "./firebase.js";

export function onUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOut() {
  return firebaseSignOut(auth);
}

export function currentUserId() {
  return auth.currentUser?.uid ?? null;
}

/** True if an admin has added this user under /access/users in the database. */
export async function hasAccess(uid) {
  const snapshot = await get(ref(db, `access/users/${uid}`));
  return snapshot.val() === true;
}
