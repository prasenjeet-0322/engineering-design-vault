/**
 * KPI 07 — Part 06: Composition vs Inheritance & Production Architecture
 * Demonstrates:
 * 1. Object Spread Composition and Property Collisions
 * 2. Dependency Injection vs Artificial Class Inheritance
 * 3. Custom Error Hierarchy via Shallow Inheritance (extends Error)
 * 4. Factory Functions with Closure Encapsulation
 */

"use strict";

console.log("=== 1. PREDICTION 1: PROPERTY COLLISION IN COMPOSITION ===");
const withLogging = (target) => ({
  ...target,
  execute() {
    return "LOGGED_ACTION";
  }
});

const withMetrics = (target) => ({
  ...target,
  execute() {
    return "METRICS_ACTION"; // Overwrites earlier execute method!
  }
});

const composedService = withMetrics(withLogging({}));
console.log("Composed action output (Collision Winner):", composedService.execute()); // "METRICS_ACTION"

console.log("\n=== 2. DEPENDENCY INJECTION ARCHITECTURE ===");
// Clean DI: UserService USES ApiClient, does not EXTEND it
function createUserService(apiClient, logger) {
  return {
    async getUser(userId) {
      logger.log(`Fetching user: ${userId}`);
      return apiClient.get(`/users/${userId}`);
    }
  };
}

// Mock test dependencies
const mockApiClient = {
  get: async (path) => ({ id: "usr_01", path, status: "SUCCESS" })
};
const mockLogger = {
  log: (msg) => console.log(`[MockLogger]: ${msg}`)
};

const userService = createUserService(mockApiClient, mockLogger);
userService.getUser("sunny_dev").then((res) => {
  console.log("User Service Result:", JSON.stringify(res));
});

console.log("\n=== 3. JUSTIFIED INHERITANCE: CUSTOM ERROR HIERARCHY ===");
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message, invalidFields = []) {
    super(message, 400);
    this.invalidFields = invalidFields;
  }
}

const err = new ValidationError("Invalid email format", ["email"]);

console.log("Error name:", err.name); // "ValidationError"
console.log("Status code:", err.statusCode); // 400
console.log("Invalid fields:", err.invalidFields); // ["email"]
console.log("err instanceof ValidationError:", err instanceof ValidationError); // true
console.log("err instanceof AppError:", err instanceof AppError); // true
console.log("err instanceof Error:", err instanceof Error); // true
