# Level 08 — Next.js & Full-Stack React

# KPI 11 — Deployment Considerations

## Part 03 — Deployment Strategies, CI/CD, Release Promotion & Environment Architecture

---

# 1. Part Objective

Part 01 established:

```text
Where does the application execute?
```

Part 02 established:

```text
What does the source application become after the build?
```

This Part moves to:

```text
How does that artifact safely become production?
```

The senior-level deployment model is:

```text
Code
  ↓
Validation
  ↓
Build
  ↓
Artifact
  ↓
Environment
  ↓
Release
  ↓
Traffic
  ↓
Observation
  ↓
Promotion / Rollback
```

A deployment is therefore not simply:

```text
git push
```

It is a controlled transition between application states.

---

# 2. Deployment vs Release

These concepts should be separated.

## Deployment

A deployment places a version of the application into an environment.

```text
Artifact
   ↓
Production infrastructure
```

## Release

A release determines when users actually receive or can access that version.

Conceptually:

```text
Version B deployed
       │
       ▼
Traffic still on Version A
       │
       ▼
Release Version B
```

This distinction enables strategies such as:

* canary releases
* blue-green deployment
* feature flags
* staged rollout

Therefore:

> **Deploying code and exposing code to users are not necessarily the same event.**

---

# 3. CI/CD Mental Model

A production pipeline can be represented as:

```text
Developer
    │
    ▼
Git Commit
    │
    ▼
CI
    │
    ├── Install
    ├── Type Check
    ├── Lint
    ├── Test
    ├── Build
    └── Verify
    │
    ▼
Artifact
    │
    ▼
Environment
    │
    ▼
Release
    │
    ▼
Production Traffic
```

CI answers:

> **Is this change safe to produce?**

CD answers:

> **How should the resulting artifact be delivered to an environment?**

---

# 4. Continuous Integration

CI should establish confidence before promotion.

Typical stages:

```text
Pull Request
    ↓
Dependency Installation
    ↓
Static Checks
    ↓
Tests
    ↓
Production Build
    ↓
Artifact Validation
```

The exact pipeline varies, but the architectural principle is:

> **The earlier an invalid change is detected, the smaller its production blast radius.**

---

# 5. Continuous Delivery vs Continuous Deployment

These terms are often confused.

### Continuous Delivery

The system keeps software in a state where it can be released safely.

```text
Build
 ↓
Validate
 ↓
Ready for production
```

A human or separate approval may trigger release.

### Continuous Deployment

Validated changes automatically proceed into production.

```text
Commit
 ↓
Validate
 ↓
Deploy
 ↓
Release
```

The distinction is organizational and operational, not merely technical.

---

# 6. Environment Architecture

A typical system may contain:

```text
Development
     ↓
Preview
     ↓
Staging
     ↓
Production
```

Each environment serves a different purpose.

| Environment | Primary Purpose                        |
| ----------- | -------------------------------------- |
| Development | Fast local iteration                   |
| Preview     | Validate a specific change             |
| Staging     | Production-like integration validation |
| Production  | Real user traffic                      |

The mistake is treating all environments as identical.

They should be:

> **similar enough to expose production failures, but isolated enough to prevent test activity from damaging production.**

---

# 7. Development Environment

Development optimizes for:

```text
developer speed
```

Typical characteristics:

* hot reload
* local services
* mock data
* development logging
* debugging tools

It may intentionally differ from production.

For example:

```text
local database
```

instead of:

```text
production database
```

The goal is fast feedback, not production fidelity.

---

# 8. Preview Environments

A preview environment maps a change to an isolated deployment.

Conceptually:

```text
Pull Request #123
       ↓
Preview #123
       ↓
Review / Test
```

This provides a valuable property:

> **The exact proposed application can be tested before production promotion.**

Preview environments are particularly useful for:

* UI review
* integration testing
* route validation
* product review
* QA
* stakeholder approval

---

# 9. Staging

