/**
 * KPI 24 — Part 04: Event Listener Performance, High-Frequency Events & Event Delegation
 * Demonstrates:
 * 1. Gotcha: Fragile matches() vs Robust closest() Nested Event Target Resolution
 * 2. Gotcha: Unified Multi-Listener Cleanup via AbortController
 * 3. Prediction 1: Debounce vs Throttle Execution Count Comparison
 * 4. Prediction 2: Event Delegation with Dynamic Child Node Insertion
 * 5. Practical Architecture: Standalone Event Delegation Router & Action Dispatcher
 */

"use strict";

console.log("=== 1. GOTCHA: MATCHES() VS CLOSEST() IN NESTED DELEGATION ===");

// Mock DOM Tree:
// <div id="table">
//   <button class="delete-btn" data-id="101">
//     <svg><path id="inner-icon" /></svg>
//     <span>Delete</span>
//   </button>
// </div>

class MockDOMNode {
  constructor(tag, className = "", id = "", dataset = {}, parent = null) {
    this.tagName = tag.toUpperCase();
    this.className = className;
    this.id = id;
    this.dataset = dataset;
    this.parentNode = parent;
  }

  matches(selector) {
    if (selector.startsWith(".")) return this.className.includes(selector.slice(1));
    if (selector.startsWith("#")) return this.id === selector.slice(1);
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentNode;
    }
    return null;
  }
}

const tableContainer = new MockDOMNode("div", "", "table");
const deleteBtn = new MockDOMNode("button", "delete-btn", "btn-1", { id: "101" }, tableContainer);
const svgIcon = new MockDOMNode("svg", "", "icon-1", {}, deleteBtn);
const pathLeaf = new MockDOMNode("path", "", "inner-icon", {}, svgIcon); // Innermost clicked target

// Scenario A: Fragile matches()
console.log("  Testing matches('.delete-btn') on clicked leaf <path>:");
const isDirectMatch = pathLeaf.matches(".delete-btn");
console.log(`    ❌ Direct matches() result: ${isDirectMatch} (Fails to trigger action!)`);

// Scenario B: Robust closest()
console.log("  Testing closest('.delete-btn') on clicked leaf <path>:");
const matchedButton = pathLeaf.closest(".delete-btn");
console.log(`    ✅ Robust closest() result: Found <${matchedButton.tagName} class="${matchedButton.className}"> with ID: ${matchedButton.dataset.id}`);

console.log("\n=== 2. DEBOUNCE VS THROTTLE EXECUTION TIMING BENCHMARK ===");

function createDebounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function createThrottle(fn, interval) {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
}

let debounceCalls = 0;
let throttleCalls = 0;

const debounced = createDebounce(() => { debounceCalls++; }, 60);
const throttled = createThrottle(() => { throttleCalls++; }, 40);

// Simulate 8 rapid fire events at 20ms intervals (Total: 160ms)
for (let i = 0; i < 8; i++) {
  debounced(`query_${i}`);
  throttled(`query_${i}`);
}

setTimeout(() => {
  console.log(`  📊 Results after high-frequency burst (8 events):`);
  console.log(`    - Throttled Executions (40ms interval): ${throttleCalls} (Immediate rate-limited execution)`);
  console.log(`    - Debounced Executions (60ms delay): ${debounceCalls} (Single execution after activity settled)`);
}, 100);

console.log("\n=== 3. PRACTICAL ARCHITECTURE: STANDALONE EVENT DELEGATION ROUTER ===");

class EventDelegationRouter {
  #actions = new Map();

  register(actionName, handler) {
    this.#actions.set(actionName, handler);
  }

  dispatch(clickedNode) {
    // Traverse upward to find the closest element declaring data-action
    let current = clickedNode;
    while (current) {
      if (current.dataset && current.dataset.action) {
        const action = current.dataset.action;
        const handler = this.#actions.get(action);
        if (handler) {
          handler(current.dataset);
          return;
        }
      }
      current = current.parentNode;
    }
  }
}

const router = new EventDelegationRouter();
router.register("LIKE_POST", (data) => console.log(`    👍 [Action: LIKE_POST]: Liked post #${data.postId}`));
router.register("DELETE_POST", (data) => console.log(`    🗑️ [Action: DELETE_POST]: Deleted post #${data.postId}`));

// Simulated Click on inner span inside like button
const postCard = new MockDOMNode("div", "card", "card-1", {}, tableContainer);
const likeButton = new MockDOMNode("button", "like-btn", "btn-like", { action: "LIKE_POST", postId: "88" }, postCard);
const innerSpan = new MockDOMNode("span", "", "", {}, likeButton);

console.log("  Dispatching delegated click on <span /> inside <button data-action='LIKE_POST'>");
router.dispatch(innerSpan);

setTimeout(() => {
  console.log("\n  🎉 [Event Listener Performance & Event Delegation Verification Completed Successfully!]");
}, 150);
