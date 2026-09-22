# Level 08 — KPI 11 — Part 07

## Configuration, Secrets, Environment Isolation & Runtime Configuration Architecture

### Part Objective

Master how configuration, secrets, environment boundaries, feature flags, and runtime settings behave across the complete deployment lifecycle.

At SDE-2 level, configuration is not simply:

```text
process.env.SOME_VALUE
```

It is a production architecture spanning:

```text
Source
  ↓
Build
  ↓
Artifact
  ↓
Environment
  ↓
Runtime
  ↓
Request
```

The central question is:

> **Which values belong to the application artifact, which belong to the environment, which are secrets, when are they resolved, and how can they change without compromising security, reproducibility, or deployment correctness?**

---

# 1. Configuration Is a Deployment Dependency

An application depends on more than code.

Conceptually:

```text
Application
    │
    ├── Code
    ├── Configuration
    ├── Secrets
    ├── Infrastructure
    └── External Services
```

Therefore:

```text
application behavior
=
code
+
configuration
+
runtime environment
```

Two identical application artifacts can behave differently when deployed with different configuration.

```text
Artifact A
   │
   ├── Production Config → Production behavior
   │
   └── Staging Config    → Staging behavior
```

This is desirable when the configuration boundary is intentional.

---

# 2. Configuration vs Secrets

The first distinction is:

```text
Configuration
```

versus:

```text
Secrets
```

Configuration may include:

* API base URLs
* feature settings
* timeout values
* region identifiers
* logging levels
* cache settings

Secrets may include:

* database passwords
* private API keys
* signing keys
* encryption keys
* OAuth client secrets
* credentials

The critical distinction is:

```text
configuration may be observable
secrets must be protected
```

Not every environment variable is a secret.

---

# 3. Environment Variables Are a Transport Mechanism

Environment variables are commonly used to provide configuration to processes.

For example:

```text
DATABASE_URL=...
API_TIMEOUT_MS=5000
LOG_LEVEL=info
```

But environment variables themselves are not the architecture.

They are simply one mechanism for transporting configuration.

The architecture is:

```text
Configuration Source
        ↓
Configuration Loader
        ↓
Validation
        ↓
Typed Runtime Configuration
        ↓
Application
```

This is much safer than scattering raw environment access throughout the codebase.

---

# 4. Centralized Configuration

Avoid:

```text
process.env.API_URL
process.env.API_URL
process.env.API_URL
```

throughout unrelated modules.

Instead:

```text
Environment
    ↓
Config Loader
    ↓
Validated Config Object
    ↓
Application Modules
```

For example:

```text
config.database.url
config.api.timeout
config.features.newCheckout
```

This creates a configuration boundary.

Benefits include:

* validation
* type conversion
* documentation
* testing
* controlled access
* easier debugging

---

# 5. Configuration Schema

Environment variables are fundamentally strings.

For example:

```text
MAX_RETRIES="3"
```

The application must convert that into:

```text
number
```

Similarly:

```text
ENABLE_CACHE="false"
```

must not accidentally become the boolean:

```text
true
```

because the string `"false"` is truthy in JavaScript.

Therefore configuration should be parsed and validated explicitly.

Conceptually:

```text
Raw Environment
      ↓
Parsing
      ↓
Validation
      ↓
Typed Configuration
```

---

# 6. Fail-Fast Configuration Validation

Suppose production requires:

```text
DATABASE_URL
PAYMENT_SECRET
AUTH_SECRET
```

and one is missing.

A dangerous behavior is:

```text
Application starts
      ↓
Receives traffic
      ↓
Fails when feature executes
```

A better approach is:

```text
Process starts
      ↓
Configuration validation
      ↓
Invalid
      ↓
Startup failure
```

This moves configuration errors from runtime request failures to deployment/startup failures.

---

# 7. Required vs Optional Configuration

Every configuration value should have an explicit classification.

### Required

```text
DATABASE_URL
AUTH_SECRET
```

