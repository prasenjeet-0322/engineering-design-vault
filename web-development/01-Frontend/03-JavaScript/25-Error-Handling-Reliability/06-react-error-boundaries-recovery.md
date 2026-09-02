# KPI 25 — Error Handling, Debugging & Reliability

## Part 6 — React Error Boundaries, Recovery & Resilient UI Architecture


> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)


Part 5 focused on **operational failures**:

```text
Network failure
HTTP errors
Timeouts
Retries
Cancellation
```

Now we move to a different category:

> **What happens when your React application itself crashes during rendering?**

A senior frontend engineer must distinguish between:

```text
Expected application failures
```

and:

```text
Unexpected rendering/runtime failures
```

For example:

```text
API returns 404
```

may be an expected state that the UI can model.

But:

```js
user.profile.name
```

when `user.profile` is unexpectedly `undefined` can cause a runtime exception during rendering.

That is where **Error Boundaries** become important.

---

# 1. What Is a React Error Boundary?

## Definition

An **Error Boundary is a React component that catches certain errors occurring in its descendant component tree and renders a fallback UI instead of allowing that part of the application to remain broken.**

Conceptually:

```text
Application
│
├── Header
│
├── Error Boundary
│      │
│      ├── Product Page
│      ├── Product List
│      └── Product Details ❌
│
└── Footer
```

If `Product Details` throws during a supported React rendering phase:

```text
Product Details crashes
        ↓
Error Boundary catches
        ↓
Fallback UI rendered
```

Instead of:

```text
Product Details crashes
        ↓
Potentially breaks larger application tree
```

The Error Boundary creates a **failure containment boundary**.

---

# 2. The Core Problem Error Boundaries Solve

Imagine:

```jsx
function UserProfile({ user }) {
  return (
    <h1>
      {user.profile.name}
    </h1>
  );
}
```

But:

```js
user.profile === undefined;
```

Then rendering can throw:

```text
TypeError:
Cannot read properties of undefined
```

Without an appropriate boundary:

```text
Rendering failure
       ↓
React cannot render that tree normally
       ↓
Application may become unusable
```

With an Error Boundary:

```text
Rendering failure
       ↓
Nearest Error Boundary
       ↓
Fallback UI
```

---

# 3. Error Boundaries Are Not Normal `try/catch`

A common beginner instinct is:

```jsx
try {
  return <UserProfile />;
} catch (error) {
  return <ErrorUI />;
}
```

But this is not how you generally implement React rendering error containment.

React rendering is controlled by React's rendering system.

The conceptual architecture is:

```text
React render tree
       ↓
Component renders
       ↓
Unexpected error
       ↓
React finds nearest Error Boundary
       ↓
Fallback rendered
```

Therefore, Error Boundaries are **framework-level failure boundaries**, not simply arbitrary JavaScript `try/catch` wrappers around JSX.

---

# 4. Traditional Class-Based Error Boundary

The canonical Error Boundary mechanism is a class component.

Example:

```jsx
class ErrorBoundary extends React.Component {
  state = {
    hasError: false
  };

  static getDerivedStateFromError(error) {
    return {
      hasError: true
    };
  }

  componentDidCatch(error, info) {
    console.error(
      "Error caught:",
      error
    );

    console.error(
      "Component stack:",
      info.componentStack
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          Something went wrong.
        </div>
      );
    }

    return this.props.children;
  }
}
```

Usage:

```jsx
<ErrorBoundary>
  <UserProfile />
</ErrorBoundary>
```

Conceptually:

```text
ErrorBoundary
      │
      ▼
 UserProfile
      │
      ▼
   Error ❌
      │
      ▼
getDerivedStateFromError()
      │
      ▼
hasError = true
      │
      ▼
Fallback UI
```

---

# 5. `getDerivedStateFromError`

This lifecycle method allows the boundary to update state after an error occurs.

Example:

```js
static getDerivedStateFromError(error) {
  return {
    hasError: true
  };
}
```

Conceptually:

```text
Error occurs
      ↓
React invokes error-derived state logic
      ↓
Boundary state changes
      ↓
Fallback UI rendered
```

Its responsibility is primarily:

```text
Error
↓
State transition
↓
Fallback rendering
```

For example:

