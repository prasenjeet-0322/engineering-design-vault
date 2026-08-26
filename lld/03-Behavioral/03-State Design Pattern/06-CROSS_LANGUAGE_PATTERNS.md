# 🌍 Module 06: Cross-Language State Implementations

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🎙️ Interview Playbook](./05-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md) &nbsp; | &nbsp; [Next: 💼 Case Studies](./CASE_STUDY.md)

---

## 🎯 Executive Overview

Different programming languages handle state transitions and memory management with unique patterns:
* **C++:** Must use `std::weak_ptr` or raw references to the Context to avoid circular dependency memory leaks.
* **Go:** Uses atomic pointer swaps via `sync/atomic` and interface polymorphism.
* **TypeScript:** Leverages discriminated union types and finite state libraries (like XState).
* **Python:** Uses dynamic property dispatch and class state mutations.

---

## ⚡ 1. Modern C++ (C++17/20) — Smart Pointer State Machine

In C++, if `Context` holds a `std::shared_ptr<State>` and `State` holds a `std::shared_ptr<Context>`, they create a **circular reference memory leak**. Modern C++ breaks the cycle using `std::weak_ptr` or raw reference:

```cpp
#include <iostream>
#include <memory>

class Context; // Forward declaration

class State {
public:
    virtual ~State() = default;
    virtual void handle(Context& context) = 0;
};

class ConcreteStateB;

class ConcreteStateA : public State {
public:
    void handle(Context& context) override;
};

class ConcreteStateB : public State {
public:
    void handle(Context& context) override;
};

class Context {
private:
    std::unique_ptr<State> state;

public:
    Context(std::unique_ptr<State> initial) : state(std::move(initial)) {}

    void setState(std::unique_ptr<State> newState) {
        state = std::move(newState);
    }

    void request() {
        state->handle(*this);
    }
};

void ConcreteStateA::handle(Context& context) {
    std::cout << "State A handling -> Transitioning to State B\n";
    context.setState(std::make_unique<ConcreteStateB>());
}

void ConcreteStateB::handle(Context& context) {
    std::cout << "State B handling -> Transitioning to State A\n";
    context.setState(std::make_unique<ConcreteStateA>());
}
```

---

## 🐹 2. Go (Golang) — Atomic State Pointer Swapping

```go
package main

import (
    "fmt"
    "sync/atomic"
)

type VendingState interface {
    InsertCoin(m *VendingMachine)
}

type NoCoinState struct{}
func (s *NoCoinState) InsertCoin(m *VendingMachine) {
    fmt.Println("🪙 Coin Inserted -> State changed to HasCoin")
    m.SetState(&HasCoinState{})
}

type HasCoinState struct{}
func (s *HasCoinState) InsertCoin(m *VendingMachine) {
    fmt.Println("⚠️ Coin already inserted!")
}

// ⭐ Context with atomic pointer for thread safety
type VendingMachine struct {
    state atomic.Pointer[VendingState]
}

func NewVendingMachine() *VendingMachine {
    m := &VendingMachine{}
    var initial VendingState = &NoCoinState{}
    m.state.Store(&initial)
    return m
}

func (m *VendingMachine) SetState(s VendingState) {
    m.state.Store(&s)
}

func (m *VendingMachine) InsertCoin() {
    (*m.state.Load()).InsertCoin(m)
}
```

---

## 🟦 3. TypeScript — Discriminated Union Finite State Machine

```typescript
type OrderState =
    | { status: 'PENDING'; amount: number }
    | { status: 'PAID'; transactionId: string }
    | { status: 'SHIPPED'; trackingNumber: string };

class Order {
    private state: OrderState;

    constructor(amount: number) {
        this.state = { status: 'PENDING', amount };
    }

    pay(transactionId: string) {
        if (this.state.status !== 'PENDING') {
            throw new Error(`Cannot pay in status: ${this.state.status}`);
        }
        // State Transition
        this.state = { status: 'PAID', transactionId };
        console.log("Order paid successfully!");
    }

    ship(trackingNumber: string) {
        if (this.state.status !== 'PAID') {
            throw new Error(`Cannot ship in status: ${this.state.status}`);
        }
        this.state = { status: 'SHIPPED', trackingNumber };
        console.log("Order shipped!");
    }
}
```

---

## 📊 Cross-Language Architecture Comparison

| Language | Primary State Idiom | Memory Management | Thread-Safety Mechanism |
|---|---|---|---|
| **Java** | `interface State` / Enums | Garbage Collection | `AtomicReference` / `ReentrantLock` |
| **C++** | `std::unique_ptr<State>` | RAII / `std::weak_ptr` | `std::mutex` / atomic pointer |
| **Go** | `interface State` | Heap pointer escaping | `atomic.Pointer[State]` |
| **TypeScript** | Discriminated Union / XState | V8 Engine GC | Single-Threaded Event Loop |
| **Python** | Duck-typed class state | Reference Counting GC | `threading.Lock` |
