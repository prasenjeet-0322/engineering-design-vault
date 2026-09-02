# KPI 25 — Error Handling, Debugging & Reliability

## Part 2 — `try`, `catch`, `finally` & Synchronous Error Handling


> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)


Part 1 established the failure model. Now we need to understand **how JavaScript actually intercepts and handles exceptions**.

The core mechanism is:

```js
try {
  // Code that may throw
} catch (error) {
  // Handle the thrown error
} finally {
  // Always runs after try/catch completes
}
```

The important thing is not memorizing this syntax. You need to understand the **control-flow mechanics**.

---

# 1. What Is `try`?

## Definition

A `try` block defines a section of code where JavaScript should watch for exceptions that can be handled by an associated `catch`.

Example:

```js
try {
  const user = null;

  console.log(user.name);
}
```

Execution:

```text
try block starts
       ↓
user = null
       ↓
user.name
       ↓
TypeError occurs ❌
```

Once the exception occurs, normal execution inside that `try` block stops.

---

# 2. What Happens When an Error Is Thrown?

Consider:

```js
try {
  console.log("Step 1");

  throw new Error("Failure");

  console.log("Step 2");
} catch (error) {
  console.log("Error handled");
}
```

Execution:

```text
Step 1
  ↓
throw Error
  ↓
❌ Normal execution interrupted
  ↓
Jump to catch
  ↓
"Error handled"
```

This line never executes:

```js
console.log("Step 2");
```

This is critical:

> **Throwing an exception immediately abandons the remaining synchronous execution of the current protected block and begins exception propagation.**

---

# 3. Basic `try` / `catch`

Example:

```js
try {
  const data =
    JSON.parse("invalid json");
} catch (error) {
  console.error(
    "Parsing failed:",
    error.message
  );
}
```

Conceptually:

```text
try
 │
 ├── Success ────────→ Continue
 │
 └── Error
       ↓
     catch
       ↓
    Handle error
       ↓
    Continue
```

Without the `try/catch`:

```text
Invalid JSON
      ↓
SyntaxError
      ↓
Unhandled exception
```

With `try/catch`:

```text
Invalid JSON
      ↓
SyntaxError
      ↓
catch handles it
      ↓
Application can continue
```

---

# 4. `catch` Receives the Thrown Value

Example:

```js
try {
  throw new Error(
    "Failed to load user"
  );
} catch (error) {
  console.log(error.message);
}
```

Output:

```text
Failed to load user
```

The `error` variable is simply the value that was thrown.

For example:

```js
try {
  throw 404;
} catch (error) {
  console.log(error);
}
```

Output:

```text
404
```

Or:

```js
try {
  throw "Something failed";
} catch (error) {
  console.log(error);
}
```

This is one reason arbitrary thrown values are problematic.

A handler cannot safely assume:

```js
error.message
```

exists.

---

# 5. Why `Error` Objects Are Better

Consider:

```js
try {
  throw new Error("Failed");
} catch (error) {
  console.log(error.message);
}
```

This gives structured error information.

Conceptually:

```text
Error Object
│
├── name
├── message
└── stack
```

This is more consistent than:

```js
throw "Failed";
```

or:

```js
throw 500;
```

A reliable application benefits from predictable error shapes.

---

# 6. `catch` Is Not a Magic "Fix"

Consider:

```js
try {
  const user = null;

  console.log(user.name);
} catch (error) {
  console.log("Something failed");
}
```

The application did not fix:

```text
user = null
```

It only changed what happens **after the failure**.

Conceptually:

```text
Bug exists
    ↓
Operation fails
    ↓
catch intercepts failure
    ↓
Application decides what to do
```

This distinction is important.

Bad engineering can look like:

```js
try {
  everything();
} catch {
  // ignore
}
```

This hides the failure.

---

# 7. Never Silently Swallow Errors

Example:

```js
try {
  processPayment();
} catch (error) {
}
```

This is usually dangerous.

Conceptually:

```text
Failure occurs
      ↓
catch
      ↓
Nothing happens
      ↓
Failure disappears ❌
```

