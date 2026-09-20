# Level 08 — KPI 10 — Part 08

## Image Security, Remote Sources & Abuse Prevention

---

# 1. Part Objective

Image optimization is not only a performance problem.

Once an application accepts images from:

* remote domains
* users
* third-party systems
* CMS platforms
* tenant-controlled sources
* dynamically generated URLs

the image pipeline becomes a **security-sensitive resource delivery system**.

The core question is:

> **How do you allow useful image sources and transformations without allowing the image system to become an SSRF, abuse, data-leakage, bandwidth-exhaustion, or cross-tenant security boundary failure?**

The architecture must protect:

```text
Remote Fetching
Image Transformation
CDN Delivery
Authorization
Tenant Isolation
Resource Consumption
Content Integrity
```

The central model is:

```text
User / CMS / Application
        ↓
Image Source
        ↓
Source Validation
        ↓
Authorization / Trust Boundary
        ↓
Image Fetch / Transformation
        ↓
Caching
        ↓
CDN Delivery
        ↓
Browser
```

---

# 2. The Fundamental Security Mental Model

An image URL may look like ordinary content:

```text
https://cdn.example.com/photo.jpg
```

but if the server or image optimizer fetches that URL, the URL becomes an instruction to perform a network request.

Therefore:

```text
remote image URL
=
potential server-side network operation
```

This changes the security model.

A frontend engineer must distinguish:

```text
browser fetch
```

from:

```text
server-side image fetch
```

because the latter introduces server-side trust and network-security concerns.

---

# 3. Browser Fetch vs Server Fetch

Consider:

```text
<img src="https://external.example/image.jpg">
```

The browser requests the resource.

The server does not necessarily fetch it.

Now consider an image optimization system that receives:

```text
/image-proxy?url=https://external.example/image.jpg
```

The server may perform:

```text
Server
  ↓
external.example
```

That means the image optimizer becomes a network client.

This distinction is fundamental.

---

# 4. The Image Optimizer as a Trust Boundary

A remote image optimization service may perform:

```text
URL parsing
DNS resolution
HTTP connection
redirect handling
content download
image decoding
image transformation
cache storage
response delivery
```

Each operation introduces potential attack surface.

Therefore:

```text
Image Optimizer
=
performance infrastructure
+
security-sensitive network service
```

---

# 5. SSRF Risk

One of the most important risks is **Server-Side Request Forgery (SSRF)**.

An attacker may attempt to cause the image service to request an internal resource.

Conceptually:

```text
Attacker
   ↓
malicious image URL
   ↓
Image optimizer
   ↓
Internal network
```

The attacker may try to reach:

```text
localhost
private IP ranges
internal services
cloud metadata endpoints
administrative interfaces
```

The exact exploit depends on infrastructure, but the architectural problem is general:

> **A server-side URL fetcher must not treat arbitrary user-controlled URLs as trusted network destinations.**

---

# 6. Remote Source Allowlisting

A safer architecture begins with explicit source policy.

Instead of:

```text
accept any URL
```

use:

```text
accepted image sources
=
approved domains / patterns
```

For example:

```text
cdn.example.com
images.partner.example
media.example.org
```

The principle is:

```text
remote image source
→
trusted-source policy
→
fetch
```

rather than:

```text
remote image source
→
blind fetch
```

---

# 7. Why Domain Validation Alone Can Be Insufficient

A naive check might be:

```text
URL hostname endsWith("example.com")
```

This can be dangerous if implemented incorrectly.

For example:

```text
attacker-example.com
```

might accidentally satisfy a poorly designed suffix check.

Validation must operate on parsed URL components and exact trust rules.

Conceptually:

```text
Parse URL
   ↓
Validate protocol
   ↓
Validate hostname
   ↓
Validate port
   ↓
Validate path/policy
   ↓
Fetch
```

---

# 8. Protocol Restrictions

An image pipeline should generally define which protocols are acceptable.

The security boundary should not simply accept arbitrary schemes.

The application should explicitly determine:

```text
Allowed protocol
Allowed hostname
Allowed port
Allowed path
```

The important principle is:

> **Input validation should be based on an explicit allowlist rather than accepting whatever URL representation happens to parse.**

---

# 9. Redirect Security

Even if the initial URL is trusted:

```text
https://trusted.example/image.jpg
```

