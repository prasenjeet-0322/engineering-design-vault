# 🌍 Module 06: Cross-Language Command Implementations

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: 🎙️ Interview Playbook](./05-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md) &nbsp; | &nbsp; [Next: 💼 Case Studies](./CASE_STUDY.md)

---

## 🎯 Executive Overview

Different programming languages implement the **Command Pattern** using both classical object-oriented hierarchies and modern functional closures:
* **Java:** Classical `ICommand` interfaces and built-in `Runnable` / `Callable`.
* **C#:** Native `System.Windows.Input.ICommand` in WPF/MAUI for MVVM UI data binding.
* **C++:** `std::function` callbacks and polymorphic command classes.
* **Go:** Functional closures (`func()`) passed through buffered worker channels.
* **TypeScript:** Async command interfaces with dual Undo/Redo history stacks.

---

## ⚡ 1. Modern C++ (C++17/20) — Polymorphic Commands & Lambdas

```cpp
#include <iostream>
#include <memory>
#include <vector>
#include <stack>

// Command Interface
class ICommand {
public:
    virtual ~ICommand() = default;
    virtual void execute() = 0;
    virtual void undo() = 0;
};

// Receiver
class Light {
public:
    void turnOn() { std::cout << "💡 Light turned ON" << std::endl; }
    void turnOff() { std::cout << "🌑 Light turned OFF" << std::endl; }
};

// Concrete Command
class ToggleLightCommand : public ICommand {
private:
    std::shared_ptr<Light> light;
public:
    ToggleLightCommand(std::shared_ptr<Light> l) : light(l) {}
    void execute() override { light->turnOn(); }
    void undo() override { light->turnOff(); }
};
```

---

## 🪟 2. C# (WPF / MAUI MVVM) — `ICommand` & `RelayCommand`

In .NET desktop and mobile development, UI buttons bind directly to ViewModel commands using `ICommand`:

```csharp
using System;
using System.Windows.Input;

public class RelayCommand : ICommand {
    private readonly Action<object> _execute;
    private readonly Predicate<object> _canExecute;

    public RelayCommand(Action<object> execute, Predicate<object> canExecute = null) {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public bool CanExecute(object parameter) => _canExecute == null || _canExecute(parameter);
    public void Execute(object parameter) => _execute(parameter);
    public event EventHandler CanExecuteChanged;
}
```

---

## 🐹 3. Go (Golang) — Functional Closures & Worker Queues

In Go, commands are often represented as first-class functions passed through a channel:

```go
package main

import "fmt"

type Command func() error

type CommandQueue struct {
    jobs chan Command
}

func NewCommandQueue(bufferSize int) *CommandQueue {
    q := &CommandQueue{jobs: make(chan Command, bufferSize)}
    go q.worker()
    return q
}

func (q *CommandQueue) Submit(cmd Command) {
    q.jobs <- cmd
}

func (q *CommandQueue) worker() {
    for cmd := range q.jobs {
        if err := cmd(); err != nil {
            fmt.Println("Error executing command:", err)
        }
    }
}
```

---

## 🟦 4. TypeScript — Undo/Redo Engine

```typescript
interface Command {
    execute(): void;
    undo(): void;
}

class CommandManager {
    private undoStack: Command[] = [];
    private redoStack: Command[] = [];

    execute(cmd: Command) {
        cmd.execute();
        this.undoStack.push(cmd);
        this.redoStack = []; // Clear redo stack on new command
    }

    undo() {
        const cmd = this.undoStack.pop();
        if (cmd) {
            cmd.undo();
            this.redoStack.push(cmd);
        }
    }

    redo() {
        const cmd = this.redoStack.pop();
        if (cmd) {
            cmd.execute();
            this.undoStack.push(cmd);
        }
    }
}
```

---

## 📊 Cross-Language Architecture Comparison

| Language | Primary Idiom | Native Language Support | Primary Enterprise Use Case |
|---|---|---|---|
| **Java** | `Runnable` / `Callable` / `ICommand` | `java.util.concurrent` Executor | Background Task Queues & Sagas |
| **C#** | `ICommand` / `RelayCommand` | `System.Windows.Input` | MVVM UI Event Data Binding |
| **C++** | `std::function` / Polymorphic Class | Lambdas / Smart Pointers | Game Action Queues & Audio Engines |
| **Go** | `type Command func()` | Go Channels (`chan`) | Goroutine Task Pools |
| **TypeScript** | Command interface / Lambdas | First-class functions | Web Canvas / Rich Text Undo/Redo |
