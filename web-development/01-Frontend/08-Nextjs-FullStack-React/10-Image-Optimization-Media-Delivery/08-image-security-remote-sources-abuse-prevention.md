# Level 08 — Next.js & Full-Stack React

## KPI 10 — Image Optimization

# Part 08 — Image Security, Remote Sources & Abuse Prevention

---

## 1. Part Objective

Image optimization systems frequently introduce a server-side image-fetching and transformation pipeline:

```text
User Request
    ↓
Image URL
    ↓
Image Optimizer / Proxy
    ↓
Remote Source
    ↓
Fetch
    ↓
Transform
    ↓
Cache
    ↓
Response
```

That architecture creates a security boundary.

The central senior-level question is not:

> “Can we optimize remote images?”

It is:

> **Which image sources are trusted, which requests are allowed, what resources may the image service access, and how do we prevent image processing from becoming an SSRF, resource-exhaustion, data-leakage, or cache-abuse primitive?**

The core model is:

```text
Remote Image Optimization
=
Input Validation
+
Source Trust
+
Network Isolation
+
Resource Limits
+
Content Validation
+
Cache Isolation
+
Abuse Prevention
+
Observability
```

---

# 2. Image Optimization Is a Server-Side Security Boundary

A browser normally fetches:

```text
Browser
   ↓
Image CDN
```

But an image optimization service can instead perform:

```text
Browser
   ↓
Your Image Service
   ↓
Remote URL
```

The server is now making a network request based partly on user-controlled input.

That changes the threat model.

The system must treat:

```text
remote image URL
```

as **untrusted input**.

---

# 3. Remote Image Threat Model

A remote image request can potentially involve:

```text
User-controlled URL
        ↓
Image Optimizer
        ↓
Server-side HTTP client
        ↓
Internet / private network / internal service
```

Potential threats include:

* SSRF
* internal network access
* metadata-service access
* port scanning
* DNS rebinding
* redirect abuse
* excessive downloads
* oversized images
* decompression bombs
* malicious file formats
* malicious SVG content
* cache poisoning
* bandwidth abuse
* transformation CPU exhaustion
* cross-tenant data leakage

Therefore:

```text
image optimization
≠
just media processing
```

It is also:

```text
network security
+
resource security
+
content security
```

---

# 4. SSRF

**Server-Side Request Forgery (SSRF)** occurs when an attacker can cause a server to make a request to an unintended destination.

Conceptually:

```text
Attacker
   ↓
Image URL
   ↓
Image Optimizer
   ↓
Internal Resource
```

Potential targets could include:

```text
localhost
private IP ranges
internal DNS names
cloud metadata endpoints
internal administrative services
```

The dangerous assumption is:

> “It is only an image URL.”

The image service is still a server-side HTTP client.

---

# 5. Why SSRF Is Especially Relevant to Image Optimizers

Suppose an endpoint conceptually accepts:

```text
/image?url=<remote-url>
```

The attacker controls:

```text
<remote-url>
```

If the optimizer blindly performs:

```text
fetch(url)
```

then the optimizer becomes a proxy for arbitrary network access.

The correct architecture is closer to:

```text
Request
  ↓
Parse URL
  ↓
Validate scheme
  ↓
Validate hostname
  ↓
Validate port
  ↓
Resolve DNS
  ↓
Validate resolved address
  ↓
Apply redirect policy
  ↓
Fetch
```

---

# 6. URL Scheme Validation

Do not automatically allow arbitrary schemes.

An image fetcher should generally establish an explicit allowlist of supported schemes.

For example:

```text
Allowed:
https

Potentially allowed depending on architecture:
http
```

Anything outside the intended scheme set should be rejected.

The important principle is:

```text
allowlist
>
blocklist
```

when defining acceptable remote sources.

---

# 7. Host Allowlisting

One strong architecture is to permit only known image hosts.

For example:

```text
images.example.com
cdn.example.com
media.partner.com
```

Conceptually:

```text
Remote Host
    ↓
Allowed?
 ┌──┴──┐
YES    NO
 ↓      ↓
Fetch  Reject
```

