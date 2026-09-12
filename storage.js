// Stand-in for the Claude-artifact-only `window.storage` API, so this app
// works as a normal installed app. Uses the device's local storage, which
// means data stays ON THIS DEVICE ONLY.
//
// IMPORTANT: for the customer app and owner app to sync across two
// different phones, replace this file with calls to a real backend
// (e.g. Firebase Firestore, or your own REST API). Everywhere else in
// App.jsx only ever calls storageGet/storageSet, so swapping this one
// file is all that's needed to plug in a real backend later.

export async function storageGet(key) {
  const v = localStorage.getItem(key);
  if (v === null) throw new Error("not found");
  return { value: v };
}

export async function storageSet(key, value) {
  localStorage.setItem(key, value);
  return { value };
}
