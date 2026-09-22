# Level 08 — KPI 11 — Part 09

## Deployment Observability, Logging, Metrics, Tracing, SLOs & Production Verification

### Part Objective

A deployment is not complete when the new version reaches production.

A production deployment is complete only when you can answer:

* Did the new version start correctly?
* Did it become ready?
* Did traffic shift correctly?
* Did latency change?
* Did error rates change?
* Did resource consumption change?
* Did dependencies remain healthy?
* Did the user experience regress?
* Is the deployment safe to continue?
* Should the rollout be paused or reversed?

This part establishes the observability architecture required to answer those questions.

The central model is:

```text
Deployment
    ↓
Runtime
    ↓
Traffic
    ↓
Dependencies
    ↓
User Experience
    ↓
Telemetry
    ↓
Verification
    ↓
Decision
    ↓
Continue / Pause / Roll Back
```

The key principle is:

> **A deployment is an operational experiment whose outcome must be observable.**

---

# 1. Deployment Observability Mental Model

Normal application observability asks:

> "Is the system working?"

Deployment observability asks:

> "Did the system continue working after this change?"

That distinction matters.

Suppose production latency is:

```text
200 ms
```

Then a deployment occurs.

After deployment:

```text
350 ms
```

The raw metric tells you:

```text
latency increased
```

Deployment observability should help establish:

```text
which version changed
which instances changed
which routes changed
which dependencies changed
when the change occurred
whether the change is statistically meaningful
whether the increase affects the SLO
```

Therefore deployment telemetry needs **change context**.

---

# 2. Deployment Identity

Every production runtime should be associated with a release identity.

Useful identifiers include:

```text
deployment_id
release_id
version
commit_sha
build_id
environment
region
instance
```

Conceptually:

```text
Request
   ↓
Instance
   ↓
Version
   ↓
Build
   ↓
Deployment
```

Without this relationship, debugging becomes:

```text
"Something got slower."
```

With it:

```text
"Checkout latency increased for version B after deployment D."
```

That difference dramatically reduces investigation time.

---

# 3. Four Observability Signals

Production observability is commonly organized around:

```text
Logs
Metrics
Traces
Events
```

They answer different questions.

| Signal            | Primary question             |
| ----------------- | ---------------------------- |
| Logs              | What happened?               |
| Metrics           | How often/how much?          |
| Traces            | Where did time/errors occur? |
| Deployment events | What changed and when?       |

They should work together rather than independently.

---

# 4. Logs

Logs represent individual or grouped events.

Example:

```json
{
  "level": "error",
  "event": "request_failed",
  "route": "/api/orders",
  "status": 500,
  "version": "release-842",
  "region": "us-east",
  "request_id": "req-123"
}
```

The important principle is:

> Logs should contain enough structured context to connect an event to a deployment, request, runtime, and dependency.

---

# 5. Structured Logging

Production logs should generally be machine-readable.

Prefer:

```json
{
  "event": "deployment_ready",
  "version": "abc123",
  "region": "eu-west"
}
```

over:

```text
deployment abc123 is ready in eu-west
```

Structured logging enables:

* filtering
* aggregation
* querying
* correlation
* automated alerting
* incident analysis

But structured does not mean:

> log everything.

---

# 6. Logging Levels

A practical model:

```text
DEBUG
INFO
WARN
ERROR
```

Production logging should be deliberate.

For example:

### INFO

```text
deployment_started
deployment_ready
runtime_draining
```

### WARN

```text
dependency_degraded
retry_threshold_increased
cache_miss_spike
```

### ERROR

```text
request_failure
database_failure
deployment_verification_failure
```

Debug-level logging may be enabled selectively when investigating an incident.

---

# 7. High-Cardinality Logging

Be careful with identifiers such as:

```text
user_id
request_id
session_id
trace_id
URL
query string
```

These can produce extremely large cardinality.

High-cardinality fields are useful for:

```text
logs
traces
debugging
```

but may be expensive or inappropriate as:

```text
metric labels
```

