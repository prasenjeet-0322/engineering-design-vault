# KPI 25 — Error Handling, Debugging & Reliability

## Part 7 — Logging, Observability & Production Debugging


> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)


Part 6 covered **failure containment**:

```text
Unexpected React error
        ↓
Error Boundary
        ↓
Fallback UI
```

But catching an error is only half the job.

The next question is:

> **How do you understand why that error happened—especially when it happens only in production and you cannot reproduce it locally?**

This is where **logging, monitoring, tracing, and observability** become essential.

---

# 1. The Production Debugging Problem

In local development, you have:

```text
Your machine
↓
DevTools
↓
Console
↓
Source code
↓
Breakpoints
```

A production failure is different:

```text
User
↓
Production application
↓
Something fails ❌
↓
User reports:
"It doesn't work."
```

You may not know:

```text
What the user clicked
Which route they were on
Which API failed
What application version they used
Which browser they used
What error occurred
Whether the issue is reproducible
```

Therefore:

> **Production systems need to generate diagnostic evidence when failures occur.**

---

# 2. What Is Logging?

## Definition

**Logging is the process of recording information about events that occur while a system is running.**

Example:

```js
console.log("User loaded dashboard");
```

But production-grade logging is more than random messages.

Instead of:

```js
console.log("Something failed");
```

you want meaningful context:

```js
console.error("Failed to load dashboard", {
  route: "/dashboard",
  userId,
  requestId,
  error
});
```

Conceptually:

```text
Event
 ↓
Structured information
 ↓
Storage / monitoring system
 ↓
Search and analysis
```

---

# 3. Logging Is Not the Same as Observability

These concepts are related but different.

### Logging

Records events.

```text
User logged in
Request failed
Payment completed
```

### Monitoring

Tracks known system signals.

```text
Error rate
Response time
CPU usage
Availability
```

### Observability

Helps engineers understand the internal state of a system from the signals it produces.

Those signals commonly include:

```text
Logs
Metrics
Traces
```

Conceptually:

```text
                OBSERVABILITY
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
      Logs         Metrics       Traces
```

---

# 4. The Three Major Observability Signals

## A. Logs

A discrete record of something that happened.

Example:

```text
12:01:22
POST /api/orders
Status: 500
```

Useful for:

```text
Specific events
Error details
Debugging
Context
```

---

## B. Metrics

Numerical measurements over time.

Example:

```text
Request count: 10,000

Error rate: 4.2%

Average response time: 320ms
```

Useful for detecting:

```text
Trends
Spikes
Performance degradation
System health
```

---

## C. Traces

Traces follow a request or operation across multiple steps or services.

Example:

```text
User Action
    ↓
Frontend
    ↓
API Gateway
    ↓
User Service
    ↓
Database
```

A trace can help answer:

```text
Where did the request fail?
```

Conceptually:

```text
Trace ID: abc-123

Frontend
   ↓ 120ms
API
   ↓ 80ms
Database ❌
```

---

# 5. Why `console.log()` Is Not Production Observability

During development:

```js
console.log(data);
```

is useful.

But imagine a user reports a production issue.

You cannot normally inspect:

```text
Their browser console
Their previous logs
Their exact application state
```

And even if you collect browser console output, random logging produces:

```text
Message
Message
Message
Message
Message
```

with no structure.

A production system should instead capture useful diagnostic data.

Example:

```js
logger.error("dashboard_load_failed", {
  route: "/dashboard",
  feature: "dashboard",
  errorName: error.name,
  message: error.message
});
```

Now the event is searchable by:

```text
dashboard_load_failed
feature
route
errorName
```

---

# 6. Structured Logging

## Definition

**Structured logging records data in predictable fields instead of only human-readable text.**

Unstructured:

```text
User 123 failed to load dashboard because request 456 returned 500
```

Structured conceptually:

```json
{
  "event": "dashboard_load_failed",
  "userId": "123",
  "requestId": "456",
  "status": 500
}
```

The advantage:

```text
Unstructured logs
        ↓
Harder to filter

Structured logs
        ↓
Filter by field
        ↓
Aggregate
        ↓
Analyze patterns
```

