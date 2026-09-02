# KPI 25 — Error Handling, Debugging & Reliability

## Part 5 — API Failure Handling, Retries, Timeouts, Cancellation & Production-Safe Requests


> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)


Part 4 established how asynchronous failures propagate through Promises.

Now we apply that model to one of the most common sources of frontend failures:

```text
Network requests
API failures
Slow servers
Lost connections
Timeouts
Cancelled requests
Duplicate submissions
Retry behavior
```

The key senior-level principle is:

> **An API request failing does not automatically tell you what recovery strategy is correct.**

A `404`, a `401`, a network disconnect, and a `500` are all failures—but retrying them all would be bad engineering.

---

# 1. The API Failure Model

When a frontend makes a request:

```text
Frontend
   ↓
Browser / Network
   ↓
Server
   ↓
Application
   ↓
Database / Services
```

Failure can occur at multiple levels.

```text
Request Failure
│
├── Client-side failure
│
├── Network failure
│
├── Timeout
│
├── HTTP failure response
│
├── Invalid response
│
└── Application-level failure
```

These should not all be treated identically.

---

# 2. `fetch()` Does Not Reject for HTTP 404 or 500

This is one of the most important frontend API concepts.

Consider:

```js
const response = await fetch("/api/user/123");
```

If the server returns:

```text
404 Not Found
```

`fetch()` generally resolves successfully with a `Response` object.

Therefore:

```js
try {
  const response = await fetch("/api/user/123");

  console.log("Success");
} catch (error) {
  console.log("Failure");
}
```

A `404` does not automatically enter `catch`.

Why?

Because from the browser's perspective:

```text
Network communication succeeded.

Server responded.

HTTP response received.
```

The HTTP response may represent an unsuccessful **application request**, but the transport itself completed.

You must inspect:

```js
response.ok
```

Example:

```js
const response = await fetch("/api/user/123");

if (!response.ok) {
  throw new Error(
    `Request failed: ${response.status}`
  );
}
```

Now:

```text
404
 ↓
response.ok = false
 ↓
throw
 ↓
catch can handle it
```

---

# 3. Basic Production Request Pattern

A better starting point:

```js
async function fetchUser(id) {
  const response = await fetch(
    `/api/users/${id}`
  );

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  return response.json();
}
```

But this still has problems.

The error only says:

```text
HTTP 404
```

or:

```text
HTTP 500
```

Your application needs structured information.

---

# 4. Creating a Structured HTTP Error

Instead of:

```js
throw new Error("HTTP 404");
```

create something like:

```js
class HttpError extends Error {
  constructor(
    message,
    {
      status,
      code,
      cause
    } = {}
  ) {
    super(message, { cause });

    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}
```

Now:

```js
async function request(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new HttpError(
      `Request failed with status ${response.status}`,
      {
        status: response.status
      }
    );
  }

  return response.json();
}
```

The caller can now make decisions based on:

```js
error.status
```

rather than parsing:

```js
error.message
```

---

# 5. HTTP Status Codes Are Not Just Numbers

A practical frontend classification:

```text
2xx → Success

3xx → Redirect behavior

4xx → Client-side/request-related problem

5xx → Server-side failure
```

For frontend recovery, you need more detail.

---

## `400 Bad Request`

Usually means:

```text
The server cannot process the request
because the request is invalid.
```

Possible response:

```text
Show validation or request error.
```

Usually retrying the exact same request is pointless.

---

## `401 Unauthorized`

Usually means:

```text
Authentication is missing,
expired, or invalid.
```

Possible recovery:

```text
Refresh session
or
Ask user to authenticate again
```

Blind retry:

```text
401
↓
Retry
↓
401
↓
Retry
```

is usually useless.

---

## `403 Forbidden`

The user is authenticated but lacks permission.

Recovery may be:

```text
Show permission UI.
```

Retrying generally does not solve the problem.

---

## `404 Not Found`

The requested resource does not exist.

Recovery:

```text
Show not-found state.
```

Do not automatically retry.

---

## `409 Conflict`

The request conflicts with the current server state.

Example:

```text
Two users edit the same resource.
```

Recovery may require:

```text
Refresh data
Resolve conflict
Ask user to retry intentionally
```

---

## `429 Too Many Requests`

The server is rate limiting requests.

This is one of the cases where retrying **may** be appropriate—but the client should respect server guidance such as a retry delay when provided.

---

## `500`, `502`, `503`, `504`

These represent different server or gateway failures.

A temporary retry may sometimes be reasonable.

But:

> **A retry is not automatically harmless.**

