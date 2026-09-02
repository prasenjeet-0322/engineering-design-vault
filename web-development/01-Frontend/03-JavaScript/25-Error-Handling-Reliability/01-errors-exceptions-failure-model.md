# KPI 25 — Error Handling, Debugging & Reliability

## Part 1 — Errors, Exceptions & the JavaScript Failure Model


> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)


Up to KPI 24, much of the focus was on:

```text
Correct behavior
Performance
Browser execution
Asynchronous operations
Memory
```

Now the focus changes to:

```text
What happens when things go wrong?
```

A senior frontend engineer does not design only for:

```text
User clicks button
      ↓
API succeeds
      ↓
Correct data arrives
      ↓
UI updates
```

They also design for:

```text
API fails
Network disconnects
Invalid data arrives
Promise rejects
Code throws
User retries
Request times out
Server returns unexpected data
Third-party service fails
```

This KPI builds the **failure model** required to create reliable frontend applications.

---

# 1. What Is an Error?

## Definition

An **error** is a condition in which the program cannot continue executing normally according to its expected behavior.

Example:

```js
const user = null;

console.log(user.name);
```

JavaScript cannot access:

```text
name
```

on:

```text
null
```

So execution produces an error.

Conceptually:

```text
Expected operation
       ↓
Invalid state
       ↓
JavaScript cannot continue normally
       ↓
Error
```

---

# 2. Error vs Bug vs Exception

These terms are related but not identical.

## Bug

A **bug** is a defect in program logic or implementation.

Example:

```js
function calculateTotal(price, quantity) {
  return price - quantity;
}
```

If the intended behavior is multiplication:

```js
price * quantity
```

then the code contains a bug.

---

## Error

An **error** is a failure condition represented during program execution.

Example:

```js
throw new Error("Invalid product");
```

---

## Exception

An **exception** is an error condition that interrupts the normal flow of execution and can potentially be caught and handled.

Example:

```js
try {
  throw new Error("Something failed");
} catch (error) {
  console.log("Handled error");
}
```

Conceptually:

```text
Normal execution
      ↓
Exception occurs
      ↓
Normal flow interrupted
      ↓
Search for handler
      ↓
catch
```

---

# 3. The JavaScript Error Object

JavaScript represents many runtime failures using objects derived from:

```js
Error
```

Example:

```js
const error =
  new Error("Something went wrong");
```

An error commonly contains information such as:

```text
name
message
stack
```

Example:

```js
const error =
  new Error("Failed to load products");

console.log(error.name);
console.log(error.message);
console.log(error.stack);
```

Conceptually:

```text
Error
│
├── name
│
├── message
│
└── stack
```

---

# 4. `error.message`

The message describes the failure.

Example:

```js
throw new Error(
  "User authentication failed"
);
```

Then:

```text
error.message

"User authentication failed"
```

A useful error message should provide meaningful context.

Bad:

```js
throw new Error("Error");
```

Better:

```js
throw new Error(
  "Failed to load user profile"
);
```

Even better depends on the context and audience.

For example, internal logging can contain more technical details than the message shown to the user.

---

# 5. The Stack Trace

## Definition

A **stack trace** shows the sequence of function calls that led to an error.

Example:

```js
function a() {
  b();
}

function b() {
  c();
}

function c() {
  throw new Error("Failure");
}

a();
```

Conceptually:

```text
a()
 ↓
b()
 ↓
c()
 ↓
Error ❌
```

The stack provides debugging context.

It helps answer:

```text
Where did the error happen?

Which functions led to it?

What execution path produced the failure?
```

---

# 6. Major Built-In JavaScript Error Types

JavaScript provides several important error classes.

Conceptually:

```text
Error
│
├── TypeError
├── ReferenceError
├── SyntaxError
├── RangeError
├── URIError
└── others depending on environment
```

You must understand these not just as definitions, but as **categories of failure**.

---

# 7. `TypeError`

## Definition

A `TypeError` occurs when a value is used in a way that is incompatible with its expected type or operation.

Example:

```js
const user = null;

user.name;
```

Conceptually:

```text
Expected:
Object

Received:
null

Operation:
Access property

Result:
TypeError ❌
```

Another example:

```js
const value = 42;

value.map();
```

Numbers do not provide:

```text
map()
```

Therefore:

```text
TypeError
```

Frontend examples:

```js
user.profile.name
```

when:

```text
user = null
```

or:

```js
products.map(...)
```

when:

```text
products
```

is not actually an array.

---

# 8. `ReferenceError`

## Definition