For example, this metric is dangerous:

```text
request_count{user_id="123"}
```

if millions of users exist.

A better metric might be:

```text
request_count{route="/orders",status="500"}
```

while the user/request ID remains in logs or traces.

---

# 8. Metrics

Metrics summarize system behavior numerically.

Typical deployment metrics include:

```text
request rate
error rate
latency
CPU
memory
saturation
instance count
startup duration
readiness failures
restart count
```

A useful production model is:

```text
Traffic
Errors
Latency
Saturation
```

Often referred to as the four golden signals.

---

# 9. Traffic

Traffic measures workload volume.

Examples:

```text
requests_per_second
requests_per_minute
active_connections
queue_depth
```

Suppose:

```text
before deployment:
10,000 req/min

after deployment:
20,000 req/min
```

A raw error-count comparison would be misleading.

Instead compare normalized values:

```text
error rate
```

rather than simply:

```text
error count
```

---

# 10. Error Rate

Consider:

```text
Before:
100 errors / 100,000 requests
= 0.1%

After:
200 errors / 200,000 requests
= 0.1%
```

Absolute errors doubled.

Error rate did not.

Therefore deployment analysis should distinguish:

```text
absolute volume
```

from:

```text
normalized rate
```

---

# 11. Latency

Average latency is often insufficient.

Suppose:

```text
99 requests = 50 ms
1 request  = 5 seconds
```

Average latency hides the tail.

Production systems commonly examine percentiles:

```text
p50
p90
p95
p99
```

The tail is particularly important for:

* user-facing requests
* dependency calls
* SSR
* API routes
* Server Actions
* database operations

---

# 12. Why Percentiles Matter

Suppose:

```text
p50 = 100 ms
p95 = 180 ms
p99 = 3,000 ms
```

Most requests are fast.

A small but important population is extremely slow.

A deployment can therefore appear healthy at p50 while severely damaging tail latency.

This is why production verification should examine the relevant latency distribution rather than one aggregate number.

---

# 13. Saturation

Saturation describes how close the system is to capacity.

Examples:

```text
CPU utilization
memory utilization
connection pool utilization
database connections
queue depth
worker concurrency
thread/event-loop pressure
```

A deployment may leave:

```text
error rate = unchanged
```

while increasing:

```text
CPU = 50% → 85%
```

This can be an early warning.

The system works now but has less operational headroom.

---

# 14. Deployment Metrics

Deployment-specific metrics should include:

```text
deployment_duration
time_to_ready
startup_duration
readiness_failure_count
instances_started
instances_ready
instances_draining
instances_failed
rollback_count
```

These metrics reveal whether the deployment mechanism itself is healthy.

For example:

```text
deployment duration:
4 min → 12 min
```

could indicate:

* slower startup
* readiness failures
* dependency problems
* insufficient capacity
* infrastructure issues

---

# 15. Lifecycle Metrics

From Part 08, lifecycle transitions should be observable.

Useful measurements:

```text
startup_duration
initialization_duration
readiness_duration
drain_duration
shutdown_duration
forced_shutdown_count
restart_count
```

A deployment can be functionally correct but operationally unhealthy if:

```text
startup_duration
```

keeps increasing.

---

# 16. Deployment Events

Metrics show state.

Events show change.

Useful events:

```text
deployment_started
artifact_promoted
deployment_instance_started
instance_ready
traffic_shift_started
traffic_shift_completed
deployment_paused
deployment_rolled_back
deployment_completed
```

These events should be timestamped.

Then a dashboard can show:

```text
12:00 deployment started
12:01 instances ready
12:02 traffic shifted
12:03 p99 latency ↑
12:04 rollback
```

This establishes temporal correlation.

---

# 17. Correlation IDs

A request may traverse:

```text
Browser
  ↓
CDN
  ↓
Next.js runtime
  ↓
API
  ↓
Database
  ↓
External service
```

A correlation mechanism allows the same logical request to be followed across components.

Conceptually:

```text
request_id
trace_id
span_id
```

