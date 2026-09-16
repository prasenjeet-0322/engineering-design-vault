# Level 08 — Next.js & Full-Stack React

# KPI 05 — Forms & Full-Stack Mutation Architecture

## Part 07 — Autosave, Draft Persistence & Recovery Architecture

---

# 1. Part Objective

Long-running forms create a problem that ordinary form state does not solve:

> **What happens to the user's work before they finally submit it?**

A user may:

* close the browser
* refresh the page
* lose connectivity
* navigate away
* return hours later
* open the form in another tab
* partially complete the workflow
* make several changes while autosave requests are in flight

A production form therefore may need a **draft lifecycle** independent of final submission.

The objective of this part is to understand:

* draft state
* persistence boundaries
* autosave
* debouncing
* save status
* recovery
* stale writes
* concurrency
* versioning
* conflicts
* draft ownership
* expiration
* finalization

The governing question is:

> **How do we reliably preserve an incomplete form without allowing stale or unauthorized writes to corrupt the user's authoritative draft?**

---

# 2. The Core Mental Model

An ordinary form can be modeled as:

```text
User Input
    ↓
Client State
    ↓
Submit
    ↓
Server Mutation
```

A persistent form becomes:

```text
User Input
    ↓
Client Draft
    ↓
Persist Draft
    ↓
Server Draft
    ↓
Resume
    ↓
Final Submit
    ↓
Authoritative Domain State
```

This introduces a second lifecycle:

```text
Draft Lifecycle
```

separate from:

```text
Final Mutation Lifecycle
```

---

# 3. Draft vs Final State

This distinction is fundamental.

A draft may contain:

```text
name = "Alice"
email = "alice@example.com"
company = ""
```

The final domain object may require:

```text
name
email
company
```

Therefore:

```text
draft
    ≠
valid final entity
```

A draft can intentionally represent incomplete state.

---

# 4. Draft Persistence Is a Product Decision

Not every form needs persistence.

Persistence is valuable when:

* the form is long
* completion takes significant time
* users may leave and return
* data entry is expensive
* the workflow is business-critical
* users upload files
* recovery from failure is important

For a simple:

```text
email + password
```

form, draft persistence may be unnecessary complexity.

---

# 5. Persistence Options

There are several levels.

## Option 1 — Memory Only

```text
React state
```

Data disappears when the page is destroyed.

---

## Option 2 — Browser Persistence

Examples include:

```text
localStorage
sessionStorage
IndexedDB
```

The draft can survive some navigation or reload scenarios.

---

## Option 3 — Server Persistence

```text
Client
   ↓
Server
   ↓
Database
```

The draft survives:

* refresh
* device changes
* browser crashes
* session interruptions

depending on the architecture.

---

## Option 4 — Hybrid

```text
Client
  ↓
local persistence
  +
server persistence
```

This can provide stronger recovery but introduces synchronization complexity.

---

# 6. Choosing the Persistence Layer

The decision should consider:

| Requirement               | Browser |   Server |
| ------------------------- | ------: | -------: |
| Survive refresh           |       ✓ |        ✓ |
| Cross-device resume       |       ✗ |        ✓ |
| Offline capability        |       ✓ |  Depends |
| Sensitive data control    | Limited | Stronger |
| Implementation simplicity |    High |    Lower |
| Multi-user workflow       |    Poor |   Strong |
| Server-side authorization |     N/A | Required |

The important point:

> **Persistence location determines ownership, security, synchronization, and recovery semantics.**

---

# 7. What Is an Autosave?

Autosave means the system persists draft changes without requiring an explicit final submission.

Conceptually:

```text
User edits
   ↓
detect change
   ↓
wait
   ↓
persist draft
```

A common implementation uses debouncing:

```text
Change
Change
Change
Change
   ↓
wait until user pauses
   ↓
save
```

---

# 8. Why Debounce?

Without debouncing:

```text
type "A"
→ save

type "l"
→ save

type "i"
→ save

type "c"
→ save

type "e"
→ save
```

This can produce:

