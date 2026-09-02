# KPI 25 — Error Handling, Debugging & Reliability

## Part 3 — Error Propagation, Custom Errors & Error Taxonomy


> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)


Part 2 established **how `try`, `catch`, and `finally` work**.

Now we move from basic syntax to something much more important for real applications:

> **How should errors travel through your application, how should they be classified, and how can each layer add meaning without destroying the original debugging information?**

A small application can survive with:

```js
throw new Error("Something went wrong");
```

A large application cannot rely on one generic error type for everything.

Consider these failures:

```text
User entered an invalid email
User is not authenticated
User is not authorized
Product does not exist
Network request timed out
Server returned 500
API returned invalid JSON
Payment provider failed
Application state is corrupted
```

These failures are not equivalent.

They require different decisions.

---

# 1. What Is Error Propagation?

## Definition

**Error propagation is the process by which an unhandled error travels upward through the execution stack until some code handles it or it reaches the runtime as an unhandled error.**

Example:

```js
function loadDashboard() {
  loadUser();
}

function loadUser() {
  fetchUser();
}

function fetchUser() {
  throw new Error("Network failure");
}

loadDashboard();
```

Execution:

```text
loadDashboard()
       ↓
loadUser()
       ↓
fetchUser()
       ↓
Error thrown ❌
       ↑
loadUser()
       ↑
loadDashboard()
       ↑
Unhandled error
```

The error travels **upward**.

---

# 2. Errors Do Not Automatically Stop at Function Boundaries

Consider:

```js
function third() {
  throw new Error("Failure");
}

function second() {
  third();
}

function first() {
  second();
}

try {
  first();
} catch (error) {
  console.log(error.message);
}
```

The `catch` does not need to exist inside:

```text
third()
```

The execution path is:

```text
first()
  ↓
second()
  ↓
third()
  ↓
throw ❌
  ↑
second()
  ↑
first()
  ↑
catch
```

This is the foundation of layered error architecture.

A low-level function can report:

```text
"What happened technically?"
```

A higher-level layer can decide:

```text
"What does this mean for the application?"
```

And the UI can decide:

```text
"What should the user see?"
```

---

# 3. Error Propagation Is Not the Same as Error Handling

Consider:

```js
function fetchUser() {
  throw new Error("Request failed");
}
```

This function creates an error.

But it does not handle it.

The error propagates.

Now:

```js
function loadUser() {
  try {
    fetchUser();
  } catch (error) {
    return null;
  }
}
```

Now `loadUser()` handles the error.

Conceptually:

```text
Error creation
      ↓
Error propagation
      ↓
Error boundary
      ↓
Error handling
```

These are separate responsibilities.

---

# 4. Why Catching Too Early Can Be a Problem

Suppose your API layer does this:

```js
async function getUser() {
  try {
    const response = await fetch("/api/user");

    return await response.json();
  } catch {
    return null;
  }
}
```

Now the caller receives:

```text
null
```

But why?

Was it:

```text
Network failure?
Server error?
Invalid JSON?
Request aborted?
Authentication failure?
```

The original failure information is gone.

This is called **information loss**.

A better design may be:

```js
async function getUser() {
  const response = await fetch("/api/user");

  return response.json();
}
```

Or, if this layer adds meaningful context:

```js
async function getUser() {
  try {
    const response = await fetch("/api/user");

    return await response.json();
  } catch (error) {
    throw new Error(
      "Failed to fetch user",
      {
        cause: error
      }
    );
  }
}
```

Now:

```text
Application-level context
        ↓
"Failed to fetch user"

Original technical cause
        ↓
Network failure / parsing failure / etc.
```

---

# 5. Error Translation Across Layers

A mature application often translates errors between layers.

Consider:

```text
Browser fetch()
      ↓
TypeError: Failed to fetch
      ↓
API client
      ↓
NetworkError
      ↓
User service
      ↓
UserLoadError
      ↓
UI
      ↓
"Unable to load your profile"
```

Each layer understands a different abstraction.

---

## Infrastructure Layer

May understand:

```text
HTTP
Timeout
Network
JSON parsing
```

---

## Domain/Application Layer

May understand:

```text
User
Order
Payment
Authentication
```

---

## UI Layer

May understand:

```text
Can user retry?
Can user continue?
What message should appear?
```

The UI should generally not need to decide what:

```text
ECONNRESET
```

means.

The infrastructure layer can normalize that failure into something meaningful.

---

# 6. What Is a Custom Error?

## Definition

A **custom error is an application-defined error type used to represent a specific category of failure.**

Basic example:

```js
class ValidationError extends Error {
  constructor(message) {
    super(message);

    this.name = "ValidationError";
  }
}
```

Usage:

```js
throw new ValidationError(
  "Email is invalid"
);
```

Now you can distinguish:

```js
try {
  validateEmail(email);
} catch (error) {
  if (error instanceof ValidationError) {
    showValidationMessage(error.message);
  }
}
```

This is more expressive than:

```js
if (error.message === "Email is invalid")
```

Never build error logic around fragile message comparisons.

---

# 7. Why `instanceof` Can Be Useful

Suppose:

```js
class ValidationError extends Error {}
class AuthenticationError extends Error {}
class NetworkError extends Error {}
```

Then:

```js
try {
  await login(credentials);
} catch (error) {
  if (error instanceof ValidationError) {
    showValidationError();
  } else if (
    error instanceof AuthenticationError
  ) {
    showLoginError();
  } else if (
    error instanceof NetworkError
  ) {
    showNetworkError();
  } else {
    showGenericError();
  }
}
```

Conceptually:

```text
Error
 │
 ├── ValidationError
 │       ↓
 │   Correct input
 │
 ├── AuthenticationError
 │       ↓
 │   Login problem
 │
 ├── NetworkError
 │       ↓
 │   Retry
 │
 └── Unknown error
         ↓
      Generic fallback
```

The error type becomes part of your application's control and recovery model.

---

# 8. The Error Hierarchy

Custom errors can form a hierarchy.

Example:

```text
Error
 │
 └── AppError
       │
       ├── ValidationError
       │
       ├── NetworkError
       │
       ├── AuthenticationError
       │
       ├── AuthorizationError
       │
       └── NotFoundError
```

You could define:

```js
class AppError extends Error {
  constructor(message, options = {}) {
    super(message, options);

    this.name = "AppError";
  }
}
```

Then:

```js
class ValidationError extends AppError {
  constructor(message, options) {
    super(message, options);

    this.name = "ValidationError";
  }
}
```

And:

```js
class NetworkError extends AppError {
  constructor(message, options) {
    super(message, options);

    this.name = "NetworkError";
  }
}
```

Now:

```js
error instanceof AppError
```

can represent:

```text
Any known application error
```

while:

```js
error instanceof ValidationError
```

represents a more specific category.

---

# 9. Avoid Creating a Custom Error for Everything

This would be excessive:

```text
EmailTooShortError
EmailTooLongError
EmailMissingAtSymbolError
EmailContainsInvalidCharacterError
```

Sometimes a single:

```text
ValidationError
```

with structured metadata is better.

Example:

```js
class ValidationError extends Error {
  constructor(message, fields) {
    super(message);

    this.name = "ValidationError";
    this.fields = fields;
  }
}
```

Usage:

```js
throw new ValidationError(
  "Form validation failed",
  {
    email: "Invalid email format",
    password: "Password is too short"
  }
);
```

The goal is not:

```text
Maximum number of error classes
```

The goal is:

> **A useful failure taxonomy that supports different handling and recovery decisions.**

---

# 10. What Is an Error Taxonomy?

## Definition

An **error taxonomy is a structured classification system for the different categories of failures in an application.**

Example:

```text
Application Errors
│
├── Validation
│
├── Authentication
│
├── Authorization
│
├── Not Found
│
├── Conflict
│
├── Network
│
├── Timeout
│
├── Server
│
└── Unexpected
```

Each category can have different behavior.

| Error Category | Typical Response          |
| -------------- | ------------------------- |
| Validation     | Ask user to correct input |
| Authentication | Request login             |
| Authorization  | Show permission state     |
| Not Found      | Show missing resource UI  |
| Network        | Allow retry               |
| Timeout        | Retry or show timeout     |
| Server         | Show fallback             |
| Unexpected     | Report + isolate          |

This is much stronger than:

```text
catch → "Something went wrong"
```

---

# 11. Error Code vs Error Message

Do not rely exclusively on:

```text
"User not found"
```

for application logic.

Messages can change.

Instead, consider a stable code:

```js
class AppError extends Error {
  constructor(message, code) {
    super(message);

    this.name = "AppError";
    this.code = code;
  }
}
```

Example:

```js
throw new AppError(
  "User not found",
  "USER_NOT_FOUND"
);
```

Then:

```js
if (error.code === "USER_NOT_FOUND") {
  showNotFoundPage();
}
```

Conceptually:

```text
Code
=
Machine-oriented stable classification


Message
=
Human-readable explanation
```

This distinction becomes especially valuable across API boundaries.

---

# 12. A Better Application Error Structure

For larger applications, an error may contain:

```text
name
message
code
cause
metadata
```

Example:

```js
class AppError extends Error {
  constructor(
    message,
    {
      code,
      cause,
      metadata
    } = {}
  ) {
    super(message, { cause });

    this.name = "AppError";
    this.code = code;
    this.metadata = metadata;
  }
}
```

Usage:

```js
throw new AppError(
  "Failed to load product",
  {
    code: "PRODUCT_LOAD_FAILED",
    cause: originalError,
    metadata: {
      productId: 123
    }
  }
);
```

Conceptually:

```text
AppError
│
├── message
│
├── code
│
├── cause
│     ↓
│  Original Error
│
└── metadata
       ↓
    productId
```

This provides useful diagnostic context without forcing every caller to understand low-level implementation details.

---

# 13. Preserve the Original Cause

Consider:

```js
try {
  await fetchProduct();
} catch (error) {
  throw new Error(
    "Product loading failed"
  );
}
```

The higher-level message is useful.

But the original error may contain important information.

For example:

```text
Original:
Network connection failed

New:
Product loading failed
```

Without preserving the original error, debugging becomes harder.

A better approach:

```js
try {
  await fetchProduct();
} catch (error) {
  throw new Error(
    "Product loading failed",
    {
      cause: error
    }
  );
}
```

Now:

```text
Product loading failed
        │
        └── caused by
              │
              ▼
        Original failure
```

This creates an **error chain**.

---

# 14. Context Should Be Added at the Correct Layer

Imagine:

```text
fetch()
  ↓
Request failed
```

The API layer may know:

```text
GET /products/123 failed
```

The domain layer may know:

```text
Product 123 could not be loaded
```

The page may know:

```text
Product page initialization failed
```

Each layer can add context.

Conceptually:

```text
Page Error
    │
    └── cause
          │
          ▼
     Product Error
          │
          └── cause
                │
                ▼
            API Error
```

This is useful when the added context changes the abstraction or helps debugging.

Do not wrap errors repeatedly without a reason.

---

# 15. The Error Wrapping Anti-Pattern

Bad:

```js
try {
  await operation();
} catch (error) {
  throw new Error("Failed");
}
```

Then another layer:

```js
try {
  await service();
} catch (error) {
  throw new Error("Failed");
}
```

Eventually:

```text
Failed
  ↓
Failed
  ↓
Failed
```

You have lost meaning.

Better:

```text
API request failed
      ↓
Product load failed
      ↓
Dashboard initialization failed
```

Each layer should add **specific contextual information**.

---

# 16. When Should You Rethrow the Same Error?

Example:

```js
try {
  await saveUser();
} catch (error) {
  reportError(error);

  throw error;
}
```

This means:

```text
This layer observes the failure
but does not own final recovery.
```

The error continues upward.

Conceptually:

```text
Error
 ↓
Catch
 ↓
Log / observe
 ↓
Rethrow
 ↓
Higher boundary handles recovery
```

This can be appropriate.

However, avoid logging the same error at every layer.

Otherwise production systems may receive:

```text
Same error
× 5 logs
× 5 alerts
```

We will discuss observability in Part 7.

---

# 17. Handling Known Errors, Propagating Unknown Errors

A strong pattern is:

```js
try {
  await operation();
} catch (error) {
  if (error instanceof ValidationError) {
    showValidationError(error);
    return;
  }

  throw error;
}
```

Conceptually:

```text
Error
 │
 ├── Known and recoverable
 │        ↓
 │      Handle
 │
 └── Unknown
          ↓
       Propagate
```

This prevents:

```text
Every unexpected bug
↓
Generic local handling
↓
Debugging information lost
```

---

# 18. Error Normalization

Different systems can produce different error shapes.

For example:

```text
fetch()
Axios
GraphQL client
Third-party SDK
Custom backend
```

may all produce different structures.

Without normalization:

```js
if (error.response?.status === 401) {
  // Axios-style
}
```

Elsewhere:

```js
if (error.statusCode === 401) {
  // Custom API
}
```

Elsewhere:

```js
if (error.extensions?.code === "UNAUTHENTICATED") {
  // GraphQL
}
```

This leaks infrastructure details throughout the application.

A better architecture:

```text
External Error
      ↓
Normalization Layer
      ↓
Application Error
      ↓
Application/UI
```

Example:

```js
function normalizeError(error) {
  if (error.status === 401) {
    return new AuthenticationError(
      "Authentication required",
      {
        cause: error
      }
    );
  }

  return new AppError(
    "Unexpected application error",
    {
      cause: error
    }
  );
}
```

Now the rest of the application deals with a consistent failure model.

