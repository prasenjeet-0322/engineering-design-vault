# 🌍 Module 05: Cross-Language Factory Implementations

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🎙️ Interview Playbook](./04-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md) &nbsp; | &nbsp; [Next: 💼 Case Studies](./CASE_STUDY.md)

---

## 🎯 Executive Overview

Different programming languages approach factory creation based on their type systems and inheritance support:
* **C++:** Uses pure virtual functions returning `std::unique_ptr<Product>`.
* **Go:** Lacks class inheritance; uses constructor factory functions (`NewService()`) and interface polymorphism.
* **TypeScript:** Uses discriminated unions and constructor map registries.
* **Python:** Uses `abc.ABC` abstract methods and `@classmethod` named factories.

---

## ⚡ 1. Modern C++ (C++17/20) — `std::unique_ptr` Factory Method

```cpp
#include <iostream>
#include <memory>
#include <string>

// Abstract Product
class ILogger {
public:
    virtual ~ILogger() = default;
    virtual void log(const std::string& msg) = 0;
};

// Concrete Products
class ConsoleLogger : public ILogger {
public:
    void log(const std::string& msg) override {
        std::cout << "[Console] " << msg << std::endl;
    }
};

class FileLogger : public ILogger {
public:
    void log(const std::string& msg) override {
        std::cout << "[File: /var/log] " << msg << std::endl;
    }
};

// Abstract Creator
class LoggerFactory {
public:
    virtual ~LoggerFactory() = default;
    virtual std::unique_ptr<ILogger> createLogger() = 0; // Factory Method

    void logMessage(const std::string& msg) {
        auto logger = createLogger();
        logger->log(msg);
    }
};

// Concrete Creators
class ConsoleLoggerFactory : public LoggerFactory {
public:
    std::unique_ptr<ILogger> createLogger() override {
        return std::make_unique<ConsoleLogger>();
    }
};
```

---

## 🐹 2. Go (Golang) — Factory Functions & Interface Returns

Go does not have classes or inheritance. Instead, it uses **Factory Constructor Functions** that return interfaces:

```go
package main

import "fmt"

type Storage interface {
    Save(data string) error
}

type S3Storage struct{ bucket string }
func (s *S3Storage) Save(data string) error {
    fmt.Println("Saved to AWS S3:", s.bucket)
    return nil
}

type LocalStorage struct{ path string }
func (l *LocalStorage) Save(data string) error {
    fmt.Println("Saved to Local Disk:", l.path)
    return nil
}

// ⭐ Go Factory Function returning interface
func NewStorage(storageType string) (Storage, error) {
    switch storageType {
    case "S3":
        return &S3Storage{bucket: "prod-backups"}, nil
    case "LOCAL":
        return &LocalStorage{path: "/data"}, nil
    default:
        return nil, fmt.Errorf("unknown storage type: %s", storageType)
    }
}
```

---

## 🟦 3. TypeScript — Discriminated Union Factory Registry

```typescript
interface Logger {
    log(msg: string): void;
}

class CloudLogger implements Logger {
    log(msg: string) { console.log(`[Cloud] ${msg}`); }
}

class ConsoleLogger implements Logger {
    log(msg: string) { console.log(`[Console] ${msg}`); }
}

// ⭐ TypeScript Factory Registry with Constructor Type
type LoggerConstructor = new () => Logger;

export class LoggerFactory {
    private static registry = new Map<string, LoggerConstructor>();

    static register(type: string, ctor: LoggerConstructor) {
        this.registry.set(type.toUpperCase(), ctor);
    }

    static create(type: string): Logger {
        const Ctor = this.registry.get(type.toUpperCase());
        if (!Ctor) throw new Error(`Unknown type: ${type}`);
        return new Ctor();
    }
}

// Dynamic Registration:
LoggerFactory.register('CLOUD', CloudLogger);
LoggerFactory.register('CONSOLE', ConsoleLogger);
```

---

## 🐍 4. Python — Classmethod Factory & ABC

```python
from abc import ABC, abstractmethod

class Notification(ABC):
    @abstractmethod
    def send(self, message: str):
        pass

class EmailNotification(Notification):
    def send(self, message: str):
        print(f"Sending Email: {message}")

class NotificationFactory(ABC):
    @abstractmethod
    def create_notification(self) -> Notification:
        pass

    def notify_user(self, message: str):
        notification = self.create_notification()
        notification.send(message)

class EmailNotificationFactory(NotificationFactory):
    def create_notification(self) -> Notification:
        return EmailNotification()
```

---

## 📊 Cross-Language Architecture Comparison

| Language | Idiomatic Pattern | Polymorphism Mechanism | Memory Management |
|---|---|---|---|
| **Java** | `ILoggerFactory` / Supplier Registry | Class inheritance / Lambdas | Garbage Collected |
| **C++** | Abstract Class with Factory Method | Pure virtual functions | `std::unique_ptr` smart ownership |
| **Go** | `NewService()` constructor functions | Structural interfaces | Pointer escaping to heap |
| **TypeScript** | Map registry / Constructor signatures | Interface implementation | V8 Engine GC |
| **Python** | `abc.ABC` / Classmethods | Duck typing & ABC | Reference Counting + Cyclic GC |