The application cannot operate safely without it.

### Optional with default

```text
LOG_LEVEL
CACHE_TTL
```

A documented default exists.

### Environment-specific

```text
PUBLIC_BASE_URL
```

The value changes by environment.

### Feature-controlled

```text
ENABLE_NEW_CHECKOUT
```

The value controls behavior rather than infrastructure.

This classification prevents ambiguous configuration.

---

# 8. Build-Time vs Runtime Configuration

This is one of the most important deployment concepts.

Consider:

```text
Build
  ↓
Artifact
  ↓
Runtime
```

Some values are consumed during:

```text
Build
```

while others are resolved during:

```text
Runtime
```

These are not equivalent.

---

# 9. Build-Time Configuration

A build-time value affects the generated artifact.

Conceptually:

```text
Source
  +
Build Configuration
  ↓
Artifact
```

If the value is embedded into client-side JavaScript, changing the environment variable after the build may not change the already-built bundle.

This creates an important invariant:

```text
build-time value
→ potentially becomes artifact state
```

---

# 10. Runtime Configuration

Runtime configuration is resolved when the application executes.

Conceptually:

```text
Immutable Artifact
       +
Runtime Environment
       ↓
Running Application
```

This enables:

```text
same artifact
+
different runtime configuration
```

without rebuilding the application.

This is important for:

```text
build once
promote many
```

deployment strategies.

---

# 11. Immutable Artifact Principle

A strong deployment architecture aims for:

```text
Build Once
    ↓
Artifact
    ↓
Staging
    ↓
Production
```

rather than:

```text
Build for Staging
    ↓
Build again for Production
```

Why?

Because rebuilding introduces another variable:

```text
different build
```

The stronger model is:

```text
same artifact
+
different environment configuration
```

This makes promotion more deterministic.

---

# 12. Public vs Private Configuration

Next.js introduces an important boundary between server-only configuration and browser-visible configuration.

Conceptually:

```text
Server Configuration
        │
        ├── Secrets
        ├── DB URLs
        └── Private API keys

Browser Configuration
        │
        ├── Public API origin
        ├── Feature presentation
        └── Public identifiers
```

Anything intentionally exposed to the browser must be treated as public.

The key security invariant is:

```text
browser-visible configuration
=
not secret
```

---

# 13. Client Bundle Security Boundary

A common mistake is assuming:

```text
environment variable
=
secret
```

That is false.

If a value becomes part of the client bundle:

```text
Browser
   ↓
JavaScript
   ↓
Configuration value
```

the user can inspect it.

Therefore:

```text
private server configuration
```

must never cross the client boundary accidentally.

This is particularly important when using:

```text
'use client'
```

components.

---

# 14. Server Components and Configuration

Server Components can access server-side configuration without exposing it directly to the browser.

Conceptually:

```text
Server Component
      ↓
Private Config
      ↓
Database / API
      ↓
Rendered Result
```

The secret does not need to become part of the browser bundle.

However, if application code passes the secret itself into client props:

```text
Server
  ↓
Client Component
  ↓
Browser
```

the secret has crossed the boundary.

Therefore the security boundary is about **data flow**, not merely where the original value was read.

---

# 15. Configuration Exposure Is a Data-Flow Problem

The question should not be:

> Did this module read an environment variable?

The question should be:

> Can the resulting value reach an untrusted boundary?

Potential boundaries include:

* browser JavaScript
* HTML
* response headers
* logs
* error messages
* URLs
* analytics
* client-side telemetry

A secret can leak even without being intentionally rendered.

---

# 16. Secrets Management

Production secrets should generally come from a dedicated secret-management mechanism rather than source control.

Conceptually:

```text
Secret Store
     ↓
Deployment
     ↓
Runtime
     ↓
Application
```

The source repository should contain:

```text
configuration schema
```

not:

```text
production secret values
```

---

# 17. Secret Rotation

Secrets should be replaceable without requiring architectural disruption.

