# Level 08 — KPI 04 — Part 05

# Advanced Action State (`useActionState`)

## 1. Part Objective

In Part 04, we learned how to represent the **in-flight state** of a Server Action using `useFormStatus`.

But pending state answers only one question:

> **“Is the mutation currently running?”**

It does not answer:

* Did the mutation succeed?
* What validation failed?
* Which field is invalid?
* What business rule rejected the operation?
* What message should the user see?
* Should the form display a success state?
* What structured information did the server return?

That is the responsibility of **action result state**.

This part establishes the architecture for receiving structured results from Server Actions through React's `useActionState`.

The central objective is:

> **Master the flow from Server Action execution → structured result → React state → UI response.**

---

# 2. Governing Question

The governing question for this part is:

> **After the Server Action finishes, how does the UI receive, model, and render the action's result/state?**

A senior frontend engineer must distinguish:

```text
Submission state
      ↓
"Is it running?"

from

Result state
      ↓
"What happened?"
```

These are related, but they are not the same state.

---

# 3. The Mutation Lifecycle

A form mutation can now be modeled as:

```text
                 User submits form
                        │
                        ▼
                 ┌─────────────┐
                 │   Pending   │
                 └──────┬──────┘
                        │
                 Server Action
                   executes
                        │
              ┌─────────┴─────────┐
              │                   │
              ▼                   ▼
           Success              Failure
              │                   │
              ▼                   ▼
        Success state       Error state
              │                   │
              └─────────┬─────────┘
                        ▼
                    UI renders
```

`useFormStatus` primarily helps with:

```text
Pending
```

`useActionState` helps with:

```text
Success
Failure
Validation errors
Business errors
Server-returned state
```

Therefore:

```text
useFormStatus
    ↓
submission status

useActionState
    ↓
action result state
```

---

# 4. Why Pending State Is Not Enough

Consider:

```tsx
<SubmitButton />
```

with:

```tsx
const { pending } = useFormStatus();
```

You can determine:

```text
pending === true
```

But after the action completes:

```text
pending === false
```

That alone does not tell the component whether:

```text
the project was created
```

or:

```text
the project name already exists
```

or:

```text
the user is unauthorized
```

or:

```text
the server encountered a recoverable application error
```

Therefore:

```text
pending = false
```

does not mean:

```text
success = true
```

This distinction is critical.

---

# 5. What `useActionState` Provides

`useActionState` allows a component to associate a Server Action with state representing the result of that action.

Conceptually:

```text
Server Action
     │
     │ returns result
     ▼
useActionState
     │
     ▼
React state
     │
     ▼
UI
```

A simplified shape is:

```tsx
const [state, formAction, isPending] =
  useActionState(action, initialState);
```

The important outputs are:

```text
state
formAction
isPending
```

Where:

### `state`

Represents the latest action result.

### `formAction`

The action-enhanced function that is supplied to the form.

### `isPending`

Represents whether that action invocation is currently pending.

The exact API surface can evolve with React versions, but the architectural model remains:

```text
action
   ↓
stateful action invocation
   ↓
structured result state
```

---

# 6. Historical Terminology: `useFormState`

You may encounter older documentation or codebases referring to:

```tsx
useFormState
```

The modern terminology is:

```tsx
useActionState
```

For SDE-2 interviews, you should recognize both names.

Conceptually, the important distinction is not the name.

It is the architecture:

```text
Server Action
      +
previous state
      +
submitted data
      ↓
new action state
```

---

# 7. The Important Signature Change

This is one of the most important details in this part.

A normal Server Action might look conceptually like:

```tsx
async function createProject(formData: FormData) {
  // ...
}
```

When the action is used through `useActionState`, the action receives the previous state as an additional argument.

Conceptually:

```tsx
async function createProject(
  previousState,
  formData
) {
  // ...
}
```

Therefore:

```text
Normal form action:

(formData)

useActionState action:

(previousState, formData)
```

This difference is a common source of bugs.

---

# 8. Basic Architecture

Consider:

```tsx
async function createProject(
  previousState,
  formData
) {
  // validate
  // mutate
  // return structured state
}
```

Then:

```tsx
const [state, formAction, isPending] =
  useActionState(
    createProject,
    initialState
  );
```

