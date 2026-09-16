# Level 08 — Next.js & Full-Stack React

# KPI 05 — Forms & Full-Stack Mutation Architecture

## Part 05 — File Uploads & Multipart Form Architecture

---

# 1. Part Objective

File uploads introduce a fundamentally different form payload.

A normal form primarily transports:

```text
text
numbers
booleans
selections
```

A file-uploading form transports:

```text
metadata
+
binary content
```

The engineering problem therefore becomes:

> **How do we transport, validate, authorize, persist, and reconcile files without treating the browser's file input as a trusted storage or security boundary?**

This Part establishes the architecture for:

* `<input type="file">`
* `FormData`
* `multipart/form-data`
* `File`
* file validation
* upload size constraints
* server-side handling
* object storage
* upload workflows
* progress and pending UX
* failure recovery
* metadata vs binary content
* security
* large-file architecture

---

# 2. Governing Question

The governing question is:

> **Where does the file travel, who is allowed to upload it, how is it validated, where is it stored, and how does the application's authoritative state reference it?**

The core model is:

```text
Browser
   ↓
File selection
   ↓
Upload transport
   ↓
Server / upload service
   ↓
Validation
   ↓
Object storage
   ↓
Metadata persistence
   ↓
Application state
```

The file itself and the application's record about that file are related, but they are not the same thing.

---

# 3. Why Files Are Different

A normal form might submit:

```text
name = "Project Alpha"
```

A file form might submit:

```text
avatar = <binary data>
```

The difference matters because files can be:

* large
* slow to transfer
* memory-intensive
* malformed
* malicious
* encrypted
* corrupted
* duplicated
* partially uploaded
* abandoned
* inaccessible
* subject to retention requirements

Therefore:

> **File upload architecture is an infrastructure problem as well as a form problem.**

---

# 4. The Basic HTML Contract

A file input is:

```html
<input type="file" name="avatar" />
```

For multiple files:

```html
<input
  type="file"
  name="documents"
  multiple
/>
```

The form typically uses:

```html
<form enctype="multipart/form-data">
```

`multipart/form-data` allows the request to contain multiple parts, including binary file content.

Conceptually:

```text
HTTP Request
├── text field
├── text field
├── file
└── file
```

---

# 5. FormData and Files

When a form contains files, the browser constructs a multipart payload.

Conceptually:

```text
FormData
├── title → string
├── description → string
└── avatar → File
```

On the server, values may therefore be:

```ts
string
```

or:

```ts
File
```

or:

```ts
null
```

depending on the field and request.

The application must inspect the actual type.

---

# 6. File Is Not a String

A common mistake is assuming:

```ts
const value = formData.get("avatar");

const avatar = String(value);
```

This destroys the intended semantic model.

The field represents a file object, not ordinary text.

Conceptually:

```ts
const value = formData.get("avatar");

if (!(value instanceof File)) {
  // invalid upload
}
```

The exact runtime environment and framework API should be considered when implementing this check, but the architectural principle remains:

> **Do not collapse binary input into string semantics.**

---

# 7. File Input Is Uncontrolled by Nature

Browsers intentionally restrict programmatic manipulation of file inputs.

For example, application code cannot generally do:

```text
fileInput.value = "/some/server/path"
```

and expect the browser to upload that file.

The user or browser security model determines which local file is selected.

Therefore file inputs should generally be treated as:

```text
user-selected resources
```

rather than ordinary controlled text inputs.

---

# 8. `accept` Is a Hint, Not Security

A UI might specify:

```html
<input
  type="file"
  accept="image/png,image/jpeg"
/>
```

This helps the browser present appropriate choices.

But:

```text
accept
    ≠
security boundary
```

A malicious client can construct a request manually.

Therefore the server must independently validate the upload.

---

# 9. Extension Is Not File Type

Suppose the filename is:

```text
photo.jpg
```

That does not prove:

```text
content = JPEG
```

A user can rename:

```text
malware.exe
```

to:

```text
photo.jpg
```

Therefore:

```text
filename extension
    ≠
actual file content
```

The server should use appropriate content-type and/or file-signature inspection where the security requirements justify it.

---

# 10. MIME Type Is Also Not Absolute Truth

A browser may report:

```text
image/jpeg
```

but the server should not blindly trust client-provided metadata.

Think in layers:

```text
Filename
    ↓
Client MIME metadata
    ↓
Server inspection
    ↓
Application policy
```

The stronger the security requirement, the more independent validation is required.

---

# 11. File Validation Pipeline

A robust upload pipeline can be modeled as:

```text
Incoming File
     ↓
Size Check
     ↓
Type / Content Check
     ↓
Extension Policy
     ↓
Security Scanning
     ↓
Authorization
     ↓
Storage
     ↓
Metadata Persistence
```

Not every application needs every stage.

The important principle is:

> **Validation happens before the application trusts the uploaded object.**

---

# 12. Size Validation

Suppose the application allows:

```text
Maximum avatar size = 5 MB
```

The server should enforce that limit.

Do not rely only on:

```html
accept
```

or client-side JavaScript.

Otherwise an attacker can bypass the browser entirely.

The server should reject:

```text
file.size > maximum
```

before expensive processing where possible.

---

# 13. Why Size Limits Matter

Without limits, uploads can become an availability problem.

A malicious client could repeatedly submit:

```text
10 GB
10 GB
10 GB
10 GB
...
```

Potential consequences:

* memory pressure
* bandwidth exhaustion
* storage exhaustion
* request timeouts
* processing queue saturation
* increased infrastructure cost

Therefore upload limits are part of system reliability.

---

# 14. File Count Limits

Size is not the only dimension.

A request could contain:

```text
1 × 100 MB
```

or:

```text
10,000 × 1 MB
```

Both represent:

```text
100 MB
```

but have very different processing characteristics.

Therefore systems may also need:

```text
maximum files per request
maximum total upload size
maximum individual file size
```

---

# 15. Filename Is Untrusted Input

A user might upload:

```text
../../something
```

or:

```text
invoice<script>.pdf
```

or an extremely long filename.

Never directly use a client filename as a filesystem path.

Bad conceptual pattern:

```text
/uploads/{userProvidedFilename}
```

Better:

```text
/uploads/{serverGeneratedIdentifier}
```

and preserve the original filename separately as metadata if required.

---

# 16. Storage Identity vs Display Name

Separate:

```text
storage key
```

from:

```text
original filename
```

Example:

```json
{
  "storageKey": "objects/8f7c.../blob",
  "originalName": "quarterly-report.pdf"
}
```

The storage key should be controlled by the application.

The display name can preserve the user's original filename.

This separation reduces path traversal and collision risks.

---

# 17. Never Trust File Paths from the Client

A client should not normally tell the server:

```text
save this file to:
/var/app/uploads/users/42/secret.txt
```

Instead the server determines:

```text
tenant
user
storage namespace
object key
```

The client supplies content and relevant metadata—not authoritative storage locations.

---

# 18. File Storage and Database Storage Are Different

A common architecture mistake is treating a file as ordinary database content.

For many applications:

```text
Database
    ↓
metadata

Object Storage
    ↓
binary content
```

The database might contain:

```json
{
  "id": "file_123",
  "ownerId": "user_42",
  "storageKey": "objects/abc",
  "originalName": "resume.pdf",
  "size": 182736,
  "mimeType": "application/pdf"
}
```

while the actual bytes live in object storage.

---

# 19. Why Object Storage Is Common

Object storage is designed for:

* large blobs
* durable storage
* scalable retrieval
* access control
* lifecycle policies
* CDN integration
* large-file workloads

Examples include cloud object-storage systems.

The architectural concept is more important than the provider:

```text
Application DB
    ↕
File metadata

Object Storage
    ↕
File bytes
```

---

# 20. File Metadata Is Application State

Suppose a user uploads:

