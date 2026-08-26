# 🌍 Module 05: Cross-Language Abstract Factory Implementations

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🎙️ Interview Playbook](./04-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md) &nbsp; | &nbsp; [Next: 💼 Case Studies](./CASE_STUDY.md)

---

## 🎯 Executive Overview

Different programming languages implement the **Abstract Factory Pattern** using their respective type systems:
* **C++:** Uses abstract base classes with pure virtual methods returning `std::unique_ptr`.
* **Go:** Uses interfaces declaring multiple factory methods returning product interfaces.
* **TypeScript:** Uses structural type matching and UI factory interfaces.
* **Python:** Uses `abc.ABC` with multiple `@abstractmethod` decorators.

---

## ⚡ 1. Modern C++ (C++17/20) — Smart Pointer Product Suites

```cpp
#include <iostream>
#include <memory>

// Abstract Products
class Button { public: virtual ~Button() = default; virtual void render() = 0; };
class Checkbox { public: virtual ~Checkbox() = default; virtual void check() = 0; };

// Concrete Products: Windows
class WinButton : public Button { public: void render() override { std::cout << "[Win] Button\n"; } };
class WinCheckbox : public Checkbox { public: void check() override { std::cout << "[Win] Checkbox\n"; } };

// Concrete Products: Mac
class MacButton : public Button { public: void render() override { std::cout << "[Mac] Button\n"; } };
class MacCheckbox : public Checkbox { public: void check() override { std::cout << "[Mac] Checkbox\n"; } };

// Abstract Factory
class GUIFactory {
public:
    virtual ~GUIFactory() = default;
    virtual std::unique_ptr<Button> createButton() = 0;
    virtual std::unique_ptr<Checkbox> createCheckbox() = 0;
};

// Concrete Factory
class WinUIFactory : public GUIFactory {
public:
    std::unique_ptr<Button> createButton() override { return std::make_unique<WinButton>(); }
    std::unique_ptr<Checkbox> createCheckbox() override { return std::make_unique<WinCheckbox>(); }
};
```

---

## 🐹 2. Go (Golang) — Multi-Product Interfaces

```go
package main

import "fmt"

type Button interface{ Click() }
type Checkbox interface{ Check() }

type DarkButton struct{}
func (d *DarkButton) Click() { fmt.Println("Dark Button Clicked") }

type DarkCheckbox struct{}
func (d *DarkCheckbox) Check() { fmt.Println("Dark Checkbox Checked") }

// ⭐ Abstract Factory Interface
type GUIFactory interface {
    CreateButton() Button
    CreateCheckbox() Checkbox
}

// Concrete Factory
type DarkThemeFactory struct{}
func (f *DarkThemeFactory) CreateButton() Button     { return &DarkButton{} }
func (f *DarkThemeFactory) CreateCheckbox() Checkbox { return &DarkCheckbox{} }
```

---

## 🟦 3. TypeScript — Theme Engine

```typescript
interface Button { render(): void; }
interface Checkbox { render(): void; }

interface UIFactory {
    createButton(): Button;
    createCheckbox(): Checkbox;
}

class MaterialUIFactory implements UIFactory {
    createButton(): Button {
        return { render: () => console.log("Rendering Material Button") };
    }
    createCheckbox(): Checkbox {
        return { render: () => console.log("Rendering Material Checkbox") };
    }
}
```

---

## 📊 Cross-Language Architecture Comparison

| Language | Factory Contract | Product Return Type | Memory Management |
|---|---|---|---|
| **Java** | `interface UIFactory` | Interface types (`Button`, `Checkbox`) | Garbage Collection |
| **C++** | `class GUIFactory` | `std::unique_ptr<Product>` | RAII Smart Pointers |
| **Go** | `type GUIFactory interface` | Structural interfaces | Pointer escaping |
| **TypeScript** | `interface UIFactory` | Structural duck-typed objects | V8 Engine GC |
| **Python** | `class GUIFactory(ABC)` | `abc.ABC` Product instances | Dynamic Reference Counting |