For example:

```text
Secret V1
   ↓
Application
```

becomes:

```text
Secret V2
   ↓
Application
```

A mature architecture considers:

* rotation frequency
* overlap periods
* revocation
* rollout order
* existing sessions/tokens
* backward compatibility

---

# 18. Dual-Key Rotation

Some systems need old and new credentials to coexist temporarily.

For example:

```text
Current Key: K1
Next Key:    K2
```

Deployment:

```text
Accept K1 + K2
```

Then:

```text
Stop generating K1
```

Finally:

```text
Remove K1
```

This is another form of compatibility-first deployment.

---

# 19. Secret Scope

Not every service should receive every secret.

Bad:

```text
Every service
   ↓
All production secrets
```

Better:

```text
Service A
   ↓
Secrets A

Service B
   ↓
Secrets B
```

This follows:

```text
least privilege
```

If one component is compromised, the blast radius is smaller.

---

# 20. Environment Isolation

Typical environments include:

```text
Development
Preview
Staging
Production
```

Each should have intentional boundaries.

For example:

```text
Development
   ↓
Development DB

Staging
   ↓
Staging DB

Production
   ↓
Production DB
```

A particularly dangerous configuration is:

```text
Staging
   ↓
Production DB
```

unless there is a deliberate, tightly controlled reason.

---

# 21. Environment Isolation Is More Than Different URLs

True isolation may require separate:

* databases
* queues
* object stores
* credentials
* API accounts
* caches
* domains
* encryption keys
* analytics streams

Changing:

```text
API_URL
```

alone does not necessarily create environment isolation.

---

# 22. Preview Environments

Modern deployment systems often create temporary environments:

```text
Pull Request
   ↓
Preview Deployment
```

The preview may need:

```text
isolated configuration
isolated credentials
safe data
```

A preview should not automatically gain unrestricted production privileges.

---

# 23. Production Data in Non-Production

Production data copied into development or preview environments introduces risks:

* privacy exposure
* accidental modification
* credential leakage
* excessive access
* data retention problems

Safer architectures use:

```text
synthetic data
```

or:

```text
sanitized datasets
```

when possible.

---

# 24. Configuration Drift

Suppose infrastructure is intended to have:

```text
API_TIMEOUT=5000
```

but production manually contains:

```text
API_TIMEOUT=10000
```

while staging contains:

```text
API_TIMEOUT=5000
```

Now environments behave differently for an undocumented reason.

This is:

```text
configuration drift
```

Drift makes production behavior difficult to reproduce.

---

# 25. Configuration as Code

Configuration can be represented declaratively:

```text
Repository
   ↓
Configuration Definition
   ↓
Environment
```

This improves:

* reviewability
* reproducibility
* auditing
* change history

Secrets themselves should still be handled securely rather than committed as plaintext configuration.

---

# 26. Configuration Precedence

Multiple configuration sources may exist:

```text
defaults
↓
environment
↓
deployment configuration
↓
runtime overrides
```

If precedence is unclear, debugging becomes difficult.

Every production system should define:

```text
Which source wins?
```

and:

```text
What happens when two sources conflict?
```

---

# 27. Defaults Can Be Dangerous

Defaults are useful for optional settings.

But dangerous defaults can hide configuration failures.

For example:

```text
PAYMENT_TIMEOUT
default = 30 minutes
```

may silently produce unacceptable behavior.

For critical security or infrastructure configuration:

```text
missing
→ fail fast
```

is often safer than:

```text
missing
→ guess
```

---

# 28. Configuration Type Safety

A typed configuration boundary might conceptually expose:

```text
config = {
  databaseUrl: string,
  apiTimeoutMs: number,
  enableCache: boolean,
  region: string
}
```

rather than raw strings:

```text
process.env.API_TIMEOUT
```

everywhere.

This moves parsing to one controlled location.

---

# 29. Configuration and Validation

A useful configuration pipeline is:

```text
Environment
     ↓
Schema
     ↓
Parse
     ↓
Validate
     ↓
Normalize
     ↓
Freeze
     ↓
Application
```

Validation should check:

* presence
* type
* format
* allowed values
* relationships between fields

For example:

```text
REGION=moon
```

may be syntactically valid but semantically invalid.

---

# 30. Cross-Field Validation

Some configuration values are only valid together.

Example:

```text
USE_TLS=true
```

may require:

```text
TLS_CERT
TLS_KEY
```

Similarly:

```text
CACHE_ENABLED=true
```

may require:

```text
CACHE_URL
```

Therefore configuration validation can include relationships rather than individual fields only.

---

# 31. Environment-Specific Domains

A robust deployment architecture should distinguish domains.

For example:

```text
app.example.com
```

versus:

```text
staging.example.com
preview.example.com
```

Domain configuration can affect:

* cookies
* authentication
* canonical URLs
* redirects
* CORS
* OAuth callbacks
* metadata
* CDN behavior

Therefore domains are part of configuration architecture.

---

# 32. Configuration and Authentication

Authentication configuration often spans:

```text
issuer
client ID
client secret
callback URL
cookie domain
encryption/signing keys
```

A staging application must not accidentally use production OAuth callbacks or production signing keys.

Cross-environment authentication configuration can create:

* login loops
* callback failures
* security exposure
* session collisions

---

# 33. Configuration and Multi-Tenancy

Some values are global:

```text
database host
```

Others may be tenant-specific:

```text
branding
feature availability
external integration
```

Do not confuse:

```text
environment configuration
```

with:

```text
tenant configuration
```

They live at different architectural scopes.

---

# 34. Configuration Scope Hierarchy

A useful hierarchy is:

```text
Global
  ↓
Environment
  ↓
Region
  ↓
Service
  ↓
Tenant
  ↓
User / Request
```

For example:

```text
Global:
  product defaults

Environment:
  staging vs production

Region:
  database endpoint

Service:
  timeout

Tenant:
  enabled integrations

Request:
  locale
```

Each scope should have clear ownership.

---

# 35. Runtime Configuration vs Request Configuration

Runtime configuration is generally stable for a process.

Request configuration can vary per request.

For example:

```text
Runtime:
  database URL
  signing key

Request:
  locale
  tenant
  authorization context
```

Do not accidentally encode request-specific values as process-wide configuration.

---

# 36. Feature Flags

Feature flags are another form of runtime behavior configuration.

Conceptually:

```text
Application
    ↓
Feature Flag
    ↓
Behavior A / Behavior B
```

Flags can support:

* gradual rollout
* experimentation
* emergency disablement
* tenant-specific features
* operational kill switches

But feature flags introduce state and configuration complexity.

---

# 37. Feature Flag Failure Modes

Suppose:

```text
CheckoutV2 = true
```

but the flag service becomes unavailable.

Possible strategies:

```text
fail open
→ use V2

fail closed
→ use V1

cached decision
→ continue previous behavior
```

The correct choice depends on the feature.

For safety-critical behavior, defaulting to the safer path may matter more than availability.

---

# 38. Feature Flags Are Not Permanent Architecture

A common failure pattern is:

```text
if flag:
    new behavior
else:
    old behavior
```

remaining for years.

This creates:

```text
branch complexity
```

and hidden behavior combinations.

Flags should have:

```text
owner
purpose
creation date
expected removal date
scope
fallback
```

---

# 39. Dynamic Configuration

Some systems require configuration changes without redeployment.

Examples:

* rate limits
* feature rollout percentages
* operational thresholds
* UI experiments

Architecture:

```text
Configuration Store
       ↓
Runtime
       ↓
Application
```

But dynamic configuration introduces consistency questions:

```text
When does a change take effect?
What happens if the config store is unavailable?
Is configuration cached?
How quickly does it propagate?
```

---

# 40. Configuration Caching

Suppose runtime configuration is fetched remotely.

Without caching:

```text
Every request
   ↓
Config Service
```

This creates a new dependency.

With caching:

```text
Request
   ↓
Local Config Cache
   ↓
Config Service on refresh
```

Now the system must reason about:

```text
staleness
refresh
failure
fallback
invalidation
```

Configuration itself becomes distributed state.

---

# 41. Configuration and Availability

A critical configuration service should not necessarily be placed on the synchronous request path.

Bad:

```text
Request
 ↓
Config Service
 ↓
Response
```

Better:

```text
Startup / background refresh
       ↓
Local validated config
       ↓
Request
```

when the product semantics allow it.

This reduces runtime dependency pressure.

---

# 42. Configuration and Deployment Rollback

Rollback must consider configuration.

Suppose:

```text
Code V2
+
Config V2
```

is deployed.

Then code rolls back:

```text
Code V1
+
Config V2
```

If V1 does not understand V2 configuration, rollback can fail.

Therefore:

```text
code compatibility
```

and:

```text
configuration compatibility
```

must be considered together.

---

# 43. Configuration Versioning

Configuration changes should ideally be traceable.

For important configuration:

```text
Config Version 41
Config Version 42
Config Version 43
```

A deployment should make it possible to determine:

```text
Which code version?
Which config version?
Which environment?
Which secrets?
Which feature flags?
```

were active.

This is deployment provenance.

---

# 44. Configuration Fingerprints

Logging the actual value of secrets is unsafe.

Instead, systems can expose safe metadata such as:

```text
configVersion=42
configFingerprint=abc123
```

This helps answer:

> Are these two instances running the same configuration?

without exposing sensitive values.

---

# 45. Never Log Secrets

Dangerous:

```text
logger.info({
  databaseUrl,
  authSecret,
  apiKey
})
```

Even indirect logging can leak secrets through:

* exceptions
* URLs
* headers
* request bodies
* debugging output
* telemetry

The secure default is:

```text
secret value
→ never log
```

---

# 46. URLs Are a Common Secret-Leak Boundary

A credential included in a URL can leak through:

```text
browser history
proxy logs
server logs
analytics
referrer headers
monitoring
```

Therefore secrets should not be embedded in URLs unless the protocol explicitly requires a controlled mechanism.

---

# 47. Configuration and Caching

Configuration changes can alter representation behavior.

For example:

```text
FEATURE_X=false
```

changes to:

```text
FEATURE_X=true
```

while a CDN still serves cached responses generated under the old configuration.

Therefore configuration changes may require:

```text
cache invalidation
```

or:

```text
versioned representation identity
```

when configuration affects cached output.

---

# 48. Configuration and Rendering

In a Next.js application, configuration can influence:

* server rendering
* static generation
* client rendering
* API responses
* middleware
* Server Actions
* caching
* routing

The critical question is:

> At what stage is this configuration consumed?

Because the answer determines whether a configuration change requires:

```text
request
```

or:

```text
redeployment
```

or:

```text
rebuild
```

or:

```text
cache invalidation
```

---

# 49. Configuration and Middleware

Middleware may depend on:

* environment
* tenant routing
* feature flags
* authentication configuration
* allowed hosts

Because middleware executes early, configuration errors can affect a large portion of traffic.

Therefore middleware configuration should be:

```text
validated
+
minimal
+
deterministic
```

---

# 50. Configuration and Server Actions

Server Actions may use:

```text
database configuration
payment credentials
external service URLs
feature flags
```

These remain server-side concerns.

A Server Action should never rely on a client-provided value merely because that value appears to correspond to a configuration setting.

Security-sensitive configuration must remain authoritative on the server.

---

# 51. Configuration and API Routes

Route Handlers can depend on:

```text
database
API credentials
rate limits
timeouts
service URLs
```

Configuration should therefore be injected into the API layer through the same validated configuration boundary.

Avoid separate configuration parsing systems for each subsystem.

---

# 52. Configuration and Edge Runtime