```text
5 network requests
```

for one logical edit.

Debouncing turns this into:

```text
A
Al
Ali
Alic
Alice
   ↓
one save
```

The goal is to reduce unnecessary mutation frequency.

---

# 9. Debounce Is Not a Consistency Mechanism

This distinction is critical.

Debouncing controls:

```text
request frequency
```

It does not guarantee:

```text
request ordering
```

For example:

```text
Request A
Request B
```

can still complete:

```text
B
A
```

Therefore:

```text
debounce
    ≠
concurrency control
```

---

# 10. The Autosave Race Condition

Consider:

```text
User changes:
A
```

Autosave sends:

```text
Request 1 → A
```

Then the user changes again:

```text
B
```

Autosave sends:

```text
Request 2 → B
```

The server receives:

```text
Request 2
Request 1
```

If both are accepted:

```text
B saved
A saved
```

The final server state is stale.

This is a classic **out-of-order write** problem.

---

# 11. Why Request Order Cannot Be Assumed

A common mistake is assuming:

```text
request started first
```

means:

```text
request completes first
```

This is false.

Network latency, server scheduling, database contention, retries, and infrastructure can change completion order.

Therefore:

> **Client initiation order is not authoritative write order.**

---

# 12. Strategy 1 — Client-Side Request Cancellation

The client can attempt to cancel obsolete requests.

Conceptually:

```text
Request A
   ↓
new edit
   ↓
cancel A
   ↓
Request B
```

This can reduce unnecessary work.

However, cancellation does not necessarily mean:

```text
server definitely never processed A
```

A request may already have reached the server.

Therefore cancellation alone is not sufficient for correctness.

---

# 13. Strategy 2 — Sequence Numbers

The client can assign:

```text
sequence = 1
sequence = 2
sequence = 3
```

to saves.

The server can reject stale sequences.

For example:

```text
currentSequence = 7
incomingSequence = 6
```

Then:

```text
reject stale write
```

This requires the server to understand the ordering contract.

---

# 14. Strategy 3 — Version Numbers

A stronger model uses optimistic concurrency.

Suppose:

```text
draft.version = 12
```

The client loads:

```text
version = 12
```

and submits:

```text
expectedVersion = 12
```

The server checks:

```text
currentVersion === expectedVersion
```

If true:

```text
update draft
version = 13
```

If false:

```text
conflict
```

---

# 15. Optimistic Concurrency Control

The model is:

```text
Read version 12
      ↓
Modify
      ↓
Write if still version 12
      ↓
Success → version 13
```

If someone else has already written:

```text
version 13
```

then the old writer cannot silently overwrite it.

This is especially valuable for:

* autosave
* collaborative editing
* multi-tab workflows
* long-lived drafts

---

# 16. Draft Versioning

A persisted draft might conceptually contain:

```json
{
  "id": "draft_123",
  "ownerId": "user_42",
  "version": 12,
  "status": "draft",
  "data": {}
}
```

The version is not merely metadata.

It represents:

> **The revision against which the client believes it is writing.**

---

# 17. Conflict Detection

Suppose:

```text
Server
version = 15
```

Client A loaded:

```text
version = 15
```

Client B also loaded:

```text
version = 15
```

Then:

```text
Client A → version 15 → success → server version 16
```

Client B attempts:

```text
version 15
```

The server sees:

```text
current = 16
expected = 15
```

Therefore:

```text
CONFLICT
```

This is preferable to silently overwriting A's changes.

---

# 18. Conflict Resolution

A conflict can be handled in several ways.

### Reject

```text
"Your draft changed elsewhere."
```

### Reload

```text
server version
   ↓
replace local draft
```

### Merge

```text
local changes
+
server changes
   ↓
merged result
```

### Last Write Wins

```text
newest request wins
```

This is easy but can lose data.

The correct choice depends on the product's data-loss tolerance.

---

# 19. Field-Level Merge

Suppose:

```text
Server:
name = Alice
company = Acme
```

Client changes:

```text
name = Alicia
```