the server may receive:

```text
302 → https://untrusted.example/image.jpg
```

Therefore remote fetching must consider redirect behavior.

The effective destination is not necessarily the initial destination.

Architecture:

```text
Initial URL
    ↓
Redirect
    ↓
Final URL
```

The system must decide whether redirects are:

```text
allowed
restricted
revalidated
disabled
```

---

# 10. Redirect Revalidation

A particularly important rule is:

```text
trusted initial host
≠
automatically trusted final host
```

If redirects are allowed, the destination should continue to satisfy the source security policy.

Otherwise:

```text
trusted.example
       ↓
attacker.example
```

could bypass the initial hostname restriction.

---

# 11. Private Network Access

An image service should be careful about fetching resources from private or internal network locations.

Conceptually:

```text
Public Internet
      ↓
Image Fetcher
      ↓
Private Network
```

can create an unintended bridge.

The system should establish explicit network egress policy.

This is an infrastructure concern as much as an application concern.

---

# 12. DNS Rebinding Considerations

Hostname validation and network destination validation can become complicated when DNS is involved.

Conceptually:

```text
trusted.example
      ↓
DNS resolution
      ↓
IP address
```

The security decision should not assume that a hostname's meaning is permanently fixed.

Production systems may need controls around:

```text
DNS resolution
private IP ranges
redirects
connection establishment
network egress
```

The exact implementation depends on the image service and infrastructure.

---

# 13. Resource Exhaustion

Security is not only about unauthorized access.

An attacker may attempt to consume:

```text
CPU
Memory
Bandwidth
Storage
Transformation capacity
Connection pools
CDN capacity
```

For example:

```text
Attacker
  ↓
millions of unique image URLs
  ↓
cache misses
  ↓
image transformations
  ↓
origin CPU exhaustion
```

This is an image-specific denial-of-service pattern.

---

# 14. Transformation Abuse

Suppose an image endpoint supports:

```text
width
height
quality
format
crop
fit
```

An attacker may generate many unique combinations:

```text
width=101
width=102
width=103
...
```

or:

```text
quality=1
quality=2
quality=3
...
```

Each combination can create a distinct transformation.

Therefore:

```text
transformation flexibility
↑
cache cardinality
↑
compute cost
```

---

# 15. Constrain Transformation Parameters

Production systems should define supported transformation values.

For example:

```text
Allowed widths:
320
640
768
1024
1280
1536
1920
```

rather than accepting every integer.

Similarly:

```text
Allowed quality profiles:
low
medium
high
```

may be preferable to:

```text
quality=0...100
```

when the application does not need arbitrary quality control.

---

# 16. Transformation Identity

A transformed image can be modeled as:

```text
Representation =
(
  source,
  width,
  height,
  format,
  quality,
  crop,
  version
)
```

Every additional dimension can multiply the number of possible cached representations.

Therefore:

```text
variant dimensions
→
cache cardinality
```

This is both a performance and security consideration.

---

# 17. Cache Cardinality as an Attack Surface

Suppose:

```text
1 source image
×
1000 widths
×
100 formats
×
100 qualities
```

creates a huge theoretical representation space.

Even if most combinations are never used, an attacker can intentionally request unusual variants.

The result can be:

```text
cache fragmentation
+
transformation work
+
storage growth
+
origin load
```

Therefore transformation APIs should expose only necessary dimensions.

---

# 18. Cache Key Poisoning

An image system must ensure that the cache key accurately represents the response.

Suppose:

```text
same cache key
```

can produce different responses based on:

```text
authentication
tenant
locale
format negotiation
authorization
```

then one user may receive content generated for another context.

This is a severe correctness and security failure.

The invariant is:

```text
same cache key
→
same representation semantics
```

---

# 19. Tenant Isolation

Consider a multi-tenant application:

```text
tenant-a.example
tenant-b.example
```

Both request:

```text
/image?id=123
```

If the cache key is only:

```text
id=123
```

then the cache may accidentally share representations between tenants.

A safer model may include:

```text
tenant identity
+
asset identity
+
representation identity
```

when tenant context actually affects the response.

---

# 20. Cross-Tenant Leakage

A dangerous flow:

```text
Tenant A
  ↓
image request
  ↓
cache
  ↓
Tenant B
  ↓
same cache key
```

