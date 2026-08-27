/**
 * KPI 1 — Part 1: What TypeScript Actually Is
 * 
 * Executable Code Demonstrations:
 * 1. Gotcha 1 & Static Type Safety Fallacy (JSON.parse / API Deserialization Mismatch)
 * 2. Gotcha 2 & Type Erasure (instanceof with Interfaces vs Classes)
 * 3. Prediction Challenge 1: Type Space vs Value Space (The 'any' implicit coercion bypass)
 * 4. Prediction Challenge 2: Enum Runtime Object Intrusion vs 'as const' Objects
 * 5. Unsoundness Trap: Array Index Out-of-Bounds vs Runtime undefined
 * 6. Practical Architecture: The Type Safety Boundary Pattern (Safe Schema Parser)
 */

console.log("=== 1. GOTCHA 1: STATIC TYPE SAFETY FALLACY (RUNTIME MISMATCH) ===");

interface UserProfile {
  id: string;
  name: string;
  preferences: {
    theme: "light" | "dark";
  };
}

// Simulated network payload missing 'preferences'
const rawNetworkJson = '{"id": "usr_9981", "name": "Alex Johnson"}';

// ⚠️ Naive approach: Blindly casting unvalidated JSON to a TypeScript interface
const unvalidatedUser = JSON.parse(rawNetworkJson) as UserProfile;

console.log("Static check passed, user name:", unvalidatedUser.name);

try {
  // At compile time, TypeScript believes unvalidatedUser.preferences.theme is string ("light" | "dark")
  // At runtime, unvalidatedUser.preferences is undefined -> throws TypeError!
  // @ts-ignore
  console.log("Accessing preferences:", unvalidatedUser.preferences.theme);
} catch (err: any) {
  console.log("💥 Runtime Exception Trapped:", err.name, `(${err.message})`);
}


console.log("\n=== 2. GOTCHA 2: TYPE ERASURE & INSTANCEOF COMPILATION ===");

// 1. Interface lives ONLY in Type Space (0 bytes in JS bundle)
interface ApiEngineContract {
  execute(query: string): void;
}

// 2. Class lives in BOTH Type Space and Value Space
class DatabaseEngine implements ApiEngineContract {
  constructor(public host: string) {}
  execute(query: string) {
    console.log(`[DB ${this.host}] Running query: ${query}`);
  }
}

const engineInstance: unknown = new DatabaseEngine("cluster-prod-01");

// instanceof with a Class works because DatabaseEngine exists at runtime:
if (engineInstance instanceof DatabaseEngine) {
  console.log("✅ instanceof DatabaseEngine succeeded. Host:", engineInstance.host);
}

// Note: Attempting `if (engineInstance instanceof ApiEngineContract)` would cause a compile-time
// error (TS2693) because ApiEngineContract is completely erased during transpilation.


console.log("\n=== 3. PREDICTION CHALLENGE 1: THE 'ANY' COERCION BYPASS ===");

function parseConfigPort(rawJson: string): { port: number } {
  // JSON.parse returns 'any', bypassing TypeScript static checks:
  return JSON.parse(rawJson);
}

const config = parseConfigPort('{"port": "8080"}');

console.log("Type of config.port at runtime:", typeof config.port); // "string"
console.log("Evaluating config.port + 1 (String concatenation bug):", (config.port as any) + 1); // "80801"


console.log("\n=== 4. ENUM RUNTIME SPACE INTRUSION VS AS CONST ===");

// Standard Enum emits a real JavaScript runtime object:
enum FeatureFlagEnum {
  NewCheckout = "NEW_CHECKOUT",
  BetaDashboard = "BETA_DASHBOARD"
}

console.log("typeof FeatureFlagEnum at runtime:", typeof FeatureFlagEnum); // "object"
console.log("Enum runtime structure:", FeatureFlagEnum);

// Production Alternative: 'as const' object (zero JS runtime boilerplate beyond plain object):
const FeatureFlagConst = {
  NewCheckout: "NEW_CHECKOUT",
  BetaDashboard: "BETA_DASHBOARD"
} as const;

type FeatureFlag = typeof FeatureFlagConst[keyof typeof FeatureFlagConst];
console.log("Const Object Value:", FeatureFlagConst.NewCheckout);


console.log("\n=== 5. UNSOUNDNESS TRAP: ARRAY INDEX OUT-OF-BOUNDS ===");

const activeNodes: string[] = ["node-us-east-1", "node-eu-west-1"];

// Without "noUncheckedIndexedAccess", TS types activeNodes[5] as string
// But at runtime, it returns undefined:
const missingNode = activeNodes[5];

console.log("Value of missingNode at runtime:", missingNode); // undefined

try {
  // @ts-ignore
  console.log(missingNode.toUpperCase());
} catch (err: any) {
  console.log("💥 Unsoundness Crash:", err.name, `(${err.message})`);
}


console.log("\n=== 6. PRACTICAL ARCHITECTURE: TYPE SAFETY BOUNDARY PARSER ===");

// Lightweight Schema / Validator representation:
interface Schema<T> {
  parse(input: unknown): T;
  safeParse(input: unknown): { success: true; data: T } | { success: false; error: string };
}

// Building a standalone boundary validator for UserProfile
const UserProfileValidator: Schema<UserProfile> = {
  parse(input: unknown): UserProfile {
    const result = this.safeParse(input);
    if (!result.success) {
      throw new Error(`Boundary Violation: ${result.error}`);
    }
    return result.data;
  },
  safeParse(input: unknown): { success: true; data: UserProfile } | { success: false; error: string } {
    if (!input || typeof input !== "object") {
      return { success: false, error: "Input must be an object" };
    }
    
    const record = input as Record<string, any>;
    
    if (typeof record.id !== "string") {
      return { success: false, error: "Missing or invalid 'id' string" };
    }
    if (typeof record.name !== "string") {
      return { success: false, error: "Missing or invalid 'name' string" };
    }
    if (!record.preferences || typeof record.preferences !== "object") {
      return { success: false, error: "Missing 'preferences' object" };
    }
    if (record.preferences.theme !== "light" && record.preferences.theme !== "dark") {
      return { success: false, error: "Invalid 'theme', must be 'light' | 'dark'" };
    }
    
    return {
      success: true,
      data: {
        id: record.id,
        name: record.name,
        preferences: {
          theme: record.preferences.theme
        }
      }
    };
  }
};

// Testing the Boundary:
const malformedPayload = JSON.parse(rawNetworkJson);
const validationResult = UserProfileValidator.safeParse(malformedPayload);

if (!validationResult.success) {
  console.log("🛡️ Boundary Defense Activated! Caught malformed payload:", validationResult.error);
}

const validPayload = {
  id: "usr_1002",
  name: "Sarah Connor",
  preferences: { theme: "dark" }
};

const trustedUser = UserProfileValidator.parse(validPayload);
console.log("🟢 Validated Domain Object Safe in Memory:", trustedUser.name, "Theme:", trustedUser.preferences.theme);