Staging should approximate production where it matters.

For example:

```text
Production:
CDN → Runtime → Database → Auth → External APIs
```

Staging may resemble:

```text
Staging:
CDN → Runtime → Staging DB → Staging Auth → Test APIs
```

The infrastructure topology should be sufficiently similar to expose issues involving:

* caching
* routing
* environment configuration
* authentication
* rendering
* external dependencies
* scaling behavior

---

# 10. Production Isolation

Production should not share mutable state casually with staging.

Dangerous architecture:

```text
Staging
   │
   ▼
Production Database ❌
```

Safer:

```text
Staging
   │
   ▼
Staging Database

Production
   │
   ▼
Production Database
```

Isolation prevents:

* accidental data mutation
* destructive test operations
* schema incompatibility
* credential leakage
* environment confusion

---

# 11. Configuration by Environment

Each environment may require different values:

```text
Development:
API_URL=localhost

Staging:
API_URL=staging-api

Production:
API_URL=production-api
```

But configuration should be classified.

### Public configuration

May eventually reach the browser.

### Private configuration

Must remain server-side.

### Secret credentials

Require secure secret management.

The deployment system should make this distinction explicit.

---

# 12. Secrets Management

A production pipeline should not rely on:

```text
hardcoded secret
```

inside source code.

Bad:

```text
const API_KEY = "secret-value";
```

Better architecture:

```text
Secret Store
     ↓
Deployment Environment
     ↓
Server Runtime
```

Secrets should be:

* access-controlled
* auditable
* rotatable
* environment-specific

The key invariant:

```text
secret
   ≠
client configuration
```

---

# 13. Pull Request Validation

A robust flow begins before merge:

```text
Developer
   ↓
Pull Request
   ↓
CI
   ├── Type check
   ├── Lint
   ├── Unit tests
   ├── Integration tests
   └── Production build
   ↓
Review
   ↓
Merge
```

This prevents obvious failures from reaching the deployment stage.

---

# 14. Main Branch as a Release Candidate Source

A mature workflow often treats the main branch as:

```text
potentially releasable
```

rather than:

```text
random collection of unfinished work
```

This requires techniques such as:

* feature flags
* short-lived branches
* backward-compatible changes
* automated validation

The objective is:

```text
merge
 ↓
known-good artifact
```

rather than:

```text
merge
 ↓
hope production works
```

---

# 15. Feature Flags

Feature flags separate:

```text
code deployment
```

from:

```text
feature activation
```

Example:

```text
Version B deployed
       │
       ▼
Feature flag = OFF
       │
       ▼
Users still receive old behavior
```

Later:

```text
Feature flag = ON
```

This enables controlled activation without requiring a new deployment.

---

# 16. Feature Flag Architecture

Conceptually:

```text
                 Application
                      │
                      ▼
                Flag Evaluation
                      │
             ┌────────┴────────┐
             ▼                 ▼
           OFF                ON
             │                 │
        Old behavior      New behavior
```

Flags can be scoped by:

* environment
* organization
* user
* percentage
* region
* internal testers

But flag systems introduce complexity.

---

# 17. Feature Flag Debt

A feature flag that remains indefinitely creates:

```text
if flag:
    newPath()
else:
    oldPath()
```

Eventually:

```text
flag = permanently ON
```

but the old branch remains.

This creates:

* dead code
* testing combinations
* cognitive complexity
* operational confusion

Therefore feature flags should have lifecycle ownership:

```text
Create
  ↓
Activate
  ↓
Validate
  ↓
Remove old path
  ↓
Remove flag
```

---

# 18. Blue-Green Deployment

Blue-green deployment maintains two environments:

```text
BLUE
Version A

GREEN
Version B
```

Initially:

```text
Traffic
   ↓
BLUE
```

Deploy Version B:

```text
Traffic
   ↓
BLUE

GREEN
Version B
```

Validate GREEN.

Then switch traffic:

```text
Traffic
   ↓
GREEN
```

