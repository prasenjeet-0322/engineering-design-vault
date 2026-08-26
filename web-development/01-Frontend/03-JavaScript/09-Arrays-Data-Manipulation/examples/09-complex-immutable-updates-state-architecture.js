/**
 * KPI 09 — Part 09: Complex Immutable Updates & Production State Architecture
 * Demonstrates:
 * 1. Gotcha: Shallow Spread Mutation Trap vs True Structural Sharing
 * 2. Prediction 1: Reference Preservation of Untouched Items
 * 3. Prediction 2: Multi-Tier Nested Array Immutable Updates
 * 4. Prediction 3: Normalized Store byId + allIds with Cascade Deletions
 * 5. Prediction 4: Optimistic UI Updates & Deterministic Rollback
 * 6. Practical Architecture: Enterprise Multi-Column Kanban Board Engine
 */

"use strict";

console.log("=== 1. GOTCHA: SHALLOW SPREAD TRAP VS STRUCTURAL SHARING ===");

const initialProjects = [
  { id: "P1", tasks: [{ id: "T1", completed: false }] }
];

// ❌ Buggy: Shallow spread only clones the top array container!
const shallowCopy = [...initialProjects];
shallowCopy[0].tasks[0].completed = true; // 💥 Mutates initialProjects directly!

console.log("Original initialProjects[0].tasks[0].completed (CORRUPTED!):", initialProjects[0].tasks[0].completed); // true

// Reset
initialProjects[0].tasks[0].completed = false;

// ✅ Senior Standard: True structural sharing
const cleanUpdate = initialProjects.map((p) =>
  p.id === "P1"
    ? { ...p, tasks: p.tasks.map((t) => (t.id === "T1" ? { ...t, completed: true } : t)) }
    : p
);

console.log("Original initialProjects (PRESERVED):", initialProjects[0].tasks[0].completed); // false
console.log("Clean update tasks[0].completed (UPDATED):", cleanUpdate[0].tasks[0].completed); // true

console.log("\n=== 2. PREDICTION 1: REFERENCE PRESERVATION IN MAP ===");
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];

const updatedUsers = users.map((u) => (u.id === 2 ? { ...u, name: "Robert" } : u));
console.log("User 1 identical pointer?:", users[0] === updatedUsers[0]); // true
console.log("User 2 identical pointer?:", users[1] === updatedUsers[1]); // false
console.log("Array container identical pointer?:", users === updatedUsers); // false

console.log("\n=== 3. PREDICTION 2: MULTI-TIER NESTED ARRAY UPDATE ===");
const workspaces = [
  {
    id: "WS-1",
    projects: [
      {
        id: "PRJ-10",
        tasks: [
          { id: "TSK-100", title: "Build Auth", done: false },
          { id: "TSK-101", title: "Setup CI/CD", done: false }
        ]
      }
    ]
  }
];

// Update TSK-100 to done: true
const nextWorkspaces = workspaces.map((ws) =>
  ws.id === "WS-1"
    ? {
        ...ws,
        projects: ws.projects.map((prj) =>
          prj.id === "PRJ-10"
            ? {
                ...prj,
                tasks: prj.tasks.map((tsk) =>
                  tsk.id === "TSK-100" ? { ...tsk, done: true } : tsk
                )
              }
            : prj
        )
      }
    : ws
);

console.log("Deep Nested Update Verified (TSK-100 done):",
  nextWorkspaces[0].projects[0].tasks[0].done
); // true
console.log("Untouched TSK-101 pointer preserved?:",
  workspaces[0].projects[0].tasks[1] === nextWorkspaces[0].projects[0].tasks[1]
); // true

console.log("\n=== 4. PREDICTION 3: NORMALIZED STORE CASCADE DELETION ===");
let store = {
  projects: { byId: { P1: { id: "P1", taskIds: ["T1", "T2"] } }, allIds: ["P1"] },
  tasks: { byId: { T1: { id: "T1", title: "Task 1" }, T2: { id: "T2", title: "Task 2" } }, allIds: ["T1", "T2"] }
};

// Cascade delete task T1
const targetDeleteId = "T1";
const nextStore = {
  ...store,
  projects: {
    ...store.projects,
    byId: {
      ...store.projects.byId,
      P1: {
        ...store.projects.byId.P1,
        taskIds: store.projects.byId.P1.taskIds.filter((id) => id !== targetDeleteId)
      }
    }
  },
  tasks: {
    byId: Object.fromEntries(
      Object.entries(store.tasks.byId).filter(([id]) => id !== targetDeleteId)
    ),
    allIds: store.tasks.allIds.filter((id) => id !== targetDeleteId)
  }
};

console.log("Updated Project P1 taskIds:", nextStore.projects.byId.P1.taskIds); // [ 'T2' ]
console.log("Updated Task allIds:", nextStore.tasks.allIds); // [ 'T2' ]

console.log("\n=== 5. PREDICTION 4: OPTIMISTIC STATE UPDATE & ROLLBACK ===");
let appState = [{ id: "T1", title: "Review PR", completed: false }];

// 1. Snapshot
const snapshotState = appState;

// 2. Apply optimistic update
appState = appState.map((t) => (t.id === "T1" ? { ...t, completed: true } : t));
console.log("Optimistic UI state:", appState[0].completed); // true

// 3. Rollback on network failure
appState = snapshotState;
console.log("Rollback restored original state:", appState[0].completed); // false

console.log("\n=== 6. PRACTICAL ARCHITECTURE: KANBAN COLUMN ATOMIC TRANSITION ===");

const kanbanBoard = {
  columns: [
    { id: "col-todo", title: "To Do", taskIds: ["T1", "T2"] },
    { id: "col-doing", title: "Doing", taskIds: ["T3"] }
  ],
  tasksById: {
    T1: { id: "T1", title: "OAuth PKCE", assignee: "Sunny" },
    T2: { id: "T2", title: "Stripe Webhooks", assignee: "Alex" },
    T3: { id: "T3", title: "Redis Caching", assignee: "Sarah" }
  }
};

function moveTask(board, taskId, sourceColId, targetColId) {
  if (sourceColId === targetColId) return board;

  return {
    ...board,
    columns: board.columns.map((col) => {
      if (col.id === sourceColId) {
        return { ...col, taskIds: col.taskIds.filter((id) => id !== taskId) };
      }
      if (col.id === targetColId) {
        return { ...col, taskIds: [...col.taskIds, taskId] };
      }
      return col;
    })
  };
}

const movedBoard = moveTask(kanbanBoard, "T1", "col-todo", "col-doing");
console.log("To Do Column taskIds after move:", movedBoard.columns.find(c => c.id === "col-todo").taskIds); // [ 'T2' ]
console.log("Doing Column taskIds after move:", movedBoard.columns.find(c => c.id === "col-doing").taskIds); // [ 'T3', 'T1' ]
