# 🚥 State — Java Implementation Guide

## 📁 Folder Structure

```
JAVA/
├── Main.java                          ← Integration Demo (Run this)
├── context/                           
│   └── Document.java                  ← The Context/FSM 
└── state/                          
    ├── User.java                      ← POJO User
    ├── IDocumentState.java            ← The Common State Interface
    ├── DraftState.java                ← Concrete State
    ├── ModerationState.java           ← Concrete State
    └── PublishedState.java            ← Concrete State
```

---

## ▶️ How to Run

Navigate to the `JAVA/` directory and compile/run the application:

```bash
cd "03-Behavioral/04-State Design Pattern/JAVA/"
javac context/*.java state/*.java Main.java
java Main
```

**Expected output proves automated state transitions and access control:**
```
==================================================
   State Pattern: Document Workflow Demo          
==================================================

--- Scenario 1: Author working on a Draft ---
   [Draft] Rendering barebones text structure for Authors only.
   [Draft Action] 'Publish' clicked by Alice_Author...
      -> Moving document to Moderation Review.

--- Scenario 2: Author tries to bypass Moderation ---
   [Moderation] Rendering document with Editor markup and approval buttons.
   [Moderation Action] 'Approve' clicked by Alice_Author...
      -> ❌ FAILED: Only Admins can approve documents in Moderation.

--- Scenario 3: Admin approves the Document ---
   [Moderation Action] 'Approve' clicked by Bob_Admin...
      -> Approved! Moving document to Public distribution.

--- Scenario 4: User views the Published Document ---
   [Published] Rendering final HTML document with CSS and Ads for the Public.

--- Scenario 5: Admin tries to publish again ---
   [Published Action] ❌ Cannot publish. Document is already live!
```

---

## 📖 Full Documentation
See the top-level [`README.md`](../README.md) for conceptual explanations, FAANG interview Q&A, and real-world system design usage.
