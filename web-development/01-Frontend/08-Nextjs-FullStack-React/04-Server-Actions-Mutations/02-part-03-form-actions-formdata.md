# KPI 04 — Server Actions & Data Mutations

## Part 03 — Form Actions and Web Standards (`FormData`)

---

# 1. Part Objective

This part establishes the form-based mutation model in Next.js.

The central question is:

> **How does a standard HTML form become a Server Action invocation, how does `FormData` cross the boundary, and how should the server validate and interpret that input?**

The goal is not merely to know:

```tsx
<form action={createProject}>
```

The goal is to understand the complete architecture behind it:

```text
HTML Form
   ↓
User input
   ↓
Form submission
   ↓
Server Action
   ↓
FormData
   ↓
Validation
   ↓
Application operation
   ↓
Result
```

By the end of this part, you should understand:

* how Server Actions integrate with `<form>`;
* what the `action` prop does;
* why `FormData` is a natural transport format for forms;
* how form controls become `FormData` entries;
* how Server Actions receive submitted data;
* how to extract values safely;
* why browser validation and server validation are different;
* validation vs sanitization vs authorization;
* structured validation errors;
* handling missing, malformed, or unexpected input;
* progressive enhancement;
* uncontrolled form inputs;
* why forms do not require every field to be controlled React state;
* how form mutation architecture should be designed for SDE-2-level applications.

---

# 2. Governing Mental Model

The most important model is:

```text
                BROWSER
┌────────────────────────────────────┐
│                                    │
│        HTML Form                   │
│                                    │
│  <input name="name" />             │
│  <input name="email" />            │
│  <button>Submit</button>           │
│                                    │
└───────────────┬────────────────────┘
                │
                │ submit
                ▼
          Form submission
                │
                ▼
        Server Action
                │
                ▼
            FormData
                │
                ▼
          Server validation
                │
                ▼
       Application operation
                │
                ▼
        Database / service
```

The key principle is:

> **The form is the input mechanism; the Server Action is the server-side mutation boundary.**

---

# 3. The Basic Form Action

A minimal example:

```tsx
import { createProject } from '@/actions/projects'

export default function ProjectForm() {
  return (
    <form action={createProject}>
      <input
        name="name"
        type="text"
      />

      <button type="submit">
        Create Project
      </button>
    </form>
  )
}
```

Server Action:

```ts
'use server'

export async function createProject(formData: FormData) {
  const name = formData.get('name')

  console.log(name)

  // mutation
}
```

The architecture is:

```text
<input name="name">
        │
        ▼
browser form
        │
        ▼
formData
        │
        ▼
createProject(formData)
```

The browser does not need a custom:

```ts
onSubmit
```

handler merely to transport the form to the server.

---

# 4. What the `action` Prop Represents

This:

```tsx
<form action={createProject}>
```

means that the form is associated with the Server Action.

Conceptually:

```text
form
 │
 └── action reference
          │
          ▼
    createProject
```

When the form is submitted:

```text
User
 ↓
submit
 ↓
form
 ↓
Server Action invocation
```

The important distinction is:

```text
action={createProject}
```

is not:

```text
action="/some-url"
```

It is a function/action reference integrated with React and Next.js.

---

# 5. Traditional HTML vs Server Actions

Traditional HTML:

```html
<form action="/projects" method="POST">
```

The browser submits to a URL.

The server receives an HTTP request.

Server Actions provide a React-integrated model:

```tsx
<form action={createProject}>
```

Conceptually:

```text
Traditional

Form
 ↓
URL
 ↓
HTTP endpoint
 ↓
handler


Server Action

Form
 ↓
Server Action reference
 ↓
Next.js action mechanism
 ↓
Server Action
```

The framework manages the underlying transport.

---

# 6. Why `FormData`?

HTML forms have historically been designed around named controls.

For example:

```html
<input name="name">
<input name="email">
<input name="role">
```

The browser naturally represents submitted values as form data.

That gives:

```text
name  → "Sunny"
email → "sunny@example.com"
role  → "admin"
```

In JavaScript:

```ts
const name = formData.get('name')
```

This preserves a web-platform-native model.

The architecture is therefore:

```text
HTML semantics
     ↓
Form controls
     ↓
FormData
     ↓
Server Action
```

Rather than requiring React state for every field.

---

# 7. The `name` Attribute Is Critical

Consider:

```tsx
<input
  type="text"
  name="projectName"
/>
```

The important identifier is:

```text
name="projectName"
```

The server can then access:

```ts
formData.get('projectName')
```