---

# 19. Error Translation Example

Suppose the server returns:

```text
HTTP 404

{
  "message": "Product does not exist"
}
```

Your API layer may transform this into:

```js
throw new NotFoundError(
  "Product not found",
  {
    code: "PRODUCT_NOT_FOUND"
  }
);
```

Then the UI does:

```js
try {
  await getProduct(id);
} catch (error) {
  if (error instanceof NotFoundError) {
    renderNotFoundPage();
  }
}
```

The UI does not need to know:

```text
HTTP 404
Response parsing
Server payload shape
```

That complexity belongs lower in the architecture.

---

# 20. Error Boundaries Should Match Recovery Boundaries

This principle is important:

> **Catch errors where you can make a meaningful recovery decision.**

Example:

```text
Function A
Function B
Function C
```

If Function C cannot recover:

```text
Do not catch just to log and hide.
```

If Function B understands the failure:

```text
Catch and transform.
```

If Function A controls the UI:

```text
Catch and display recovery state.
```

Conceptually:

```text
Low level
   ↓
Technical failure
   ↓
Propagate

Middle layer
   ↓
Add meaning

High level
   ↓
Recover / display / fallback
```

---

# 21. Example — Product Loading Architecture

Let's build the full flow.

## Step 1 — API Layer

```js
async function fetchProduct(id) {
  const response =
    await fetch(`/api/products/${id}`);

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}`
    );
  }

  return response.json();
}
```

This knows about:

```text
HTTP
```

---

## Step 2 — Service Layer

```js
class ProductNotFoundError extends Error {
  constructor(message, options) {
    super(message, options);

    this.name =
      "ProductNotFoundError";
  }
}

async function getProduct(id) {
  try {
    return await fetchProduct(id);
  } catch (error) {
    if (error.message === "HTTP 404") {
      throw new ProductNotFoundError(
        "Product does not exist",
        {
          cause: error
        }
      );
    }

    throw error;
  }
}
```

Conceptually:

```text
HTTP 404
   ↓
ProductNotFoundError
```

The service translates transport meaning into domain meaning.

**Note:** In a production implementation, relying on `error.message === "HTTP 404"` is fragile. A structured HTTP error with a `status` property is better. The example is showing the transformation concept.

---

## Step 3 — UI Layer

```js
try {
  const product =
    await getProduct(id);

  renderProduct(product);
} catch (error) {
  if (
    error instanceof ProductNotFoundError
  ) {
    renderNotFound();
  } else {
    renderGenericError();
  }
}
```

The UI receives a meaningful application-level failure.

---

# 22. Metadata Should Support Debugging, Not Replace Design

You may attach useful metadata:

```js
throw new AppError(
  "Failed to update user",
  {
    code: "USER_UPDATE_FAILED",
    metadata: {
      userId,
      operation: "updateUser"
    }
  }
);
```

This can help answer:

```text
Which user operation failed?
Which resource was involved?
What feature produced the error?
```

But be careful.

Do not put sensitive data into errors just because logging systems can capture them.

Avoid unnecessarily storing or transmitting:

```text
Passwords
Tokens
Authentication headers
Private user data
Sensitive payment information
```

Error metadata should be deliberate.

---

# 23. Error Classes vs Result Objects

Not every failure needs an exception.

Consider validation:

```js
function validateEmail(email) {
  if (!email.includes("@")) {
    return {
      valid: false,
      error: "Invalid email"
    };
  }

  return {
    valid: true
  };
}
```

This models validation as a normal outcome.

Another design:

```js
function validateEmail(email) {
  if (!email.includes("@")) {
    throw new ValidationError(
      "Invalid email"
    );
  }
}
```

Which is correct?

It depends on the contract.

If invalid user input is an expected result:

```text
Result object
```

may be clearer.

If the function requires valid input as a strict precondition:

```text
Exception
```

may be appropriate.

Senior engineering means selecting the right control-flow model, not automatically throwing errors everywhere.

---

# 24. A Practical Error Taxonomy for Frontend Applications

A useful starting structure:

```text
AppError
│
├── ValidationError
│     └── User can correct input
│
├── AuthenticationError
│     └── User may need to log in
│
├── AuthorizationError
│     └── User lacks permission
│
├── NotFoundError
│     └── Resource does not exist
│
├── ConflictError
│     └── State conflict / duplicate action
│
├── NetworkError
│     └── Connection or transport failure
│
├── TimeoutError
│     └── Operation took too long
│
├── ServerError
│     └── Remote system failure
│
└── UnexpectedError
      └── Unknown / programming failure
