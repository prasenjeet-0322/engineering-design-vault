# Level 08 — Next.js & Full-Stack React

## KPI 05 — Forms & Full-Stack Mutation Architecture

# Part 10 — Full-Stack Form Architecture Capstone

---

# 1. Part Objective

This is the **integration and proof-of-mastery part** of KPI 05.

The objective is not to introduce another isolated form API.

The objective is to prove that you can independently design a production-grade form by combining:

* browser form semantics
* `FormData`
* Server Actions
* client/server validation
* form state
* server result reconciliation
* dynamic fields
* file handling
* multi-step workflows
* autosave
* mutation UX
* accessibility
* error recovery
* authorization
* concurrency
* cache consistency
* architectural tradeoffs

The central question is:

> **Can you design a full-stack mutation workflow without accidentally mixing client state, server state, validation, persistence, and UI responsibilities?**

That is the SDE-2 competency being tested.

---

# 2. Capstone Scenario

Design an enterprise-grade:

# Project Creation & Publishing Workflow

The application allows a user to create a project.

The workflow contains:

```text
Step 1
Project Information

Step 2
Team Configuration

Step 3
Project Settings

Step 4
Attachments

Step 5
Review & Publish
```

The user must be able to:

* enter project information
* add/remove team members
* configure settings
* upload attachments
* save a draft
* leave and return later
* resume the workflow
* receive validation errors
* recover from network failures
* publish the project
* receive accessible mutation feedback

The system must also handle:

* authorization
* autosave
* concurrent editing
* stale responses
* server validation
* cache invalidation
* final submission correctness

---

# 3. First Architectural Decision

Before writing components, define the domain.

The workflow contains several distinct concepts:

```text
Project Draft
Project
Team Members
Attachments
Workflow State
Publication State
```

Do not immediately represent everything as:

```ts
useState(...)
```

First determine ownership.

---

# 4. State Ownership Model

A useful architecture is:

```text
Browser
│
├── transient UI state
│
├── current form interaction state
│
└── unsaved draft changes
        │
        ▼
Server
│
├── authoritative draft
├── authorization
├── validation
├── persistence
└── revision
        │
        ▼
Domain
│
└── published Project
```

The key distinction is:

```text
draft ≠ published project
```

---

# 5. Form State Model

A conceptual model might contain:

```ts
type ProjectFormState = {
  values: ProjectDraftValues;

  validation: {
    fieldErrors: Record<string, string[]>;
    formError?: string;
  };

  interaction: {
    touched: Set<string>;
    dirty: boolean;
  };

  submission: {
    pending: boolean;
    status: "idle" | "success" | "error";
  };

  draft: {
    status: "clean" | "saving" | "saved" | "failed";
    revision: number | null;
  };

  workflow: {
    currentStep: number;
  };
};
```

The exact implementation may differ.

The important principle is that these are **different dimensions of state**.

---

# 6. Do Not Put Everything in One State Object

Avoid treating this:

```text
draft saving
```

as equivalent to:

```text
form submitting
```

They represent different operations.

For example:

```text
Autosave:
user is still editing
```

while:

```text
Publish:
user is committing the final business operation
```

Therefore:

```text
draftSaving
```

and:

```text
publishing
```

must be conceptually distinct.

---

# 7. Form Boundary

The entire workflow represents one logical project creation process.

However, the UI can be divided into steps:

```text
Project Form
│
├── Project Information
├── Team
├── Settings
├── Attachments
└── Review
```

This is:

> **one logical workflow with multiple UI boundaries.**

Do not interpret each step as an independent business transaction unless the domain actually requires that.

---

# 8. Step Architecture

Define the workflow explicitly.

```text
editing
   ↓
step 1
   ↓
step 2
   ↓
step 3
   ↓
step 4
   ↓
review
   ↓
publish
```

Navigation should be governed by rules.

For example:

```text
Step 1
   ↓
requires project information

Step 2
   ↓
requires valid team configuration

Step 3
   ↓
requires valid settings

Step 4
   ↓
attachments optional/valid

Review
   ↓
final validation
```

---

# 9. Client Validation

Client validation exists primarily for UX.

Examples:

```text
name is required
description length
invalid email format
missing required field
```

This allows immediate feedback.

But client validation does not authorize publication.

---

# 10. Server Validation

The server must validate again.

For example:

```text
project name uniqueness
user authorization
team membership permissions
organization limits
attachment restrictions
business rules
publication requirements
```

The architecture is therefore:

