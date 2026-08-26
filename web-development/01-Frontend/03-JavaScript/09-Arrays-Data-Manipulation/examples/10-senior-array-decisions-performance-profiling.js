/**
 * KPI 09 — Part 10: Senior Array Decisions, Performance & Master Architecture
 * Demonstrates:
 * 1. Gotcha: O(N * M) Accidental Quadratic Join vs O(N + M) Map Index Benchmark
 * 2. Gotcha: filter()[0] Array Allocation Overhead vs find() Short-Circuiting
 * 3. Prediction 1: Set Membership O(1) Lookup vs Array.includes()
 * 4. Prediction 2: Safe Reducer Identity on Empty Arrays
 * 5. Practical Architecture: Enterprise Multi-Entity Relational Join & Analytics Engine
 */

"use strict";

console.log("=== 1. GOTCHA: O(N * M) QUADRATIC JOIN VS O(N + M) MAP INDEX ===");

const USERS_COUNT = 2000;
const TASKS_COUNT = 10000;

const mockUsers = Array.from({ length: USERS_COUNT }, (_, i) => ({
  id: `U-${i}`,
  name: `User ${i}`
}));

const mockTasks = Array.from({ length: TASKS_COUNT }, (_, i) => ({
  id: `T-${i}`,
  title: `Task ${i}`,
  assigneeId: `U-${i % USERS_COUNT}`
}));

// A. Slow Quadratic Join O(N * M)
const startQuad = performance.now();
const joinedQuad = mockTasks.slice(0, 1000).map((t) => {
  const user = mockUsers.find((u) => u.id === t.assigneeId);
  return { ...t, userName: user ? user.name : "Unassigned" };
});
const durationQuad = (performance.now() - startQuad).toFixed(2);
console.log(`Quadratic Join (1,000 tasks): ${durationQuad} ms`);

// B. Linear Map Indexed Join O(N + M)
const startLinear = performance.now();
const userMap = new Map(mockUsers.map((u) => [u.id, u.name]));
const joinedLinear = mockTasks.map((t) => ({
  ...t,
  userName: userMap.get(t.assigneeId) ?? "Unassigned"
}));
const durationLinear = (performance.now() - startLinear).toFixed(2);
console.log(`Linear Map Join (FULL 10,000 tasks): ${durationLinear} ms`);

console.log("\n=== 2. GOTCHA: FILTER()[0] VS FIND() EARLY TERMINATION ===");

let filterPasses = 0;
let findPasses = 0;
const largeArray = Array.from({ length: 1000 }, (_, i) => i);

const filterRes = largeArray.filter((n) => {
  filterPasses++;
  return n === 5;
})[0];

const findRes = largeArray.find((n) => {
  findPasses++;
  return n === 5;
});

console.log(`filter()[0] passes executed across 1000 items: ${filterPasses}`); // 1000
console.log(`find() passes executed across 1000 items: ${findPasses}`); // 6 (0 to 5)

console.log("\n=== 3. PREDICTION 1: SET MEMBERSHIP O(1) LOOKUP ===");

const allowedRoleIds = ["ROLE-ADMIN", "ROLE-MOD", "ROLE-EDITOR"];
const candidateUsers = [
  { id: "U1", role: "ROLE-ADMIN" },
  { id: "U2", role: "ROLE-GUEST" },
  { id: "U3", role: "ROLE-EDITOR" }
];

const roleSet = new Set(allowedRoleIds);
const authorized = candidateUsers.filter((u) => roleSet.has(u.role));
console.log("Authorized users:", authorized.map(u => `${u.id} (${u.role})`));

console.log("\n=== 4. PREDICTION 2: SAFE REDUCER IDENTITY ON EMPTY ARRAYS ===");

const emptyDataset = [];

try {
  emptyDataset.reduce((acc, val) => acc + val);
} catch (err) {
  console.log("Caught expected error without initialValue:", err.message);
}

const safeAccumulation = emptyDataset.reduce((acc, val) => acc + val, 0);
console.log("Safe empty accumulation with initialValue 0:", safeAccumulation);

console.log("\n=== 5. PRACTICAL ARCHITECTURE: RELATIONAL DATA JOIN ENGINE ===");

const rawUsers = [
  { id: "u1", name: "Sunny Yadav", department: "Engineering" },
  { id: "u2", name: "Alex Rivers", department: "Design" },
  { id: "u3", name: "Sarah Chen", department: "Engineering" }
];

const rawTasks = [
  { id: "t1", title: "Implement TimSort", assigneeId: "u1", priority: "high", hours: 8, done: false },
  { id: "t2", title: "Design System UI", assigneeId: "u2", priority: "medium", hours: 14, done: false },
  { id: "t3", title: "Optimize V8 GC", assigneeId: "u1", priority: "high", hours: 12, done: true },
  { id: "t4", title: "Redis Cache Audit", assigneeId: "u3", priority: "low", hours: 6, done: false }
];

function generateDepartmentAnalytics(tasks, users, targetDept) {
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Single-pass linear aggregation
  const enriched = [];
  let totalHours = 0;

  for (const task of tasks) {
    const user = userMap.get(task.assigneeId);
    if (!user || (targetDept !== "ALL" && user.department !== targetDept)) continue;

    totalHours += task.hours;
    enriched.push({
      taskId: task.id,
      title: task.title,
      assignee: user.name,
      department: user.department,
      hours: task.hours,
      status: task.done ? "DONE" : "PENDING"
    });
  }

  const avgHours = enriched.length > 0 ? (totalHours / enriched.length).toFixed(1) : 0;

  return { department: targetDept, totalMatched: enriched.length, totalHours, avgHours, tasks: enriched };
}

const engReport = generateDepartmentAnalytics(rawTasks, rawUsers, "Engineering");
console.log("Engineering Department Analytics Report:");
console.dir(engReport, { depth: null });
