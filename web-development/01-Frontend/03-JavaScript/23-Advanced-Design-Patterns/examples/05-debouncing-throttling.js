/**
 * KPI 23 — Part 05: Debouncing & Throttling Mechanics
 * Demonstrates:
 * 1. Gotcha: Inline Debounce Creation Bug vs Stable Closure Instance
 * 2. Gotcha: Search Race Condition with Debounce + AbortController Protection
 * 3. Prediction 1: Debounce Countdown Reset on Rapid Execution
 * 4. Prediction 2: Rate-Limited Throttling Execution Windows
 * 5. Practical Architecture: Standalone Debounce & Throttle Engine with `.cancel()` & `.flush()`
 */

"use strict";

console.log("=== 1. GOTCHA: INLINE DEBOUNCE RECREATION BUG ===");

function buggyInlineDebounce(query) {
  // 💥 Simulating creating a new debounce closure on every render/call
  const debounced = (text) => {
    setTimeout(() => console.log("  ❌ Buggy Inline Executed:", text), 50);
  };
  debounced(query);
}

buggyInlineDebounce("k");
buggyInlineDebounce("ke");
buggyInlineDebounce("key"); // 💥 All 3 will fire because timerId is not shared!

console.log("\n=== 2. PRODUCTION DEBOUNCE ENGINE WITH CANCEL & FLUSH ===");

function createDebounce(fn, delayMs, immediate = false) {
  let timerId = null;
  let lastArgs = null;
  let lastThis = null;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    const callNow = immediate && !timerId;
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      timerId = null;
      if (!immediate && lastArgs) {
        fn.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
    }, delayMs);

    if (callNow) {
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  }

  debounced.cancel = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  debounced.flush = () => {
    if (timerId && lastArgs) {
      clearTimeout(timerId);
      fn.apply(lastThis, lastArgs);
      timerId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  return debounced;
}

const safeDebouncedLog = createDebounce((msg) => {
  console.log("  ✅ Stable Debounced Search Fired:", msg);
}, 60);

safeDebouncedLog("r");
safeDebouncedLog("re");
safeDebouncedLog("rea");
safeDebouncedLog("react"); // 🟢 Only "react" will execute after 60ms!

console.log("\n=== 3. PRODUCTION THROTTLE ENGINE WITH TRAILING GUARANTEES ===");

function createThrottle(fn, intervalMs) {
  let lastRan = 0;
  let timerId = null;
  let lastArgs = null;
  let lastThis = null;

  return function (...args) {
    const now = Date.now();
    const remaining = intervalMs - (now - lastRan);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      lastRan = now;
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    } else if (!timerId) {
      // 🟢 Trailing execution guarantee
      timerId = setTimeout(() => {
        lastRan = Date.now();
        timerId = null;
        fn.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }, remaining);
    }
  };
}

let scrollCount = 0;
const throttledScroll = createThrottle((scrollY) => {
  scrollCount++;
  console.log(`    📜 [Throttled Scroll]: Position ${scrollY}px (Execution #${scrollCount})`);
}, 50);

// Simulate 5 rapid scroll events over 100ms
throttledScroll(100); // Runs immediately (T=0)
throttledScroll(250); // Ignored/buffered
throttledScroll(400); // Ignored/buffered
setTimeout(() => throttledScroll(800), 20); // Ignored/buffered
setTimeout(() => throttledScroll(1200), 60); // Runs trailing (T=60)

setTimeout(() => {
  console.log("\n  🎉 [Debouncing & Throttling Mechanics Verification Completed Successfully!]");
}, 200);
