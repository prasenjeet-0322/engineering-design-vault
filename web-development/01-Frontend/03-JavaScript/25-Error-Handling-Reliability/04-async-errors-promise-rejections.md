# KPI 25 — Error Handling, Debugging & Reliability

## Part 4 — Async Errors, Promise Rejections & `async/await`


> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)


Part 3 covered how errors propagate through **synchronous call stacks and application layers**.

Now we need to understand one of the most important distinctions in modern JavaScript:

> **A synchronous exception and an asynchronous Promise rejection are related failure mechanisms, but they do not behave identically.**

This matters constantly in frontend development because modern applications are heavily asynchronous:

```text
API requests
Authentication
File uploads
Timers
Database calls through APIs
Dynamic imports
Web Workers
Background operations
User-triggered async actions
```

---

# 1. The Fundamental Problem

Consider synchronous code:

```js
function getUser() {
  throw new Error("User failed");
}

try {
  getUser();
} catch (error) {
  console.log("Caught:", error.message);
}
```

This works because the failure occurs while execution is inside the `try` block.

Now compare:

```js
try {
  fetchUser();
} catch (error) {
  console.log("Caught");
}
```

If `fetchUser()` returns a Promise that later rejects, this `catch` may not handle the rejection unless you use the Promise correctly.

The mental model must change.

---

# 2. What Is a Promise Rejection?

## Definition

A **Promise rejection represents an asynchronous operation that completed unsuccessfully.**

A Promise can conceptually exist in one of three states:

```text
           ┌────────────┐
           │  Pending   │
           └─────┬──────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
  Fulfilled            Rejected
   Success              Failure
```

Example:

```js
const promise = Promise.reject(
  new Error("Request failed")
);
```

Conceptually:

```text
Promise
   ↓
Rejected
   ↓
Error value available
```

The rejection is not automatically handled by a normal synchronous `try/catch`.

---

# 3. Synchronous Throw vs Promise Rejection

Consider:

### Synchronous exception

```js
function syncOperation() {
  throw new Error("Sync failure");
}

try {
  syncOperation();
} catch (error) {
  console.log("Caught");
}
```

Execution:

```text
try begins
    ↓
syncOperation()
    ↓
throw ❌
    ↓
catch immediately handles
```

Now:

### Asynchronous rejection

```js
function asyncOperation() {
  return Promise.reject(
    new Error("Async failure")
  );
}

try {
  asyncOperation();
} catch (error) {
  console.log("Caught");
}
```

Execution:

```text
try begins
    ↓
asyncOperation()
    ↓
Returns Promise
    ↓
try completes
    ↓
Promise later rejected ❌
```

The `try` block only protects the synchronous execution that occurred inside it.

---

# 4. Handling Promise Rejections with `.catch()`

The Promise pattern:

```js
asyncOperation()
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error(error);
  });
```

Conceptually:

```text
Async Operation
      ↓
Promise
      │
      ├── Fulfilled
      │       ↓
      │     then()
      │
      └── Rejected
              ↓
            catch()
```

The `.catch()` is part of the Promise chain.

---

# 5. `await` Converts Promise Rejection Into Catchable Control Flow

Consider:

```js
async function loadUser() {
  try {
    const user = await fetchUser();

    return user;
  } catch (error) {
    console.error(error);
  }
}
```

This works because:

```text
await Promise
      │
      ├── Fulfilled
      │       ↓
      │   Continue execution
      │
      └── Rejected
              ↓
      Behaves like a thrown failure
              ↓
            catch
```

A useful mental model is:

```text
Promise rejection
       ↓
await
       ↓
Exception-like control flow
       ↓
try/catch
```

This is why `async/await` is generally easier to reason about for multi-step asynchronous operations.

---

# 6. Important: `async` Functions Always Return Promises

Consider:

```js
async function getUser() {
  return {
    name: "Sunny"
  };
}
```

Even though you wrote:

```js
return {
  name: "Sunny"
};
```

the function returns a Promise.

Conceptually:

```js
async function getUser()
```

behaves approximately like:

```js
function getUser() {
  return Promise.resolve({
    name: "Sunny"
  });
}
```

Therefore:

```js
const result = getUser();

console.log(result);
```

Conceptually:

```text
Promise
```

To access the resolved value:

```js
const user = await getUser();
```

or:

```js
getUser().then((user) => {
  console.log(user);
});
```

---

# 7. What Happens When You `throw` Inside an `async` Function?