This dramatically reduces the SSRF attack surface.

A broad policy such as:

```text
any HTTPS URL
```

creates a much larger security boundary.

---

# 8. Hostname Validation Is Not Enough

Checking the hostname string alone may not be sufficient.

Consider:

```text
attacker.example
```

resolving to:

```text
private IP
```

or a hostname whose DNS result changes after validation.

Therefore the system may need to validate:

```text
hostname
+
DNS resolution
+
resolved IP
```

The security decision must apply to the actual network destination.

---

# 9. Private and Loopback Addresses

Image fetchers should generally prevent access to unintended internal address ranges.

Examples of sensitive destinations include:

```text
127.0.0.1
localhost
private RFC1918 ranges
link-local addresses
internal service ranges
cloud metadata endpoints
```

The exact blocked ranges depend on the network architecture.

The principle is:

```text
public image fetcher
→
should not become internal network proxy.
```

---

# 10. DNS Rebinding

A more sophisticated attack involves changing DNS resolution.

Conceptually:

```text
Step 1
attacker-domain.com
→ public IP

Step 2
validation passes

Step 3
DNS changes
→ private IP

Step 4
server connects
→ internal resource
```

Therefore security cannot always depend on a single superficial hostname check.

A production design must consider:

```text
DNS resolution
+
connection destination
+
redirect behavior
+
network isolation
```

---

# 11. Redirect Abuse

Suppose:

```text
Allowed URL
   ↓
302 redirect
   ↓
Internal URL
```

If the optimizer follows redirects blindly, an apparently valid initial URL can lead to an unintended destination.

Therefore redirect handling must be part of the trust model.

Possible policies include:

```text
no redirects
```

or:

```text
limited redirects
+
revalidate every destination
```

The key invariant is:

```text
trusted initial URL
≠
automatically trusted redirect target
```

---

# 12. Port Restrictions

A URL can specify a port:

```text
https://example.com:8443/image.jpg
```

If arbitrary ports are allowed, the optimizer may become a network probing mechanism.

Therefore a production image fetcher should explicitly define:

```text
allowed schemes
+
allowed hosts
+
allowed ports
```

rather than accepting arbitrary combinations.

---

# 13. Network Isolation

Application-level validation should not be the only security layer.

A stronger architecture adds network controls:

```text
Image Worker
     ↓
Restricted Network
     ↓
Internet
```

The image-processing environment should have limited access to:

* internal services
* databases
* control planes
* metadata endpoints
* private network segments

This creates defense in depth.

---

# 14. Least-Privilege Network Architecture

The image processor should not need:

```text
full internal network access
```

if its actual responsibility is:

```text
fetch public images
transform images
store/cache results
```

Therefore:

```text
minimum network access
```

is preferable.

This follows the same principle as application authorization:

```text
least privilege
```

---

# 15. Request Timeouts

A remote server may accept a connection and respond extremely slowly.

Without timeouts:

```text
Image Request
   ↓
Remote server hangs
   ↓
Worker remains occupied
   ↓
Concurrency consumed
```

Eventually:

```text
worker pool exhausted
```

Therefore remote image fetching should have bounded:

* connection timeout
* response timeout
* total request timeout

The exact values depend on the workload and infrastructure.

---

# 16. Response Size Limits

An attacker can provide a URL that returns enormous content.

For example:

```text
/image?url=attacker.example/huge-file
```

Even if the file eventually turns out not to be an image, downloading gigabytes before rejecting it is already an abuse problem.

Therefore enforce:

```text
maximum response bytes
```

before allowing unbounded download.

---

# 17. Content-Type Validation

Do not trust only:

```text
URL extension
```

For example:

```text
image.jpg
```

does not prove that the response is actually a JPEG.

The server should consider:

```text
HTTP Content-Type
+
actual file signature / parsing
```

where appropriate.

The principle is:

```text
filename
≠
trusted content identity
```

---

# 18. MIME Type Confusion

A malicious response could claim:

```text
Content-Type: image/jpeg
```

while containing something else.