A `ReferenceError` occurs when JavaScript attempts to access an identifier that does not exist in the current scope.

Example:

```js
console.log(userName);
```

If:

```text
userName
```

was never declared:

```text
ReferenceError ❌
```

Conceptually:

```text
JavaScript looks for:

userName
   ↓
Not found
   ↓
ReferenceError
```

Example:

```js
function getUser() {
  return currentUser;
}
```

If:

```text
currentUser
```

does not exist in the accessible scope, execution fails.

---

# 9. `SyntaxError`

## Definition

A `SyntaxError` occurs when JavaScript code violates the language grammar.

Example:

```js
const user = {
  name: "Sunny"
```

Missing:

```text
}
```

JavaScript cannot correctly parse the program.

Conceptually:

```text
Source code
    ↓
Parser
    ↓
Invalid grammar
    ↓
SyntaxError ❌
```

This differs from many runtime errors.

A syntax problem may prevent the affected code from executing correctly at all.

---

# 10. `RangeError`

## Definition

A `RangeError` occurs when a value is outside an acceptable range.

Example:

```js
const array =
  new Array(-1);
```

Negative array length is invalid.

Result:

```text
RangeError
```

Another possible class of range-related failure involves operations exceeding acceptable engine limits.

---

# 11. `URIError`

A `URIError` can occur when URI-related functions receive invalid input.

For example, certain malformed URI operations may fail when using functions such as:

```js
decodeURIComponent()
```

Conceptually:

```text
Encoded URI
      ↓
Malformed input
      ↓
Cannot decode
      ↓
URIError
```

This is less common in everyday frontend code but should be recognized.

---

# 12. Errors Are Objects

This is important.

You can create:

```js
const error =
  new Error("Failed");
```

And inspect it:

```js
console.log(error);
```

You can also attach additional information:

```js
const error =
  new Error("Failed to load product");

error.productId = 123;
```

Although application-level error modeling is usually better handled with deliberate custom error classes or structured error metadata, the key concept is:

> **Errors are values with structured information, not just console messages.**

---

# 13. Throwing Errors

JavaScript allows you to explicitly interrupt normal execution using:

```js
throw
```

Example:

```js
function divide(a, b) {
  if (b === 0) {
    throw new Error(
      "Cannot divide by zero"
    );
  }

  return a / b;
}
```

Conceptually:

```text
divide(10, 0)
      ↓
b === 0
      ↓
throw Error
      ↓
Normal execution stops
```

Without a handler, the error propagates upward.

---

# 14. Error Propagation

Consider:

```js
function loadDashboard() {
  loadUser();
}

function loadUser() {
  fetchUserData();
}

function fetchUserData() {
  throw new Error(
    "User API unavailable"
  );
}

loadDashboard();
```

Conceptually:

```text
fetchUserData()
       ❌
       │
       ↑
loadUser()
       │
       ↑
loadDashboard()
       │
       ↑
Global error boundary
```

The error propagates through the call stack until:

```text
A handler catches it
```

or:

```text
It becomes unhandled
```

This is fundamental to understanding:

```text
try/catch
async errors
Promise rejections
React error boundaries
```

---

# 15. The Difference Between `throw` and `return`

Consider:

```js
function getUser(id) {
  if (!id) {
    return null;
  }

  return fetchUser(id);
}
```

Here:

```text
null
```

represents a normal returned value.

Now:

```js
function getUser(id) {
  if (!id) {
    throw new Error(
      "User ID is required"
    );
  }

  return fetchUser(id);
}
```

Now:

```text
Missing ID
```

is treated as an exceptional failure.

Conceptually:

```text
return
=
Normal control flow


throw
=
Exceptional control flow
```

Choosing between them depends on your API and domain design.

Do not automatically throw for every invalid condition.

---

# 16. When Should You Throw?

A useful mental model:

```text
Can the caller reasonably continue
using a normal return value?
```

If yes:

```text
Return a meaningful result.
```

If the operation cannot fulfill its contract:

```text
Throw or reject with meaningful failure information.
```

Example:

```js
function parseUser(data) {
  if (!data) {
    throw new Error(
      "User data is required"
    );
  }

  return {
    id: data.id,
    name: data.name
  };
}
```

The function contract requires valid user data.

Without it:

```text
Normal result cannot be produced.
```

---

# 17. Avoid Throwing Arbitrary Values

JavaScript technically allows:

```js
throw "Something failed";
```

Or:

```js
throw 404;
```

Or:

```js
throw {
  message: "Failed"
};
```

These work syntactically.