```text
Client validation
       ↓
UX feedback

Server validation
       ↓
authoritative correctness
```

---

# 11. Authorization Boundary

The client must never be trusted to determine:

```text
Can this user create the project?
Can this user add this team member?
Can this user publish?
```

The Server Action or server-side domain layer must determine authorization.

Conceptually:

```text
Server Action
   ↓
Authenticate
   ↓
Authorize
   ↓
Validate
   ↓
Mutate
```

Not:

```text
Client
   ↓
"isAdmin === true"
   ↓
publish
```

---

# 12. Server Action Architecture

The workflow may expose separate mutations:

```text
saveDraft
publishProject
```

Potentially:

```text
uploadAttachment
removeAttachment
```

The important architectural decision is that each mutation has a clearly defined business responsibility.

---

# 13. Save Draft Mutation

Conceptually:

```text
Form
 ↓
FormData
 ↓
saveDraft
 ↓
authenticate
 ↓
authorize
 ↓
validate draft
 ↓
persist draft
 ↓
increment revision
 ↓
return result
```

The draft mutation should not accidentally publish the project.

---

# 14. Publish Mutation

Publication has a stronger contract:

```text
Form
 ↓
publishProject
 ↓
authenticate
 ↓
authorize
 ↓
load authoritative draft
 ↓
validate entire workflow
 ↓
check revision/conflicts
 ↓
persist published project
 ↓
invalidate relevant cache
 ↓
return success
```

The final server mutation should not trust the client copy of the form as the sole source of truth.

---

# 15. Why Final Validation Must Reoccur

Imagine:

```text
10:00
User loads draft
```

Then:

```text
10:05
Team permissions change
```

Then:

```text
10:06
User clicks Publish
```

The validation that passed at 10:00 may no longer be valid.

Therefore:

> **Final business validation happens at the mutation boundary.**

---

# 16. FormData Boundary

At submission:

```text
DOM
 ↓
FormData
 ↓
Server Action
```

The server converts transport data into domain input.

Conceptually:

```text
FormData
   ↓
parse
   ↓
normalize
   ↓
validate
   ↓
domain command
```

Do not let raw `FormData` leak deep into the domain layer.

---

# 17. Domain Input

Create a conceptual boundary:

```ts
type CreateProjectInput = {
  name: string;
  description: string;
  teamMembers: TeamMemberInput[];
  settings: ProjectSettings;
  attachments: AttachmentReference[];
};
```

Then:

```text
FormData
   ↓
CreateProjectInput
   ↓
domain validation
   ↓
mutation
```

This separates transport representation from business representation.

---

# 18. Dynamic Team Members

Suppose the user can add:

```text
Alice
Bob
Charlie
```

Each member should have stable identity within the draft.

Conceptually:

```ts
{
  id: "member-row-123",
  userId: "...",
  role: "editor"
}
```

Do not make array index the only identity.

---

# 19. Dynamic Field Reconciliation

Suppose:

```text
A
B
C
```

becomes:

```text
A
C
```

The system should understand:

```text
C still exists
B was removed
```

rather than:

```text
index 1 changed
```

Stable identity improves:

* validation
* focus management
* autosave
* reconciliation
* optimistic updates

---

# 20. Attachment Architecture

Attachments have a different lifecycle from ordinary text fields.

Conceptually:

```text
Select file
   ↓
Upload
   ↓
Receive attachment ID
   ↓
Associate with draft
   ↓
Publish
```

Do not necessarily send a massive binary payload through the same logical mutation as the final project publication.

Separate:

```text
file transfer
```

from:

```text
domain mutation
```

when the product architecture benefits from it.

---

# 21. Attachment State

The UI may need:

```text
selected
uploading
uploaded
failed
removed
```

The server may need:

```text
attachmentId
storageLocation
owner
draftId
status
```

These are not the same state.

---

# 22. Autosave

The user edits:

```text
Project name
```

The client schedules:

```text
saveDraft
```

But autosave introduces concurrency.

Suppose:

```text
Revision 10
```

is edited into:

```text
Revision 11
```

and then:

```text
Revision 12
```

The server must not allow an older request to overwrite newer data.

---

# 23. Revision-Based Autosave

Conceptually:

```text
Client revision = 10
```

Server responds:

```text
revision = 11
```

Next mutation includes:

```text
expectedRevision = 11
```

Server accepts only if:

```text
currentRevision === expectedRevision
```

Otherwise:

```text
conflict
```

This is optimistic concurrency control.

---

# 24. Out-of-Order Response