Consider:

```js
async function getUser() {
  throw new Error("User failed");
}
```

Calling it does not synchronously throw into the caller in the usual way.

Instead:

```text
async function
      ↓
throw
      ↓
Returned Promise becomes rejected
```

Conceptually:

```js
getUser();
```

produces something like:

```js
Promise.reject(
  new Error("User failed")
);
```

Therefore:

```js
getUser()
  .catch((error) => {
    console.log(error.message);
  });
```

works.

Or:

```js
try {
  await getUser();
} catch (error) {
  console.log(error.message);
}
```

also works.

---

# 8. Prediction Challenge #1

What happens here?

```js
async function fail() {
  throw new Error("Failure");
}

try {
  fail();
} catch (error) {
  console.log("Caught");
}
```

The outer `catch` does not handle the rejection.

Why?

```text
try
 ↓
fail()
 ↓
Returns rejected Promise
 ↓
try finishes

Later Promise rejection exists
 ↓
No rejection handler
```

Correct handling:

```js
fail().catch((error) => {
  console.log("Caught");
});
```

Or:

```js
try {
  await fail();
} catch (error) {
  console.log("Caught");
}
```

inside an async context.

---

# 9. `return` vs `await`

Consider:

```js
async function getUser() {
  return fetchUser();
}
```

Versus:

```js
async function getUser() {
  return await fetchUser();
}
```

Both often result in the caller receiving the same fulfilled or rejected result.

However, inside a `try/catch`, the difference matters.

Example:

```js
async function getUser() {
  try {
    return fetchUser();
  } catch (error) {
    console.log("Caught");
  }
}
```

If `fetchUser()` returns a Promise that later rejects:

```text
fetchUser()
   ↓
Returns Promise immediately
   ↓
try completes
   ↓
Promise rejects later
   ↓
Local catch does not handle it
```

Now:

```js
async function getUser() {
  try {
    return await fetchUser();
  } catch (error) {
    console.log("Caught");
  }
}
```

Execution:

```text
try
 ↓
await Promise
 ↓
Promise rejects
 ↓
catch handles rejection
```

This is a critical practical distinction.

> If you need the current `try/catch` to handle a Promise rejection, you generally need to `await` that Promise inside the `try`.

---

# 10. Promise Chains and Error Propagation

Consider:

```js
fetchUser()
  .then((user) => {
    return processUser(user);
  })
  .then((result) => {
    return saveUser(result);
  })
  .catch((error) => {
    handleError(error);
  });
```

The failure can occur in multiple places:

```text
fetchUser()
     │
     ├── Reject ❌
     │
     └── Resolve
           ↓
       processUser()
           │
           ├── Throw ❌
           │
           └── Return
                 ↓
              saveUser()
                 │
                 └── Reject ❌
```

All these failures can propagate through the Promise chain to:

```js
.catch(handleError)
```

---

# 11. Errors Thrown Inside `.then()`

Consider:

```js
Promise.resolve("data")
  .then((data) => {
    throw new Error("Processing failed");
  })
  .catch((error) => {
    console.log(error.message);
  });
```

The error thrown inside `.then()` becomes a rejection in the next Promise chain.

Conceptually:

```text
Promise fulfilled
      ↓
then()
      ↓
throw ❌
      ↓
Next Promise rejected
      ↓
catch()
```

This is why Promise chains can propagate both:

```text
Promise rejection
```

and:

```text
Synchronous exceptions thrown
inside chain callbacks
```

through `.catch()`.

---

# 12. Promise Error Propagation

Consider:

```js
function first() {
  return second();
}

function second() {
  return third();
}

function third() {
  return Promise.reject(
    new Error("Failure")
  );
}

first().catch((error) => {
  console.log(error.message);
});
```

Conceptually:

```text
third()
   ↓
Rejected Promise
   ↑
second()
   ↑
first()
   ↓
catch()
```

This resembles synchronous propagation, but the transport mechanism is the Promise chain rather than only the synchronous call stack.

---

# 13. The Danger of Forgetting `await`

Consider:

```js
async function save() {
  try {
    saveUser();

    showSuccess();
  } catch (error) {
    showError();
  }
}
```

Suppose:

```js
saveUser()
```

returns a Promise.

Execution may become:

```text
saveUser starts
    ↓
Promise returned
    ↓
showSuccess() executes immediately ❌
    ↓
saveUser later fails
```

The function has effectively declared success before the operation completed.

Correct:

```js
async function save() {
  try {
    await saveUser();

    showSuccess();
  } catch (error) {
    showError();
  }
}
```

Now:

```text
saveUser()
    ↓
await
    │
    ├── Success
    │      ↓
    │  showSuccess()
    │
    └── Failure
           ↓
        showError()
```

This is one of the most common async bugs in JavaScript.

---

# 14. Sequential Async Operations

Consider:

```js
async function initializeDashboard() {
  try {
    const user =
      await loadUser();

    const permissions =
      await loadPermissions(
        user.id
      );

    const dashboard =
      await loadDashboard(
        permissions
      );

    return dashboard;
  } catch (error) {
    handleInitializationError(error);
  }
}
```

Flow:

```text
loadUser()
    ↓
loadPermissions()
    ↓
loadDashboard()
```

If any awaited operation rejects:

```text
Failure
   ↓
Remaining statements skipped
   ↓
catch
```

This creates one error boundary around a complete initialization workflow.

That is appropriate if all failures share the same recovery strategy.

---

# 15. Parallel Operations and `Promise.all`

Consider:

```js
const [user, products] =
  await Promise.all([
    loadUser(),
    loadProducts()
  ]);
```

Conceptually:

```text
loadUser() ───────┐
                  │
                  ▼
             Promise.all
                  │
loadProducts() ───┘
```

If both succeed:

```text
Promise.all
     ↓
Fulfilled
```

If one rejects:

```text
One Promise rejects ❌
        ↓
Promise.all rejects
        ↓
await throws into catch
```

Example:

```js
try {
  const [user, products] =
    await Promise.all([
      loadUser(),
      loadProducts()
    ]);
} catch (error) {
  handleError(error);
}
```

---

# 16. Important: `Promise.all` Is Fail-Fast

Suppose:

```text
loadUser()      → 500ms → Success
loadProducts()  → 100ms → Failure
```

`Promise.all()` rejects when the rejection occurs.

However, you should not mentally interpret that as:

```text
Other operations magically stop.
```

Promises already started may continue running unless the underlying operation supports explicit cancellation.

This distinction matters for:

```text
Network requests
Mutations
Analytics
Background work
```

Failure aggregation and operation cancellation are separate concerns.

---

# 17. `Promise.allSettled`

Sometimes you want to know the result of every operation.

Example:

```js
const results =
  await Promise.allSettled([
    loadUser(),
    loadProducts(),
    loadNotifications()
  ]);
```

The result might conceptually look like:

```js
[
  {
    status: "fulfilled",
    value: user
  },
  {
    status: "rejected",
    reason: error
  },
  {
    status: "fulfilled",
    value: notifications
  }
]
```

This is useful when partial failure is acceptable.

Example:

```text
Dashboard
│
├── User profile ✅
├── Products ❌
└── Notifications ✅
```

Instead of failing the entire dashboard, you can decide:

```text
Render available sections
+
Show an error only where failure occurred
```

---

# 18. `Promise.all` vs `Promise.allSettled`

| Behavior        | `Promise.all`                      | `Promise.allSettled`       |
| --------------- | ---------------------------------- | -------------------------- |
| All success     | Resolves                           | Resolves                   |
| One fails       | Rejects                            | Resolves with results      |
| Partial results | Not directly returned on rejection | Available                  |
| Best for        | All operations required            | Partial failure acceptable |

Senior-level decision:

```text
Are these operations dependent on all succeeding?
```

If yes:

```text
Promise.all()
```

If independent:

```text
Promise.allSettled()
```

may better represent your UI and failure requirements.

---

# 19. `Promise.race`

Consider:

```js
const result =
  await Promise.race([
    fetchData(),
    timeoutPromise()
  ]);
```

The first Promise to settle determines the result.

Conceptually:

```text
fetchData() ──────┐
                  ├── First to settle wins
timeoutPromise() ─┘
```

A common pattern is timeout logic.

Example concept:

```js
function timeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error("Request timed out")
      );
    }, ms);
  });
}
```

Then:

```js
await Promise.race([
  fetchData(),
  timeout(5000)
]);
```

But there is an important production issue:

> **Winning the race does not automatically cancel the losing operation.**

If the timeout rejects first, the original request may still continue unless you explicitly cancel it.

Modern frontend code often uses:

```text
AbortController
```

for cancellation, which we will connect to API reliability in Part 5.

---

# 20. Unhandled Promise Rejections

Consider:

```js
async function loadData() {
  throw new Error("Failure");
}

loadData();
```