```text
resume.pdf
```

The application may create:

```text
FileRecord
```

containing:

```text
id
ownerId
storageKey
filename
size
mimeType
createdAt
status
```

The file bytes and the database record together form the application's file lifecycle.

---

# 21. Upload Status

A file record may need explicit status:

```text
pending
uploading
uploaded
processing
ready
failed
deleted
```

This becomes important when processing is asynchronous.

For example:

```text
Upload
  ↓
Stored
  ↓
Virus scan
  ↓
Thumbnail generation
  ↓
Ready
```

The user should not necessarily be able to consume the file before the required processing completes.

---

# 22. Upload Lifecycle

A mature upload can look like:

```text
SELECT
  ↓
VALIDATE CLIENT UX
  ↓
SUBMIT
  ↓
SERVER AUTHENTICATION
  ↓
SERVER AUTHORIZATION
  ↓
UPLOAD VALIDATION
  ↓
STORE
  ↓
PERSIST METADATA
  ↓
OPTIONAL PROCESSING
  ↓
READY
```

Failure can occur at every stage.

Therefore the system needs explicit failure semantics.

---

# 23. Server Actions and Small File Uploads

Server Actions can be useful for UI-driven mutations involving files when:

* files are relatively small
* request limits are acceptable
* the framework/runtime supports the intended payload
* the operation naturally belongs to a form mutation

Conceptually:

```text
<form action={uploadAvatar}>
```

and:

```text
FormData
    ↓
Server Action
    ↓
validate
    ↓
store
```

But Server Actions should not automatically become the transport for every large-file workload.

---

# 24. Why Large Files Change the Architecture

Consider a:

```text
2 GB video
```

Sending:

```text
Browser
  ↓
Application Server
  ↓
Object Storage
```

means the application server may become a data-transfer middleman.

This can create:

* bandwidth cost
* latency
* request duration
* memory/resource pressure
* timeout risk
* scaling bottlenecks

For large files, a direct-to-storage architecture is often preferable.

---

# 25. Direct-to-Object-Storage Upload

A common architecture is:

```text
Browser
   │
   │ 1. Request upload authorization
   ▼
Application Server
   │
   │ 2. Generate signed upload permission
   ▼
Browser
   │
   │ 3. Upload directly
   ▼
Object Storage
```

Then:

```text
Object Storage
      ↓
application notification / confirmation
      ↓
Database metadata
```

The application server controls authorization without carrying the entire binary payload.

---

# 26. Signed Upload URLs

The conceptual workflow is:

```text
POST /upload-intent
        ↓
authenticate
        ↓
authorize
        ↓
validate requested file constraints
        ↓
generate temporary upload permission
        ↓
return upload target
```

The browser then uploads directly to storage.

The signed permission should be:

* narrowly scoped
* short-lived
* associated with the intended object
* restricted to the intended operation

---

# 27. Upload Intent

A useful abstraction is:

```text
UploadIntent
```

Example conceptual structure:

```json
{
  "fileId": "file_123",
  "objectKey": "uploads/abc",
  "maxSize": 10485760,
  "allowedType": "image/jpeg",
  "expiresAt": "..."
}
```

The client receives permission to perform a specific upload rather than general storage access.

---

# 28. Authorization Before Upload

Do not generate an upload capability before determining:

```text
Who is this user?
```

and:

```text
What resource are they modifying?
```

For example:

```text
User A
    ↓
Project 123
    ↓
Can User A upload files to Project 123?
```

This must be determined server-side.

---

# 29. Upload Capability Is Not General Permission

A signed upload URL might authorize:

```text
PUT object ABC
```

for a short period.

It should not imply:

```text
read every object
delete every object
list every object
upload arbitrary objects
```

The capability should be narrowly scoped.

---

# 30. File Access Architecture

Uploading and downloading are separate authorization problems.

A user may be allowed to:

```text
upload
```

but not necessarily:

```text
download
```

Likewise:

```text
download
```

may be permitted only for users with access to a specific project.