Another client changes:

```text
company = Globex
```

A field-aware merge might produce:

```text
name = Alicia
company = Globex
```

But field-level merging is not always safe.

Some fields are semantically coupled.

For example:

```text
country
state
taxConfiguration
```

may need to be validated together.

Therefore:

> **Technical mergeability does not imply business mergeability.**

---

# 20. Autosave Status

The UI should communicate persistence state.

A useful conceptual model:

```text
idle
dirty
saving
saved
save_failed
conflict
```

For example:

```text
Unsaved changes
```

then:

```text
Saving...
```

then:

```text
Saved
```

If saving fails:

```text
Unable to save
Retry
```

This is much more informative than showing a spinner forever.

---

# 21. Dirty vs Saving

These are different dimensions.

Example:

```text
dirty = true
saving = true
```

means:

```text
local changes exist
+
a save is currently executing
```

After successful save:

```text
dirty = false
saving = false
```

But if the user edits while saving:

```text
saving = true
dirty = true
```

When the first save finishes, the form may still be dirty because newer changes exist.

This is a subtle but important state transition.

---

# 22. The Save Watermark

A useful conceptual model is a save watermark.

Suppose local changes are:

```text
Revision 1
Revision 2
Revision 3
Revision 4
```

Autosave starts at:

```text
Revision 4
```

While saving, user creates:

```text
Revision 5
Revision 6
```

When Revision 4 finishes:

```text
savedRevision = 4
currentRevision = 6
```

Therefore:

```text
still dirty
```

The application should not incorrectly display:

```text
Saved
```

for the entire current draft.

---

# 23. Why "Save Complete" Can Be Misleading

If the UI says:

```text
Saved
```

after an old autosave completes while newer changes remain unsaved, the user receives false information.

Instead:

```text
savedRevision
```

should be compared against:

```text
currentRevision
```

Conceptually:

```text
savedRevision === currentRevision
```

means:

```text
all current changes persisted
```

---

# 24. Local Draft and Server Draft

A robust model may have:

```text
Local Draft
     │
     │ autosave
     ▼
Server Draft
```

These are not automatically identical.

For example:

```text
Local:
version 8

Server:
version 7
```

means:

```text
one revision remains unsaved
```

This gives the application an explicit synchronization model.

---

# 25. Recovery After Refresh

Suppose:

```text
local draft:
version 8

server draft:
version 7
```

The user refreshes.

The application must decide:

```text
Which version wins?
```

Possible strategies:

### Server wins

Simple but may lose local work.

### Local wins

Useful for offline-first designs but requires reconciliation.

### Compare and ask

```text
We found unsaved changes.
Restore them?
```

The correct behavior should be intentional.

---

# 26. Recovery Is a Product Contract

A recovery mechanism must define:

```text
What counts as recoverable?
Where is it stored?
How long is it retained?
Who owns it?
Which version is authoritative?
What happens after conflict?
```

Without these decisions, "autosave" is incomplete architecture.

---

# 27. Offline Editing

A browser may lose network connectivity:

```text
online
 ↓
offline
```

The user continues editing.

A sophisticated application may:

```text
persist locally
+
queue changes
```

Then:

```text
offline
 ↓
local draft
 ↓
online
 ↓
synchronize
```

This introduces a much larger synchronization problem.

---

# 28. Offline Does Not Mean Server-Safe

Suppose the user edits offline:

```text
price = 100
```

Meanwhile the server changes:

```text
price = 120
```

When reconnecting, blindly overwriting the server may be incorrect.

Offline support therefore requires:

* conflict detection
* merge policy
* authoritative server rules
* retry semantics

It is not simply:

```text
localStorage + fetch
```

---

# 29. Retry Semantics

Autosave failures may be temporary:

```text
network unavailable
```

The client may retry.

But retrying mutations creates another problem:

```text
Was the first request processed?
```

If the client does not know, repeating the operation can duplicate side effects.

For draft replacement operations, this may be manageable.

For domain mutations, idempotency becomes more important.

---