```jsx
render() {
  if (this.state.hasError) {
    return <ErrorFallback />;
  }

  return this.props.children;
}
```

---

# 6. `componentDidCatch`

This method allows the boundary to perform side effects after React catches the error.

Example:

```js
componentDidCatch(error, info) {
  logErrorToService(
    error,
    info
  );
}
```

Important distinction:

```text
getDerivedStateFromError()
        ↓
Determine fallback state


componentDidCatch()
        ↓
Perform side effects
Logging
Monitoring
Diagnostics
```

This separation follows the broader React principle:

> **Rendering determines UI. Side effects perform external work.**

---

# 7. What Errors Can Error Boundaries Catch?

Conceptually, Error Boundaries are designed to catch errors in descendant components during supported React lifecycle/rendering work.

The important categories are:

```text
Rendering
Lifecycle methods
Certain descendant React execution phases
```

For example:

```jsx
function ProductDetails() {
  const product = undefined;

  return (
    <h1>
      {product.name}
    </h1>
  );
}
```

The failure occurs while React attempts to render the component.

That is an appropriate Error Boundary scenario.

---

# 8. What Error Boundaries Do NOT Automatically Catch

This is one of the most important limitations.

Error Boundaries do not replace all error handling.

They generally do not automatically handle every failure occurring in:

```text
Event handlers
Async callbacks
Timers
External asynchronous code
```

Consider:

```jsx
function SaveButton() {
  function handleClick() {
    throw new Error("Save failed");
  }

  return (
    <button onClick={handleClick}>
      Save
    </button>
  );
}
```

The error occurs during an event handler.

You still need normal JavaScript error handling:

```jsx
function SaveButton() {
  function handleClick() {
    try {
      saveData();
    } catch (error) {
      handleError(error);
    }
  }

  return (
    <button onClick={handleClick}>
      Save
    </button>
  );
}
```

For asynchronous operations:

```jsx
async function handleSave() {
  try {
    await saveData();
  } catch (error) {
    setError(
      "Unable to save data"
    );
  }
}
```

The rule is:

```text
Rendering failure
        ↓
Error Boundary


Event failure
        ↓
try/catch or explicit handling


Async request failure
        ↓
Promise rejection handling
```

Do not expect Error Boundaries to replace API error handling.

---

# 9. Error Boundary vs API Error State

Suppose:

```text
GET /products
      ↓
500 Server Error
```

Should the application intentionally throw during rendering just so an Error Boundary catches it?

Usually, no.

The normal flow is:

```text
Request
   ↓
Loading
   │
   ├── Success
   │
   └── Expected failure
          ↓
       Error state
```

Example:

```jsx
function ProductList() {
  const {
    data,
    error,
    isLoading
  } = useProducts();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <ProductLoadError />
    );
  }

  return (
    <Products data={data} />
  );
}
```

This is an **expected failure state**.

An Error Boundary is better reserved for:

```text
Unexpected application failures
Rendering crashes
Programming defects
Unexpected runtime conditions
```

This distinction is critical.

---

# 10. Expected vs Unexpected Failure

A useful architecture:

```text
EXPECTED FAILURE
══════════════════════

API returns:
404
Validation error
401
Empty result

↓

Model as application state

loading
success
error
empty
```

Versus:

```text
UNEXPECTED FAILURE
══════════════════════

Undefined access
Broken component logic
Unexpected runtime exception

↓

Error Boundary
```

Senior frontend code does not treat every failure as a crash.

---

# 11. Where Should You Place Error Boundaries?

A poor architecture:

```jsx
<ErrorBoundary>
  <EntireApplication />
</ErrorBoundary>
```

This is better than nothing, but it can produce:

```text
One small component fails
        ↓
Entire application replaced
        ↓
Huge fallback screen
```

Instead, think about **failure domains**.

Example:

```text
App
│
├── Global Error Boundary
│
├── Dashboard Error Boundary
│     │
│     ├── Analytics
│     ├── Revenue
│     └── Activity
│
├── Sidebar
│
└── Header
```

If the analytics section crashes:

```text
Analytics failure
      ↓
Dashboard fallback
      ↓
Header and Sidebar survive
```

This creates graceful degradation.

---