Therefore:

```text
Upload authorization
      ≠
Download authorization
      ≠
Delete authorization
```

---

# 31. Private vs Public Files

Some files can be public:

```text
marketing-image.jpg
```

Others must remain private:

```text
employee-contract.pdf
```

A private file should not simply be placed at a permanently public URL.

Instead, applications commonly use:

```text
authenticated request
      ↓
authorization
      ↓
temporary access
```

or a server-controlled proxy.

---

# 32. Multi-Tenant File Isolation

Consider:

```text
Organization A
    └── files

Organization B
    └── files
```

The storage key should reflect an authorization boundary where useful:

```text
organizations/{orgId}/files/{fileId}
```

But storage naming alone is not authorization.

The server must still verify:

```text
currentUser
    ↓
organization membership
    ↓
resource permission
```

---

# 33. File Uploads and SDE-2 Security

Treat uploaded content as hostile.

Potential risks include:

* malicious executables
* polyglot files
* oversized payloads
* malicious metadata
* archive bombs
* path traversal
* parser vulnerabilities
* malware
* unsafe image/document processing
* unauthorized access

Therefore:

```text
upload succeeds
    ≠
file is safe
```

The appropriate security controls depend on the application's threat model.

---

# 34. Malware Scanning

For security-sensitive applications, uploaded files may require:

```text
upload
  ↓
quarantine
  ↓
malware scan
  ↓
approved
  ↓
available
```

Do not expose a file to downstream users before required scanning completes.

This is particularly important for:

* enterprise document systems
* collaboration platforms
* messaging systems
* customer uploads
* public file-sharing systems

---

# 35. Image Processing

Image uploads introduce another consideration.

A user may upload:

```text
10,000 × 10,000 image
```

Even if the compressed file is relatively small, decoding it may consume substantial resources.

Therefore image systems may validate:

```text
file size
dimensions
format
metadata
processing cost
```

before generating thumbnails or transformations.

---

# 36. Metadata Stripping

Images can contain metadata such as:

```text
GPS coordinates
camera information
timestamps
```

Depending on the product, metadata may need to be removed before distribution.

This is both:

```text
privacy
```

and:

```text
product behavior
```

consideration.

---

# 37. Duplicate Files

Users may upload the same file multiple times.

Possible strategies:

```text
always store duplicate
```

or:

```text
content hash
    ↓
detect duplicate
    ↓
reuse existing object
```

Content-addressed approaches can reduce storage but introduce additional complexity.

Do not introduce deduplication unless the product and infrastructure requirements justify it.

---

# 38. Upload Idempotency

Uploads can fail ambiguously.

Suppose:

```text
Browser
  ↓
upload
  ↓
network timeout
```

The client does not know whether:

```text
upload failed
```

or:

```text
upload succeeded but response was lost
```

Therefore robust upload systems may use:

```text
idempotency keys
```

or deterministic upload identifiers.

This prevents retries from unintentionally creating multiple logical records.

---

# 39. Retry Semantics

A retry should answer:

```text
Is this the same logical upload?
```

If yes:

```text
reuse upload identity
```

rather than:

```text
create another file record
```

This is the same distributed-systems principle encountered elsewhere:

> **A timeout does not prove that the operation did not execute.**

---

# 40. Upload Progress

A pending state answers:

```text
Is the mutation currently executing?
```

File uploads often need more detail:

```text
0%
25%
50%
75%
100%
```

This can improve UX for large files.

The distinction is:

```text
pending
    ↓
operation is active

progress
    ↓
how much transfer has completed
```

They are not equivalent.

---

# 41. Progress Is Not Server Completion

Suppose:

```text
upload progress = 100%
```

That does not necessarily mean:

```text
file processing = complete
```

The lifecycle could be:

```text
Upload
100%
  ↓
Storage complete
  ↓
Virus scan
  ↓
Thumbnail generation
  ↓
Database update
  ↓
READY
```

Therefore UI should distinguish:

```text
upload complete
```

from:

```text
application operation complete
```

---

# 42. Failure States

A good file UI distinguishes:

```text
selected
uploading
uploaded
processing
ready
failed
cancelled
```

rather than:

```text
loading = true/false
```

This follows the same state-modeling principle from Part 03.

---

# 43. File Form State

A conceptual model:

```ts
type FileUploadState = {
  file: File;
  status:
    | "selected"
    | "uploading"
    | "uploaded"
    | "processing"
    | "ready"
    | "failed";
  progress: number;
  error?: string;
  fileId?: string;
};
```

The exact implementation may differ, but the important point is:

> **File state has multiple independent dimensions.**

---

# 44. Multiple Files

For:

```text
documents[]
```

each file should usually have independent lifecycle state.

Conceptually:

```text
A → uploading 40%
B → ready
C → failed
```

Do not collapse this into:

```text
uploading = true
```

because that loses information.

---

# 45. Partial Failure

Suppose five files are selected:

```text
A ✓
B ✓
C ✗
D ✓
E ✓
```

The system needs to decide whether:

```text
entire submission fails
```

or:

```text
successful files remain
failed file can retry
```

The correct behavior depends on the mutation semantics.

For independent attachments, partial success is often appropriate.

For an atomic business operation, rollback semantics may be required.

---

# 46. Atomicity and File Uploads

Consider creating a legal contract record:

```text
Contract
+
required PDF
```

If:

```text
PDF upload succeeds
```

but:

```text
database record creation fails
```

you may have an orphaned object.

Conversely:

```text
database record created
```

but:

```text
file upload fails
```

creates an incomplete application state.

Therefore systems need explicit coordination.

---

# 47. Orphaned Objects

An orphaned object is:

```text
object storage contains file
```

but:

```text
application database has no valid reference
```

These can accumulate due to:

* cancelled uploads
* failed transactions
* abandoned forms
* retries
* user navigation
* processing failures

Possible solutions include:

```text
pending upload records
+
cleanup jobs
+
retention windows
+
reconciliation processes
```

---

# 48. Database Record First vs File First

Two common workflows:

### File first

```text
upload object
    ↓
create database record
```

Risk:

```text
database failure
→ orphaned object
```

### Database intent first

```text
create pending record
    ↓
upload object
    ↓
mark ready
```

Risk:

```text
upload never completes
→ pending record
```

The second model often provides better lifecycle visibility because the application can track incomplete operations.

---

# 49. Cleanup Is Part of Architecture

A production upload system should answer:

> **What happens to abandoned or failed files?**

Possible mechanism:

```text
pending
   ↓
expires after N hours
   ↓
cleanup job
   ↓
remove object
```

This prevents storage leaks.

A cleanup process should be designed as part of the initial architecture rather than added after storage costs become a problem.

---

# 50. File Upload and Server Action Result

A Server Action might conceptually return:

```ts
{
  success: true,
  fileId: "file_123"
}
```

or:

```ts
{
  success: false,
  errors: {
    file: ["File is too large"]
  }
}
```

The form can then reconcile:

```text
draft
+
server result
```

using the state architecture established earlier.

---

# 51. Validation Error Taxonomy

File validation errors might include:

```text
FILE_REQUIRED
FILE_TOO_LARGE
FILE_TYPE_NOT_ALLOWED
FILE_COUNT_EXCEEDED
FILE_CORRUPTED
UPLOAD_FAILED
PROCESSING_FAILED
UNAUTHORIZED
```

Structured error codes are often preferable internally to arbitrary strings.

The UI can map them to appropriate messages.

---

# 52. Do Not Leak Infrastructure Details

Avoid exposing:

```text
S3 bucket name
internal object key
scanner infrastructure
storage provider errors
database errors
```

to users.

Instead return:

```text
"The file could not be uploaded. Please try again."
```

while logging the technical failure internally.

---

# 53. Accessibility

A file-upload component needs:

* an accessible label
* clear allowed-file guidance
* keyboard accessibility
* visible error messaging
* upload progress where appropriate
* status announcements for important state changes
* meaningful remove/retry controls

Avoid:

```text
click this decorative div
```

when a native file input can provide the core interaction.

---

# 54. Drag and Drop

Drag-and-drop can improve UX:

```text
┌──────────────────────────────┐
│                              │
│      Drop files here         │
│                              │
│      or Browse               │
│                              │
└──────────────────────────────┘
```

But it should generally complement, not replace, a conventional file-selection mechanism.

The application should still support:

```text
keyboard
screen readers
native file chooser
```

where applicable.

---

# 55. Client Preview

For images, the browser can often generate a local preview before upload.

Conceptually:

```text
File
 ↓
local object URL
 ↓
preview
```

This improves perceived responsiveness.

But the preview is:

```text
client-side representation
```

not proof that:

```text
server accepted file
```

---

# 56. Preview vs Persisted Asset

Keep these separate:

```text
local preview
```

and:

```text
server-authoritative asset
```

The UI should transition:

```text
local preview
      ↓
uploading
      ↓
server asset
```

Do not treat a local preview URL as a permanent application URL.

---

# 57. Cancel Semantics

For large uploads, users may cancel.

The architecture should determine:

```text
What does cancellation mean?
```

Possibilities:

```text
stop transfer
+
delete temporary object
```

or:

```text
stop transfer
+
retain resumable upload state
```

Cancellation should also reconcile UI state:

```text
uploading
   ↓
cancelled
```

rather than accidentally becoming:

```text
failed
```

if those states have different meanings.

---

# 58. Resumable Uploads

For large files, an upload may be divided into parts:

```text
File
├── Part 1
├── Part 2
├── Part 3
└── Part N
```

If Part 3 fails:

```text
retry Part 3
```

rather than restarting the entire upload.

This is useful for:

* videos
* large datasets
* backups
* enterprise document archives

It adds significant protocol and state complexity, so it should be introduced only when required.

---

# 59. Upload Architecture Decision Matrix

| Scenario                  | Recommended Direction               | Why                     |
| ------------------------- | ----------------------------------- | ----------------------- |
| Small avatar              | Server-side form mutation           | Simple                  |
| Small document            | Server Action/server endpoint       | Convenient              |
| Multiple moderate files   | Multipart + explicit upload state   | Manageable              |
| Large video               | Direct object storage               | Avoid server bottleneck |
| Very large file           | Resumable multipart upload          | Failure recovery        |
| Public image              | Object storage + CDN                | Efficient delivery      |
| Private document          | Private storage + authorized access | Security                |
| Sensitive enterprise file | Quarantine + scanning               | Security                |
| Many independent files    | Per-file lifecycle                  | Partial retry           |
| Atomic business operation | Explicit transaction/state machine  | Consistency             |

---

# 60. The Four-Pillar Engineering Decision Model

## Pillar 1 — When to Use

Use a simple multipart form when:

* files are relatively small
* request duration is acceptable
* server infrastructure can handle the payload
* the mutation is tightly coupled to the form

Use direct-to-storage when:

* files are large
* upload duration is significant
* traffic is high
* application servers should not proxy binary data

---

## Pillar 2 — When Not to Use

Do not build:

```text
direct-to-storage
+
resumable uploads
+
background processing
```

for:

```text
tiny avatar upload
```

unless the broader infrastructure already requires it.

Architecture should match the workload.

---

## Pillar 3 — Bottlenecks and Tradeoffs

Server-proxied upload:

```text
Browser
 ↓
App Server
 ↓
Storage
```

Advantages:

* simple authorization
* simple implementation
* centralized processing

Disadvantages:

* server bandwidth
* request duration
* scaling pressure

Direct upload:

```text
Browser
 ↓
Storage
```

Advantages:

* scalable
* efficient for large files

Disadvantages:

* more complex authorization
* upload-intent lifecycle
* reconciliation
* cleanup

---