Now:

```text
Developer cannot debug it
User may not know what happened
Application state may be inconsistent
```

At minimum, determine whether the error should be:

```text
Handled
Reported
Transformed
Rethrown
Recovered from
```

---

# 8. `try/catch` and Function Calls

A `try/catch` can handle an error thrown inside a synchronously executed function.

```js
function processUser() {
  throw new Error("Invalid user");
}

try {
  processUser();
} catch (error) {
  console.log(error.message);
}
```

Execution:

```text
try
 │
 ▼
processUser()
 │
 ▼
throw Error ❌
 │
 ▼
catch
```

The important condition is:

> The error occurs during the synchronous execution path protected by the `try`.

---

# 9. Nested Function Error Propagation

Consider:

```js
function levelOne() {
  levelTwo();
}

function levelTwo() {
  levelThree();
}

function levelThree() {
  throw new Error("Failure");
}

try {
  levelOne();
} catch (error) {
  console.log(
    "Handled:",
    error.message
  );
}
```

Execution:

```text
try
 │
 ▼
levelOne()
 │
 ▼
levelTwo()
 │
 ▼
levelThree()
 │
 ▼
throw Error ❌
 │
 └───────────────┐
                 │
                 ▼
              catch
```

JavaScript propagates the exception upward through the call stack.

The `catch` does **not** need to be inside the exact function where the error originated.

---

# 10. Where Should You Catch an Error?

This is where senior-level reasoning begins.

You should not automatically write:

```js
try {
  everySingleOperation();
} catch {
}
```

Instead ask:

> **Which layer can actually make a meaningful recovery decision?**

Example:

```text
parseResponse()
      ↓
API client
      ↓
Data hook
      ↓
Component
```

Suppose JSON parsing fails.

Possible architecture:

```text
parseResponse()
      ↓
throws error
      ↓
API client
      ↓
normalizes failure
      ↓
Data hook
      ↓
returns failure state
      ↓
Component
      ↓
shows UI
```

The component may not need to understand:

```text
JSON parsing
HTTP transport
response decoding
```

It only needs to know:

```text
Can I show the data?

If not, what failure state exists?
```

---

# 11. `finally`

## Definition

The `finally` block runs after the `try` block completes and after a matching `catch` handles an exception, including during many control-flow exits.

Example:

```js
try {
  console.log("Start");
} catch (error) {
  console.log("Error");
} finally {
  console.log("Cleanup");
}
```

Output:

```text
Start
Cleanup
```

With an error:

```js
try {
  throw new Error("Failure");
} catch (error) {
  console.log("Error");
} finally {
  console.log("Cleanup");
}
```

Output:

```text
Error
Cleanup
```

Conceptually:

```text
try
 │
 ├── Success ────┐
 │               │
 └── Error       │
       ↓         │
     catch ──────┤
                 ↓
              finally
```

---

# 12. The Purpose of `finally`

`finally` is generally for work that should happen regardless of whether the operation succeeds or fails.

Example:

```js
try {
  startOperation();

  performOperation();
} catch (error) {
  handleError(error);
} finally {
  stopLoading();
}
```

Conceptually:

```text
Operation starts
      ↓
Loading = true
      ↓
   Success?
   /      \
 Yes       No
  │         │
  ▼         ▼
Result    Handle error
  \         /
   \       /
    ▼     ▼
    finally
       ↓
Loading = false
```

This makes cleanup logic explicit.

---

# 13. Common `finally` Use Cases

Typical uses include:

```text
Reset loading state
Release temporary resources
Close connections
Cleanup temporary state
Stop progress indicators
Restore UI state
```

Example:

```js
async function loadUser() {
  setLoading(true);

  try {
    const user =
      await fetchUser();

    setUser(user);
  } catch (error) {
    setError(error);
  } finally {
    setLoading(false);
  }
}
```

This pattern ensures:

```text
Success → loading false

Failure → loading false
```

---

# 14. `finally` and `return`

This behavior is important.

Consider:

```js
function getValue() {
  try {
    return "A";
  } finally {
    console.log("Cleanup");
  }
}
```

