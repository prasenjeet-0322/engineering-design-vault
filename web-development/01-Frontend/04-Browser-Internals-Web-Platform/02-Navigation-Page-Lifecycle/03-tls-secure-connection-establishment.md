# KPI 02 — Part 03: TLS & Secure Connection Establishment

[⬅️ Part 02: DNS & Connection Establishment](./02-dns-connection-establishment.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [Part 04: HTTP Navigation & Response Processing ➡️](./04-http-navigation-response-processing.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# LAYER 1 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

## The Core Pipeline

For a typical cold HTTPS connection:

```text
URL
 │
 ▼
DNS
 │
 ▼
IP address
 │
 ▼
TCP / QUIC
 │
 ▼
TLS
 │
 ├── negotiate security parameters
 ├── authenticate server
 ├── establish shared secrets
 └── establish encrypted channel
 │
 ▼
HTTP
```

For HTTP/3:

```text
DNS
 ↓
IP
 ↓
QUIC
 ↓
TLS 1.3 integrated with QUIC
 ↓
HTTP/3
```

---

## What TLS Gives You

TLS provides three core security properties:

| Property            | Meaning                                                           |
| ------------------- | ----------------------------------------------------------------- |
| **Confidentiality** | Attackers cannot normally read encrypted application data         |
| **Integrity**       | Tampering with protected data can be detected                     |
| **Authentication**  | The browser can verify the server's identity through certificates |

The key distinction:

```text
DNS
→ "Where should I connect?"

TLS
→ "Can I establish an authenticated secure channel to this server?"
```

---

# 1. WHAT IS TLS?

**TLS — Transport Layer Security** is a cryptographic protocol used to establish secure communication between endpoints.

For web applications:

```text
HTTP
 +
TLS
 =
HTTPS
```

More precisely:

```text
HTTPS
   ↓
HTTP carried through a TLS-protected connection
```

TLS itself does not define HTML, JavaScript, REST, GraphQL, React, or Next.js.

It protects the transport of application data.

---

# 2. WHY DOES TLS EXIST?

Imagine:

```text
Browser ──────────────── Internet ──────────────── Server
```

Without encryption, an attacker positioned along the communication path could potentially observe or manipulate traffic.

TLS changes the model:

```text
Browser
   │
   │ encrypted application data
   ▼
Internet
   │
   │ encrypted
   ▼
Server
```

An intermediary may observe network metadata, but protected application payloads are cryptographically secured.

---

# 3. THE THREE SECURITY GOALS

## 3.1 Confidentiality

Suppose your application sends:

```text
Authorization: Bearer <token>
```

TLS protects the application payload from ordinary passive network interception.

Conceptually:

```text
Plaintext
   │
   ▼
Encryption
   │
   ▼
Ciphertext
```

---

## 3.2 Integrity

Suppose an attacker modifies:

```text
amount=100
```

into:

```text
amount=100000
```

A properly protected TLS record includes cryptographic integrity protection.

The receiver can detect unauthorized modification.

Conceptually:

```text
Original data
     │
     ▼
Cryptographic protection
     │
     ▼
Protected record
     │
     ▼
Receiver verifies
     │
     ├── valid
     └── modified → reject
```

---

## 3.3 Authentication

Encryption alone isn't sufficient.

Suppose you connect securely to:

```text
203.0.113.50
```

You need to know:

> **Who am I actually communicating with?**

TLS uses certificates and a trust model to authenticate the server.

That is why:

```text
https://bank.example
```

is not equivalent to:

```text
http://bank.example
```

simply because both reach the same IP.

---

# 4. TLS IS NOT DNS

This distinction is critical.

DNS:

```text
example.com
    ↓
IP address
```

TLS:

```text
Server endpoint
    ↓
cryptographic authentication
    ↓
secure channel
```

DNS does not prove server identity.

A malicious or compromised DNS path could potentially direct a hostname somewhere unexpected.

The TLS certificate validation step is part of what prevents an arbitrary server from successfully impersonating the intended HTTPS site.

---

# 5. TLS IS NOT ENCRYPTION ONLY

A weak mental model is:

> "HTTPS means the browser encrypts everything."

Better:

```text
TLS
 ├── authentication
 ├── key establishment
 ├── confidentiality
 └── integrity
```

TLS is a **protocol for establishing and protecting a secure channel**, not merely an encryption function.

---

# 6. TLS 1.3

Modern HTTPS commonly uses **TLS 1.3**.

TLS 1.3 significantly streamlined the handshake compared with older TLS versions.

A simplified conceptual flow:

```text
Client                              Server
  │                                   │
  │──── ClientHello ────────────────► │
  │                                   │
  │ ◄─── ServerHello + security ───── │
  │      parameters / authentication  │
  │                                   │
  │──── encrypted handshake data ───► │
  │                                   │
  │◄──── encrypted handshake data ─── │
  │                                   │
  │       secure channel ready        │
  │                                   │
  │──── HTTP request ───────────────► │
```

The actual protocol contains substantially more detail, but this is the right engineering-level mental model.

---

# 7. CLIENTHELLO

The browser begins TLS negotiation with a **ClientHello**.

Conceptually it communicates information such as:

```text
ClientHello
 ├── supported TLS versions
 ├── supported cryptographic parameters
 ├── random values
 ├── key-share information
 └── extensions
```

The browser is effectively saying:

> "Here are the security mechanisms and parameters I support."

---

# 8. SERVERHELLO

The server responds with a **ServerHello** selecting compatible parameters.

Conceptually:

```text
Client
  │
  │ "I support these"
  ▼
Server
  │
  │ "We'll use these"
  ▼
Client
```

This negotiation allows both sides to agree on how the secure session will operate.

---

# 9. PUBLIC-KEY CRYPTOGRAPHY VS SESSION ENCRYPTION

A very important distinction:

TLS does not simply use expensive asymmetric encryption for every byte of your application traffic.

Conceptually:

```text
Asymmetric cryptography
        │
        ▼
authentication / key establishment
        │
        ▼
shared symmetric traffic keys
        │
        ▼
bulk application encryption
```

Symmetric cryptography is much more efficient for large quantities of data.

Therefore:

```text
TLS handshake
     ↓
establish secrets
     ↓
symmetric encryption
     ↓
HTTP data
```

---

# 10. EPHEMERAL KEY EXCHANGE

TLS 1.3 commonly uses ephemeral key exchange mechanisms based on Diffie-Hellman variants.

The conceptual goal:

```text
Client secret material
        +
Server secret material
        ↓
shared cryptographic secret
```

without sending the final shared secret directly over the network.

This is one of the foundations of modern secure key establishment.

---

# 11. FORWARD SECRECY

TLS 1.3's use of ephemeral key exchange supports **forward secrecy**.

Conceptually:

```text
Today
  │
  ├── Session A
  ├── Session B
  └── Session C
```

If a long-term authentication key is compromised later, that does not automatically expose the historical traffic keys from previous sessions.

This is an important security property.

---

# 12. CERTIFICATES

When you visit:

```text
https://example.com
```

the server presents a certificate chain.

A simplified representation:

```text
Server certificate
       │
       ▼
Intermediate CA
       │
       ▼
Trusted Root CA
```

The certificate contains identity-related information and cryptographic material used in authentication.

---

# 13. WHAT DOES A CERTIFICATE PROVE?

The certificate is part of a system that allows the browser to establish:

> The cryptographic identity presented by this server is authorized for the hostname being accessed.

It does **not** prove:

* the company is honest,
* the application is bug-free,
* the API is secure,
* the server won't be hacked,
* the website isn't malicious.

TLS authentication answers a narrower question:

> **Is this endpoint cryptographically authenticated for the requested identity under the browser's trust model?**

---

# 14. CERTIFICATE CHAIN

A typical chain:

```text
                 Root CA
                    │
                    ▼
             Intermediate CA
                    │
                    ▼
             Server Certificate
                    │
                    ▼
               example.com
```

The browser has a set of trusted root certificates.

It validates the presented chain according to the applicable certificate and TLS rules.

---

# 15. HOSTNAME VALIDATION

Suppose you visit:

```text
https://example.com
```

but the certificate is valid only for:

```text
malicious.example
```

The browser must reject the connection.

Conceptually:

```text
Requested identity
      │
      ▼
example.com
      │
      ▼
Certificate identity
      │
      ├── matches → continue
      │
      └── doesn't match → security error
```

This prevents simple hostname impersonation.

---

# 16. CERTIFICATE EXPIRATION

Certificates have validity periods.

If the certificate is expired:

```text
Certificate
   │
   ▼
Validity check
   │
   ▼
Expired
   │
   ▼
Browser security warning / connection failure
```

This is a classic production failure.

---

# 17. CERTIFICATE REVOCATION

Certificates can also become invalid before their nominal expiration.

Browsers and TLS implementations have mechanisms and policies for dealing with certificate revocation and related trust failures.

The exact browser behavior is nuanced and can involve mechanisms such as:

* certificate transparency,
* revocation checking,
* platform/browser trust stores,
* OCSP-related mechanisms,
* browser-maintained revocation information.

The important senior-level point:

> Certificate validity is more than checking an expiration date.

---

# 18. CERTIFICATE TRANSPARENCY

Modern web PKI also uses **Certificate Transparency (CT)** mechanisms.

The goal is greater visibility into certificate issuance.

Conceptually:

```text
CA issues certificate
       │
       ▼
Certificate Transparency ecosystem
       │
       ▼
issuance becomes publicly auditable
```

This helps detect improperly issued certificates.

---

# 19. TRUST STORE

The browser or operating system maintains trusted certificate authorities.

Conceptually:

```text
Browser / OS
     │
     ▼
Trusted roots
     │
     ▼
Validate certificate chain
     │
     ▼
Authenticate server
```

The exact architecture differs by browser and platform.

---

# 20. WHAT HAPPENS IF TLS VALIDATION FAILS?

Examples:

```text
Expired certificate
Wrong hostname
Untrusted issuer
Invalid certificate chain
Protocol incompatibility
```

The browser can prevent normal secure navigation.

That is why TLS errors are fundamentally different from:

```text
HTTP 404
HTTP 500
```

Those are application-layer HTTP responses.

A TLS failure can happen **before usable HTTP communication is established**.

---

# 21. TLS FAILURE VS HTTP FAILURE

### TLS failure

```text
DNS
 ↓
Connection
 ↓
TLS ❌
 ↓
HTTP never successfully established
```

### HTTP failure

```text
DNS
 ↓
Connection
 ↓
TLS
 ↓
HTTP
 ↓
500 Internal Server Error
```

This distinction is extremely important in debugging.

---

# 22. TLS HANDSHAKE AND PERFORMANCE

TLS isn't free.

A cold HTTPS connection may require:

```text
DNS
 ↓
TCP
 ↓
TLS handshake
 ↓
HTTP
```

Each stage contributes latency.

Therefore:

```text
Cold connection
=
DNS + transport setup + TLS + HTTP
```

Whereas a reused secure connection may avoid much of this setup.

---

# 23. SESSION RESUMPTION

TLS supports mechanisms that allow subsequent connections to resume security context rather than performing the full initial setup.

Conceptually:

```text
First connection
     ↓
Full TLS establishment
     ↓
resumption information
     ↓
Later connection
     ↓
abbreviated handshake
```

This reduces connection-establishment overhead.

---

# 24. WHY SESSION RESUMPTION MATTERS

Imagine a mobile user repeatedly reconnecting to your application.

Without effective resumption:

```text
Connection
 ↓
full security establishment
 ↓
HTTP
```

Repeatedly.

With resumption:

```text
Existing session context
       ↓
faster establishment
       ↓
HTTP
```

This can improve latency for repeat connections.

---

# 25. 0-RTT IN TLS 1.3

TLS 1.3 supports **0-RTT early data** in appropriate resumed-session scenarios.

Conceptually:

```text
Previous session
      ↓
resumption capability
      ↓
new connection
      ↓
early application data
```

This can reduce latency.

But it introduces an important security consideration:

> **0-RTT data can be replayed.**

Therefore it must not be blindly used for operations where replay could cause harmful side effects.

---

# 26. IDEMPOTENCY AND 0-RTT

Suppose an application sends:

```http
POST /purchase
```

If replay is possible, that operation requires careful consideration.

Compare:

```text
GET /products
```

with:

```text
POST /purchase
```

The second has potentially significant side effects.

Therefore:

```text
0-RTT
+
replay possibility
=
application-level design concern
```

This is an excellent Senior/Staff interview topic.

---

# 27. HTTP/3 CHANGES WHERE TLS LIVES

For HTTP/2:

```text
HTTP/2
  ↓
TLS
  ↓
TCP
```

For HTTP/3:

```text
HTTP/3
  ↓
QUIC
  ↓
UDP
```

TLS 1.3 is deeply integrated into QUIC.

So don't visualize HTTP/3 as:

```text
HTTP/3
 ↓
TLS
 ↓
UDP
```

in exactly the same layering sense as HTTP/2.

A better conceptual model is:

```text
HTTP/3
   │
   ▼
 QUIC
 ┌───────────────┐
 │ TLS 1.3       │
 │ transport     │
 │ streams       │
 │ reliability   │
 └───────────────┘
   │
   ▼
 UDP
```

---

# 28. WHY QUIC INTEGRATES TLS

QUIC was designed with modern secure transport as a core requirement.

This allows:

```text
QUIC
 ├── encrypted transport
 ├── stream management
 ├── congestion control
 ├── reliability
 └── connection management
```

rather than treating TLS as an independent traditional layer sitting directly above TCP.

---

# 29. TLS RECORDS

After the handshake, application data is transmitted through protected TLS records.

Conceptually:

```text
HTTP bytes
    │
    ▼
TLS record protection
    │
    ▼
encrypted records
    │
    ▼
network
```

The receiving side verifies and decrypts them.

---

# 30. TLS DOES NOT HIDE ALL NETWORK METADATA

A common misconception:

> "HTTPS makes the request completely invisible."

Not exactly.

TLS protects application content, but network observers can still potentially learn metadata such as:

* source/destination network addresses,
* traffic timing,
* traffic volume,
* some protocol-level information.

The security model is:

```text
Protected:
application payload

Not necessarily hidden:
all metadata
```

Modern technologies can reduce some metadata exposure, but HTTPS should not be described as total invisibility.

---

# 31. TLS + HTTP HEADERS

Consider:

```http
GET /dashboard HTTP/2
Host: app.example.com
Authorization: Bearer ...
Cookie: session=...
```

With HTTPS:

```text
Browser
   │
   ▼
TLS encryption
   │
   ▼
Network
```

An ordinary network observer cannot simply read those protected application-layer contents.

The server decrypts them inside the secure endpoint.

---

# 32. TLS + NEXT.JS

Imagine:

```text
Browser
   │
   │ HTTPS
   ▼
Next.js server
```

The browser's TLS connection is established **before the application-level HTTP request is available to the Next.js request handler**.

Therefore:

```text
TLS failure
   ↓
Next.js route handler never gets normal request
```

This is a useful diagnostic boundary.

---

# 33. TLS TERMINATION

Production architectures often terminate TLS at a reverse proxy, CDN, or load balancer.

Example:

```text
Browser
   │
   │ HTTPS
   ▼
CDN / Load Balancer
   │
   │ internal connection
   ▼
Next.js / Node server
```

TLS may terminate at the edge.

Therefore:

> The browser's TLS session does not necessarily extend all the way to the application process.

---

# 34. WHY TLS TERMINATION MATTERS

Suppose:

```text
Browser
 ↓ HTTPS
CDN
 ↓ HTTP or HTTPS
Origin
```

There can be multiple security boundaries.

You must ask:

```text
Where does TLS terminate?
Is the internal hop encrypted?
Who sees decrypted HTTP?
Where are cookies/tokens exposed?
```

This becomes important for:

* zero-trust architectures,
* compliance,
* internal traffic security,
* reverse proxies,
* CDNs,
* service meshes.

---

# 35. PRODUCTION TRACE

Imagine:

```text
Browser
   │
HTTPS
   ▼
Cloud CDN
   │
TLS termination
   ▼
Load Balancer
   │
HTTPS
   ▼
Next.js server
```

There are potentially **two distinct TLS relationships**:

```text
Browser ↔ CDN
CDN ↔ Origin
```

Do not treat them as one connection.

---

# 36. 🧪 DIAGNOSTIC LAB — INSPECT TLS

Open:

```text
Chrome DevTools
→ Network
→ select HTTPS request
```

Inspect the connection/security information available in DevTools.

Depending on browser version and UI, inspect:

* protocol,
* connection information,
* certificate/security details,
* TLS version,
* remote address,
* connection reuse indicators.

The objective is to answer:

```text
Which protocol?
Which remote endpoint?
Was the connection reused?
Was TLS established?
Which certificate was presented?
```

---

# 37. 🧪 DIAGNOSTIC LAB — CERTIFICATE INSPECTION

Open:

```text
https://example.com
```

Inspect the site's security/certificate information.

Determine:

```text
Certificate subject
Certificate issuer
Validity period
Certificate chain
Hostname coverage
```

Then ask:

> Which part of this evidence establishes server identity?

---

# 38. 🧪 DIAGNOSTIC LAB — COLD VS RESUMED CONNECTION

Test a secure origin under:

```text
Cold state
```

and:

```text
Warm/reused state
```

Compare the timing.

Look for:

```text
DNS
Connection
TLS
Request
Response
```

Your goal:

> Determine which security/network setup work is paid only on initial connection establishment.

---

# 39. 🧪 DIAGNOSTIC LAB — HTTP/2 VS HTTP/3

Find an origin supporting HTTP/3.

Inspect:

```text
Protocol
Connection behavior
Request timing
```

Compare:

```text
h2
vs
h3
```

The important lesson is not:

> "h3 wins."

It is:

> **Understand how transport architecture changes connection establishment and request behavior.**

---

# 40. 🧪 DIAGNOSTIC LAB — TLS FAILURE

Use a controlled environment to create a certificate problem.

Examples:

* expired certificate,
* hostname mismatch,
* untrusted certificate.

Observe:

```text
Does DNS succeed?
Does TCP/QUIC establish?
Does TLS succeed?
Does HTTP reach the application?
```

This teaches the failure boundary.

---

# 41. PRODUCTION DEBUGGING RUNBOOK

### Symptom

```text
Users report:
"Site doesn't load."
```

Do not immediately inspect React.

Follow:

```text
1. DNS
   ↓
2. Transport connection
   ↓
3. TLS
   ↓
4. HTTP
   ↓
5. Application
```

If TLS fails:

```text
Certificate?
Hostname?
Chain?
Expiry?
Protocol compatibility?
CDN configuration?
```

---

# 42. INCIDENT SCENARIO — EXPIRED CERTIFICATE

### Symptoms

Suddenly:

```text
Production site inaccessible
```

Application logs:

```text
nothing unusual
```

Why?

Because:

```text
Browser
 ↓
DNS
 ↓
connection
 ↓
TLS ❌
 ↓
Next.js never receives request
```

Your application logs can remain perfectly healthy while the website is unavailable.

This is why frontend engineers need to understand infrastructure boundaries.

---

# 43. INCIDENT SCENARIO — TLS TERMINATION MISCONFIGURATION

Architecture:

```text
Browser
 ↓ HTTPS
CDN
 ↓ HTTPS
Origin
```

Suppose the origin certificate expires.

Result:

```text
Browser → CDN     ✅
CDN → Origin      ❌
```

Users may see an outage even though:

```text
Browser-to-CDN TLS
```

is completely healthy.

The correct diagnostic question is:

> **Which TLS hop failed?**

---

# 44. INCIDENT SCENARIO — SLOW COLD CONNECTIONS

Suppose telemetry shows:

```text
DNS       20ms
TCP       80ms
TLS       120ms
HTTP      50ms
```

The application itself is fast.

Yet users see high latency.

The bottleneck is connection establishment.

Potential investigation:

```text
Connection reuse?
Geographic distance?
CDN placement?
Protocol?
TLS configuration?
Network path?
Origin architecture?
```

Not:

```text
"Optimize React rendering."
```

---

# 45. SENIOR INTERVIEW GOTCHAS

## Q1. What does HTTPS provide?

Strong answer:

> TLS provides authenticated secure communication, including confidentiality and integrity, with server authentication based on the certificate trust model.

---

## Q2. Does DNS authenticate the server?

No.

```text
DNS → address resolution
TLS → authenticated secure channel
```

---

## Q3. Does TLS encrypt the entire Internet connection?

No.

TLS protects application-layer communication carried through the TLS session, but network metadata can remain observable.

---

## Q4. Does a valid certificate mean the website is safe?

No.

It establishes cryptographic identity under the PKI trust model.

It does not establish application safety.

---

## Q5. Can a TLS failure return HTTP 500?

Normally, no.

A TLS failure occurs before successful HTTP communication.

---

# 46. CRUCIBLE — PREDICT THE TRACE

Given:

```text
https://app.example.com
```

and a completely cold browser:

```text
DNS cache: empty
connection pool: empty
TLS session: none
```

Predict the sequence.

### Answer

Conceptually:

```text
URL
 ↓
DNS
 ↓
IP
 ↓
transport connection
 ↓
TLS handshake
 ↓
certificate/authentication
 ↓
secure channel
 ↓
HTTP request
 ↓
HTTP response
```

---

# 47. CRUCIBLE — WARM NAVIGATION

Now:

```text
DNS information: available
connection: reusable
TLS session: established
```

What happens?

Potentially:

```text
URL
 ↓
existing connection/session state
 ↓
HTTP request
 ↓
response
```

The critical insight:

> **A browser navigation is state-dependent.**

---

# 48. CRUCIBLE — CERTIFICATE ERROR

Given:

```text
DNS ✅
TCP ✅
TLS ❌
HTTP ❌
```

What layer should you investigate?

```text
TLS / certificate / trust configuration
```

Not:

```text
React
Next.js route
API handler
```

---

# 49. CRUCIBLE — 0-RTT

Question:

> Why shouldn't every POST request simply use TLS 1.3 0-RTT?

Because early data can be replayed.

For a side-effecting operation:

```text
POST /charge-card
```

replay can potentially cause undesirable consequences.

Therefore the application must consider:

```text
idempotency
+
replay protection
+
operation semantics
```

---

# 50. CRUCIBLE — CDN ARCHITECTURE

Given:

```text
Browser
  ↓
CDN
  ↓
Next.js
```

Question:

> Does the browser's TLS connection necessarily terminate inside Node.js?

No.

TLS may terminate at the CDN.

The browser establishes a secure connection with the CDN, not necessarily directly with the Next.js process.

---

# 51. THE COMPLETE MENTAL MODEL

You should now visualize HTTPS navigation like this:

```text
                 URL
                  │
                  ▼
             Hostname
                  │
                  ▼
                 DNS
                  │
                  ▼
              IP address
                  │
                  ▼
          TCP / QUIC connection
                  │
                  ▼
              TLS 1.3
          ┌───────┼────────┐
          │       │        │
     Identity  Key      Secure
     validation setup    channel
          │       │        │
          └───────┼────────┘
                  ▼
             HTTP / HTTP2
                / HTTP3
                  │
                  ▼
              Server/CDN
                  │
                  ▼
              Application
```

---

# 52. 🔥 THE MOST IMPORTANT SENIOR-LEVEL INSIGHT

When debugging a slow or broken page, don't treat:

```text
HTTPS
```

as a black box.

Break it into:

```text
DNS
 ↓
Transport
 ↓
TLS
 ↓
HTTP
 ↓
Application
```

Then ask:

> **Which boundary is failing or consuming latency?**

That single mental model prevents a huge class of misdiagnoses.

---

# 53. PART 03 COMPLETION CHECKLIST

You should be able to explain, without memorization:

### TLS fundamentals

* [x] What TLS is
* [x] Why HTTPS uses TLS
* [x] Confidentiality
* [x] Integrity
* [x] Authentication
* [x] TLS 1.3 handshake
* [x] ClientHello
* [x] ServerHello
* [x] Key establishment
* [x] Symmetric session encryption
* [x] Forward secrecy

### PKI

* [x] Certificates
* [x] Certificate chains
* [x] Root CAs
* [x] Intermediate CAs
* [x] Hostname validation
* [x] Certificate expiration
* [x] Trust stores
* [x] Certificate Transparency

### Performance

* [x] TLS handshake cost
* [x] Connection reuse
* [x] Session resumption
* [x] 0-RTT
* [x] 0-RTT replay risk

### HTTP/3

* [x] QUIC
* [x] TLS 1.3 integration
* [x] HTTP/3 vs HTTP/2 transport architecture

### Production

* [x] TLS termination
* [x] CDN TLS
* [x] Load balancer TLS
* [x] Origin TLS
* [x] TLS failure vs HTTP failure
* [x] DevTools security/network diagnostics

---

# FINAL ONE-LINE MODEL

> **DNS finds the destination, TCP/QUIC establishes transport, TLS authenticates and secures the connection, and HTTP carries the application request.**

---

[⬅️ Part 02: DNS & Connection Establishment](./02-dns-connection-establishment.md) | [📚 KPI 02 Index](./README.md) | [🧪 Lab 01](./examples/01-navigation-lifecycle-timeline-lab.html) | [🧪 Lab 02](./examples/02-dns-connection-benchmark-lab.html) | [🧪 Lab 03](./examples/03-tls-handshake-certificate-lab.html) | [Part 04: HTTP Navigation & Response Processing ➡️](./04-http-navigation-response-processing.md)