Therefore image processing should validate the actual content before processing or serving it.

This is especially important when handling:

* SVG
* user uploads
* third-party sources
* dynamically generated content

---

# 19. Oversized Dimensions

A compressed image can contain enormous dimensions.

For example:

```text
20000 × 20000 pixels
```

even if the compressed file appears relatively small.

Decoding such an image can consume huge amounts of memory.

Therefore image processing should enforce:

```text
maximum width
maximum height
maximum pixel count
```

not merely:

```text
maximum compressed file size
```

---

# 20. Decompression Bombs

A decompression bomb exploits the difference between:

```text
compressed representation
```

and:

```text
decoded representation
```

For example:

```text
small compressed file
        ↓
massive decoded pixel buffer
```

The result can be:

```text
memory exhaustion
CPU exhaustion
worker crashes
```

Therefore resource limits must apply to the decoded representation as well.

---

# 21. CPU Exhaustion

Some transformations are computationally expensive.

Examples include:

```text
large resize
AVIF encoding
complex image processing
animated-image processing
multiple format conversions
```

An attacker could intentionally request expensive transformations.

For example:

```text
width=8000
format=expensive-format
quality=maximum
```

If accepted without limits:

```text
CPU usage ↑
```

Therefore transformation parameters must be constrained.

---

# 22. Transformation Allowlisting

Instead of accepting arbitrary transformations:

```text
width=1237
height=928
quality=93
rotation=37
filter=...
```

a production system can define allowed transformations.

For example:

```text
width:
320
640
1024
1536

quality:
60
75
85

format:
webp
avif
```

This provides:

```text
predictability
+
cache efficiency
+
resource control
```

---

# 23. Cache Cardinality and Abuse

Part 05 established:

```text
more variants
→
higher cache cardinality
```

An attacker can exploit this by generating many unique image URLs:

```text
?w=1
?w=2
?w=3
...
?w=100000
```

Each request can create:

```text
cache miss
+
transformation
+
new cache object
```

This becomes an application-layer resource exhaustion attack.

Therefore:

```text
transformation validation
+
rate limiting
+
variant allowlists
```

should work together.

---

# 24. Rate Limiting

Image transformation endpoints can be expensive.

Rate limiting can be applied by:

```text
IP
API identity
user
tenant
source host
route
transformation type
```

For example:

```text
anonymous user
→
limited transformations/minute

authenticated tenant
→
higher quota

trusted internal service
→
different policy
```

The exact model depends on the product.

---

# 25. Quotas

Rate limiting controls request frequency.

Quotas control aggregate consumption.

Examples:

```text
maximum image transformations/day
maximum generated bytes
maximum storage
maximum bandwidth
maximum CPU time
```

This is particularly relevant in:

* multi-tenant SaaS
* user-upload platforms
* image-heavy applications

---

# 26. Signed URLs

Private image systems may use signed URLs.

Conceptually:

```text
Image Request
    ↓
Signed URL
    ↓
Signature validation
    ↓
Authorization
    ↓
Serve image
```

A signature can encode constraints such as:

```text
resource
expiration
tenant
allowed transformation
```

The goal is to prevent arbitrary access to private resources.

---

# 27. Signed URL Leakage

A signed URL can function like a credential.

Therefore it should not be casually exposed in:

```text
logs
analytics
referrer headers
error messages
screenshots
```

depending on the system.

The security model should assume:

```text
signed URL
≈
temporary capability
```

and protect it accordingly.

---

# 28. Private Images and CDN Caching

Private images require careful interaction between:

```text
authorization
+
CDN
+
cache
```

A dangerous architecture is:

```text
User A authorized
 ↓
CDN caches response publicly
 ↓
User B requests same URL
 ↓
User B receives User A's image
```

Therefore:

```text
private representation
→
private cache policy
```

must be deliberate.

---

# 29. Tenant Isolation

For multi-tenant systems:

```text
Tenant A
   ↓
Image Service
   ↓
Cache
```

must not collide with:

```text
Tenant B
   ↓
Image Service
   ↓
same cache key
```

