# KPI 02 — Part 08: Forms, Submission & Browser Default Behavior

[⬅️ Part 07: Events, Input & User Interaction](./07-history-session-navigation.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [🧪 Lab 06](./examples/06-event-loop-long-task-scheduler-lab.html) | [🧪 Lab 07](./examples/07-dom-event-propagation-delegation-lab.html) | [🧪 Lab 08](./examples/08-form-submission-validation-lab.html) | [Part 09: SPA / React / Next.js Navigation ➡️](./09-spa-react-nextjs-navigation.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🧭 PART POSITION

This part explains what actually happens when a user submits a form:

> **"How does the browser construct a submission, how does constraint validation participate, how does JavaScript intercept or replace default behavior, and how does this connect to navigation, networking, React/Next.js, accessibility, and production debugging?"**

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## The Core Model

A native form submission is not simply:

```text
button click
    ↓
JavaScript
```

It is closer to:

```text
User interaction
      ↓
Form-associated control
      ↓
Submit attempt
      ↓
Constraint validation
      ↓
submit event
      ↓
preventDefault()?
   ┌──┴───────┐
  YES         NO
   │           │
   ▼           ▼
JS owns     Browser default
submission  form submission
                │
                ▼
        construct submission
                │
                ▼
             network
                │
                ▼
          navigation / response
```

The critical Senior-level distinction:

> **A form can have a browser-defined submission algorithm independent of your framework's JavaScript.**

---

# 1. 🟢 [DAILY DRIVER] — FORM SUBMISSION IS A BROWSER ALGORITHM

Consider:

```html
<form action="/login" method="post">
  ...
</form>
```

The browser knows what this means.

It can perform:

```text
collect controls
     ↓
validate constraints
     ↓
construct form data
     ↓
encode request
     ↓
send request
     ↓
navigate to resulting resource
```

You do not need React, Next.js, Axios, or `fetch()` for a basic form submission.

That is important because frameworks are **layers over browser capabilities**, not replacements for them.

---

# 2. THE SUBMITTING CONTROL

A form submission can be initiated through different user interactions.

For example:

```html
<button type="submit">
  Login
</button>
```

The button acts as a **submitter**.

The browser's submission algorithm needs to know which control initiated submission because the submitter can influence the resulting submission.

Conceptually:

```text
Form
 │
 ├── username
 ├── password
 └── submit button ← submitter
```

This becomes particularly important when multiple submit controls have different submission behavior.

---

# 3. 🟡 [MODERATE] — SUBMIT EVENT

JavaScript can observe submission:

```javascript
form.addEventListener("submit", event => {
  console.log("submitted");
});
```

The event is dispatched as part of the form submission process.

You can inspect:

```javascript
event.target
event.currentTarget
event.submitter
```

The `submitter` identifies the control responsible for the submission when applicable.

---

# 4. `PREVENTDEFAULT()` — THE IMPORTANT SWITCH

Consider:

```javascript
form.addEventListener("submit", event => {
  event.preventDefault();

  // custom submission
});
```

Conceptually:

```text
submit attempt
      ↓
submit event
      ↓
preventDefault()
      ↓
browser default submission cancelled
      ↓
application takes control
```

This is the foundation of many SPA form systems.

---

# 5. NATIVE FORM VS JAVASCRIPT FORM

## Native

```text
User
 ↓
form submission
 ↓
browser
 ↓
HTTP request
 ↓
navigation
```

## JavaScript-controlled

```text
User
 ↓
form submission
 ↓
submit event
 ↓
preventDefault()
 ↓
JavaScript
 ↓
fetch()
 ↓
application state
 ↓
UI update
```

These are fundamentally different execution paths.

---

# 6. WHY THIS MATTERS IN REACT

Consider:

```jsx
<form onSubmit={handleSubmit}>
```

Conceptually:

```text
Browser
   ↓
submit event
   ↓
React event system
   ↓
handleSubmit
   ↓
preventDefault()
   ↓
React/application logic
```

React does not magically create the concept of submission.

The browser already has it.

React is responding to the platform event.

---

# 7. 🟢 [DAILY DRIVER] — CONSTRAINT VALIDATION

Before a native form submission proceeds, the browser can perform **constraint validation**.

Examples of constraints include:

```text
required
type
min
max
pattern
minlength
maxlength
```

Conceptually:

```text
submit attempt
      ↓
validation
   ┌──┴────┐
 valid    invalid
   │         │
   ▼         ▼
continue   block
```

This means validation can happen **before your application receives a normal submit event** in the native submission path.

That distinction is important.

---

# 8. VALIDATION FAILURE

Suppose:

```html
<input required>
```

and the user submits an empty form.

The browser can:

```text
detect invalid control
       ↓
prevent normal submission
       ↓
expose validation UI
```

The application may therefore observe:

```text
"Why didn't my submit handler run?"
```

when the actual problem occurred earlier in the native submission pipeline.

---

# 9. `NOVALIDATE`

Forms can opt out of native constraint validation:

```html
<form novalidate>
```

This means the browser's normal constraint-validation step isn't used for that form submission.

Application code may then implement its own validation.

But understand the tradeoff:

```text
native validation
     ↓
browser-managed behavior

custom validation
     ↓
application responsibility
```

Replacing browser behavior means you inherit more responsibility.

---

# 10. `CHECKVALIDITY()` VS `REPORTVALIDITY()`

The platform exposes validation APIs.

```javascript
form.checkValidity();
```

asks whether the form satisfies its constraints.

Conceptually:

```text
checkValidity()
      ↓
true / false
```

`reportValidity()` additionally requests that the browser report validation problems to the user according to its UI behavior.

So:

```text
checkValidity
    =
inspect validity

reportValidity
    =
inspect + report
```

---

# 11. `VALIDATE` DOES NOT MEAN "SUBMIT"

This distinction is important.

You can validate:

```javascript
form.checkValidity();
```

without submitting the form.

Similarly, programmatically triggering validation is not identical to triggering the complete native submission algorithm.

Do not collapse:

```text
validation
submission
network request
navigation
```

into one operation.

They are related stages.

---

# 12. 🟡 [MODERATE] — FORM DATA CONSTRUCTION

When a form is submitted, the browser constructs data from the form's **successful controls**.

Conceptually:

```text
Form
 │
 ├── username → included
 ├── password → included
 ├── disabled field → excluded
 └── unchecked checkbox → generally excluded
```

This is why:

```javascript
new FormData(form)
```

is useful.

It allows JavaScript to inspect the form data using the browser's form-data model.

---

# 13. `FORMDATA` EVENT

Modern browsers expose a `formdata` event.

Conceptually:

```text
form submission
      ↓
FormData construction
      ↓
formdata event
```

JavaScript can observe or augment the data represented by the `FormData` object.

This is a deeper platform capability than simply reading individual input values.

---

# 14. ENCODING

A native form submission must encode its data according to the form's submission configuration.

Common concepts include:

```text
application/x-www-form-urlencoded
multipart/form-data
text/plain
```

For example, file uploads generally require:

```text
multipart/form-data
```

The key engineering idea:

> **Form submission is not simply "serialize an object to JSON."**

Native forms have their own encoding algorithms and semantics.

---

# 15. FORM METHOD

A form can specify an HTTP method.

Conceptually:

```html
<form method="get">
```

or:

```html
<form method="post">
```

This influences how the browser constructs the network request.

For example:

```text
GET
 ↓
data commonly represented in URL/query

POST
 ↓
data commonly represented in request body
```

Do not treat this as merely a React convention.

It is a browser + HTTP interaction.

---

# 16. FORM ACTION

The action determines the destination.

```html
<form action="/login">
```

Conceptually:

```text
submission
    ↓
resolve action URL
    ↓
request destination
```

If no explicit action is supplied, the browser has defined behavior for resolving the submission destination based on the document context.

The important point is:

> **The destination is part of the browser's submission algorithm.**

---

# 17. FORM SUBMISSION → NAVIGATION

With a traditional form:

```text
User
 ↓
Submit
 ↓
validation
 ↓
submit event
 ↓
no preventDefault
 ↓
HTTP request
 ↓
response
 ↓
navigation
 ↓
new document lifecycle
```

This directly connects today's topic to the navigation lifecycle.

---

# 18. 🟢 [DAILY DRIVER] — `FETCH()` CHANGES THE MODEL

Suppose:

```javascript
form.addEventListener("submit", async event => {
  event.preventDefault();

  const data = new FormData(form);

  const response = await fetch("/api/login", {
    method: "POST",
    body: data
  });
});
```

Now:

```text
submit
 ↓
preventDefault
 ↓
fetch
 ↓
HTTP request
 ↓
JavaScript receives response
```

There is no automatic full-document navigation caused by that native submission.

The application decides what happens next.

---

# 19. NATIVE SUBMISSION VS FETCH

| Native form                          | JavaScript `fetch()`                     |
| ------------------------------------ | ---------------------------------------- |
| Browser controls submission          | Application controls request             |
| Can cause navigation                 | Normally does not navigate automatically |
| Browser handles form encoding        | JS can control request body              |
| Browser manages response navigation  | JS processes response                    |
| Strong progressive-enhancement story | Requires application logic               |
| Less application code                | More control                             |

Neither is universally superior.

The correct choice depends on application requirements.

---

# 20. 🟢 [DAILY DRIVER] — PROGRESSIVE ENHANCEMENT

A robust application can design:

```text
Native browser behavior
        +
JavaScript enhancement
```

For example:

```text
JavaScript available
     ↓
SPA-style submission

JavaScript unavailable/fails
     ↓
native form submission
```

This can improve resilience.

The underlying principle:

> **The browser should remain capable of performing the core operation whenever practical.**

---

# 21. REACT CONTROLLED FORM

A typical React form:

```jsx
function Login() {
  const [email, setEmail] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    login(email);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={email}
        onChange={event => setEmail(event.target.value)}
      />

      <button type="submit">
        Login
      </button>
    </form>
  );
}
```

Execution:

```text
keyboard
 ↓
input event
 ↓
React handler
 ↓
state update
 ↓
render
```

Then:

```text
submit
 ↓
React handler
 ↓
preventDefault
 ↓
login()
```

This is the framework-level manifestation of browser primitives.

---

# 22. NEXT.JS CONNECTION

Modern Next.js can use multiple form-submission patterns, including:

```text
native forms
client-side handlers
server actions / server functions
route handlers
fetch()
```

The exact framework path varies.

But underneath:

```text
user interaction
 ↓
browser form semantics
```

still matters.

A Senior engineer should therefore understand both:

```text
Browser form algorithm
```

and:

```text
Next.js abstraction
```

rather than learning only framework syntax.

---

# 23. SERVER ACTION MENTAL MODEL

Conceptually, a framework abstraction may transform:

```text
<form>
    ↓
submit
    ↓
framework intercepts / integrates
    ↓
server-side execution
    ↓
response / UI update
```

The framework may remove a lot of manual client-side plumbing.

But it does not eliminate the need to understand:

```text
submission
validation
request
response
navigation
progressive enhancement
```

---

# 24. FORM SUBMISSION AND SECURITY

A browser form is not a security boundary.

Never assume:

```text
<input>
 ↓
browser validation
 ↓
server can trust data
```

Instead:

```text
Browser validation
       ↓
UX convenience

Server validation
       ↓
security / correctness
```

Attackers can bypass client-side validation completely.

Therefore:

> **All security-sensitive validation must be enforced server-side.**

---

# 25. CSRF CONNECTION

Traditional cookie-authenticated applications must consider **Cross-Site Request Forgery**.

The important mental model is:

```text
Browser automatically sends credentials
        ↓
cross-site request may occur
        ↓
server must distinguish legitimate intent
```

Mechanisms such as:

```text
SameSite cookies
CSRF tokens
Origin checks
```

can participate in the defense.

This is directly relevant to form submissions because forms are one of the browser's native mechanisms for initiating requests.

---

# 26. `ORIGIN` AND FORM SUBMISSION

When a request reaches the server, security controls can use request metadata to establish where the request originated.

This becomes especially important when:

```text
cookie authentication
+
state-changing request
```

are involved.

The browser is therefore not just a UI runtime.

It participates in web security semantics.

---

# 27. FORM EVENTS AND PROPAGATION

Form controls also participate in the DOM event model.

For example:

```text
input
 ↓
ancestor
```

can involve bubbling depending on the event.

This means the concepts from Part 07 remain applicable:

```text
target
currentTarget
capture
bubble
preventDefault
```

Form-specific behavior is built on top of the broader event system.

---

# 28. SUBMIT BUTTON VS PROGRAMMATIC SUBMISSION

This is a major interview area.

Compare:

```javascript
form.requestSubmit();
```

with:

```javascript
form.submit();
```

They are **not equivalent**.

---

# 29. `REQUESTSUBMIT()`

Conceptually:

```javascript
form.requestSubmit();
```

asks the browser to perform a submission in a way that behaves more like an actual submit action.

That means relevant mechanisms such as:

```text
constraint validation
submit event
submitter semantics
```

can participate.

Mental model:

```text
requestSubmit()
      ↓
"perform a real submit attempt"
```

---

# 30. `SUBMIT()`

By contrast:

```javascript
form.submit();
```

directly invokes the form's submission behavior without going through the same submit-event/validation path as a user-initiated submission.

This is a classic gotcha.

Remember:

```text
requestSubmit()
   ≈ simulate submit interaction

submit()
   ≈ invoke submission directly
```

The exact platform algorithm is more precise than that shorthand, but the distinction is the important part.

---

# 31. 🔥 CRUCIBLE — `submit()` GOTCHA

Suppose:

```javascript
form.addEventListener("submit", () => {
  console.log("submit event");
});

form.submit();
```

Do not assume:

```text
submit event
```

will necessarily be dispatched.

That's precisely why `requestSubmit()` exists.

---

# 32. 🔥 CRUCIBLE — VALIDATION GOTCHA

Suppose:

```html
<input required>
```

and the value is empty.

Then:

```text
user submits
```

may produce:

```text
constraint validation
      ↓
invalid
      ↓
native submission prevented
```

The important question isn't:

> "Why didn't my API request happen?"

It is:

> **"Did the browser even reach the network-submission stage?"**

---

# 33. 🔥 CRUCIBLE — `PREVENTDEFAULT()` GOTCHA

Given:

```javascript
form.addEventListener("submit", event => {
  event.preventDefault();
});
```

Does the browser:

```text
send the POST anyway?
```

No.

The default form submission is cancelled, assuming the event is cancelable and the handler executes before the relevant default action.

---

# 34. 🔥 CRUCIBLE — FORM DEBUGGING

User reports:

> "Clicking Login does nothing."

Don't immediately inspect the API.

Trace:

```text
Click
 ↓
submit attempt?
 ↓
constraint validation?
 ↓
submit event?
 ↓
listener?
 ↓
preventDefault?
 ↓
fetch?
 ↓
network?
 ↓
server?
 ↓
navigation/UI update?
```

This is the Senior-level debugging sequence.

---

# 35. 🧪 DIAGNOSTIC LAB — NATIVE SUBMISSION

Create:

```html
<form action="/test" method="get">
  <input name="query">
  <button type="submit">
    Search
  </button>
</form>
```

Submit it.

Observe:

```text
URL
Network
Navigation
Document lifecycle
```

Notice that no JavaScript is required.

---

# 36. 🧪 DIAGNOSTIC LAB — INTERCEPT SUBMISSION

Add:

```javascript
form.addEventListener("submit", event => {
  event.preventDefault();

  console.log("submission intercepted");
});
```

Submit again.

Observe:

```text
submit event
 ↓
preventDefault
 ↓
no native navigation
```

Now you can directly see the difference between browser default behavior and application-controlled behavior.

---

# 37. 🧪 DIAGNOSTIC LAB — VALIDATION

Use:

```html
<form>
  <input name="email" type="email" required>
  <button type="submit">Submit</button>
</form>
```

Try:

```text
empty
invalid email
valid email
```

Observe when:

```text
submit
```

actually reaches your JavaScript.

---

# 38. 🧪 DIAGNOSTIC LAB — `submit()` VS `requestSubmit()`

Create:

```javascript
form.addEventListener("submit", event => {
  console.log("submit event");
});

form.submit();
```

Then compare:

```javascript
form.requestSubmit();
```

Observe:

```text
event dispatch
validation
submission behavior
```

This is a high-value platform experiment.

---

# 39. 🧪 DIAGNOSTIC LAB — NETWORK TRACE

Use DevTools:

```text
Network
```

Submit a native form.

Inspect:

```text
Request URL
Request Method
Query String Parameters
Form Data
Status Code
Response
Initiator
```

Then repeat with `fetch()`.

Compare the two execution paths.

---

# 40. 🧪 DIAGNOSTIC LAB — PERFORMANCE

Record a form submission in:

```text
DevTools
→ Performance
```

Look at:

```text
Input
 ↓
Event
 ↓
JavaScript
 ↓
Network initiation
 ↓
Navigation/rendering
```

Then add an intentionally expensive submit handler:

```javascript
const start = performance.now();

while (performance.now() - start < 200) {}
```

Observe how application JavaScript can delay interaction processing.

---

# 41. PRODUCTION RUNBOOK — "FORM SUBMIT DOES NOTHING"

### Step 1 — Check browser validation

```text
required?
type?
pattern?
min/max?
```

### Step 2 — Check submitter

```text
correct button?
type="submit"?
```

### Step 3 — Check submit event

```text
listener attached?
```

### Step 4 — Check cancellation

```text
preventDefault?
```

### Step 5 — Check JavaScript exceptions

```text
Console
```

### Step 6 — Check network

```text
request created?
```

### Step 7 — Check server

```text
status?
response?
```

### Step 8 — Check post-submit UI

```text
navigation?
state update?
error rendering?
```

---

# 42. PRODUCTION RUNBOOK — "API REQUEST FIRES TWICE"

Investigate:

```text
native submit
+
JS fetch
```

Could the application be:

```text
handling submit
```

without correctly preventing the native default?

Or could two application handlers be registered?

Trace:

```text
submit
 ↓
listeners
 ↓
network requests
```

Use DevTools Network to establish whether there are actually two requests and inspect their initiators.

---

# 43. PRODUCTION RUNBOOK — "VALIDATION WORKS LOCALLY BUT SERVER REJECTS"

This is often expected.

Browser:

```text
client-side constraints
```

Server:

```text
authoritative validation
```

The server may enforce:

```text
business rules
authorization
data integrity
security constraints
```

Therefore:

```text
client validation ≠ server validation
```

Client validation improves UX.

Server validation establishes correctness/security.

---

# 44. PRODUCTION RUNBOOK — "FORM WORKS WITHOUT JS BUT NOT WITH JS"

Compare:

```text
JavaScript disabled
 ↓
native form
 ↓
works
```

versus:

```text
JavaScript enabled
 ↓
preventDefault
 ↓
custom logic
 ↓
fails
```

This immediately narrows the investigation to the enhancement layer.

This is why progressive enhancement is such a powerful debugging concept.

---

# 45. 🧠 THE COMPLETE FORM SYSTEM

Put everything together:

```text
                         USER
                           │
                           ▼
                    Interaction
                           │
                           ▼
                    Submit attempt
                           │
                           ▼
                 Constraint validation
                    │              │
                  invalid         valid
                    │              │
                    ▼              ▼
               Browser UI      submit event
                                   │
                            preventDefault?
                             │            │
                            YES           NO
                             │            │
                             ▼            ▼
                       Application    Native submit
                          logic            │
                             │             ▼
                           fetch       FormData
                             │             │
                             ▼             ▼
                          Network      HTTP request
                             │             │
                             ▼             ▼
                          response     response
                             │             │
                             ▼             ▼
                        UI update      navigation
```

That is the mental model you should retain.

---

# 46. SENIOR ENGINEER DECISION MATRIX

| Situation                  | Native form |                    JS interception |
| -------------------------- | ----------: | ---------------------------------: |
| Simple document navigation |           ✅ |                        unnecessary |
| Progressive enhancement    |           ✅ |                           optional |
| SPA state update           |    possible |                                  ✅ |
| Custom async UI            |    possible |                                  ✅ |
| Server-driven navigation   |           ✅ |                framework-dependent |
| File upload                |           ✅ |                           possible |
| Accessibility baseline     |      strong | developer responsibility increases |
| Failure resilience         |      strong |                 must be engineered |
| Custom request protocol    |     limited |                                  ✅ |

---

# 47. SENIOR INTERVIEW QUESTIONS

### Q1. What happens when a user submits a form?

Expected answer:

> A submit attempt occurs, constraint validation may run, the `submit` event can be dispatched, and if the submission isn't cancelled, the browser performs its form-submission algorithm, constructing the request according to the form's attributes and potentially navigating to the response.

---

### Q2. Why call `preventDefault()` in React forms?

Because otherwise the browser's native default submission can occur.

---

### Q3. Difference between `form.submit()` and `form.requestSubmit()`?

`requestSubmit()` initiates a submission path that participates in submit semantics such as validation and the submit event; `submit()` invokes submission directly and bypasses those same steps.

---

### Q4. Does client-side validation provide security?

No.

It provides UX and early error detection.

The server must validate independently.

---

### Q5. Can a form work without React?

Absolutely.

Forms are native browser functionality.

---

### Q6. Why is `FormData` important?

It exposes the browser's form-data representation and allows JavaScript to reuse native form semantics when constructing requests.

---

# 48. 🎯 THE SENIOR MENTAL MODEL

Never think:

```text
<form>
   =
React component
```

Think:

```text
<form>
   ↓
Browser platform primitive
   ↓
submission algorithm
   ↓
events
   ↓
validation
   ↓
encoding
   ↓
network
   ↓
navigation
```

React/Next.js then layer application behavior on top.

---

# 49. PART 08 COMPLETION CHECKLIST

## Browser mechanics

* [x] Form submission algorithm
* [x] Submitter concept
* [x] Submit event
* [x] Default submission behavior
* [x] Form action
* [x] Form method
* [x] Form-data construction
* [x] Encoding concepts

## Validation

* [x] Constraint validation
* [x] Native validation UI
* [x] `novalidate`
* [x] `checkValidity()`
* [x] `reportValidity()`
* [x] Client vs server validation

## JavaScript integration

* [x] `preventDefault()`
* [x] `FormData`
* [x] `formdata`
* [x] `submit()`
* [x] `requestSubmit()`
* [x] Fetch-based submission

## Architecture

* [x] Native form → network
* [x] Form → navigation
* [x] Form → SPA
* [x] Progressive enhancement
* [x] React integration
* [x] Next.js integration

## Security

* [x] Server-side validation
* [x] CSRF awareness
* [x] Cookie credential implications
* [x] Origin/security reasoning

## Diagnostics

* [x] Native submission tracing
* [x] Validation debugging
* [x] Network inspection
* [x] Duplicate submission debugging
* [x] JavaScript interception debugging

---

# ⚡ FINAL 30-SECOND REVISION

If you remember only this:

```text
FORM SUBMIT
    ↓
VALIDATION
    ↓
SUBMIT EVENT
    ↓
preventDefault()?
   ┌────────────┐
   │            │
 YES            NO
   │            │
   ▼            ▼
CUSTOM       BROWSER
LOGIC        SUBMISSION
   │            │
 fetch       FormData
   │            │
   ▼            ▼
response     HTTP
   │            │
   ▼            ▼
UI update   navigation
```

And the four critical distinctions:

```text
client validation ≠ security validation

submit() ≠ requestSubmit()

submit event ≠ network request

preventDefault() ≠ stopPropagation()
```

---

[⬅️ Part 07: Events, Input & User Interaction](./07-history-session-navigation.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [🧪 Lab 05](./examples/05-critical-rendering-path-priority-lab.html) | [🧪 Lab 06](./examples/06-event-loop-long-task-scheduler-lab.html) | [🧪 Lab 07](./examples/07-dom-event-propagation-delegation-lab.html) | [🧪 Lab 08](./examples/08-form-submission-validation-lab.html) | [Part 09: SPA / React / Next.js Navigation ➡️](./09-spa-react-nextjs-navigation.md)
