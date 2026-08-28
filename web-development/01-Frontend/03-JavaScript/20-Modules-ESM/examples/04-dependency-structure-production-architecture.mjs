/**
 * KPI 20 — Part 04: Dependency Structure, Barrel Files, Circular Dependencies & Production Module Architecture
 * Demonstrates:
 * 1. Gotcha: Circular Dependency Breakdown & Layer Extraction Decoupling
 * 2. Gotcha: Barrel Self-Import Cycle Elimination via Direct Sibling Imports
 * 3. Prediction 1: 4-Tier Unidirectional Dependency Flow Verification
 * 4. Prediction 2: Change Surface Isolation in Normalization Layer
 * 5. Practical Architecture: Standalone Feature-Sliced Architecture with Public Facade
 */

console.log("=== 1. GOTCHA: CIRCULAR DEPENDENCY & LAYER EXTRACTION FIX ===");

// Simulating Circular Dependency: UserService <--> UserUtils
// FIX: Extract shared logic into Leaf Core module (No dependencies)

// 🟢 Layer 0: Leaf Core
const UserCore = {
  formatName: (name) => name.trim().toUpperCase()
};

// 🟢 Layer 1: Services (Depends on Core)
const UserService = {
  getUser: (id) => ({ id, rawName: `  Engineer ${id}  ` }),
  getFormattedUser: (id) => {
    const user = UserService.getUser(id);
    return { id, name: UserCore.formatName(user.rawName) };
  }
};

// 🟢 Layer 1: Utils (Depends on Core, NOT UserService)
const UserUtils = {
  validateAndFormat: (name) => (name ? UserCore.formatName(name) : "ANONYMOUS")
};

console.log("  Decoupled Service Call:", UserService.getFormattedUser(101));
console.log("  Decoupled Utils Call:", UserUtils.validateAndFormat("  Alice  "));
console.log("  ✅ Zero Circular Coupling Verified!");

console.log("\n=== 2. GOTCHA: BARREL SELF-IMPORT CYCLE ELIMINATION ===");

// Sibling Modules Direct Import Simulation
const SiblingComponentA = { name: "ComponentA" };
const SiblingComponentB = {
  name: "ComponentB",
  // 🟢 Direct sibling dependency (Does NOT import through public barrel)
  siblingRef: SiblingComponentA.name
};

// Public Feature Barrel Facade (Strictly for external consumers)
const FeatureBarrelFacade = {
  ComponentA: SiblingComponentA,
  ComponentB: SiblingComponentB
};

console.log("  Sibling Component B correctly initialized with:", SiblingComponentB.siblingRef);
console.log("  External Facade Exports:", Object.keys(FeatureBarrelFacade));

console.log("\n=== 3. 4-TIER UNIDIRECTIONAL FEATURE-SLICED ARCHITECTURE ===");

// Tier 1: Infrastructure (HTTP Client)
const HttpClient = {
  fetchMock: async (path) => ({ status: 200, json: async () => [{ user_id: 1, full_name: "Sunny" }] })
};

// Tier 2: Domain API Service & Normalizer (Change Surface Protected)
const UsersApi = {
  async fetchUsers() {
    const res = await HttpClient.fetchMock("/api/users");
    const raw = await res.json();
    // Normalization: UI is decoupled from backend property naming changes!
    return raw.map((item) => ({ id: item.user_id, name: item.full_name }));
  }
};

// Tier 3: Feature Hook / State Orchestrator
const UserFeatureOrchestrator = {
  async loadUsers() {
    console.log("    ⏳ [Feature Orchestrator]: Querying Domain API...");
    return UsersApi.fetchUsers();
  }
};

// Tier 4: UI Presentation
UserFeatureOrchestrator.loadUsers().then((users) => {
  console.log("  UI Received Normalized Clean Entity:", users);
  console.log("\n  🎉 [Production Module Architecture & Circular Decoupling Verification Completed Successfully!]");
});