You created a rejected Promise without handling it.

Conceptually:

```text
Async operation
      ↓
Rejected Promise ❌
      ↓
No .catch()
No await/catch
      ↓
Unhandled rejection
```

Unhandled rejections are serious because they represent failures with no defined recovery path.

The exact runtime behavior and reporting can vary by environment, but your engineering rule should be simple:

> **Every Promise that can reject should have a deliberate error-handling strategy at an appropriate boundary.**

That does **not** mean every function needs its own `.catch()`.

Propagation is valid.

For example:

```js
async function loadUser() {
  return fetchUser();
}

async function initialize() {
  try {
    await loadUser();
  } catch (error) {
    handleError(error);
  }
}
```

The Promise is handled at the higher boundary.

---

# 21. `try/catch` Around an Async Workflow

A common production pattern:

```js
async function submitForm(data) {
  setSubmitting(true);
  setError(null);

  try {
    const result =
      await submitUser(data);

    showSuccess(result);
  } catch (error) {
    reportError(error);

    setError(
      "Unable to submit the form."
    );
  } finally {
    setSubmitting(false);
  }
}
```

State machine:

```text
Idle
 ↓
Submitting
 │
 ├── Success
 │      ↓
 │   Success state
 │
 └── Failure
        ↓
     Error state
        ↓
      finally
        ↓
Submitting = false
```

This is a clean example of:

```text
await
+
try/catch
+
finally
```

working together.

---

# 22. Multiple Error Boundaries in Async Code

Consider:

```js
async function checkout() {
  try {
    await validateOrder();
  } catch (error) {
    showValidationError(error);
    return;
  }

  try {
    await processPayment();
  } catch (error) {
    showPaymentError(error);
    return;
  }

  try {
    await sendConfirmation();
  } catch (error) {
    reportConfirmationError(error);
  }

  showSuccess();
}
```

Different failures have different consequences.

```text
Validation fails
      ↓
Cannot continue


Payment fails
      ↓
Cannot continue


Confirmation fails
      ↓
Order may still be successful
```

This is much better than:

```js
try {
  await validateOrder();
  await processPayment();
  await sendConfirmation();
} catch (error) {
  showError();
}
```

if those failures require different recovery behavior.

---

# 23. Async Errors Can Be Lost

Consider:

```js
async function saveUser() {
  try {
    await updateDatabase();
  } catch (error) {
    console.error(error);
  }
}
```

The error is logged.

But then:

```js
await saveUser();

showSuccess();
```

The caller sees successful completion because the inner function swallowed the error.

Flow:

```text
updateDatabase() fails
       ↓
catch logs error
       ↓
saveUser resolves normally ❌
       ↓
Caller assumes success
```

If the caller needs to know about failure:

```js
async function saveUser() {
  try {
    await updateDatabase();
  } catch (error) {
    console.error(error);

    throw error;
  }
}
```

Or simply:

```js
async function saveUser() {
  await updateDatabase();
}
```

Then the caller can handle it.

This is a major architectural lesson:

> **Logging an error is not the same as handling the application's failure state.**

---

# 24. `catch` in Promise Chains Can Also Swallow Errors

Example:

```js
fetchUser()
  .then(processUser)
  .catch((error) => {
    console.error(error);
  })
  .then(() => {
    showSuccess();
  });
```

Potential problem:

```text
fetchUser fails
      ↓
catch logs it
      ↓
catch resolves normally
      ↓
Next then executes
      ↓
showSuccess() ❌
```

The chain continues because the `.catch()` returned successfully.

If failure should stop the success path:

```js
fetchUser()
  .then(processUser)
  .then(showSuccess)
  .catch(handleError);
```

Or rethrow after partial handling:

```js
.catch((error) => {
  reportError(error);

  throw error;
});
```

Understanding Promise chains as **value and failure propagation pipelines** is essential.

---

# 25. Async Error Boundary Architecture

A strong frontend architecture often looks like:

```text
UI Event
   ↓
Mutation / Action
   ↓
Service
   ↓
API Client
   ↓
Network
```

Failure travels upward:

```text
Network Error
   ↑
API Client normalizes
   ↑
Service adds domain context
   ↑
Action decides recovery
   ↑
UI displays appropriate state
```

Example:

```text
fetch failed
     ↓
NetworkError
     ↓
UserUpdateError
     ↓
Form state = error
     ↓
"Unable to save changes"
```

