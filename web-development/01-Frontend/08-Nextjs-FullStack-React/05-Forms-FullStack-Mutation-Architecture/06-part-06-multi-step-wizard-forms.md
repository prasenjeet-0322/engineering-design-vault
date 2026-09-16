# Level 08 — Next.js & Full-Stack React

# KPI 05 — Forms & Full-Stack Mutation Architecture

## Part 06 — Multi-Step & Wizard Form Architecture

---

# 1. Part Objective

A multi-step form divides one logical workflow into multiple user-facing stages.

For example:

```text
Step 1
Account Information

        ↓

Step 2
Profile

        ↓

Step 3
Preferences

        ↓

Step 4
Review

        ↓

Submit
```

The architectural challenge is not simply:

> "How do I show one screen at a time?"

The real problem is:

> **How do we preserve a coherent draft across multiple steps while validating each step appropriately, supporting backward navigation, handling cross-step dependencies, persisting progress when necessary, and finally submitting one authoritative mutation?**

---

# 2. Governing Question

The governing question is:

> **What is the lifecycle of the user's draft as it moves through multiple steps, and which validations, state transitions, persistence boundaries, and server mutations belong to each stage?**

The core model is:

```text
id="c8x2mk"
Multi-Step Workflow
       │
       ▼
One Logical Draft
       │
 ┌─────┼─────┐
 ↓     ↓     ↓
Step 1 Step 2 Step 3
       │
       ▼
   Review State
       │
       ▼
Final Mutation
```

The steps are primarily a **UI and workflow representation**.

They do not necessarily represent separate domain transactions.

---

# 3. Multi-Step Form vs Multi-Step Business Workflow

These concepts must be separated.

A multi-step form can mean:

```text
Step 1 → Step 2 → Step 3 → Submit
```

where nothing is persisted until the final submission.

A multi-step business workflow may instead mean:

```text
Step 1
  ↓
Persist
  ↓
Step 2
  ↓
Persist
  ↓
Step 3
  ↓
Persist
```

These are architecturally different.

---

# 4. Two Fundamental Models

## Model A — Single Final Submission

```text
Step 1
  ↓
local draft

Step 2
  ↓
local draft

Step 3
  ↓
local draft

Submit
  ↓
Server mutation
```

Advantages:

* simpler domain transaction
* easier atomicity
* fewer intermediate records
* straightforward rollback semantics

Disadvantages:

* draft can be lost
* long workflows require more client state
* large payload may accumulate

---

## Model B — Persisted Draft

```text
Step 1
  ↓
Save Draft

Step 2
  ↓
Save Draft

Step 3
  ↓
Save Draft

Finalize
```

Advantages:

* recoverable progress
* works across sessions
* better for long workflows
* server can own draft state

Disadvantages:

* much more state management
* draft lifecycle
* authorization
* cleanup
* concurrency
* versioning
* partial/incomplete records

---

# 5. The Most Important Architectural Decision

Before implementing a wizard, determine:

> **Is the workflow merely a UI segmentation, or does each step represent a durable business state?**

For example:

### UI segmentation

```text
Checkout
├── Address
├── Delivery
└── Payment
```

may still represent:

```text
one checkout transaction
```

---

### Durable workflow

```text
Loan Application
├── Applicant Information
├── Employment
├── Documents
├── Verification
└── Approval
```

may require persistent state after each stage.

Do not confuse these models.

---

# 6. Step State vs Form State

A multi-step form introduces another dimension:

```text
currentStep
```

But that should not replace the rest of the form state.

Conceptually:

```text
Form
├── draft values
├── baseline
├── dirty
├── validation
├── mutation
└── workflow
      ├── current step
      ├── completed steps
      └── navigation state
```

This follows the state-modeling principle from Part 03.

---

# 7. Avoid One Giant Wizard Enum

A simplistic model might be:

```ts
type State =
  | "STEP_1"
  | "STEP_2"
  | "STEP_3"
  | "SUBMITTING"
  | "SUCCESS"
  | "ERROR";
```

This can become problematic because several dimensions are being collapsed.

For example:

```text
current step
+
validation state
+
mutation state
+
persistence state
```

are not necessarily the same state dimension.

Prefer explicit state dimensions where the workflow requires them.

---

# 8. Step Definition

A conceptual step might contain:

```ts
type Step = {
  id: string;
  title: string;
  fields: string[];
};
```

For example:

```text
Step 1
fields:
  name
  email

Step 2
fields:
  company
  role

Step 3
fields:
  preferences
```

This creates an explicit relationship between:

```text
step
```

and:

```text
fields
```

---

# 9. Step Navigation

A wizard generally supports:

```text
Next
Back
```

Sometimes:

```text
Save and Exit
```

and:

```text
Review
```

Navigation itself is a state transition:

```text
Current Step
     ↓
Attempt Navigation
     ↓
Evaluate Rules
     ↓
Allow / Reject
     ↓
New Step
```

The key question is:

> **What must be true before the user can leave the current step?**

---

# 10. Step-Level Validation

Suppose Step 1 contains:

```text
name
email
```

Step 2 contains:

```text
company
role
```

When clicking:

```text
Next
```

you may validate only:

```text
name
email
```

rather than the entire eventual form.

This improves UX because users are not shown errors for fields they have not encountered yet.

---

# 11. Step Validation Does Not Replace Final Validation

This is critical.

Suppose Step 1 validates:

```text
email = valid
```

Later Step 3 changes:

```text
accountType
```

which changes the meaning of some earlier fields.

The final server mutation must still validate the complete payload.

Therefore:

```text
Step validation
    ↓
UX validation

Final server validation
    ↓
authoritative validation
```

---

# 12. Three Validation Layers

A mature wizard can have:

```text
Layer 1
Browser validation
```

then:

```text
Layer 2
Step-level client validation
```

then:

```text
Layer 3
Final server validation
```

Each has a different purpose.

```text
Browser
→ immediate feedback

Client step validation
→ workflow navigation

Server validation
→ authoritative correctness
```

---

# 13. Cross-Step Validation

Some rules cannot be evaluated until multiple steps are known.

Example:

```text
Step 1
employmentStatus = employed

Step 2
employmentType = contractor
```

A rule may require:

```text
employed + contractor
```

to have:

```text
contractLength
```

But `contractLength` may appear only in Step 3.

Therefore:

```text
Step 1 validation
    ≠
whole-form validation
```

Cross-step rules require the combined state.

---

# 14. Step Dependencies

Consider:

```text
Step 1
Country

Step 2
State

Step 3
Tax Information
```

If Country changes after Step 2 has been completed:

```text
Country
   ↓
State may become invalid
   ↓
Tax requirements may change
```

Previously completed steps may therefore become invalid.

This means:

> **Completed does not necessarily mean permanently valid.**

---

# 15. Completion vs Validity

A step might have:

```text
completed = true
```

because the user successfully passed it.

But later:

```text
another step changes relevant data
```

and therefore:

```text
valid = false
```

These are different concepts.

For example:

```text
Step 1
✓ completed

Step 2
✓ completed

Step 3 changes a dependency

Step 1
✓ completed
✗ currently valid
```

A mature workflow must decide how such invalidation is represented.

---

# 16. Step Status Model

A useful conceptual model:

```text
not_started
in_progress
completed
invalid
locked
```

Not every application needs every state.

But the distinction between:

```text
visited
```

and:

```text
valid
```

is important.

---

# 17. Should Users Be Allowed to Skip Steps?

There are several possible policies.

### Strict sequential

```text
1 → 2 → 3 → 4
```

Users cannot jump forward.

### Free navigation

```text
1 ↔ 2 ↔ 3 ↔ 4
```

Users can move between completed or accessible steps.

### Conditional navigation

```text
1
 ↓
2
 ↓
3
```

but certain steps are skipped depending on previous answers.

The workflow should explicitly define navigation policy.

---

# 18. Conditional Steps

Example:

```text
Are you a business?

Yes → Business Details
No  → Skip Business Details
```

The workflow itself is dynamic.

Conceptually:

```text
Step 1
  │
  ├── Yes → Step 2
  │
  └── No  → Step 3
```

Now the wizard is not just:

```text
1 → 2 → 3
```

It is a state machine.

---

# 19. Wizard as a State Machine

A useful mental model is:

```text
                  ┌──────────────┐
                  │    STEP 1    │
                  └──────┬───────┘
                         │
                    condition
                    ┌────┴────┐
                    ↓         ↓
              ┌─────────┐ ┌─────────┐
              │ STEP 2  │ │ STEP 3  │
              └────┬────┘ └────┬────┘
                   │            │
                   └─────┬──────┘
                         ↓
                  ┌──────────────┐
                  │    REVIEW    │
                  └──────┬───────┘
                         ↓
                    SUBMISSION
```

