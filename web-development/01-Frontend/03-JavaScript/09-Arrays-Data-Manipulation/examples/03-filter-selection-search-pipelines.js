/**
 * KPI 09 — Part 03: filter() — Selection, Search Pipelines & Immutable Updates
 * Demonstrates:
 * 1. Gotcha: filter(Boolean) Scalar Data Loss Bug vs Explicit Nullish Checks
 * 2. Prediction 1: Reference Preservation of Surviving Elements
 * 3. Prediction 2: filter() vs find() Return Invariants
 * 4. Prediction 3: Async Predicate Filtering Utility (Promise.all + mask)
 * 5. Practical Architecture: Enterprise Multi-Facet Audit Log & Security Search Engine
 */

"use strict";

console.log("=== 1. GOTCHA: filter(Boolean) SCALAR DATA LOSS ===");

const rawInventory = [
  { id: "P1", name: "Keyboard", stock: 5, discountPrice: 79 },
  { id: "P2", name: "Free Promo Sticker", stock: 100, discountPrice: 0 }, // discountPrice: 0 is falsy!
  { id: "P3", name: "Sold Out Monitor", stock: 0, discountPrice: 299 },   // stock: 0 is falsy!
  null,
  undefined
];

// ❌ Buggy: filter(Boolean) removes null AND valid items with 0 stock/price!
const buggyCleaned = rawInventory.filter(Boolean);
const buggyPromos = buggyCleaned.filter((p) => p.discountPrice); // Wipes out $0 free item!
console.log("Buggy Filter Promos count (P2 missing!):", buggyPromos.length); // 2 (P2 lost!)

// ✅ Senior Standard: Explicit nullish checks & numeric boundaries
const safeCleaned = rawInventory.filter((p) => p != null);
const safePromos = safeCleaned.filter((p) => p.discountPrice >= 0);
console.log("Safe Filter Promos count (P2 preserved!):", safePromos.length); // 3 (P1, P2, P3 preserved)

console.log("\n=== 2. PREDICTION 1: REFERENCE PRESERVATION IN FILTER ===");
const users = [
  { id: 1, name: "Sunny", active: true },
  { id: 2, name: "Alex", active: false }
];

const activeUsers = users.filter((u) => u.active);
activeUsers[0].name = "John"; // Mutates shared reference!

console.log("Original User 1 name (Mutated!):", users[0].name); // John
console.log("Array references equal?:", users === activeUsers); // false
console.log("Item 1 references equal?:", users[0] === activeUsers[0]); // true

console.log("\n=== 3. PREDICTION 2: FILTER VS FIND RETURN INVARIANTS ===");
const team = [
  { id: "U1", role: "DEVELOPER" },
  { id: "U2", role: "DEVELOPER" },
  { id: "U3", role: "MANAGER" }
];

const allDevs = team.filter((m) => m.role === "DEVELOPER");
const firstDev = team.find((m) => m.role === "DEVELOPER");
const missingMemberFilter = team.filter((m) => m.role === "CEO");
const missingMemberFind = team.find((m) => m.role === "CEO");

console.log("filter (All Matches):", allDevs.map(d => d.id)); // [ 'U1', 'U2' ]
console.log("find (First Match Only):", firstDev.id); // U1
console.log("filter (Missing item returns array):", missingMemberFilter); // []
console.log("find (Missing item returns undefined):", missingMemberFind); // undefined

console.log("\n=== 4. PREDICTION 3: ASYNC FILTERING UTILITY ===");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function asyncFilter(items, asyncPredicate) {
  const booleanMask = await Promise.all(items.map(asyncPredicate));
  return items.filter((_, index) => booleanMask[index]);
}

async function verifyPermissionAsync(user) {
  await sleep(10);
  return user.isAdmin;
}

const candidateUsers = [
  { name: "Sunny", isAdmin: true },
  { name: "Alex", isAdmin: false },
  { name: "Sarah", isAdmin: true }
];

asyncFilter(candidateUsers, verifyPermissionAsync).then((verifiedAdmins) => {
  console.log("Async Filtered Verified Admins:", verifiedAdmins.map(u => u.name)); // [ 'Sunny', 'Sarah' ]

  console.log("\n=== 5. PRACTICAL ARCHITECTURE: MULTI-FACET AUDIT LOG ENGINE ===");
  const auditLogs = [
    { id: "L1", action: "USER_LOGIN", user: "sunny@corp.com", severity: "INFO", statusCode: 200 },
    { id: "L2", action: "DB_BACKUP_FAIL", user: "system", severity: "CRITICAL", statusCode: 500 },
    { id: "L3", action: "PERMISSION_DENIED", user: "alex@corp.com", severity: "WARNING", statusCode: 403 },
    { id: "L4", action: "API_GATEWAY_TIMEOUT", user: "guest", severity: "CRITICAL", statusCode: 504 }
  ];

  function queryAuditLogs(logs, criteria) {
    const q = criteria.query ? criteria.query.trim().toLowerCase() : "";
    return logs.filter((log) => {
      const matchesSearch = !q || log.action.toLowerCase().includes(q) || log.user.toLowerCase().includes(q);
      const matchesSeverity = !criteria.severity || criteria.severity === "ALL" || log.severity === criteria.severity;
      const matchesErrors = !criteria.onlyErrors || log.statusCode >= 400;
      return matchesSearch && matchesSeverity && matchesErrors;
    });
  }

  const criticalErrors = queryAuditLogs(auditLogs, {
    query: "",
    severity: "CRITICAL",
    onlyErrors: true
  });

  console.log("Filtered Critical System Errors:");
  console.dir(criticalErrors, { depth: null });
});
