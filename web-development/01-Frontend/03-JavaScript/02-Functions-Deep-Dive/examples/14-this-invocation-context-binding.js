/**
 * KPI 02 — Part 14: this, Invocation Context, call(), apply(), bind() & Arrows
 * Demonstrates:
 * 1. Gotcha: Method Extraction Receiver Loss & Arrow/Bind Fixes
 * 2. Prediction 2: Same Function Object with Different Receivers
 * 3. Prediction 3: Object Literal Arrow Function Context Trap
 * 4. Prediction 4: bind() Reference Identity Inequality
 * 5. Prediction 5: Arrow Function Capturing Constructor Context
 * 6. Prediction 6: call() vs bind() Execution Timing
 * 7. Prediction 7: Event Listener Removal Reference Mismatch Trap
 * 8. Practical Architecture: Audio Player Controller with Safe Context Management
 */

console.log("=== 1. GOTCHA: METHOD EXTRACTION & RECEIVER LOSS ===");
const user = {
  name: "Sunny",
  getName() {
    return this ? this.name : "undefined receiver";
  }
};

const extractedGetName = user.getName;
console.log("Direct method invocation (user.getName()):", user.getName()); // "Sunny"
console.log("Extracted method call (extractedGetName()):", extractedGetName()); // "undefined receiver"

console.log("\n=== 2. PREDICTION 2: SAME FUNCTION WITH DIFFERENT RECEIVERS ===");
function showName() {
  return this.name;
}
const userA = { name: "Sunny", showName };
const userB = { name: "Alex", showName };
console.log("userA.showName():", userA.showName()); // "Sunny"
console.log("userB.showName():", userB.showName()); // "Alex"

console.log("\n=== 3. PREDICTION 3: OBJECT LITERAL ARROW TRAP ===");
const literalUser = {
  name: "Sunny",
  greetArrow: () => {
    return typeof this !== "undefined" ? this?.name : "undefined";
  }
};
console.log("literalUser.greetArrow():", literalUser.greetArrow()); // undefined

console.log("\n=== 4. PREDICTION 4: BIND() FUNCTION IDENTITY ===");
const boundA = showName.bind(userA);
const boundB = showName.bind(userA);
console.log("boundA === boundB:", boundA === boundB); // false
console.log("boundA():", boundA()); // "Sunny"

console.log("\n=== 5. PREDICTION 5: ARROW IN CONSTRUCTOR ===");
function UserConstructor(name) {
  this.name = name;
  this.getName = () => this.name; // Lexical capture of constructor instance
}
const instance = new UserConstructor("Sunny");
const detachedGetter = instance.getName;
console.log("detachedGetter() preserves constructor this:", detachedGetter()); // "Sunny"

console.log("\n=== 6. PREDICTION 6: CALL() VS BIND() TIMING ===");
function greetMessage(greeting) {
  return `${greeting}, ${this.name}`;
}
const immediateResult = greetMessage.call(userA, "Welcome");
const deferredFunction = greetMessage.bind(userA, "Welcome");
console.log("call() immediate execution:", immediateResult);
console.log("bind() deferred execution:", deferredFunction());

console.log("\n=== 7. PREDICTION 7: EVENT LISTENER CLEANUP TRAP & FIX ===");
class MockEventTarget {
  constructor() {
    this.listeners = new Map();
  }
  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
  }
  removeEventListener(event, fn) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(fn);
    }
  }
  getListenerCount(event) {
    return this.listeners.get(event)?.size || 0;
  }
}

const target = new MockEventTarget();

// ❌ The Leak Trap:
target.addEventListener("click", user.getName.bind(user));
target.removeEventListener("click", user.getName.bind(user));
console.log("Listener count after flawed cleanup (Leak!):", target.getListenerCount("click")); // 1

// ✅ The Correct Pattern:
const stableBound = user.getName.bind(user);
target.addEventListener("click", stableBound);
target.removeEventListener("click", stableBound);
console.log("Listener count after correct cleanup:", target.getListenerCount("click")); // 1 (flawed one remains)

console.log("\n=== 8. PRACTICAL ARCHITECTURE: AUDIO PLAYER CONTROLLER ===");

class AudioPlayerController {
  constructor(logger) {
    this.logger = logger;
    this.currentTrack = null;
    this.isPlaying = false;
  }

  // Arrow property ensures 'this' is permanently bound across callbacks
  play = (track) => {
    this.currentTrack = track;
    this.isPlaying = true;
    this.logger(`[AudioPlayer] Playing track: ${track.title}`);
  };

  pause = () => {
    this.isPlaying = false;
    this.logger(`[AudioPlayer] Paused track: ${this.currentTrack?.title}`);
  };
}

const mockLogger = (msg) => console.log(msg);
const player = new AudioPlayerController(mockLogger);

// Pass method directly to callback without receiver loss!
const playHandler = player.play;
playHandler({ id: "track_1", title: "Mastering JavaScript Architecture" });
console.log("Player state isPlaying:", player.isPlaying);