And:

```tsx
<form action={formAction}>
  ...
</form>
```

The resulting architecture is:

```text
                   Server
                     │
             createProject()
                     │
                     │ result
                     ▼
              ┌──────────────┐
              │ useActionState│
              └───────┬──────┘
                      │
                      ▼
                    state
                      │
             ┌────────┴────────┐
             ▼                 ▼
        Success UI          Error UI
```

---

# 9. Initial State

`useActionState` requires an initial state.

For example:

```tsx
const initialState = {
  success: false,
  message: "",
  errors: {},
};
```

Then:

```tsx
const [state, formAction, isPending] =
  useActionState(
    createProject,
    initialState
  );
```

The initial state represents:

```text
No submission result yet
```

It should therefore be predictable and structurally compatible with every state the action can return.

---

# 10. State Shape Is an API Contract

This is an important senior-level concept.

If your action returns:

```tsx
{
  success: false,
  errors: {
    name: ["Name is required"]
  },
  message: "Please fix the form"
}
```

then your client should know that this structure is part of the action contract.

A robust state shape might be:

```tsx
type ProjectActionState = {
  success: boolean;
  message: string;
  errors: {
    name?: string[];
    description?: string[];
  };
};
```

The important property is consistency.

Avoid:

```text
success → object

validation failure → string

unexpected failure → null

authorization failure → different object
```

That produces fragile UI logic.

Prefer:

```text
Every outcome
      ↓
same state envelope
      ↓
different values
```

---

# 11. Structured Result State

A practical state model is:

```tsx
{
  success: boolean,
  message: string,
  errors: {
    fieldName?: string[]
  }
}
```

For example:

### Initial

```tsx
{
  success: false,
  message: "",
  errors: {}
}
```

### Validation failure

```tsx
{
  success: false,
  message: "Please correct the highlighted fields.",
  errors: {
    name: ["Project name is required"]
  }
}
```

### Business-rule failure

```tsx
{
  success: false,
  message: "A project with this name already exists.",
  errors: {}
}
```

### Success

```tsx
{
  success: true,
  message: "Project created successfully.",
  errors: {}
}
```

This gives the UI a predictable state machine.

---

# 12. Server Validation → Client State

A common production pattern is:

```text
FormData
   ↓
normalize
   ↓
validate
   ↓
invalid?
   │
   ├── yes → return validation state
   │
   └── no
        ↓
      mutate
        ↓
      return success state
```

For example:

```tsx
async function createProject(
  previousState,
  formData
) {
  const name = formData.get("name");

  const result = schema.safeParse({
    name,
  });

  if (!result.success) {
    return {
      success: false,
      message: "Validation failed.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  // perform mutation

  return {
    success: true,
    message: "Project created.",
    errors: {},
  };
}
```

The important architectural movement is:

```text
Server validation
      ↓
structured result
      ↓
React state
      ↓
field/form UI
```

---

# 13. Field-Level Errors

Field-level errors are particularly useful for forms.

Example:

```tsx
state.errors.name
```

could produce:

```text
Project name is required
```

The UI can then render:

```tsx
<input name="name" />

{state.errors.name?.map((error) => (
  <p key={error}>{error}</p>
))}
```

This allows the server to remain authoritative for validation while the client remains responsible for presentation.

---

# 14. Form-Level Errors

Not every error belongs to a field.

For example:

```text
"You have reached the maximum number of projects."
```

There may be no single input responsible for the failure.

That is a form-level error.

Represent it separately:

```tsx
{
  success: false,
  message: "You have reached the maximum number of projects.",
  errors: {}
}
```

Then the UI can display:

```text
Form
 ├── field errors
 │
 └── global/form error
```

This distinction prevents forcing every error into an input field.

---

# 15. Validation Error vs Business Error

These should also be conceptually separated.

### Validation error

The submitted data is invalid.

```text
name is required
email is malformed
```

### Business error

The data may be valid, but the requested operation is not allowed by application rules.

```text
project name already exists
plan limit exceeded
operation not available in current state
```

Both may result in:

```tsx
success: false
```

But their meaning is different.

A senior engineer should preserve that distinction even if the UI uses the same general error presentation.

