/**
 * KPI 02 — Part 9: Closures, Lexical Environments & Stateful Architecture
 * Demonstrates:
 * 1. Gotcha: Live Binding Mutation in Shared Lexical Environment
 * 2. Prediction 4: Independent Factory Instances
 * 3. Closure-Based Private State Encapsulation
 * 4. Module-Level Cache & Lifetime Retention
 * 5. Practical Architecture: Debounced Async Search with AbortController
 */

console.log("=== 1. GOTCHA: LIVE BINDING MUTATION IN SHARED ENVIRONMENT ===");
function createCounter() {
  let count = 0; // Heap Context Binding
  return {
    increment() { count++; return count; },
    decrement() { count--; return count; },
    getValue() { return count; }
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log("Shared binding count value:", counter.getValue()); // 2

console.log("\n=== 2. PREDICTION 4: INDEPENDENT FACTORY INSTANCES ===");
const counterA = createCounter();
const counterB = createCounter();

console.log("counterA inc:", counterA.increment()); // 1
console.log("counterA inc:", counterA.increment()); // 2
console.log("counterB inc:", counterB.increment()); // 1
console.log("counterA get:", counterA.getValue());  // 2
console.log("counterB get:", counterB.getValue());  // 1

console.log("\n=== 3. CLOSURE-BASED PRIVATE STATE ENCAPSULATION ===");
function createBankAccount(initialBalance) {
  let balance = initialBalance; // Private: completely inaccessible from outside!
  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Invalid deposit");
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance() { return balance; }
  };
}

const account = createBankAccount(5000);
account.deposit(2500);
console.log("Account balance after deposit:", account.getBalance()); // 7500
console.log("Direct property access:", account.balance);             // undefined (Encapsulated!)

console.log("\n=== 4. MODULE-LEVEL CACHE & RETENTION ===");
const memoryCache = new Map();

function getOrCreateUser(id, loader) {
  if (memoryCache.has(id)) {
    console.log(`[Cache Hit] Returning cached user: ${id}`);
    return memoryCache.get(id);
  }
  console.log(`[Cache Miss] Loading user: ${id}`);
  const user = loader(id);
  memoryCache.set(id, user);
  return user;
}

const u1 = getOrCreateUser("usr-1", (id) => ({ id, name: "Sunny" }));
const u2 = getOrCreateUser("usr-1", (id) => ({ id, name: "Sunny" }));
console.log("Cached instance equality:", u1 === u2); // true

console.log("\n=== 5. PRACTICAL ARCHITECTURE: DEBOUNCED ABORTABLE SEARCH ===");

class DebouncedSearchManager {
  constructor(fetcher, delayMs = 50) {
    this.fetcher = fetcher;
    this.delayMs = delayMs;
    this.timerId = null;
    this.abortController = null;
  }

  search(query) {
    // 1. Cancel previous pending debounce timer
    if (this.timerId) clearTimeout(this.timerId);

    // 2. Abort previous in-flight request to eliminate race conditions
    if (this.abortController) {
      console.log(`⚡ Aborting in-flight request for previous query...`);
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    return new Promise((resolve, reject) => {
      this.timerId = setTimeout(async () => {
        try {
          console.log(`[Executing Search Request]: '${query}'`);
          const results = await this.fetcher(query, signal);
          resolve(results);
        } catch (err) {
          if (err.name === "AbortError") {
            console.log(`[Search Aborted]: '${query}' was cancelled cleanly`);
          } else {
            reject(err);
          }
        }
      }, this.delayMs);
    });
  }
}

// Simulating asynchronous mock API
const mockFetcher = async (q, signal) => {
  await new Promise((r, reject) => {
    const t = setTimeout(r, 30);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      const abortErr = new Error("Aborted");
      abortErr.name = "AbortError";
      reject(abortErr);
    });
  });
  return [`Result 1 for ${q}`, `Result 2 for ${q}`];
};

async function runSearchDemo() {
  const manager = new DebouncedSearchManager(mockFetcher, 20);

  // User types "Rea", then immediately "React"
  manager.search("Rea");
  const finalResults = await manager.search("React");
  console.log("Final search results received:", finalResults);
}

runSearchDemo();