Different runtimes may expose different configuration mechanisms and runtime APIs.

Therefore:

```text
Node runtime configuration
```

should not automatically be assumed to behave identically in:

```text
Edge runtime
```

Architecture must account for runtime constraints.

This is especially important for:

* filesystem assumptions
* native modules
* connection behavior
* secrets access
* long-lived processes

---

# 53. Configuration and Region

Global deployment often requires region-aware configuration:

```text
Region A
  DB_URL = db-a

Region B
  DB_URL = db-b
```

This is useful but dangerous if configuration becomes inconsistent unintentionally.

A region-aware configuration system should make the intended topology explicit.

---

# 54. Configuration Drift Detection

A production system should be able to detect:

```text
Instance A
configVersion=42

Instance B
configVersion=41
```

because mixed configuration can create inconsistent behavior.

This is especially important during:

* rolling deployments
* autoscaling
* secret rotation
* emergency changes

---

# 55. Startup Configuration Architecture

A strong startup sequence is:

```text
Process Start
      ↓
Load Configuration
      ↓
Parse
      ↓
Validate
      ↓
Initialize Dependencies
      ↓
Establish Readiness
      ↓
Serve Traffic
```

Invalid configuration should normally prevent readiness.

This connects configuration architecture with the lifecycle architecture covered later.

---

# 56. Configuration Failure Taxonomy

Configuration failures can be classified as:

### Missing

```text
required value absent
```

### Invalid

```text
value has incorrect format
```

### Incompatible

```text
code and config disagree
```

### Exposed

```text
secret crossed security boundary
```

### Drifted

```text
instances disagree
```

### Stale

```text
runtime still uses previous configuration
```

### Mis-scoped

```text
tenant/request setting treated as global
```

### Misrouted

```text
staging points to production
```

---

# 57. Production Failure Scenario: Missing Secret

Deployment starts:

```text
Production
 ↓
AUTH_SECRET missing
```

Bad behavior:

```text
Process starts
 ↓
Requests arrive
 ↓
Authentication fails
```

Better:

```text
Process starts
 ↓
Config validation
 ↓
Failure
 ↓
Instance never becomes ready
```

This prevents bad instances from entering the traffic pool.

---

# 58. Production Failure Scenario: Secret Leaked to Client

A developer reads:

```text
PAYMENT_API_KEY
```

inside a server module.

Then passes it through props:

```text
Server Component
   ↓
Client Component
   ↓
Browser
```

The key is now exposed.

The root problem is:

```text
server/client data-flow violation
```

not merely the environment variable name.

---

# 59. Production Failure Scenario: Staging Uses Production Database

Configuration:

```text
STAGING_DATABASE_URL
→ production database
```

A developer runs a destructive migration.

The application may function perfectly.

The configuration is still catastrophically wrong.

This illustrates:

```text
syntactic validity
≠
architectural correctness
```

---

# 60. Production Failure Scenario: Configuration Drift

Three instances:

```text
A → timeout 5s
B → timeout 5s
C → timeout 30s
```

Traffic distribution makes behavior inconsistent.

One subset of requests now behaves differently.

Without configuration fingerprints, this may appear to be a random latency issue.

---

# 61. Production Failure Scenario: Rollback Incompatibility

Deployment:

```text
Code V2
Config V2
```

Rollback:

```text
Code V1
Config V2
```

V1 expects:

```text
OLD_API_URL
```

while V2 config contains:

```text
NEW_API_URL
```

Rollback fails.

Therefore configuration changes should respect the same compatibility discipline as database migrations.

---

# 62. Four-Pillar Engineering Matrix

| Pillar           | Configuration Questions                                                        |
| ---------------- | ------------------------------------------------------------------------------ |
| **Mechanics**    | When and where is configuration loaded, parsed, exposed and cached?            |
| **Architecture** | What belongs at build, runtime, environment, region, tenant and request scope? |
| **Operations**   | How are validation, rotation, drift, rollout and rollback handled?             |
| **Judgment**     | Should a value be static, dynamic, secret, public, global or scoped?           |