If the field does not have a meaningful `name`, it may not appear in the submitted form data as expected.

Therefore:

```text
name attribute
      ↓
FormData key
      ↓
Server Action input
```

This is fundamental web-platform behavior, not a Next.js-specific trick.

---

# 8. Extracting Values

A simple action:

```ts
'use server'

export async function createProject(formData: FormData) {
  const name = formData.get('name')
  const description = formData.get('description')

  // ...
}
```

But note:

```ts
formData.get()
```

does not magically guarantee your expected type.

The result may be:

```text
string
File
null
```

depending on the submitted field and input type.

Therefore, this:

```ts
const name = formData.get('name')
```

should be treated as:

```text
untrusted external input
```

not as:

```text
guaranteed valid string
```

---

# 9. `FormData` Is Not Domain Validation

Suppose:

```ts
const age = formData.get('age')
```

You cannot safely assume:

```ts
const age: number
```

because form submissions fundamentally transport user-controlled values.

For example:

```text
"25"
"0"
"abc"
""
null
```

Your application must establish the domain contract.

This creates a boundary:

```text
FormData
   │
   ▼
Raw input
   │
   ▼
Validation
   │
   ▼
Validated domain data
```

---

# 10. Validation Boundary

A robust Server Action should conceptually follow:

```text
receive input
     ↓
extract input
     ↓
validate input
     ↓
reject invalid input
     ↓
execute mutation
```

Not:

```text
receive input
     ↓
database mutation
```

For example:

```ts
'use server'

export async function createProject(formData: FormData) {
  const name = formData.get('name')

  if (typeof name !== 'string') {
    return {
      success: false,
      message: 'Invalid project name',
    }
  }

  if (name.trim().length < 3) {
    return {
      success: false,
      message: 'Project name is too short',
    }
  }

  // mutation
}
```

The action establishes a basic contract before performing the mutation.

---

# 11. Validation vs Sanitization vs Authorization

These concepts must remain separate.

## Validation

Question:

> Is this input acceptable according to the application's contract?

Example:

```text
project name must be 3–100 characters
email must have valid format
quantity must be positive
```

---

## Sanitization / Normalization

Question:

> How should acceptable input be normalized before use?

Examples:

```text
trim whitespace
normalize casing
canonicalize formats
```

For example:

```ts
const name =
  rawName.trim()
```

---

## Authorization

Question:

> Is this caller allowed to perform this operation?

Example:

```text
User is authenticated
        ↓
User belongs to project
        ↓
User has editor permission
        ↓
rename operation allowed
```

These are three different checks:

```text
Validation
   +
Normalization
   +
Authorization
```

Do not collapse them into one concept.

---

# 12. Schema Validation

For larger applications, schema validation is preferable to scattered manual checks.

A common pattern is:

```ts
const schema = z.object({
  name: z
    .string()
    .min(3)
    .max(100),

  description: z
    .string()
    .max(500)
    .optional(),
})
```

Then:

```ts
const rawData = {
  name: formData.get('name'),
  description: formData.get('description'),
}

const result = schema.safeParse(rawData)

if (!result.success) {
  return {
    success: false,
    errors: result.error.flatten(),
  }
}
```

The conceptual architecture becomes:

```text
FormData
   ↓
Raw object
   ↓
Schema
   ↓
Validated object
   ↓
Application logic
```

The important principle is:

> **Convert untrusted transport data into a validated application-level data structure before performing business operations.**

---

# 13. Validation Is a Server Responsibility

Browser validation can improve user experience:

```tsx
<input
  required
  minLength={3}
/>
```

But browser validation should not be treated as the application's security or correctness boundary.

Why?

Because requests can be generated independently of the browser UI.

For example:

```text
Browser UI
     │
     ▼
Server Action
```

is not the only conceptual caller.

A malicious or malformed client can attempt to invoke the underlying operation with unexpected input.

Therefore:

```text
Client validation
     ↓
UX improvement

Server validation
     ↓
application boundary
```

Server validation is mandatory.

---

# 14. Progressive Enhancement

One major advantage of form actions is their relationship with standard web forms.

The form itself can be expressed using native semantics:

```tsx
<form action={createProject}>
```

rather than requiring a fully custom client-side submission pipeline.

The conceptual goal is:

```text
HTML semantics
     +
Server Action
     +
React enhancement
```

rather than:

```text
React state
     +
custom submit handler
     +
manual fetch
     +
manual loading state
     +
manual response handling
```

This can produce simpler mutation architecture.

---

# 15. Uncontrolled Inputs

A form does not necessarily need:

```tsx
const [name, setName] = useState('')
```

for every field.

Instead:

```tsx
<input
  name="name"
/>
```

and:

```ts
formData.get('name')
```

can be enough.

This is especially useful for forms where you do not need every keystroke represented in React state.

Compare:

### Controlled

```tsx
const [name, setName] = useState('')

<input
  value={name}
  onChange={event =>
    setName(event.target.value)
  }
/>
```

### Form-native

```tsx
<input name="name" />
```

The second approach delegates input state to the browser until submission.

---

# 16. Why This Can Reduce Complexity

Imagine a form with:

```text
20 fields
```

A fully controlled implementation potentially requires:

```text
20 state values
20 change handlers
validation synchronization
submission state
error state
reset behavior
```

A form-native architecture can instead allow:

```text
browser
  ↓
form controls
  ↓
FormData
  ↓
Server Action
```

React state can then focus on state that genuinely affects interactive behavior.

This does not mean controlled inputs are bad.

It means:

> **Use React state where React state is actually needed.**

---

# 17. Checkboxes

Form semantics also matter for different control types.

Example:

```tsx
<input
  type="checkbox"
  name="archived"
/>
```

The resulting data must be interpreted according to checkbox submission semantics.

A server should not blindly assume:

```ts
const archived = formData.get('archived') === true
```

because form values are not automatically represented as JavaScript booleans.

A robust boundary explicitly converts the transport representation into the domain representation.

Conceptually:

```text
Form representation
       ↓
"on" / absence
       ↓
boolean domain value
```

The exact normalization strategy should be explicit.

---

# 18. Select Fields

Example:

```tsx
<select name="role">
  <option value="member">
    Member
  </option>

  <option value="admin">
    Admin
  </option>
</select>
```

Server:

```ts
const role = formData.get('role')
```

But the server must still validate:

```text
Is "admin" an allowed role?
```

Do not assume that because the browser displayed:

```text
member
admin
```

the server can only receive those values.

A caller can submit arbitrary values.

Therefore:

```text
UI options
      ≠
server trust boundary
```

---

# 19. Multiple Values

Some controls can produce multiple values.

For example:

```html
<input name="tag" value="react">
<input name="tag" value="nextjs">
```

A server may need:

```ts
formData.getAll('tag')
```

rather than:

```ts
formData.get('tag')
```

This illustrates a broader principle:

> **The transport representation must be understood before converting it into a domain model.**

---

# 20. File Inputs

Forms may also contain:

```tsx
<input
  type="file"
  name="avatar"
/>
```

The submitted value may be represented as a `File`.

Therefore:

```ts
const avatar = formData.get('avatar')
```

must not automatically be treated as:

```ts
string
```

The action needs explicit handling.

For example:

```text
FormData
   ↓
File
   ↓
size/type validation
   ↓
storage
```

File handling introduces additional concerns such as:

* size limits;
* content-type validation;
* storage;
* malware scanning;
* naming;
* access control.

The important point for this part is simply that `FormData` is a transport abstraction capable of carrying more than plain strings.

---

# 21. Structured Action Results

A mature Server Action should not necessarily return arbitrary strings.

A structured result is easier for the UI to reason about.

Example:

```ts
return {
  success: false,
  message: 'Please correct the highlighted fields.',
  errors: {
    name: ['Name is required'],
    email: ['Invalid email address'],
  },
}
```

Or success:

```ts
return {
  success: true,
  message: 'Project created successfully',
}
```

Conceptually:

```text
Server Action
      │
      ▼
Structured result
      │
      ├── success
      ├── message
      └── field errors
```

Part 05 will go deeper into consuming this state with `useActionState`.

---

# 22. Field-Level Errors

Good form architecture distinguishes:

```text
form-level error
```

from:

```text
field-level error
```

Example:

```ts
{
  success: false,
  errors: {
    name: ['Name is required'],
    email: ['Invalid email']
  }
}
```

The UI can then map errors to fields:

```text
Name
 └── Name is required

Email
 └── Invalid email
```

This creates a clear contract:

```text
Server validation
       ↓
structured errors
       ↓
field UI
```

---

# 23. Business Errors vs Validation Errors

Not every failure is a validation error.

For example:

```text
Validation:
"Project name is required."

Business rule:
"Project cannot be archived while deployment is running."

Authorization:
"You do not have permission."

Infrastructure:
"Database unavailable."
```

These represent different categories.

A mature mutation system should preserve those distinctions.

Conceptually:

```text
                 Action failure
                      │
       ┌──────────────┼───────────────┐
       ▼              ▼               ▼
   Validation     Business        Infrastructure
     error          rule              error
```

