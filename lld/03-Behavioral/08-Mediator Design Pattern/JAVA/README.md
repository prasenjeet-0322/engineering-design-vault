# 🔀 Mediator — Java Implementation Guide

## 📁 Folder Structure

```
JAVA/
├── Main.java                          ← Integration Demo (Run this)
├── mediator/                           
│   ├── IChatRoom.java                 ← The Air Traffic Controller Interface
│   └── SlackChannel.java              ← The Concrete Hub
└── colleague/                        
    ├── User.java                      ← Abstract Entity that connects to Hub
    ├── Developer.java                 ← Concrete Entity A
    └── Manager.java                   ← Concrete Entity B
```

---

## ▶️ How to Run

Navigate to the `JAVA/` directory and compile/run the application:

```bash
cd "03-Behavioral/09-Mediator Design Pattern/JAVA/"
javac mediator/*.java colleague/*.java Main.java
java Main
```

**Expected output proves many-to-many communication without direct object coupling:**
```
==================================================
   Mediator Pattern: Chat Room Demo               
==================================================

--- Scenario 1: Alice sends a message ---
   [Developer Alice] sending: Hey team, the build is broken again.
      -> [Developer Bob] received: Hey team, the build is broken again.
      -> [Manager Charlie] received: Hey team, the build is broken again.

--- Scenario 2: Charlie (Manager) replies ---
   [Manager Charlie] sending: Who broke it this time?
      -> [Developer Alice] received: Who broke it this time?
      -> [Developer Bob] received: Who broke it this time?
```

---

## 📖 Full Documentation
See the top-level [`README.md`](../README.md) for conceptual explanations, FAANG interview Q&A, and real-world system design usage.