Execution:

```text
return "A"
    ↓
finally runs first
    ↓
function returns "A"
```

Output:

```text
Cleanup
```

Result:

```js
getValue(); // "A"
```

Conceptually:

```text
try
 ↓
return requested
 ↓
finally executes
 ↓
return completes
```

---

# 15. Dangerous `return` Inside `finally`

Consider:

```js
function getValue() {
  try {
    return "A";
  } finally {
    return "B";
  }
}
```

Result:

```js
getValue(); // "B"
```

The `return` inside `finally` overrides the earlier return.

This is dangerous because it can suppress expected control flow.

Similarly:

```js
function run() {
  try {
    throw new Error("Failure");
  } finally {
    return "Recovered";
  }
}
```

The thrown error is effectively suppressed by the `return` in `finally`.

Therefore:

> **Avoid `return`, `throw`, or other control-flow overrides inside `finally` unless you explicitly intend to override the previous completion.**

For cleanup logic, `finally` should usually remain simple.

---

# 16. `try` Without `catch`

JavaScript allows:

```js
try {
  performOperation();
} finally {
  cleanup();
}
```

If `performOperation()` throws:

```text
try
 ↓
Error ❌
 ↓
finally runs
 ↓
Error continues propagating
```

Example:

```js
function run() {
  try {
    throw new Error("Failure");
  } finally {
    console.log("Cleanup");
  }
}
```

The error is not handled.

The `finally` block runs, and then the exception continues upward.

This is useful when your responsibility is:

```text
Cleanup
```

but not:

```text
Error recovery
```

---

# 17. `try/catch` Control Flow vs Normal Flow

Consider:

```js
function getUser(id) {
  try {
    if (!id) {
      throw new Error(
        "ID required"
      );
    }

    return {
      id,
      name: "Sunny"
    };
  } catch (error) {
    return null;
  }
}
```

This works, but ask whether an exception is necessary.

Could this simply be:

```js
function getUser(id) {
  if (!id) {
    return null;
  }

  return {
    id,
    name: "Sunny"
  };
}
```

The second version may be clearer if missing `id` is an expected state.

Avoid using exceptions as ordinary control flow when a normal result model is more appropriate.

---

# 18. Selective Error Handling

Suppose:

```js
try {
  await loadData();
} catch (error) {
  handleError(error);
}
```

Not every error should necessarily receive the same treatment.

You may need classification.

Example:

```js
try {
  await loadData();
} catch (error) {
  if (error instanceof ValidationError) {
    showValidationError(
      error.message
    );
  } else {
    reportUnexpectedError(error);
  }
}
```

Conceptually:

```text
Error
 │
 ├── ValidationError
 │       ↓
 │    User correction
 │
 └── Unexpected Error
         ↓
      Report / fallback
```

This becomes more powerful with custom error types, which we will cover in Part 3.

---

# 19. Catch, Handle, or Rethrow?

A `catch` does not mean:

```text
The error must end here.
```

You can:

### Handle

```js
try {
  operation();
} catch (error) {
  showFallback();
}
```

### Transform

```js
try {
  operation();
} catch (error) {
  throw new Error(
    "Failed to initialize dashboard"
  );
}
```

### Rethrow

```js
try {
  operation();
} catch (error) {
  logError(error);

  throw error;
}
```

Conceptually:

```text
Error occurs
      ↓
catch
      │
      ├── Handle
      │
      ├── Transform
      │
      └── Rethrow
```

The choice depends on which layer owns recovery.

---

# 20. Error Context When Rethrowing

Suppose:

```js
try {
  await fetchUser();
} catch (error) {
  throw new Error(
    "Failed to initialize dashboard"
  );
}
```

This adds context, but it can obscure the original failure if handled carelessly.

Modern JavaScript supports preserving causal context with an error cause:

```js
try {
  await fetchUser();
} catch (error) {
  throw new Error(
    "Failed to initialize dashboard",
    {
      cause: error
    }
  );
}
```

Conceptually:

```text
Dashboard Error
      │
      └── cause
            │
            ▼
       Original Error
```

