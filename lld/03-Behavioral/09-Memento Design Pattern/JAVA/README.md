# 📸 Memento — Java Implementation Guide

## 📁 Folder Structure

```
JAVA/
├── Main.java                          ← Integration Demo (Run this)
├── originator/                           
│   └── TextDocument.java              ← The State Holder
├── memento/                          
│   └── DocumentMemento.java           ← The Immutable Snapshot
└── caretaker/                        
    └── History.java                   ← The Undo Stack
```

---

## ▶️ How to Run

Navigate to the `JAVA/` directory and compile/run the application:

```bash
cd "03-Behavioral/08-Memento Design Pattern/JAVA/"
javac memento/*.java originator/*.java caretaker/*.java Main.java
java Main
```

**Expected output proves strict state restoration via Caretaker orchestration:**
```
==================================================
   Memento Pattern: Undo (Ctrl+Z) Demo            
==================================================

--- Scenario 1: Making Edits ---
Document State -> [Content: 'Initial Draft', Font: Arial 12pt]
   [Originator] Saving state to Memento...
Document State -> [Content: 'Second Draft', Font: Times New Roman 12pt]
   [Originator] Saving state to Memento...
Document State -> [Content: 'Final Draft. Wait, this looks terrible.', Font: Times New Roman 72pt]

--- Scenario 2: Pressing Ctrl+Z (Undo) ---
   [Originator] State restored from Memento.
Document State -> [Content: 'Second Draft', Font: Times New Roman 12pt]

--- Scenario 3: Pressing Ctrl+Z again (Undo) ---
   [Originator] State restored from Memento.
Document State -> [Content: 'Initial Draft', Font: Arial 12pt]
```

---

## 📖 Full Documentation
See the top-level [`README.md`](../README.md) for conceptual explanations, FAANG interview Q&A, and real-world system design usage.
