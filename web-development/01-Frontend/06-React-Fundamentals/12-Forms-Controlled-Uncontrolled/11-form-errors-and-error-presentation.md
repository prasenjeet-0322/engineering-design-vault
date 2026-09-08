# Level 06 — React Fundamentals
## KPI 08 / KPI 12 — Forms & Controlled Inputs
### PART 11 — Form Errors & Error Presentation Architecture

[⬅️ Previous Part (10: Form Submission & Server Validation)](10-form-submission-and-server-validation.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/11-form-errors-and-error-presentation.html) | [Next Part (12: Advanced Form Interaction Architecture) ➡️](12-advanced-form-interaction-architecture.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# 🧭 Part Objective

In enterprise React applications, form validation failures are not merely red border styles and boolean flags. A robust form architecture understands that:
**A form can know that something is wrong before the user should necessarily see the error.**

```text
                                  THE 5 CRITICAL ERROR QUESTIONS
                                  
  ┌───────────────────────┐      ┌───────────────────────┐      ┌────────────────────────┐
  │   1. ERROR EXISTENCE  │      │  2. ERROR RELEVANCE   │      │  3. ERROR VISIBILITY   │
  │   Does a violation    │ ───► │  Is the error still   │ ───► │  Should it be rendered │
  │   actually exist?     │      │  relevant to draft?   │      │  to the user now?      │
  └───────────────────────┘      └───────────────────────┘      └───────────┬────────────┘
                                                                            │
                                                                            ▼
  ┌───────────────────────┐      ┌───────────────────────┐      ┌────────────────────────┐
  │   RECOVERY & FEEDBACK │      │   5. ACCESSIBILITY    │      │  4. ERROR PRESENTATION │
  │   Can the user easily │ ◄─── │   Can assistive tech  │ ◄─── │   Inline, summary, or  │
  │   correct & submit?   │      │   discover & read it? │      │   modal banner?        │
  └───────────────────────┘      └───────────────────────┘      └────────────────────────┘
```

A common failure mode across development teams is collapsing all error logic into `hasError: boolean` or `errorMessage: string` and tying UI display directly to pure validation calculations, causing severe production failures:
1. **The Premature Red Wall of Guilt:** Showing aggressive error messages ("Email is required", "Password too short") the moment an empty form mounts before the user has even touched an input.
2. **The Stale Server Error Lock:** Keeping an HTTP 422 "Email already registered" error permanently on screen even after the user completely changes the email address to a new domain.
3. **The Index-Based Dynamic List Corruption:** Keying field errors by array index (`errors[index]`), such that deleting or reordering contact rows attaches Contact A's error to Contact B.
4. **The Accessibility Black Hole:** Styling an input border red without `aria-invalid="true"` or `aria-describedby`, leaving blind and screen-reader users completely unaware that validation failed.
5. **The Focus-Stealing Keystroke Loop:** Triggering `inputRef.current.focus()` inside an uncontrolled `useEffect` on every keystroke error change, hijacking user cursor focus mid-sentence.
6. **The Network Failure Misdirection:** Flattering an HTTP 500 database outage into an inline "Invalid email" error message, misleading the user into modifying correct data.

The objective of this Part is to master **Form Errors & Error Presentation Architecture**: cleanly decoupling **Error Existence** from **Error Visibility** and **Error Presentation**, engineering **multi-scoped error taxonomies** (Field vs. Cross-Field vs. Form vs. System), establishing **semantic accessibility graphs** (`aria-invalid`, `aria-describedby`, stable IDs), managing **dynamic list error lifecycles**, building **accessible Error Summaries with deep-linking and focus management**, and creating **normalized server error adapters**.

---

# ⚡ LAYER 1 — 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Master Error Triad: Existence vs. Visibility vs. Presentation

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. ERROR EXISTENCE (Domain & Validation Logic)                                         │
│ • Pure mathematical evaluation: "Does the current value violate any constraint?"       │
│ • Computed instantaneously during render or returned from authoritative server APIs.   │
│ • Independent of user interaction history or UI rendering rules.                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. ERROR VISIBILITY (Interaction Policy & Metadata Engine)                             │
│ • Policy decision: "Has the user interacted enough to justify seeing this failure?"    │
│ • Evaluates interaction flags: (isTouched && !isFocused) || isSubmitted.               │
│ • Prevents premature error display on clean, untouched form fields.                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. ERROR PRESENTATION (UI, Accessibility & Navigation Architecture)                    │
│ • Render strategy: Inline message, error banner, summary list, or modal alert.         │
│ • Semantic accessibility: aria-invalid, aria-describedby, role="alert", stable IDs.   │
│ • Focus & Scroll coordination: Moving keyboard focus to the summary or first error.    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **The Master Principle:**  
> **An error is domain information. Error visibility is interaction policy. Error presentation is UI and accessibility architecture.**  
> Never clear validation errors from domain state merely because you want them hidden in the UI.

---

## 2. Master Form Error Taxonomy & Topological Flow

```text
                                  FORM FAILURE TOPOLOGY
                                            │
      ┌──────────────────┬──────────────────┼──────────────────┬──────────────────┐
      ▼                  ▼                  ▼                  ▼                  ▼
FIELD VALIDATION   CROSS-FIELD INVARIANT   FORM/BUSINESS RULE   SERVER ERROR (422)  SYSTEM / NETWORK
• Required checks  • startDate <= endDate  • "Account locked"   • Uniqueness error  • 500 Server Crash
• Regex formats    • password !== current  • "Exceeds quota"    • DB Constraint     • Network Offline
• Min/Max length   • shipping/billing opt  • Multi-field combo  • Normalized map    • Gateway Timeout
      │                  │                  │                  │                  │
      ▼                  ▼                  ▼                  ▼                  ▼
[Inline Input]     [Group / Form]     [Form Top Banner]  [Inline + Invalidate][Global Banner + Retry]
```

---

## 3. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Error Existence** | Validation or server produces violation data. | Determines true domain validity. | Treating error visibility as validity (thinking hidden = valid). |
| **Error Visibility** | Evaluates interaction flags (`touched`, `submitted`). | Delivers clean, non-hostile user experience. | Deleting errors from state just to hide them from the UI. |
| **Field-Level Error** | Error mapped to a single distinct field key. | Provides local, actionable guidance. | Mapping errors by array index instead of stable domain IDs. |
| **Cross-Field Error** | Invariant spanning multiple interdependent fields. | Communicates relational domain rules. | Forcing relational errors onto one arbitrary input field. |
| **Form-Level Error** | Operational or permission constraint on submission. | Handles non-field-specific rejections. | Flattening form-level authorization failures into random inputs. |
| **Global/System Error**| Infrastructure or transport failure (500, Offline). | Communicates transient system status. | Displaying backend network failures as "invalid user input". |
| **Error Summary** | Aggregated list of all visible errors at form top. | Enables rapid orientation on large forms. | Rendering a static summary without interactive anchor deep-links. |
| **`aria-invalid`** | Semantic DOM attribute communicating invalidity. | Critical for assistive screen readers. | Tying `aria-invalid` solely to visual styling rather than validity. |
| **`aria-describedby`**| Links input to its specific error message DOM element. | Screen readers announce error on input focus. | Using dynamic, unstable, or missing DOM IDs. |
| **Focus Management** | Imperative navigation to summary or first error on submit. | Streamlines keyboard accessibility. | Stealing focus on every keystroke validation cycle via `useEffect`. |
| **Error Invalidation**| Invalidating stale server errors upon field keystroke. | Prevents confusing users with stale errors. | Indiscriminately wiping all server errors when any field changes. |
| **Error Normalization**| Adapter converting varied API payloads into domain maps. | Decouples UI components from HTTP transport. | Scattering HTTP 422 parsing logic across multiple leaf components. |

---

## 4. The Golden Rule of Form Error Architecture

> [!IMPORTANT]
> **The Golden Rule:**  
> **Do not ask only "Does this field have an error?" Ask:**  
> **What error exists, where does it belong, is it still relevant, when should it be visible, and how should it be communicated?**

---

## 5. Visual Summary of Error Presentation Topologies

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOPOLOGY A: THE ACCESSIBLE INLINE FIELD                                                │
│                                                                                        │
│   Email Address *                                                                      │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ alice@taken-domain.com                                            [ ⚠️ Error ] │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│   ▲ aria-invalid="true" | aria-describedby="email-error-msg"                           │
│   │                                                                                    │
│   └─► ⚠️ [email-error-msg] This email is already registered. (role="alert")           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TOPOLOGY B: THE COMPOSITE FORM ERROR SUMMARY (Top of Form)                             │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │ 🚨 There are 3 errors in your submission:                                      │   │
│   │  • [Email Address]: Must be a valid company domain                             │   │
│   │  • [Password]: Must contain at least one special character                     │   │
│   │  • [Date Range]: End date must be on or after start date                       │   │
│   └────────────────────────────────────────────────────────────────────────────────┘   │
│   ▲ Focus target on failed submit | Links jump directly to offending inputs            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 🔬 LAYER 2 — Deep Mechanical Breakdown

## 1. Error Existence vs. Error Visibility: The Separation of Concerns

Consider a form with synchronous validation rules:

```typescript
interface FormValues {
  email: string;
  age: string;
}

function validate(values: FormValues) {
  const errors: Record<string, string> = {};
  if (!values.email) errors.email = "Email is required.";
  if (!values.age) errors.age = "Age is required.";
  return errors;
}
```

Upon initial component mount with empty values `values = { email: "", age: "" }`:
- `errors.email` is `"Email is required."`
- `errors.age` is `"Age is required."`

**The errors exist.** The form is mathematically **invalid**.

However, if the UI displayed these errors immediately upon page load:
- The user would be greeted with aggressive red banners before taking any action.
- The interaction is hostile, jarring, and contrary to standard UX heuristics.

```text
                               THE SEPARATION PIPELINE
                               
       [Form Draft Values] ───► [Validation Engine] ───► [Error Existence Map]
                                                                │
                                                                ▼
       [Interaction State] ───► [Visibility Policy] ───► [Visible Errors in UI]
       (touched, submitted)
```

### Deriving Error Visibility in Render:
```tsx
// ✅ CORRECT: Pure derived visibility without duplicating error state
function EmailField({ value, error, isTouched, isSubmitted, onChange, onBlur }) {
  // Pure derivation: Only show error if error exists AND user interacted
  const isVisible = Boolean(error) && (isTouched || isSubmitted);
  const isInvalid = Boolean(error);

  return (
    <div className="field-group">
      <label htmlFor="email-input">Email Address</label>
      <input
        id="email-input"
        type="email"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={isInvalid}
        aria-describedby={isVisible ? "email-error" : undefined}
        className={isVisible ? "input-border-error" : "input-border-normal"}
      />
      {isVisible && (
        <p id="email-error" role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
```

---

## 2. Why `touched` Is Not Validity and `submitted` Is Not Invalidity

A frequent junior misconception is writing state logic that equates interaction flags with validity:

```text
❌ JUNIOR MENTAL MODEL:
touched = true   ==>  invalid = true
submitted = true ==>  invalid = true
```

```text
✅ SENIOR PRODUCTION MENTAL MODEL:
• touched:   Historical interaction fact ("Has user focused and blurred this input?")
• submitted: Historical interaction fact ("Did user attempt form submission?")
• valid:     Pure constraint evaluation ("Does the value satisfy domain invariants?")
```

### The 4 Quadrants of Form Field State:
```text
                       VALID = TRUE                      VALID = FALSE
             ┌───────────────────────────────┬───────────────────────────────┐
             │ Quadrant 1: Pristine Valid    │ Quadrant 2: Pristine Invalid  │
UNTOUCHED    │ Value: Pre-filled "Alice"     │ Value: Empty "" (Required)    │
             │ Touched: false | Valid: true  │ Touched: false | Valid: false │
             │ UI: Clean (No Error Shown)    │ UI: Clean (Hidden from user!) │
             ├───────────────────────────────┼───────────────────────────────┤
             │ Quadrant 3: Visited Valid     │ Quadrant 4: Visited Invalid   │
TOUCHED      │ Value: "alice@example.com"    │ Value: "not-an-email"         │
             │ Touched: true | Valid: true   │ Touched: true | Valid: false  │
             │ UI: Valid / Green Checkmark   │ UI: Visible Red Error Message │
             └───────────────────────────────┴───────────────────────────────┘
```

When `submitted = true`, the form's visibility policy transitions from:
*"Show errors only for touched fields"* ──► *"Show errors for ALL invalid fields"*.

---

## 3. Detailed Error Taxonomy & Multi-Scoped Architecture

Production systems encounter multiple distinct failure modes. Flattening all errors into a single string creates brittle UIs.

```typescript
export interface ComprehensiveFormErrors<T> {
  // 1. Synchronous or Asynchronous Client-Side Field Failures
  fieldErrors: Partial<Record<keyof T, string[]>>;

  // 2. Multi-Field Invariant Failures (e.g. startDate > endDate)
  crossFieldErrors: Array<{
    id: string;
    fields: Array<keyof T>;
    message: string;
  }>;

  // 3. Form-Level Operational & Business Rule Failures (e.g. Account suspended)
  formErrors: string[];

  // 4. Transport & Infrastructure Failures (HTTP 500, Gateway Timeout, Offline)
  globalErrors: Array<{
    code: 'OFFLINE' | 'TIMEOUT' | 'SERVER_ERROR' | 'UNAUTHORIZED';
    message: string;
    retryable: boolean;
  }>;
}
```

### Error Scope Mapping:
1. **Field-Level Errors:** Associated directly with a single input control. Rendered adjacent to the input.
2. **Cross-Field Errors:** Spans a relationship between 2 or more inputs. Rendered across the group container or in the Error Summary.
3. **Form-Level Errors:** Operational constraints (e.g. "Monthly transfer limit reached"). Rendered in a prominent alert box above form controls.
4. **Global System Errors:** Infrastructure crashes. Rendered with retry actions, preserving all user input.

---

## 4. Render Snapshot Timing & State Transitions

Let us examine the exact sequence when a user submits an invalid form:

```tsx
function ProfileForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Calculate next errors synchronously
    const nextErrors: Record<string, string> = {};
    if (!email) nextErrors.email = "Email is required.";

    // 2. Queue state updates
    setErrors(nextErrors);
    setIsSubmitted(true);

    // 3. In the current render snapshot, errors is still {}!
    // We must evaluate nextErrors directly for execution logic:
    if (Object.keys(nextErrors).length === 0) {
      dispatchApi({ email });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      {isSubmitted && errors.email && <span>{errors.email}</span>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

```text
TIMELINE OF RENDER SNAPSHOTS:
─────────────────────────────────────────────────────────────────────────────
Time t0 (Render #1):
  email = "" | errors = {} | isSubmitted = false
  User clicks "Submit" button.

Time t1 (Inside handleSubmit event callback):
  Closure references Render #1 snapshot: email = "", errors = {}
  nextErrors calculated: { email: "Email is required." }
  setErrors(nextErrors) queued.
  setIsSubmitted(true) queued.
  Synchronous execution ends.

Time t2 (Render #2 - React Re-render):
  email = "" | errors = { email: "Email is required." } | isSubmitted = true
  isSubmitted && errors.email evaluates to TRUE.
  DOM updated: Error message rendered into DOM.
  Accessibility tree updated: Screen reader receives alert.
```

---

## 5. Server Error Lifecycles & Semantic Invalidation

When an API responds with HTTP 422:
```json
{
  "status": 422,
  "errors": {
    "email": "This email address is already registered to another user."
  }
}
```

That error describes the **exact string payload that was submitted** (e.g. `"alice@taken.com"`).

```text
                        SERVER ERROR INVALIDATION GRAPH
                        
  [Server Returns 422: email taken] ──► Render Error: "alice@taken.com is taken"
                                               │
                               User types: 'x' │ (Keystroke on Email)
                                               ▼
                                  [Invalidate Email Error]
                                  • Delete serverFieldErrors.email
                                  • Retain password errors (unrelated!)
                                  • Retain global permissions (unrelated!)
```

### Targeted Error Invalidation Architecture:
```typescript
const handleFieldChange = (field: keyof FormValues, value: string) => {
  // 1. Update draft
  setDraft(prev => ({ ...prev, [field]: value }));

  // 2. Invalidate ONLY the server error associated with this field
  setServerFieldErrors(prev => {
    if (!prev[field]) return prev;
    const next = { ...prev };
    delete next[field];
    return next;
  });

  // 3. Retain form-level errors unless they depend on this specific field
};
```

> [!CAUTION]
> **Anti-Pattern Warning:** Never execute `setServerErrors({})` indiscriminately inside a generic `onChange` handler. If the server returned an authorization error or a billing zip error, editing the "First Name" input must not hide the billing zip error!

---

## 6. Accessibility Architecture: `aria-invalid`, `aria-describedby` & Stable IDs

Accessible forms require explicit semantic relationships in the DOM tree:

```text
                               ACCESSIBILITY DOM GRAPH
                               
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ <label htmlFor="user-email-input">Email Address</label>                     │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ <input                                                                      │
  │   id="user-email-input"                                                     │
  │   aria-invalid="true"                                                       │
  │   aria-describedby="user-email-help user-email-err"                         │
  │ />                                                                          │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ <p id="user-email-help">Enter your corporate email address.</p>             │
  │ <p id="user-email-err" role="alert">Email is already registered.</p>        │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### Essential ARIA Attributes for Form Errors:
1. **`aria-invalid="true"`**:
   - Informs assistive technology that the field's current value fails validation constraints.
   - Screen readers announce "Invalid entry" or "Invalid data" immediately upon navigating to the input.
2. **`aria-describedby="[id1] [id2]"`**:
   - Creates a direct relationship between the `<input>` and its descriptive/error `<p>` elements.
   - When the user focuses the input, the screen reader reads the label **followed automatically by the error message**.
3. **`role="alert"` (or `aria-live="assertive"` / `aria-live="polite"`)**:
   - Directs screen readers to immediately interrupt and announce dynamic errors when they appear.
4. **Stable IDs**:
   - Dynamic IDs generated by index (e.g. `id={"err-" + index}`) cause accessibility breakages when rows are reordered or filtered. Always use deterministic, domain-stable IDs (e.g. `id={`field-err-${fieldKey}`}`).

---

## 7. Error Summary & Deep Navigation Architecture

For complex, multi-section forms (e.g. checkout, onboarding, insurance claims), relying exclusively on inline errors is insufficient. Users with cognitive disabilities, keyboard navigators, or mobile users zoomed into one section cannot see errors in off-screen fields.

```text
                             ERROR SUMMARY ARCHITECTURE
                             
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ 🚨 Error Summary (role="alert", tabIndex={-1}, ref={summaryRef})            │
  │ Please correct the following 3 errors before proceeding:                    │
  │                                                                             │
  │ 1. <a href="#input-email" onClick={jumpToField}>Email is required</a>       │
  │ 2. <a href="#input-password" onClick={jumpToField}>Password too short</a>   │
  │ 3. <a href="#input-zip" onClick={jumpToField}>Invalid postal code</a>       │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### Dual-Layer Presentation:
- **High-Level Summary:** Positioned at the top of the form. Lists all visible violations as clickable anchor links.
- **Local Inline Feedback:** Rendered directly below each offending input with descriptive instructions.

---

## 8. Imperative Focus Management on Failed Submission

When form submission fails due to validation errors, the application should programmatically guide the user's keyboard focus to the first actionable failure.

```text
                               FOCUS MANAGEMENT FLOW
                               
         User Clicks Submit ──► Validation Engine Runs (Errors Detected)
                                                │
                                                ▼
                                    Render Error Summary & Messages
                                                │
                                                ▼
                                [Intentional Focus Synchronization]
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
           [Policy A: Summary Focus]                             [Policy B: First Field]
           summaryRef.current?.focus()                           firstInvalidInputRef.focus()
           (Best for large multi-page forms)                     (Best for short single-page forms)
```

```typescript
// ✅ CORRECT: Intentional focus synchronization ONLY on failed submit intent
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitted(true);

  const validationErrors = validate(draft);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);

    // Synchronize focus after React renders the error summary into the DOM
    requestAnimationFrame(() => {
      if (summaryRef.current) {
        summaryRef.current.focus();
      } else {
        const firstErrorKey = Object.keys(validationErrors)[0];
        const element = document.getElementById(`field-${firstErrorKey}`);
        element?.focus();
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return;
  }

  // Dispatch API...
};
```

> [!WARNING]
> **Anti-Pattern Warning: Focus Theft During Typing:**  
> Never attach imperative `focus()` calls inside an `onChange` or a generic `useEffect([errors])`. If focus is stolen while the user is actively typing, the input cursor will jump erratically, destroying user input!

---

## 9. Dynamic Field Lists & Entity-Based Error Mapping

In dynamic form lists (e.g. line items, invitations, phone numbers), rows can be added, deleted, and reordered.

```text
❌ DANGEROUS: Array-Index Error Mapping
contacts = [ { id: "c1", name: "Alice" }, { id: "c2", name: "Bob" } ]
errors = { "1": "Invalid email" }  <-- Error attached to index 1 (Bob)

User deletes Contact 0 (Alice):
contacts = [ { id: "c2", name: "Bob" } ]
errors = { "1": "Invalid email" }  <-- Index 1 no longer exists! Bob is now index 0!
```

```text
✅ ROBUST: Stable Entity ID Error Mapping
contacts = [ { id: "c1", name: "Alice" }, { id: "c2", name: "Bob" } ]
errors = { "c2_email": "Invalid email" }  <-- Error attached to stable entity ID "c2"

User deletes Contact 0 (Alice):
contacts = [ { id: "c2", name: "Bob" } ]
errors = { "c2_email": "Invalid email" }  <-- Error stays permanently bound to Bob!
```

---

## 10. Server Error Normalization Boundary

Enterprise systems interact with multiple backend microservices, REST APIs, GraphQL endpoints, and third-party gateways. Each service may return errors in different shapes:

```text
API A (Django/DRF):   { "email": ["This field is required."] }
API B (Spring Boot):   { "violations": [ { "field": "email", "message": "Invalid format" } ] }
API C (Node/Express):  { "errors": [ { "param": "email", "msg": "Already taken" } ] }
API D (GraphQL):       { "errors": [ { "message": "...", "extensions": { "field": "email" } } ] }
```

UI components should **never** know the transport-level serialization format. A senior architecture implements an **Error Normalization Adapter**:

```typescript
export interface NormalizedErrors {
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
  globalErrors: string[];
}

export function normalizeServerErrors(rawResponse: any, httpStatus: number): NormalizedErrors {
  const result: NormalizedErrors = {
    fieldErrors: {},
    formErrors: [],
    globalErrors: []
  };

  if (httpStatus >= 500) {
    result.globalErrors.push("Internal server error. Please retry later.");
    return result;
  }

  if (httpStatus === 401 || httpStatus === 403) {
    result.formErrors.push(rawResponse?.message || "You lack permission to perform this action.");
    return result;
  }

  if (httpStatus === 422) {
    // Adapter Strategy 1: { violations: [ { field, message } ] }
    if (Array.isArray(rawResponse?.violations)) {
      for (const v of rawResponse.violations) {
        result.fieldErrors[v.field] = result.fieldErrors[v.field] || [];
        result.fieldErrors[v.field].push(v.message);
      }
      return result;
    }

    // Adapter Strategy 2: { errors: { field: "message" } }
    if (rawResponse?.errors && typeof rawResponse.errors === 'object' && !Array.isArray(rawResponse.errors)) {
      for (const [key, val] of Object.entries(rawResponse.errors)) {
        result.fieldErrors[key] = Array.isArray(val) ? val.map(String) : [String(val)];
      }
      return result;
    }

    // Fallback: Generic form error
    result.formErrors.push(rawResponse?.message || "Validation failed on server.");
  }

  return result;
}
```

---

## 11. Complete Production Implementation

Below is a complete, enterprise-grade form implementation featuring:
- Pure client validation derivation
- Separate interaction metadata (`touched`, `submitted`)
- Accessible Error Summary with anchor deep-linking
- Semantic `aria-invalid` and `aria-describedby` wiring
- Stable DOM IDs and focus management
- Server error normalization and keystroke invalidation

```tsx
import React, { useState, useRef, useMemo, useCallback } from 'react';

// --- Domain Types ---
export interface RegistrationFormValues {
  fullName: string;
  email: string;
  organization: string;
  plan: string;
  acceptTerms: boolean;
}

export interface FormErrorState {
  fieldErrors: Partial<Record<keyof RegistrationFormValues, string[]>>;
  crossFieldErrors: string[];
  formErrors: string[];
}

const INITIAL_VALUES: RegistrationFormValues = {
  fullName: '',
  email: '',
  organization: '',
  plan: 'team',
  acceptTerms: false,
};

export function EnterpriseRegistrationForm() {
  // 1. Core State
  const [values, setValues] = useState<RegistrationFormValues>(INITIAL_VALUES);
  const [touched, setTouched] = useState<Partial<Record<keyof RegistrationFormValues, boolean>>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState<Partial<Record<keyof RegistrationFormValues, string[]>>>({});
  const [serverFormErrors, setServerFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Refs for Imperative Focus Management
  const summaryRef = useRef<HTMLDivElement>(null);

  // 3. Synchronous Pure Validation Derivation (Error Existence)
  const clientValidationErrors = useMemo(() => {
    const errors: Partial<Record<keyof RegistrationFormValues, string[]>> = {};

    if (!values.fullName.trim()) {
      errors.fullName = ['Full name is required.'];
    } else if (values.fullName.trim().length < 3) {
      errors.fullName = ['Full name must be at least 3 characters.'];
    }

    if (!values.email.trim()) {
      errors.email = ['Email address is required.'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = ['Please provide a valid email format (e.g. name@domain.com).'];
    }

    if (values.plan === 'enterprise' && !values.organization.trim()) {
      errors.organization = ['Organization name is required for Enterprise plans.'];
    }

    if (!values.acceptTerms) {
      errors.acceptTerms = ['You must accept the terms and conditions to proceed.'];
    }

    return errors;
  }, [values]);

  // Merge Client + Server Field Errors
  const allFieldErrors = useMemo(() => {
    const combined: Partial<Record<keyof RegistrationFormValues, string[]>> = { ...clientValidationErrors };
    for (const [key, msgs] of Object.entries(serverFieldErrors)) {
      const fieldKey = key as keyof RegistrationFormValues;
      combined[fieldKey] = [...(combined[fieldKey] || []), ...(msgs || [])];
    }
    return combined;
  }, [clientValidationErrors, serverFieldErrors]);

  const hasErrors = useMemo(() => {
    const hasField = Object.values(allFieldErrors).some(errs => errs && errs.length > 0);
    const hasForm = serverFormErrors.length > 0;
    return hasField || hasForm;
  }, [allFieldErrors, serverFormErrors]);

  // 4. Field Interaction Handlers
  const handleChange = (field: keyof RegistrationFormValues, val: any) => {
    setValues(prev => ({ ...prev, [field]: val }));

    // Invalidate stale server errors for this specific field on keystroke
    if (serverFieldErrors[field]) {
      setServerFieldErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field: keyof RegistrationFormValues) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // 5. Submit Handler with Focus Coordination
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Client Pre-Flight Gate
    if (Object.keys(clientValidationErrors).length > 0) {
      requestAnimationFrame(() => {
        summaryRef.current?.focus();
      });
      return;
    }

    setIsSubmitting(true);
    setServerFormErrors([]);

    try {
      // Simulated API Call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock Server Rejection Example:
      if (values.email.toLowerCase().includes('taken')) {
        setServerFieldErrors({
          email: ['This email is already associated with an active enterprise account.']
        });
        requestAnimationFrame(() => {
          summaryRef.current?.focus();
        });
        return;
      }

      alert('Form submitted successfully!');
    } catch (err: any) {
      setServerFormErrors(['System gateway timeout. Please try again.']);
      requestAnimationFrame(() => {
        summaryRef.current?.focus();
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Accessible Error List for Summary
  const errorSummaryList = useMemo(() => {
    const list: Array<{ id: string; fieldName: string; message: string; targetId: string }> = [];
    for (const [key, msgs] of Object.entries(allFieldErrors)) {
      const fieldKey = key as keyof RegistrationFormValues;
      const isVisible = Boolean(msgs?.length) && (touched[fieldKey] || isSubmitted);
      if (isVisible && msgs) {
        msgs.forEach((m, idx) => {
          list.push({
            id: `${fieldKey}-${idx}`,
            fieldName: fieldKey.toUpperCase(),
            message: m,
            targetId: `input-${fieldKey}`
          });
        });
      }
    }
    return list;
  }, [allFieldErrors, touched, isSubmitted]);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Enterprise User Registration</h1>

      {/* --- Accessible Error Summary --- */}
      {isSubmitted && errorSummaryList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="summary-heading"
          style={{
            background: '#fef2f2',
            border: '2px solid #ef4444',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            outline: 'none'
          }}
        >
          <h2 id="summary-heading" style={{ color: '#991b1b', fontSize: '1.1rem', margin: '0 0 8px 0' }}>
            There are {errorSummaryList.length} problems with your submission:
          </h2>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#b91c1c' }}>
            {errorSummaryList.map(item => (
              <li key={item.id} style={{ marginBottom: '4px' }}>
                <a
                  href={`#${item.targetId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(item.targetId);
                    el?.focus();
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  style={{ color: '#b91c1c', fontWeight: 'bold' }}
                >
                  {item.fieldName}: {item.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Server Form Banner --- */}
      {serverFormErrors.length > 0 && (
        <div role="alert" style={{ background: '#7f1d1d', color: '#fff', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
          {serverFormErrors.join(' ')}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Full Name Field */}
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="input-fullName" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
            Full Name *
          </label>
          <input
            id="input-fullName"
            type="text"
            value={values.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            onBlur={() => handleBlur('fullName')}
            aria-invalid={Boolean(allFieldErrors.fullName?.length)}
            aria-describedby={
              (touched.fullName || isSubmitted) && allFieldErrors.fullName
                ? 'err-fullName'
                : undefined
            }
            style={{
              width: '100%',
              padding: '10px',
              border: `2px solid ${(touched.fullName || isSubmitted) && allFieldErrors.fullName ? '#ef4444' : '#cbd5e1'}`,
              borderRadius: '6px'
            }}
          />
          {(touched.fullName || isSubmitted) && allFieldErrors.fullName && (
            <p id="err-fullName" role="alert" style={{ color: '#ef4444', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              {allFieldErrors.fullName.join(' ')}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="input-email" style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
            Corporate Email Address *
          </label>
          <input
            id="input-email"
            type="email"
            value={values.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            aria-invalid={Boolean(allFieldErrors.email?.length)}
            aria-describedby={
              (touched.email || isSubmitted) && allFieldErrors.email
                ? 'err-email'
                : undefined
            }
            style={{
              width: '100%',
              padding: '10px',
              border: `2px solid ${(touched.email || isSubmitted) && allFieldErrors.email ? '#ef4444' : '#cbd5e1'}`,
              borderRadius: '6px'
            }}
          />
          {(touched.email || isSubmitted) && allFieldErrors.email && (
            <p id="err-email" role="alert" style={{ color: '#ef4444', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
              {allFieldErrors.email.join(' ')}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            background: '#6366f1',
            color: '#fff',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {isSubmitting ? 'Registering Account...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );
}
```

---

# 🧪 LAYER 3 — Diagnostic Labs & DevTools Profiling

## Lab 01: Error Existence vs. Visibility Inspector
**Objective:** Confirm that validation error calculations (Existence) occur independently of interaction flags (Visibility).
- **Execution:** Initialize `values = { email: "" }`. Observe `errors.email === "Required"`, while `isVisible === false`.
- **Trigger:** Focus and blur the field (`setTouched(true)`).
- **Result:** `isVisible === true` with identical underlying error message.

---

## Lab 02: Chrome Accessibility Tree Verification
**Objective:** Verify that `aria-invalid` and `aria-describedby` establish valid semantic nodes in the browser accessibility tree.
1. Open Chrome DevTools ──► Elements tab ──► Accessibility pane.
2. Select `<input id="input-email">`.
3. Verify that under **Computed Properties**:
   - `Invalid: true` is displayed.
   - `Description: "Email address is required."` is mapped from the referenced ID.

---

## Lab 03: Keystroke Server Error Invalidation Audit
**Objective:** Ensure server errors are invalidated cleanly on user keystroke without hiding unrelated field errors.
1. Enter `taken@example.com` and submit.
2. Backend responds HTTP 422: `email: "Email already taken"`, `password: "Too weak"`.
3. Type `"2"` into email input.
4. **Verification:** `email` server error disappears immediately; `password` error remains intact.

---

## Lab 04: Focus Stealing Prevention Audit
**Objective:** Prove that typing into an invalid field does not trigger focus jumps.
1. Type invalid text `"abc"` into an email field that runs live regex validation.
2. Ensure the cursor remains at index 3 and typing continues smoothly without focus blur or input re-selection.

---

## Lab 05: Dynamic Row Entity ID Stability
**Objective:** Reorder a 3-row contact list where Row 2 has an error.
1. Key errors by entity ID `c2_email`.
2. Swap Row 1 and Row 2.
3. Verify that Row 2 retains its error styling in its new DOM position.

---

## Lab 06: Error Summary Deep-Linking Navigation
**Objective:** Submit an empty 10-field form.
1. Observe focus transfer to the Error Summary container (`role="alert"`).
2. Click anchor link for *"Zip Code is required"*.
3. Verify browser smoothly scrolls to and focuses `<input id="input-zip">`.

---

## Lab 07: Stale Async Response Race Protection
**Objective:** Dispatch slow Request A (1500ms) that fails with error, followed immediately by fast Request B (300ms) that succeeds.
1. Verify Request B renders success.
2. Verify Request A completes later but is discarded via sequence token check (`requestId !== sequenceRef.current`).

---

## Lab 08: Universal Error Normalizer Test
**Objective:** Pass 4 different API error shapes (Django, Spring, Express, GraphQL) through `normalizeServerErrors()`.
- Confirm all 4 shapes produce an identical normalized structure `{ fieldErrors: {}, formErrors: [], globalErrors: [] }`.

---

# 🔥 LAYER 4 — The Crucible: Gauntlet Challenges & Runbooks

## 8 Crucible Challenges

### Challenge 01: The Hidden Invariant
```tsx
const errors = { email: "Required" };
const touched = { email: false };
const isSubmitted = false;
```
- **Question:** Is the form valid or invalid? Is the error visible or hidden?
- **Answer:** The form is **invalid** (`Boolean(errors.email) === true`), but the error is **hidden** from the UI.
- **Reasoning:** Error existence is a domain fact; error visibility is an interaction policy.

---

### Challenge 02: The Submit Visibility Transition
```tsx
// User clicks submit on an untouched invalid form
```
- **Question:** Did the form's validity change when the user clicked submit?
- **Answer:** No! The validation result already existed. What changed was `isSubmitted = true`, which unlocked the visibility policy to render all existing errors.

---

### Challenge 03: Server Error Overwrite Race
```tsx
// Request A (submit) fails at 2000ms.
// Request B (submit) succeeds at 500ms.
```
- **Question:** If Request A finishes last, should its error banner appear?
- **Answer:** No. Request A is obsolete. A monotonic request token guard must discard Request A's response.

---

### Challenge 04: The Dynamic Row Index Trap
```tsx
const [contacts, setContacts] = useState([{ id: "a" }, { id: "b" }]);
const [errors, setErrors] = useState({ 1: "Invalid email" }); // Keyed by index 1 (b)
// User deletes contact 0 (a)
```
- **Question:** What happens to the error under Contact B?
- **Answer:** Contact B is now at index 0, so the error at index 1 is orphaned and disappears or attaches to a nonexistent element.
- **Senior Fix:** Key errors by stable domain ID `errors["b_email"]`.

---

### Challenge 05: Cross-Field Invariant Attribution
```tsx
values = { startDate: "2026-10-01", endDate: "2026-09-01" };
```
- **Question:** Which individual field is invalid?
- **Answer:** Neither field is invalid on its own; the **relational invariant** (`startDate <= endDate`) is violated. It should be presented as a cross-field error.

---

### Challenge 06: Infrastructure 500 Misdirection
```tsx
// Server returns HTTP 500 Database Crash during form save
```
- **Question:** Should the UI render *"Email is invalid"*?
- **Answer:** Absolutely not! The user's input is valid; the infrastructure failed. Display a global retryable system banner.

---

### Challenge 07: The Keystroke Focus Stealing Trap
```tsx
useEffect(() => {
  if (errors.email) emailRef.current?.focus();
}, [errors.email]);
```
- **Question:** What catastrophic bug does this introduce while typing?
- **Answer:** As soon as the user types an invalid character, the effect fires and steals/resets focus, interrupting text selection and caret flow.

---

### Challenge 08: Minimal Canonical State
```tsx
// Model A: { hasError, emailError, showEmailError, emailInvalid }
// Model B: { errors: { email }, touched: { email }, isSubmitted }
```
- **Question:** Why is Model B vastly superior?
- **Answer:** Model B stores only canonical source facts and derives visibility purely in render, eliminating impossible desynchronized states.

---

## 5 Production Incident Post-Mortems

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 1: THE PREMATURE RED WALL ABANDONMENT RATE SPIKE                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Onboarding drop-off rate surged 42% on a financial signup flow.          │
│ Root Cause:   The form rendered validation errors immediately on mount before any      │
│               user keystrokes, scaring users with 8 red error warnings.                │
│ Fix:          Decoupled existence from visibility: derived show = isTouched || isSubmit│
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 2: THE REORDERED INVOICE LINE ITEM CORRUPTION                                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Accounting users reported errors jumping to wrong rows when deleting items│
│ Root Cause:   Errors were stored as errors[rowIndex]. Deleting row 0 shifted indices. │
│ Fix:          Refactored dynamic error storage to use immutable UUID keys (errors[id]).│
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 3: THE BLIND SCREEN READER CHECKOUT OUTAGE                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Legally blind users could not complete payment on e-commerce store.      │
│ Root Cause:   Errors were rendered as visual red text without aria-invalid or          │
│               aria-describedby. Screen readers announced "Submit Button" with no cues. │
│ Fix:          Implemented full ARIA semantic graph with role="alert" Error Summary.    │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 4: THE STALE EMAIL CONFLICT LOCK                                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Users could not submit new email after initial 422 conflict rejection.   │
│ Root Cause:   The form saved server errors in static state and never cleared them      │
│               when the user typed a new valid email string.                            │
│ Fix:          Implemented targeted keystroke invalidation on specific field change.    │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 5: THE DATABASE CRASH FALSE BLAME INCIDENT                                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Users spent 20 minutes changing passwords during AWS Postgres outage.    │
│ Root Cause:   The catch (err) block mapped all HTTP rejections to password error field.│
│ Fix:          Built error normalization boundary distinguishing 422 from 500 outages.  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 Senior Architecture Decision Matrix

```text
                           FORM ERROR ARCHITECTURE
                                      │
                   What error dimension is being evaluated?
                                      │
     ┌──────────────────┬─────────────┴──────────────┬──────────────────┐
     ▼                  ▼                            ▼                  ▼
ERROR EXISTENCE   ERROR VISIBILITY             ACCESSIBILITY       FOCUS MANAGEMENT
───────────────   ────────────────             ─────────────       ────────────────
• Pure function   • isTouched \|\| isSubmitted • aria-invalid      • Focus summary on submit
• Computed in     • Clean on mount             • aria-describedby  • Avoid focus theft
  render          • Invalidate on keystroke    • role="alert"        during typing
```

---

## 📋 40-Point KPI 08 Part 11 Mastery Checklist

- [x] Strictly distinguish **Error Existence** (domain facts) from **Error Visibility** (interaction policy).
- [x] Decouple **Error Visibility** from **Error Presentation** (inline, summary, or banner).
- [x] Never delete validation errors from domain state merely to hide them visually.
- [x] Understand that `touched = false` does not imply `valid = true`.
- [x] Understand that `submitted = true` does not imply `invalid = true`.
- [x] Implement the 4-quadrant interaction model (Pristine Valid, Pristine Invalid, Visited Valid, Visited Invalid).
- [x] Model **Field-Level Errors** mapped to specific domain field keys.
- [x] Model **Cross-Field Invariant Errors** (e.g. `startDate <= endDate`).
- [x] Model **Form-Level Business Errors** (e.g. Account suspended).
- [x] Model **Global System & Infrastructure Errors** (HTTP 500, Network Offline).
- [x] Distinguish client-side validation failures from backend network/server outages.
- [x] Create an **Error Normalization Adapter** to convert varied API payloads into domain models.
- [x] Key dynamic list errors by **stable domain entity IDs**, never array indices.
- [x] Handle dynamic field deletion by cleaning up associated entity error state.
- [x] Implement targeted server-error invalidation on field keystroke.
- [x] Never wipe all server errors indiscriminately on unrelated field edits.
- [x] Protect async server errors against out-of-order race conditions using sequence tokens.
- [x] Use `aria-invalid="true"` to communicate invalidity to assistive technology.
- [x] Link inputs to error messages using `aria-describedby="[id]"`.
- [x] Maintain stable, deterministic DOM IDs for all error elements.
- [x] Add `role="alert"` or `aria-live="assertive"` to dynamic error text.
- [x] Build an accessible **Error Summary** container at the top of large forms.
- [x] Provide clickable anchor deep-links inside Error Summaries linking to offending inputs.
- [x] Move focus programmatically to the Error Summary or first invalid field upon failed submit.
- [x] Never steal or move focus during ordinary keystroke editing.
- [x] Keep synchronous validation calculations purely in render without `useEffect`.
- [x] Store minimal canonical state (`values`, `touched`, `isSubmitted`) and derive visibility.
- [x] Prevent multiple impossible boolean error states (`hasError`, `isInvalid`, `showError`).
- [x] Verify semantic accessibility nodes in Chrome DevTools Accessibility Pane.
- [x] Profile render cycles during error state transitions using React DevTools Profiler.

---

[⬅️ Previous Part (10: Form Submission & Server Validation)](10-form-submission-and-server-validation.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/11-form-errors-and-error-presentation.html) | [Next Part (12: Advanced Form Interaction Architecture) ➡️](12-advanced-form-interaction-architecture.md)