Suppose:

```text
Request A → draft revision 11
Request B → draft revision 12
```

The network returns:

```text
B
A
```

The client must not allow A's older result to overwrite B's newer state.

Use a client-side mutation sequence or server revision.

Conceptually:

```text
response revision 12
   ↓
accept

response revision 11
   ↓
ignore as stale
```

---

# 25. Autosave Status

The UI should communicate meaningful state:

```text
Saving…
Saved
Save failed
Offline
Conflict detected
```

Avoid ambiguous states such as:

```text
Loading…
```

for every operation.

The user needs to understand the actual mutation lifecycle.

---

# 26. Draft Recovery

Suppose the browser closes.

The user returns later.

The application should be able to:

```text
load draft
 ↓
restore values
 ↓
restore workflow position where appropriate
 ↓
show draft status
 ↓
allow continuation
```

Recovery architecture should define:

* draft ownership
* expiration
* authorization
* revision
* incomplete data
* attachment references

---

# 27. Refresh Semantics

A refresh should not accidentally convert:

```text
unsaved local changes
```

into:

```text
server state
```

The architecture must explicitly decide:

```text
Does local draft survive refresh?
```

If yes:

```text
persist locally or server-side
```

If no:

```text
warn before navigation
```

or otherwise make loss explicit.

---

# 28. Multi-Tab Editing

Suppose the user opens:

```text
Tab A
Tab B
```

Both load:

```text
revision 15
```

Tab A saves:

```text
revision 16
```

Tab B then tries to save based on:

```text
revision 15
```

The server should detect:

```text
expected revision 15
actual revision 16
```

and reject or reconcile the stale mutation.

---

# 29. Conflict UX

A conflict should not simply produce:

```text
Error
```

The UI should communicate:

```text
Your draft changed elsewhere.
```

Then provide an appropriate recovery strategy:

```text
Reload latest
Review changes
Keep my changes
Resolve conflict
```

The correct strategy depends on domain complexity.

---

# 30. Final Review

Before publishing, show a server-consistent review.

The review should represent:

```text
current intended submission
```

not stale cached assumptions.

This is an opportunity to perform final consistency checks.

---

# 31. Publish Preconditions

The server may require:

```text
project name valid
description valid
team valid
permissions valid
attachments valid
draft revision current
organization limits satisfied
```

All of these should be checked at the authoritative mutation boundary.

---

# 32. Idempotency

Imagine the user clicks Publish twice.

Or the browser retries after a timeout.

Without idempotency, the system might create:

```text
Project A
Project B
```

from one intended operation.

A production publication mutation should consider idempotency.

Conceptually:

```text
idempotencyKey
```

maps repeated attempts to the same logical operation.

---

# 33. Ambiguous Network Failure

Suppose:

```text
Client → Publish
```

The server succeeds.

But the response never reaches the browser.

The browser says:

```text
Network error
```

The client does not know whether publication succeeded.

This is an:

> **ambiguous outcome.**

The correct response is not necessarily:

```text
retry blindly
```

Instead the application may:

```text
query authoritative state
```

or use an idempotent retry.

---

# 34. Cache Invalidation

After publication:

```text
Project detail
Project list
Dashboard
Search result
```

may become stale.

The architecture should define which cached representations need invalidation or revalidation.

Conceptually:

```text
publish
 ↓
domain mutation
 ↓
invalidate affected representations
```

Do not invalidate everything blindly.

---

# 35. Mutation Result

A structured result might conceptually be:

```ts
type PublishResult =
  | {
      success: true;
      projectId: string;
    }
  | {
      success: false;
      code:
        | "VALIDATION_ERROR"
        | "UNAUTHORIZED"
        | "CONFLICT"
        | "UNKNOWN_ERROR";
      fieldErrors?: Record<string, string[]>;
      formError?: string;
    };
```

The UI can then make deterministic decisions.

---

# 36. Error Taxonomy

Different errors imply different recovery.

| Error           | UI Response                |
| --------------- | -------------------------- |
| Validation      | Show field/form errors     |
| Unauthorized    | Explain permission failure |
| Session expired | Re-authenticate            |
| Conflict        | Resolve/reload             |
| Network failure | Retry/recover              |
| Server failure  | Preserve data              |
| Unknown outcome | Verify authoritative state |

Do not show:

```text
Something went wrong
```

for every failure.

---

# 37. Preserving User Input

Suppose publication fails because:

```text
Project name already exists
```

The user's entire form should not disappear.

Instead:

```text
current draft
+
server error
```