# 12. Too Many Boundaries Can Also Be Bad

Do not automatically wrap every component:

```jsx
<ErrorBoundary>
  <Button />
</ErrorBoundary>

<ErrorBoundary>
  <Avatar />
</ErrorBoundary>

<ErrorBoundary>
  <Text />
</ErrorBoundary>
```

This can create:

```text
Excessive complexity
Inconsistent recovery
Difficult debugging
Fragmented fallback UI
```

Instead, boundaries should usually align with:

```text
Routes
Pages
Feature modules
Independent widgets
Major application sections
```

Think:

> **If this section fails, what should remain usable?**

That answer helps define the boundary.

---

# 13. Global Boundary vs Local Boundary

A robust architecture often uses multiple levels.

```text
Global Boundary
      │
      ├── Route Boundary
      │       │
      │       └── Feature Boundary
      │
      └── Other Routes
```

Example:

```jsx
<GlobalErrorBoundary>
  <App>
    <RouteErrorBoundary>
      <Dashboard />
    </RouteErrorBoundary>
  </App>
</GlobalErrorBoundary>
```

Failure propagation:

```text
Feature fails
    ↓
Nearest Feature Boundary

Feature boundary fails
    ↓
Route Boundary

Route boundary fails
    ↓
Global Boundary
```

This is analogous to:

```text
try/catch nesting
```

but at the React component tree level.

---

# 14. Designing a Good Fallback UI

This:

```jsx
<div>Error</div>
```

technically works.

But production fallback UI should consider:

```text
What failed?
Can the user recover?
Should they retry?
Should they navigate away?
Will refreshing help?
Could unsaved work be lost?
```

Example:

```jsx
function ErrorFallback({
  error,
  reset
}) {
  return (
    <section>
      <h2>
        Something went wrong
      </h2>

      <p>
        Please try again.
      </p>

      <button onClick={reset}>
        Try again
      </button>
    </section>
  );
}
```

The fallback should match the failure domain.

For example:

```text
Payment failure boundary
```

should not necessarily show the same UI as:

```text
Dashboard analytics failure
```

---

# 15. Recovery: Resetting an Error Boundary

A major question:

> Once `hasError` becomes `true`, how does the boundary recover?

If:

```js
state = {
  hasError: true
};
```

then the boundary will continue rendering its fallback.

One recovery strategy is to reset the state.

Conceptually:

```js
reset = () => {
  this.setState({
    hasError: false
  });
};
```

Then pass it into the fallback.

Example:

```jsx
render() {
  if (this.state.hasError) {
    return (
      <ErrorFallback
        reset={() => {
          this.setState({
            hasError: false
          });
        }}
      />
    );
  }

  return this.props.children;
}
```

Flow:

```text
Component crashes
      ↓
Fallback
      ↓
User clicks Retry
      ↓
Boundary resets
      ↓
Attempts to render children again
```

But there is an important issue.

---

# 16. Recovery Can Cause an Error Loop

Suppose the underlying problem still exists.

```text
Render
  ↓
Crash
  ↓
Fallback
  ↓
Retry
  ↓
Same crash
  ↓
Fallback
```

Therefore:

> **A reset only makes sense if the underlying failure might have changed.**

Examples where retry may help:

```text
Temporary corrupted state
Route change
New props
Reloaded data
Transient dependency failure
```

Examples where retry may not help:

```text
A deterministic programming bug
Accessing undefined every render
Broken component implementation
```

For deterministic bugs, the fallback is primarily **containment**, not recovery.

---

# 17. Reset Based on Changed Inputs

Sometimes the boundary can recover when its context changes.

Example:

```text
Current route: /products/123
                     ↓
Component crashes

User navigates to:

/products/456
```

The previous error state should not necessarily remain forever.

Conceptually:

```text
Error state
   ↓
Relevant input changes
   ↓
Reset boundary
   ↓
Attempt new render
```

This creates a connection between:

```text
Application navigation
```

and:

```text
Error recovery lifecycle
```

---

# 18. Functional Components and Error Boundaries

Most modern React application code uses:

```text
Function components
Hooks
```

But traditional Error Boundary implementation uses a class component.

That does **not** mean your entire application needs class components.

You can use:

```text
Class Error Boundary
        ↓
Wrap
        ↓
Function Components
```

