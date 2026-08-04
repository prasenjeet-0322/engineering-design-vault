# 🎮 Command — Java Implementation Guide

## 📁 Folder Structure

```
JAVA/
├── Main.java                          ← Integration Demo (Run this)
├── command/                           
│   ├── ICommand.java                  ← The Standard Interface
│   ├── InsertTextCommand.java         ← The Concrete Command
│   └── CommandHistory.java            ← The Invoker (Queue/Stack)
└── receiver/                          
    └── TextEditor.java                ← The business logic
```

---

## ▶️ How to Run

Navigate to the `JAVA/` directory and compile/run the application:

```bash
cd "03-Behavioral/03-Command Design Pattern/JAVA/"
javac command/*.java receiver/*.java Main.java
java Main
```

**Expected output:**
```
==================================================
   Command Pattern: Text Editor (Undo) Demo       
==================================================

--- Scenario 1: Executing Commands ---
   [Editor] Inserted text: 'Hello '
   [Editor] Inserted text: 'World! '
   [Editor] Inserted text: 'Oops. '

[Current Document State]: Hello World! Oops. 

--- Scenario 2: Undoing Commands (Ctrl+Z) ---
   [History] ⏪ Undoing last action...
   [Editor] Deleted last 6 characters.
[Current Document State]: Hello World! 
   [History] ⏪ Undoing last action...
   [Editor] Deleted last 7 characters.
[Current Document State]: Hello 
```

---

## 📖 Full Documentation
See the top-level [`README.md`](../README.md) for conceptual explanations, FAANG interview Q&A, and real-world system design usage.