Example queries:

```text
Show all events where:

event = dashboard_load_failed
```

Or:

```text
status >= 500
```

Or:

```text
applicationVersion = 2.4.1
```

This is much more powerful than searching random strings.

---

# 7. A Good Error Event

A useful production error event may contain:

```text
Error type
Error message
Stack trace
Route
Feature
Application version
Browser/environment
Timestamp
Request identifier
Relevant operation
```

Conceptually:

```js
{
  event: "api_request_failed",

  error: {
    name: "ApiError",
    message: "Request failed",
    stack: "..."
  },

  request: {
    method: "POST",
    endpoint: "/api/orders",
    status: 500
  },

  context: {
    route: "/checkout",
    feature: "payment",
    appVersion: "2.4.1"
  }
}
```

The goal is not:

> **Log everything.**

The goal is:

> **Log enough context to diagnose meaningful failures.**

---

# 8. The Danger of Logging Too Much

Imagine:

```js
logger.error("Request failed", {
  request,
  response,
  user,
  applicationState,
  everything: true
});
```

Problems:

```text
Sensitive data exposure
Huge log volume
High storage cost
Noise
Harder analysis
Privacy issues
```

You should avoid blindly logging:

```text
Passwords
Authentication tokens
Cookies
Authorization headers
Credit card information
Personal data unless explicitly justified and protected
Sensitive request bodies
```

A production logging strategy needs **data minimization**.

Ask:

> **What information is actually required to diagnose this problem?**

---

# 9. Log Levels

A common logging model:

```text
DEBUG
INFO
WARN
ERROR
```

---

## `DEBUG`

Detailed diagnostic information.

```js
logger.debug("cache_lookup", {
  key
});
```

Usually useful during development or controlled troubleshooting.

---

## `INFO`

Normal meaningful application events.

```js
logger.info("user_session_started");
```

---

## `WARN`

Something unexpected happened, but the application can continue.

Example:

```text
Primary API unavailable
↓
Fallback data used
```

---

## `ERROR`

An operation failed and requires investigation.

Example:

```text
Checkout request failed
```

The important principle:

> **Not every interesting event should be an error.**

If everything is logged as `ERROR`, then:

```text
ERROR
ERROR
ERROR
ERROR
```

your real production failures become harder to find.

---

# 10. Logging at the Correct Layer

Consider:

```text
UI
 ↓
Feature / Action
 ↓
Service
 ↓
API Client
```

Suppose the API fails.

A poor architecture may log the same failure everywhere:

```text
API Client → Error log
Service → Error log
Feature → Error log
UI → Error log
```

Now one failure produces:

```text
4 errors ❌
```

This creates noise and may make your monitoring system look worse than reality.

A better model:

```text
Lower layers
↓
Attach context / normalize error

Boundary layer
↓
Report the failure
```

For example:

```text
API Client
↓
Create ApiError
```

Then:

```text
Checkout Service
↓
Add domain context
```

Then:

```text
Error Boundary / Feature boundary
↓
Send final diagnostic event
```

This connects directly to what you learned in Parts 3–6.

---

# 11. Error Context vs Error Message

This is weak:

```js
throw new Error("Failed");
```

This is more useful:

```text
Operation: save_profile
Route: /settings
User action: submit_profile
HTTP status: 500
```

When debugging production:

```text
"Failed"
```

does not answer:

```text
What failed?
Where?
When?
Under what conditions?
```

Context turns an error into diagnostic evidence.

---

# 12. Stack Traces

## Definition

A **stack trace is a record of the sequence of function calls that led to an error.**

Example:

```text
TypeError: Cannot read property 'name'

at UserProfile
at Dashboard
at App
```

Conceptually:

```text
App()
 ↓
Dashboard()
 ↓
UserProfile()
 ↓
Error ❌
```

The stack trace helps answer:

> **What execution path led to this failure?**

Without it:

```text
Something failed.
```

With it:

```text
Something failed
inside UserProfile
called by Dashboard
rendered by App.
```

---

# 13. The Production Source Code Problem