Tenant identity may need to participate in:

```text
authorization
resource identity
cache identity
storage identity
observability
```

The core invariant is:

```text
security boundary
must align with cache boundary.
```

---

# 30. SVG Security

SVG is structurally different from ordinary raster images.

SVG can contain:

```text
XML
elements
references
styles
potentially active content depending on handling
```

Therefore arbitrary SVG should not automatically be treated as equivalent to:

```text
JPEG
PNG
WebP
```

A production architecture should explicitly decide:

```text
Are user-uploaded SVGs allowed?
Are they sanitized?
Are they rasterized?
Are they served with safe headers?
```

---

# 31. User-Uploaded Images

User uploads create another trust boundary:

```text
User
 ↓
Upload
 ↓
Storage
 ↓
Validation
 ↓
Processing
 ↓
Delivery
```

Validation may include:

* file size
* MIME type
* file signature
* dimensions
* pixel count
* format
* animation properties
* malicious content checks

Do not rely solely on:

```text
filename extension.
```

---

# 32. Remote Third-Party Sources

A system may allow:

```text
partner CDN
CMS
social platform
external image host
```

These sources can fail or behave unexpectedly.

Possible failures:

```text
slow response
404
redirect loop
invalid MIME type
huge file
rate limiting
TLS problems
malformed image
origin outage
```

Therefore external image sources should be treated as dependencies.

---

# 33. Failure Containment

A remote source should not be able to bring down the application.

For example:

```text
External Image Host
       ↓
timeout
       ↓
Image Worker
       ↓
fails request
```

rather than:

```text
External Image Host
       ↓
hangs
       ↓
all image workers blocked
       ↓
application degradation
```

This requires:

* bounded timeouts
* concurrency limits
* circuit breakers where appropriate
* retries with care
* failure isolation

---

# 34. Retries Can Become an Amplifier

Suppose a remote image source is unavailable.

If every failed request is retried three times:

```text
1000 requests
×
3 retries
=
3000 upstream requests
```

Retries can therefore amplify an outage.

Image fetching should use bounded, carefully justified retries.

For many image requests:

```text
fast failure
```

may be better than repeated expensive retries.

---

# 35. Concurrency Limits

Suppose the transformer allows:

```text
1000 concurrent remote fetches
```

and all fetches become slow.

Then:

```text
1000 workers
→
blocked
```

The service can become saturated.

Concurrency limits create a bounded failure domain:

```text
maximum remote fetch concurrency
```

This protects the rest of the application.

---

# 36. Transformation Worker Isolation

For high-risk or high-cost image processing, consider separating:

```text
Application Runtime
```

from:

```text
Image Processing Workers
```

Conceptually:

```text
Application
    ↓
Image Job / Request
    ↓
Image Worker Pool
    ↓
Sandboxed Processing
```

This limits the blast radius of:

* crashes
* memory exhaustion
* CPU exhaustion
* malformed image processing

---

# 37. Image Processing as a Resource Budget

Every image transformation consumes resources.

Think in terms of:

```text
Request
 ↓
Network budget
 ↓
CPU budget
 ↓
Memory budget
 ↓
Storage budget
 ↓
Bandwidth budget
```

A production system should bound each where practical.

This is more robust than thinking only in terms of:

```text
HTTP request succeeded
```

---

# 38. Abuse Through Width and Height

Suppose an attacker requests:

```text
/image?id=123&w=50000&h=50000
```

Even if the source image is normal, the requested transformation may be extremely expensive.

Therefore:

```text
requested dimensions
```

must be validated before transformation.

Possible policies:

```text
maximum width
maximum height
maximum pixel count
allowed aspect ratios
allowed resize modes
```

---

# 39. Abuse Through Quality

Quality settings can also affect compute and output size.

Instead of:

```text
quality=0..100
```

the system can expose:

```text
quality=low
quality=medium
quality=high
```

mapped internally to bounded codec settings.

This reduces:

```text
cache cardinality
+
resource variability
+
abuse surface
```

---

# 40. Abuse Through Format Selection