should coexist.

The user corrects:

```text
name
```

and retries.

---

# 38. Error Focus

After final submission fails:

```text
server validation
 ↓
identify first actionable error
 ↓
focus corresponding field
```

For a multi-step workflow, the architecture may need to:

```text
identify invalid step
 ↓
navigate to step
 ↓
focus invalid field
```

This is a cross-layer concern.

---

# 39. Accessibility Architecture

The capstone must support:

```text
semantic form
labels
descriptions
errors
aria-invalid
aria-describedby
keyboard navigation
focus management
pending state
success announcement
```

For dynamic fields:

```text
add member
remove member
```

must also remain keyboard-accessible.

---

# 40. Pending State Architecture

There are potentially several pending operations:

```text
saving draft
uploading attachment
publishing
```

Do not collapse all of them into:

```text
loading = true
```

Instead:

```text
draftSaveStatus
uploadStatus
publishStatus
```

This prevents unrelated UI from becoming disabled.

---

# 41. Example

While an attachment uploads:

```text
Upload 35%
```

the user may still be allowed to edit:

```text
Project description
```

But Publish might remain disabled until the attachment is ready.

This is a more precise state model than:

```text
loading === true
```

for the entire application.

---

# 42. Component Architecture

A reasonable decomposition might be:

```text
ProjectWorkflow
│
├── ProjectInformationStep
├── TeamConfigurationStep
├── ProjectSettingsStep
├── AttachmentsStep
├── ReviewStep
│
├── FormStatus
├── ValidationSummary
└── WorkflowNavigation
```

Server-side:

```text
saveDraft
publishProject
uploadAttachment
removeAttachment
```

Domain:

```text
ProjectDraftService
ProjectPublicationService
AuthorizationService
```

Persistence:

```text
DraftRepository
ProjectRepository
AttachmentRepository
```

The exact decomposition depends on application scale.

---

# 43. Important Boundary

React components should not become:

```text
database access layer
```

A component should not conceptually know:

```text
SQL
database schema
authorization rules
cache invalidation internals
```

The server/domain layer owns those concerns.

---

# 44. Full Request Flow

A draft save:

```text
User edits
   ↓
change detection
   ↓
debounce
   ↓
FormData
   ↓
Server Action
   ↓
authentication
   ↓
authorization
   ↓
parse
   ↓
validate
   ↓
revision check
   ↓
persist
   ↓
new revision
   ↓
return result
   ↓
reconcile client
```

---

# 45. Full Publish Flow

```text
User clicks Publish
        ↓
pending state
        ↓
FormData
        ↓
Server Action
        ↓
authentication
        ↓
authorization
        ↓
load authoritative draft
        ↓
revision check
        ↓
full validation
        ↓
domain mutation
        ↓
transaction
        ↓
cache invalidation
        ↓
success result
        ↓
navigation / confirmation
```

That is the complete mutation architecture.

---

# 46. Transaction Boundary

Publishing may involve:

```text
create project
create relationships
attach files
update draft status
```

These operations may need transactional consistency.

The frontend should not attempt to orchestrate database consistency through:

```text
request A
then request B
then request C
```

if the domain requires atomicity.

That responsibility belongs on the server.

---

# 47. Client-Side Optimism

For this capstone, use optimism selectively.

A safe optimistic interaction might be:

```text
Add team member locally
```

because the user expects the list to update immediately.

But:

```text
Project published
```

should generally not be presented as successful before authoritative confirmation.

---

# 48. Recovery Matrix

| Failure                    | Preserve                          | Recover           |
| -------------------------- | --------------------------------- | ----------------- |
| Client validation          | Input                             | Correct field     |
| Server validation          | Draft                             | Correct field     |
| Network save failure       | Draft                             | Retry             |
| Autosave conflict          | Local changes                     | Resolve           |
| Upload failure             | Metadata/selection where possible | Retry             |
| Publish validation failure | Draft                             | Correct           |
| Publish conflict           | Draft                             | Refresh/reconcile |
| Unknown publish outcome    | Draft                             | Verify server     |
| Session expiration         | Draft                             | Re-authenticate   |

A production form is judged heavily by its recovery behavior.

---

# 49. Architecture Decision Review

Now evaluate the architecture.

### Why use uncontrolled inputs?

Because most field values do not need React ownership on every keystroke.

### Why use controlled state?

For fields whose values directly affect UI behavior.

### Why Server Actions?

To establish framework-managed server mutation boundaries.

### Why server validation?