Your development code may look like:

```js
function calculateTotal(items) {
  return items.reduce(...);
}
```

But production code may be:

```js
function a(b){return b.reduce(...)}
```

This is:

```text
Minified code
```

Now imagine the production stack trace:

```text
TypeError
at a
at b
at c
```

That is difficult to debug.

---

# 14. Source Maps

## Definition

**Source maps allow tooling to map transformed or minified production code back to the original source code.**

Conceptually:

```text
Original Source
    ↓
Build process
    ↓
Minified Production Code
    ↓
Source Map
    ↓
Debugging tools map error
back to original code
```

Without source maps:

```text
Error at:

app.min.js:1:48392
```

With source maps:

```text
Error at:

UserProfile.tsx:42
```

This can dramatically reduce debugging time.

---

# 15. Source Maps Are a Deployment Concern

Generating source maps is not enough.

You must also consider:

```text
Are they available to the error-reporting system?

Are they uploaded for the correct build?

Does the application version match?

Are they publicly exposed unnecessarily?
```

A common production debugging failure:

```text
Application deployed
        ↓
Error reporting works
        ↓
Source maps missing ❌
        ↓
Stack traces unreadable
```

Therefore, source-map handling should be part of the deployment pipeline.

---

# 16. Application Versioning

Imagine you receive an error:

```text
TypeError in checkout
```

But you deployed:

```text
Version 2.4.1
```

Then:

```text
2.4.2
```

and:

```text
2.5.0
```

Which version produced the error?

Without version context, debugging becomes harder.

Include:

```text
Application version
Build ID
Release identifier
Commit/version metadata
```

Conceptually:

```json
{
  "event": "checkout_failed",
  "release": "2.4.1"
}
```

Now you can connect:

```text
Error
↓
Specific deployed release
↓
Source code for that release
```

---

# 17. Correlation IDs

Suppose a user reports:

> "My order failed at 2:04 PM."

You inspect frontend logs.

You see:

```text
Request failed.
```

You inspect backend logs.

There are thousands of failures.

How do you connect them?

A **correlation ID** solves this problem.

Example:

```text
Request ID: abc-123
```

The same identifier can appear across:

```text
Frontend
↓
API
↓
Backend service
↓
Database operation
```

Conceptually:

```text
Frontend
Request ID: abc-123
        ↓
API
Request ID: abc-123
        ↓
Service
Request ID: abc-123
```

Now debugging becomes:

```text
Search: abc-123
```

Instead of:

```text
Search through thousands of unrelated events.
```

---

# 18. Trace IDs vs Correlation IDs

The exact terminology can vary across systems, but conceptually:

```text
Correlation ID
↓
Connect related events
```

While:

```text
Trace
↓
Represents the journey of an operation
through multiple components/services
```

A trace may contain:

```text
Trace
│
├── Frontend span
│
├── API span
│
├── Authentication span
│
└── Database span
```

Each step can record:

```text
Duration
Status
Metadata
Failure
```

---

# 19. Spans

A **span** represents a unit of work within a trace.

Example:

```text
Trace: Checkout
│
├── Span: validate cart
│
├── Span: create payment
│
├── Span: create order
│
└── Span: send confirmation
```

This helps identify:

```text
Which operation failed?
```

or:

```text
Which operation is slow?
```

---

# 20. Production Error Reporting

A typical architecture:

```text
Application
     ↓
Error occurs
     ↓
Capture error
     ↓
Attach context
     ↓
Send to reporting system
     ↓
Group similar errors
     ↓
Alert engineers
```

The system should ideally help answer:

```text
How many users are affected?

When did this start?

Which release introduced it?

Which route causes it?

What browsers are affected?

What is the stack trace?

Is the failure increasing?
```

This is much more useful than simply storing:

```text
Error: Something failed
```

---

# 21. Error Grouping

Imagine:

```text
10,000 identical errors
```

You do not want:

```text
Error #1
Error #2
Error #3
...
Error #10,000
```

Instead:

```text
TypeError:
Cannot read property 'name'

Occurrences: 10,000
Affected users: 2,400
First seen: 10:20
Last seen: now
```

