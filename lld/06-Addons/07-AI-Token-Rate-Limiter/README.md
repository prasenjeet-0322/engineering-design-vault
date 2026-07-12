# 🛠️ AI Token-based Rate Limiter

### 🧩 Patterns Used
- **Sliding Window Log**
- **Token Estimation**

### 💡 Why it matters
Modern AI Gateways must limit **TPM (Tokens Per Minute)** rather than just request count. This implementation uses a sliding window log for high-precision resource protection.

### 📂 Implementation Code
* [TokenRateLimiterSDE2.java](./TokenRateLimiterSDE2.java)