# 30. Draft Save Should Be Idempotent Where Possible

A draft update can often be modeled as:

```text
set draft state to X
```

rather than:

```text
append another draft event
```

The first model is naturally easier to retry.

For example:

```text
PUT draft/123
```

conceptually represents replacement/update semantics.

The exact HTTP design depends on the API architecture, but the underlying principle is:

> **Repeated delivery of the same logical draft state should not create duplicate business effects.**

---

# 31. Draft Save vs Domain Mutation

This distinction must remain clear.

### Draft save

```text
persist incomplete user work
```

### Domain mutation

```text
create order
charge payment
submit application
publish content
```

A draft save should generally not accidentally trigger:

```text
payment
email
notification
external side effect
```

unless explicitly designed to do so.

---

# 32. Draft Finalization

Eventually:

```text
draft
 ↓
submit
```

The server should perform a final transition.

Conceptually:

```text
Draft
 ↓
load authoritative draft
 ↓
validate complete state
 ↓
authorize
 ↓
apply business rules
 ↓
transaction
 ↓
final state
```

The client should not simply assume:

```text
last autosave = final truth
```

---

# 33. Finalization Race

Consider:

```text
Autosave request
```

and:

```text
Finalize request
```

executing concurrently.

If the finalize operation reads an older draft while a newer autosave is still in flight, the system may finalize stale data.

This requires coordination.

Possible approaches include:

* version checks
* transaction boundaries
* finalization locks
* server-side authoritative draft loading
* explicit state transitions

---

# 34. Version-Aware Finalization

Suppose:

```text
clientVersion = 20
```

Finalization can require:

```text
serverVersion === 20
```

If the server has:

```text
version = 21
```

the finalize request can fail with:

```text
draft changed
```

The user can then review the newer state.

This prevents silently finalizing stale data.

---

# 35. Draft Ownership and Authorization

A draft identifier should never be treated as authorization.

Bad:

```text
GET /draft/123
```

and simply returning the draft because:

```text
123 exists
```

Correct conceptual model:

```text
request
 ↓
authenticate
 ↓
identify actor
 ↓
authorize access to draft
 ↓
load draft
```

The same applies to:

```text
save
resume
delete
finalize
```

---

# 36. Tenant Isolation

In multi-tenant systems:

```text
tenant A
  └── draft 123

tenant B
  └── draft 456
```

The server must enforce tenant boundaries.

Do not trust:

```text
tenantId
```

supplied by the client.

The server should derive the authorization context from the authenticated identity/session and enforce ownership or permission rules.

---

# 37. Draft Expiration

Not all drafts should live forever.

A draft may contain:

```text
createdAt
updatedAt
expiresAt
```

The system can clean up abandoned drafts.

Expiration may be based on:

```text
last activity
```

rather than creation time.

---

# 38. Expiration UX

If a user returns after expiration:

```text
Draft expired
```

is not enough.

A useful product may provide:

```text
This draft is no longer available.
Start a new application.
```

or:

```text
Restore from local copy
```

if such recovery exists.

---

# 39. Autosave Frequency

Saving after every change is not always optimal.

Factors include:

```text
network cost
server load
database write cost
data criticality
user typing speed
latency
failure probability
```

Possible strategies:

```text
debounce 500ms
debounce 1s
save on blur
save on step transition
save periodically
explicit Save
```

The correct interval is a product and infrastructure decision.

---

# 40. Save on Step Transition

A wizard can simplify autosave:

```text
Step 1
   ↓
Next
   ↓
save draft
   ↓
Step 2
```

This dramatically reduces request frequency.

But it does not protect against:

```text
browser crash
```

between changes and navigation.

Therefore some applications combine:

```text
debounced autosave
+
step-transition save
+
explicit Save and Exit
```

---

# 41. Save on Blur

Another approach:

```text
field loses focus
   ↓
save
```

This can be useful for expensive fields.

But it can generate many writes when users move quickly between fields.

Again:

> **Autosave policy should match the interaction model.**

---

# 42. Save Status Must Be Non-Blocking

