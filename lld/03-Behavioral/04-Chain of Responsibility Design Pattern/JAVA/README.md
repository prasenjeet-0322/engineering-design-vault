# 🔗 Chain of Responsibility — Java Implementation Guide

## 📁 Folder Structure

```
JAVA/
├── Main.java                          ← Integration Demo (Run this)
├── payload/                           
│   └── Request.java                   ← Data passed through the chain
└── middleware/                          
    ├── BaseMiddleware.java            ← Abstract base linking logic
    ├── AuthMiddleware.java            ← Security Link
    ├── RateLimitMiddleware.java       ← Quota Link
    └── ValidationMiddleware.java      ← Data Integrity Link
```

---

## ▶️ How to Run

Navigate to the `JAVA/` directory and compile/run the application:

```bash
cd "03-Behavioral/05-Chain of Responsibility Design Pattern/JAVA/"
javac payload/*.java middleware/*.java Main.java
java Main
```

**Expected output proves that the pipeline intercepts explicitly at different stages:**
```
==================================================
   Chain of Responsibility: API Middleware Config 
==================================================

--- Scenario 1: Perfect Request ---
   [Auth Middleware] Verifying credentials for: alice@example.com
      -> Authentication Passed.
   [Rate Limit Middleware] Checking quota...
      -> Quota OK (1/2).
   [Validation Middleware] Validating payload data...
      -> Validation Passed.
   ✅ ALL CHECKS PASSED. Reached Controller. Processing data: { 'item': 'laptop' }

--- Scenario 2: Bad Password (Halted at Auth) ---
   [Auth Middleware] Verifying credentials for: bob@example.com
      -> ❌ Authentication Failed: Invalid password.
   ❌ PIPELINE ABORTED. Controller never reached.

--- Scenario 3: Bad Payload (Halted at Validation) ---
   [Auth Middleware] Verifying credentials for: carl@example.com
      -> Authentication Passed.
   [Rate Limit Middleware] Checking quota...
      -> Quota OK (1/2).
   [Validation Middleware] Validating payload data...
      -> ❌ Validation Failed: Missing payload data.
   ❌ PIPELINE ABORTED. Controller never reached.

--- Scenario 4: Rate Limit Exceeded (Halted at RateLimit) ---
   [Auth Middleware] Verifying credentials for: alice@example.com
      -> Authentication Passed.
   [Rate Limit Middleware] Checking quota...
      -> Quota OK (2/2).
   [Validation Middleware] Validating payload data...
      -> Validation Passed.
   ✅ ALL CHECKS PASSED. Reached Controller. Processing data: { 'item': 'mouse' }

   [Auth Middleware] Verifying credentials for: alice@example.com
      -> Authentication Passed.
   [Rate Limit Middleware] Checking quota...
      -> ❌ Rate Limit Exceeded: alice@example.com made 3 requests.
   ❌ PIPELINE ABORTED. Controller never reached.
```

---

## 📖 Full Documentation
See the top-level [`README.md`](../README.md) for conceptual explanations, FAANG interview Q&A, and real-world system design usage.