BLUE remains available for rollback.

---

# 19. Blue-Green Strengths

Advantages:

* fast traffic switching
* clear rollback path
* isolated validation
* reduced partial deployment state

Tradeoffs:

* duplicate infrastructure
* potentially higher cost
* data compatibility challenges
* cache complexity

The most important issue is:

> **The new environment must be compatible with shared dependencies.**

---

# 20. Canary Deployment

Canary deployment exposes a new version to a subset of traffic.

Conceptually:

```text
                 Users
                   │
             ┌─────┴─────┐
             ▼           ▼
        Version A      Version B
          95%            5%
```

Observe:

* error rates
* latency
* conversion
* crashes
* infrastructure health

If healthy:

```text
5%
 ↓
25%
 ↓
50%
 ↓
100%
```

If unhealthy:

```text
stop
 ↓
rollback
```

---

# 21. Canary Requires Observability

Without telemetry:

```text
deploy 5%
```

does not provide meaningful safety.

You need to know:

```text
Version A:
error rate = X

Version B:
error rate = Y
```

and potentially:

```text
latency
availability
business metrics
runtime errors
API failures
```

Therefore:

> **Canary deployment without comparative observability is incomplete.**

---

# 22. Rolling Deployment

A rolling deployment gradually replaces instances.

Suppose:

```text
Version A:
S1
S2
S3
S4
```

Deploy Version B:

```text
S1 → B
S2 → B
S3 → A
S4 → A
```

Then:

```text
S3 → B
S4 → B
```

Eventually:

```text
B
B
B
B
```

This reduces the need for a full simultaneous replacement.

But during rollout:

```text
Version A
+
Version B
```

may coexist.

Therefore compatibility matters.

---

# 23. Mixed-Version Compatibility

During a rollout:

```text
Request 1 → Version A
Request 2 → Version B
```

Both versions may access the same:

```text
database
cache
API
queue
```

Therefore schema and API changes should often be backward compatible.

A dangerous deployment:

```text
Version A expects field X
Version B deletes field X immediately
```

Possible failure:

```text
Version A → field X missing ❌
```

---

# 24. Expand-and-Contract Migration

A safer database evolution pattern:

```text
Phase 1:
Add new field
Keep old field
```

Then:

```text
Phase 2:
New application writes new field
```

Then:

```text
Phase 3:
Read new field
```

Then:

```text
Phase 4:
Remove old field
```

Conceptually:

```text
Old
 ↓
Expand
 ↓
Migrate
 ↓
Contract
```

This allows multiple application versions to coexist.

---

# 25. Deployment Ordering

For a full-stack application:

```text
Database
API
Application
Frontend
```

cannot always be deployed arbitrarily.

For example:

```text
Frontend v2
expects API v2
```

If API v2 is not available:

```text
Frontend v2 → API v1 ❌
```

A safe rollout might be:

```text
Backward-compatible API
        ↓
Frontend
        ↓
Remove old API support
```

The exact sequence depends on the architecture.

---

# 26. Deployment Health Checks

Before accepting traffic, verify:

```text
Application starts
      ↓
Health check
      ↓
Dependencies reachable
      ↓
Expected routes respond
      ↓
Ready for traffic
```

A health check should answer a specific operational question.

For example:

```text
liveness:
"Is this process alive?"

readiness:
"Can this instance safely receive traffic?"
```

These are not identical.

---

# 27. Liveness vs Readiness

### Liveness

```text
Is the process alive?
```

### Readiness

```text
Should traffic be routed here?
```

An application may be:

```text
alive = yes
ready = no
```

For example:

```text
application process running
but
required initialization incomplete
```

Routing traffic to an unready instance can create avoidable failures.

---

# 28. Deployment Gates

A release can have gates:

```text
Build
 ↓
Tests
 ↓
Security checks
 ↓
Artifact validation
 ↓
Staging
 ↓
Smoke tests
 ↓
Approval
 ↓
Production
```