But they create inconsistent error handling.

Prefer:

```js
throw new Error(
  "Something failed"
);
```

Or a custom error type:

```js
class ValidationError extends Error {
  constructor(message) {
    super(message);

    this.name =
      "ValidationError";
  }
}
```

Then:

```js
throw new ValidationError(
  "Email is invalid"
);
```

This gives your failure model structure.

---

# 18. Error Boundaries in the Execution Model

At a high level:

```text
Operation
   ↓
Possible failure
   ↓
Who owns handling?
```

Example:

```text
Low-level function
      ↓
Repository/API layer
      ↓
Application logic
      ↓
UI
```

Not every layer should necessarily:

```text
catch
log
transform
display
```

the same error.

A mature system assigns responsibility.

For example:

```text
API layer
    ↓
Normalize transport error

Domain layer
    ↓
Interpret application failure

UI
    ↓
Display appropriate state
```

We will explore this architecture later in the KPI.

---

# 19. Programmer Errors vs Operational Errors

This distinction is extremely useful.

## Programmer Errors

These result from defects in your code.

Examples:

```text
Calling undefined function
Accessing invalid object
Incorrect assumptions
Broken logic
```

Example:

```js
const user = undefined;

user.name;
```

This usually indicates a bug.

---

## Operational Errors

These are failures that can happen even when the application code is correct.

Examples:

```text
Network unavailable
Server timeout
API returns 500
User loses connection
External service fails
```

Conceptually:

```text
Programmer error

Code assumption
      ↓
Broken ❌


Operational error

Correct code
      ↓
External dependency fails ❌
```

These often require different strategies.

---

# 20. Why This Distinction Matters

Consider:

```text
Server returns HTTP 500
```

The frontend should often handle this.

For example:

```text
Show error state
Allow retry
Log context
```

Now consider:

```text
Developer accidentally calls:

undefined.map()
```

Showing the user:

```text
"Please try again"
```

does not actually fix the underlying programming defect.

A senior engineer asks:

```text
What category of failure is this?

Can the user recover?

Should we retry?

Should we report it?

Is this a bug that needs fixing?
```

---

# 21. Expected vs Unexpected Failures

Another useful distinction:

## Expected Failure

The application anticipates it.

Examples:

```text
Invalid password
Form validation fails
User has no permission
Product not found
```

These may be represented as normal application states.

Example:

```js
{
  success: false,
  reason: "INVALID_PASSWORD"
}
```

---

## Unexpected Failure

Something happened that the application did not expect.

Examples:

```text
Server crashes
Malformed response
Third-party service outage
Unexpected null value
```

These may require:

```text
Error reporting
Fallback UI
Retry
Investigation
```

A senior frontend application should distinguish between:

```text
Expected failure state
```

and:

```text
Unexpected application failure
```

---

# 22. The Happy Path Is Not Enough

Beginner implementation:

```text
Click Login
      ↓
Request succeeds
      ↓
Redirect
```

Reliable implementation:

```text
Click Login
      ↓
Validate input
      ↓
Request starts
      ↓
Loading state
      │
      ├── Success
      │      ↓
      │    Redirect
      │
      ├── Invalid credentials
      │      ↓
      │    Show validation message
      │
      ├── Network failure
      │      ↓
      │    Show retry option
      │
      ├── Server failure
      │      ↓
      │    Show fallback state
      │
      └── Unexpected failure
             ↓
          Log + recover
```

This is the beginning of **reliability engineering on the frontend**.

---

# 23. Failure Is Part of Application State

A common mistake is thinking:

```text
Success
```

is the only meaningful result.

Real UI state often looks like:

```text
Idle
 ↓
Loading
 ├── Success
 └── Failure
```

More detailed:

```text
Request State

Idle
 │
 ▼
Loading
 │
 ├───────────────┐
 ▼               ▼
Success        Failure
                  │
         ┌────────┴─────────┐
         ▼                  ▼
      Recoverable       Fatal
         │
         ▼
        Retry
```

This model becomes critical in React applications.

---

# 24. Basic Error Handling Architecture

A reliable application should think about failures at multiple levels.

```text
Infrastructure
      │
      ▼
Network/API Layer
      │
      ▼
Application Logic
      │
      ▼
Component
      │
      ▼
User Interface
```

Each layer has a different responsibility.

For example:

### API Layer

```text
Did the request fail?
What status code occurred?
Did parsing fail?
```

### Application Layer

```text
What does this failure mean
for the business logic?
```

### UI Layer

```text
What should the user see?
Can they retry?
Can they continue?
```