Grouping transforms:

```text
Raw events
```

into:

```text
Actionable incidents
```

---

# 22. Error Rate Is More Important Than One Error

A single error might be:

```text
Rare
Temporary
User-specific
```

But:

```text
0.01% error rate
```

is very different from:

```text
35% error rate
```

Therefore monitoring often tracks:

```text
Error count
Error rate
Affected users
Affected sessions
Failure by route
Failure by release
```

Example:

```text
Release 2.4.1
↓
Error rate increases from:

0.2%
to
8.5%
```

That is a strong signal that the release may be responsible.

---

# 23. The Golden Signals Mental Model

A useful reliability model focuses on signals such as:

```text
Latency
Traffic
Errors
Saturation
```

For frontend thinking:

### Latency

```text
How long operations take.
```

Example:

```text
Dashboard load: 4.2 seconds
```

### Traffic

```text
How much activity exists.
```

Example:

```text
10,000 requests/minute
```

### Errors

```text
How many operations fail.
```

### Saturation

```text
How close a system is to its capacity limits.
```

In frontend work, some infrastructure saturation may be more visible to backend/platform teams, but senior frontend engineers still need to understand how frontend symptoms can relate to system-wide capacity problems.

---

# 24. Debugging a Production-Only Bug

Suppose:

```text
Works locally ✅

Fails in production ❌
```

Do not immediately assume:

```text
"The build is broken."
```

Compare environments.

Check:

```text
Environment variables
API endpoints
Feature flags
Authentication configuration
Build configuration
Application version
Browser differences
Caching
Content delivery behavior
Server rendering vs client rendering
Data differences
Timing and race conditions
```

A production-only issue often exists because:

```text
Local environment ≠ Production environment
```

Your debugging job is to identify the meaningful difference.

---

# 25. The Evidence-First Debugging Process

When an error report arrives:

```text
User says:
"Dashboard is broken."
```

Do not start randomly editing code.

Instead:

```text
1. Identify the failure.

2. Determine scope.

3. Gather evidence.

4. Locate the failing operation.

5. Compare environments.

6. Form a hypothesis.

7. Reproduce or validate.

8. Fix the root cause.

9. Verify the fix.

10. Monitor after deployment.
```

This systematic methodology prevents:

```text
Guess
↓
Change code
↓
Deploy
↓
Hope
```

That is not reliable engineering.

---

# 26. Example Production Investigation

Suppose monitoring shows:

```text
checkout_failed
```

Error rate:

```text
Before release:
0.2%

After release:
12%
```

Investigation:

```text
Step 1
↓
Compare release versions


Step 2
↓
Inspect grouped error


Step 3
↓
Read stack trace


Step 4
↓
Use source maps


Step 5
↓
Identify:

PaymentForm.tsx:84


Step 6
↓
Compare recent change


Step 7
↓
Find undefined access


Step 8
↓
Fix data normalization


Step 9
↓
Deploy


Step 10
↓
Monitor error rate
```

This is a real debugging workflow.

---

# 27. Logging User Actions Carefully

Sometimes the stack trace tells you **where** the application failed but not **what sequence led to the failure**.

Useful context might include:

```text
Current route
Current feature
Action type
Previous action
Application state identifier
```

Example:

```text
Route:
/checkout

Action:
submit_payment

Step:
payment_confirmation
```

But avoid:

```text
Record every keystroke
Log passwords
Capture complete private form data
```

The goal is diagnostic context, not surveillance.

---

# 28. Breadcrumbs

A useful concept in error diagnostics is a **breadcrumb trail**.

Example:

```text
User opened checkout
        ↓
Added payment method
        ↓
Clicked submit
        ↓
Payment API request started
        ↓
Error ❌
```

The breadcrumb history helps answer:

> **What happened immediately before the failure?**

Conceptually:

```text
Event A
 ↓
Event B
 ↓
Event C
 ↓
Error
```

This can be significantly more useful than an isolated stack trace.

---

# 29. Frontend Observability Architecture

A conceptual architecture:

```text
USER ACTION
    ↓
Application Event
    ↓
────────────────────────────
Logs
Metrics
Traces
Breadcrumbs
Error Reporting
────────────────────────────
    ↓
Observability Platform
    ↓
Dashboards
Alerts
Search
Investigation
```

Each signal answers a different question.

| Signal      | Primary Question                |
| ----------- | ------------------------------- |
| Logs        | What happened?                  |
| Metrics     | How often is it happening?      |
| Traces      | Where did it happen?            |
| Stack trace | What code path failed?          |
| Breadcrumbs | What happened before it failed? |

---

# 30. Alerting

Not every error should wake someone up.

If:

```text
One user
↓
One non-critical error
```

you may want to record it without creating an urgent alert.

But:

```text
Error rate jumps from:

0.1%
to
40%
```

may require immediate attention.

A useful alert should be based on:

```text
Impact
Rate
Severity
Duration
```

Avoid:

```text
Every error
↓
Send alert
```

Otherwise:

```text
Alert
Alert
Alert
Alert
```

Engineers become desensitized.

This is called **alert fatigue**.

---

# 31. Common Logging & Observability Mistakes

## Mistake 1 — Logging only the message

```js
logger.error(error.message);
```

Missing:

```text
Stack
Route
Feature
Release
Context
```

---

## Mistake 2 — Logging the same error everywhere

```text
API Client ❌
Service ❌
Hook ❌
Component ❌
Boundary ❌
```

One failure becomes five error events.

---

## Mistake 3 — Logging sensitive data

Never treat logs as a safe dumping ground.

---

## Mistake 4 — No release information

```text
Error occurred.
```

But:

```text
Which version?
```

Unknown.

---

## Mistake 5 — Broken source maps

```text
Error:
a() → b() → c()
```

Not useful.

---

## Mistake 6 — No correlation

Frontend says:

```text
Request failed.
```

Backend says:

```text
Something failed.
```

But there is no way to connect them.

---

## Mistake 7 — Debugging from assumptions

```text
"It must be the API."
```

Maybe.

Evidence first.

---

# 32. Senior-Level Observability Checklist

Before shipping a production feature, consider:

```text
1. What failures can occur?

2. Where will unexpected errors be captured?

3. Will the stack trace be readable?

4. Are source maps correctly associated
   with the deployed release?

5. Does the error include application version?

6. What route and feature failed?

7. Can frontend failures be correlated
   with backend activity?

8. Are important operations measurable?

9. Can error rate be monitored?

10. Can we distinguish one affected user
    from a system-wide incident?

11. Are alerts based on meaningful impact?

12. Are logs structured?

13. Is duplicate logging controlled?

14. Could sensitive data enter logs?

15. What evidence would we need
    to debug this at 2 AM?
```

That final question is extremely practical.

> **If a failure happens while you are not present, has the system captured enough evidence for someone else to investigate it?**

That is the mindset of production engineering.

---

# 33. 30-Second Executive Cheat Sheet

```text
LOGGING & OBSERVABILITY
══════════════════════════════════

Logging
↓
Records events


Monitoring
↓
Tracks known signals


Observability
↓
Understand system behavior
from generated signals


Core signals:

Logs
Metrics
Traces


Production error should include:

Error
Stack trace
Route
Feature
Release/version
Relevant context


Source maps:

Minified production code
        ↓
Map back to original source


Correlation ID:

Frontend
   ↓
API
   ↓
Backend

Same operation identifier


Breadcrumbs:

Action A
 ↓
Action B
 ↓
Action C
 ↓
Error


Senior principle:

Do not debug production
from guesses.

Collect evidence
↓
Form hypothesis
↓
Validate
↓
Fix root cause
↓
Monitor after deployment
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
Part 7  ✅ Logging, Observability & Production Debugging
Part 8  ⏳ Systematic Debugging Methodology
```

**Next: Part 8 — Systematic Debugging Methodology: reproducing bugs, narrowing scope, binary search through systems, breakpoints, DevTools, network debugging, performance debugging, race conditions, root-cause analysis, and a repeatable debugging workflow for senior frontend engineers.**