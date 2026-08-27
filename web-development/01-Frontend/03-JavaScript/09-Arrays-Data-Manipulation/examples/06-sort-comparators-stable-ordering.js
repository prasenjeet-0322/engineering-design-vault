/**
 * KPI 09 — Part 06: sort() — Mutation, Comparators, Stable Ordering & toSorted()
 * Demonstrates:
 * 1. Gotcha: sort() In-Place Mutation vs toSorted() Immutability
 * 2. Gotcha: Lexicographical Number Sorting vs Arithmetic Comparator
 * 3. Prediction 1: TimSort Stability with Equal Keys
 * 4. Prediction 2: Multi-Field Composite Sorting Pipeline
 * 5. Prediction 3: Natural Alphanumeric Sorting with Intl.Collator
 * 6. Practical Architecture: Enterprise Multi-Column Dynamic Table Sorting Engine
 */

"use strict";

console.log("=== 1. GOTCHA: IN-PLACE MUTATION VS toSorted() ===");

const rawList = ["Charlie", "Alice", "Bob"];
const mutatedResult = rawList.sort();

console.log("Original rawList (MUTATED!):", rawList); // [ 'Alice', 'Bob', 'Charlie' ]
console.log("Are Array Pointers Identical?:", rawList === mutatedResult); // true

const numbers = [30, 10, 20];
const immutableSorted = numbers.toSorted((a, b) => a - b);
console.log("Original numbers (UNTOUCHED):", numbers); // [ 30, 10, 20 ]
console.log("New immutable toSorted array:", immutableSorted); // [ 10, 20, 30 ]
console.log("Are Array Pointers Identical?:", numbers === immutableSorted); // false

console.log("\n=== 2. GOTCHA: LEXICOGRAPHICAL NUMBER SORTING ===");
const mixedNumbers = [1, 20, 100, 3, 2];

// ❌ Buggy: Default string sort
const lexicographical = mixedNumbers.toSorted();
console.log("Lexicographical Sort (String order):", lexicographical); // [ 1, 100, 2, 20, 3 ]

// ✅ Senior Standard: Numeric subtraction comparator
const numericAscending = mixedNumbers.toSorted((a, b) => a - b);
console.log("Numeric Ascending Sort:", numericAscending); // [ 1, 2, 3, 20, 100 ]

console.log("\n=== 3. PREDICTION 1: TIMSORT STABILITY ===");
const candidates = [
  { id: 101, name: "Alice", score: 95 },
  { id: 102, name: "Bob", score: 80 },
  { id: 103, name: "Charlie", score: 95 }
];

// Sort descending by score; equal scores must maintain original relative order (Alice before Charlie)
const stableSorted = candidates.toSorted((a, b) => b.score - a.score);
console.log("Stable Sort Score 95 Candidate IDs (Alice before Charlie preserved):",
  stableSorted.filter(c => c.score === 95).map(c => c.name)
); // [ 'Alice', 'Charlie' ]

console.log("\n=== 4. PREDICTION 2: MULTI-FIELD COMPOSITE COMPARATOR ===");
const employees = [
  { id: "E1", name: "Sunny", department: "Engineering", salary: 140000 },
  { id: "E2", name: "Alex", department: "Product", salary: 130000 },
  { id: "E3", name: "John", department: "Engineering", salary: 150000 },
  { id: "E4", name: "Sarah", department: "Engineering", salary: 140000 }
];

// Composite Sort: Department ASC -> Salary DESC -> Name ASC
const multiSorted = employees.toSorted((a, b) => {
  const deptCmp = a.department.localeCompare(b.department);
  if (deptCmp !== 0) return deptCmp;

  const salaryCmp = b.salary - a.salary; // Descending
  if (salaryCmp !== 0) return salaryCmp;

  return a.name.localeCompare(b.name);
});

console.log("Multi-Sorted Employee Directory:");
multiSorted.forEach(e =>
  console.log(`  [${e.department}] $${e.salary} - ${e.name}`)
);

console.log("\n=== 5. PREDICTION 3: INTL.COLLATOR NATURAL NUMBER SORT ===");
const filenames = ["report_10.pdf", "report_2.pdf", "report_1.pdf", "report_20.pdf"];

const standardSort = filenames.toSorted();
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const naturalSort = filenames.toSorted(collator.compare);

console.log("Standard Lexical Sort (Bad for filenames):", standardSort);
console.log("Intl.Collator Natural Alphanumeric Sort (Human intuitive):", naturalSort);

console.log("\n=== 6. PRACTICAL ARCHITECTURE: DYNAMIC TABLE SORT ENGINE ===");

function createDynamicComparator(columnKey, direction = "asc") {
  const collatorInstance = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  return (a, b) => {
    const valA = a[columnKey];
    const valB = b[columnKey];

    let cmp = 0;
    if (typeof valA === "number" && typeof valB === "number") {
      cmp = valA - valB;
    } else {
      cmp = collatorInstance.compare(String(valA), String(valB));
    }

    return direction === "asc" ? cmp : -cmp;
  };
}

const tableData = [
  { id: "T1", title: "Task 10", priority: 1, assignee: "Sunny" },
  { id: "T2", title: "Task 2", priority: 3, assignee: "Alex" },
  { id: "T3", title: "Task 1", priority: 2, assignee: "Sarah" }
];

const sortedByTitle = tableData.toSorted(createDynamicComparator("title", "asc"));
console.log("Sorted by Title (Natural):", sortedByTitle.map(t => t.title)); // [ 'Task 1', 'Task 2', 'Task 10' ]

const sortedByPriorityDesc = tableData.toSorted(createDynamicComparator("priority", "desc"));
console.log("Sorted by Priority (DESC):", sortedByPriorityDesc.map(t => `${t.title} (Priority ${t.priority})`));