This separation prevents every component from becoming:

```text
fetch
try/catch
status handling
logging
parsing
retry logic
UI
```

all mixed together.

---

# 25. Example — Poor Error Architecture

```jsx
function ProductPage() {
  const [error, setError] =
    useState(null);

  async function loadProduct() {
    try {
      const response =
        await fetch("/api/product");

      if (!response.ok) {
        throw new Error(
          "Request failed"
        );
      }

      const data =
        await response.json();

      setProduct(data);
    } catch (error) {
      console.error(error);

      setError(
        "Something went wrong"
      );
    }
  }

  // ...
}
```

This is not always wrong.

But as the application grows, repeating this in every component can create:

```text
Duplicated logic
Inconsistent errors
Inconsistent logging
Different retry behavior
Hard-to-maintain components
```

A scalable architecture separates responsibilities.

We will build that model in later parts.

---

# 26. Example — Thinking in Error Boundaries

Instead of asking only:

```text
How do I catch this error?
```

Ask:

```text
Where should this error be handled?
```

Example:

```text
JSON parsing fails
      ↓
Should UI handle raw parsing error?

Probably not.
      ↓
API/data layer may normalize it
      ↓
UI receives meaningful failure state
```

This is a major shift from junior to senior error handling.

---

# 27. Error Handling Is About Recovery

The purpose of handling an error is not always:

```text
console.error(error);
```

The real questions are:

```text
Can we recover?

Can the user retry?

Can we use cached data?

Can we show a fallback?

Can the feature fail without crashing
the entire application?

Should we report this?
```

Conceptually:

```text
Failure
   ↓
Detection
   ↓
Classification
   ↓
Recovery strategy
```

---

# 28. Prediction Challenge #1

What happens here?

```js
function first() {
  second();
}

function second() {
  third();
}

function third() {
  throw new Error("Failure");
}

first();
```

Conceptually:

```text
third() ❌
   ↑
second()
   ↑
first()
```

The error propagates upward until something catches it.

If nothing catches it:

```text
Unhandled error
```

---

# 29. Prediction Challenge #2

What is wrong with this?

```js
throw "User not found";
```

It is valid JavaScript.

But it produces inconsistent error modeling.

Better:

```js
throw new Error(
  "User not found"
);
```

Or, when classification matters:

```js
throw new NotFoundError(
  "User not found"
);
```

---

# 30. Prediction Challenge #3

Which is more appropriate?

```js
return null;
```

or:

```js
throw new Error();
```

There is no universal answer.

Ask:

```text
Is this an expected result?

Can the caller reasonably handle it
as part of normal control flow?

Or has the function failed to fulfill
its contract?
```

---

# 31. Senior-Level Failure Questions

Whenever implementing a feature, ask:

```text
1. What can fail?

2. Is the failure expected or unexpected?

3. Can the user recover?

4. Should we retry?

5. Should this failure propagate?

6. Which layer owns handling it?

7. What should the UI show?

8. Should this be logged?

9. Could this crash unrelated UI?

10. How will we debug it in production?
```

These questions form the foundation of reliable frontend engineering.

---

# 32. 30-Second Executive Cheat Sheet

```text
ERRORS & FAILURE MODEL
════════════════════════════════

Bug
=
Defect in code


Error
=
Failure condition


Exception
=
Failure that interrupts normal flow
and can be handled


Core Error Properties:

name
message
stack


Major Error Types:

Error
TypeError
ReferenceError
SyntaxError
RangeError
URIError


throw
=
Exceptional control flow


return
=
Normal control flow


Failure Categories:

Expected
Unexpected

Programmer error
Operational error


Senior mindset:

Don't ask only:

"How do I catch this?"

Ask:

"Where should this failure
be handled, and how can
the application recover?"
```

---

# KPI 25 Progress

```text
KPI 25 — Error Handling, Debugging & Reliability
══════════════════════════════════════════════════

Part 1  ✅ Errors, Exceptions & Failure Model
Part 2  ⏳ try / catch / finally
Part 3  ⏳ Error Propagation & Custom Errors
Part 4  ⏳ Async Errors & Promise Rejections
Part 5  ⏳ API Failure Handling & Retry Strategies
Part 6  ⏳ React Error Boundaries & Recovery
Part 7  ⏳ Logging, Observability & Production Debugging
Part 8  ⏳ Systematic Debugging Methodology
```

**Next: KPI 25 — Part 2: `try`, `catch`, `finally`, error propagation, and the precise mechanics of handling synchronous failures.**