This connects directly to the error taxonomy from Part 3.

---

# 26. Async Function Failure Model

A useful mental model:

```text
async function
│
├── return value
│      ↓
│   Promise fulfilled
│
├── return Promise
│      ↓
│   Adopts that Promise's outcome
│
└── throw error
       ↓
   Promise rejected
```

Example:

```js
async function example(type) {
  if (type === "success") {
    return "Success";
  }

  if (type === "promise") {
    return Promise.resolve("Success");
  }

  throw new Error("Failure");
}
```

Conceptually:

```text
success
   ↓
Fulfilled Promise


promise
   ↓
Fulfilled Promise


throw
   ↓
Rejected Promise
```

---

# 27. Prediction Challenge #1

What happens?

```js
async function getData() {
  throw new Error("Failure");
}

async function run() {
  try {
    getData();

    console.log("Success");
  } catch (error) {
    console.log("Caught");
  }
}
```

Result:

```text
"Success"
```

Why?

Because:

```js
getData();
```

returns a rejected Promise.

It was not awaited.

Therefore:

```text
try
 ↓
getData()
 ↓
Promise returned
 ↓
console.log("Success")
 ↓
try completes
```

The rejection is separate from that synchronous path.

Correct:

```js
try {
  await getData();

  console.log("Success");
} catch (error) {
  console.log("Caught");
}
```

Now:

```text
Caught
```

---

# 28. Prediction Challenge #2

What happens?

```js
async function save() {
  try {
    await Promise.reject(
      new Error("Failure")
    );
  } catch (error) {
    console.log("Handled");
  }

  console.log("Continue");
}
```

Output:

```text
Handled
Continue
```

Because the error was handled locally.

The function continues normally afterward.

If continuing is unsafe:

```js
catch (error) {
  console.log("Handled");

  return;
}
```

or:

```js
catch (error) {
  throw error;
}
```

may be more appropriate.

---

# 29. Prediction Challenge #3

What happens?

```js
async function save() {
  try {
    await saveUser();
  } catch (error) {
    console.error(error);
  }
}

await save();

showSuccess();
```

If `saveUser()` fails:

```text
Error logged
      ↓
save() completes successfully
      ↓
showSuccess() executes ❌
```

Because the error was swallowed.

A correct design depends on whether `save()` owns recovery.

---

# 30. Senior-Level Async Failure Questions

When writing async code, ask:

```text
1. Does this function return a Promise?

2. Can that Promise reject?

3. Where will rejection be handled?

4. Did I forget await?

5. If I catch this error,
   should the function continue?

6. If I log it,
   should I rethrow it?

7. Are multiple operations dependent?

8. Should they run sequentially or in parallel?

9. If one fails, should all results fail?

10. Is partial success acceptable?

11. Does a timeout actually cancel the operation?

12. Can this operation still update state
    after the user leaves the page?
```

That final question becomes especially important in React applications.

---

# 31. 30-Second Executive Cheat Sheet

```text
ASYNC ERRORS & PROMISE REJECTIONS
════════════════════════════════════

Synchronous:

throw
  ↓
try/catch


Promise:

reject
  ↓
.catch()


async / await:

Promise rejection
      ↓
await
      ↓
try/catch


async function:

return
  ↓
Fulfilled Promise


throw
  ↓
Rejected Promise


Critical mistake:

try {
  asyncOperation();
} catch {}

❌ Does not handle later rejection


Correct:

try {
  await asyncOperation();
} catch {}


Parallel operations:

Promise.all()
=
All required


Promise.allSettled()
=
Partial failure allowed


Senior principle:

Logging a failure does not mean
the calling workflow knows it failed.

Do not swallow errors accidentally.
```

---

# KPI 25 Progress

```text
KPI 25 — Error Handling, Debugging & Reliability
══════════════════════════════════════════════════

Part 1  ✅ Errors, Exceptions & Failure Model
Part 2  ✅ try / catch / finally
Part 3  ✅ Error Propagation & Custom Errors
Part 4  ✅ Async Errors & Promise Rejections
Part 5  ⏳ API Failure Handling & Retry Strategies
Part 6  ⏳ React Error Boundaries & Recovery
Part 7  ⏳ Logging, Observability & Production Debugging
Part 8  ⏳ Systematic Debugging Methodology
```

**Next: Part 5 — API failure handling, HTTP error normalization, retries, exponential backoff, timeouts, cancellation with `AbortController`, idempotency, and production-safe retry strategies.**