Allowing arbitrary output formats may create additional processing paths.

A controlled system may support:

```text
AVIF
WebP
JPEG
PNG
```

only where required.

Unsupported or expensive formats should be rejected rather than passed through to an unrestricted transformation engine.

---

# 41. Cache Poisoning

Image caches should validate that:

```text
cache key
```

is derived from trusted, normalized representation parameters.

If untrusted input can influence the cache identity incorrectly, an attacker may attempt to cause:

```text
unexpected representation
```

to be stored under:

```text
shared cache identity
```

Therefore cache correctness and input validation are security concerns.

---

# 42. Host Header and Origin Trust

Multi-tenant or host-based image architectures should not blindly trust arbitrary host information.

If image URLs or tenant resolution depend on:

```text
Host
X-Forwarded-Host
X-Forwarded-Proto
```

the deployment must know which proxy layers are trusted.

Incorrect trust configuration can result in:

* wrong tenant resolution
* wrong asset origin
* cache collisions
* malicious URL generation

---

# 43. Authentication and Image Delivery

Authentication can exist at multiple layers:

```text
Application
 ↓
Image authorization
 ↓
CDN
 ↓
Storage
```

Do not assume that because the page is authenticated, the image is automatically protected.

An image URL may be:

```text
public
private
signed
session-bound
tenant-scoped
```

The resource policy must be explicit.

---

# 44. Authorization Must Be Enforced at the Resource Boundary

A common anti-pattern:

```text
User can access /dashboard
```

therefore:

```text
User can access /images/private-file
```

Not necessarily.

The image endpoint or storage layer must independently enforce the appropriate resource authorization.

This follows the broader principle:

```text
page authorization
≠
resource authorization
```

---

# 45. Security Headers and Content Handling

Image responses should be delivered with appropriate response metadata.

Depending on the architecture, consider:

* correct `Content-Type`
* appropriate cache directives
* safe content-disposition behavior where relevant
* content-sniffing protections where appropriate
* CSP implications for image sources
* CORS policy where relevant

The exact configuration depends on how images are consumed.

---

# 46. Image Source Trust Levels

A useful architecture is to classify sources:

```text
Tier 1 — First-party
Tier 2 — Trusted partner
Tier 3 — User-uploaded
Tier 4 — Arbitrary external
```

Each tier can have different policies.

For example:

```text
First-party
→
broad optimization capability

Trusted partner
→
allowlisted hosts

User-uploaded
→
validated + sandboxed

Arbitrary external
→
possibly prohibited
```

This is stronger than treating all remote images equally.

---

# 47. Security and Performance Are Connected

Security controls can affect performance.

For example:

```text
strict validation
+
DNS checks
+
content scanning
+
sandboxing
```

can add latency.

But removing all validation to reduce latency creates unacceptable risk.

The architecture must optimize within:

```text
security requirements
+
performance requirements
```

rather than treating security as an optional feature.

---

# 48. Observability for Image Security

Monitor security-relevant signals such as:

```text
rejected remote hosts
SSRF validation failures
blocked private IP attempts
oversized image rejections
dimension-limit violations
transformation-limit violations
rate-limit events
cache anomalies
malformed image failures
SVG policy violations
remote source timeouts
```

This helps distinguish:

```text
normal user error
```

from:

```text
abuse pattern.
```

---

# 49. High-Cardinality Security Logging

Be careful about logging raw attacker-controlled URLs.

A URL can contain:

```text
tokens
credentials
personal data
very long query strings
```

Instead, logging can use:

```text
normalized host
path classification
request ID
tenant ID where appropriate
validation result
reason code
```

while avoiding sensitive query parameters.

---

# 50. Incident Response

Suppose the image optimizer is under attack.

A useful response sequence is:

```text
Detect
  ↓
Classify
  ↓
Rate-limit / block
  ↓
Protect origin
  ↓
Protect image workers
  ↓
Preserve service for legitimate traffic
  ↓
Investigate source
  ↓
Remediate vulnerability
```

The goal is not merely:

```text
stop the attack
```

