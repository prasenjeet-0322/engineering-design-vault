# 🚀 LLD Mastery OS: Usage & Workflow Guidelines

This document defines the **"LLD Mastery Workflow"**—a symbiotic relationship between your **Google Sheet (The Command Center)** and this **Repository (The Dojo)**. 

Follow these guidelines to bridge the gap between knowing patterns conceptually and applying them under pressure.

---

## 🛠️ The System Components

| Component | Location | Purpose |
| :--- | :--- | :--- |
| **Command Center** | Google Sheets | Tracking, Spaced Repetition, Diagnostic Analytics (Fear/Freeze Tracking). |
| **Knowledge Base** | `lld/01` to `lld/04` | Pattern READMEs, Senior-level comparisons, and Trigger Phrases. |
| **Practice Environment** | Your IDE | Where you write code using the "Anti-Freeze" starter templates. |
| **Delivery Framework** | `lld/05` | Your Standard Operating Procedure (SOP) for mocks and timing. |

---

## 🔄 The Daily Loop (75-Minute Session)

### 1. The Command (5 Mins)
*   **Action:** Open your Google Sheet **DASHBOARD**.
*   **Goal:** Identify today's target (e.g., "Learn Strategy Pattern" or "Mock: Vending Machine") based on your Spaced Repetition logic.

### 2. Deep Dive (20 Mins)
*   **Action:** Navigate to the pattern/problem README in this repository.
*   **Focus:** 
    *   Read the **"Senior Awareness"** and **"Junior vs Senior"** sections.
    *   Review the **"Tracker Integration"** section. Copy the **Trigger Phrases** into your Sheet's "Pattern Selector" sheet.
    *   Study the **"Anti-Freeze Starter Code"**—this is your emergency "get-unstuck" Java template.

### 3. Deliberate Practice (40 Mins)
*   **Action:** Open a blank `.java` file in your IDE.
*   **The Mock:** If practicing a problem, set a 45-minute timer in your Sheet.
*   **The Workflow:** Follow the **[Delivery Framework](./lld/05-Machine-Coding-Guide/DELIVERY_FRAMEWORK.md)**.
    *   **Phase 1:** Clarify Requirements.
    *   **Phase 2:** Identify Entities.
    *   **Phase 3:** **Explain Aloud** using the scripts provided in the framework while you code.

### 4. Diagnostic Logging (10 Mins)
*   **Action:** Return to your Google Sheet **DAILY LOG**.
*   **Critical Metrics:**
    *   **Froze Duration:** How many minutes did you stare blankly?
    *   **Fear Faced:** Did you pick the wrong pattern? (e.g., used Strategy instead of State).
    *   **Explain Aloud Score:** Did you successfully narrate your architectural choices?

---

## 🧠 Specialized Protocols

### 🛰️ The "Pattern Selector" Strategy
Use the Google Sheet as a **Predictive Engine**:
1.  Read a new problem statement in the codebase.
2.  Go to your **Pattern Selector** sheet.
3.  Search for keywords (e.g., "Undo", "Incompatible", "Hierarchy").
4.  Predict the primary pattern *before* checking the **"Tracker Diagnostics"** section in the problem's README.

### ❄️ The "Anti-Freeze" Protocol
If your brain "blanks" during a mock or practice session:
1.  **Stop Coding.** Do not force it.
2.  Execute the 4-step recovery in the **[Delivery Framework](./lld/05-Machine-Coding-Guide/DELIVERY_FRAMEWORK.md)**:
    *   **Step 1:** Draw Boxes (Entities).
    *   **Step 2:** Start with an Interface (`interface Service {}`).
    *   **Step 3:** Narrate your confusion to the "interviewer."
    *   **Step 4:** Ask a clarifying question to buy time.

---

## 📈 Weekly Analytics (Sunday Review)

Look at your **DASHBOARD** and **INTELLIGENCE REPORT** to adjust your plan:
*   **High Freeze Rate?** If you freeze on Behavioral patterns, dedicate next week to ONLY coding "Behavioral Anti-Freeze" starters.
*   **Messy Code?** Audit your practice files against the **[Code Quality Checklist](./lld/006-TEMPLATE_MODIFICATIONS.md)**.
*   **Wrong Patterns?** Re-read the **"CONFUSES WITH"** sections in the pattern READMEs.

---

> **Senior Secret:** The Sheet tracks your growth; the Codebase builds your instinct. Master the loop to master the interview.