The exact implementation varies, but the architectural purpose is:

```text
one logical operation
        ↓
multiple system components
        ↓
one observable execution path
```

---

# 18. Distributed Tracing

A trace represents an end-to-end operation.

Example:

```text
GET /products/123
│
├── middleware        2ms
├── server render    30ms
│
├── product API      15ms
│
├── database         10ms
│
└── recommendation   80ms
```

Now the performance problem is visible:

```text
recommendation = 80ms
```

rather than merely:

```text
request = 140ms
```

---

# 19. Deployment-Aware Tracing

Traces should contain release context.

For example:

```text
trace:
  route=/checkout
  version=release-842
  region=eu-west
```

This enables comparisons:

```text
Version A:
p95 = 220ms

Version B:
p95 = 340ms
```

for the same operation.

This is far more useful than comparing global production latency without version context.

---

# 20. Trace Sampling

Tracing every request can be expensive at large scale.

Therefore systems may sample traces.

Possible strategies:

```text
head sampling
tail sampling
error-biased sampling
latency-biased sampling
```

For deployment verification, it is often useful to retain traces for:

* errors
* slow requests
* important business operations
* sampled normal traffic

The tradeoff is:

```text
observability coverage
        vs
telemetry cost
```

---

# 21. Observability Cardinality

Consider:

```text
metric:
http_latency{route,user_id,request_id,query}
```

This can create an enormous number of unique time series.

Instead use bounded dimensions:

```text
route
method
status_class
region
version
```

and preserve high-cardinality identifiers in traces/logs.

The architectural principle:

> Put dimensions where their cardinality and query value are appropriate.

---

# 22. Deployment Dashboards

A deployment dashboard should answer:

### Release

```text
What version is deployed?
```

### Traffic

```text
How much traffic is receiving it?
```

### Errors

```text
Are errors increasing?
```

### Latency

```text
Are tails getting worse?
```

### Saturation

```text
Is capacity becoming constrained?
```

### Dependencies

```text
Are databases/cache/external APIs healthy?
```

### Lifecycle

```text
Are instances starting, becoming ready, or failing?
```

### User experience

```text
Are browser-facing performance signals changing?
```

---

# 23. Release Markers

A deployment should create an observable marker.

For example:

```text
---------------- Deployment ---------------->
                     |
                     v
                 release-842
                     |
          -----------------------
          |          |          |
        latency    errors     CPU
```

Without the marker, an engineer must manually infer whether the deployment caused the change.

With it, change correlation becomes immediate.

---

# 24. SLI — Service Level Indicator

An SLI is a quantitative measurement of service behavior.

Examples:

```text
successful request ratio
request latency
availability
freshness
```

For a web application:

```text
SLI =
successful requests
-------------------
eligible requests
```

The exact definition must reflect the actual service contract.

---

# 25. SLO — Service Level Objective

An SLO defines the target for an SLI.

For example:

```text
99.9% of eligible requests succeed
```

or:

```text
99% of checkout requests complete under 500 ms
```

An SLO turns:

```text
"the system should be reliable"
```

into a measurable operational objective.

---

# 26. SLOs and Deployments

A deployment should be evaluated against service objectives.

Suppose:

```text
SLO:
99.9% success
```

Before deployment:

```text
99.95%
```

After deployment:

```text
99.7%
```

The deployment has crossed the operational objective.

The exact response depends on organizational policy, but observability should make the violation visible.

---

# 27. Error Budgets

If the SLO is:

```text
99.9%
```

then the allowed failure budget is:

```text
0.1%
```

This is the error budget.

Deployment decisions can use it as an operational constraint.

Conceptually:

```text
Healthy budget
     ↓
deployment risk
     ↓
budget consumption
```

A deployment that rapidly consumes the available error budget deserves increased scrutiny.

---

# 28. SLOs Must Match User Impact

A metric can look healthy while the user experience is bad.

For example:

```text
API availability = 99.99%
```

while:

```text
checkout completion = significantly degraded
```

Therefore important user journeys may need dedicated indicators.