## Pillar 4 — Modern Alternatives

Depending on scale:

```text
Multipart form
Server Action
API endpoint
Signed upload
Direct object storage
Resumable upload
Background processing
Event-driven processing
```

Choose the smallest architecture that satisfies the real requirements.

---

# 61. Production Mental Model

Think of a file as:

```text
                    FILE
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
       CONTENT               METADATA
          │                     │
          ↓                     ↓
   Object Storage          Application DB
          │                     │
          └──────────┬──────────┘
                     ↓
               DOMAIN STATE
```

The binary content is not the entire application's representation of the file.

---

# 62. SDE-2 Interview Questions

### Q1. Why isn't `accept="image/*"` sufficient for security?

Because it is primarily a client-side selection hint.

A malicious client can bypass the browser and submit arbitrary content.

---

### Q2. Why shouldn't you use the original filename as the storage key?

Because filenames are untrusted input and can create:

* collisions
* path traversal risks
* unsafe characters
* unpredictable storage behavior

Use server-controlled identifiers for storage identity.

---

### Q3. When would you use direct-to-object-storage uploads?

When files are large or upload volume makes application-server proxying inefficient.

The application authorizes the upload, then the browser sends the binary directly to storage.

---

### Q4. Why can a successful upload still leave an inconsistent application?

Because:

```text
storage
```

and:

Moody
database
```

are separate systems.

One operation can succeed while the other fails.

---

### Q5. Why isn't 100% upload progress equivalent to "file ready"?

Because transfer completion may be followed by:

```text
scanning
processing
thumbnail generation
metadata persistence
```

The application may not consider the file ready until those operations complete.

---

### Q6. How would you handle abandoned uploads?

Track upload lifecycle explicitly and use expiration/cleanup processes to remove incomplete objects and records.

---

# 63. Prediction Challenge #1

A user uploads:

```text
photo.jpg
```

The browser reports:

```text
image/jpeg
```

The file is actually an executable renamed to `.jpg`.

Should the server accept it?

<details>
<summary>Solution</summary>

Not based solely on the filename or browser-reported MIME type.

The server should apply appropriate content validation based on the application's security requirements.

</details>

---

# 64. Prediction Challenge #2

A 500 MB video is uploaded through the application server.

Traffic increases from:

```text
10 uploads/day
```

to:

```text
10,000 uploads/day
```

What architectural bottleneck is likely?

<details>
<summary>Solution</summary>

The application servers become a binary-transfer bottleneck.

Direct-to-object-storage uploads can remove much of that traffic from the application server path.

</details>

---

# 65. Prediction Challenge #3

The object upload succeeds.

Then the database transaction fails.

What remains?

<details>
<summary>Solution</summary>

Potentially an orphaned object in storage.

A robust architecture needs lifecycle tracking and cleanup/reconciliation mechanisms.

</details>

---

# 66. Prediction Challenge #4

Five files are uploaded:

```text
A ✓
B ✓
C ✗
D ✓
E ✓
```

Should the entire form necessarily fail?

<details>
<summary>Solution</summary>

Not necessarily.

The correct behavior depends on domain semantics.

Independent attachments can often support partial success and retry.

An atomic business operation may require all-or-nothing semantics.

</details>

---

# 67. Prediction Challenge #5

Upload progress reaches:

```text
100%
```

but the server still shows:

```text
processing
```

Is the UI wrong?

<details>
<summary>Solution</summary>

No.

Transport completion and application readiness are different states.

The file may still require:

```text
virus scanning
processing
thumbnail generation
metadata persistence
```

before becoming ready.

</details>

---

# 68. Debugging Checklist

When a file upload fails, inspect in this order:

```text
1. Was a file actually selected?
2. Is the input's name correct?
3. Is multipart encoding correct?
4. Does FormData contain the file?
5. What is the actual File size?
6. What type does the server receive?
7. Did server-side size validation pass?
8. Did content/type validation pass?
9. Did authentication succeed?
10. Did resource authorization succeed?
11. Did storage upload succeed?
12. Did metadata persistence succeed?
13. Did post-processing succeed?
14. Did the UI reconcile the server result?
15. Is cleanup required after partial failure?
```

This prevents debugging only the React component when the actual failure is in storage or persistence.

---

# 69. Common Mistakes

## Mistake 1 — Trusting `accept`

It is not authorization or security.

---

## Mistake 2 — Trusting filename extensions

A filename does not prove content.

---

## Mistake 3 — Using original filenames as storage keys

Use server-controlled storage identity.

---

## Mistake 4 — Proxying huge files through application servers

For large-scale uploads, direct-to-storage architectures are often more appropriate.

---

## Mistake 5 — Treating upload completion as application completion

Post-upload processing may still remain.

---

## Mistake 6 — Ignoring orphaned files

Failed workflows can leave storage objects without valid references.

---

## Mistake 7 — Using one global loading flag

Multiple files have independent lifecycle states.

---

## Mistake 8 — Assuming database and object storage are one transaction

They are usually separate systems and require explicit consistency handling.

---

# 70. Senior Architecture Checklist

Before shipping a production upload feature, ask:

### Transport

* [ ] Is multipart encoding correct?
* [ ] Is the payload size appropriate?
* [ ] Is server proxying necessary?

### Validation

* [ ] Maximum file size?
* [ ] Maximum file count?
* [ ] Allowed types?
* [ ] Content inspection?
* [ ] Processing limits?

### Security

* [ ] Authentication?
* [ ] Resource authorization?
* [ ] Private/public storage?
* [ ] Malware scanning where required?
* [ ] Safe storage keys?
* [ ] No client-controlled paths?

### Persistence

* [ ] File metadata model?
* [ ] Storage identity?
* [ ] Upload status?
* [ ] Failure handling?
* [ ] Cleanup?

### UX

* [ ] Progress?
* [ ] Retry?
* [ ] Cancel?
* [ ] Partial failure?
* [ ] Accessible errors?
* [ ] Preview semantics?

### Reliability

* [ ] Idempotency?
* [ ] Retry behavior?
* [ ] Timeout behavior?
* [ ] Orphan reconciliation?
* [ ] Large-file strategy?

---

# 71. Final Mental Model

A senior frontend engineer should not think:

> "I need an `<input type=file>`."

They should think:

```text
User
 ↓
