/**
 * KPI 01 — Part 1: Variables, Values & Assignment Code Examples
 * Demonstrates:
 * 1. Binding Reassignment vs Heap Object Mutation
 * 2. Shared Reference Side-Effects (Prediction Challenge)
 * 3. Mutable vs. Immutable Theme State Management Architecture
 */

console.log("=== 1. PREDICTION CHALLENGE VERIFICATION ===");

const user = {
  name: "Sunny",
  skills: ["HTML", "CSS"]
};

// Copying reference pointer (0x004F2A) -> Both identifiers share the exact same Heap object!
const admin = user;

admin.name = "Admin";
admin.skills.push("JavaScript");

console.log("User object: ", user);
console.log("Admin object:", admin);
console.log("Are both pointers strictly equal?", user === admin); // true
console.log("Are skills arrays strictly equal? ", user.skills === admin.skills); // true

console.log("\n=== 2. PRACTICAL TASK: THEME STATE ARCHITECTURE ===");

// --- APPROACH A: DANGEROUS MUTABLE SHARED STATE ---
class MutableThemeManager {
  constructor(initialTheme) {
    this.themeConfig = initialTheme;
  }

  setDarkTheme() {
    // ❌ ANTI-PATTERN: Mutating shared object in-place
    this.themeConfig.mode = "dark";
    this.themeConfig.primaryColor = "#0f172a";
  }

  getConfig() {
    return this.themeConfig;
  }
}

// --- APPROACH B: SAFE IMMUTABLE STATE (PRODUCES NEW REFERENCES) ---
class ImmutableThemeManager {
  #themeConfig;

  constructor(initialTheme) {
    // Deep freeze default to guarantee compile/runtime safety
    this.#themeConfig = Object.freeze({ ...initialTheme });
  }

  setDarkTheme() {
    // ✅ SENIOR PATTERN: Produce a fresh immutable object copy
    this.#themeConfig = Object.freeze({
      ...this.#themeConfig,
      mode: "dark",
      primaryColor: "#0f172a"
    });
    return this.#themeConfig;
  }

  getConfig() {
    return this.#themeConfig;
  }
}

// --- EXECUTION DEMONSTRATION ---
const defaultGlobalSettings = {
  mode: "light",
  primaryColor: "#ffffff",
  fontFamily: "Inter"
};

console.log("\n[Test A: Mutable Manager]");
const mutableManager = new MutableThemeManager(defaultGlobalSettings);
mutableManager.setDarkTheme();
console.log("Default Global Settings corrupted?", defaultGlobalSettings.mode === "dark"); // true -> BUG!

// Reset default
const cleanGlobalSettings = {
  mode: "light",
  primaryColor: "#ffffff",
  fontFamily: "Inter"
};

console.log("\n[Test B: Immutable Manager]");
const immutableManager = new ImmutableThemeManager(cleanGlobalSettings);
const darkTheme = immutableManager.setDarkTheme();

console.log("Original Global Settings preserved?", cleanGlobalSettings.mode === "light"); // true -> SAFE!
console.log("Did state change generate a new reference?", darkTheme !== cleanGlobalSettings); // true
console.log("Updated Theme:", darkTheme);
