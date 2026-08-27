/**
 * KPI 1 — Part 4: Static Types vs Runtime Data
 * 
 * Executable Code Demonstrations:
 * 1. Gotcha 1: Discriminated Unions vs Optional Property Soup
 * 2. Gotcha 2: Compile-Time Exhaustiveness Checking with 'never'
 * 3. The 'any' Infection Chain vs 'unknown' Narrowing
 * 4. User-Defined Type Guards (is predicate)
 * 5. Production Boundary Schema Parser & Result Type Pattern
 */

console.log("=== 1. GOTCHA 1: DISCRIMINATED UNIONS VS OPTIONAL PROPERTY SOUP ===");

// 1. Discriminated Union: Only valid states are representable!
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function renderUiState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case "idle":
      return "Ready to load.";
    case "loading":
      return "Fetching data from server...";
    case "success":
      // TypeScript knows 'data' exists 100% safely here:
      return `Data loaded: ${JSON.stringify(state.data)}`;
    case "error":
      // TypeScript knows 'error' exists 100% safely here:
      return `Error encountered: ${state.error}`;
  }
}

console.log(renderUiState({ status: "loading" }));
console.log(renderUiState({ status: "success", data: { id: "usr_100", name: "Alex" } }));


console.log("\n=== 2. GOTCHA 2: EXHAUSTIVENESS CHECKING WITH NEVER ===");

type SupportedCurrency = "USD" | "EUR" | "GBP";

function formatCurrencySymbol(currency: SupportedCurrency): string {
  switch (currency) {
    case "USD":
      return "$ (US Dollar)";
    case "EUR":
      return "€ (Euro)";
    case "GBP":
      return "£ (British Pound)";
    default: {
      // If a new currency is added to SupportedCurrency without a case above,
      // this line triggers a compile-time build error!
      const _exhaustiveCheck: never = currency;
      throw new Error(`Unhandled currency: ${_exhaustiveCheck}`);
    }
  }
}

console.log("Formatted currency:", formatCurrencySymbol("EUR"));


console.log("\n=== 3. USER-DEFINED TYPE GUARDS (IS PREDICATE) ===");

interface OrderRecord {
  orderId: string;
  totalCents: number;
}

function isOrderRecord(val: unknown): val is OrderRecord {
  return (
    typeof val === "object" &&
    val !== null &&
    "orderId" in val &&
    typeof (val as Record<string, unknown>).orderId === "string" &&
    "totalCents" in val &&
    typeof (val as Record<string, unknown>).totalCents === "number"
  );
}

const unverifiedPayload: unknown = { orderId: "ord_8819", totalCents: 4500 };

if (isOrderRecord(unverifiedPayload)) {
  console.log(`✅ Safely verified Order [${unverifiedPayload.orderId}] - Total: $${(unverifiedPayload.totalCents / 100).toFixed(2)}`);
} else {
  console.log("❌ Payload rejected by Type Guard");
}


console.log("\n=== 4. BOUNDARY PARSER & RESULT TYPE PATTERN ===");

type Result<T, E = string> = 
  | { success: true; data: T }
  | { success: false; error: E };

interface UserAccount {
  id: string;
  email: string;
  isActive: boolean;
}

function parseUserAccount(raw: unknown): Result<UserAccount> {
  if (!raw || typeof raw !== "object") {
    return { success: false, error: "Payload must be a non-null object" };
  }
  
  const rec = raw as Record<string, unknown>;
  
  if (typeof rec.id !== "string") return { success: false, error: "Missing/invalid 'id'" };
  if (typeof rec.email !== "string" || !rec.email.includes("@")) return { success: false, error: "Invalid 'email'" };
  if (typeof rec.isActive !== "boolean") return { success: false, error: "Missing/invalid 'isActive'" };
  
  return {
    success: true,
    data: {
      id: rec.id,
      email: rec.email,
      isActive: rec.isActive
    }
  };
}

const malformedInput = { id: "usr_55", email: "invalid-email-format", isActive: true };
const goodInput = { id: "usr_55", email: "alex@domain.com", isActive: true };

console.log("Malformed Input Result:", parseUserAccount(malformedInput));
console.log("Valid Input Result:", parseUserAccount(goodInput));