Potential result:

```text
Tenant B receives Tenant A's asset
```

This is not merely a cache bug.

It is a data-isolation failure.

Therefore:

```text
cache architecture
=
security architecture
```

when protected or tenant-specific content is involved.

---

# 21. Public vs Private Images

Not every image should be treated as public.

Useful classifications include:

```text
Public
Authenticated
Tenant-private
User-private
Temporary
Sensitive
```

The delivery architecture should know which class applies.

For example:

```text
public marketing image
```

can generally use aggressive shared caching.

A:

```text
private user document preview
```

requires a very different security model.

---

# 22. Authentication Does Not Automatically Make an Image Safe

A common mistake is:

```text
request requires authentication
→
therefore cache is safe
```

Not necessarily.

If an authenticated image response is stored in a shared cache without proper cache isolation, another authenticated user could potentially receive it.

The important distinction is:

```text
authentication
≠
cache isolation
```

---

# 23. Personalized Images

Consider:

```text
/avatar/current
```

where the response depends on:

```text
user identity
```

A shared cache must not accidentally serve:

```text
User A avatar
```

to:

```text
User B
```

The cache key and caching policy must reflect the response's privacy model.

---

# 24. Authorization Before Transformation

A secure flow for private images is often conceptually:

```text
Request
  ↓
Authenticate
  ↓
Authorize asset access
  ↓
Resolve source
  ↓
Transform
  ↓
Deliver
```

not:

```text
Request
  ↓
Transform public-looking URL
  ↓
Authorize later
```

Authorization must protect access to the underlying resource.

---

# 25. Signed URLs

For private or controlled image delivery, systems may use signed URLs.

Conceptually:

```text
asset
+
expiration
+
policy
+
signature
```

produces:

```text
temporary authorized URL
```

The server or CDN verifies:

```text
signature valid?
not expired?
resource allowed?
transformation allowed?
```

This allows controlled delivery without exposing permanent authorization credentials.

---

# 26. Signed URL Design

A signature may conceptually cover:

```text
path
expiry
transformation parameters
tenant
resource ID
```

This matters because otherwise an attacker might take a valid signed URL and alter:

```text
width
format
resource
tenant
```

without invalidating the signature.

The security invariant is:

```text
authorization covers the representation being requested
```

---

# 27. Expiration

Temporary image URLs should have explicit lifetime semantics.

For example:

```text
issued:
12:00

expires:
13:00
```

After expiration:

```text
request
→
authorization failure
```

The appropriate duration depends on:

```text
security sensitivity
user experience
caching strategy
sharing requirements
```

---

# 28. Signed URLs and Caching

Signed URLs create an architectural interaction with caching.

Suppose every URL contains:

```text
timestamp
signature
```

Then:

```text
same image
→
many URLs
→
many cache keys
```

This can reduce cache reuse.

Therefore secure delivery must balance:

```text
authorization
+
URL stability
+
cache efficiency
```

---

# 29. Do Not Put Sensitive Data in Image URLs

URLs can appear in:

```text
browser history
logs
analytics
referrer data
CDN logs
monitoring systems
```

Therefore sensitive information should not casually be encoded into image URLs.

Avoid putting secrets directly into query parameters.

For example, an authorization design should avoid treating:

```text
?token=long-lived-secret
```

as a harmless image parameter.

---

# 30. Origin Protection

An image CDN should protect the origin from direct abuse where appropriate.

Conceptually:

```text
Internet
   ↓
CDN
   ↓
Image Origin
```

The goal may be:

```text
public users → CDN
```

rather than:

```text
public users → origin directly
```

This improves:

```text
security
+
origin protection
+
traffic control
```

---

# 31. Origin Access Controls

Depending on architecture, the origin may accept requests only from:

```text
trusted CDN
private network
specific service identity
authenticated backend
```

This reduces bypass opportunities.

Otherwise an attacker might bypass:

```text
CDN rate limits
WAF
authentication
caching policy
```

by calling the origin directly.

---

# 32. Rate Limiting

Image endpoints are attractive abuse targets because they can consume substantial resources.

Rate limiting may be applied at several layers:

```text
Edge
 ↓
API
 ↓
Image optimizer
 ↓
Origin
```

Possible dimensions include:

```text
IP
user
tenant
API key
asset
endpoint
transformation profile
```

---

# 33. Rate Limiting Alone Is Not Enough

Suppose an attacker rotates IP addresses.

IP-based rate limiting alone may be ineffective.

A more complete strategy may combine:

```text
IP limits
+
identity limits
+
tenant limits
+
request complexity limits
+
cache controls
+
origin protection
```

Security is a system, not one middleware check.

---

# 34. Request Complexity Limits

A useful concept for transformation APIs is:

```text
request cost
```

For example:

```text
4000 × 4000 AVIF conversion
```

may be substantially more expensive than:

```text
320 × 320 JPEG
```

A system can therefore classify transformations by computational cost.

Conceptually:

```text
cheap
medium
expensive
```

and enforce policies accordingly.

---

# 35. Pixel Bomb / Decompression Risk

An image can have relatively small compressed size but expand into a huge in-memory representation when decoded.

Conceptually:

```text
small compressed file
       ↓
decode
       ↓
massive pixel buffer
```

This can create:

```text
memory exhaustion
CPU exhaustion
```

Therefore secure image processing should impose limits on:

```text
maximum dimensions
maximum decoded pixels
maximum file size
maximum processing time
```

---

# 36. File Size Limits

Upload pipelines should not assume:

```text
"image"
=
safe file
```

A production upload service may enforce:

```text
maximum compressed bytes
maximum dimensions
maximum pixel count
allowed formats
maximum animation complexity
```

These constraints protect downstream processors.

---

# 37. MIME Type Validation

A request may claim:

```text
Content-Type: image/jpeg
```

but the actual content may not be JPEG.

Therefore security-sensitive systems should distinguish:

```text
declared MIME type
```

from:

```text
actual file characteristics
```

Where appropriate, content inspection should validate that the file is compatible with the processing pipeline.

---

# 38. File Extension Is Not Trust

This is unsafe as a security boundary:

```text
filename.endsWith(".jpg")
```

An extension is metadata supplied by the client.

Security decisions should be based on validated content and controlled processing.

---

# 39. SVG Security

SVG deserves special treatment because it is not merely a raster image.

SVG can contain:

```text
XML structure
links
metadata
scripts in some contexts
external references
```

The security policy should determine whether SVG is:

```text
allowed
sanitized
restricted
converted
served with appropriate headers
```

Do not assume:

```text
.svg
=
harmless static bitmap
```

It is a different content type with a different threat model.

---

# 40. User-Uploaded SVG

A particularly sensitive architecture is:

```text
User
 ↓
uploads SVG
 ↓
application
 ↓
serves SVG
```

If the application does not safely handle SVG, user-controlled markup may create security problems.

Therefore a system may choose to:

```text
reject SVG
```

or:

```text
sanitize SVG
```

or:

```text
rasterize SVG
```

depending on requirements.

---

# 41. Content Security Policy

When image content can come from multiple sources, the application should define explicit content-loading policy.

Conceptually:

```text
Browser
  ↓
Content Security Policy
  ↓
approved image sources
```

This can reduce unintended resource loading.

The exact policy depends on application architecture.

---

# 42. Remote Image Source Governance

A mature system should maintain a source registry.

Conceptually:

```text
ImageSourceRegistry
├── hostname
├── protocol
├── trust level
├── allowed paths
├── tenant scope
├── transformation policy
└── expiration/review metadata
```

This is stronger than scattering domain strings throughout application code.

---

# 43. Multi-Tenant Remote Sources

Imagine:

```text
Tenant A → partner-a.example
Tenant B → partner-b.example
```

The system should ensure:

```text
Tenant A cannot arbitrarily configure
Tenant B's trusted source policy.
```

Therefore tenant configuration itself becomes security-sensitive data.

The architecture must validate:

```text
tenant ownership
+
source authorization
+
domain policy
```

---

# 44. Custom Domains

Custom domains create another trust challenge.

Suppose a tenant configures:

```text
images.tenant-custom-domain.com
```

The platform should not automatically assume every tenant-controlled domain is safe to use as a server-side fetch target.

Domain ownership and source policy may need explicit verification.

---

# 45. Image Proxy Abuse

A generic endpoint such as:

```text
/image-proxy?url=...
```

can accidentally become a general-purpose HTTP proxy.

That is dangerous.

