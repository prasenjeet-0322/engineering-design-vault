/**
 * KPI 02 — Part 17: this Binding, Execution Context & Function Invocation
 * Demonstrates:
 * 1. Gotcha: Detached Method Receiver Loss & Strict Mode Fallback
 * 2. Prediction 1: Method Call vs Detached Plain Function Call
 * 3. Prediction 2: Object Literal Arrow Trap
 * 4. Prediction 3: bind() Identity Inequality
 * 5. Prediction 4: Callback Arrow Wrapper Preserving Context
 * 6. Prediction 5: Constructor Invocation with new
 * 7. Practical Architecture: Canvas Graphics Controller with Safe Event Handlers
 */

console.log("=== 1. GOTCHA: DETACHED METHOD RECEIVER LOSS ===");
const user = {
  name: "Sunny",
  getName() {
    return this ? this.name : "undefined receiver";
  }
};

console.log("Method Call (user.getName()):", user.getName()); // "Sunny"
const detachedGetName = user.getName;
console.log("Detached Call (detachedGetName()):", detachedGetName()); // "undefined receiver"

console.log("\n=== 2. PREDICTION 1: CALL-SITE RECEIVER EVALUATION ===");
function showTitle() {
  return this?.title ?? "No title";
}
const bookA = { title: "JavaScript Architecture", showTitle };
const bookB = { title: "V8 Internals", showTitle };
console.log("bookA.showTitle():", bookA.showTitle()); // "JavaScript Architecture"
console.log("bookB.showTitle():", bookB.showTitle()); // "V8 Internals"

console.log("\n=== 3. PREDICTION 2: OBJECT LITERAL ARROW TRAP ===");
const article = {
  title: "Closures & this",
  getArrowTitle: () => typeof this !== "undefined" ? this?.title : "undefined"
};
console.log("article.getArrowTitle():", article.getArrowTitle()); // undefined

console.log("\n=== 4. PREDICTION 3: BIND() INSTANCE IDENTITY ===");
const boundA = user.getName.bind(user);
const boundB = user.getName.bind(user);
console.log("boundA === boundB:", boundA === boundB); // false
console.log("boundA():", boundA()); // "Sunny"

console.log("\n=== 5. PREDICTION 4: CALLBACK WRAPPER VS PASSING METHOD ===");
class AsyncLogger {
  constructor(tag) {
    this.tag = tag;
  }
  logMessage(msg) {
    return `[${this.tag}] ${msg}`;
  }
}
const logger = new AsyncLogger("PAYMENT_SERVICE");

// Wrapping in arrow closure preserves receiver:
const safeCallback = () => logger.logMessage("Transaction processed");
console.log("Arrow wrapper execution:", safeCallback());

console.log("\n=== 6. PREDICTION 5: CONSTRUCTOR INVOCATION WITH NEW ===");
function UserAccount(username) {
  this.username = username;
}
const account = new UserAccount("prasenjeet");
console.log("Constructed account username:", account.username); // "prasenjeet"

console.log("\n=== 7. PRACTICAL ARCHITECTURE: GRAPHICS CONTROLLER ===");

class CanvasDrawingController {
  constructor(tag) {
    this.tag = tag;
    this.isDrawing = false;
  }

  // Arrow class fields guarantee 'this' is permanently bound across DOM listeners
  startDrawing = (point) => {
    this.isDrawing = true;
    console.log(`[${this.tag}] Started drawing at: (${point.x}, ${point.y})`);
  };

  stopDrawing = () => {
    this.isDrawing = false;
    console.log(`[${this.tag}] Stopped drawing`);
  };
}

const controller = new CanvasDrawingController("CANVAS_LAYER_1");

// Method can be detached and passed to listeners without losing 'this' receiver:
const detachedStart = controller.startDrawing;
detachedStart({ x: 120, y: 340 });
console.log("Controller isDrawing state:", controller.isDrawing); // true
