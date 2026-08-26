# 🌍 Module 05: Cross-Language Simple Factory Implementations

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🎙️ Interview Playbook](./04-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md) &nbsp; | &nbsp; [Next: 💼 Case Studies](./CASE_STUDY.md)

---

## 🎯 Executive Overview

Because **Simple Factory** is a lightweight programming idiom, it is widely implemented across all major programming languages using static methods, constructor switches, or dictionary dispatch tables:

---

## ⚡ 1. Modern C++ (C++17/20) — Static Factory Method

```cpp
#include <iostream>
#include <memory>
#include <string>

enum class LoggerType { CONSOLE, FILE, CLOUD };

class ILogger {
public:
    virtual ~ILogger() = default;
    virtual void log(const std::string& msg) = 0;
};

class ConsoleLogger : public ILogger {
public:
    void log(const std::string& msg) override { std::cout << "[Console] " << msg << std::endl; }
};

class FileLogger : public ILogger {
public:
    void log(const std::string& msg) override { std::cout << "[File] " << msg << std::endl; }
};

// ⭐ Simple Factory Class
class LoggerFactory {
public:
    static std::unique_ptr<ILogger> createLogger(LoggerType type) {
        switch (type) {
            case LoggerType::CONSOLE: return std::make_unique<ConsoleLogger>();
            case LoggerType::FILE:    return std::make_unique<FileLogger>();
            default: throw std::invalid_argument("Unknown logger type");
        }
    }
};
```

---

## 🐹 2. Go (Golang) — Constructor Factory Function

```go
package main

import "fmt"

type PaymentGateway interface {
    Charge(amount float64) error
}

type StripeGateway struct{}
func (s *StripeGateway) Charge(amount float64) error {
    fmt.Printf("Charging $%.2f via Stripe\n", amount)
    return nil
}

type PayPalGateway struct{}
func (p *PayPalGateway) Charge(amount float64) error {
    fmt.Printf("Charging $%.2f via PayPal\n", amount)
    return nil
}

// ⭐ Go Simple Factory Function
func NewPaymentGateway(gatewayType string) (PaymentGateway, error) {
    switch gatewayType {
    case "STRIPE":
        return &StripeGateway{}, nil
    case "PAYPAL":
        return &PayPalGateway{}, nil
    default:
        return nil, fmt.Errorf("unsupported gateway: %s", gatewayType)
    }
}
```

---

## 🟦 3. TypeScript — Discriminated Union Factory

```typescript
type LogType = 'DEBUG' | 'INFO' | 'ERROR';

interface Logger {
    log(message: string): void;
}

class DebugLogger implements Logger {
    log(msg: string) { console.log(`[DEBUG] ${msg}`); }
}

class InfoLogger implements Logger {
    log(msg: string) { console.log(`[INFO] ${msg}`); }
}

// ⭐ TypeScript Factory Function
export class SimpleLoggerFactory {
    static createLogger(type: LogType): Logger {
        switch (type) {
            case 'DEBUG': return new DebugLogger();
            case 'INFO':  return new InfoLogger();
            default:      throw new Error(`Unsupported type: ${type}`);
        }
    }
}
```

---

## 🐍 4. Python — Dictionary Dispatch Factory

```python
class Dog:
    def speak(self): return "Woof!"

class Cat:
    def speak(self): return "Meow!"

class PetFactory:
    # Dictionary dispatch table
    _registry = {
        "DOG": Dog,
        "CAT": Cat
    }

    @staticmethod
    def create_pet(pet_type: str):
        creator = PetFactory._registry.get(pet_type.upper())
        if not creator:
            raise ValueError(f"Unknown pet type: {pet_type}")
        return creator()
```

---

## 📊 Cross-Language Architecture Comparison

| Language | Primary Idiom | Dispatch Mechanism | Memory Ownership |
|---|---|---|---|
| **Java** | `SimpleLoggerFactory.createLogger()` | `EnumMap<Type, Supplier>` / `switch` | Garbage Collection |
| **C++** | `static std::unique_ptr<T> create()` | `switch (enum class)` | `std::unique_ptr` move ownership |
| **Go** | `func NewProduct(type) (Interface, error)` | `switch` statement | Value pointer escaping to heap |
| **TypeScript** | `static create(type: Union): Interface` | Discriminated union `switch` | V8 Engine GC |
| **Python** | `@staticmethod def create(type)` | Dictionary `_registry.get()` | Reference Counting GC |
