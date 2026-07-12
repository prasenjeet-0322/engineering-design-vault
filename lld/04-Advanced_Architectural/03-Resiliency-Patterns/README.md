# 🛡️ Advanced Resiliency Patterns

When transitioning from monolithic to distributed microservice architectures, the foundational assumption must change from "The network is reliable" to **"The network is hostile and components will constantly fail."**

These folders contain the industry-standard High-Level Design (HLD) Resiliency Patterns implemented physically in Low-Level Design (LLD) logic.

### 1. Circuit Breaker (`01-Circuit-Breaker`)
The ultimate defense against Cascading Failures. If a downstream microservice experiences latency, the proxy wrapper "trips" and blocks all incoming requests instantly (Fast Failure). This prevents cascading Thread Pool Exhaustion across the entire network.
* *Enterprise Framework: Spring Cloud CircuitBreaker, Resilience4j.*

### 2. Retry with Exponential Backoff (`02-Retry-Backoff`)
Handles Transient Failures (e.g., temporary network jitter). If a DB query fails, we wait 500ms, then 1000ms, then 2000ms before retrying. This exponentially decreasing pressure allows the failing database time to recover its CPU cycles.

### 3. Rate Limiter (Token Bucket) (`03-Rate-Limiter`)
Protects your own application's resources from abusive clients or unintentional server-side loops. The Token Bucket algorithm allows sudden bursts of incoming traffic but strictly enforces an average requests-per-second limit afterward.
* *Real-world usage: AWS API Gateway Rate Limiting, Stripe API.*