Autosave should generally not make the user wait:

```text
Saving...
```

before allowing normal interaction.

Instead:

```text
local state
   ↓
continue editing
   ↓
background persistence
```

The application should only block when correctness requires synchronization.

---

# 43. When Should Saving Block Navigation?

Potentially when:

```text
critical data has not been persisted
```

and:

```text
leaving would create unacceptable loss
```

But this should be deliberate.

For many forms:

```text
user can navigate
```

while:

```text
save continues
```

For critical workflows:

```text
navigation may require save success
```

The UX must reflect the business requirement.

---

# 44. Browser Unload Is Not a Reliable Save Mechanism

A common mistake is waiting until:

```text
beforeunload
```

to save everything.

This is unreliable because:

* browsers constrain unload work
* network requests may be terminated
* mobile browsers can kill processes
* background execution is not guaranteed

Autosave should happen **before** the user leaves, not depend entirely on unload.

---

# 45. Browser Storage Security

Local persistence can improve recovery but may expose sensitive data.

For example:

```text
localStorage
```

is accessible to JavaScript running on the origin.

If the draft contains sensitive information, blindly storing it client-side can increase exposure.

Therefore:

> **Recovery convenience must be evaluated against the sensitivity of persisted data.**

---

# 46. Sensitive Drafts

Examples may include:

* identity information
* financial information
* confidential business data
* personal documents

For these, server-side persistence may be preferable depending on the application's security model.

Do not automatically store the entire draft in browser storage.

---

# 47. File Uploads and Drafts

Files make draft persistence more complicated.

Suppose:

```text
Step 1 → profile
Step 2 → upload document
Step 3 → review
```

The uploaded file itself may not belong in:

```text
localStorage
```

Instead, a common architecture is:

```text
file
 ↓
object storage
 ↓
temporary upload reference
 ↓
draft record
```

The draft contains metadata/reference rather than raw file bytes.

---

# 48. Temporary Upload Lifecycle

A temporary upload might be:

```text
uploaded
 ↓
attached to draft
 ↓
draft finalized
```

or:

```text
uploaded
 ↓
draft abandoned
 ↓
cleanup
```

Therefore draft expiration may also require:

```text
temporary file cleanup
```

---

# 49. Autosave Observability

Production autosave should be observable.

Useful metrics include:

```text
save success rate
save latency
save failure rate
conflict rate
retry rate
draft abandonment
draft recovery
finalization failure
```

Logs can include:

```text
draft ID
version
operation
duration
result
```

while respecting privacy and data-minimization requirements.

---

# 50. Debugging Autosave

When users report:

> "My latest changes disappeared."

Investigate:

```text
1. What was the local revision?
2. What revision was sent?
3. When did requests start?
4. When did they complete?
5. Which server version was written?
6. Was a stale request accepted?
7. Did a retry occur?
8. Did another tab modify the draft?
9. Did finalization race with autosave?
```

Do not begin with:

> "React lost the state."

The failure may be distributed-state synchronization.

---

# 51. Production Failure Matrix

| Failure                         | Potential Cause          | Architecture               |
| ------------------------------- | ------------------------ | -------------------------- |
| Changes disappear               | no persistence           | draft storage              |
| Older changes overwrite newer   | out-of-order writes      | versioning                 |
| User sees false "Saved"         | stale save completion    | revision watermark         |
| Two tabs overwrite each other   | concurrent writers       | optimistic concurrency     |
| Retry duplicates operation      | ambiguous request result | idempotency                |
| Final submission misses changes | finalize/autosave race   | version-aware finalization |
| Draft exposed to another user   | missing authorization    | ownership check            |
| Old drafts accumulate           | no lifecycle policy      | expiration/cleanup         |
| Uploads remain forever          | orphaned temporary files | cleanup lifecycle          |

---

# 52. Common Mistakes

## Mistake 1 — Debounce and assume correctness

```text
debounce = 1 second
```

does not solve write ordering.

---

## Mistake 2 — Treat "Saved" as boolean