Each gate reduces uncertainty.

But excessive gates can create:

* slow delivery
* manual bottlenecks
* operational friction

Therefore:

> **A deployment gate should reduce meaningful risk, not merely add ceremony.**

---

# 29. Smoke Testing

Smoke tests verify that the deployment is fundamentally alive.

For example:

```text
GET /
GET /login
GET /dashboard
GET /api/health
```

Possible checks:

```text
status = expected
response structure = expected
critical dependency = available
```

Smoke tests should focus on critical paths rather than attempting to replace comprehensive test suites.

---

# 30. Production Verification

After deployment:

```text
Deployment
   ↓
Production
   ↓
Verify
```

Verification can include:

* error rate
* response latency
* route health
* authentication
* critical business flows
* cache behavior
* client errors

This is sometimes called:

```text
post-deployment verification
```

The important principle is:

> **Deployment success means infrastructure accepted the artifact; it does not necessarily mean users are experiencing correct behavior.**

---

# 31. Rollback

A rollback should be operationally predictable.

Conceptually:

```text
Version A
   ↓
Version B
   ↓
Problem
   ↓
Rollback
   ↓
Version A
```

A mature rollback process answers:

```text
What version?
How quickly?
Who triggers it?
What happens to database changes?
What happens to caches?
What happens to active sessions?
```

---

# 32. Rollback Is Not Always Code Reversion

Consider:

```text
Version A
Database schema A

Version B
Database schema B
```

Rolling back:

```text
Application B → Application A
```

does not automatically restore:

```text
Database schema A
```

Therefore rollback strategy must include:

```text
application
+
database
+
cache
+
configuration
+
feature flags
```

---

# 33. Deployment Blast Radius

Every release has a blast radius.

A simple model:

```text
                 Release
                    │
         ┌──────────┼──────────┐
         ▼          ▼          ▼
       Users      Regions    Services
```

A deployment affecting:

```text
100% users
```

has a larger immediate blast radius than:

```text
1% users
```

This is one reason progressive delivery exists.

---

# 34. Progressive Delivery

Progressive delivery combines:

```text
deployment
+
observability
+
controlled exposure
```

Conceptually:

```text
Artifact
  ↓
Deploy
  ↓
1%
  ↓
Observe
  ↓
10%
  ↓
Observe
  ↓
50%
  ↓
Observe
  ↓
100%
```

This converts deployment from a single high-risk event into a sequence of measurable decisions.

---

# 35. Preview → Staging → Production

A practical release flow:

```text
Pull Request
     ↓
Preview
     ↓
Merge
     ↓
Build Artifact
     ↓
Staging
     ↓
Smoke / Integration Tests
     ↓
Production
```

The critical property is traceability:

```text
Preview
   ↓
same intended change
   ↓
production artifact
```

The closer the tested artifact is to the released artifact, the stronger the confidence.

---

# 36. Artifact Promotion

Prefer:

```text
Artifact A
   ↓
Staging
   ↓
Production
```

over:

```text
Source
   ↓
Staging build
   ↓
Source
   ↓
Production build
```

when the environment allows it.

The first model reduces:

```text
build drift
```

because the same artifact is promoted.

---

# 37. CI/CD Failure Modes

### Failure 1 — Build passes, deployment fails

Possible causes:

* invalid runtime configuration
* missing environment variable
* platform mismatch
* infrastructure failure

### Failure 2 — Deployment succeeds, application fails

Possible causes:

* runtime dependency failure
* incorrect configuration
* production-only data
* cache behavior
* authentication differences

### Failure 3 — Application works, users see old behavior

Possible causes:

* CDN cache
* browser cache
* stale deployment
* asset identity issue

### Failure 4 — New version works for some users only

Possible causes:

* progressive rollout
* mixed versions
* regional deployment differences
* stale caches
* inconsistent feature flags

---

# 38. Environment Drift

Suppose:

```text
Staging:
Node version A

Production:
Node version B
```

or:

```text
Staging:
Database version A

Production:
Database version C
```

Then:

```text
"works in staging"
```

may not predict production behavior.

Environment drift can involve:

* runtime versions
* environment variables
* infrastructure
* databases
* caches
* external services
* feature flags

The goal is to minimize uncontrolled drift.

---

# 39. Configuration Drift

Another failure mode:

```text
Staging:
FEATURE_X=true

Production:
FEATURE_X=false
```

The application behaves differently.

Configuration should therefore be:

```text
versioned where appropriate
auditable
explicit
environment-aware
```

---

# 40. Release Metadata

Every deployment should ideally identify:

```text
commit SHA
build ID
artifact ID
deployment timestamp
environment
configuration version
```

Then telemetry can answer:

```text
Which release generated this error?
```

rather than:

```text
Something changed recently.
```

---

# 41. Release Observability

A deployment dashboard might show:

```text
Release: 2026.09.21-42

Error rate       ↑
Latency          =
CPU              =
DB connections   ↑
Cache hit rate   ↓
```

The important operational capability is correlating changes with outcomes.

A release should be observable as a first-class production event.

---

# 42. Automatic Rollback

Some systems can automatically roll back when a release violates defined thresholds.

Conceptually:

```text
Deploy
  ↓
Observe
  ↓
Error rate > threshold
  ↓
Rollback
```

This is powerful but dangerous if:

* thresholds are noisy
* telemetry is delayed
* dependencies fail independently
* rollback itself is unsafe

Automation should therefore operate on reliable signals.

---

# 43. Four-Pillar Engineering Matrix

| Dimension                  | Senior Question                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| 🟢 When to use             | Which deployment strategy matches the risk and architecture?                                 |
| 🔴 When not to use         | When does progressive delivery or excessive environment complexity become counterproductive? |
| 🟡 Bottlenecks / tradeoffs | Infrastructure cost, rollout duration, compatibility, observability, operational complexity  |
| 🔵 Modern alternatives     | Canary, blue-green, rolling deployment, feature flags, managed CI/CD                         |

---

# 44. Prediction Challenges

### Challenge 1

Version B is deployed successfully, but 10% of traffic continues to use Version A.

What deployment strategy could produce this state intentionally?

---

### Challenge 2

Version B requires a new database column.

Why can deleting the old column during the same release be dangerous?

---

### Challenge 3

Staging passes all tests.

Production fails immediately because an environment variable is missing.

What class of deployment problem is this?

---

### Challenge 4

A deployment completes successfully, but users continue seeing old JavaScript.

What infrastructure layers should you inspect?

---

### Challenge 5

A canary release shows a large error-rate increase only for Version B.

What should happen before increasing traffic further?

---

# 45. Solutions

<details>
<summary>Challenge 1 — Solution</summary>

A canary or progressive deployment.

For example:

```text
Version A = 90%
Version B = 10%
```

</details>

<details>
<summary>Challenge 2 — Solution</summary>

Old application instances may still expect the column.

During rolling or canary deployment:

```text
Version A
+
Version B
```

can coexist.

The database must therefore support both versions during the transition.

</details>

<details>
<summary>Challenge 3 — Solution</summary>

Environment/configuration drift.

The deployment artifact may be valid, but the production runtime does not satisfy its configuration contract.

</details>

<details>
<summary>Challenge 4 — Solution</summary>

Investigate:

```text
browser cache
CDN cache
asset identity
deployment version
HTML cache
service worker, if present
```

</details>

<details>
<summary>Challenge 5 — Solution</summary>

Stop or reverse the rollout.

The canary exists specifically to detect such regressions before broad exposure.

---

# 46. Senior Interview Gotchas

### Gotcha 1

> "CI/CD means automatic production deployment."

Not necessarily.

CI/CD describes an engineering delivery pipeline. Continuous delivery and continuous deployment are distinct practices.

---

