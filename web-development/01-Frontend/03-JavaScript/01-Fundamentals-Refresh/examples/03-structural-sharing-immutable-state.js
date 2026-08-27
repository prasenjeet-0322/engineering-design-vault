/**
 * KPI 01 — Part 3: Primitive vs Reference Values, Identity & Assignment Behavior
 * Demonstrates:
 * 1. Shared Object & Array Pointer Mutation (Prediction 1)
 * 2. Shallow Copy Nested Shared Mutation Trap (Prediction 2)
 * 3. Object.is() vs Strict Equality (===) Edge Cases
 * 4. Practical Architecture: Structural Sharing Nested State Update Engine
 */

console.log("=== 1. PREDICTION 1: SHARED POINTER MUTATION ===");
const userA = { name: "Sunny", skills: ["React"] };
const userB = userA; // Both identifiers point to 0xA1F0

userB.name = "Alex";
userB.skills.push("Next.js");

console.log("userA name:  ", userA.name); // "Alex"
console.log("userA skills:", userA.skills); // ["React", "Next.js"]
console.log("Are both identifiers strictly equal?", userA === userB); // true

console.log("\n=== 2. PREDICTION 2: SHALLOW COPY TRAP ===");
const original = { name: "Sunny", settings: { theme: "dark" } };
const copy = { ...original }; // New top-level object, SHARED settings pointer!

copy.name = "Alex";
copy.settings.theme = "light"; // Mutates shared nested settings object!

console.log("original name:          ", original.name); // "Sunny" (Isolated)
console.log("original settings.theme:", original.settings.theme); // "light" (Corrupted!)
console.log("original === copy:      ", original === copy); // false
console.log("settings are identical: ", original.settings === copy.settings); // true ⚠️

console.log("\n=== 3. OBJECT.IS() VS STRICT EQUALITY (===) ===");
console.log("NaN === NaN:        ", NaN === NaN); // false
console.log("Object.is(NaN, NaN):", Object.is(NaN, NaN)); // true ✅ (React render bailout check)
console.log("+0 === -0:          ", +0 === -0); // true
console.log("Object.is(+0, -0):  ", Object.is(+0, -0)); // false ✅

console.log("\n=== 4. STRUCTURAL SHARING NESTED STATE UPDATE ENGINE ===");

const initialAppState = {
  user: {
    id: 1,
    profile: {
      name: "Sunny",
      role: "Frontend Developer"
    }
  },
  settings: {
    theme: "dark",
    notifications: true
  }
};

/**
 * Structural Sharing Updater:
 * Generates fresh identities strictly along the updated path;
 * reuses existing references for unchanged branches.
 */
function updateProfileName(state, newName) {
  return {
    ...state, // State container receives new identity
    user: {
      ...state.user, // User container receives new identity
      profile: {
        ...state.user.profile, // Profile container receives new identity
        name: newName // Updated property!
      }
    }
    // settings branch is 100% REUSED (Same reference pointer)
  };
}

const updatedAppState = updateProfileName(initialAppState, "Alex");

console.log("--- Identity Verification ---");
console.log("1. State container changed:   ", initialAppState !== updatedAppState); // true
console.log("2. User object changed:        ", initialAppState.user !== updatedAppState.user); // true
console.log("3. Profile object changed:     ", initialAppState.user.profile !== updatedAppState.user.profile); // true
console.log("4. Settings branch REUSED (⚡):", initialAppState.settings === updatedAppState.settings); // true ✅
console.log("\nOriginal profile name preserved:", initialAppState.user.profile.name); // "Sunny"
console.log("Updated profile name:           ", updatedAppState.user.profile.name); // "Alex"