---

# 63. Configuration Decision Framework

For every configuration value, ask:

### 1. What is its scope?

```text
global / environment / region / service / tenant / request
```

### 2. Is it secret?

```text
yes / no
```

### 3. When is it needed?

```text
build / startup / request
```

### 4. Can it change without deployment?

```text
yes / no
```

### 5. Does changing it invalidate cached output?

```text
yes / no
```

### 6. Does the browser need it?

```text
yes / no
```

### 7. What happens if it is missing?

```text
fail / default / degrade
```

### 8. How is it versioned?

```text
tracked / dynamic / external
```

### 9. How is it observed?

```text
version / fingerprint / audit log
```

### 10. How is it rolled back?

```text
previous version / manual recovery / immutable release
```

---

# 64. Prediction Challenges

You should be able to predict the outcome of these situations.

### Challenge 1

The same Docker image is deployed to staging and production with different runtime configuration.

Why can the application behave differently even though the artifact is identical?

---

### Challenge 2

A secret is read by a Server Component and passed as a prop to a Client Component.

Where does the security boundary fail?

---

### Challenge 3

A required environment variable is missing.

Why is startup failure often safer than allowing the application to become ready?

---

### Challenge 4

A feature flag changes from false to true while CDN responses remain cached.

What consistency problem can occur?

---

### Challenge 5

Three instances have different configuration versions.

What kinds of production symptoms could appear?

---

### Challenge 6

A production secret is rotated immediately without allowing the previous credential to remain valid.

Which in-flight systems might fail?

---

### Challenge 7

A rollback restores application code but not configuration.

Why can the rollback still fail?

---

### Challenge 8

A preview environment has production API credentials.

What architectural boundary has failed?

---

### Challenge 9

A runtime configuration service becomes unavailable.

Should every request fail?

What architecture could avoid that dependency being on the request path?

---

### Challenge 10

A configuration value changes behavior of generated HTML.

What other system may need to be considered besides the application itself?

---

# 65. Senior-Level Interview Questions

You should be able to answer these independently.

### Configuration

1. What is the difference between build-time and runtime configuration?
2. Why is build-once-promote-many useful?
3. Why are environment variables not inherently secrets?
4. How would you design a typed configuration system?
5. When should configuration validation happen?

### Security

6. How can environment variables leak into the browser?
7. How would you design secret rotation?
8. How do you prevent one service from accessing unrelated secrets?
9. Why should secrets not be logged?
10. What is the difference between public configuration and private configuration?

### Environments

11. What constitutes true environment isolation?
12. How would you design preview environments safely?
13. How can configuration drift occur?
14. How would you detect configuration drift?

### Operations

15. How do configuration changes interact with rollback?
16. How would you version configuration?
17. How would you debug two instances behaving differently because of configuration?
18. When should a configuration change trigger cache invalidation?

### Next.js

19. How does the server/client boundary affect environment configuration?
20. Which configuration should remain server-only?
21. How can configuration affect rendering and caching?
22. What configuration considerations exist for middleware?
23. How can configuration differ between Node and Edge runtimes?

### Architecture

24. When should configuration be static versus dynamic?
25. When should a configuration service be on or off the request path?
26. How would you model configuration scope for a multi-tenant system?
27. How would you safely roll out a configuration change globally?

---

# 66. Reference Architecture

A mature configuration architecture can be represented as:

```text
                 Configuration Sources
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       Defaults      Environment    Secret Store
          │              │              │
          └──────────────┼──────────────┘
                         ↓
                  Configuration Loader
                         ↓
                       Schema
                         ↓
                   Parse + Validate
                         ↓
                 Typed Configuration
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       Server        Middleware      Build/Runtime
          │
          ↓
     Application
          │
     ┌────┴─────┐
     ↓          ↓
  Database   External APIs
```

The browser receives only explicitly public configuration.