Examples:

```text
login success
checkout success
search success
page render success
mutation success
```

The important question is:

> What service behavior actually matters to users?

---

# 29. Deployment Verification Layers

Production verification should happen at multiple levels.

```text
Layer 1: Process
Layer 2: Health
Layer 3: Application
Layer 4: Dependency
Layer 5: User experience
```

### Process

```text
Did instances start?
```

### Health

```text
Did they become ready?
```

### Application

```text
Do important routes work?
```

### Dependency

```text
Are DB/cache/external services healthy?
```

### User experience

```text
Did real users experience regressions?
```

No single layer is sufficient.

---

# 30. Smoke Tests

Smoke tests validate basic functionality after deployment.

Examples:

```text
GET /
GET /products
GET /api/health
POST /api/test-operation
```

They should verify critical paths without becoming a full test suite.

A smoke test answers:

> "Does the deployed version fundamentally work?"

It does not prove:

> "The production system is completely healthy."

---

# 31. Synthetic Monitoring

Synthetic monitoring generates controlled requests.

Example:

```text
Every 1 minute:
  open homepage
  load product
  execute search
  test login flow
```

Advantages:

* predictable
* repeatable
* available even with low real traffic
* useful for critical journeys

Limitations:

* synthetic users may not represent real users
* test paths may miss real traffic patterns
* geographic coverage may differ

Therefore synthetic monitoring complements RUM.

---

# 32. Real User Monitoring

RUM observes actual users.

Useful signals include:

```text
LCP
INP
CLS
navigation latency
resource failures
JavaScript errors
route transition performance
```

For deployment verification:

```text
Version A
   vs
Version B
```

can be compared across actual users.

This provides a user-facing view of deployment impact.

---

# 33. Backend vs Frontend Deployment Verification

A frontend deployment can be healthy on the server while the browser experience is degraded.

Example:

```text
HTTP 200
server latency good
```

but:

```text
JavaScript bundle ↑
hydration ↑
LCP ↑
INP ↑
```

Therefore production verification should span:

```text
backend
+
browser
```

This is especially important for Next.js because a deployment may change:

* server rendering
* client bundles
* hydration
* images
* fonts
* data fetching
* streaming
* route transitions

---

# 34. Deployment Verification by Route

Global averages can hide route-specific failures.

Suppose:

```text
Global error rate = 0.2%
```

but:

```text
/checkout = 8%
```

If checkout represents a smaller traffic percentage, the global metric can appear healthy.

Therefore important routes should have route-level observability.

Useful dimensions:

```text
route
operation
status
version
region
```

---

# 35. Dependency Observability

Deployment verification should inspect dependencies.

For:

```text
Next.js
 ↓
PostgreSQL
 ↓
Redis
 ↓
Payment API
```

monitor:

```text
DB latency
DB errors
DB connections
Redis latency
Redis errors
payment API latency
payment API failures
```

Otherwise a deployment regression can be incorrectly attributed.

Example:

```text
application latency ↑
```

may actually result from:

```text
database latency ↑
```

with no application-code regression.

---

# 36. Change Correlation

A production event should be correlated with all relevant changes.

Potential change sources:

```text
application deployment
configuration change
feature flag
database migration
infrastructure change
CDN configuration
dependency release
```

Suppose latency increases at:

```text
14:05
```

and application deployment occurred at:

```text
14:00
```

but a database configuration change occurred at:

```text
14:04
```

Deployment observability should allow engineers to see both.

Otherwise:

```text
nearest timestamp
```

can be mistaken for:

```text
root cause
```

---

# 37. Canary Verification

A canary deployment sends a limited amount of traffic to a new version.

Example:

```text
Version A → 95%
Version B → 5%
```

Observe:

```text
error rate
latency
resource usage
business metrics
```

If healthy:

```text
10%
25%
50%
100%
```

The important architectural principle is:

> Increase exposure only when evidence supports doing so.

---

# 38. Canary Metrics

A useful canary comparison is:

| Signal             |   Stable |   Canary |
| ------------------ | -------: | -------: |
| Request rate       | baseline | expected |
| Error rate         | baseline |  compare |
| p95 latency        | baseline |  compare |
| p99 latency        | baseline |  compare |
| CPU                | baseline |  compare |
| Memory             | baseline |  compare |
| Dependency latency | baseline |  compare |
| Business success   | baseline |  compare |

The comparison should control for:

* traffic mix
* region
* route
* time
* workload
* user population

---

# 39. Canary Analysis Pitfall

Suppose:

```text
Stable:
p95 = 200 ms

Canary:
p95 = 240 ms
```

Is that automatically a regression?

Not necessarily.

The canary may receive:

* heavier traffic
* different geographic traffic
* different routes
* different user cohorts

Therefore deployment analysis needs contextual comparisons.

A senior engineer asks:

> Are we comparing equivalent workloads?

---

# 40. Rollback Signals

A deployment may have predefined rollback triggers.

Examples:

```text
5xx rate > threshold
p99 latency > threshold
critical journey failure > threshold
readiness failures > threshold
resource saturation > threshold
```

The threshold should correspond to:

```text
user impact
SLO
risk tolerance
```

Avoid using arbitrary metrics without understanding their operational meaning.

---

# 41. Automated Rollback

A mature deployment system can automatically stop or reverse a rollout when verification fails.

Conceptually:

```text
Deploy
  ↓
Canary
  ↓
Observe
  ↓
Healthy?
 ┌───────┴───────┐
YES              NO
 ↓                ↓
Expand          Pause/Rollback
```

Automation is useful because:

```text
detection time ↓
human reaction time ↓
blast radius ↓
```

But automation must be based on reliable signals.

Bad telemetry produces bad automated decisions.

---

# 42. Observability Failure Modes

Observability itself can fail.

Examples:

### Missing release labels

You cannot identify which version caused a regression.

### Excessive sampling

Important failures disappear from traces.

### High cardinality

Telemetry becomes expensive or unusable.

### Missing route dimensions

Critical endpoint regressions disappear into global averages.

### Missing dependency telemetry

Root cause becomes ambiguous.

### Delayed telemetry

Operators see incidents too late.

### No deployment markers

Change correlation becomes difficult.

Observability must therefore be treated as production infrastructure.

---

# 43. Deployment Observability Architecture

A complete model:

```text
                  Deployment
                      │
                      ▼
                Release Identity
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
      Logs         Metrics        Traces
        │             │             │
        └─────────────┼─────────────┘
                      ↓
              Deployment Events
                      │
                      ↓
              Verification Layer
                      │
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
     Backend       Dependencies      RUM
        │             │              │
        └─────────────┼──────────────┘
                      ↓
                    SLOs
                      │
                      ↓
              Release Decision
                      │
              ┌───────┴───────┐
              ↓               ↓
           Continue         Rollback
```

---

# 44. Production Verification Sequence

A practical verification sequence:

```text
1. Artifact deployed
        ↓
2. Runtime starts
        ↓
3. Runtime becomes ready
        ↓
4. Health checks pass
        ↓
5. Smoke tests pass
        ↓
6. Canary traffic begins
        ↓
7. Metrics monitored
        ↓
8. Dependencies monitored
        ↓
9. User-facing metrics monitored
        ↓
10. SLO impact evaluated
        ↓
11. Rollout expands
```

This creates progressive confidence.

---

# 45. Observability for Deployment Lifecycle

Tie together the previous part:

```text
STARTING
   │
   ├── startup_duration
   │
INITIALIZING
   │
   ├── initialization failures
   │
READY
   │
   ├── readiness duration
   │
SERVING
   │
   ├── request rate
   ├── error rate
   ├── latency
   └── saturation
   │
DRAINING
   │
   ├── active requests
   └── drain duration
   │
SHUTDOWN
   │
   └── forced shutdown
```

This creates observability across the entire runtime lifecycle.

---

# 46. Deployment Provenance

Every production request should ideally be traceable to a deployed artifact.