Select File
 ↓
Client Validation
 ↓
Upload Intent / Mutation
 ↓
Authentication
 ↓
Authorization
 ↓
Server Validation
 ↓
Transport
 ↓
Object Storage
 ↓
Metadata
 ↓
Processing
 ↓
Ready
 ↓
UI Reconciliation
```

And remember:

```text
filename
    ≠
file identity

extension
    ≠
file type

MIME metadata
    ≠
trusted content

upload complete
    ≠
application ready

storage object
    ≠
database record

client validation
    ≠
server validation

upload permission
    ≠
file access permission
```

The fundamental principle is:

> **A file upload is a distributed state transition involving untrusted binary input, authorization, storage, persistence, and potentially asynchronous processing.**

That is why file uploads deserve their own architecture rather than being treated as "just another form field."

---

# 72. Part Boundary

This Part covered:

* file inputs
* multipart form transport
* `FormData`
* `File`
* client vs server validation
* size/count constraints
* filename safety
* storage identity
* metadata vs binary content
* object storage
* Server Actions for appropriate small uploads
* direct-to-storage architecture
* signed upload capabilities
* upload authorization
* private/public files
* multi-tenant isolation
* malware scanning
* image processing
* upload progress
* multiple-file state
* partial failure
* idempotency
* retries
* orphaned objects
* cleanup
* accessibility
* resumable uploads
* production architecture decisions

It intentionally does **not** deeply cover:

* multi-step/wizard forms
* autosave and draft persistence
* complex workflow state
* general form-library implementation

Those remain separate parts.

**Part 05 is complete.**