A secure image proxy should remain constrained to:

```text
approved image sources
approved transformations
approved protocols
approved content types
```

The endpoint should not become:

```text
arbitrary URL fetcher
```

---

# 46. Cache Poisoning

Suppose an attacker causes:

```text
malicious response
```

to be cached under a key later used by legitimate users.

Potential consequences include:

```text
wrong image
malicious content
cross-user response
```

Therefore cache architecture must validate:

```text
cache key correctness
response content
source trust
variation dimensions
```

before shared caching.

---

# 47. Content-Type Safety

The delivery system should ensure that the response is served with an appropriate content type.

For example:

```text
JPEG → image/jpeg
PNG → image/png
WebP → image/webp
AVIF → image/avif
```

A server should not blindly preserve attacker-controlled content types when they can alter browser interpretation.

---

# 48. Content-Disposition

For downloadable user-controlled content, response behavior may differ from inline rendering.

The application should intentionally decide whether a resource should be:

```text
inline
downloaded
```

This becomes particularly relevant when serving files that may contain active or unexpected content.

---

# 49. Authorization and Cache Layers

The complete security model should be:

```text
                 REQUEST
                    │
                    ▼
             Authentication
                    │
                    ▼
              Authorization
                    │
                    ▼
             Source Resolution
                    │
                    ▼
          Transformation Policy
                    │
                    ▼
               Cache Policy
                    │
                    ▼
               CDN Delivery
```

The important principle is:

> **A cache must not silently bypass the authorization model.**

---

# 50. Public Image Architecture

For public images:

```text
User
 ↓
CDN
 ↓
Cache
 ↓
Image Origin
```

Typical characteristics:

```text
shared cache
long TTL
versioned URLs
broad geographic distribution
high origin offload
```

Security focus:

```text
source integrity
abuse prevention
cache poisoning
origin protection
```

---

# 51. Private Image Architecture

For private images:

```text
User
 ↓
Authentication
 ↓
Authorization
 ↓
Signed/controlled delivery
 ↓
Private CDN/object storage
```

The system must preserve:

```text
identity
+
resource authorization
+
cache isolation
```

Private content should not accidentally become a shared public representation.

---

# 52. Temporary Image Architecture

For temporary images:

```text
Upload
 ↓
processing
 ↓
temporary storage
 ↓
signed URL
 ↓
expiration
 ↓
deletion
```

This is useful for:

```text
previews
exports
temporary uploads
verification documents
generated assets
```

The lifecycle should be explicit.

---

# 53. Image Security Lifecycle

A production image can move through:

```text
Upload
  ↓
Validation
  ↓
Scanning / inspection
  ↓
Transformation
  ↓
Storage
  ↓
Authorization
  ↓
CDN delivery
  ↓
Expiration / deletion
```

Each stage has different security responsibilities.

---

# 54. Threat Model

A useful threat model is:

| Threat                 | Primary control                          |
| ---------------------- | ---------------------------------------- |
| SSRF                   | Source allowlist + network egress policy |
| Open proxy abuse       | Restrict remote sources                  |
| Cache poisoning        | Correct cache identity                   |
| Cross-tenant leakage   | Tenant-aware authorization/cache         |
| Resource exhaustion    | Limits + rate limiting                   |
| Huge image decode      | Pixel/dimension limits                   |
| Malicious SVG          | Sanitize/restrict/rasterize              |
| Origin bypass          | CDN/origin access control                |
| URL abuse              | Validation + signed policies             |
| Cache explosion        | Constrained transformations              |
| Private image exposure | Authorization + private caching          |
| Bandwidth abuse        | Rate limiting + CDN                      |
| Stale authorization    | Expiring/signed delivery                 |

---

# 55. Security and Performance Are Interdependent

Many image security controls also improve performance.

For example:

```text
constrained widths
```

reduces:

```text
cache cardinality
+
transformation cost
+
attack surface
```

Similarly:

```text
CDN
```

provides:

```text
origin offload
+
traffic absorption
+
centralized controls
```

Therefore:

```text
security architecture
↔
performance architecture
```

should not be designed independently.

---

# 56. Four-Pillar Engineering Matrix

## Pillar 1 — Correctness

Ask:

* Is the source actually an image?
* Is the requested representation authorized?
* Is the cache key correct?
* Is tenant identity preserved?
* Are redirects validated?
* Are transformations deterministic?

