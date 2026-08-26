# Level 18: Frontend Security & Client Sandbox Isolation

[⬅️ Level 17: Performance Engineering](../17-Frontend-Performance-Engineering/README.md) | [📚 Frontend Master Hub](../README.md) | [Level 19: Frontend System Design ➡️](../19-Frontend-System-Design/README.md)

---

## 🎯 Overview
Defensive frontend engineering: Cross-Site Scripting (XSS) prevention, Content Security Policy (CSP), Cross-Site Request Forgery (CSRF), CORS configurations, JWT vs HttpOnly Cookie auth architectures, and iframe sandboxing.

---

## 🗺️ Curriculum Topics

1. **Cross-Site Scripting (XSS) Defense:** Stored, Reflected, DOM-based XSS, input sanitization (`DOMPurify`), trusted types API.
2. **Content Security Policy (CSP):** Strict CSP directives (`default-src`, `script-src 'nonce-...'`, `frame-ancestors`), reporting endpoints.
3. **Authentication & Session Tokens:** HttpOnly `SameSite=Strict` cookies, JWT storage tradeoffs, refresh token rotation, PKCE OAuth flow.
4. **Cross-Origin Security:** Cross-Origin Resource Sharing (CORS preflight), Cross-Origin Embedder Policy (COEP), COOP headers.
5. **Client-Side Sandbox Isolation:** Iframe `sandbox` attributes, `window.postMessage` origin validation, securing third-party scripts.
