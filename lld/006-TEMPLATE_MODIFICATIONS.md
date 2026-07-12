# LLD Mastery OS: Markdown Templates for Content Modification

Use these templates to update existing LLD patterns and problems to ensure they integrate seamlessly with your Google Sheet tracker.

---

## 1. Pattern README Template
Add this section to the bottom of every file in `lld/01-Creational/`, `lld/02-Structural/`, and `lld/03-Behavioral/`.

```markdown
---

## 🧠 Tracker Integration

*   **Trigger Phrases:** [List 3-4 phrases that indicate this pattern is needed]
*   **SOLID Connection:** [Explain which SOLID principle it primarily satisfies and how]
*   **Confuses With:** 
    *   **[Pattern Name]:** [Distinction hook]
    *   **[Pattern Name]:** [Distinction hook]
*   **Anti-Freeze Starter Code:** 
    ```java
    // 3-5 lines of the core interface or base class
    ```
*   **Self-Assessment Prompts:** 
    1. [Technical check question]
    2. [Design judgment question]
    3. [Comparison question]
```

---

## 2. Problem README Template
Add this section to the bottom of every problem description (e.g., in `lld/01-Creational/08-LLD-Problems/`).

```markdown
---

## 🔬 Tracker Diagnostics

*   **Primary Patterns:** [List patterns]
*   **The "Freeze Trap":** [Identify where candidates usually get stuck or over-engineer]
*   **Class Design Checklist:**
    *   [ ] [Core Entity 1]
    *   [ ] [Core Interface 1]
    *   [ ] [Orchestrator Class]
    *   [ ] [Pattern Implementation Classes]
*   **SOLID Violations to Watch For:**
    *   **[Principle]:** [Common mistake in this problem]
    *   **[Principle]:** [Common mistake in this problem]
```

---

## 3. Machine Coding Framework (Updated Phase)

Ensure your `DELIVERY_FRAMEWORK.md` includes the **Anti-Freeze Protocol** and **Explain Aloud Prompts** (already updated in this repository).

### Explain Aloud Cheat Sheet (General)
*   **DIP:** "I'm using an interface here to decouple high-level logic from infrastructure."
*   **OCP:** "I'm applying the Strategy pattern so I can add new variants without modifying this class."
*   **SRP:** "I'm moving this logic to a separate service to ensure this class only has one reason to change."
*   **LSP:** "I'm ensuring this subclass fulfills the behavioral contract of the parent to prevent runtime surprises."