---

# 16. Why This Reduces Manual Form State

A traditional client-heavy form may maintain:

```tsx
const [name, setName] = useState("");
const [description, setDescription] = useState("");
const [errors, setErrors] = useState({});
const [isLoading, setIsLoading] = useState(false);
const [message, setMessage] = useState("");
```

This can become increasingly complex.

With the Server Action model:

```text
Browser form
      ↓
FormData
      ↓
Server Action
      ↓
validation
      ↓
structured action state
      ↓
React
```

The server becomes responsible for authoritative validation and mutation.

The client primarily renders:

```text
current result
```

rather than manually reproducing server state.

---

# 17. Uncontrolled Forms and Action State

This architecture works naturally with standard HTML form controls.

For example:

```tsx
<input
  name="name"
  type="text"
/>
```

You do not necessarily need:

```tsx
const [name, setName] = useState("");
```

just to submit the value.

The browser already knows how to serialize the field:

```text
name="name"
      ↓
FormData
```

Then:

```text
FormData
      ↓
Server Action
      ↓
validation
      ↓
action state
```

This can dramatically reduce unnecessary client-side state.

---

# 18. When Controlled Inputs Are Still Appropriate

This does **not** mean controlled inputs are obsolete.

Controlled state remains appropriate when the UI needs immediate client-side behavior such as:

```text
live preview
conditional fields
instant calculations
rich editors
autocomplete
dependent controls
client-side formatting
interactive widgets
```

The correct principle is:

> Do not introduce controlled state merely to reproduce functionality that native forms already provide.

Use client state when the UI genuinely needs client-side state.

---

# 19. `useActionState` vs `useFormStatus`

These hooks solve related but different problems.

| Concern                       | `useFormStatus` | `useActionState`   |
| ----------------------------- | --------------- | ------------------ |
| Is submission pending?        | Yes             | Yes                |
| Latest action result          | No              | Yes                |
| Server validation errors      | No              | Yes                |
| Success message               | No              | Yes                |
| Field errors                  | No              | Yes                |
| Localized submit button state | Yes             | Can expose pending |
| Structured action state       | No              | Yes                |

Think:

```text
useFormStatus
    ↓
"What is the form doing right now?"

useActionState
    ↓
"What did the action produce?"
```

---

# 20. Two Sources of Pending State

You may encounter:

```tsx
const { pending } = useFormStatus();
```

and:

```tsx
const [state, formAction, isPending] =
  useActionState(...);
```

Both can represent pending execution, but they have different architectural placement/use cases.

`useFormStatus` is especially useful inside reusable form descendants:

```tsx
<form>
  <SubmitButton />
</form>
```

`useActionState` associates pending state directly with the action state lifecycle.

The important principle is:

> Do not create multiple competing loading-state systems for the same mutation without a reason.

---

# 21. Result State Is a State Machine

Instead of thinking:

```text
state = random object
```

think:

```text
              ┌───────────┐
              │   Initial │
              └─────┬─────┘
                    │ submit
                    ▼
              ┌───────────┐
              │  Pending  │
              └─────┬─────┘
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     ┌─────────┐         ┌─────────┐
     │ Success │         │ Failure │
     └─────────┘         └────┬────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                 Validation Business Infrastructure
```

This model makes UI behavior easier to reason about.

---

# 22. Avoid Ambiguous Boolean State

A weak state model might be:

```tsx
{
  success: false,
  error: false,
  message: ""
}
```

This can create impossible combinations:

```text
success = true
error = true
```

Instead, model outcomes deliberately.

For example:

```tsx
type ActionState =
  | {
      status: "idle";
      message: "";
      errors: {};
    }
  | {
      status: "success";
      message: string;
      errors: {};
    }
  | {
      status: "error";
      message: string;
      errors: Record<string, string[]>;
    };
```

Then the state machine becomes explicit:

```text
idle
success
error
```

This is often more robust than independent booleans.

---

# 23. State Should Be Serializable

The result returned from a Server Action must be compatible with the Server/Client transport model.

Therefore, prefer:

```text
strings
numbers
booleans
arrays
plain objects
supported serializable structures
```

Avoid returning arbitrary server-only objects such as:

```text
database connection
request object
class instance with server resources
function
secret-bearing object
```

The result is crossing an execution boundary.

Therefore:

> Treat action state as a transport contract, not an arbitrary in-memory object.

---

# 24. Do Not Return Sensitive Server Data

Suppose the database returns:

```tsx
{
  id,
  name,
  internalNotes,
  billingMetadata,
  privateToken
}
```

Do not blindly return that object as action state.

Instead:

```tsx
return {
  success: true,
  message: "Project created."
};
```

Return only what the UI needs.

The Server Action is still a server boundary.

Its result becomes client-visible state.

---

# 25. Successful Mutation

A clean success flow looks like:

```text
User submits
     ↓
Server validates
     ↓
Mutation succeeds
     ↓
Server returns:
{
  status: "success",
  message: "Project created"
}
     ↓
React receives state
     ↓
UI displays success
```

The action state should describe the mutation result, not leak implementation details.

---

# 26. Failed Mutation

A clean failure flow:

```text
User submits
     ↓
Server validates
     ↓
Validation fails
     ↓
Server returns:
{
  status: "error",
  errors: {
    name: [...]
  }
}
     ↓
React receives state
     ↓
UI renders field errors
```

This avoids throwing ordinary user-correctable validation failures as if they were system crashes.

---

# 27. Recoverable vs Exceptional Errors

Not every failure should have identical semantics.

### Recoverable application result

```text
invalid input
business rule violation
expected authorization rejection
```

These can often be represented as structured action state.

### Exceptional failure

```text
database unavailable
unexpected programming error
infrastructure failure
unknown runtime failure
```

These may require error boundaries, logging, observability, or a generic failure state rather than exposing internal details.

The important distinction is:

```text
Expected application outcome
          ≠
Unexpected system exception
```

---

# 28. Resetting Success/Error State

After a successful mutation, the UI may need to transition.

For example:

```text
Form submission
      ↓
success
      ↓
show confirmation
      ↓
navigate away
```

or:

```text
success
  ↓
reset form
  ↓
continue editing
```

The correct behavior depends on the product interaction.

Do not automatically reset state simply because the action succeeded.

Ask:

> What should the user experience after this mutation?

---

# 29. Multiple Submissions

Consider:

```text
User submits
     ↓
request A

User submits again
     ↓
request B
```

Now there may be multiple requests in flight.

This introduces questions around:

```text
ordering
race conditions
duplicate mutations
stale results
idempotency
```

`useActionState` helps model action state, but it does not magically make the underlying mutation safe.

For critical mutations, server-side design still matters.

For example:

```text
payment
order creation
email sending
resource creation
```

may require:

```text
idempotency keys
unique constraints
transaction semantics
deduplication
```

---

# 30. Example: Create Project

A conceptual implementation:

```tsx
const initialState = {
  status: "idle",
  message: "",
  errors: {},
};

async function createProject(previousState, formData) {
  const name = formData.get("name");

  const result = projectSchema.safeParse({
    name,
  });

  if (!result.success) {
    return {
      status: "error",
      message: "Please correct the form.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  const existingProject = await findProjectByName(
    result.data.name
  );

  if (existingProject) {
    return {
      status: "error",
      message: "A project with this name already exists.",
      errors: {},
    };
  }

  await insertProject(result.data);

  return {
    status: "success",
    message: "Project created successfully.",
    errors: {},
  };
}
```

Client side:

```tsx
const [state, formAction, isPending] =
  useActionState(
    createProject,
    initialState
  );
```

Form:

```tsx
<form action={formAction}>
  <input name="name" />

  {state.errors.name?.map((error) => (
    <p key={error}>{error}</p>
  ))}

  <button disabled={isPending}>
    {isPending ? "Creating..." : "Create project"}
  </button>

  {state.status === "error" && (
    <p>{state.message}</p>
  )}

  {state.status === "success" && (
    <p>{state.message}</p>
  )}
</form>
```

The architecture is:

```text
HTML form
    ↓
FormData
    ↓
Server Action
    ↓
validation
    ↓
business logic
    ↓
structured result
    ↓
useActionState
    ↓
UI
```

---

# 31. Why This Architecture Scales