Conceptually:

```text
Git commit
   ↓
Build
   ↓
Artifact
   ↓
Release
   ↓
Deployment
   ↓
Runtime
   ↓
Request
```

This creates provenance.

If an incident occurs:

```text
request → version → build → commit
```

becomes possible.

Without provenance:

```text
production version
```

may be difficult to map back to:

```text
source change
```

---

# 47. Configuration Change Observability

Not all regressions originate in code.

A deployment can change:

```text
environment variables
feature flags
runtime configuration
```

Therefore telemetry should expose configuration identity without exposing secrets.

For example:

```text
config_version=42
feature_set=checkout-v3
```

rather than:

```text
DATABASE_PASSWORD=...
```

This allows:

```text
behavior
   ↓
configuration version
```

to be correlated safely.

---

# 48. Feature Flag Observability

Feature flags create multiple runtime populations.

Example:

```text
Version B
   ├── flag OFF
   └── flag ON
```

If the flag-on population experiences higher latency, aggregate metrics may hide it.

Therefore important feature flags should be represented in appropriate observability dimensions.

Potential dimensions:

```text
feature_variant
release
route
region
```

Again, keep cardinality bounded.

---

# 49. Database Migration Observability

Database migrations need their own telemetry.

Track:

```text
migration_started
migration_completed
migration_duration
migration_failed
rows_processed
lock_wait
replication_lag
```

During deployment, observe:

```text
application version
+
migration state
+
database health
```

This is particularly important for expand-contract migrations.

---

# 50. CDN and Edge Observability

For Next.js deployments, requests may pass through CDN infrastructure.

Useful signals include:

```text
cache hit ratio
cache miss ratio
edge latency
origin latency
origin errors
region
status code
cache status
```

Suppose:

```text
application latency = normal
```

but:

```text
CDN cache hit ratio ↓
```

Then users may still experience increased latency because more requests reach the origin.

Deployment observability must therefore cover the complete delivery path.

---

# 51. Production Incident Timeline

A useful incident timeline might look like:

```text
09:58  deployment started
10:00  new runtime ready
10:01  canary 5%
10:02  p95 latency +5%
10:03  database latency +30%
10:04  checkout success -2%
10:05  canary paused
10:06  investigation
10:08  rollback started
10:10  error rate normal
```

This is much more actionable than:

```text
"Deployment caused issues."
```

---

# 52. Deployment Verification and User Impact

Technical metrics should eventually map to user impact.

Example:

```text
CPU ↑
```

is an infrastructure signal.

But:

```text
checkout latency ↑
```

is closer to user impact.

And:

```text
checkout completion ↓
```

is a business outcome.

A mature observability architecture connects:

```text
Infrastructure
      ↓
Application
      ↓
User experience
      ↓
Business outcome
```

---

# 53. SLO Hierarchy

Different system layers may have different objectives.

```text
Platform SLO
     ↓
Application SLO
     ↓
Route SLO
     ↓
Critical journey SLO
```

For example:

```text
Application:
99.9% successful requests

Checkout:
99.95% successful checkout operations
```

The more critical the operation, the more specific the measurement may need to become.

---

# 54. Error Budget and Release Velocity

Error budgets can inform release behavior.

Conceptually:

```text
Large remaining budget
        ↓
more room for controlled change

Low remaining budget
        ↓
higher operational caution
```

This is not simply:

```text
budget = permission to break things
```

Instead:

```text
error budget = measurable tolerance for service unreliability
```

The engineering goal remains controlled change within reliability objectives.

---

# 55. Production Verification Checklist

### Release identity

* [ ] Every deployment has a unique release identity.
* [ ] Runtime instances expose version/build information safely.
* [ ] Requests can be associated with releases.
* [ ] Deployment events are timestamped.

### Logs

* [ ] Logs are structured.
* [ ] Lifecycle events are recorded.
* [ ] Errors include useful context.
* [ ] Secrets are never logged.
* [ ] High-cardinality fields are handled appropriately.

### Metrics