This becomes especially useful when:

* steps branch
* steps are skipped
* navigation depends on conditions
* users can return to earlier steps

---

# 20. Avoid Treating the Wizard as Only UI

If the workflow has meaningful transitions:

```text
Draft
 ↓
Submitted
 ↓
Verified
 ↓
Approved
```

then the server should own those transitions.

The browser can display:

```text
Step 3
```

but should not be the authority deciding:

```text
Approved
```

---

# 21. Route-Based Wizards

A wizard can use:

```text
/signup/account
/signup/profile
/signup/preferences
/signup/review
```

instead of:

```text
one URL
+
local currentStep
```

Advantages:

* browser navigation works naturally
* deep links can be represented
* refresh behavior is clearer
* analytics can identify steps
* each step can have independent rendering

But route-based steps introduce:

* URL synchronization
* server loading
* access control
* persistence concerns

---

# 22. Single-Route Wizards

Alternatively:

```text
/signup
```

with:

```text
currentStep = 2
```

Advantages:

* simpler URL model
* easy local state management
* one component tree

Disadvantages:

* refresh can lose state
* browser history needs explicit handling
* deep linking is less natural

The correct choice depends on workflow requirements.

---

# 23. Browser Back Button

A mature wizard must decide what browser Back means.

Possible behavior:

```text
Browser Back
    ↓
previous wizard step
```

or:

```text
Browser Back
    ↓
previous application route
```

Route-based workflows naturally integrate with browser history.

Single-route wizards may need explicit history management.

Do not accidentally create:

```text
Back
→ exit wizard
```

when users expect:

```text
Back
→ previous step
```

---

# 24. Refresh Semantics

Suppose the user reaches:

```text
Step 3
```

and refreshes.

What should happen?

### Local-only draft

Potentially:

```text
draft lost
```

unless state is restored.

### Session/local persistence

Potentially:

```text
draft restored
```

### Server-persisted draft

```text
server draft
   ↓
load
   ↓
restore
```

The workflow should explicitly define refresh behavior.

---

# 25. Save and Exit

Long forms often need:

```text
Save and Exit
```

This means:

```text
draft
   ↓
persist
   ↓
leave workflow
```

The key distinction:

```text
Save Draft
    ≠
Finalize
```

A draft should not necessarily trigger the same business mutation as final submission.

---

# 26. Draft State

A persisted draft might contain:

```json
{
  "id": "draft_123",
  "ownerId": "user_42",
  "currentStep": "employment",
  "data": {},
  "status": "draft"
}
```

This allows the user to resume later.

But now the server must manage:

* ownership
* expiration
* concurrency
* versioning
* authorization
* cleanup

---

# 27. Draft Ownership

A user must not be able to load:

```text
draft_123
```

simply because they know its identifier.

The server must verify:

```text
authenticated user
       ↓
owns draft
```

or:

```text
authenticated user
       ↓
has permission
```

This is the same authorization boundary discussed in Server Actions.

---

# 28. Drafts Are Not Automatically Safe

A draft can contain:

* personal information
* sensitive business data
* uploaded files
* incomplete information

Therefore draft persistence requires appropriate:

* authorization
* encryption/security controls
* retention
* deletion semantics
* audit requirements

depending on the application.

---

# 29. Autosave

Some workflows automatically save:

```text
user changes
   ↓
debounce
   ↓
save draft
```

This can improve recovery.

But autosave introduces distributed-systems concerns.

For example:

```text
Edit A
  ↓
request 1

Edit B
  ↓
request 2
```

If request 2 completes first:

```text
B saved
```

then request 1 completes later:

```text
A saved
```

The server may accidentally revert newer data.

---

# 30. Autosave Requires Concurrency Thinking

Potential solutions include:

```text
version numbers
ETags
optimistic concurrency
timestamps
request sequencing
abort/cancellation
server-side conflict detection
```

The correct approach depends on the persistence model.

The key insight:

> **Autosave is not merely a UI convenience; it is concurrent distributed state synchronization.**

---

# 31. Versioned Drafts

A draft can contain:

```text
version = 7
```

The client submits:

```text
expectedVersion = 7
```

The server updates only if:

```text
currentVersion == 7
```

If another operation has already created:

```text
version = 8
```

the server can reject or resolve the conflict.

This prevents silent overwrites.

---

# 32. Multi-Tab Editing

