/**
 * KPI 08 — Part 02: Iterator Lifecycle, IteratorClose, break, return() & Cleanup
 * Demonstrates:
 * 1. Gotcha: Early Loop Exits (break & return) Triggering iterator.return()
 * 2. Prediction 1: Destructuring Truncation Triggering Immediate IteratorClose
 * 3. Prediction 2: Uncaught Exceptions Triggering Iterator Cleanup Before Propagation
 * 4. Prediction 3: Post-Closure .next() Permanent done: true Latching
 * 5. Practical Architecture: Resource-Backed Telemetry Stream with Deterministic Teardown
 */

"use strict";

console.log("=== 1. PREDICTION 1: BREAK TRIGGERING ITERATORCLOSE ===");
const closeableStream = {
  [Symbol.iterator]() {
    let index = 0;
    return {
      next() {
        return index < 5 ? { value: ++index, done: false } : { done: true };
      },
      return() {
        console.log("[Stream] IteratorClose invoked via break!");
        return { done: true };
      }
    };
  }
};

for (const num of closeableStream) {
  console.log("Read num:", num);
  if (num === 2) break;
}

console.log("\n=== 2. PREDICTION 2: DESTRUCTURING TRUNCATION CLEANUP ===");
const destructureTarget = {
  [Symbol.iterator]() {
    let count = 0;
    return {
      next() {
        return { value: `Packet_${++count}`, done: false };
      },
      return() {
        console.log("[Destructure] IteratorClose invoked on partial destructuring!");
        return { done: true };
      }
    };
  }
};

const [pktA, pktB] = destructureTarget;
console.log("Captured packets:", pktA, pktB);

console.log("\n=== 3. PREDICTION 3: POST-CLOSURE NEXT LATCHING ===");
class BoundedFileStream {
  constructor() {
    this.cursor = 0;
    this.isClosed = false;
  }

  next() {
    if (this.isClosed || this.cursor >= 3) {
      return { value: undefined, done: true };
    }
    return { value: `Line_${++this.cursor}`, done: false };
  }

  return() {
    this.isClosed = true;
    console.log("[FileStream] File descriptor closed.");
    return { done: true };
  }
}

const fileIterator = new BoundedFileStream();
console.log("Read 1:", fileIterator.next().value); // Line_1
fileIterator.return(); // Explicit manual closure
console.log("Read 2 (After return):", fileIterator.next()); // { value: undefined, done: true }

console.log("\n=== 4. PRACTICAL ARCHITECTURE: TELEMETRY STREAM ITERATOR ===");

class ManagedTelemetrySource {
  constructor(channelName) {
    this.channelName = channelName;
    this.activeSubscribers = 0;
  }

  [Symbol.iterator]() {
    const self = this;
    self.activeSubscribers++;
    let packetSeq = 0;
    let closed = false;
    console.log(`[TelemetrySource] Opened channel "${self.channelName}". Active subs: ${self.activeSubscribers}`);

    return {
      next() {
        if (closed || packetSeq >= 10) {
          return { value: undefined, done: true };
        }
        packetSeq++;
        return {
          value: { channel: self.channelName, seq: packetSeq, val: Math.round(Math.random() * 100) },
          done: false
        };
      },

      return() {
        if (!closed) {
          closed = true;
          self.activeSubscribers--;
          console.log(`[TelemetrySource] Cleanly detached subscriber from "${self.channelName}". Remaining subs: ${self.activeSubscribers}`);
        }
        return { done: true };
      }
    };
  }
}

const telemetry = new ManagedTelemetrySource("CLUSTER_HEALTH");

// Consume first 3 packets using early return
function processInitialHealthMetrics(source) {
  for (const packet of source) {
    console.log(`Received packet #${packet.seq} with val: ${packet.val}`);
    if (packet.seq === 3) {
      return "METRICS_PROCESSED_SUCCESSFULLY";
    }
  }
}

const result = processInitialHealthMetrics(telemetry);
console.log("Execution Result:", result);
