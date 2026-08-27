/**
 * KPI 1 — Part 5: TypeScript Engineering Philosophy
 * 
 * Executable Code Demonstrations:
 * 1. Inference-First vs Over-Annotation Benchmark
 * 2. Immutable Configuration with 'as const' and readonly
 * 3. Controlled Escape Hatches (unknown + Type Predicates vs any)
 * 4. Senior Design Rubric: The 5-Point Architecture Assessment
 */

console.log("=== 1. CONTROLLED ESCAPE HATCHES VIA TYPE PREDICATES ===");

interface ApiSuccess {
  status: "success";
  payload: Record<string, unknown>;
}

// User-Defined Type Guard (Safe alternative to 'as ApiSuccess')
function isApiSuccess(response: unknown): response is ApiSuccess {
  return (
    typeof response === "object" &&
    response !== null &&
    "status" in response &&
    (response as Record<string, unknown>).status === "success" &&
    "payload" in response &&
    typeof (response as Record<string, unknown>).payload === "object"
  );
}

const rawApiResponse: unknown = {
  status: "success",
  payload: { items: [1, 2, 3] }
};

if (isApiSuccess(rawApiResponse)) {
  console.log("✅ Safely narrowed to ApiSuccess without 'any' or blind assertion:", rawApiResponse.payload);
} else {
  console.log("❌ Not an ApiSuccess shape");
}

console.log("\n=== 2. IMMUTABLE CONST ASSERTIONS ===");

const APP_ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  CHECKOUT: "/checkout"
} as const;

type AppRoute = typeof APP_ROUTES[keyof typeof APP_ROUTES];

console.log("Immutable App Routes:", APP_ROUTES);
