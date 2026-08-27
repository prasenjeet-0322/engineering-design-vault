/**
 * Helper module for demonstrating ESM Live Bindings and Private Scope
 */

// Private internal variable (not exported)
const privateSecret = "INTERNAL_ENCRYPTION_KEY_99";

// Live binding export
export let activeCount = 0;

export function incrementCount() {
  activeCount += 5;
}

export function resetCount() {
  activeCount = 0;
}

export function getSecretLength() {
  return privateSecret.length;
}