but:

```text
stop the attack
without unnecessarily taking down legitimate image delivery.
```

---

# 51. Production Failure Scenario — SSRF

### Situation

An attacker supplies a URL pointing to an internal service.

### Weak architecture

```text
URL
 ↓
fetch()
 ↓
internal service
```

### Stronger architecture

```text
URL
 ↓
scheme validation
 ↓
host policy
 ↓
DNS/IP validation
 ↓
redirect validation
 ↓
network isolation
 ↓
bounded fetch
```

The lesson:

> SSRF prevention requires multiple layers.

---

# 52. Production Failure Scenario — Memory Exhaustion

### Situation

An attacker supplies a compressed image with enormous dimensions.

Pipeline:

```text
small file
 ↓
decode
 ↓
huge pixel buffer
 ↓
memory exhaustion
```

Mitigations:

```text
maximum compressed size
+
maximum dimensions
+
maximum pixel count
+
worker memory limits
+
sandboxing
```

---

# 53. Production Failure Scenario — Transformation Abuse

Attacker sends:

```text
100,000 unique image transformations
```

Result:

```text
cache misses ↑
CPU ↑
storage ↑
bandwidth ↑
```

Mitigations:

```text
allowed transformation variants
+
rate limits
+
quotas
+
cache controls
+
concurrency limits
```

---

# 54. Production Failure Scenario — Cross-Tenant Leakage

Tenant A requests:

```text
/logo
```

and the CDN caches:

```text
Tenant A logo
```

under a globally shared key.

Tenant B then requests:

```text
/logo
```

and receives Tenant A's image.

This demonstrates:

```text
cache correctness
+
authorization
+
tenant isolation
```

must be designed together.

---

# 55. Production Failure Scenario — Remote Source Outage

A partner CDN becomes unavailable.

A naive image optimizer retries every request.

Result:

```text
partner outage
 ↓
retries
 ↓
worker saturation
 ↓
application image failures
```

A resilient architecture uses:

```text
timeouts
+
bounded retries
+
concurrency limits
+
fallback/caching where appropriate
```

---

# 56. Four-Pillar Engineering Matrix

| Dimension    | Core Concern                               | Senior-Level Question                                                   |
| ------------ | ------------------------------------------ | ----------------------------------------------------------------------- |
| Mental Model | Images as untrusted network/content inputs | What can this image request cause the server to access or consume?      |
| Mechanics    | Validation, limits, sandboxing             | Which controls execute before expensive processing?                     |
| Architecture | Trust boundaries + isolation               | Can image processing affect internal systems or other tenants?          |
| Operations   | Detection + containment                    | Can we detect and contain abuse without taking down legitimate traffic? |

---

# 57. Prediction Challenges

### Challenge 1

An image endpoint accepts arbitrary HTTPS URLs.

The URL points to:

```text
http://127.0.0.1:8080
```

What security class of problem should you investigate?

---

### Challenge 2

The hostname is public, but it resolves to a private IP.

Is hostname validation alone sufficient?

---

### Challenge 3

An allowed remote image redirects to an internal address.

What additional control is required?

---

### Challenge 4

A 50 KB image expands to hundreds of millions of pixels.

What resource is likely to become the limiting factor?

---

### Challenge 5

An attacker generates thousands of unique width parameters.

What happens to:

```text
cache cardinality
+
transformation cost
```

---

### Challenge 6

A private image is cached publicly by the CDN.

What class of failure can result?

---

### Challenge 7

A remote image host becomes slow and every request is retried three times.

What happens to your image workers?

---

# 58. Senior Interview Gotchas

### Gotcha 1

**“HTTPS URLs are safe.”**

No. HTTPS says nothing about whether the destination is trusted.

---

### Gotcha 2

**“Allowlisting the hostname completely solves SSRF.”**

Not necessarily. DNS resolution, redirects, ports, and network isolation also matter.

---

### Gotcha 3

**“File size limits prevent image-processing DoS.”**

Not alone. Pixel dimensions and decoded memory can be much larger than compressed file size.

---

### Gotcha 4

