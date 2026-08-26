# 🌍 Module 06: Cross-Language CoR Implementations

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🎙️ Interview Playbook](./05-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md) &nbsp; | &nbsp; [Next: 💼 Case Studies](./CASE_STUDY.md)

---

## 🎯 Executive Overview

Different programming languages and runtimes implement the **Chain of Responsibility** pattern using distinct paradigms:
* **C++** uses modern object-oriented polymorphism with smart pointers (`std::unique_ptr` / `std::shared_ptr`).
* **Go** uses functional middleware composition (`func(http.Handler) http.Handler`) and closure chaining.
* **TypeScript / Node.js** uses asynchronous `next()` middleware passing in Express.js and Fastify.
* **Python** uses callable classes / generator-based WSGI and ASGI middleware layers.

---

## ⚡ 1. Modern C++ (C++17/20) — Smart Pointer Pipeline

```cpp
#include <iostream>
#include <memory>
#include <string>

struct Request {
    std::string token;
    int requestCount;
};

class Middleware {
protected:
    std::shared_ptr<Middleware> nextHandler;

public:
    virtual ~Middleware() = default;

    std::shared_ptr<Middleware> setNext(std::shared_ptr<Middleware> next) {
        this->nextHandler = next;
        return next; // Allows chaining: a->setNext(b)->setNext(c);
    }

    virtual bool check(const Request& req) {
        if (nextHandler) {
            return nextHandler->check(req);
        }
        return true;
    }
};

class RateLimitMiddleware : public Middleware {
public:
    bool check(const Request& req) override {
        if (req.requestCount > 100) {
            std::cout << "❌ [RateLimit] Too Many Requests!" << std::endl;
            return false; // HALT
        }
        std::cout << "✅ [RateLimit] Passed" << std::endl;
        return Middleware::check(req);
    }
};

class AuthMiddleware : public Middleware {
public:
    bool check(const Request& req) override {
        if (req.token != "SECRET_TOKEN") {
            std::cout << "❌ [Auth] Unauthorized Token!" << std::endl;
            return false; // HALT
        }
        std::cout << "✅ [Auth] Passed" << std::endl;
        return Middleware::check(req);
    }
};
```

---

## 🐹 2. Go (Golang) — Functional Middleware Chaining

In Go, standard HTTP servers implement CoR via functional closures wrapping `http.Handler`:

```go
package main

import (
    "fmt"
    "net/http"
)

// Middleware functional type
type Middleware func(http.Handler) http.Handler

// 1. Rate Limiting Middleware
func RateLimiterMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        apiKey := r.Header.Get("X-API-KEY")
        if apiKey == "" {
            http.Error(w, "Missing API Key", http.StatusTooManyRequests)
            return // HALT
        }
        next.ServeHTTP(w, r) // PROCEED
    })
}

// 2. Logging Middleware
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        fmt.Println("➡️ Inbound Request:", r.Method, r.URL.Path)
        next.ServeHTTP(w, r) // PROCEED
    })
}

// Chain Helper: Combines middlewares in order
func CreateChain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}
```

---

## 🟦 3. TypeScript & Express.js — `next()` Flow

```typescript
import express, { Request, Response, NextFunction } from 'express';

const app = express();

// Middleware Link 1
const authGuard = (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
        return res.status(401).json({ error: "Missing Auth Header" });
    }
    next(); // Proceed to next link
};

// Middleware Link 2
const auditLogger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`[AUDIT] User ${req.ip} accessed ${req.path}`);
    next(); // Proceed
};

app.get('/api/resource', authGuard, auditLogger, (req, res) => {
    res.json({ data: "Success" });
});
```

---

## 🐍 4. Python — Django / WSGI Middleware Callable

```python
class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response # Next link in chain

    def __call__(self, request):
        if request.META.get('HTTP_X_FORWARDED_FOR') in BLOCKED_IPS:
            return HttpResponseForbidden("IP Blocked") # HALT
        
        # 🟢 PROCEED to next middleware
        response = self.get_response(request)
        return response
```

---

## 📊 Cross-Language Architecture Comparison

| Language | Primary CoR Idiom | Halting Mechanism | State Propagation |
|---|---|---|---|
| **Java** | `FilterChain.doFilter()` / Base Class | Return without calling `doFilter()` | `HttpServletRequest.setAttribute()` |
| **C++** | `std::shared_ptr<Middleware>` | Return `false` without calling `next->check()` | Request struct reference |
| **Go** | `func(http.Handler) http.Handler` | Return without calling `next.ServeHTTP()` | `r.WithContext(ctx)` |
| **TypeScript** | `(req, res, next) => void` | Return without calling `next()` | `req.user = user` |
| **Python** | `__call__(self, request)` | Return early `HttpResponse` | `request.user = user` |