Authorization is another independent category.

This becomes especially important when designing action results and error handling.

---

# 24. Do Not Expose Internal Errors

Avoid returning:

```ts
return {
  message: databaseError.message,
}
```

directly to users.

Internal errors may reveal:

```text
database structure
SQL details
table names
internal service names
stack traces
infrastructure details
```

Instead:

```text
Internal error
      ↓
log diagnostic information
      ↓
return safe user-facing message
```

This principle will connect to the error architecture later in the curriculum.

---

# 25. Form Submission Lifecycle

The complete lifecycle is:

```text
1. User fills form
        │
        ▼
2. Browser maintains control values
        │
        ▼
3. User submits form
        │
        ▼
4. Form data is collected
        │
        ▼
5. Server Action invoked
        │
        ▼
6. FormData reaches server
        │
        ▼
7. Input extracted
        │
        ▼
8. Input normalized
        │
        ▼
9. Input validated
        │
        ▼
10. Authorization checked
        │
        ▼
11. Business operation executes
        │
        ▼
12. Structured result produced
```

This is the core mutation pipeline.

---

# 26. Production Example — Create Project

Suppose the UI is:

```tsx
<form action={createProject}>
  <input
    name="name"
    placeholder="Project name"
    required
  />

  <textarea
    name="description"
  />

  <button type="submit">
    Create Project
  </button>
</form>
```

Server:

```ts
'use server'

export async function createProject(
  formData: FormData
) {
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
  }

  const result = schema.safeParse(rawData)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten(),
    }
  }

  const project = await projectService.create(
    result.data
  )

  return {
    success: true,
    projectId: project.id,
  }
}
```

Architecture:

```text
HTML Form
   │
   ▼
FormData
   │
   ▼
Raw Input
   │
   ▼
Schema Validation
   │
   ▼
Validated Domain Input
   │
   ▼
Project Service
   │
   ▼
Database
```

Notice that the action itself is acting as the boundary.

---

# 27. Important Boundary Principle

Never confuse:

```text
Form structure
```

with:

```text
domain structure
```

The browser might submit:

```text
name = " My Project "
```

The application may want:

```text
{
  name: "My Project"
}
```

The transformation happens at the boundary:

```text
Transport model
      ↓
Normalization
      ↓
Validation
      ↓
Domain model
```

This is an important architectural pattern beyond Next.js itself.

---

# 28. Debugging FormData

If a form submission is not behaving correctly, inspect the boundary systematically.

### Step 1 — Inspect the HTML

Check:

```text
input name
select name
textarea name
button type
form action
```

### Step 2 — Inspect submitted keys

Conceptually inspect:

```ts
for (const [key, value] of formData.entries()) {
  console.log(key, value)
}
```

### Step 3 — Check extraction

```ts
formData.get('name')
```

Does the key match?

### Step 4 — Check type

Is it:

```text
string?
File?
null?
```

### Step 5 — Check validation

Did the schema reject the data?

### Step 6 — Check business logic

Did the mutation actually execute?

### Step 7 — Check result handling

Did the UI correctly interpret the returned state?

This prevents debugging the database when the real problem is:

```text
<input name="projectName">
```

while the server expects:

```ts
formData.get('name')
```

---

# 29. Common Mistakes

## Mistake 1 — Missing `name`

```tsx
<input />
```

instead of:

```tsx
<input name="name" />
```

---

## Mistake 2 — Trusting client validation

```tsx
<input required />
```

does not eliminate server validation.

---

## Mistake 3 — Assuming strings are numbers

```ts
const quantity = formData.get('quantity')
```

does not automatically give a numeric domain value.

---

## Mistake 4 — Treating `FormData` as trusted

It is external input.

---

## Mistake 5 — Mixing authorization into validation

```text
"Is this email valid?"
```

is different from:

```text
"Is this user allowed to modify this account?"
```

---

## Mistake 6 — Returning raw infrastructure errors

Do not expose database internals.

---

## Mistake 7 — Controlling every input unnecessarily

Not every form requires React state for every field.

---

# 30. Senior-Level Form Architecture

A strong architecture looks like:

```text
             UI
              │
              ▼
        HTML Form
              │
              ▼
          FormData
              │
              ▼
       Server Action
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
   Normalize Validate AuthZ
       │      │      │
       └──────┼──────┘
              ▼
      Application Service
              │
              ▼
        Infrastructure
```

The key idea:

> **The Server Action is a boundary adapter between a UI-oriented transport representation and server-side application operations.**