Because the server is authoritative.

### Why revision numbers?

To prevent stale writes.

### Why separate draft and publish mutations?

Because they represent different business transitions.

### Why structured errors?

Because UI recovery requires machine-readable semantics.

### Why stable dynamic field identity?

Because index-based identity breaks reconciliation.

### Why separate upload lifecycle?

Because binary transfer and domain publication have different operational semantics.

---

# 50. SDE-2 Architecture Defense

An interviewer may ask:

> "Why didn't you put the entire form in a global store?"

Answer conceptually:

Because the form represents local workflow state. Globalizing it would increase lifetime, coupling, and synchronization complexity without a requirement for cross-application ownership.

---

Another question:

> "Why not control every input?"

Because continuous React ownership is only necessary where UI behavior depends on current values. Uncontrolled inputs reduce unnecessary state synchronization for fields whose values are primarily submitted to the server.

---

Another:

> "Why validate twice?"

Because client validation improves responsiveness, while server validation provides authoritative correctness and security.

---

Another:

> "Why not just retry publication?"

Because a timeout does not prove the mutation failed. Blind retry can duplicate a non-idempotent mutation. The system should use idempotency or authoritative verification.

---

# 51. Senior-Level Failure Analysis

Consider:

```text
User clicks Publish
↓
spinner
↓
request times out
↓
user clicks again
↓
two projects created
```

Root cause:

```text
no idempotency
+
ambiguous outcome handling
```

Not:

```text
bad button component
```

This distinction is important.

Senior engineers diagnose failures at the architectural layer where they originate.

---

# 52. Another Failure

```text
User edits:
"New project"

Autosave A starts.

User edits:
"New project v2"

Autosave B starts.

B succeeds.

A succeeds afterward.

Server contains:
"New project"
```

Root cause:

```text
no concurrency control
```

Solution:

```text
revision checking
```

or an equivalent ordering mechanism.

---

# 53. Another Failure

```text
Server says:
email already exists

UI replaces entire form with:
server response
```

User loses:

```text
15 fields of work
```

Root cause:

```text
server result treated as complete form replacement
```

Correct architecture:

```text
current draft
+
server validation result
```

---

# 54. Another Failure

```text
isAdmin === true
```

is checked only in the client.

User manipulates the client.

Server accepts:

```text
publishProject
```

Root cause:

```text
authorization performed outside authoritative boundary
```

Correct:

```text
Server Action
 ↓
server authorization
```

---

# 55. Another Failure

A form library abstracts everything.

A developer asks:

> "Where does this error come from?"

The answer requires understanding:

```text
library resolver
+
schema
+
adapter
+
Server Action
+
custom hook
+
context provider
```

This is abstraction debt.

The system has crossed the point where the abstraction no longer reduces cognitive load.

---

# 56. Capstone Architecture

The complete architecture can now be represented as:

```text
                           ┌────────────────────┐
                           │     Browser UI      │
                           └─────────┬──────────┘
                                     │
                         Form / FormData
                                     │
                                     ▼
                           ┌────────────────────┐
                           │   Server Action    │
                           └─────────┬──────────┘
                                     │
                   ┌─────────────────┼──────────────────┐
                   │                 │                  │
                   ▼                 ▼                  ▼
             Authentication    Authorization       Validation
                   │                 │                  │
                   └─────────────────┼──────────────────┘
                                     │
                                     ▼
                           ┌────────────────────┐
                           │   Domain Service   │
                           └─────────┬──────────┘
                                     │
                                     ▼
                           ┌────────────────────┐
                           │    Persistence     │
                           └─────────┬──────────┘
                                     │
                              revision/result
                                     │
                                     ▼
                           ┌────────────────────┐
                           │   Client Reconcile │
                           └─────────┬──────────┘
                                     │
                                     ▼
                           UI / Recovery / UX
```

This is the core full-stack mutation architecture.

---

# 57. What You Should Be Able to Design Without Assistance

After completing this KPI, you should be able to receive a requirement such as:

> "Build an enterprise onboarding workflow with 12 fields, dynamic team members, file uploads, autosave, drafts, validation, and final submission."

and independently determine:

```text
form boundaries
state ownership
input strategy
validation strategy
Server Actions
server result contract
draft architecture
autosave architecture
revision strategy
conflict handling
upload lifecycle
accessibility
error recovery
cache invalidation
testing strategy
```

without blindly copying a tutorial.

That is the intended outcome.

---

# 58. SDE-2 Evaluation Rubric

## Level 1 — Implementation

