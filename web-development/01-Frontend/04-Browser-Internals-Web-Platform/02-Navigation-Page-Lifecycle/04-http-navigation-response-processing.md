# KPI 02 — Part 04: HTTP Navigation & Response Processing

[⬅️ Part 03: TLS & Secure Connection Establishment](./03-tls-secure-connection-establishment.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [Part 05: Document Navigation Lifecycle ➡️](./05-document-navigation-lifecycle.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## The Pipeline

After TLS succeeds:

```text
URL
 │
 ▼
HTTP Request
 │
 ├── method
 ├── target
 ├── headers
 └── cookies / credentials
 │
 ▼
Server / CDN
 │
 ▼
HTTP Response
 │
 ├── status
 ├── headers
 └── body
 │
 ▼
Browser response processing
 │
 ├── redirects?
 ├── cache?
 ├── compression?
 ├── MIME type?
 ├── streaming?
 └── document/resource processing
 │
 ▼
Document lifecycle
```

The critical boundary is:

```text
TLS
 ↓
HTTP
 ↓
Browser resource/document processing
```

---

# 1. WHAT IS HTTP?

**HTTP — Hypertext Transfer Protocol** is the application-layer protocol used for exchanging resources between clients and servers.

For a browser:

```text
Browser
   │
   │ HTTP request
   ▼
Server
   │
   │ HTTP response
   ▼
Browser
```

The resource might be:

* HTML
* CSS
* JavaScript
* JSON
* images
* fonts
* video metadata
* WebAssembly
* other application resources

---

# 2. HTTP IS REQUEST/RESPONSE

The fundamental model is:

```text
Client
  │
  │ Request
  ▼
Server
  │
  │ Response
  ▼
Client
```

A request asks the server to perform an operation or provide a resource.

A response communicates the result.

---

# 3. HTTP REQUEST STRUCTURE

Conceptually:

```http
GET /dashboard HTTP/2
Host: example.com
Accept: text/html
Accept-Encoding: gzip, br
Cookie: session=abc
User-Agent: ...
```

Think:

```text
Request
 ├── method
 ├── target
 ├── headers
 └── optional body
```

---

# 4. HTTP METHODS

Common methods:

| Method    | Typical semantic                                            |
| --------- | ----------------------------------------------------------- |
| `GET`     | Retrieve a representation                                   |
| `POST`    | Submit/process data                                         |
| `PUT`     | Replace a resource representation                           |
| `PATCH`   | Partially modify a resource                                 |
| `DELETE`  | Delete a resource                                           |
| `HEAD`    | Retrieve response metadata without the normal response body |
| `OPTIONS` | Discover supported communication options                    |

Do not reduce these to:

```text
GET = read
POST = write
```

HTTP method semantics are more precise than CRUD shorthand.

---

# 5. SAFE METHODS

HTTP defines certain methods as **safe**, meaning their semantics are intended not to request a state-changing action from the origin server.

Typical safe methods include:

```text
GET
HEAD
OPTIONS
```

This does **not** mean executing a GET can never have side effects in an application.

It means the method's defined semantics are read-oriented.

---

# 6. IDEMPOTENCY

An operation is idempotent when repeating the same request has the same intended effect as making it once.

For example:

```http
PUT /users/42
```

with the same representation can conceptually be repeated without progressively changing the intended final state.

This matters enormously for:

* retries,
* distributed systems,
* network failures,
* 0-RTT considerations,
* API design.

---

# 7. HTTP REQUEST HEADERS

Headers carry metadata.

Examples:

```http
Accept: text/html
Accept-Encoding: gzip, br
Cache-Control: no-cache
Cookie: session=...
Referer: ...
User-Agent: ...
```

Think:

```text
HTTP headers
      ↓
metadata controlling request/response behavior
```

They are not merely "extra information."

They can affect:

* content negotiation,
* caching,
* authentication,
* cookies,
* compression,
* security policies,
* browser behavior.

---

# 8. HTTP RESPONSE

A simplified response:

```http
HTTP/2 200
Content-Type: text/html; charset=utf-8
Content-Encoding: br
Cache-Control: public, max-age=3600

<html>
...
</html>
```

Think:

```text
Response
 ├── status
 ├── headers
 └── body
```

---

# 9. HTTP STATUS CODES

Major categories:

```text
1xx → informational
2xx → success
3xx → redirection
4xx → client-side/request problem
5xx → server-side failure
```

Examples:

| Status | Meaning                                        |
| ------ | ---------------------------------------------- |
| `200`  | Successful response                            |
| `201`  | Resource created                               |
| `204`  | Successful response with no content            |
| `301`  | Permanent redirect                             |
| `302`  | Temporary redirect                             |
| `304`  | Not Modified                                   |
| `307`  | Temporary redirect preserving method semantics |
| `308`  | Permanent redirect preserving method semantics |
| `400`  | Bad Request                                    |
| `401`  | Authentication required/failed                 |
| `403`  | Forbidden                                      |
| `404`  | Not Found                                      |
| `429`  | Too Many Requests                              |
| `500`  | Internal Server Error                          |
| `502`  | Bad Gateway                                    |
| `503`  | Service Unavailable                            |
| `504`  | Gateway Timeout                                |

---

# 10. STATUS CODE ≠ NETWORK FAILURE

This distinction is critical.

If you receive:

```text
HTTP 500
```

the HTTP exchange succeeded.

The server responded with an error status.

Compare:

```text
DNS failure
TLS failure
connection reset
```

Those can prevent a normal HTTP response from being received at all.

---

# 11. THE COMPLETE FAILURE TREE

When navigating:

```text
URL
 │
 ▼
DNS
 │
 ├── ❌ DNS failure
 │
 ▼
Transport
 │
 ├── ❌ connection failure
 │
 ▼
TLS
 │
 ├── ❌ certificate / handshake failure
 │
 ▼
HTTP
 │
 ├── 4xx
 ├── 5xx
 │
 ▼
Browser processing
 │
 ├── MIME problem
 ├── policy problem
 ├── parser problem
 └── resource failure
```

This is a core debugging model.

---

# 12. HTTP/1.1 VS HTTP/2 VS HTTP/3

You should understand the conceptual evolution.

### HTTP/1.1

```text
HTTP
 ↓
TCP
 ↓
TLS
```

Textual framing and connection-level constraints can create inefficiencies.

### HTTP/2

```text
HTTP/2
 ↓
TLS
 ↓
TCP
```

Introduces binary framing and multiplexed streams.

### HTTP/3

```text
HTTP/3
 ↓
QUIC
 ↓
UDP
```

Uses QUIC as its transport.

---

# 13. HTTP/2 MULTIPLEXING

HTTP/1.1 conceptually has:

```text
Request A
Request B
Request C
```

with various connection/request management limitations.

HTTP/2 provides multiple logical streams over a connection:

```text
One connection
┌───────────────────────┐
│ Stream 1 → HTML       │
│ Stream 3 → CSS        │
│ Stream 5 → JS         │
│ Stream 7 → Image      │
└───────────────────────┘
```

This reduces the need for multiple parallel TCP connections.

---

# 14. HTTP/3 STREAMS

HTTP/3 similarly uses independent streams within QUIC.

Conceptually:

```text
QUIC connection
 ├── Stream A
 ├── Stream B
 ├── Stream C
 └── Stream D
```

A major architectural difference is that QUIC avoids TCP's connection-level head-of-line blocking behavior for independent streams.

---

# 15. RESPONSE HEADERS

Response headers tell the browser how to interpret the response.

Important examples:

```http
Content-Type
Content-Length
Content-Encoding
Cache-Control
ETag
Last-Modified
Location
Set-Cookie
Vary
Content-Security-Policy
Strict-Transport-Security
```

A Senior frontend engineer should recognize these as browser-behavior controls, not just backend metadata.

---

# 16. CONTENT-TYPE

Consider:

```http
Content-Type: text/html
```

The browser now knows the intended media type.

Other examples:

```text
text/css
application/javascript
application/json
image/png
image/avif
font/woff2
```

The browser uses MIME information when determining how to process a resource.

---

# 17. MIME TYPE MATTERS

Imagine:

```http
GET /app.js
```

but the response declares an inappropriate MIME type.

Depending on context and browser security rules, the browser may refuse to execute the response as JavaScript.

Therefore:

```text
URL ending in .js
```

does not by itself guarantee:

```text
"Browser executes this as JavaScript."
```

The response's metadata and browser policies matter.

---

# 18. CONTENT-ENCODING

Servers often compress responses.

Example:

```http
Content-Encoding: br
```

The conceptual flow is:

```text
Server
   │
   │ original bytes
   ▼
compression
   │
   ▼
compressed HTTP body
   │
   ▼
network
   │
   ▼
browser
   │
   ▼
decompression
```

Compression reduces transfer size.

---

# 19. ACCEPT-ENCODING

The browser can communicate supported encodings:

```http
Accept-Encoding: gzip, deflate, br
```

The server chooses an appropriate representation.

Then:

```http
Content-Encoding: br
```

may indicate Brotli compression.

---

# 20. CONTENT-LENGTH VS TRANSFER BEHAVIOR

`Content-Length` indicates the size of the message body when known.

But modern HTTP systems can also stream responses.

Do not assume:

```text
No Content-Length
=
No response body
```

Streaming and protocol framing can determine how response data is delivered.

---

# 21. STREAMING RESPONSE

Consider a server-rendered application.

The server may produce HTML incrementally:

```text
HTML chunk 1
     ↓
HTML chunk 2
     ↓
HTML chunk 3
     ↓
...
```

The browser doesn't necessarily need to wait for the entire body before beginning relevant processing.

This becomes highly important for:

* streaming SSR,
* React Server Components,
* Suspense,
* progressive rendering,
* large HTML responses.

---

# 22. NEXT.JS CONNECTION

Modern Next.js can stream server-rendered output.

Conceptually:

```text
Next.js server
      │
      ├── HTML / streamed payload
      │
      ▼
Browser
      │
      ├── receives chunk
      ├── processes chunk
      └── continues receiving
```

Therefore:

> "The browser waits for the complete HTML response and then starts doing everything" is an incorrect mental model.

Processing can be incremental.

---

# 23. REDIRECTS

Consider:

```http
HTTP/1.1 301
Location: https://www.example.com/
```

The browser receives:

```text
3xx
 +
Location
```

and may perform another navigation.

Conceptually:

```text
URL A
 ↓
HTTP request
 ↓
301
 ↓
Location: URL B
 ↓
new navigation/request
 ↓
URL B
```

---

# 24. REDIRECT CHAINS

A dangerous architecture:

```text
A
 ↓
B
 ↓
C
 ↓
D
 ↓
final page
```

Every redirect can introduce additional work.

Potentially:

```text
DNS
connection
TLS
HTTP
```

for additional origins/connections.

Therefore redirect chains can materially affect navigation performance.

---

# 25. REDIRECT TYPES

Important distinction:

```text
301 / 302
```

versus:

```text
307 / 308
```

`307` and `308` preserve the request method and request body semantics across the redirect.

This distinction becomes important when redirecting non-GET requests.

---

# 26. LOCATION HEADER

Redirect target:

```http
Location: https://example.com/new-path
```

The browser interprets this according to HTTP redirect semantics.

It isn't simply JavaScript doing:

```javascript
window.location = ...
```

The browser's navigation stack understands HTTP redirects natively.

---

# 27. HTTP CACHE

Before downloading a resource, the browser can potentially use its cache.

Conceptually:

```text
Request
  │
  ▼
Browser cache
  │
  ├── fresh → use cached response
  │
  └── stale → validate/re-fetch
```

This can avoid network work.

---

# 28. CACHE-CONTROL

Example:

```http
Cache-Control: max-age=3600
```

Conceptually:

```text
Response
   ↓
fresh for 3600 seconds
```

Other directives include:

```text
no-cache
no-store
private
public
must-revalidate
immutable
```

These have different semantics.

---

# 29. `NO-CACHE` VS `NO-STORE`

This is a classic interview trap.

### `no-cache`

Does **not** mean:

> "Don't store this."

It generally means the stored response must be revalidated before reuse when required by the directive semantics.

### `no-store`

Means:

> Don't store the response.

So:

```text
no-cache ≠ no-store
```

Memorize the distinction.

---

# 30. ETAG

A server may provide:

```http
ETag: "abc123"
```

Later the browser can send:

```http
If-None-Match: "abc123"
```

Conceptually:

```text
Browser
  │
  │ "Do you still have representation abc123?"
  ▼
Server
  │
  ├── unchanged → 304
  │
  └── changed → 200 + new body
```

---

# 31. HTTP 304

`304 Not Modified` tells the browser that its cached representation can be reused.

Conceptually:

```text
Request
 ↓
conditional validation
 ↓
304
 ↓
use cached body
```

This can save response-body transfer.

---

# 32. LAST-MODIFIED

Another validator:

```http
Last-Modified: Wed, 26 Aug 2026 10:00:00 GMT
```

Browser may later send:

```http
If-Modified-Since: ...
```

The server can respond:

```text
304 Not Modified
```

if appropriate.

---

# 33. CACHE HIT VS 304

These are not the same.

### Cache hit

```text
Browser
 ↓
fresh cache
 ↓
no network request required
```

### 304 validation

```text
Browser
 ↓
network request
 ↓
server
 ↓
304
 ↓
reuse cached body
```

A 304 still requires network activity.

---

# 34. VARY

Consider:

```http
Vary: Accept-Encoding
```

This tells caches that the representation varies based on request headers.

Conceptually:

```text
Request A
Accept-Encoding: br
        ↓
Representation A

Request B
Accept-Encoding: gzip
        ↓
Representation B
```

Caching must account for the variation.

---

# 35. COOKIES

A browser can send cookies:

```http
Cookie: session=abc
```

The server can establish/update cookies using:

```http
Set-Cookie: session=abc; Secure; HttpOnly; SameSite=Lax
```

Cookie handling is deeply integrated with browser navigation and security.

---

# 36. IMPORTANT COOKIE FLAGS

### Secure

Cookie should only be sent over secure connections.

### HttpOnly

Cookie is inaccessible to normal JavaScript APIs such as `document.cookie`.

### SameSite

Controls cross-site cookie sending behavior according to the cookie's configured policy.

These are browser enforcement mechanisms.

---

# 37. HTTP + CORS

Suppose:

```text
Frontend:
https://app.example

API:
https://api.example
```

These are different origins.

The browser applies the same-origin policy.

A server can explicitly permit cross-origin browser access using CORS response headers.

Example:

```http
Access-Control-Allow-Origin: https://app.example
```

---

# 38. IMPORTANT CORS MENTAL MODEL

CORS is primarily a **browser enforcement mechanism**.

It does not mean:

```text
"Server cannot receive the request."
```

The server can receive a request that the browser ultimately refuses to expose to frontend JavaScript.

This distinction is critical.

---

# 39. PREFLIGHT

For certain cross-origin requests, the browser sends an `OPTIONS` preflight.

Conceptually:

```text
Browser
   │
   │ OPTIONS
   ▼
Server
   │
   │ permission
   ▼
Browser
   │
   │ actual request
   ▼
Server
```

Therefore:

```text
CORS
+
preflight
=
potential additional network round trip
```

---

# 40. HTTP AUTHENTICATION

HTTP can participate in authentication mechanisms.

At the application level you may see:

```http
Authorization: Bearer <token>
```

or:

```http
Authorization: Basic ...
```

The browser/server may also use cookies.

The key architectural distinction:

```text
TLS authentication
```

usually authenticates the server to the browser.

Whereas:

```text
HTTP application authentication
```

can authenticate the user/client to the application.

These are different security layers.

---

# 41. REQUEST BODY

Not every request has a body.

Example:

```http
GET /products
```

usually doesn't require one.

But:

```http
POST /users
Content-Type: application/json

{"name":"Sunny"}
```

contains a request body.

Think:

```text
Request
 ├── metadata
 └── optional payload
```

---

# 42. RESPONSE BODY PROCESSING

Suppose:

```http
Content-Type: text/html
```

The browser recognizes an HTML document response.

Then the response enters browser document processing:

```text
HTTP response
     ↓
MIME/type interpretation
     ↓
HTML bytes
     ↓
HTML parsing
     ↓
DOM construction
```

This is where HTTP navigation transitions into the next browser subsystem.

---

# 43. THE CRITICAL BOUNDARY

This part of the lifecycle is:

```text
Network
   │
   ▼
HTTP response
   │
   ▼
resource/document classification
   │
   ▼
HTML parser
```

So:

> HTTP does not parse HTML.

HTTP transports the bytes and metadata.

The browser's document subsystem parses HTML.

---

# 44. HTML RESPONSE → DOM

Simplified:

```text
HTTP
response body
     │
     ▼
HTML parser
     │
     ▼
DOM
```

Example:

```html
<html>
  <body>
    <h1>Hello</h1>
  </body>
</html>
```

becomes a DOM structure.

---

# 45. HTTP RESPONSE → CSS

For:

```html
<link rel="stylesheet" href="/app.css">
```

the browser discovers another resource.

Conceptually:

```text
HTML response
    ↓
HTML parser
    ↓
<link>
    ↓
new HTTP request
    ↓
CSS response
    ↓
CSS processing
```

This is why navigation creates a **resource dependency graph**, not one isolated request.

---

# 46. HTTP RESPONSE → JAVASCRIPT

Likewise:

```html
<script src="/app.js"></script>
```

can trigger:

```text
HTML
 ↓
script discovery
 ↓
HTTP request
 ↓
JavaScript response
 ↓
JavaScript processing
```

The precise execution timing depends on script attributes and parser state.

---

# 47. REQUEST WATERFALL

A realistic navigation might look like:

```text
Document
   │
   ├── HTML
   │
   ├── CSS
   │
   ├── JS
   │
   ├── fonts
   │
   ├── images
   │
   └── API/data requests
```

DevTools Network waterfall is effectively a visualization of this resource graph over time.

---

# 48. 🧪 DIAGNOSTIC LAB — INSPECT THE MAIN DOCUMENT

Open DevTools:

```text
Network
→ Preserve log
→ Disable cache
→ reload
```

Select the main document.

Inspect:

```text
Request URL
Request method
Status
Protocol
Request headers
Response headers
Content-Type
Content-Encoding
Cache-Control
Timing
```

Your objective:

> Explain every major field and which browser subsystem consumes it.

---

# 49. 🧪 DIAGNOSTIC LAB — FOLLOW A REDIRECT

Find a URL that redirects.

Inspect:

```text
Request A
 ↓
3xx
 ↓
Location
 ↓
Request B
 ↓
final response
```

Ask:

> How many HTTP requests were necessary before the final document arrived?

Then inspect whether each request used:

* the same origin,
* the same connection,
* a new connection.

---

# 50. 🧪 DIAGNOSTIC LAB — CACHE

Load a page twice.

Compare:

```text
First navigation
vs
Second navigation
```

Inspect:

```text
Status
Size
Transferred
Cache-Control
ETag
Age
Timing
```

Determine whether the resource was:

```text
network fetched
revalidated
or served from cache
```

---

# 51. 🧪 DIAGNOSTIC LAB — COMPRESSION

Find a large text resource.

Inspect:

```http
Accept-Encoding
Content-Encoding
```

Compare transferred bytes with resource size.

Understand:

```text
resource size
≠
bytes transferred
```

Compression can make the network transfer significantly smaller.

---

# 52. 🧪 DIAGNOSTIC LAB — STREAMING

Use a streaming SSR application or an endpoint that deliberately delays chunks.

Observe the response timing.

Ask:

```text
Did all bytes arrive at once?
Did browser processing begin before completion?
What was rendered before the full response arrived?
```

This creates the bridge to:

* streaming SSR,
* React Suspense,
* progressive rendering.

---

# 53. PRODUCTION DEBUGGING RUNBOOK

### Symptom

> "The page is slow."

Do not immediately say:

> "React is slow."

Inspect:

```text
DNS
 ↓
connection
 ↓
TLS
 ↓
request queueing
 ↓
TTFB
 ↓
response transfer
 ↓
HTML processing
 ↓
subresource discovery
 ↓
rendering
```

---

# 54. TTFB

**Time to First Byte (TTFB)** measures the time from the beginning of a request until the first byte of the response is received.

Conceptually:

```text
Request start
      │
      │ DNS / connection / TLS / server processing
      │
      ▼
First response byte
```

High TTFB can indicate problems such as:

* network latency,
* connection establishment,
* CDN/origin distance,
* server processing,
* backend dependency latency.

TTFB is not equivalent to total page load time.

---

# 55. TTFB VS RESPONSE DOWNLOAD

Suppose:

```text
TTFB = 800ms
Download = 50ms
```

The problem likely isn't response transfer size.

Conversely:

```text
TTFB = 100ms
Download = 3 seconds
```

may indicate:

```text
large response
slow connection
poor compression
```

This decomposition matters.

---

# 56. INCIDENT TRACE

Suppose production monitoring shows:

```text
DNS:       20ms
TCP:       30ms
TLS:       40ms
TTFB:     900ms
Download:  30ms
```

What is suspicious?

```text
Server/CDN/backend response generation
```

not React rendering.

Your first investigation should move toward:

```text
CDN
origin
server-side rendering
backend dependencies
database/API calls
```

---

# 57. INCIDENT TRACE — HUGE DOWNLOAD

Suppose:

```text
TTFB:     100ms
Download: 2500ms
```

Investigate:

```text
response size
compression
network throughput
resource type
CDN delivery
streaming behavior
```

Again:

> Don't debug the wrong layer.

---

# 58. 🔥 CRUCIBLE — TRACE THE NAVIGATION

Given:

```text
https://app.example.com
```

Predict:

```text
1. URL parsing
2. DNS resolution if needed
3. transport establishment
4. TLS establishment if needed
5. HTTP request
6. HTTP response
7. response classification
8. HTML parsing
9. subresource discovery
10. additional HTTP requests
```

This is the fundamental navigation chain.

---

# 59. CRUCIBLE — 304

Question:

> Does a 304 mean the browser downloaded the HTML again?

No.

Conceptually:

```text
Browser
 ↓
conditional request
 ↓
Server
 ↓
304
 ↓
browser reuses cached representation
```

The network round trip occurred, but the full representation body did not need to be retransmitted.

---

# 60. CRUCIBLE — CORS

Question:

> The API server received my request, but JavaScript got a CORS error. How is that possible?

Because:

```text
Browser
   │
   │ request
   ▼
API server
   │
   │ response
   ▼
Browser
   │
   ▼
CORS enforcement
   │
   └── JS access denied
```

The network request and JavaScript visibility are distinct concepts.

---

# 61. CRUCIBLE — 500

Question:

> If the server returns HTTP 500, did the network fail?

No.

The network and HTTP exchange can be completely successful:

```text
DNS       ✅
Transport ✅
TLS       ✅
HTTP      ✅
Application ❌
```

The `500` is an application/server-side HTTP result.

---

# 62. CRUCIBLE — REDIRECT COST

Suppose:

```text
example.com
 ↓ 301
www.example.com
 ↓ 302
app.example.com
 ↓ 200
```

There are multiple HTTP transactions.

Question:

> Why is this potentially expensive?

Because redirects can add:

```text
request latency
server processing
connection establishment
TLS setup
```

especially when origins differ.

---

# 63. CRUCIBLE — STREAMING

Question:

> Does the browser always wait until the complete HTML response is downloaded before parsing?

No.

HTTP response data can be streamed, and browser processing can proceed incrementally as appropriate.

This is foundational for modern streaming rendering architectures.

---

# 64. SENIOR ENGINEER MENTAL MODEL

Don't visualize:

```text
Browser
   ↓
"gets webpage"
```

Visualize:

```text
                 Navigation
                     │
                     ▼
                HTTP request
                     │
                     ▼
              CDN / Web server
                     │
                     ▼
               HTTP response
                     │
          ┌──────────┼───────────┐
          │          │           │
       status      headers      body
          │          │           │
          └──────────┼───────────┘
                     ▼
             Browser processing
                     │
                     ▼
                HTML parser
                     │
                     ▼
                DOM / resources
                     │
          ┌──────────┼───────────┐
          ▼          ▼           ▼
         CSS         JS        Images
          │          │           │
          └──────────┼───────────┘
                     ▼
                  Rendering
```

---

# 65. PART 04 — COMPLETION CHECKLIST

You should now be able to explain:

### HTTP fundamentals

* [x] HTTP request/response model
* [x] Request methods
* [x] Safe methods
* [x] Idempotency
* [x] Request headers
* [x] Request bodies
* [x] Response headers
* [x] Status codes

### Protocols

* [x] HTTP/1.1
* [x] HTTP/2
* [x] HTTP/3
* [x] HTTP/2 multiplexing
* [x] HTTP/3 streams

### Response processing

* [x] MIME types
* [x] Content-Encoding
* [x] Compression
* [x] Streaming
* [x] Redirects
* [x] Response bodies
* [x] Resource discovery

### Caching

* [x] Cache-Control
* [x] `no-cache`
* [x] `no-store`
* [x] ETag
* [x] Last-Modified
* [x] 304
* [x] Vary
* [x] Cache hit vs revalidation

### Browser security

* [x] Cookies
* [x] Secure
* [x] HttpOnly
* [x] SameSite
* [x] CORS
* [x] Preflight
* [x] TLS authentication vs HTTP authentication

### Performance

* [x] TTFB
* [x] Response transfer time
* [x] Redirect cost
* [x] Connection reuse
* [x] Compression
* [x] Streaming

### Architecture

* [x] CDN
* [x] TLS termination
* [x] HTTP → browser document processing
* [x] HTML → CSS/JS/resource discovery
* [x] Network waterfall interpretation

---

# FINAL MENTAL MODEL

The entire chain you've covered so far is:

```text
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER NAVIGATION                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                            URL
                              │
                              ▼
                            DNS
                              │
                              ▼
                         TCP / QUIC
                              │
                              ▼
                           TLS 1.3
                              │
                              ▼
                        HTTP REQUEST
                              │
                              ▼
                     CDN / SERVER / ORIGIN
                              │
                              ▼
                       HTTP RESPONSE
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
                  Status    Headers     Body
                              │         │
                              └────┬────┘
                                   ▼
                       Browser response processing
                                   │
                     ┌─────────────┼──────────────┐
                     ▼             ▼              ▼
                  Redirect       Cache          MIME
                     │             │              │
                     └─────────────┼──────────────┘
                                   ▼
                             HTML parser
                                   │
                                   ▼
                                  DOM
                                   │
                      ┌────────────┼─────────────┐
                      ▼            ▼             ▼
                     CSS          JS          Images/fonts
                      │            │             │
                      └────────────┼─────────────┘
                                   ▼
                              Rendering
```

---

[⬅️ Part 03: TLS & Secure Connection Establishment](./03-tls-secure-connection-establishment.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [🧪 Lab 04](./examples/04-http-stream-cache-waterfall-lab.html) | [Part 05: Document Navigation Lifecycle ➡️](./05-document-navigation-lifecycle.md)