**“The URL ends in `.jpg`, so it is a JPEG.”**

The filename is not sufficient evidence of content type.

---

### Gotcha 5

**“Private image means authenticated page.”**

No. Resource authorization must be enforced at the image boundary.

---

### Gotcha 6

**“Rate limiting solves transformation abuse.”**

Rate limits help, but quotas, bounded transformations, cache controls, and resource limits may also be necessary.

---

### Gotcha 7

**“Caching makes remote image optimization safe.”**

Caching can actually amplify security mistakes if cache identity crosses authorization or tenant boundaries.

---

# 59. Core Invariants

Memorize these:

```text id="sj5g3c"
remote URL
=
untrusted input
```

```text id="0edxdi"
HTTPS
≠
trusted destination
```

```text id="4a1c8s"
trusted hostname
≠
trusted redirect target
```

```text id="5qg1x6"
compressed size
≠
decoded resource cost
```

```text id="wh7q4f"
file extension
≠
trusted content type
```

```text id="l1khz8"
public image optimizer
≠
unrestricted network proxy
```

```text id="n1e0u4"
private resource
→
private authorization + cache policy
```

```text id="w1lphx"
more transformation variants
→
more cache cardinality + more abuse surface
```

```text id="2exy8a"
image processing
→
bounded CPU + memory + network resources
```

```text id="3k9x8v"
security boundary
must align with
cache boundary
```

---

# 60. Completion Checklist

You should be able to explain:

* [ ] Why remote image optimization is a security boundary
* [ ] SSRF
* [ ] URL scheme validation
* [ ] Host allowlisting
* [ ] DNS validation
* [ ] DNS rebinding
* [ ] Private IP protection
* [ ] Redirect validation
* [ ] Port restrictions
* [ ] Network isolation
* [ ] Least-privilege networking
* [ ] Fetch timeouts
* [ ] Response-size limits
* [ ] Content-Type validation
* [ ] MIME confusion
* [ ] Maximum dimensions
* [ ] Maximum pixel count
* [ ] Decompression bombs
* [ ] CPU exhaustion
* [ ] Transformation allowlists
* [ ] Cache-cardinality abuse
* [ ] Rate limiting
* [ ] Quotas
* [ ] Signed URLs
* [ ] Signed URL leakage
* [ ] Private image caching
* [ ] Multi-tenant isolation
* [ ] SVG security
* [ ] User-upload validation
* [ ] Third-party source failures
* [ ] Retry amplification
* [ ] Concurrency limits
* [ ] Worker isolation
* [ ] Cache poisoning
* [ ] Host/proxy trust
* [ ] Resource-level authorization
* [ ] Security observability
* [ ] Incident response
* [ ] Production abuse scenarios

---

# 61. Part Boundary

This part establishes:

```text
Image Security
+
Remote Sources
+
SSRF Prevention
+
Resource Limits
+
Abuse Prevention
+
Cache Security
```

It does **not** deeply cover:

```text
Image Observability
Testing
Performance Regression Detection
Production Image SLOs
```

Those belong to:

> **KPI 10 — Part 09: Image Observability, Testing & Production Performance**

The remaining KPI 10 sequence is therefore:

```text
Part 08
Security / Remote Sources / Abuse Prevention
        ↓
Part 09
Observability / Testing / Production Performance
        ↓
Part 10
Production Image Optimization Architecture Capstone
```

---

# Final Mental Model

A production image optimizer should be treated as:

```text
                    Untrusted Input
                          ↓
                    URL Validation
                          ↓
                 Network Destination
                     Validation
                          ↓
                    Access Policy
                          ↓
                  Resource Limits
                          ↓
                   Image Validation
                          ↓
                    Transformation
                          ↓
                    Cache Identity
                          ↓
                   CDN / Delivery
                          ↓
                    Observability
```

The senior-level objective is:

> **Allow legitimate image optimization while ensuring that remote image requests cannot become arbitrary network access, unbounded resource consumption, cache-boundary violations, cross-tenant data leaks, or an uncontrolled abuse surface.**