---

## Pillar 2 — Performance

Ask:

* Are transformations bounded?
* Is CDN caching effective?
* Can attackers generate unlimited variants?
* Is origin load protected?
* Are hot objects handled efficiently?

---

## Pillar 3 — Maintainability

Ask:

* Are remote sources centrally governed?
* Are transformation limits centralized?
* Is security policy explicit?
* Are private/public image classes documented?
* Are signed URL rules standardized?

---

## Pillar 4 — Scalability

Ask:

* Can millions of image requests be handled?
* Can many tenants safely configure sources?
* Can global traffic be absorbed by the CDN?
* Can abuse be isolated?
* Can origin infrastructure survive cache misses?

---

# 57. Production Architecture

A mature image security system can look like:

```text
                    USER
                      │
                      ▼
               CDN / EDGE
                      │
              ┌───────┴───────┐
              │               │
              ▼               ▼
         Public Image     Authenticated
           Policy           Policy
              │               │
              └───────┬───────┘
                      ▼
              Image Gateway
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
   Rate Limit     Authorization   Source Policy
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              Transformation
                      │
                      ▼
                Cache / CDN
                      │
                      ▼
                  Origin
```

---

# 58. Production Failure Scenarios

## Failure 1 — Arbitrary Remote URL

A developer exposes:

```text
/image?url=<anything>
```

Result:

```text
server becomes generic URL fetcher
```

Lesson:

```text
remote image proxy
≠
generic proxy
```

---

## Failure 2 — Cross-Tenant Cache

Two tenants request:

```text
/image?id=42
```

Cache key ignores tenant.

Result:

```text
tenant leakage
```

Lesson:

```text
cache identity must reflect security identity
```

when the response varies by tenant.

---

## Failure 3 — Redirect Bypass

Trusted URL:

```text
trusted.example/image
```

redirects to:

```text
attacker.example/payload
```

Initial hostname passes validation.

Final destination does not.

Lesson:

```text
redirect chain is part of the trust boundary
```

---

## Failure 4 — Transformation Explosion

An attacker requests thousands of unique:

```text
width
quality
crop
```

combinations.

Result:

```text
cache fragmentation
+
CPU exhaustion
```

Lesson:

```text
transformation API must be bounded
```

---

## Failure 5 — Private Image Cached Publicly

An authenticated endpoint returns:

```text
User A private image
```

but shared CDN caching ignores authorization.

Result:

```text
privacy breach
```

Lesson:

```text
authentication
≠
safe shared caching
```

---

## Failure 6 — Malicious SVG

User uploads SVG containing unsafe content.

Application serves it directly.

Result:

```text
unexpected active content
```

Lesson:

```text
SVG requires its own security policy
```

---

# 59. Senior Prediction Challenges

### Challenge 1

A remote image optimizer accepts any HTTPS URL.

Is HTTPS sufficient?

**Expected reasoning:**

No.

HTTPS protects transport but does not establish that the destination is trustworthy or that the server should be allowed to access it.

---

### Challenge 2

A trusted image URL redirects to an internal address.

Should the original hostname being trusted be enough?

**Expected reasoning:**

No. Redirect destinations remain part of the server-side fetch trust boundary.

---

### Challenge 3

A private image endpoint requires authentication but uses a shared CDN cache.

Is that automatically safe?

**Expected reasoning:**

No. Authorization context must be compatible with the cache model.

---

### Challenge 4

A transformation endpoint allows arbitrary widths.

What security problem can this create?

**Expected reasoning:**

Attackers can generate many unique representations, increasing compute cost, cache cardinality, storage, and origin load.

---

### Challenge 5

Why can a small image file still be dangerous to process?

**Expected reasoning:**

Compressed data can expand into a very large decoded pixel buffer and consume substantial memory/CPU.

---

### Challenge 6

A tenant can configure arbitrary remote image domains.

What should you investigate?

**Expected reasoning:**

Tenant source ownership, server-side fetching, SSRF, DNS, redirects, private networks, and cross-tenant policy isolation.

---

### Challenge 7

Why can signed URLs hurt caching?

**Expected reasoning:**

If every authorization token changes the URL/cache key, the same underlying representation can produce many cache entries.

---

