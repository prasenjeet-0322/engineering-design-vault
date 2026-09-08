# Level 06 — React Fundamentals
## KPI 08 / KPI 12 — Forms & Controlled Inputs
### PART 15 — Forms & Controlled Inputs Crucible: The Ultimate Senior Gauntlet

[⬅️ Previous Part (14: Advanced Form Patterns)](14-advanced-form-patterns.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/15-forms-and-controlled-inputs-crucible.html) | [Next Part (16: Final Review & Mastery) ➡️](16-forms-and-controlled-inputs-final-review-and-mastery.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# 🧭 Part Objective

This Part is deliberately different from the preceding architectural guides. The objective is not merely to introduce another set of design patterns or component abstractions. The objective is to **validate complete mechanical mastery** of React forms under extreme temporal pressure:

```text
                                  THE CRUCIBLE CONSTRAINTS
                                  
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. HIGH-FREQUENCY EDITS:    Users continuously modify text during active async flight. │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 2. OUT-OF-ORDER RESPONSES:  Slow older network calls resolve after fast newer requests.│
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 3. RELATIONAL INVARIANTS:   Cross-field dependencies cascade across dynamic schemas.   │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 4. DYNAMIC DOM LIFECYCLES:  Fields mount, unmount, reorder, and shift dynamically.     │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 5. MULTI-TIMELINE DRIFT:    Draft state diverges from snapshot and server baseline.   │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 6. ACCESSIBILITY & SPEED:   Sub-16.6ms keystroke budgets with full ARIA compliance.    │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

A senior engineer must be able to **predict every single render evaluation, state closure snapshot, commit mutation, and temporal race condition** before running a single line of code.

---

# ⚡ LAYER 1 — 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Master Form Execution & Reconciliation Model

```text
USER INTENT (Keystroke / Blur / Submit)
        │
        ▼
[Synthetic Event Callback]
        │
        ▼
[Semantic Form Command] ──► (e.g. SET_FIELD, SUBMIT_INTENT, COMMIT_BASELINE)
        │
        ▼
[State Machine Transition]
        │
        ├──────────────────────┬──────────────────────┐
        ▼                      ▼                      ▼
 [Domain Values]     [Interaction Metadata]  [Lifecycle State]
 • Live Draft        • Touched map           • Idle / Validating
 • Baseline          • Dirty comparison      • Submitting
 • Snapshot          • Error visibility      • Success / Conflict / Error
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                    [Render & Diffing Phase]
                               │
                               ▼
                    [Commit & Browser Paint]
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
[Physical Input DOM]   [Pure Validation]     [Async Request Dispatch]
(Caret / Composition)  (Synchronous DAG)     (Frozen Snapshot Payload)
                                                     │
                                                     ▼
                                            [Authoritative Server]
                                                     │
                                                     ▼
                                            [Response Currentness]
                                                     │
                               ┌─────────────────────┴─────────────────────┐
                               ▼                                           ▼
                      [Current / Accepted]                         [Stale / Discarded]
                      • baseline := snapshot                       • Ignored completely
                      • draft preserved intact                     • Zero UI corruption
```

---

## 2. Seven State Categories You Must Never Conflate

| Category | Exact Semantic Meaning | Source of Truth | When Does It Change? |
| :--- | :--- | :--- | :--- |
| **1. Current Draft** | What the user currently intends to submit. | Mutable component state / store | On every user keystroke / selection. |
| **2. Committed Baseline**| Last authoritative state accepted by server. | Database / API HTTP 200 payload | On initial fetch or confirmed save. |
| **3. Submission Snapshot**| Immutable payload frozen at submit intent. | Frozen JavaScript object clone | At the instant of `<form onSubmit>`. |
| **4. Interaction Metadata**| Historical interaction record (`touched`, `dirty`). | Form interaction controller | On input blur, submit, or edit. |
| **5. Validation State** | Constraint evaluation (Client + Server 422).| Pure derivations + API maps | Recomputed on draft / dependency change. |
| **6. Lifecycle Status** | Current asynchronous operational state. | Formal State Machine Enum | On state transitions (`'submitting'`). |
| **7. Server Authority** | Persistent database record with revision ID. | Backend Database / Microservices | Governs persistent multi-tenant truth. |

---

## 3. The 8 Golden Rules of Form Architecture

1. **Rule 1:** The **Current Draft** is not necessarily the **Last Submitted Value**.
2. **Rule 2:** The **Last Submitted Value** is not necessarily the **Committed Baseline**.
3. **Rule 3:** An asynchronous response is **not automatically current** (completion order $\neq$ intent order).
4. **Rule 4:** A **Validation Error** is not the same thing as **Error Visibility** (`invalid \neq visible`).
5. **Rule 5:** A dynamic field's **Array Position** is not its **Domain Identity**.
6. **Rule 6:** React controls the semantic value projection, but the **Browser** performs the physical text-editing mechanics.
7. **Rule 7:** Disabling a submit button does not provide a **Backend Concurrency Guarantee**.
8. **Rule 8:** An abstraction is only valid if its **Ownership Semantics** remain explicit at the call site.

---

# 🔬 LAYER 2 — Deep Mechanical Breakdown: The 40 Crucible Challenges

## Challenges 01 – 10: Closures, Updates & Baseline Mechanics

### Challenge 01: Controlled Input Closure Snapshot
```tsx
function NameField() {
  const [name, setName] = useState("");
  function handleChange(e) {
    console.log("before:", name);
    setName(e.target.value);
    console.log("after:", name);
  }
  return <input value={name} onChange={handleChange} />;
}
// User types 'A'
```
- **Prediction:** `before: ""` | `after: ""`
- **Mechanical Principle:** Calling `setName("A")` queues a state update for the *next* render; it does not mutate the constant variable `name` inside the active render frame's closure.

---

### Challenge 02: Functional State Update Sequencing
```tsx
// Scenario A:
setCount(count + 1);
setCount(count + 1);

// Scenario B:
setCount(c => c + 1);
setCount(c => c + 1);
```
- **Prediction:** Scenario A increments by +1; Scenario B increments by +2.
- **Mechanical Principle:** Direct updates read the constant render snapshot; functional updaters are queued and evaluated sequentially against intermediate pending states.

---

### Challenge 03: Pure Derived Validation vs. State Duplication
```tsx
const [email, setEmail] = useState("");
const error = email.includes("@") ? null : "Invalid email";
```
- **Prediction:** Zero synchronization bugs, zero extra render passes.
- **Mechanical Principle:** Pure derived validation eliminates the need for `useEffect(() => setError(...), [email])`, preventing cascading render loops.

---

### Challenge 04: The Touched $\neq$ Invalid Invariant
```tsx
email = "" | touched = false | error = "Required"
```
- **Prediction:** The field is **Invalid**, but the error is **Hidden**.
- **Mechanical Principle:** Error existence is a domain fact; error visibility is an interaction policy (`show = touched || submitted`).

---

### Challenge 05: Dirty State Reversion
```tsx
baseline = "Alice" ──► User types "Alice Smith" (dirty: true) ──► User backspaces to "Alice"
```
- **Prediction:** `dirty = false`
- **Mechanical Principle:** `isDirty` is a pure mathematical comparison (`draft !== baseline`). It tracks current deviation from committed truth, not historical edit actions.

---

### Challenge 06: `defaultValue` vs. Continuous Controlled Ownership
```tsx
<input defaultValue={props.initialName} />
// Later, props.initialName changes from "Alice" to "Bob"
```
- **Prediction:** The DOM `<input>` remains `"Alice"`.
- **Mechanical Principle:** `defaultValue` initializes the DOM node once upon mounting; it does not establish a continuous React value-binding loop.

---

### Challenge 07: The Controlledness Lifecycle Violation
```tsx
// Render 1: value = undefined
// Render 2: value = "Alice"
```
- **Prediction:** React warning: *"A component is changing an uncontrolled input to be controlled."*
- **Mechanical Principle:** Initialize controlled inputs with empty strings `""` or canonical defaults, never `undefined`.

---

### Challenge 08: Immutable Submission Snapshot
```tsx
async function submit() {
  const payload = structuredClone(values); // Snapshot captured: "Alice"
  await save(payload);
}
// User types "Alice Smith" while request is in flight
```
- **Prediction:** The network payload carries `"Alice"`, while component state holds `"Alice Smith"`.
- **Mechanical Principle:** Freezing a submission snapshot isolates in-flight network requests from continuous live draft mutations.

---

### Challenge 09: Submit While Editing & Baseline Reconciliation
```tsx
// T1: draft = "A", baseline = "A"
// T2: Submit #1 snapshot = "A" (in-flight)
// T3: User types draft = "AB"
// T4: Request #1 succeeds (HTTP 200) -> setBaseline("A")
```
- **Prediction:** `baseline = "A"`, `draft = "AB"`, `isDirty = true`.
- **Mechanical Principle:** Success updates the baseline to the *committed snapshot*, preserving subsequent user edits and correctly maintaining dirty tracking.

---

### Challenge 10: Out-of-Order Asynchronous Request Races
```tsx
// Request 1 (Query "A", takes 2000ms)
// Request 2 (Query "AB", takes 400ms)
// Request 2 completes at 400ms. Request 1 completes at 2000ms.
```
- **Prediction:** Request 1 is discarded via monotonic sequence token check (`1 !== requestSequenceRef.current`).
- **Mechanical Principle:** Completion order does not equal intent order. Stale async responses must be rejected.

---

## Challenges 11 – 20: Async Operations, Dynamic Identity & Context

### Challenge 11: `AbortController.abort()` vs. Server Rollback
- **Mechanical Principle:** Client cancellation stops the browser from waiting for a response; it does **not** guarantee that the backend database aborted or rolled back the transaction. Server-side idempotency is required.

---

### Challenge 12: Latest-Wins vs. Queue Semantics
- **Mechanical Principle:** Search filters and autosave drafts use **Latest-Wins** (superseding old intents); financial transactions and chat messages use **Queued Execution** (every intent must complete).

---

### Challenge 13: Dynamic Entity Reordering
```tsx
// Initial: [ { id: "a", valid: true }, { id: "b", valid: false } ]
// Reorder: [ { id: "b", valid: false }, { id: "a", valid: true } ]
```
- **Mechanical Principle:** Keying errors by entity ID (`errors["b"]`) keeps validation bound to Entity B regardless of DOM array position.

---

### Challenge 14: Hidden Fields vs. State Lifetime
- **Mechanical Principle:** Conditionally hiding JSX does not delete JavaScript state. The domain architecture must explicitly determine whether hidden fields are preserved or pruned from the submission payload.

---

### Challenge 15: Component Unmount vs. State Preservation
- **Mechanical Principle:** In multi-step wizards, state owned by `<StepOne />` is destroyed upon unmount. Durable drafts must live in the parent `<WizardController />`.

---

### Challenge 16: Context Broadcaster Render Blast Radius
- **Mechanical Principle:** Updating a monolithic `FormContext` provider value forces all 100 consuming inputs to re-evaluate. Use split contexts or `useSyncExternalStore` subscriptions.

---

### Challenge 17: Inline Object Prop Breakage in `React.memo`
- **Mechanical Principle:** Passing `<Child config={{ required: true }} />` creates a new object reference on every render, defeating `React.memo` shallow prop comparisons.

---

### Challenge 18: `useCallback` Purpose and Trade-offs
- **Mechanical Principle:** `useCallback` stabilizes function references to prevent breaking memoized children; it provides zero benefit if the child is un-memoized or computationally trivial.

---

### Challenge 19: Server Error Staleness & Keystroke Invalidation
- **Mechanical Principle:** A 422 error for `email: "alice@taken.com"` is semantically invalid as soon as the user types `"b"`. Invalidate field-scoped server errors on keystroke.

---

### Challenge 20: Error Visibility Gating Transitions
- **Mechanical Principle:** Clicking "Submit" transitions `isSubmitted` from `false` to `true`, unlocking error visibility for all existing validation failures without re-running validation calculations.

---

## Challenges 21 – 30: Validation Invariants, Concurrency & Resets

### Challenge 21: Targeted vs. Indiscriminate Error Invalidation
- **Mechanical Principle:** Editing `firstName` must not clear an HTTP 422 error on `billingZip`. Invalidate errors strictly according to the dependency DAG.

---

### Challenge 22: Composite Cross-Field Invariants
- **Mechanical Principle:** In `startDate <= endDate`, neither date is invalid independently. The error belongs to the relational invariant container.

---

### Challenge 23: Coordinated Cascading Transitions
- **Mechanical Principle:** Changing `country` from US to Canada must atomically clear `state: "CA"`, reload Canadian provinces, and re-mask postal codes in a single state transition.

---

### Challenge 24: Async Availability Race Protection
- **Mechanical Principle:** Validating `username: "alice"` (slow) followed by `"alice123"` (fast) must discard the `"alice"` response to prevent displaying stale availability errors.

---

### Challenge 25: Rich Submission Lifecycle State Machine
- **Mechanical Principle:** Replace `isLoading = true/false` with formal states (`'idle' | 'validating' | 'submitting' | 'success' | 'conflict' | 'error'`) to prevent impossible states.

---

### Challenge 26: The Disabled Button Concurrency Fallacy
- **Mechanical Principle:** `<button disabled>` is a UX hint. Concurrency protection requires synchronous in-handler `useRef` guards and backend `Idempotency-Key` headers.

---

### Challenge 27: Resetting During Active Network Flight
- **Mechanical Principle:** If a user clicks "Reset" while a save request is in flight, the application must increment its request token to ignore the returning response when it arrives.

---

### Challenge 28: The Destructive HTTP 200 Overwrite Bug
- **Mechanical Principle:** Never execute `setDraft(serverResponse)` on HTTP 200 if the user continued typing during network flight; execute `setBaseline(snapshot)` instead.

---

### Challenge 29: Server Canonicalization vs. Raw Submissions
- **Mechanical Principle:** If the backend trims `"  Alice  "` to `"Alice"`, the committed baseline becomes `"Alice"`, while the live draft is updated only if the user has not made newer edits.

---

### Challenge 30: Raw Editing Strings vs. Canonical Domain Types
- **Mechanical Principle:** Allow raw inputs to hold partial strings (`"1."`, `"$500."`), executing numerical domain parsing only on blur or submission.

---

## Challenges 31 – 40: Caret, Accessibility & Abstraction Contracts

### Challenge 31: Cursor Caret Preservation During Formatting
- **Mechanical Principle:** Transforming `"1234"` to `"1,234"` shifts caret positions. Format display text on blur or manage `selectionStart` imperatively.

---

### Challenge 32: IME & Virtual Keyboard Composition
- **Mechanical Principle:** In Japanese/Chinese IME input, intermediate composition keystrokes must not trigger premature validation or text masking.

---

### Challenge 33: Semantic Accessibility Graph
- **Mechanical Principle:** Pair `aria-invalid="true"` on inputs with `aria-describedby="[error-id]"` pointing to a `<p role="alert">` with a deterministic DOM ID.

---

### Challenge 34: Intentional Focus Management on Submit Failure
- **Mechanical Principle:** Move focus programmatically to the Error Summary or first invalid input upon failed submit; never steal focus during active keystrokes.

---

### Challenge 35: Unambiguous Form Hook Commands
- **Mechanical Principle:** Command APIs like `setFieldValue(field, val)` must have explicit contracts declaring whether they trigger validation, dirty tracking, or error invalidation.

---

### Challenge 36: Single Source of Truth
- **Mechanical Principle:** Never store `localValue` in a child component if `FormContext` already owns `values`. Duplicated state creates desynchronization bugs.

---

### Challenge 37: Controlled vs. Uncontrolled Hybrid Contracts
- **Mechanical Principle:** A component supporting both `value` and `defaultValue` must determine its mode once on mount and prevent ambiguous runtime mode switching.

---

### Challenge 38: Field Registration Lifecycles
- **Mechanical Principle:** When a dynamic field unmounts, the registry must explicitly define whether its draft value is deleted, preserved, or excluded from submission.

---

### Challenge 39: Selective Pruning of Unmounted Fields
- **Mechanical Principle:** Conditionally unmounted fields should be omitted from API payloads while preserving draft values if the user returns to that section.

---

### Challenge 40: Form Provider Lifetime Scoping
- **Mechanical Principle:** `<FormProvider>` must wrap the entire multi-step workflow container, not individual step views, to ensure state survives step transitions.

---

# 🧪 LAYER 3 — Diagnostic Labs & DevTools Profiling

## Lab 01: Multi-Timeline State Divergence Inspector
**Objective:** Simultaneously display **Draft**, **Baseline**, **In-Flight Snapshot**, and **Dirty State** during a 3-second network delay:

```tsx
// Telemetry Monitor
console.table({
  draft: draft.name,
  baseline: baseline.name,
  inFlightSnapshot: snapshot?.name || "None",
  isDirty: draft.name !== baseline.name,
  status: status
});
```

---

## Lab 02: Network Throttling Out-of-Order Race Lab
**Objective:** Use Chrome DevTools Network throttling to delay Request 1 by 3000ms while Request 2 resolves in 300ms.
- **Verification:** Confirm that Request 1 is discarded via token sequence check (`currentRequestId !== sequenceRef.current`).

---

## Lab 03: Chrome Accessibility Tree Audit
**Objective:** Inspect invalid inputs in Chrome DevTools Accessibility Pane.
- Verify `Invalid: true` is exposed.
- Verify `Description` correctly maps to the referenced error message.

---

# 🔥 LAYER 4 — Production Incident Crucible

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT A: THE STALE RESPONSE PARAGRAPH OVERWRITE                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      User edits in a CMS were replaced by older text 3 seconds after saving.  │
│ Root Cause:   The completion handler called setDraft(response) instead of setBaseline. │
│ Fix:          Decoupled live draft from committed baseline reference.                  │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT B: THE DYNAMIC ROW VALIDATION SHIFT                                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Deleting line item #1 shifted errors onto line item #2.                  │
│ Root Cause:   Errors were stored by array index (errors[index]).                       │
│ Fix:          Migrated to immutable UUID entity registries (errors[item.id]).          │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT C: THE AUTOSAVE OUT-OF-ORDER REGRESSION                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Typing "AB" resulted in document saving "A".                             │
│ Root Cause:   Request 1 ("A") finished after Request 2 ("AB") without sequence tokens. │
│ Fix:          Implemented monotonic sequence token guards on all autosave endpoints.   │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT D: THE 300ms FORM CONTEXT TYPING FREEZE                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Typing in a 60-field form dropped frame rates to 10 FPS.                 │
│ Root Cause:   A monolithic Context provider broadcast new objects on every keystroke.  │
│ Fix:          Replaced with fine-grained useSyncExternalStore subscriptions.           │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT E: THE MULTI-STEP WIZARD DATA LOSS                                            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Navigating back from Step 2 to Step 1 wiped all personal information.    │
│ Root Cause:   State was owned by ephemeral Step 1 component that unmounted.            │
│ Fix:          Hoisted durable draft state to parent WizardController.                  │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT F: THE DUPLICATE PAYMENT BILLING DISASTER                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Customer was charged $1,200 twice on checkout.                           │
│ Root Cause:   Relying exclusively on <button disabled> without in-handler guards.      │
│ Fix:          Added synchronous useRef lock and unique UUID Idempotency-Key headers.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 Senior Engineering Decision Matrix

```text
                           KPI 08 ARCHITECTURE MATRIX
                                       │
                 What is the primary architectural requirement?
                                       │
     ┌──────────────────┬──────────────┴──────────────┬──────────────────┐
     ▼                  ▼                             ▼                  ▼
DRAFT DIVERGENCE    CONCURRENCY & RACES           LARGE FORMS        DYNAMIC COLLECTIONS
────────────────    ───────────────────           ───────────        ───────────────────
• Freeze snapshot   • Monotonic sequence token    • Isolated store   • Stable entity UUID
• baseline := snap  • Idempotency-Key header      • Prune DAG        • Registry pattern
• isDirty in render • 409 Conflict Diff Modal     • useDeferredValue • Key by item.id
```

---

## 🎓 KPI 08 Graduation Standard

You have achieved senior-level mastery of **KPI 08: Forms & Controlled Inputs** when you can answer the following 10 questions for any codebase without running it:
1. **Who owns each value?** (React state vs. DOM node vs. External store).
2. **What is the current render snapshot?** (Values captured in current closure).
3. **What is the current draft?** (Live in-memory user edits).
4. **What is the committed baseline?** (Last server-confirmed truth).
5. **What was actually submitted?** (Immutable submission snapshot).
6. **Which errors are authoritative?** (Server 422 rejections vs. client derivations).
7. **Which errors are currently visible?** (Evaluated against interaction policies).
8. **Which async operation is current?** (Monotonic sequence token validation).
9. **What happens if responses arrive out of order?** (Stale responses discarded).
10. **What happens if the user continues typing during flight?** (Draft preserved, dirty recomputed).

---

## 📋 40-Point KPI 08 Crucible Mastery Checklist

- [x] Master render closure snapshots and functional state updaters.
- [x] Derive validation purely in render without unnecessary `useEffect` chains.
- [x] Strictly decouple **Error Existence** from **Error Visibility**.
- [x] Derive `isDirty` from `draft !== baseline` without manual flag setting.
- [x] Maintain stable controlled input contracts; avoid uncontrolled/controlled mode switches.
- [x] Capture immutable **Submission Snapshots** at submit time.
- [x] Preserve live draft edits when an in-flight submission succeeds.
- [x] Protect async form operations from out-of-order race conditions using monotonic tokens.
- [x] Understand that client cancellation (`abort()`) is not server transaction rollback.
- [x] Apply **Latest-Wins** only to idempotent operations (e.g. search, autosave).
- [x] Key dynamic list rows and error trees by **stable entity UUIDs**, never array indices.
- [x] Preserve draft state for conditionally hidden form fields when required.
- [x] Hoist durable draft state to parent containers in multi-step wizards.
- [x] Eliminate Context broadcast performance bottlenecks using field subscriptions.
- [x] Stabilize callback and object identities across `React.memo` boundaries.
- [x] Invalidate field-scoped server errors upon user keystrokes in that specific field.
- [x] Retain unrelated server errors when editing independent fields.
- [x] Model relational invariants spanning multiple fields (`startDate <= endDate`).
- [x] Execute cascading state invalidations atomically when parent dependencies change.
- [x] Protect async username availability checks from stale response overwrites.
- [x] Model submission lifecycles with formal state machines (`'idle' | 'submitting' | ...`).
- [x] Implement defense-in-depth double-submission protection (Ref guard + Idempotency-Key).
- [x] Discard in-flight responses if the user resets the form during network flight.
- [x] Avoid destructive `setDraft(serverResponse)` overwrites on HTTP 200 saves.
- [x] Handle server canonicalization differences against local drafts.
- [x] Store raw editing strings in inputs, parsing canonical domain numbers on blur.
- [x] Preserve cursor selection positions during controlled text formatting.
- [x] Support IME and virtual keyboard composition without premature validation.
- [x] Implement semantic accessibility graphs (`aria-invalid`, `aria-describedby`, `role="alert"`).
- [x] Move focus intentionally to Error Summaries on failed submit without focus theft.
- [x] Define explicit contracts for custom form hook commands.
- [x] Maintain a single source of truth; avoid local/context state duplication.
- [x] Enforce unambiguous initialization contracts for hybrid components.
- [x] Manage dynamic field registration and unregistration lifecycles.
- [x] Selectively prune unmounted fields from final submission payloads.
- [x] Scope `<FormProvider>` lifetime above the entire multi-step workflow.
- [x] Profile form render graphs using React DevTools Profiler.
- [x] Measure interaction blocking time and layout reflows in Chrome Performance.
- [x] Handle HTTP 409 Concurrency Version Conflicts with 3-way merge resolution.
- [x] Maintain sub-16.6ms frame budgets (60 FPS) across large enterprise forms.

---

[⬅️ Previous Part (14: Advanced Form Patterns)](14-advanced-form-patterns.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/15-forms-and-controlled-inputs-crucible.html) | [Next Part (16: Final Review & Mastery) ➡️](16-forms-and-controlled-inputs-final-review-and-mastery.md)
