/**
 * Helper leaf module for decoupling circular dependencies between auth services and HTTP clients
 */

let activeToken = "JWT_SECURE_VAULT_TOKEN_777";

export function getAuthToken() {
  return activeToken;
}

export function setAuthToken(token) {
  activeToken = token;
}