Consider:

```text
Tab A → Step 2
Tab B → Step 3
```

Both modify the same draft.

Now there are two clients writing to one logical state.

Without concurrency controls:

```text
last request wins
```

may silently destroy changes.

For important workflows, the application should decide whether:

```text
multi-tab editing
```

is:

* supported
* detected
* serialized
* conflict-resolved
* simply last-write-wins

---

# 33. Back Navigation and Data Preservation

Suppose:

```text
Step 1
name = Alice

Step 2
company = Acme
```

User returns to Step 1.

The data should generally remain:

```text
name = Alice
company = Acme
```

unless the product explicitly defines otherwise.

This means:

```text
navigation
    ≠
reset
```

A step transition should not accidentally destroy the global draft.

---

# 34. Step-Local vs Global State

A useful distinction:

### Step-local state

```text
tooltip open
temporary UI selection
expanded section
```

### Workflow-global state

```text
name
email
company
preferences
```

Do not automatically put all UI state into one global form object.

Likewise, do not keep critical draft data only inside a step component if it must survive navigation.

---

# 35. Review Step

A review step provides:

```text
Step 1
✓

Step 2
✓

Step 3
✓

Review
```

The review UI should represent the current draft.

It should not become a second independent copy of the form data.

Prefer:

```text
single authoritative draft
      ↓
review projection
```

rather than:

```text
form state
+
review state
```

which can drift apart.

---

# 36. Review Is Not Authorization

A review page might display:

```text
Total: ₹10,000
```

The client submits:

```text
total = 10000
```

But the server should calculate authoritative values where necessary.

For example:

```text
client:
quantity × displayedPrice

server:
current price
+
discount rules
+
tax rules
+
authorization
```

The review step is a UX representation, not the authority.

---

# 37. Final Submission

The final submission should be treated as a new authoritative mutation:

```text
Draft
 ↓
Final validation
 ↓
Authorization
 ↓
Business rules
 ↓
Transaction
 ↓
Persist
 ↓
Success
```

Do not assume:

```text
all previous steps were valid
```

means:

```text
final submission is valid
```

---

# 38. Final Validation Must Be Complete

The server should validate:

```text
entire final payload
```

including:

* fields from every step
* cross-step relationships
* authorization
* business constraints
* current server data
* resource state

The client cannot be trusted to preserve the workflow correctly.

---

# 39. Final Mutation and Idempotency

The final button may be clicked twice.

Or:

```text
request sent
 ↓
network timeout
```

The user clicks again.

The server may receive two requests.

For important operations, consider:

```text
idempotency key
```

so:

```text
same logical submission
```

does not accidentally produce:

```text
duplicate transaction
```

---

# 40. Step Submission vs Final Submission

There are two distinct concepts:

```text
Next
```

may mean:

```text
validate current step
move forward
```

while:

```text
Finish
```

means:

```text
perform authoritative domain mutation
```

Do not accidentally persist business state on every Next action unless the architecture intentionally uses durable intermediate mutations.

---

# 41. Server Actions in Wizards

Server Actions can participate in workflows such as:

```text
Step
 ↓
Server Action
 ↓
validate/persist draft
 ↓
revalidate
```

or:

```text
Final Step
 ↓
Server Action
 ↓
final mutation
```

The important question is:

> **Is this action saving draft state or performing a business operation?**

Those should often have different semantics.

---

# 42. Draft Save vs Finalize

Conceptually:

```text
saveDraft()
```

means:

```text
incomplete state is acceptable
```

while:

```text
finalize()
```

means:

```text
all required rules must pass
```

Therefore:

```text
Draft validation
    ≠
Final validation
```

Draft validation can still enforce:

* shape
* safe data types
* permissions
* basic constraints

but may permit incomplete workflow state.

---

# 43. Error Handling

A wizard needs several error categories:

```text
Step validation error
Cross-step validation error
Server validation error
Authorization error
Persistence error
Network error
Conflict error
```

These should not all become:

```text
"Something went wrong"
```

The UI should provide the appropriate recovery path.

---

# 44. Error Recovery

Example:

```text
Final submission
 ↓
validation failure
```

The server may return:

```text
field-level errors
```

The user should be taken to:

```text
the relevant step
```

rather than merely seeing an error at the final button.

For example:

```text
Step 2
Tax ID invalid
```

should result in navigation/focus behavior that helps the user correct Step 2.

---

# 45. Cross-Step Error Routing