* [ ] Request rate is measurable.
* [ ] Error rate is measurable.
* [ ] Latency percentiles are measurable.
* [ ] Saturation is measurable.
* [ ] Deployment lifecycle metrics exist.
* [ ] Route-level metrics exist where necessary.

### Tracing

* [ ] Important request paths are traceable.
* [ ] Dependencies appear as spans.
* [ ] Release identity is available.
* [ ] Error/slow traces are retained appropriately.

### SLO

* [ ] SLIs represent real service behavior.
* [ ] SLOs represent meaningful objectives.
* [ ] Error budgets are measurable.
* [ ] Critical user journeys have appropriate indicators.

### Verification

* [ ] Smoke tests exist.
* [ ] Synthetic monitoring exists where needed.
* [ ] RUM is available for frontend experience.
* [ ] Canary verification is possible.
* [ ] Rollback signals are defined.
* [ ] Deployment dashboards show change context.

---

# 56. Senior Prediction Challenges

## Challenge 1

Error rate remains unchanged after deployment, but p99 latency doubles.

Is the deployment healthy?

**Reasoning target:**

Error rate alone is insufficient. Tail latency may represent a serious user-facing regression.

---

## Challenge 2

Global error rate is 0.1%, but `/checkout` has an 8% error rate.

What should you investigate?

**Reasoning target:**

Global averages can hide route-specific failures.

---

## Challenge 3

Canary latency increases from 200 ms to 250 ms.

What additional information do you need before concluding the deployment caused a regression?

**Reasoning target:**

Compare equivalent workloads, routes, regions, traffic distributions, and dependency behavior.

---

## Challenge 4

CPU increases from 40% to 80%, but latency and errors remain stable.

Is that necessarily a user-visible incident?

**Reasoning target:**

Not necessarily, but reduced capacity headroom can indicate increased deployment risk.

---

## Challenge 5

A deployment has no application errors, but RUM shows LCP increasing.

What might have changed?

**Reasoning target:**

Frontend assets, image delivery, rendering, hydration, network behavior, or client bundle size may have regressed.

---

## Challenge 6

The application logs show an error, but no trace exists.

What might have happened?

**Reasoning target:**

Sampling, instrumentation gaps, trace propagation failure, or telemetry pipeline issues.

---

## Challenge 7

A rollback restores error rates but not latency.

What does that suggest?

**Reasoning target:**

The application release may not be the only change involved. Investigate dependencies, infrastructure, configuration, CDN, and traffic conditions.

---

# 57. Senior Interview Questions

You should be able to answer:

### Observability

1. What are the four golden signals?
2. When would you use logs vs metrics vs traces?
3. Why are high-cardinality metric labels dangerous?
4. How would you correlate a production regression with a deployment?

### Deployment

5. What metrics should be watched during a canary?
6. How would you define rollback conditions?
7. Why is release identity important?
8. How would you distinguish code regressions from dependency regressions?

### SLOs

9. What is the difference between an SLI and an SLO?
10. What is an error budget?
11. Why should critical user journeys have dedicated indicators?
12. Why can global availability hide important failures?

### Frontend

13. How can a Next.js deployment be backend-healthy but frontend-unhealthy?
14. Which browser metrics are useful for deployment verification?
15. How would you investigate a sudden LCP regression after deployment?

### Distributed systems

16. How do traces help diagnose cross-service latency?
17. How should deployment observability handle multi-region systems?
18. How do you prevent telemetry from becoming a production bottleneck?

---

# 58. Production Architecture Exercise

Design deployment verification for:

```text
Next.js
    ↓
CDN
    ↓
Application runtime
    ↓
PostgreSQL
    ↓
Redis
    ↓
Payment provider
```

The deployment strategy is:

```text
5% canary
25%
50%
100%
```

Define:

### Metrics

```text
Which metrics are mandatory?
```

### Traces

```text
Which operations require tracing?
```

### Logs

```text
Which deployment lifecycle events must be logged?
```

### SLOs

```text
Which user-facing behaviors receive SLOs?
```