### Gotcha 2

> "Blue-green means zero downtime automatically."

Not necessarily.

Traffic switching may be fast, but compatibility, readiness, database migrations, caches, and dependencies can still cause downtime or errors.

---

### Gotcha 3

> "Rollback means deploy the previous commit."

Incomplete.

You must consider:

```text
database
configuration
cache
feature flags
external APIs
```

---

### Gotcha 4

> "Staging should be exactly the same as production."

Usually unrealistic.

The goal is:

```text
production-like where risk matters
```

while maintaining environment isolation.

---

### Gotcha 5

> "Canary means deploy to one server."

Not necessarily.

Canary is about controlled exposure of traffic or users, not merely the number of infrastructure instances.

---

# 47. Production Release Decision Framework

Before releasing a Next.js application, ask:

```text
1. What artifact are we releasing?
        ↓
2. Is the artifact traceable to a commit?
        ↓
3. Has the exact artifact been validated?
        ↓
4. What environment receives it first?
        ↓
5. What traffic receives it?
        ↓
6. How will we know it is healthy?
        ↓
7. What thresholds trigger rollback?
        ↓
8. Are old and new versions compatible?
        ↓
9. What happens to database/schema state?
        ↓
10. What happens to caches?
        ↓
11. How do we restore the previous version?
```

---

# 48. Production Reference Architecture

```text
                         Git
                          │
                          ▼
                       CI/CD
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
          Checks        Build       Security
             │            │            │
             └────────────┼────────────┘
                          ▼
                     Artifact
                          │
                          ▼
                       Staging
                          │
                  ┌───────┴────────┐
                  ▼                ▼
               Smoke            Integration
                Tests              Tests
                  │                │
                  └───────┬────────┘
                          ▼
                     Production
                          │
                    Progressive
                     Exposure
                          │
                          ▼
                       Users
                          │
                          ▼
                    Observability
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
          Healthy                   Unhealthy
             │                         │
             ▼                         ▼
         Increase                   Rollback
          Traffic
```

---

# 49. Core Invariants

Remember:

```text
deployment ≠ release

build ≠ deployment

artifact ≠ environment

staging ≠ production

deployment success ≠ user success

rollback ≠ source-code reversal

feature activation ≠ code deployment

canary ≠ simply one server

traffic control requires observability

mixed application versions require compatibility

database migration is part of deployment architecture

configuration is part of the release contract

```

---

# 50. Final Senior-Level Mental Model

Think of deployment as a state transition:

```text
                    VERSION A
                        │
                        │
                 ┌──────▼──────┐
                 │   Artifact  │
                 └──────┬──────┘
                        │
                     Validate
                        │
                        ▼
                    VERSION B
                        │
                    Deploy
                        │
                        ▼
                  Controlled Traffic
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
           Healthy             Unhealthy
              │                   │
              ▼                   ▼
          Increase              Rollback
           Exposure                │
              │                   ▼
              ▼                VERSION A
          100% Traffic
```

The senior engineer is responsible for understanding not just:

```text
"How do we deploy?"
```

but:

```text
"What guarantees do we have
when we move users from A to B?"
```

That is the core of production deployment engineering.

---

# 51. Part Boundary

This Part established:

* CI/CD architecture
* environments
* preview deployments
* staging
* production isolation
* secrets
* deployment vs release
* feature flags
* blue-green deployment
* canary deployment
* rolling deployment
* progressive delivery
* health checks
* readiness vs liveness
* smoke testing
* artifact promotion
* environment drift
* configuration drift
* rollback
* backward-compatible migrations
* release observability
* deployment gates
* automatic rollback concepts

The next Part should move from:

```text
RELEASING THE ARTIFACT
```

to:

```text
WHERE AND HOW THE APPLICATION RUNTIME OPERATES IN PRODUCTION
```

The next architectural layer is:

**Hosting Models, Serverless, Containers, Edge Runtime & Runtime Constraints.**