Suppose:

```text
Step 1:
accountType = business

Step 4:
taxId = missing
```

Final validation returns:

```text
taxId required
```

The application needs to know:

```text
taxId → Step 4
```

Therefore field-to-step mapping should be explicit.

Conceptually:

```text
field
 ↓
step
 ↓
error location
```

---

# 46. Accessibility

A wizard should communicate:

```text
current step
total steps
progress
errors
available navigation
```

For example:

```text
Step 2 of 5
Profile Information
```

Users should be able to determine where they are in the workflow.

---

# 47. Focus Management

After navigation:

```text
Step 1
  ↓
Step 2
```

focus should move predictably to the new step's meaningful heading or first relevant control, depending on the interaction model.

After validation failure:

```text
Next
 ↓
error
```

focus should help the user reach the first actionable error.

This is particularly important in multi-step flows because errors may exist outside the currently visible UI.

---

# 48. Progress Indicators

A progress indicator can show:

```text
1 Account
2 Profile
3 Preferences
4 Review
```

But avoid implying false certainty.

If the workflow branches:

```text
Business
```

may contain:

```text
5 steps
```

while:

```text
Individual
```

contains:

```text
4 steps
```

The progress representation should match the actual workflow semantics.

---

# 49. Conditional Progress

A dynamic workflow might be:

```text
1 Account
2 Profile
3 Business Details  ← only if business
4 Review
```

The application should not necessarily display:

```text
4 of 4
```

when the user is actually in:

```text
3 of 4
```

after a branch.

The progress model should be derived from the workflow state rather than hardcoded assumptions.

---

# 50. Route-Based Step Architecture

A possible Next.js structure:

```text
/app
  /application
    /account
      page.tsx
    /profile
      page.tsx
    /business
      page.tsx
    /review
      page.tsx
```

The route layer can own:

```text
step rendering
```

while a shared form/draft layer owns:

```text
draft data
```

This creates a useful separation:

```text
route
    ↓
workflow step

draft
    ↓
workflow state
```

---

# 51. Server-Owned Draft Architecture

For long-lived workflows:

```text
Browser
   ↓
load draft
   ↓
render step
   ↓
edit
   ↓
save draft
   ↓
server
   ↓
persist
```

Then:

```text
refresh
```

becomes:

```text
load draft
```

rather than:

```text
recover local component state
```

This is more robust for workflows that must survive sessions.

---

# 52. Draft Lifecycle

A production system should define:

```text
draft
 ↓
active
 ↓
submitted
```

and potentially:

```text
draft
 ↓
expired
```

or:

```text
draft
 ↓
cancelled
```

Cleanup policies may be required.

---

# 53. Draft Expiration

Imagine thousands of users start applications but never finish.

Without expiration:

```text
database
→ millions of abandoned drafts
```

Therefore long-lived workflows may require:

```text
createdAt
updatedAt
expiresAt
```

and cleanup policies.

---

# 54. Security of Draft Data

Do not expose:

```text
all draft data
```

to every client route merely because the user owns the workflow.

Return only the data required for the current step where practical.

This follows the principle:

> **Data access should be intentionally scoped to the operation and authorization context.**

---

# 55. Performance

Large wizards can accumulate significant state.

Potential issues include:

```text
large component tree
+
large draft object
+
expensive validation
+
many uploaded files
```

Strategies may include:

* route-based steps
* lazy loading
* step-local rendering
* schema validation scoped to relevant fields
* server-persisted drafts
* avoiding unnecessary global rerenders

Again:

> **Measure before optimizing.**

---

# 56. Mobile Considerations

Multi-step workflows can be particularly useful on mobile because displaying:

```text
50 fields
```

at once is difficult.

But excessive fragmentation can also increase:

```text
navigation cost
```

A good step should represent a meaningful conceptual unit rather than arbitrary field counts.

Bad:

```text
Step 1 → first 3 fields
Step 2 → next 3 fields
Step 3 → next 3 fields
```

Better:

```text
Step 1 → Personal Information
Step 2 → Employment
Step 3 → Preferences
```

---

# 57. When to Split a Form

A form is a good candidate for multiple steps when:

* it contains many conceptually distinct sections
* later fields depend on earlier answers
* users need focused tasks
* the workflow is naturally sequential
* progress/recovery matters
* validation is easier to reason about by section

---

# 58. When Not to Split a Form

Avoid a wizard when:

```text
the form is short
```

or:

```text
users need to compare many fields simultaneously
```

or:

```text
navigation between fields is frequent
```

A wizard can increase interaction cost.

Sometimes one well-structured page is better.

---

# 59. The Four-Pillar Engineering Decision Model

## Pillar 1 — When to Use

Use multi-step forms when:

* workflow complexity is high
* sections are conceptually distinct
* progressive disclosure improves usability
* cross-step dependencies exist
* users benefit from focused tasks

---

## Pillar 2 — When Not to Use

Do not introduce a wizard simply because:

```text
the page looks long
```

If users need to compare and edit many fields together, one page may be superior.

---

## Pillar 3 — Bottlenecks and Tradeoffs

Single-page form:

```text
simple state
+
high information density
```

Wizard:

```text
lower cognitive load
+
more navigation/state complexity
```

Persisted wizard:

```text
reliable recovery
+
distributed state complexity
```

Choose based on workflow requirements.

---

## Pillar 4 — Modern Alternatives

Depending on the workflow:

```text
Single-page form
Multi-step wizard
Route-based wizard
Persisted draft
Autosave workflow
Task-based workflow
Separate domain transactions
```

Do not force every long form into a wizard.

---

# 60. SDE-2 Interview Questions

### Q1. Is a wizard necessarily a state machine?

A simple linear wizard can be modeled without a sophisticated state machine.

But once it includes:

* branching
* conditional steps
* navigation rules
* invalidation
* workflow transitions

state-machine thinking becomes highly valuable.

---

### Q2. Should every step be persisted?

No.

If the wizard is merely a UI segmentation, local draft state followed by one final mutation may be simpler.

Persistence becomes valuable when recovery, long duration, cross-session continuation, or business workflow requirements justify it.

---

### Q3. Does passing Step 1 validation mean final submission is valid?

No.

Final server validation must validate the complete authoritative state.

---

### Q4. What happens if Step 3 changes a value that invalidates Step 1?

The workflow must detect the dependency and invalidate/recompute affected state.

"Completed" and "currently valid" are separate concepts.

---

### Q5. Why can autosave create race conditions?

Because multiple save requests can complete out of order.

A stale request may overwrite a newer state unless the system uses sequencing or optimistic-concurrency mechanisms.

---

### Q6. Should the client decide whether a user is allowed to access Step 4?

The client can control UX navigation, but authorization-sensitive workflow transitions must be enforced server-side.

---

# 61. Prediction Challenge #1

A user completes:

```text
Step 1:
Country = India
```

and:

```text
Step 2:
State = Telangana
```

Then returns to Step 1 and changes:

```text
Country = USA
```

What should happen to Step 2?

<details>
<summary>Solution</summary>

Step 2 may no longer be valid.

The system should invalidate or reset the dependent State value according to the domain rules and require a valid value for USA.

Previously completed does not guarantee currently valid.

</details>

---

# 62. Prediction Challenge #2

The user finishes Step 4.

The browser crashes.

What happens?

<details>
<summary>Solution</summary>

It depends on the persistence model.

With only in-memory client state, the draft may be lost.

With local persistence, it may be recoverable.

With a server-persisted draft, the workflow can reload the authoritative draft and resume.

</details>

---

# 63. Prediction Challenge #3

Autosave sends:

```text
Request A → version 5
Request B → version 6
```

Request B completes first.

Then Request A completes.

What can happen without concurrency control?

<details>
<summary>Solution</summary>

Request A may overwrite the newer state from Request B.

Version checking or another concurrency strategy can reject stale writes.

</details>

---

# 64. Prediction Challenge #4

The user reaches the final step.

The final mutation times out.

They click Submit again.

What distributed-systems problem exists?

<details>
<summary>Solution</summary>

The first request may have succeeded even though the client did not receive its response.

The retry could therefore create a duplicate operation.

Idempotency is important for mutations where duplicate execution would be harmful.

</details>

---

# 65. Prediction Challenge #5

A user completes all steps, but the server rejects final submission because the selected resource is no longer available.

Was the wizard implementation necessarily incorrect?

<details>
<summary>Solution</summary>

No.

Some business conditions depend on current server state and can change while the user is completing the workflow.

Final server validation must re-check authoritative conditions.

</details>

---

# 66. Production Architecture

A mature wizard can look like:

```text
                    WORKFLOW
                       │
                       ▼
                  DRAFT MODEL
                       │
             ┌─────────┼─────────┐
             ↓         ↓         ↓
          Step 1     Step 2    Step N
             │         │         │
             └─────────┼─────────┘
                       ↓
                Cross-Step State
                       │
                       ↓
                     REVIEW
                       │
                       ▼
               FINAL VALIDATION
                       │
                       ▼
                  AUTHORIZATION
                       │
                       ▼
                BUSINESS RULES
                       │
                       ▼
                  FINAL MUTATION
                       │
                       ▼
                 AUTHORITATIVE
                    STATE
```

For persisted workflows:

```text
Browser
   ↕
Draft API / Server Action
   ↕
Draft Store
   ↓
Final Mutation
```

---

# 67. Senior-Level Mental Model

Think of a multi-step form as:

```text
ONE LOGICAL DRAFT
       │
       ├── Step 1 projection
       ├── Step 2 projection
       ├── Step 3 projection
       └── Review projection
```

Not:

```text
Step 1 form
Step 2 form
Step 3 form
```

as completely unrelated state containers.

The steps are views into one logical workflow.

---

# 68. The Critical Distinctions

Remember:

```text
step completion
    ≠
final validity
```

```text
navigation
    ≠
persistence
```

```text
draft save
    ≠
final mutation
```

```text
client validation
    ≠
server validation
```

```text
review display
    ≠
server authority
```

```text
browser navigation
    ≠
workflow authorization
```

```text
autosave
    ≠
simple local state update
```

Autosave is a synchronization problem.

---

# 69. Completion Checklist

You should be able to explain:

* [ ] What a multi-step form actually represents.
* [ ] UI segmentation vs durable business workflow.
* [ ] Single final submission architecture.
* [ ] Persisted draft architecture.
* [ ] Step-level state.
* [ ] Workflow-global state.
* [ ] Step-level validation.
* [ ] Final server validation.
* [ ] Cross-step validation.
* [ ] Conditional steps.
* [ ] Workflow state-machine thinking.
* [ ] Step completion vs validity.
* [ ] Route-based wizards.
* [ ] Single-route wizards.
* [ ] Browser Back behavior.
* [ ] Refresh recovery.
* [ ] Save-and-exit semantics.
* [ ] Draft persistence.
* [ ] Draft ownership and authorization.
* [ ] Autosave race conditions.
* [ ] Optimistic concurrency.
* [ ] Multi-tab editing concerns.
* [ ] Review-step architecture.
* [ ] Final mutation idempotency.
* [ ] Error routing across steps.
* [ ] Focus management.
* [ ] Accessibility.
* [ ] Performance.
* [ ] When not to use a wizard.

---

# 70. Final Mental Model

A senior engineer sees a wizard as:

```text
             USER WORKFLOW
                    │
                    ▼
              ONE DRAFT STATE
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
      STEP 1      STEP 2      STEP 3
        │           │           │
        └───────────┼───────────┘
                    ↓
             CROSS-STEP RULES
                    │
                    ▼
                 REVIEW
                    │
                    ▼
             SERVER VALIDATION
                    │
                    ▼
              AUTHORIZATION
                    │
                    ▼
             BUSINESS MUTATION
                    │
                    ▼
            AUTHORITATIVE STATE
```

The key architectural insight is:

> **A multi-step form is not multiple independent forms. It is usually one logical draft represented through multiple workflow projections.**

Once the workflow becomes persistent, conditional, resumable, or collaborative, the problem moves beyond ordinary form state into:

```text
workflow architecture
+
distributed state
+
concurrency
+
authorization
+
domain transitions
```

That is where SDE-2-level reasoning becomes important.

---

# 71. Part Boundary

This Part covered:

* multi-step form architecture
* wizard state
* UI segmentation vs business workflow
* single final submission
* persisted drafts
* step-level validation
* final validation
* cross-step validation
* conditional steps
* workflow state-machine thinking
* route-based wizards
* browser history
* refresh/recovery
* save-and-exit
* draft persistence
* autosave
* concurrency
* multi-tab editing
* review architecture
* final submission
* idempotency
* error routing
* accessibility
* performance
* production tradeoffs

It intentionally does **not** deeply cover:

* autosave/draft architecture as a dedicated subsystem
* advanced draft synchronization
* form-library internals
* general mutation architecture already covered in earlier KPI parts

Those concerns remain separated so the curriculum does not collapse distinct architectural problems into one part.

**Part 06 is complete.**