---

# 67. Core Invariants

These should become permanent mental models:

```text
configuration ≠ secrets
```

```text
environment variable ≠ automatically secret
```

```text
browser-visible configuration is public
```

```text
build-time configuration can become artifact state
```

```text
runtime configuration enables artifact reuse
```

```text
same artifact + different configuration = different behavior
```

```text
configuration validation should happen before readiness
```

```text
missing critical configuration should not silently become a guess
```

```text
secret access should follow least privilege
```

```text
environment isolation requires more than different URLs
```

```text
configuration drift creates inconsistent runtime behavior
```

```text
configuration changes can affect cache correctness
```

```text
rollback must consider configuration compatibility
```

```text
tenant configuration ≠ environment configuration
```

```text
request state ≠ runtime configuration
```

---

# 68. Completion Checklist

You have completed Part 07 when you can independently explain:

* [ ] Configuration vs secrets
* [ ] Environment variables as configuration transport
* [ ] Centralized configuration loading
* [ ] Configuration schema validation
* [ ] Typed configuration
* [ ] Required vs optional configuration
* [ ] Fail-fast configuration validation
* [ ] Build-time configuration
* [ ] Runtime configuration
* [ ] Immutable artifacts
* [ ] Build-once-promote-many
* [ ] Public vs private configuration
* [ ] Server/client configuration boundaries
* [ ] Secret management
* [ ] Secret rotation
* [ ] Least-privilege secret access
* [ ] Environment isolation
* [ ] Preview environment safety
* [ ] Production data isolation
* [ ] Configuration drift
* [ ] Configuration as code
* [ ] Configuration precedence
* [ ] Safe defaults
* [ ] Feature flags
* [ ] Dynamic configuration
* [ ] Configuration caching
* [ ] Configuration versioning
* [ ] Configuration fingerprints
* [ ] Secret leakage prevention
* [ ] Authentication configuration
* [ ] Multi-tenant configuration scope
* [ ] Region-specific configuration
* [ ] Configuration and caching
* [ ] Configuration and rendering
* [ ] Configuration and middleware
* [ ] Configuration and Server Actions
* [ ] Configuration and Route Handlers
* [ ] Runtime-specific configuration
* [ ] Configuration rollback
* [ ] Production configuration failure diagnosis

---

# 69. Boundary of This Part

This part owns:

```text
configuration
+
secrets
+
environment isolation
+
runtime configuration
+
feature flags
+
configuration security
+
configuration compatibility
```

It does not primarily own:

* hosting/runtime models → Part 04
* CDN/global delivery → Part 05
* networking/data dependencies → Part 06
* runtime lifecycle/readiness/shutdown → Part 08
* deployment observability/production verification → Part 09
* complete deployment architecture → Part 10

The boundary is intentional.

Part 07 answers:

> **What configuration does the deployed application need, where does that configuration come from, when is it resolved, who is allowed to see it, and how can it change safely across environments and releases?**

---

# Final Mental Model

Think of configuration as a controlled dependency pipeline:

```text
                 SOURCE OF TRUTH
                       │
                       ↓
              Configuration Sources
                       │
                       ↓
                 Load + Parse
                       │
                       ↓
                    Validate
                       │
                       ↓
                   Normalize
                       │
                       ↓
              Typed Configuration
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
      Server        Runtime        Feature Flags
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                  Application
                       │
            ┌──────────┼───────────┐
            ↓          ↓           ↓
        Database     APIs        Cache
```

The most important deployment invariant is:

```text
Code
+
Artifact
+
Configuration
+
Infrastructure
=
Runtime Behavior
```

And production configuration must preserve:

```text
security
+
reproducibility
+
environment isolation
+
compatibility
+
observability
+
controlled change
```

That is the configuration and secrets layer of deployment architecture.

**Next canonical part: KPI 11 — Part 08: Runtime Lifecycle, Health Checks, Graceful Shutdown & Deployment-Safe Behavior.**
