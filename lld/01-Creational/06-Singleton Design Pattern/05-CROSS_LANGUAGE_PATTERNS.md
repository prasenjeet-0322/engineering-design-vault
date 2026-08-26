# 🌍 Module 05: Cross-Language Singleton Implementations

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🎙️ Interview Playbook](./04-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md) &nbsp; | &nbsp; [Next: 💼 Case Studies](./CASE_STUDY.md)

---

## 🎯 Executive Overview

Different programming languages operate on distinct memory models, runtimes, and concurrency paradigms:
* **C++** provides low-level control over memory, move semantics, and compiler static initialization.
* **Go** leverages lightweight goroutines and CPU atomic flags (`sync.Once`).
* **TypeScript / Node.js** operates on a single-threaded Event Loop, where concurrency challenges arise during **asynchronous I/O**.
* **Python** features a global interpreter lock (GIL) and module-level singleton semantics.

This guide provides clean, production-ready Singleton implementations across all four languages.

---

## ⚡ 1. Modern C++ (C++11+) — Meyers' Singleton

In C++11 and later, **Scott Meyers' Singleton** is the industry standard. The ISO C++ standard (§6.7 [stmt.dcl]) guarantees that local static variable initialization is **thread-safe** by the compiler without requiring explicit mutexes (*"Magic Statics"*).

```cpp
#include <iostream>
#include <string>

class DatabaseConnectionPool {
private:
    DatabaseConnectionPool() {
        std::cout << "Database connection pool initialized." << std::endl;
    }
    ~DatabaseConnectionPool() = default;

public:
    // 🛡️ Delete copy constructor and assignment operator to prevent cloning
    DatabaseConnectionPool(const DatabaseConnectionPool&) = delete;
    DatabaseConnectionPool& operator=(const DatabaseConnectionPool&) = delete;

    // 🛡️ Delete move operations
    DatabaseConnectionPool(DatabaseConnectionPool&&) = delete;
    DatabaseConnectionPool& operator=(DatabaseConnectionPool&&) = delete;

    // ⭐ Meyers' Singleton: Lock-free, lazy, thread-safe in C++11+
    static DatabaseConnectionPool& getInstance() {
        static DatabaseConnectionPool instance; // Initialized atomically on first call
        return instance;
    }

    void executeQuery(const std::string& query) {
        std::cout << "Executing query: " << query << std::endl;
    }
};
```

---

## 🐹 2. Go (Golang) — `sync.Once`

In Go, concurrent **goroutines** share heap memory. Go's standard library provides `sync.Once` to guarantee that an initialization function executes strictly once, using fast-path atomic CPU instructions.

```go
package main

import (
    "fmt"
    "os"
    "sync"
)

type ConfigManager struct {
    ApiKey string
    Port   string
}

var (
    configInstance *ConfigManager
    once           sync.Once
)

// ⭐ GetConfig returns the singleton safely using sync.Once
func GetConfig() *ConfigManager {
    once.Do(func() {
        fmt.Println("🚀 Loading configuration from environment...")
        configInstance = &ConfigManager{
            ApiKey: os.Getenv("API_KEY"),
            Port:   "8080",
        }
    })
    return configInstance
}
```

---

## 🟦 3. TypeScript & Node.js — Promise Memoization

In Node.js, synchronous JavaScript code is single-threaded, but **asynchronous I/O operations** yield execution back to the Event Loop.

### A. Synchronous Singleton (Module Cache)
Node.js caches module exports upon initial import:

```typescript
class ConfigService {
    public readonly apiUrl: string;
    
    constructor() {
        this.apiUrl = process.env.API_URL || "https://api.production.com";
    }
}

// ⭐ Exporting an instantiated object acts as a singleton via Node module caching
export const configService = new ConfigService();
```

### B. Asynchronous Singleton (Promise Memoization)
When initialization requires async network or disk I/O, cache the **Promise**, not the resolved object, to prevent duplicate concurrent initialization calls:

```typescript
export class AsyncSecretManager {
    // Cache the Promise to avoid race conditions during async initialization
    private static initPromise: Promise<Record<string, string>> | null = null;

    public static async getSecrets(): Promise<Record<string, string>> {
        if (!this.initPromise) {
            // First caller initiates the promise and stores it
            this.initPromise = this.fetchSecretsFromVault();
        }
        // Concurrent callers await the EXACT same in-flight Promise!
        return this.initPromise;
    }

    private static async fetchSecretsFromVault(): Promise<Record<string, string>> {
        console.log("Fetching secrets from remote HashiCorp Vault...");
        // Simulated network I/O
        return { DB_PASSWORD: "super_secret_password" };
    }
}
```

---

## 🐍 4. Python — Thread-Safe `__new__`

In Python, modules are cached on first import (`sys.modules`). For explicit class-based singletons:

```python
import threading

class ThreadSafeSingleton:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
```

---

## 📊 Cross-Language Architecture Matrix

| Language | Idiomatic Implementation | Thread-Safety Guarantee | Copy / Duplicate Prevention |
|---|---|---|---|
| **Java** | Bill Pugh / Enum | JVM ClassLoader / Enum spec | `clone()` override / Enum |
| **C++ (C++11+)** | **Meyers' Singleton** | Compiler Magic Statics (§6.7) | `= delete` copy/move constructors |
| **Go** | **`sync.Once.Do()`** | Atomic CPU load + mutex | Unexported struct pointer |
| **TypeScript** | **Module Export + Promise Memoization** | Single-threaded Event Loop | Module scope closure |
| **Python** | **Module file** or `__new__` + Lock | `threading.Lock` / `sys.modules` | Python reference caching |
