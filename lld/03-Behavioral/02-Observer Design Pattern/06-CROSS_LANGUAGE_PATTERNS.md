# 🌍 Module 06: Cross-Language Observer Implementations

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🎙️ Interview Playbook](./05-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md) &nbsp; | &nbsp; [Next: 💼 Case Studies](./CASE_STUDY.md)

---

## 🎯 Executive Overview

Different programming languages provide distinct primitives for building the Observer pattern:
* **C++** uses modern `std::function` callbacks and `std::weak_ptr` to prevent circular reference memory leaks.
* **Go** leverages lightweight **Goroutines** and **Go Channels (`chan`)** for native asynchronous event fan-out.
* **TypeScript / Node.js** features built-in `EventEmitter`, browser `addEventListener` (with `AbortController`), and reactive libraries like **RxJS**.
* **Python** provides dynamic callbacks with `weakref` and `asyncio.Event` loops.

This guide provides clean, production-grade implementations across all four ecosystems.

---

## ⚡ 1. Modern C++ (C++17/C++20) — `std::weak_ptr` & `std::function`

In C++, using raw pointers or `std::shared_ptr` for observer lists causes **circular reference memory leaks** (Publisher keeps Subscriber alive, Subscriber holds pointer to Publisher). Modern C++ uses **`std::weak_ptr`**:

```cpp
#include <iostream>
#include <vector>
#include <memory>
#include <algorithm>

class StockObserver {
public:
    virtual ~StockObserver() = default;
    virtual void onPriceChange(double newPrice) = 0;
};

class StockMarket {
private:
    // 🛡️ Use weak_ptr to prevent circular reference memory leaks
    std::vector<std::weak_ptr<StockObserver>> observers;

public:
    void subscribe(std::shared_ptr<StockObserver> observer) {
        observers.push_back(observer);
    }

    void notifyObservers(double newPrice) {
        // Iterate and prune expired observers automatically
        auto it = observers.begin();
        while (it != observers.end()) {
            if (auto observer = it->lock()) { // lock() converts weak_ptr to shared_ptr if alive
                observer->onPriceChange(newPrice);
                ++it;
            } else {
                // 🧹 Clean up dead observer pointer
                it = observers.erase(it);
            }
        }
    }
};
```

---

## 🐹 2. Go (Golang) — Channels & Goroutine Fan-Out

Go replaces traditional callback interfaces with **Go Channels** and concurrent goroutine fan-out:

```go
package main

import (
    "fmt"
    "sync"
)

type Event struct {
    Ticker string
    Price  float64
}

type StockPublisher struct {
    mu          sync.RWMutex
    subscribers map[chan Event]struct{}
}

func NewStockPublisher() *StockPublisher {
    return &StockPublisher{
        subscribers: make(map[chan Event]struct{}),
    }
}

// Subscribe returns a read-only channel for the consumer
func (p *StockPublisher) Subscribe() <-chan Event {
    p.mu.Lock()
    defer p.mu.Unlock()
    ch := make(chan Event, 10) // Buffered channel prevents slow observers from blocking
    p.subscribers[ch] = struct{}{}
    return ch
}

func (p *StockPublisher) Unsubscribe(ch <-chan Event) {
    p.mu.Lock()
    defer p.mu.Unlock()
    for storedCh := range p.subscribers {
        if storedCh == ch {
            delete(p.subscribers, storedCh)
            close(storedCh)
            break
        }
    }
}

// Publish broadcasts event concurrently to all subscriber channels
func (p *StockPublisher) Publish(event Event) {
    p.mu.RLock()
    defer p.mu.RUnlock()
    for ch := range p.subscribers {
        go func(c chan Event) {
            c <- event // Non-blocking async fan-out
        }(ch)
    }
}
```

---

## 🟦 3. TypeScript & Node.js — EventEmitter & `AbortController`

### A. Node.js `EventEmitter` (Built-in Standard)
```typescript
import { EventEmitter } from 'events';

interface OrderPayload {
    orderId: string;
    status: string;
}

class OrderManager extends EventEmitter {
    updateOrderStatus(orderId: string, status: string) {
        console.log(`Order ${orderId} updated to ${status}`);
        this.emit('orderStatusChanged', { orderId, status });
    }
}

const manager = new OrderManager();

// Subscription
const listener = (payload: OrderPayload) => {
    console.log(`[EmailService] Sending email for order ${payload.orderId}`);
};

manager.on('orderStatusChanged', listener);

// Unsubscription
manager.off('orderStatusChanged', listener);
```

### B. Browser `addEventListener` with `AbortController` (Clean Lifecycle)
```typescript
// Modern cleanup pattern without manually calling removeEventListener
const controller = new AbortController();

window.addEventListener('resize', () => console.log('Resized!'), {
    signal: controller.signal // Bound to AbortSignal
});

// When component unmounts:
controller.abort(); // 🧼 Instantly removes all bound event listeners!
```

---

## 🐍 4. Python — Weak References (`weakref`)

```python
import weakref

class Subject:
    def __init__(self):
        # 🛡️ WeakSet automatically cleans up dead observers when they are garbage collected
        self._observers = weakref.WeakSet()

    def attach(self, observer):
        self._observers.add(observer)

    def notify(self, data):
        for observer in self._observers:
            observer.update(data)
```

---

## 📊 Cross-Language Architecture Comparison

| Language | Idiomatic Event Mechanism | Memory Leak Prevention | Concurrency Model |
|---|---|---|---|
| **Java** | `CopyOnWriteArrayList` / Flow API | `WeakReference` / `AutoCloseable` | Thread Pool `ExecutorService` |
| **C++** | `std::vector<std::weak_ptr<T>>` | `std::weak_ptr.lock()` | Mutex / Task Async |
| **Go** | `chan Event` (Channels) | Explicit `close(ch)` | Goroutine fan-out (`go func()`) |
| **TypeScript** | `EventEmitter` / RxJS | `AbortController` / `Subscription.unsubscribe()` | Single-Threaded Event Loop |
| **Python** | `weakref.WeakSet()` / Callbacks | `weakref` garbage collection | `asyncio` Task Queue / GIL |