```

You should adapt this to the application's domain.

For example, an e-commerce system may need:

```text
InventoryError
CheckoutError
PaymentError
CouponError
```

A generic SaaS dashboard may need:

```text
SubscriptionError
WorkspaceError
PermissionError
```

The taxonomy should reflect **meaningful recovery differences**, not arbitrary naming.

---

# 25. Prediction Challenge #1

What happens?

```js
function lowLevel() {
  throw new Error("Failure");
}

function middleLevel() {
  lowLevel();
}

function topLevel() {
  try {
    middleLevel();
  } catch (error) {
    console.log("Handled");
  }
}

topLevel();
```

Answer:

```text
lowLevel()
    ↓
throw ❌
    ↑
middleLevel()
    ↑
topLevel()
    ↓
catch
    ↓
Handled
```

---

# 26. Prediction Challenge #2

What is wrong with this?

```js
try {
  await loadUser();
} catch {
  return null;
}
```

It may hide important failure information.

Now the caller cannot distinguish:

```text
Network failure
Authentication failure
Server failure
Unexpected programming failure
```

Returning `null` is only correct if all these failures are intentionally equivalent to:

```text
"No user"
```

Usually they are not.

---

# 27. Prediction Challenge #3

Which is stronger?

```js
if (
  error.message ===
  "User not found"
) {
}
```

or:

```js
if (
  error instanceof NotFoundError
) {
}
```

Usually the second.

Why?

Because messages are primarily human-readable.

Error types represent classification.

For stable cross-boundary behavior, an explicit code can also be useful:

```js
if (
  error.code ===
  "USER_NOT_FOUND"
) {
}
```

---

# 28. Senior Interview Gotchas

### Gotcha 1

> "You should always catch errors as close as possible to where they occur."

Not necessarily.

Catch them where meaningful recovery or transformation can happen.

---

### Gotcha 2

> "Every error should have its own custom class."

No.

Create distinctions that matter to handling, recovery, observability, or domain semantics.

---

### Gotcha 3

> "A caught error is resolved."

No.

It may be:

```text
Handled
Transformed
Rethrown
Logged
Ignored
```

Catching only changes who currently controls the failure.

---

### Gotcha 4

> "Returning `null` is safer than throwing."

Not automatically.

It can hide failure causes and force callers to guess whether:

```text
No data exists
```

or:

```text
The operation failed.
```

---

### Gotcha 5

> "Error messages are good identifiers."

No.

Messages change and may be localized or rewritten.

Prefer:

```text
Error class
Stable error code
Structured metadata
```

for programmatic decisions.

---

# 29. Senior-Level Design Checklist

When designing an error model, ask:

```text
1. What categories of failure exist?

2. Which failures are expected?

3. Which failures are exceptional?

4. Which layer first understands the failure?

5. Which layer can recover?

6. Should this error propagate?

7. Should it be transformed?

8. Should the original cause be preserved?

9. Does the application need a stable error code?

10. What metadata is useful for debugging?

11. Could metadata expose sensitive information?

12. Will this taxonomy help recovery,
   or just create unnecessary classes?
```

---

# 30. 30-Second Executive Cheat Sheet

```text
ERROR PROPAGATION & CUSTOM ERRORS
══════════════════════════════════════

Error propagation:

Low-level function throws
          ↓
Error moves upward
          ↓
Layer can:

Handle
Transform
Rethrow


Custom Error:

class ValidationError extends Error {}


Useful error structure:

name
message
code
cause
metadata


Error taxonomy:

Validation
Authentication
Authorization
Not Found
Conflict
Network
Timeout
Server
Unexpected


Core architecture:

Infrastructure Error
        ↓
Normalize
        ↓
Application Error
        ↓
Recover at meaningful boundary


Senior principle:

Catch errors where meaningful
recovery or transformation is possible.

Do not catch errors merely to hide them.
```

---

# KPI 25 Progress

```text
KPI 25 — Error Handling, Debugging & Reliability
══════════════════════════════════════════════════

Part 1  ✅ Errors, Exceptions & Failure Model
Part 2  ✅ try / catch / finally
Part 3  ✅ Error Propagation & Custom Errors
Part 4  ⏳ Async Errors & Promise Rejections
Part 5  ⏳ API Failure Handling & Retry Strategies
Part 6  ⏳ React Error Boundaries & Recovery
Part 7  ⏳ Logging, Observability & Production Debugging
Part 8  ⏳ Systematic Debugging Methodology
```

**Next: Part 4 — Async errors, Promise rejection mechanics, `async/await`, unhandled rejections, and the precise difference between synchronous exceptions and asynchronous failures.**