Example:

```jsx
<ErrorBoundary>
  <ModernFeature />
</ErrorBoundary>
```

The architecture remains:

```text
Functional application code
+
Error containment component
```

In practice, modern ecosystems may also provide framework-level or library abstractions around this concept.

The key thing to understand is the underlying failure boundary, not merely a specific package API.

---

# 19. Error Boundaries and React State

Consider:

```jsx
function UserCard({ user }) {
  return (
    <h1>
      {user.name}
    </h1>
  );
}
```

A state update causes:

```text
State update
    ↓
New render
    ↓
Unexpected data shape
    ↓
Render error ❌
```

The Error Boundary can contain that failure.

However, this should not become an excuse to skip validation.

Bad thinking:

```text
Data might be broken.

The Error Boundary will handle it.
```

Better:

```text
Validate or normalize data
       ↓
Model expected missing states
       ↓
Use Error Boundary for unexpected defects
```

Error Boundaries are the **last line of containment**, not your normal control flow.

---

# 20. Error Boundaries and Suspense

Both Suspense and Error Boundaries affect what the user sees when a descendant cannot render normally.

But they represent different conditions.

Conceptually:

```text
Suspense
   ↓
Work is not ready yet


Error Boundary
   ↓
Work failed unexpectedly
```

For example:

```text
Component
│
├── Loading
│      ↓
│   Suspense fallback
│
└── Error
       ↓
    Error fallback
```

This creates two distinct UI states:

```text
Loading ≠ Error
```

That distinction matters.

A loading spinner should not represent a broken application.

And an error screen should not be used for ordinary loading.

---

# 21. A Layered UI State Model

A resilient application may have:

```text
Data State
│
├── Loading
├── Success
├── Empty
└── Expected Error


Application Stability
│
└── Unexpected Runtime Error
        ↓
    Error Boundary
```

Visualized:

```text
                APPLICATION
                     │
        ┌────────────┴────────────┐
        │                         │
   Expected States           Unexpected Crash
        │                         │
        ▼                         ▼
  Normal UI Logic          Error Boundary
```

This separation prevents Error Boundaries from becoming overloaded.

---

# 22. Error Boundaries in Next.js Architecture

In a framework such as Next.js, error handling can exist at multiple levels:

```text
Application
│
├── Route-level failure handling
│
├── Segment-level failure handling
│
├── Component-level boundaries
│
└── Global application failure handling
```

The architectural principle remains:

> **Place recovery boundaries around meaningful failure domains.**

For example:

```text
Dashboard
│
├── Layout
├── Sidebar
├── Analytics
├── Billing
└── Activity
```

If:

```text
Analytics
```

fails, you may want:

```text
Analytics fallback
```

rather than:

```text
Entire application failure screen
```

Framework tooling may simplify the implementation, but you still need to decide:

```text
Where is the boundary?
What should survive?
What should the fallback show?
How does recovery work?
```

---

# 23. Error Boundaries and Logging

An Error Boundary should often do two things:

```text
1. Protect the user experience.
2. Capture diagnostic information.
```

Conceptually:

```text
Component crashes
      ↓
Boundary catches
      ├── Render fallback
      │
      └── Send diagnostics
              ↓
         Monitoring system
```

Useful information may include:

```text
Error message
Error stack
Component stack
Route
Application version
Relevant feature
Environment
```

But be careful:

> **Do not blindly send sensitive user data, tokens, passwords, or private request payloads to logging systems.**

Observability should improve debugging without creating a privacy or security problem.

---

# 24. A Complete Failure Architecture

A senior-level React application can be thought of like this:

```text
USER ACTION
    │
    ▼
EVENT HANDLER
    │
    ├── Validation failure
    │       ↓
    │    UI feedback
    │
    └── Async request
            │
            ├── Network/API failure
            │       ↓
            │    Error state
            │
            └── Unexpected code issue
                    ↓
                May propagate


RENDERING
    │
    ├── Expected states
    │       ↓
    │    Loading / Empty / Error / Success
    │
    └── Unexpected exception
            ↓
       Error Boundary
            ↓
        Fallback UI
            ↓
      Logging / Recovery
```

This is the distinction you should carry into real projects.