This allows higher layers to understand both:

```text
What failed at this layer?
```

and:

```text
What caused it?
```

---

# 21. The Error Boundary Principle

A useful architecture:

```text
Low-level layer
      ↓
Throws detailed technical error
      ↓
Higher-level layer
      ↓
Adds context / transforms meaning
      ↓
UI boundary
      ↓
Decides user experience
```

Example:

```text
fetch()
  ↓
Network failure

API client
  ↓
ApiError

Dashboard loader
  ↓
DashboardLoadError

UI
  ↓
"Unable to load dashboard"
+ Retry
```

The user should usually not see:

```text
TypeError:
Cannot read properties of undefined
```

That is technical diagnostic information, not useful recovery guidance.

---

# 22. One Large `try` Block vs Focused `try` Blocks

Consider:

```js
try {
  validateUser();
  updateCache();
  saveUser();
  sendAnalytics();
  renderSuccess();
} catch (error) {
  handleError(error);
}
```

What failed?

```text
Validation?
Cache?
Save?
Analytics?
Rendering?
```

The error boundary is broad.

Sometimes that is correct.

Often, more deliberate boundaries are better:

```js
validateUser();

try {
  await saveUser();
} catch (error) {
  showSaveError();
  return;
}

try {
  sendAnalytics();
} catch (error) {
  reportAnalyticsError(error);
}

renderSuccess();
```

Now failure handling matches ownership.

But do not split every line into separate `try/catch` blocks either.

The principle is:

> **Define error boundaries around meaningful operations and recovery strategies.**

---

# 23. `try/catch` Is Synchronous by Default

This is a critical distinction.

Consider:

```js
try {
  setTimeout(() => {
    throw new Error("Failure");
  }, 1000);
} catch (error) {
  console.log("Caught");
}
```

The outer `catch` does **not** catch that later callback error.

Why?

Execution:

```text
try starts
   ↓
Schedule timer
   ↓
try finishes
   ↓
catch scope is gone

Later...
   ↓
Timer callback executes
   ↓
Error occurs ❌
```

The error occurs in a later execution context.

The correct model is:

```text
try/catch
protects the execution occurring
while control is inside the try path.
```

We will go much deeper into async errors in Part 4.

---

# 24. Correct Handling Inside an Async Callback

Example:

```js
setTimeout(() => {
  try {
    throw new Error("Failure");
  } catch (error) {
    console.error(error);
  }
}, 1000);
```

Now:

```text
Timer callback starts
        ↓
try begins
        ↓
Error occurs
        ↓
catch handles it
```

Again, the handler exists around the execution context where the exception occurs.

---

# 25. `try/catch` with `async/await`

An `await` changes how we work with asynchronous failures.

Example:

```js
async function loadUser() {
  try {
    const user =
      await fetchUser();

    return user;
  } catch (error) {
    console.error(error);
  }
}
```

Conceptually:

```text
try
 ↓
Start async operation
 ↓
await Promise

Success
  ↓
Continue inside try

OR

Promise rejects
  ↓
catch
```

This is one reason `async/await` makes asynchronous failure handling resemble synchronous code.

But the underlying mechanism still involves Promise rejection.

We will analyze this precisely in Part 4.

---

# 26. Common Anti-Pattern — Catch Everything and Continue

Example:

```js
try {
  const user =
    await loadUser();

  processUser(user);
} catch (error) {
  console.error(error);
}

continueApplication();
```

What happens if:

```text
loadUser()
```

fails?

You may continue with:

```text
Invalid application state
```

A better approach may be:

```js
try {
  const user =
    await loadUser();

  processUser(user);
} catch (error) {
  showErrorState();
  return;
}

continueApplication();
```

Now:

```text
Failure
   ↓
Handle failure
   ↓
Stop dependent flow
```

The important question is:

> **After handling this failure, is it actually safe to continue?**

---

# 27. Recovery Must Match the Failure

Consider:

```text
Network timeout
```

Possible response:

```text
Retry
```

Now:

```text
Invalid user input
```

