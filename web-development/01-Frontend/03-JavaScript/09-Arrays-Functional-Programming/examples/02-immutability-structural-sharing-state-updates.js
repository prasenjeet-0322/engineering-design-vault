/**
 * KPI 09 — Part 02: Immutability, Structural Sharing & State Updates
 * Demonstrates:
 * 1. Gotcha: The Nested Shallow Spread Trap Corrupting Shared References
 * 2. Prediction 1: Structural Sharing Proof (Unchanged Branches Retain Reference)
 * 3. Prediction 2: ES2023 Immutable Array Methods (with, toSorted, toReversed)
 * 4. Prediction 3: structuredClone Deep Copy vs Shallow Spread
 * 5. Practical Architecture: Multi-Tab Workspace State Reducer with Structural Sharing
 */

"use strict";

console.log("=== 1. GOTCHA: NESTED SHALLOW SPREAD MUTATION TRAP ===");
const userProfile = {
  id: "U_100",
  profile: { name: "Sunny", settings: { theme: "dark" } }
};

// Shallow copy creates new root, but leaves userProfile.profile.settings SHARED!
const shallowCloned = { ...userProfile };
console.log("Root reference copied?:", userProfile !== shallowCloned); // true
console.log("Nested settings reference SHARED?:", userProfile.profile.settings === shallowCloned.profile.settings); // true

// Safe path-based nested update:
const deepUpdated = {
  ...userProfile,
  profile: {
    ...userProfile.profile,
    settings: {
      ...userProfile.profile.settings,
      theme: "light"
    }
  }
};

console.log("Original Theme:", userProfile.profile.settings.theme); // dark (Protected!)
console.log("Updated Theme:", deepUpdated.profile.settings.theme); // light
console.log("Settings reference distinct?:", userProfile.profile.settings !== deepUpdated.profile.settings); // true

console.log("\n=== 2. PREDICTION 1: STRUCTURAL SHARING INTEGRITY ===");
const complexState = {
  account: { username: "engineer_01" },
  notifications: { unread: 5, items: ["ALERT_1", "ALERT_2"] }
};

const modifiedState = {
  ...complexState,
  account: {
    ...complexState.account,
    username: "principal_01"
  }
};

console.log("Root changed?:", complexState !== modifiedState); // true
console.log("Account branch changed?:", complexState.account !== modifiedState.account); // true
console.log("Notifications branch STRUCTURALLY SHARED?:", complexState.notifications === modifiedState.notifications); // true (Zero memory re-allocation!)

console.log("\n=== 3. PREDICTION 2: ES2023 IMMUTABLE ARRAY METHODS ===");
const tiers = ["FREE", "PRO", "ENTERPRISE"];

// Modern non-mutating update at index 0 via .with()
const updatedTiers = tiers.with(0, "STARTER");
console.log("Original Tiers:", tiers); // ["FREE", "PRO", "ENTERPRISE"]
console.log("Updated Tiers:", updatedTiers); // ["STARTER", "PRO", "ENTERPRISE"]

// Modern non-mutating sort via .toSorted()
const scores = [50, 10, 90, 40];
const sortedScores = scores.toSorted((a, b) => a - b);
console.log("Original Scores:", scores); // [50, 10, 90, 40]
console.log("Sorted Scores:", sortedScores); // [10, 40, 50, 90]

console.log("\n=== 4. PREDICTION 3: STRUCTUREDCLONE DEEP ISOLATION ===");
const originalGraph = {
  createdAt: new Date(),
  tags: new Set(["AI", "REACT"]),
  nested: { count: 42 }
};

const deepClone = structuredClone(originalGraph);
deepClone.tags.add("TYPESCRIPT");
deepClone.nested.count = 99;

console.log("Original Tags Count:", originalGraph.tags.size); // 2
console.log("Deep Clone Tags Count:", deepClone.tags.size); // 3
console.log("Original Nested Count:", originalGraph.nested.count); // 42

console.log("\n=== 5. PRACTICAL ARCHITECTURE: WORKSPACE STATE REDUCER ===");

function workspaceReducer(state, action) {
  switch (action.type) {
    case "SWITCH_TAB":
      if (state.activeTabId === action.payload.tabId) return state;
      return { ...state, activeTabId: action.payload.tabId };

    case "UPDATE_TAB_CONTENT":
      return {
        ...state,
        tabs: state.tabs.map(tab =>
          tab.id === action.payload.tabId
            ? { ...tab, content: action.payload.content, isDirty: true }
            : tab // Structural sharing: unchanged tabs keep original reference!
        )
      };

    case "TOGGLE_AUTOSAVE":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          autoSave: !state.preferences.autoSave
        }
      };

    default:
      return state;
  }
}

const initialState = {
  activeTabId: "tab_1",
  tabs: [
    { id: "tab_1", title: "App.tsx", content: "console.log('App')", isDirty: false },
    { id: "tab_2", title: "Theme.ts", content: "export const theme = {}", isDirty: false }
  ],
  preferences: { autoSave: false }
};

// 1. Update Tab 1 content
const stateAfterEdit = workspaceReducer(initialState, {
  type: "UPDATE_TAB_CONTENT",
  payload: { tabId: "tab_1", content: "console.log('Updated App')" }
});

console.log("Tab 1 is dirty?:", stateAfterEdit.tabs[0].isDirty); // true
console.log("Tab 2 structurally shared?:", initialState.tabs[1] === stateAfterEdit.tabs[1]); // true!
console.log("Preferences structurally shared?:", initialState.preferences === stateAfterEdit.preferences); // true!