We will examine why shortly.

---

# 6. Network Failure vs HTTP Failure

Consider:

```js
try {
  const response = await fetch("/api/users");
} catch (error) {
  console.log("Network failure");
}
```

The `catch` is more likely to handle failures such as:

```text
Connection unavailable
DNS failure
Request aborted
Certain browser/network failures
```

While:

```text
404
500
503
```

are usually received as HTTP responses.

So your request flow is:

```text
fetch()
   │
   ├── Network-level failure
   │         ↓
   │      Promise rejects
   │
   └── HTTP response received
             ↓
        Inspect response.ok
             │
             ├── true
             │     ↓
             │  Success
             │
             └── false
                    ↓
             Normalize failure
```

This distinction is fundamental.

---

# 7. Error Normalization

Suppose your API produces errors like:

```json
{
  "message": "Email already exists",
  "code": "EMAIL_EXISTS"
}
```

But another endpoint returns:

```json
{
  "error": "Unauthorized"
}
```

And another returns plain text:

```text
Internal Server Error
```

If every component handles these differently, your UI becomes tightly coupled to backend inconsistency.

Instead:

```text
Raw API Response
       ↓
Normalization Layer
       ↓
Consistent Application Error
       ↓
UI / Feature Layer
```

Example:

```js
class ApiError extends Error {
  constructor(
    message,
    {
      status,
      code,
      cause
    } = {}
  ) {
    super(message, { cause });

    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
```

Then:

```js
async function request(url) {
  let response;

  try {
    response = await fetch(url);
  } catch (error) {
    throw new NetworkError(
      "Unable to reach the server",
      {
        cause: error
      }
    );
  }

  if (!response.ok) {
    throw new ApiError(
      "API request failed",
      {
        status: response.status
      }
    );
  }

  return response.json();
}
```

Now your application has a consistent failure contract.

---

# 8. Parsing Error Responses Safely

A common mistake:

```js
const errorData =
  await response.json();
```

You may assume every failed response contains JSON.

But the server could return:

```text
HTML error page
Plain text
Empty response
Proxy-generated error
```

A safer approach:

```js
async function parseError(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
```

Then:

```js
if (!response.ok) {
  const errorData =
    await parseError(response);

  throw new ApiError(
    errorData?.message ??
      "Request failed",
    {
      status: response.status,
      code: errorData?.code
    }
  );
}
```

This prevents your error handling from producing a second error while attempting to understand the first one.

---

# 9. What Should Be Retried?

This is the core retry question:

> **Is this failure likely temporary, and is repeating the operation safe?**

Examples:

| Failure              | Retry?            | Reason                               |
| -------------------- | ----------------- | ------------------------------------ |
| Network interruption | Sometimes         | Temporary failure possible           |
| Timeout              | Sometimes         | Server may recover                   |
| `500`                | Sometimes         | Temporary server issue               |
| `503`                | Often potentially | Service unavailable may be temporary |
| `429`                | Yes, carefully    | Respect retry instructions           |
| `400`                | Usually no        | Request is invalid                   |
| `401`                | Not blindly       | Authentication issue                 |
| `403`                | Usually no        | Permission won't change              |
| `404`                | Usually no        | Resource missing                     |
| Validation error     | No                | User must correct input              |

The word **sometimes** is important.

Senior engineering does not mean:

```text
5xx → retry 3 times
```

without understanding the operation.

---

# 10. Idempotency: The Most Important Retry Concept

## Definition

An operation is **idempotent** when performing it multiple times has the same intended effect as performing it once.

Example:

```text
GET /users/123
```

You can usually repeat it.

Reading the same user multiple times does not create multiple users.

Now consider:

```text
POST /payments
```

Suppose:

```text
Payment request sent
      ↓
Server processes payment
      ↓
Network response lost ❌
      ↓
Frontend thinks request failed
      ↓
Retry
      ↓
Second payment ❌
```

This is dangerous.

Therefore:

> **Retry strategy must consider the operation's side effects.**

---

# 11. Safe vs Unsafe Retry Thinking

Conceptually:

```text
READ
GET /products

Usually safer to retry
```

Versus:

```text
WRITE
POST /orders

May create duplicate side effects
```

However, do not oversimplify this into:

```text
GET = safe
POST = unsafe
```

A `POST` can be made retry-safe with proper server-side idempotency mechanisms.

For example:

```text
Client sends:
Idempotency-Key: abc-123
```

The server recognizes repeated requests with the same key.

Conceptually:

```text
Request 1
Key: abc-123
    ↓
Order created

Request 2
Key: abc-123
    ↓
Same operation recognized
    ↓
Do not create duplicate order
```