Better response:

```text
Ask user to correct input
```

Now:

```text
Programming bug
```

Better response:

```text
Report
Fix
Possibly isolate with fallback UI
```

Therefore:

```text
Error
  ↓
Classification
  ↓
Recovery strategy
```

Do not apply:

```text
catch → "Something went wrong"
```

to every failure in a large application.

---

# 28. Production Example — Loading Data

```js
async function loadProducts() {
  setLoading(true);
  setError(null);

  try {
    const products =
      await productService.getAll();

    setProducts(products);
  } catch (error) {
    reportError(error);

    setError({
      type: "LOAD_PRODUCTS_FAILED",
      message:
        "Unable to load products."
    });
  } finally {
    setLoading(false);
  }
}
```

State flow:

```text
Start
 ↓
loading = true
error = null
 ↓
Request
 │
 ├── Success
 │      ↓
 │   setProducts()
 │
 └── Failure
        ↓
     reportError()
        ↓
     setError()
             │
             ▼
          finally
             ↓
      loading = false
```

This is much closer to production-quality thinking than simply:

```js
fetch(...).catch(console.error);
```

---

# 29. Prediction Challenge #1

What happens?

```js
try {
  console.log("A");

  throw new Error("Failure");

  console.log("B");
} catch (error) {
  console.log("C");
} finally {
  console.log("D");
}
```

Answer:

```text
A
C
D
```

Because:

```text
A executes
 ↓
Error thrown
 ↓
B skipped
 ↓
catch → C
 ↓
finally → D
```

---

# 30. Prediction Challenge #2

What happens?

```js
function test() {
  try {
    return "A";
  } finally {
    console.log("Cleanup");
  }
}
```

Answer:

```text
"Cleanup"
```

is logged first.

Then:

```text
"A"
```

is returned.

Conceptually:

```text
return requested
      ↓
finally executes
      ↓
return completes
```

---

# 31. Prediction Challenge #3

What happens?

```js
function test() {
  try {
    throw new Error("Failure");
  } finally {
    return "Recovered";
  }
}
```

The result becomes:

```text
"Recovered"
```

The `return` inside `finally` overrides the thrown exception.

This is why control-flow statements inside `finally` are dangerous.

---

# 32. Senior-Level Design Questions

Before writing a `try/catch`, ask:

```text
1. What operation can actually fail?

2. What failures do I expect?

3. Where should the error boundary exist?

4. Can this layer recover?

5. Should the error be transformed?

6. Should the original cause be preserved?

7. Is it safe to continue?

8. What cleanup must happen regardless?

9. Should finally handle lifecycle cleanup?

10. Should the failure propagate upward?
```

---

# 33. 30-Second Executive Cheat Sheet

```text
TRY / CATCH / FINALLY
════════════════════════════

try
=
Execute protected code


throw
=
Interrupt normal execution


catch
=
Receive and handle thrown value


finally
=
Run cleanup regardless of normal
success or handled/unhandled failure


Error propagation:

Function C throws
      ↑
Function B
      ↑
Function A
      ↑
Nearest suitable handler


catch can:

Handle
Transform
Rethrow


finally:

Runs before pending return completes

Avoid return/throw inside finally
unless intentionally overriding control flow


Senior principle:

Don't ask:

"Where can I catch this?"

Ask:

"Which layer owns recovery?"
```

---

# KPI 25 Progress

```text
KPI 25 — Error Handling, Debugging & Reliability
══════════════════════════════════════════════════

Part 1  ✅ Errors, Exceptions & Failure Model
Part 2  ✅ try / catch / finally
Part 3  ⏳ Error Propagation & Custom Errors
Part 4  ⏳ Async Errors & Promise Rejections
Part 5  ⏳ API Failure Handling & Retry Strategies
Part 6  ⏳ React Error Boundaries & Recovery
Part 7  ⏳ Logging, Observability & Production Debugging
Part 8  ⏳ Systematic Debugging Methodology
```

**Next: Part 3 — Error propagation across application layers, custom error classes, error taxonomy, error transformation, and preserving the original cause.**