# 60. Senior Interview Questions

### Question 1

> How would you securely implement remote image optimization?

Expected areas:

```text
allowlist
URL parsing
protocol restrictions
redirect validation
network egress controls
resource limits
rate limiting
cache isolation
observability
```

---

### Question 2

> Why is an image proxy potentially an SSRF vulnerability?

Because the server performs a network request based on input supplied by a client.

---

### Question 3

> How do you secure private images behind a CDN?

Discuss:

```text
authentication
authorization
signed URLs/cookies
cache policy
tenant isolation
origin protection
expiration
```

---

### Question 4

> How do you prevent transformation abuse?

Discuss:

```text
bounded dimensions
bounded quality
bounded formats
canonical transformation profiles
rate limits
cost controls
cache strategy
```

---

### Question 5

> How do you prevent cross-tenant image leakage?

Discuss:

```text
tenant-aware resource identity
authorization
tenant-aware cache identity
origin isolation
signed delivery
tests
```

---

### Question 6

> Why is SVG different from JPEG from a security perspective?

Because SVG is structured markup rather than merely decoded raster pixels and can carry additional browser-interpreted capabilities depending on how it is served.

---

# 61. Security Invariants

### Invariant 1

```text
remote URL ≠ trusted destination
```

### Invariant 2

```text
HTTPS ≠ authorization
```

### Invariant 3

```text
trusted initial URL ≠ trusted redirect destination
```

### Invariant 4

```text
authentication ≠ cache isolation
```

### Invariant 5

```text
same cache key → same security-relevant representation
```

### Invariant 6

```text
transformation flexibility → attack surface
```

### Invariant 7

```text
cache cardinality is a security consideration
```

### Invariant 8

```text
compressed size ≠ processing cost
```

### Invariant 9

```text
tenant identity can be part of resource identity
```

### Invariant 10

```text
image proxy ≠ generic HTTP proxy
```

### Invariant 11

```text
private image ≠ publicly cacheable image
```

### Invariant 12

```text
authorization must cover the delivered representation
```

---

# 62. Completion Checklist

You should be able to explain:

### Remote Sources

* [ ] server-side image fetching
* [ ] trusted source allowlists
* [ ] URL parsing
* [ ] protocol restrictions
* [ ] hostname validation
* [ ] redirect validation
* [ ] DNS considerations
* [ ] network egress controls

### Abuse Prevention

* [ ] SSRF
* [ ] proxy abuse
* [ ] transformation abuse
* [ ] cache explosion
* [ ] rate limiting
* [ ] request complexity
* [ ] resource limits

### Private Content

* [ ] public vs private images
* [ ] authentication
* [ ] authorization
* [ ] signed URLs
* [ ] expiration
* [ ] cache isolation
* [ ] tenant isolation

### Image Processing

* [ ] maximum dimensions
* [ ] maximum pixel count
* [ ] file-size limits
* [ ] MIME validation
* [ ] malicious content
* [ ] SVG security

### Infrastructure

* [ ] CDN/origin separation
* [ ] origin protection
* [ ] cache poisoning
* [ ] cache-key security
* [ ] observability
* [ ] failure handling

---

# 63. Final Mental Model

The image pipeline should now be understood as:

```text
                    IMAGE REQUEST
                          │
                          ▼
                  Input Validation
                          │
                          ▼
                Source Trust Policy
                          │
                    ┌─────┴─────┐
                    │           │
                 Public       Private
                    │           │
                    │      Authentication
                    │           │
                    │      Authorization
                    │           │
                    └─────┬─────┘
                          ▼
                Transformation Policy
                          │
                          ▼
                  Resource Limits
                          │
                          ▼
                    Cache Policy
                          │
                          ▼
                         CDN
                          │
                          ▼
                       Origin
```

The senior-level model is:

> **An image optimization system is also a network client, content processor, cache, and resource-consumption surface. Once remote or user-controlled images enter the architecture, security must be designed alongside performance rather than added afterward.**

The key relationship is:

```text
Source Trust
      ↓
Authorization
      ↓
Transformation Bounds
      ↓
Cache Identity
      ↓
Resource Protection
      ↓
Safe Delivery
```

And the most important production invariant is:

```text
The system must never allow image optimization
to bypass the application's security boundaries.
```

**Part 08 complete.**