Without action state:

```text
Client
 ├── loading state
 ├── error state
 ├── validation state
 ├── success state
 ├── API response state
 └── synchronization logic
```

With action state:

```text
Server Action
      ↓
canonical mutation result
      ↓
React action state
      ↓
UI
```

This reduces duplicated representations of the same mutation lifecycle.

The server remains authoritative for:

```text
validation
business rules
mutation
```

The client remains responsible for:

```text
presentation
interaction
feedback
```

---

# 32. Debugging `useActionState`

When the UI is not receiving the expected result, inspect the pipeline.

## Step 1 — Is the form using the returned action?

Verify:

```tsx
<form action={formAction}>
```

rather than accidentally using:

```tsx
<form action={createProject}>
```

when the stateful wrapper is intended.

---

## Step 2 — Is the action signature correct?

Check:

```tsx
async function action(previousState, formData)
```

rather than accidentally assuming:

```tsx
async function action(formData)
```

---

## Step 3 — Is the action returning state?

Verify every expected branch returns a compatible structure.

---

## Step 4 — Is the result serializable?

Look for:

```text
functions
server-only objects
database objects
request objects
```

---

## Step 5 — Is the UI reading the correct property?

For example:

```tsx
state.errors.name
```

must match the actual returned structure.

---

## Step 6 — Are different branches returning incompatible shapes?

Avoid:

```tsx
return {
  error: "..."
};
```

in one branch and:

```tsx
return {
  status: "success",
  message: "..."
};
```

in another.

---

# 33. Common Mistakes

## Mistake 1 — Treating `pending === false` as success

Incorrect:

```text
pending false
     ↓
success
```

Correct:

```text
pending false
     ↓
inspect action result
```

---

## Mistake 2 — Wrong action signature

Incorrect:

```tsx
async function action(formData) {}
```

when using the action through `useActionState`.

Expected conceptual signature:

```tsx
async function action(previousState, formData) {}
```

---

## Mistake 3 — Returning inconsistent state

Avoid:

```text
branch A → string
branch B → object
branch C → null
```

Use a stable state contract.

---

## Mistake 4 — Returning server internals

Do not expose:

```text
database records
private metadata
internal exception details
secrets
```

---

## Mistake 5 — Rebuilding all form values in React state

Do not automatically create:

```tsx
useState()
```

for every input.

Use native form semantics where possible.

---

## Mistake 6 — Treating validation as an exceptional crash

Expected validation failure should generally be represented as application state.

---

## Mistake 7 — Assuming `useActionState` solves mutation correctness

It does not solve:

```text
duplicate requests
idempotency
transactions
authorization
database consistency
```

Those remain server/application architecture concerns.

---

# 34. Senior-Level Architecture

A mature mutation architecture can be represented as:

```text
                 ┌──────────────────┐
                 │      Browser     │
                 └────────┬─────────┘
                          │
                       FormData
                          │
                          ▼
                 ┌──────────────────┐
                 │  Server Action   │
                 └────────┬─────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        Validation     Business      Mutation
             │          Rules           │
             └────────────┬─────────────┘
                          ▼
                  Structured Result
                          │
                          ▼
                 ┌──────────────────┐
                 │ useActionState   │
                 └────────┬─────────┘
                          │
                          ▼
                       React UI
```

This creates a clean boundary:

```text
Server
 └── decides what happened

Client
 └── decides how to present what happened
```

---

# 35. SDE-2 Interview Mental Model

If an interviewer asks:

> “Why use `useActionState`?”

A strong answer is:

> `useActionState` associates a Server Action with structured React state representing the latest result of that action. It is useful for returning server-side validation errors, business outcomes, success messages, and other serializable mutation state to the UI without manually maintaining separate client state for the entire mutation lifecycle.

If asked:

> “How is it different from `useFormStatus`?”

Answer:

> `useFormStatus` is primarily concerned with the submission status of a form, especially whether it is pending. `useActionState` models the result of the action itself, allowing the UI to consume structured success and error state.

---

# 36. Prediction Challenge

Consider:

```tsx
async function saveProfile(previousState, formData) {
  const result = schema.safeParse({
    name: formData.get("name"),
  });

  if (!result.success) {
    return {
      status: "error",
      message: "Invalid profile",
      errors: result.error.flatten().fieldErrors,
    };
  }

  await saveToDatabase(result.data);

  return {
    status: "success",
    message: "Profile saved",
    errors: {},
  };
}
```

And:

```tsx
const [state, formAction, isPending] =
  useActionState(
    saveProfile,
    {
      status: "idle",
      message: "",
      errors: {},
    }
  );
```

Predict the state after:

### Scenario A

User submits:

```text
name = ""
```

Expected conceptual result:

```text
status = error
message = "Invalid profile"
errors.name = [...]
```

### Scenario B

User submits:

```text
name = "Alex"
```

and the database mutation succeeds.

Expected:

```text
status = success
message = "Profile saved"
errors = {}
```

### Scenario C

The request is currently executing.

Expected:

```text
isPending = true
```

But:

```text
isPending = true
```

does not itself mean:

```text
status = success
```

---

# 37. Production Design Questions

Before implementing an action-state flow, ask:

### State contract

```text
What does every possible action outcome return?
```

### Validation

```text
Which errors are field-level?
Which are form-level?
```

### Business logic

```text
Which failures are expected business outcomes?
```

### Exceptions

```text
Which failures should instead reach error handling/observability?
```

### Security

```text
Could this returned state expose sensitive information?
```

### UX

```text
What should happen after success?
```

### Concurrency

```text
What happens if the user submits twice?
```

These are SDE-2-level questions because they move beyond API syntax into system behavior.

---

# 38. Completion Checklist

You should be able to explain and implement all of the following without relying on a tutorial.

### Core concepts

* [ ] Why pending state is insufficient
* [ ] What `useActionState` represents
* [ ] Relationship between Server Actions and action state
* [ ] Relationship between `useActionState` and `useFormState`
* [ ] Initial action state

### Action mechanics

* [ ] `useActionState` action signature
* [ ] `previousState`
* [ ] `FormData`
* [ ] `formAction`
* [ ] structured action results

### Error modeling

* [ ] validation errors
* [ ] field-level errors
* [ ] form-level errors
* [ ] business-rule errors
* [ ] recoverable vs exceptional failures

### UI architecture

* [ ] success rendering
* [ ] error rendering
* [ ] pending rendering
* [ ] uncontrolled form strategy
* [ ] when controlled state is justified

### Senior-level reasoning

* [ ] state contract consistency
* [ ] serializability
* [ ] avoiding sensitive data exposure
* [ ] duplicate submission considerations
* [ ] idempotency limitations
* [ ] server/client responsibility boundaries

---

# 39. Final Mental Model

Do not memorize:

```tsx
useActionState(...)
```

as merely another React hook.

Understand the architecture:

```text
                 USER
                  │
                  ▼
              HTML FORM
                  │
                  ▼
               FormData
                  │
                  ▼
            SERVER ACTION
                  │
        ┌─────────┴─────────┐
        │                   │
     Validate            Mutate
        │                   │
        └─────────┬─────────┘
                  ▼
          Structured Result
                  │
                  ▼
           useActionState
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
      Success   Errors    Message
        │         │         │
        └─────────┴─────────┘
                  ▼
                  UI
```

The core principle is:

> **`useFormStatus` tells you what the submission is doing; `useActionState` tells you what the action produced.**

And the senior-level principle is:

> **Model mutation outcomes as a stable, serializable application-state contract between the server mutation boundary and the UI.**

---

# 40. Part Boundary

This part intentionally focused on:

```text
Action result state
useActionState
previousState
structured results
validation errors
business outcomes
success state
```

It did **not** deeply cover:

```text
optimistic UI
useOptimistic
rollback
authorization
authentication
CSRF
action security
```

Those belong to subsequent parts of KPI 04.

## Canonical sequence

```text
Part 01
Mutation Paradigm Shift
        ↓
Part 02
Defining and Invoking Server Actions
        ↓
Part 03
Form Actions and FormData
        ↓
Part 04
Managing Pending States
        ↓
Part 05
Advanced Action State ← CURRENT
        ↓
Part 06
Optimistic UI Updates
        ↓
Part 07
Security and Authorization in Actions
```