A boolean cannot necessarily represent:

```text
saved revision
vs
current revision
```

---

## Mistake 3 — Persist every keystroke

This creates unnecessary traffic and server load.

---

## Mistake 4 — Trust draft IDs

An identifier is not authorization.

---

## Mistake 5 — Store sensitive drafts blindly in localStorage

Persistence introduces a security surface.

---

## Mistake 6 — Treat draft as final domain state

Incomplete data should not accidentally trigger final business operations.

---

## Mistake 7 — Ignore multiple tabs

A single-user workflow can still have multiple concurrent clients.

---

## Mistake 8 — Ignore server-side conflicts

Last-write-wins can silently destroy user work.

---

## Mistake 9 — Depend on unload for saving

The browser cannot guarantee successful network persistence during shutdown.

---

# 53. Senior Architecture Pattern

A robust autosave architecture can look like:

```text
                    USER INPUT
                        │
                        ▼
                  LOCAL DRAFT
                        │
                revision increment
                        │
                        ▼
                  debounce timer
                        │
                        ▼
                  SAVE REQUEST
                        │
                        ▼
               expectedVersion = N
                        │
                        ▼
                     SERVER
                        │
              ┌─────────┴─────────┐
              │                   │
        version matches       version differs
              │                   │
              ▼                   ▼
           persist             conflict
              │
              ▼
          version N+1
              │
              ▼
        saved watermark
```

This separates:

```text
local editing
```

from:

```text
server persistence
```

and makes synchronization explicit.

---

# 54. The Draft State Machine

A conceptual lifecycle:

```text
                  ┌──────────────┐
                  │     NEW      │
                  └──────┬───────┘
                         ↓
                  ┌──────────────┐
                  │     DRAFT    │
                  └──────┬───────┘
                         │
              ┌──────────┼──────────┐
              ↓          ↓          ↓
           SAVING     CONFLICT    EXPIRED
              │          │
              ↓          ↓
            SAVED      RESOLVE
              │          │
              └────┬─────┘
                   ↓
              ┌──────────┐
              │ FINALIZE │
              └────┬─────┘
                   ↓
              ┌──────────┐
              │ COMPLETE │
              └──────────┘
```

The exact states vary by product, but the state-machine perspective is useful.

---

# 55. SDE-2 Interview Question

### "How would you design autosave for a long form?"

A strong answer should mention:

```text
1. Local draft state
2. Debounced persistence
3. Save status
4. Request ordering
5. Versioning / optimistic concurrency
6. Recovery
7. Authorization
8. Retry behavior
9. Conflict handling
10. Finalization semantics
```

A weak answer is:

> "Use debounce and call an API."

The latter solves only request frequency.

---

# 56. SDE-2 Interview Question

### "Why isn't debounce enough?"

Because debounce controls **when a request is initiated**, not:

```text
network ordering
server processing order
retry behavior
concurrent writers
```

Two requests can still complete out of order.

---

# 57. SDE-2 Interview Question

### "How do you prevent an old autosave from overwriting a new one?"

Possible answers include:

```text
optimistic concurrency with version numbers
```

or:

```text
server-side sequence validation
```

Potentially combined with:

```text
client cancellation
```

for efficiency.

The correctness mechanism must exist on the server.

---

# 58. SDE-2 Interview Question

### "Why does the server need version checking if only one user edits the form?"

Because one user can still have:

```text
multiple tabs
multiple devices
retries
concurrent requests
```

Concurrency is not limited to multiple human users.

---

# 59. Prediction Challenge #1

Server version:

```text
10
```

Client loads version:

```text
10
```

Client A saves:

```text
expectedVersion = 10
```

Server updates:

```text
11
```

Client B sends:

```text
expectedVersion = 10
```

What should happen?

<details>
<summary>Solution</summary>

The server should detect a version mismatch and reject or otherwise resolve the conflicting write.

Blindly overwriting version 11 would risk data loss.

</details>

---

# 60. Prediction Challenge #2

The current local revision is:

```text
20
```