This is a much stronger mental model than:

> "The form calls a function."

---

# 31. SDE-2 Prediction Challenge

Consider:

```tsx
<form action={createUser}>
  <input
    name="email"
    type="email"
    required
  />

  <input
    name="age"
    type="number"
  />

  <button>
    Create
  </button>
</form>
```

Server:

```ts
'use server'

export async function createUser(
  formData: FormData
) {
  const email = formData.get('email')
  const age = formData.get('age')

  // ...
}
```

Predict:

### Question 1

Is `email` automatically a trusted email address?

```text
No
```

### Question 2

Is `age` automatically a JavaScript number?

```text
No
```

### Question 3

Can the server trust `required`?

```text
No
```

### Question 4

Should validation happen before the database mutation?

```text
Yes
```

### Question 5

Should authorization be performed separately from input validation?

```text
Yes
```

### Question 6

Does every input require React state?

```text
No
```

### Question 7

Can the Server Action return structured validation errors?

```text
Yes
```

---

# 32. Interview-Level Distinction

If asked:

> "Why use FormData instead of JSON?"

A weak answer:

> "Because Next.js uses FormData."

A stronger answer:

> "FormData aligns Server Actions with the native HTML form submission model. It allows forms to submit named controls without requiring every field to be represented as React state or manually serialized into JSON. The Server Action then treats that transport representation as untrusted input and converts it into validated application data."

That demonstrates understanding of:

```text
Web platform
+
React
+
Next.js
+
data boundaries
+
validation
```

---

# 33. Another Interview Question

> "Does `<input required>` guarantee valid server input?"

Correct answer:

> **No.**

It provides client-side/browser validation and improves user experience, but the server must independently validate incoming data because the server boundary cannot trust the client's UI constraints.

---

# 34. Another Interview Question

> "Why might you prefer an uncontrolled form?"

A strong answer:

> "When the UI does not need to react to every keystroke, keeping field values in the browser's native form state can reduce unnecessary React state and synchronization logic. On submission, the form can provide the values through `FormData`, while React state can remain focused on genuinely interactive UI state."

---

# 35. Completion Checklist

You should not consider this part complete until you can explain:

## Form architecture

* [ ] `<form action={serverAction}>`
* [ ] form submission lifecycle
* [ ] native HTML semantics
* [ ] progressive enhancement
* [ ] relationship between form and Server Action

## FormData

* [ ] `FormData`
* [ ] `name` attributes
* [ ] `get()`
* [ ] `getAll()`
* [ ] strings
* [ ] files
* [ ] missing values
* [ ] multiple values

## Validation

* [ ] client validation
* [ ] server validation
* [ ] schema validation
* [ ] normalization
* [ ] validation vs authorization
* [ ] structured errors

## React architecture

* [ ] uncontrolled forms
* [ ] controlled forms
* [ ] when React state is unnecessary
* [ ] when React state is useful

## Production reasoning

* [ ] raw input → validated input
* [ ] field-level errors
* [ ] form-level errors
* [ ] business-rule failures
* [ ] safe error messages
* [ ] debugging the FormData boundary

---

# 36. Final Mental Model

The entire part can be compressed into:

```text
                 BROWSER
                    │
                    ▼
              HTML Form
                    │
             named controls
                    │
                    ▼
                FormData
                    │
                    │ network
                    ▼
             Server Action
                    │
                    ▼
             Raw Input Data
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
      Normalize           Validate
          │                   │
          └─────────┬─────────┘
                    ▼
              Authorization
                    │
                    ▼
           Application Logic
                    │
                    ▼
            Database / APIs
```

The governing principle is:

> **A form is not a trusted data source. It is a transport mechanism for user-controlled input.**

Therefore the Server Action must transform:

```text
FormData
```

into:

```text
validated application data
```

before performing the mutation.

And the architectural progression is:

```text
HTML Form
   ↓
FormData
   ↓
Server Action
   ↓
Normalize
   ↓
Validate
   ↓
Authorize
   ↓
Mutate
   ↓
Return structured result
```

This is the foundation for the next parts of KPI 04.

---

# Part Boundary

This part intentionally focuses on:

```text
Form
FormData
Input extraction
Validation
Normalization
Structured results
```

It does **not** deeply cover:

```text
Pending UI                  → Part 04
useFormStatus               → Part 04
useActionState              → Part 05
Optimistic updates          → Part 06
Authentication/authorization
architecture               → Part 07
```

The next canonical part is:

**KPI 04 → Part 04 — Managing Pending States (`useFormStatus`)**