This requires backend support.

Frontend retry behavior and backend idempotency are architectural partners.

---

# 12. Fixed Retry Delay

The simplest retry:

```js
async function retry(operation) {
  try {
    return await operation();
  } catch (error) {
    await wait(1000);

    return operation();
  }
}
```

Where:

```js
function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
```

Timeline:

```text
Attempt 1
   ↓ failure
Wait 1 second
   ↓
Attempt 2
```

This works for simple cases, but repeated clients retrying simultaneously can create a problem.

---

# 13. Retry Storms

Imagine:

```text
10,000 clients
```

A service goes down.

All clients do:

```text
Fail
↓
Wait exactly 1 second
↓
Retry together
```

Then:

```text
10,000 retry requests
        ↓
Server receives huge spike
        ↓
Fails again
        ↓
Another synchronized retry
```

This can worsen the outage.

---

# 14. Exponential Backoff

## Definition

**Exponential backoff increases the waiting time between retries.**

Example:

```text
Attempt 1 → immediate

Attempt 2 → wait 1 second

Attempt 3 → wait 2 seconds

Attempt 4 → wait 4 seconds

Attempt 5 → wait 8 seconds
```

Formula:

```text
delay = baseDelay × 2^attempt
```

Example implementation:

```js
function getDelay(attempt) {
  return 1000 * 2 ** attempt;
}
```

Usage:

```js
async function retry(
  operation,
  maxAttempts = 3
) {
  let lastError;

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const isLastAttempt =
        attempt === maxAttempts - 1;

      if (isLastAttempt) {
        throw error;
      }

      const delay =
        1000 * 2 ** attempt;

      await wait(delay);
    }
  }

  throw lastError;
}
```

---

# 15. What Is Jitter?

If every client uses the exact same exponential delay:

```text
1 second
2 seconds
4 seconds
8 seconds
```

they can still retry together.

**Jitter adds randomness to retry delays.**

Conceptually:

```text
Base delay: 4000ms

Client A → 3721ms
Client B → 4183ms
Client C → 3450ms
```

Example:

```js
function getDelay(attempt) {
  const base = 1000 * 2 ** attempt;

  const jitter =
    Math.random() * 500;

  return base + jitter;
}
```

The goal:

```text
Many clients
    ↓
Spread retry attempts
    ↓
Reduce synchronized traffic spikes
```

---

# 16. Retries Must Be Selective

This is a bad abstraction:

```js
async function retryEverything(operation) {
  for (let i = 0; i < 3; i++) {
    try {
      return await operation();
    } catch {
      // retry
    }
  }
}
```

Why?

Because it retries:

```text
400
401
403
404
Validation errors
Programming errors
Network failures
Server failures
```

These do not have the same recovery strategy.

A better concept:

```js
function shouldRetry(error) {
  if (error instanceof NetworkError) {
    return true;
  }

  if (
    error instanceof ApiError &&
    error.status >= 500
  ) {
    return true;
  }

  return false;
}
```

Then:

```js
async function retry(
  operation,
  maxAttempts = 3
) {
  let lastError;

  for (
    let attempt = 0;
    attempt < maxAttempts;
    attempt++
  ) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const isLastAttempt =
        attempt === maxAttempts - 1;

      if (
        isLastAttempt ||
        !shouldRetry(error)
      ) {
        throw error;
      }

      await wait(
        getDelay(attempt)
      );
    }
  }

  throw lastError;
}
```

This connects directly to the error taxonomy from Part 3.

---

# 17. Timeouts

A request may not fail quickly.

It may simply:

```text
Start
 ↓
Remain pending
 ↓
Remain pending
 ↓
Remain pending...
```

A timeout defines:

> **How long the application is willing to wait before considering the operation unsuccessful.**

A basic timeout pattern can use `Promise.race()`:

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
  fetch("/api/users"),
  timeout(5000)
]);
```

But this has a major limitation.

---

# 18. Timeout Does Not Automatically Cancel the Request

Consider:

```text
fetch()
   │
   ├── 5 seconds pass
   │
   └── timeout wins ❌
```

The Promise race ends from your perspective.

But the original network request may still be running.

So:

```text
Timeout ≠ Cancellation
```

This is critical.

---

# 19. `AbortController`

## Definition

`AbortController` provides a mechanism for signalling cancellation to APIs that support an `AbortSignal`.

Example:

```js
const controller =
  new AbortController();

const response = await fetch(
  "/api/users",
  {
    signal: controller.signal
  }
);
```

Later:

```js
controller.abort();
```

Conceptually:

```text
AbortController
      ↓