Can build:

```text
input
form
submit
```

---

## Level 2 — React Form Engineering

Can manage:

```text
controlled state
validation
errors
pending
```

---

## Level 3 — Full-Stack Mutation

Can reason about:

```text
FormData
Server Actions
server validation
authorization
result reconciliation
```

---

## Level 4 — Production Form Architecture

Can reason about:

```text
drafts
autosave
concurrency
recovery
accessibility
performance
cache consistency
```

---

## Level 5 — SDE-2 Architecture

Can explain:

```text
why this architecture exists
what alternatives were rejected
what failure modes remain
how the system behaves under concurrency
how the architecture evolves as complexity increases
```

KPI 05 is targeting **Level 5**.

---

# 59. Final KPI 05 Competency Model

You should now understand the full lifecycle:

```text
                FORM
                  │
                  ▼
             User Input
                  │
                  ▼
          Client Interaction
                  │
                  ▼
             Validation
                  │
                  ▼
             FormData
                  │
                  ▼
          Server Action
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 Authorization          Validation
        │                   │
        └─────────┬─────────┘
                  ▼
           Domain Mutation
                  │
                  ▼
             Persistence
                  │
                  ▼
          Cache/Revalidation
                  │
                  ▼
           Server Result
                  │
                  ▼
        Client Reconciliation
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
      Success   Error    Recovery
```

For complex forms:

```text
              Workflow
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
     Draft     Autosave   Uploads
       │         │         │
       └─────────┼─────────┘
                 ▼
           Concurrency
                 │
                 ▼
              Review
                 │
                 ▼
             Publish
```

---

# 60. Final Senior Mental Model

A form is not primarily an input component.

It is a **mutation system with a user interface**.

The browser manages interaction.

React manages the UI state that genuinely needs React ownership.

The Server Action establishes the mutation boundary.

The server validates and authorizes.

The domain layer determines business correctness.

Persistence establishes durable state.

Concurrency mechanisms protect against stale writes.

Cache invalidation reconciles derived representations.

The UI communicates pending, success, failure, and recovery.

And accessibility ensures that the mutation system remains usable by all users.

The senior engineer's responsibility is to make these boundaries explicit.

---

# 61. KPI 05 Completion Checklist

You should now be able to independently explain and implement:

### Form Fundamentals

* native forms
* FormData
* controlled inputs
* uncontrolled inputs
* hybrid architecture
* field identity

### State Architecture

* values
* baseline
* dirty state
* touched state
* validation state
* submission state
* server result state
* draft state
* workflow state

### Validation

* client validation
* server validation
* cross-field validation
* cross-step validation
* domain validation

### Server Mutations

* Server Actions
* mutation boundaries
* structured results
* authorization
* idempotency
* cache invalidation

### Complex Forms

* dynamic fields
* multi-step forms
* workflow state
* draft persistence
* autosave
* file uploads

### Reliability

* retries
* ambiguous outcomes
* stale responses
* optimistic concurrency
* revision tracking
* conflict recovery
* multi-tab editing

### UX

* pending state
* success communication
* field errors
* form errors
* recovery
* reset semantics
* focus management

### Accessibility

* semantic forms
* labels
* descriptions
* error association
* keyboard interaction
* accessible pending state
* accessible dynamic fields

### Architecture

* abstraction tradeoffs
* form libraries
* state machines
* source-of-truth decisions
* mutation boundaries
* performance tradeoffs
* migration strategy

---

# 62. KPI 05 — LOCKED COMPLETION STATEMENT

**KPI 05 — Forms & Full-Stack Mutation Architecture is complete when you can design a form as an end-to-end mutation system rather than merely implementing input components.**

The expected competency is:

```text
Requirement
   ↓
State model
   ↓
Ownership model
   ↓
Form architecture
   ↓
Validation architecture
   ↓
Server mutation
   ↓
Persistence
   ↓
Concurrency
   ↓
Result reconciliation
   ↓
Recovery
   ↓
Accessibility
   ↓
Production tradeoffs
```

The final test is not:

> "Can you create a form?"

It is:

> **"Can you explain exactly what happens from the moment a user changes a field until the authoritative server state and UI become consistent again—and can you defend every architectural decision along that path?"**

If you can do that, you have crossed from **form implementation** into **full-stack mutation architecture**.

---

# Part Boundary

**KPI 05 is now complete.**

The next work should move to the **next locked KPI in Level 08**, rather than extending Forms & Full-Stack Mutation Architecture with additional overlapping material.
