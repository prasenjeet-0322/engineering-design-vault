# ⏱️ Rate Limiter Pattern (Token Bucket)

## 📖 1. The Core Concept (The "Why")
Rate Limiting protects your API from massive spikes in traffic, whether they are malicious distributed denial of service (DDoS) attacks, or just a buggy script written by a legitimate customer. 

### ⚠️ The Problem
If you offer a public API (like Twitter or Stripe), a single customer could accidentally write an infinite `while` loop that sends 10,000 HTTP requests per second to your database. Your server CPUs will hit 100%, and your entire system will crash for all other customers. 

### ✅ The Solution
The **Rate Limiter**. Every incoming request must pass through a strict algorithm (usually sitting inside an API Gateway like AWS API Gateway or Kong). If the user exceeds their mathematical allowance (e.g., 5 requests per second), the limiter instantly returns an `HTTP 429: Too Many Requests` error, saving your internal servers from processing the load.

---

## 💻 2. The Token Bucket Algorithm

While there are many algorithms (Leaky Bucket, Fixed Window, Sliding Window Log), the **Token Bucket** is by far the most famous and widely implemented standard in Enterprise environments (Amazon and Stripe use this).

1. Imagine a physical bucket. It has a strict maximum capacity (**e.g., 3 Tokens**).
2. Every request that passes through the API costs exactly **1 Token**. You remove a token from the bucket. If the bucket is empty, you return `HTTP 429`.
3. An invisible background worker drips new tokens into the bucket at a strict rate (**e.g., 1 Token per second**). 

**The Genius of Token Bucket (The Burst Factor):**
Unlike strict algorithms, Token bucket allows a sudden *burst* of traffic. Because the bucket starts full, a user can instantly fire 3 requests in a millisecond, and they all succeed! This is great for responsive UIs. But after the initial burst is exhausted, they are strictly throttled to exactly 1 request per second.

### 🏗️ Why it matters for Scaling (SDE-2+)
*   **Redis Integration:** In a real distributed system with 50 load-balanced web servers, you cannot store `int currentTokens` in Java RAM. You must store the tokens centrally inside **Redis**. 
*   **Lua Scripting:** Fetching, decrementing, and saving data back to Redis requires multiple network hops which can cause race-conditions. Senior architects solve this by writing a Lua script that executes the *entire* Token Bucket algorithm atomically inside the Redis engine.