---

# 25. Common Mistakes

## Mistake 1 — Using Error Boundaries for API errors

```text
API 404
   ↓
Throw application crash
   ↓
Error Boundary
```

Usually unnecessary.

Better:

```text
404
 ↓
Expected error state
```

---

## Mistake 2 — Assuming Error Boundaries catch event handler errors

```jsx
<button
  onClick={() => {
    throw new Error();
  }}
>
```

The Error Boundary is not your general event-handler `try/catch`.

Handle the failure explicitly.

---

## Mistake 3 — One giant application boundary

```text
Tiny widget crashes
       ↓
Entire application disappears
```

Use meaningful failure domains.

---

## Mistake 4 — Boundary Around Every Component

```text
Component
↓
Boundary
↓
Component
↓
Boundary
↓
Component
↓
Boundary
```

This adds noise without necessarily improving resilience.

---

## Mistake 5 — Fallback With No Recovery

```text
Something went wrong.
```

Ask:

```text
Can the user retry?
Can they navigate away?
Can the boundary reset?
Should they reload?
```

Containment and recovery should both be considered.

---

## Mistake 6 — Swallowing the Error

```js
componentDidCatch(error) {
  console.log(error);
}
```

Logging to the console may help locally but does not provide production observability.

A production system should have an intentional reporting strategy.

---

# 26. Prediction Challenge #1

What handles this failure?

```jsx
function Profile() {
  return (
    <h1>
      {undefined.name}
    </h1>
  );
}
```

This occurs during rendering.

Correct conceptual handler:

```text
Error Boundary
```

---

# 27. Prediction Challenge #2

What handles this?

```jsx
function SaveButton() {
  async function handleClick() {
    await saveUser();
  }

  return (
    <button onClick={handleClick}>
      Save
    </button>
  );
}
```

If:

```js
saveUser()
```

rejects, the primary strategy is:

```text
try/catch
+
Application error state
```

Example:

```jsx
async function handleClick() {
  try {
    await saveUser();
  } catch (error) {
    setError(
      "Unable to save user"
    );
  }
}
```

---

# 28. Prediction Challenge #3

Which architecture is stronger?

### Architecture A

```text
App
 ↓
One Error Boundary
 ↓
Everything
```

### Architecture B

```text
Global Boundary
     │
     ├── Route Boundary
     │
     └── Feature Boundaries
```

Generally:

```text
Architecture B
```

because it provides:

```text
Failure containment
Localized fallback
Graceful degradation
Better recovery boundaries
```

But do not add boundaries mechanically. Their placement should reflect meaningful application domains.

---

# 29. Senior-Level Error Boundary Checklist

Before placing an Error Boundary, ask:

```text
1. What kind of failure can occur here?

2. Is this expected application state
   or an unexpected runtime failure?

3. What part of the UI should survive?

4. Where is the nearest meaningful
   failure domain?

5. What fallback should the user see?

6. Can the user recover?

7. Should retry reset the boundary?

8. Could retry cause an error loop?

9. What diagnostic information
   should be captured?

10. Is sensitive data being logged?

11. Is there a higher-level boundary
    if this boundary itself fails?
```

---

# 30. 30-Second Executive Cheat Sheet

```text
REACT ERROR BOUNDARIES
══════════════════════════════════

Unexpected render failure
          ↓
Nearest Error Boundary
          ↓
Fallback UI


Expected API failure

Request
 ↓
Error state
 ↓
Normal conditional rendering


Error Boundary ≠ try/catch for everything


Event handler failure
        ↓
Explicit handling


Async failure
        ↓
await + try/catch


Good boundary placement:

Global
  ↓
Route
  ↓
Feature


Goal:

Contain failure
without destroying unrelated UI


Suspense:

Not ready yet
     ↓
Loading fallback


Error Boundary:

Something failed
     ↓
Error fallback
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
Part 6  ✅ React Error Boundaries & Recovery
Part 7  ⏳ Logging, Observability & Production Debugging
Part 8  ⏳ Systematic Debugging Methodology
```

**Next: Part 7 — Logging, observability, production error reporting, stack traces, source maps, error context, structured logs, correlation IDs, debugging production-only issues, and how senior engineers design systems that make failures diagnosable.**