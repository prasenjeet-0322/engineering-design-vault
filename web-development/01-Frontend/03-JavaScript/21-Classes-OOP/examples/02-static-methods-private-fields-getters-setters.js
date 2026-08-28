/**
 * KPI 21 — Part 02: Static Members, Private Fields `#`, Getters, Setters & Encapsulation
 * Demonstrates:
 * 1. Gotcha: Hard `#private` Runtime Privacy Protection
 * 2. Gotcha: Static Method Invocation via Instance (`TypeError`)
 * 3. Prediction 1: Static Shared Counter Across Instances
 * 4. Prediction 2: Validated Setter Invariant Protection
 * 5. Practical Architecture: Standalone Secure `ApiClient` with Static Factory
 */

"use strict";

console.log("=== 1. GOTCHA: HARD #PRIVATE RUNTIME BOUNDARY & ENUMERATION ===");

class SecureCredentials {
  #token; // Hard private field

  constructor(token) {
    this.#token = token;
    this.publicKey = "PUBLIC_KEY_123";
  }

  getMaskedToken() {
    return this.#token.slice(0, 4) + "****";
  }
}

const creds = new SecureCredentials("SUPER_SECRET_BEARER_TOKEN");
console.log("  Public Key:", creds.publicKey);
console.log("  Masked Token via Public Method:", creds.getMaskedToken());
console.log("  Object.keys(creds) - Private field is non-enumerable:", Object.keys(creds)); // ['publicKey']

try {
  // Attempting to evaluate private field outside class
  eval("creds.#token");
} catch (err) {
  console.log("  ✅ Private Field Access Threw (Syntax/Engine Protection):", err.name);
}

console.log("\n=== 2. GOTCHA: STATIC METHOD LOOKUP ON INSTANCE VS CONSTRUCTOR ===");

class MathService {
  static calculateRoot(n) {
    return Math.sqrt(n);
  }
}

const serviceInstance = new MathService();
try {
  serviceInstance.calculateRoot(16);
} catch (err) {
  console.log("  ✅ Instance calling static method threw:", err.name); // TypeError
}
console.log("  ✅ Constructor Static Call Succeeded:", MathService.calculateRoot(16)); // 4

console.log("\n=== 3. PREDICTION: STATIC SHARED COUNTER ===");

class AppSession {
  static sessionCount = 0;
  constructor() {
    AppSession.sessionCount++;
  }
}

new AppSession();
new AppSession();
new AppSession();
console.log("  Total App Sessions Created:", AppSession.sessionCount); // 3

console.log("\n=== 4. PREDICTION: GETTER & SETTER INVARIANT VALIDATION ===");

class BankAccount {
  #balance = 0;

  constructor(initial) {
    this.balance = initial; // Uses setter
  }

  set balance(amount) {
    if (typeof amount !== "number" || amount < 0) {
      throw new RangeError("Balance must be a positive number");
    }
    this.#balance = amount;
  }

  get balance() {
    return this.#balance;
  }
}

const account = new BankAccount(500);
console.log("  Account Initial Balance:", account.balance);
account.balance = 750;
console.log("  Updated Balance via Setter:", account.balance);

try {
  account.balance = -100;
} catch (err) {
  console.log("  ✅ Setter Invariant Violation Threw:", err.name);
}

console.log("\n=== 5. PRACTICAL ARCHITECTURE: ENCAPSULATED API CLIENT WITH FACTORY ===");

class SecureApiClient {
  #baseURL;
  #authToken;

  constructor(baseURL, authToken) {
    this.#baseURL = baseURL;
    this.#authToken = authToken;
  }

  // 🟢 Static Factory Method
  static forProduction(token) {
    return new SecureApiClient("https://api.vault.com/v1", token);
  }

  static forStaging(token) {
    return new SecureApiClient("https://staging-api.vault.com/v1", token);
  }

  async get(endpoint) {
    return this.#executeRequest(endpoint, "GET");
  }

  // 🔒 Private Internal Helper Method
  #executeRequest(endpoint, method) {
    console.log(`    🌐 [Private Request Engine]: ${method} ${this.#baseURL}${endpoint}`);
    console.log(`    🔒 [Auth Header]: Bearer ${this.#authToken.slice(0, 3)}***`);
    return { status: 200, data: `Response from ${endpoint}` };
  }
}

const client = SecureApiClient.forProduction("PROD_SECRET_TOKEN_999");
const response = client.get("/users/current");
console.log("  Client Result:", response);

console.log("\n  🎉 [Static Members, Private Fields & Encapsulation Verification Completed Successfully!]");