AbortSignal
      ↓
fetch()
      ↓
Cancellation signal
```

---

# 20. Creating a Real Timeout with `AbortController`

Example:

```js
async function fetchWithTimeout(
  url,
  timeoutMs
) {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

  try {
    const response = await fetch(
      url,
      {
        signal: controller.signal
      }
    );

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

Flow:

```text
Request starts
      ↓
Timer starts
      │
      ├── Request finishes first
      │       ↓
      │   Clear timer
      │
      └── Timer finishes first
              ↓
           abort()
              ↓
        Request cancelled
```

This is generally closer to the intended timeout behavior than merely racing two Promises.

---

# 21. User-Initiated Cancellation

Cancellation is not only for timeouts.

Imagine a search interface:

```text
User types:
"rea"

Request starts
```

Then immediately:

```text
User types:
"react"

New request starts
```

The old request may return later.

Without cancellation:

```text
Request 1 → slow
Request 2 → fast
```

Timeline:

```text
"rea"   ─────────────── response arrives late
"react" ───── response arrives early
```

Now stale data may overwrite current data.

Using cancellation:

```text
Request 1
    ↓
User changes input
    ↓
Abort request 1
    ↓
Start request 2
```

This improves both:

```text
Correctness
+
Resource efficiency
```

---

# 22. Handling Abort Errors Deliberately

An aborted request may not represent a system failure.

Example:

```text
User navigated away
New search replaced old search
Component unmounted
```

These are expected control-flow events.

Therefore:

```js
try {
  await fetchWithTimeout();
} catch (error) {
  if (error.name === "AbortError") {
    return;
  }

  throw error;
}
```

The exact error shape can depend on the API and environment, but the architectural idea is:

> **Do not show users a scary error message for an operation you intentionally cancelled.**

---

# 23. Request State Machine

A frontend request should usually be understood as a state machine.

```text
Idle
 ↓
Loading
 │
 ├── Success
 │
 ├── Error
 │
 └── Cancelled
```

Sometimes:

```text
Idle
 ↓
Loading
 ↓
Retrying
 │
 ├── Success
 └── Failed
```

This is more accurate than only:

```text
loading = true / false
```

Because:

```text
Error
Cancelled
Retrying
```

are meaningfully different states.

---

# 24. Example: A More Complete Request Utility

Here is a conceptual request wrapper:

```js
class ApiError extends Error {
  constructor(
    message,
    {
      status,
      code,
      cause
    } = {}
  ) {
    super(message, { cause });

    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

class NetworkError extends Error {
  constructor(message, options) {
    super(message, options);

    this.name = "NetworkError";
  }
}
```

Request:

```js
async function request(
  url,
  options = {}
) {
  let response;

  try {
    response = await fetch(
      url,
      options
    );
  } catch (error) {
    if (
      error.name === "AbortError"
    ) {
      throw error;
    }

    throw new NetworkError(
      "Network request failed",
      {
        cause: error
      }
    );
  }

  if (!response.ok) {
    let errorData = null;

    try {
      errorData =
        await response.json();
    } catch {}

    throw new ApiError(
      errorData?.message ??
        "Request failed",
      {
        status: response.status,
        code: errorData?.code
      }
    );
  }

  return response.json();
}
```

Then the higher layer decides:

```js
try {
  const user =
    await request("/api/user");
} catch (error) {
  if (
    error instanceof NetworkError
  ) {
    showOfflineMessage();
  } else if (
    error instanceof ApiError &&
    error.status === 401
  ) {
    redirectToLogin();
  } else {
    showGenericError();
  }
}
```

That is the separation we want:

```text
Request layer
↓
Detect + normalize

Feature layer
↓
Interpret

UI layer
↓
Recover + communicate
```

---

# 25. Retry Strategy Architecture

A production retry decision can be modeled like this:

```text
Request fails
      ↓
Classify error
      │
      ├── Permanent failure
      │       ↓
      │     Stop
      │
      ├── Temporary failure
      │       ↓
      │   Is retry safe?
      │       │
      │       ├── No
      │       │    ↓
      │       │  Stop
      │       │
      │       └── Yes
      │            ↓
      │      Attempts remaining?
      │            │
      │            ├── No → Stop
      │            │
      │            └── Yes
      │                 ↓
      │            Backoff + jitter
      │                 ↓
      │               Retry
```

This is much stronger than:

```text
catch → retry()
```

---

# 26. Retry Budget

Another useful concept:

> **Do not retry indefinitely.**

Example:

```text
Maximum attempts: 3
```

or:

```text
Maximum total retry time: 10 seconds
```

Without limits:

```text
Failure
 ↓
Retry
 ↓
Failure
 ↓
Retry forever
```

This wastes resources and can hide outages.

A retry policy should define:

```text
Maximum attempts
Maximum delay
Which errors qualify
Whether operation is safe to repeat
Cancellation behavior
```

---

# 27. Avoid Retrying Programming Errors

Consider:

```js
throw new TypeError(
  "Cannot read properties of undefined"
);
```

Retrying this:

```text
Attempt 1 ❌
Wait 1 second
Attempt 2 ❌
Wait 2 seconds
Attempt 3 ❌
```

does nothing.

This is why:

```text
Error classification
```

must happen before retry.

Retries are for potentially recoverable operational failures—not broken application logic.

---

# 28. Duplicate Submission Problem

Consider:

```js
async function submitOrder() {
  await createOrder();

  showSuccess();
}
```

User clicks the button:

```text
Click
 ↓
Request starts
```

Then clicks again:

```text
Click
 ↓
Second request starts
```

Potential result:

```text
Order 1 created
Order 2 created ❌
```

A frontend should often prevent accidental duplicates:

```text
Idle
 ↓
Submitting
 ↓
Disable duplicate action
```

Conceptually:

```js
if (isSubmitting) {
  return;
}

setIsSubmitting(true);

try {
  await createOrder();
} finally {
  setIsSubmitting(false);
}
```

But frontend prevention alone is not sufficient for critical operations.

Network retries, multiple tabs, and race conditions can still create duplicates.

The backend should provide appropriate idempotency guarantees when required.

---

# 29. Prediction Challenge #1

What happens?

```js
try {
  const response =
    await fetch("/api/user");

  console.log("Success");
} catch {
  console.log("Failure");
}
```

The server returns:

```text
404 Not Found
```

Likely result:

```text
Success
```

because the network request completed and `fetch()` resolved.

You must check:

```js
if (!response.ok) {
  throw new Error("Request failed");
}
```

---

# 30. Prediction Challenge #2

Is this a real cancellation?

```js
await Promise.race([
  fetch("/api/data"),
  timeout(5000)
]);
```

Not necessarily.

It only determines which Promise settles the race first.

The network request may continue.

For cancellation, use a supported mechanism such as:

```text
AbortController
```

---

# 31. Prediction Challenge #3

Should this always retry?

```text
POST /payments
```

No.

Ask:

```text
Could the first request have succeeded
even though the client received an error?
```

If yes, a blind retry may duplicate the side effect.

A safe retry strategy may require backend idempotency support.

---

# 32. Senior-Level API Reliability Checklist

Before implementing request handling, ask:

```text
1. Can this fail at the network level?

2. Can the server return a non-2xx response?

3. How will errors be normalized?

4. Is the error response guaranteed to be JSON?

5. Which failures are recoverable?

6. Which failures should retry?

7. Is retrying this operation safe?

8. Is the operation idempotent?

9. Does the backend support idempotency keys?

10. What is the retry limit?

11. Should backoff and jitter be used?

12. What happens when the request takes too long?

13. Does timeout actually cancel the request?

14. Can the user cancel the operation?

15. Can stale requests update current UI state?

16. Can duplicate user actions create duplicate side effects?
```

---

# 33. 30-Second Executive Cheat Sheet

```text
API FAILURE HANDLING
══════════════════════════════════════

fetch()

Network failure
    ↓
Promise rejects
    ↓
catch


HTTP 404 / 500

fetch resolves
    ↓
response.ok = false
    ↓
Manually normalize failure


Retry only when:

Failure may be temporary
+
Operation is safe to repeat


Never blindly retry:

400
401
403
404
Validation errors
Programming errors


Retry strategy:

Classify
↓
Check safety
↓
Retry budget
↓
Exponential backoff
↓
Jitter
↓
Retry


Timeout:

Timeout ≠ cancellation


AbortController:

AbortSignal
↓
fetch()
↓
Actual cancellation


Critical concept:

Retry safety depends on idempotency.
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
Part 5  ✅ API Failure Handling & Retry Strategies
Part 6  ⏳ React Error Boundaries & Recovery
Part 7  ⏳ Logging, Observability & Production Debugging
Part 8  ⏳ Systematic Debugging Methodology
```

**Next: Part 6 — React Error Boundaries, rendering failures, event-handler and async limitations, Suspense interaction, fallback UI, recovery, and designing resilient React/Next.js application boundaries.**