Autosave request for revision 20 is running.

The user edits the form:

```text
current revision = 21
```

Revision 20 finishes successfully.

Should the UI display:

```text
Saved
```

?

<details>
<summary>Solution</summary>

Not necessarily.

Revision 20 is saved, but revision 21 is still unsaved.

The correct state is conceptually:

```text
savedRevision = 20
currentRevision = 21
```

Therefore the form remains dirty.

</details>

---

# 61. Prediction Challenge #3

A save request times out.

The user clicks Retry.

Could the original request have succeeded?

<details>
<summary>Solution</summary>

Yes.

A client timeout means the client does not know the outcome; it does not prove server failure.

Retry behavior therefore needs to consider idempotency or state-replacement semantics.

</details>

---

# 62. Prediction Challenge #4

A user edits a draft in two tabs.

Tab A saves version 5.

Tab B attempts to save version 4.

What should happen with optimistic concurrency?

<details>
<summary>Solution</summary>

The server should reject Tab B's stale write because its expected version no longer matches the authoritative version.

</details>

---

# 63. Prediction Challenge #5

A user edits a draft while offline.

The server version changes before they reconnect.

What must the system decide?

<details>
<summary>Solution</summary>

It needs a conflict strategy:

```text
server wins
client wins
merge
manual resolution
```

depending on the product's requirements and data semantics.

</details>

---

# 64. Production Checklist

Before shipping autosave, answer:

### Persistence

* [ ] Where is the draft stored?
* [ ] Why was that storage layer selected?
* [ ] Can the draft survive refresh?
* [ ] Can it survive browser/device changes?

### Synchronization

* [ ] How frequently does autosave run?
* [ ] Is debouncing used?
* [ ] How are concurrent saves handled?
* [ ] Is there a revision/version?
* [ ] Can stale writes be rejected?

### Recovery

* [ ] What happens after refresh?
* [ ] What happens after network failure?
* [ ] What happens after timeout?
* [ ] What happens after reconnect?

### Security

* [ ] Is the draft authorized?
* [ ] Is ownership enforced server-side?
* [ ] Is tenant isolation enforced?
* [ ] Is sensitive data stored safely?

### Finalization

* [ ] Can finalize race with autosave?
* [ ] Is final state revalidated?
* [ ] Is the final mutation idempotent where required?
* [ ] What happens to the draft after success?

### Lifecycle

* [ ] How long are drafts retained?
* [ ] How are abandoned drafts cleaned up?
* [ ] How are temporary uploads cleaned up?

---

# 65. Final Mental Model

Autosave should be understood as:

```text
LOCAL STATE
     │
     ▼
VERSIONED DRAFT
     │
     ▼
BACKGROUND PERSISTENCE
     │
     ▼
SERVER AUTHORITATIVE DRAFT
     │
     ├── recovery
     ├── conflict detection
     ├── authorization
     └── lifecycle
     │
     ▼
FINAL VALIDATION
     │
     ▼
FINAL MUTATION
```

The deepest principle is:

> **Autosave is not merely a UI feature. It is a synchronization protocol between local draft state and authoritative server state.**

Once persistence exists, you must reason about:

```text
ordering
concurrency
versioning
retries
conflicts
authorization
recovery
lifecycle
```

That is the SDE-2-level architectural boundary.

---

# 66. Part Boundary

This Part covered:

* draft persistence
* browser vs server persistence
* autosave
* debouncing
* request ordering
* cancellation
* sequence numbers
* optimistic concurrency
* versioning
* conflict detection
* conflict resolution
* save status
* revision watermarks
* recovery
* offline considerations
* retries
* idempotent draft persistence
* finalization races
* draft authorization
* tenant isolation
* expiration
* file/upload lifecycle
* observability
* production debugging
* SDE-2 concurrency reasoning

It intentionally does **not** deeply cover:

* generic multi-step workflow design already covered in Part 06
* complex dynamic field structures
* general mutation mechanics from KPI 04
* the complete final form architecture/capstone

**Part 07 is complete.**