### Rollback

```text
What signals stop the rollout?
```

### RUM

```text
Which browser metrics are compared between versions?
```

### Dependencies

```text
How do you distinguish an application regression from a PostgreSQL or payment-provider regression?
```

A strong answer should produce a complete:

```text
Deployment
   ↓
Release identity
   ↓
Canary
   ↓
Telemetry
   ↓
SLO evaluation
   ↓
Decision
   ↓
Expand / Pause / Rollback
```

architecture.

---

# 59. Core Deployment Observability Invariants

### Invariant 1

```text
change without observability = uncontrolled change
```

### Invariant 2

```text
metrics without release identity = weak deployment diagnosis
```

### Invariant 3

```text
global averages can hide critical route failures
```

### Invariant 4

```text
error rate alone does not describe system health
```

### Invariant 5

```text
latency distributions matter more than averages for tail-sensitive systems
```

### Invariant 6

```text
health telemetry and user-experience telemetry answer different questions
```

### Invariant 7

```text
deployment verification must include dependencies
```

### Invariant 8

```text
frontend deployments require browser-side verification
```

### Invariant 9

```text
automated rollback is only as good as its signals
```

### Invariant 10

```text
observability is part of production architecture, not an afterthought
```

---

# 60. Final Mental Model

The complete deployment verification system is:

```text
                 SOURCE CHANGE
                       │
                       ▼
                    BUILD
                       │
                       ▼
                    RELEASE
                       │
                       ▼
                  DEPLOYMENT
                       │
                       ▼
                RUNTIME LIFECYCLE
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
      Logs          Metrics         Traces
        │              │              │
        └──────────────┼──────────────┘
                       ↓
               Deployment Events
                       │
        ┌──────────────┼───────────────┐
        ↓              ↓               ↓
    Application     Dependencies      RUM
        │              │               │
        └──────────────┼───────────────┘
                       ↓
                    SLIs
                       │
                       ▼
                    SLOs
                       │
                       ▼
                Error Budget
                       │
                       ▼
             Deployment Decision
                /            \
               /              \
          CONTINUE          ROLLBACK
```

The senior-level mental model is:

> **Observability converts deployment from an act of faith into an evidence-driven operational process.**

The deployment lifecycle therefore becomes:

```text
Change
  ↓
Deploy
  ↓
Observe
  ↓
Compare
  ↓
Verify
  ↓
Decide
  ↓
Expand or Roll Back
```

And the deepest connection to the previous part is:

```text
Part 08:
Can the runtime start, serve, drain, and shut down safely?

Part 09:
Can we prove that it did so correctly in production?
```

That distinction is fundamental to SDE-2 deployment architecture.

---

# Part Boundary

### This part owns

```text
Deployment observability
Structured logging
Metrics
Latency/error/traffic/saturation
Distributed tracing
Release identity
Deployment events
Correlation
SLIs
SLOs
Error budgets
Smoke testing
Synthetic monitoring
RUM
Canary verification
Rollback signals
Production verification
Deployment dashboards
Observability failure modes
```

### This part does not own

```text
Detailed CI/CD implementation
Deployment strategy mechanics
Runtime lifecycle mechanics
CDN implementation
Network topology
Secrets/configuration architecture
Full deployment architecture synthesis
```

Those are covered by the surrounding KPI parts.

---

# KPI 11 Completion Transition

With Part 09 complete, the final remaining section is:

## Part 10 — Production Deployment Architecture Capstone

Part 10 will integrate:

```text
Build
 ↓
Artifact
 ↓
Release
 ↓
Environment
 ↓
Deployment strategy
 ↓
Runtime topology
 ↓
Global delivery
 ↓
Networking
 ↓
Configuration
 ↓
Lifecycle
 ↓
Observability
 ↓
Production verification
 ↓
Rollback / Promotion
```

The purpose of Part 10 is not to introduce another isolated deployment concept.

It is to prove that you can **design, reason about, debug, and defend an end-to-end production deployment architecture at SDE-2 level**.
