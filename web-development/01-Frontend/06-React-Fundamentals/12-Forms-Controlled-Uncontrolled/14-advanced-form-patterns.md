# Level 06 — React Fundamentals
## KPI 08 / KPI 12 — Forms & Controlled Inputs
### PART 14 — Advanced Form Patterns & Reusable Interaction Architectures

[⬅️ Previous Part (13: Form Performance & Optimization)](13-form-performance-and-optimization.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/14-advanced-form-patterns.html) | [Next Part (15: Forms & Controlled Inputs Crucible) ➡️](15-forms-and-controlled-inputs-crucible.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# 🧭 Part Objective

In enterprise React systems, a form pattern is not considered "advanced" merely because it has more inputs, uses a third-party form library, or wraps an un-typed `useForm()` hook around a state object. An advanced form pattern is an **architectural contract** that coordinates multiple independent, asynchronously evolving state dimensions without creating contradictory or desynchronized state:

```text
                                  THE ADVANCED FORM SYSTEM
                                  
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. DATA DIMENSION:          Live Drafts, In-Flight Snapshots, Committed Baselines.     │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 2. INTERACTION DIMENSION:   Touched maps, Dirty flags, Focused nodes, Submitted gates. │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 3. VALIDATION DIMENSION:    Synchronous pure rules, Cross-field DAGs, Server 422 maps. │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 4. LIFECYCLE DIMENSION:     Idle ──► Validating ──► Submitting ──► Confirmed/Conflict. │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 5. PERSISTENCE DIMENSION:   LocalStorage recovery, Debounced autosave, Cloud drafts.   │
  ├────────────────────────────────────────────────────────────────────────────────────────┤
  │ 6. ACCESSIBILITY DIMENSION: Semantic ARIA graphs, Error summaries, Focus coordinators. │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

When development teams lack advanced architectural patterns, applications suffer from severe production failures:
1. **The Multi-Step Wizard State Wipeout:** Storing step state inside conditional `<StepOne />` JSX components, causing all user inputs to be deleted when the user clicks "Next" or "Previous".
2. **The Third-Party Adapter State Leak:** Direct-binding a third-party UI library component (`selectedOption: { id, label }`) to a domain schema that expects `countryId: string`, polluting domain models with UI transport shapes.
3. **The Unsafe LocalStorage Token Dump:** Blindly serializing entire form state objects (including credit card numbers and passwords) into unencrypted browser `localStorage`.
4. **The Index-Based Dynamic Array Shifting Bug:** Keying dynamic field arrays by list index, causing errors and input values to shift to the wrong entity when rows are inserted or removed.
5. **The Monolithic `useForm` Framework Anti-Pattern:** Creating a single 2,000-line God Hook that attempts to manage validation, analytics, routing, toast notifications, and DOM manipulation simultaneously.

The objective of this Part is to master **Advanced Form Patterns**: engineering **Multi-Step Wizard Engines with durable parent state**, designing **Field Registries with stable domain entity IDs**, implementing **Field Adapters for polymorphic UI integration**, architecting **Compound Form Components**, separating **Canonical vs. Presentation Values**, building **Secure Draft Persistence Layers**, and creating **Headless Form Engines with Semantic Command APIs**.

---

# ⚡ LAYER 1 — 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Core Mental Model: The Advanced Form Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. CANONICAL DOMAIN VALUES (What is persisted & submitted)                             │
│ • Normalized data schema: { startDate: Date, amount: 1500.50, countryId: "US" }        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. PRESENTATION / EDITING VALUES (What the user types in the input)                    │
│ • Formatted editing strings: { startDate: "2026-09-05", amount: "$1,500.50" }          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. DURABLE STATE OWNERSHIP (Where state lives across workflows)                        │
│ • Parent Wizard / Store owns durable draft; Step components are ephemeral views.       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. SEMANTIC COMMAND INTERFACE (How state is updated)                                   │
│ • Dispatch explicit commands: setFieldValue, invalidateField, commitBaseline, reset.  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. ADAPTER ISOLATION LAYER (How third-party UI libraries are integrated)               │
│ • Bridges external component props (onChange(event)) to form contracts (onChange(val))│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **The Golden Rule:**  
> **An advanced form architecture makes ownership, identity, lifecycle, and transition semantics explicit.**  
> If you cannot answer: *Who owns this value? What is its baseline? What invalidates it? Who owns the in-flight operation?*—the abstraction is incomplete.

---

## 2. Advanced Form Pattern Topology

```text
                                ADVANCED FORM PATTERNS
                                          │
      ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
      ▼                   ▼                               ▼                   ▼
MULTI-STEP WIZARDS    FIELD REGISTRY & ARRAYS         FIELD ADAPTERS      HEADLESS COMMANDS
──────────────────    ───────────────────────         ──────────────      ─────────────────
• Durable parent draft• Stable UUID entity IDs        • Bridge external UI• Semantic actions
• Step-local valid.   • O(1) row reordering           • Masking/Parsing   • Reducer engine
• Step preservation   • Dynamic validation lifecycle  • Contract isolation• Scoped context
```

---

## 3. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **Field Registry** | Tracking inputs by immutable domain IDs. | Enables dynamic arrays without error shifting. | Keying dynamic fields by unstable array index (`fields[index]`). |
| **Durable Wizard State**| Hoisting draft state to parent workflow container. | Preserves user input when switching steps. | Storing step data in ephemeral child components that unmount. |
| **Field Adapter** | Pure bridge converting external UI events. | Decouples domain models from UI library APIs. | Letting third-party `{ label, value }` objects pollute domain state. |
| **Canonical vs. Display**| Isolating raw editing strings from normalized types. | Preserves cursor position and partial input. | Forcing formatting transforms on every active keystroke. |
| **Draft Persistence** | Syncing durable drafts to storage with TTL. | Enables crash recovery and session resumption. | Storing sensitive PII, passwords, or credit card numbers in storage. |
| **Versioned Autosave** | Monotonic sequence tokens + revision headers. | Prevents out-of-order stale network overwrites. | Blindly accepting async responses in order of arrival. |
| **Compound Components**| Context-driven `<Form.Field>` composition. | Delivers clean, declarative API ergonomics. | Turning Context into an unmaintainable global variable dump. |
| **Semantic Commands** | Dispatching explicit domain actions via reducer. | Enforces strict, testable state transitions. | Exposing raw `setState` mutators across deep component trees. |
| **Headless Architecture**| Separating state logic from visual markup. | Enables multi-platform and design-system reuse. | Forgetting to define accessibility contracts for headless consumers. |
| **Reset Precision** | Explicit operations: `resetToBaseline` vs `clearErrors`.| Preserves user intent during error recoveries. | Flattening all reset operations into a single destructive `reset()`. |

---

## 4. The Golden Rule of Reusable Form Architectures

> [!IMPORTANT]
> **The Golden Rule:**  
> **Never build a form pattern around UI convenience. Build it around state ownership, domain invariants, and accessibility contracts.**  
> Reusable abstractions must decouple the **Domain Schema** from the **Visual Presentation Layer**.

---

# 🔬 LAYER 2 — Deep Mechanical Breakdown

## 1. The Field Registry Pattern & Stable Domain Entity IDs

In dynamic form collections (e.g. invoice line items, multi-guest booking, dynamic tax allocations), rows are added, removed, and reordered.

```text
❌ BROKEN: Array-Index Based Dynamic Array
Initial:
  Row 0 [UUID: item_a] ──► values[0] = "Item A", errors[0] = null
  Row 1 [UUID: item_b] ──► values[1] = "Item B", errors[1] = "Price required"
  Row 2 [UUID: item_c] ──► values[2] = "Item C", errors[2] = null

User Deletes Row 0 (Item A):
  Row 0 is now [UUID: item_b] ──► values[0] = "Item B", errors[0] = null (LOST ERROR!)
  Row 1 is now [UUID: item_c] ──► values[1] = "Item C", errors[1] = "Price required" (WRONG ROW!)
```

```text
✅ ROBUST: Stable Entity ID Field Registry
Initial:
  Registry: {
    "item_a": { name: "Item A", error: null },
    "item_b": { name: "Item B", error: "Price required" },
    "item_c": { name: "Item C", error: null }
  }
  Order: ["item_a", "item_b", "item_c"]

User Deletes Row 0 ("item_a"):
  Registry: {
    "item_b": { name: "Item B", error: "Price required" }, // Error permanently bound to item_b!
    "item_c": { name: "Item C", error: null }
  }
  Order: ["item_b", "item_c"]
```

```typescript
export interface DynamicFieldItem<T> {
  id: string; // Stable UUID (crypto.randomUUID())
  values: T;
}

export function useDynamicFieldArray<T>(initialItems: T[]) {
  const [items, setItems] = useState<Array<DynamicFieldItem<T>>>(() =>
    initialItems.map(val => ({ id: crypto.randomUUID(), values: val }))
  );

  const addItem = (defaultValues: T) => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), values: defaultValues }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return { items, addItem, removeItem, moveItem };
}
```

---

## 2. Multi-Step Wizards: Durable Parent State vs. Step Visibility

A multi-step form is a single logical transaction divided into progressive steps.

```text
                                  WIZARD STATE ARCHITECTURE
                                  
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │ <WizardController> (Owns Durable Draft State across all steps)                         │
  │ • draft: { step1: { ... }, step2: { ... }, step3: { ... } }                            │
  │ • activeStep: 1                                                                        │
  │ • completedSteps: Set([0])                                                             │
  └───────────────────────────────────┬────────────────────────────────────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
  ┌──────────────┐             ┌──────────────┐             ┌──────────────┐
  │   Step 1     │             │   Step 2     │             │   Step 3     │
  │ Account Info │             │ Organization │             │ Payment Plan │
  │ (Mounted)    │             │ (Unmounted)  │             │ (Unmounted)  │
  └──────────────┘             └──────────────┘             └──────────────┘
```

### Critical Rules for Multi-Step Forms:
1. **Durable Ownership:** The parent `<WizardController>` owns the entire accumulated draft. When `<StepOne>` unmounts, its data remains preserved in the parent state.
2. **Step-Local Validation Gates:** Clicking "Next" runs validation **only on the active step's fields**. The user cannot proceed if Step 1 has errors.
3. **Step Navigation History:** Clicking "Previous" restores Step 1 with all previously entered draft values intact without triggering validation errors.
4. **Final Comprehensive Submission:** Step 3's final "Complete Registration" captures a complete **Submission Snapshot** containing all accumulated steps.

---

## 3. Field Adapters: Integrating Polymorphic & Third-Party UI Controls

Enterprise applications use specialized UI libraries (MUI, Radix, React-Select, Ant Design). These libraries rarely expose standard HTML `<input onChange={(e) => ...}>` signatures:

```text
┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
│     DOM/LIBRARY EVENT     │ ───► │       FIELD ADAPTER       │ ───► │     CANONICAL SCHEMA      │
│ onDateSelect(DateObj)     │      │ (DateObj) => ISOString    │      │ startDate: "2026-09-05"   │
│ onSelectOption({ id })    │      │ (opt) => opt.id           │      │ countryId: "US"           │
│ onMoneyChange("$1,200")   │      │ (str) => parseNumber(str) │      │ budget: 1200              │
└───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

```tsx
// ✅ CORRECT: Generic Field Adapter Component
interface FieldAdapterProps<TValue, TInternal> {
  name: string;
  value: TValue;
  onChange: (value: TValue) => void;
  toInternal: (value: TValue) => TInternal;
  toCanonical: (internal: TInternal) => TValue;
  render: (props: { value: TInternal; onChange: (val: TInternal) => void }) => React.ReactNode;
}

export function FieldAdapter<TValue, TInternal>({
  value,
  onChange,
  toInternal,
  toCanonical,
  render
}: FieldAdapterProps<TValue, TInternal>) {
  const internalValue = toInternal(value);
  const handleInternalChange = (newInternal: TInternal) => {
    onChange(toCanonical(newInternal));
  };

  return <>{render({ value: internalValue, onChange: handleInternalChange })}</>;
}
```

---

## 4. Canonical vs. Presentation Value Transformation

During text entry, users type intermediate strings that are not yet valid domain types:

```text
User Typing Timeline:
  Key 1: "$"       ──► Invalid number, but valid editing string!
  Key 2: "$1"      ──► Invalid float, but valid editing string!
  Key 3: "$1."     ──► Invalid float, but valid editing string!
  Key 4: "$1.5"    ──► Canonical: 1.5
  Key 5: "$1.50"   ──► Canonical: 1.5
```

> [!CAUTION]
> **Anti-Pattern:** If you normalize `$1.` to `1` on every keystroke, the decimal point disappears while the user is typing, making it impossible to type cents! Always allow the `<input>` to hold raw editing strings, and execute canonical domain parsing on blur or submission.

---

## 5. Draft Persistence Architecture & Sensitive Data Governance

For multi-page applications, onboarding workflows, or complex insurance claims, persisting in-progress drafts protects against accidental tab closures or browser crashes:

```text
                               PERSISTENCE PIPELINE
                               
  [User Keystroke] ──► [Debounce 1000ms] ──► [Filter Sensitive PII] ──► [Encrypted LocalStorage]
                                                                                │
  [Page Reload / Mount] ◄── [Schema Version Validation] ◄── [Hydrate Draft] ◄──┘
```

### Security & Storage Rules:
1. **Blacklist Sensitive Fields:** Never persist passwords, credit card CVVs, or Social Security numbers in `localStorage`.
2. **Schema Versioning:** Include a schema version header (`version: 2`). If the application upgrades its schema, discard obsolete drafts to prevent runtime crashes.
3. **Time-To-Live (TTL):** Expire persisted drafts after a defined duration (e.g. 24 hours).

```typescript
export function useDraftPersistence<T>(
  storageKey: string,
  currentDraft: T,
  schemaVersion: number,
  blacklist: Array<keyof T> = []
) {
  // 1. Debounced Persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      const sanitizedDraft = { ...currentDraft };
      blacklist.forEach(field => delete sanitizedDraft[field]);

      const payload = {
        version: schemaVersion,
        timestamp: Date.now(),
        data: sanitizedDraft
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
      } catch (err) {
        console.warn('Draft persistence failed (quota exceeded).', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [storageKey, currentDraft, schemaVersion, blacklist]);

  // 2. Hydration Helper
  const loadPersistedDraft = (): T | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.version !== schemaVersion) {
        localStorage.removeItem(storageKey);
        return null;
      }
      return parsed.data as T;
    } catch {
      return null;
    }
  };

  const clearPersistedDraft = () => localStorage.removeItem(storageKey);

  return { loadPersistedDraft, clearPersistedDraft };
}
```

---

## 6. Complete Enterprise Production Implementation: Multi-Step Wizard Engine

Below is a complete, production-grade implementation of a **Multi-Step Wizard Engine with Dynamic Field Arrays, Field Adapters, and Semantic Command Reducer**:

```tsx
import React, { useReducer, useMemo, useCallback } from 'react';

// --- Domain Schema ---
export interface ContactPerson {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface EnterpriseOnboardingData {
  // Step 1: Company Profile
  companyName: string;
  registrationNumber: string;
  country: string;

  // Step 2: Key Contacts (Dynamic Array)
  contacts: ContactPerson[];

  // Step 3: Billing & Plan
  tier: 'startup' | 'enterprise';
  budgetUSD: number;
  agreeToTerms: boolean;
}

const INITIAL_DATA: EnterpriseOnboardingData = {
  companyName: '',
  registrationNumber: '',
  country: 'US',
  contacts: [{ id: 'c1', name: 'Alice Smith', email: 'alice@acme.com', role: 'Admin' }],
  tier: 'startup',
  budgetUSD: 5000,
  agreeToTerms: false
};

// --- Wizard State Machine ---
interface WizardState {
  activeStep: number;
  draft: EnterpriseOnboardingData;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submissionError: string | null;
}

type WizardAction =
  | { type: 'FIELD_CHANGED'; field: keyof EnterpriseOnboardingData; value: any }
  | { type: 'CONTACT_ADDED'; contact: ContactPerson }
  | { type: 'CONTACT_REMOVED'; id: string }
  | { type: 'CONTACT_UPDATED'; id: string; field: keyof ContactPerson; value: string }
  | { type: 'NEXT_STEP_REQUESTED' }
  | { type: 'PREV_STEP_REQUESTED' }
  | { type: 'SUBMIT_STARTED' }
  | { type: 'SUBMIT_SUCCEEDED' }
  | { type: 'SUBMIT_FAILED'; message: string };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'FIELD_CHANGED':
      return {
        ...state,
        draft: { ...state.draft, [action.field]: action.value }
      };

    case 'CONTACT_ADDED':
      return {
        ...state,
        draft: { ...state.draft, contacts: [...state.draft.contacts, action.contact] }
      };

    case 'CONTACT_REMOVED':
      return {
        ...state,
        draft: {
          ...state.draft,
          contacts: state.draft.contacts.filter(c => c.id !== action.id)
        }
      };

    case 'CONTACT_UPDATED':
      return {
        ...state,
        draft: {
          ...state.draft,
          contacts: state.draft.contacts.map(c =>
            c.id === action.id ? { ...c, [action.field]: action.value } : c
          )
        }
      };

    case 'NEXT_STEP_REQUESTED':
      return {
        ...state,
        activeStep: Math.min(state.activeStep + 1, 2)
      };

    case 'PREV_STEP_REQUESTED':
      return {
        ...state,
        activeStep: Math.max(state.activeStep - 1, 0)
      };

    case 'SUBMIT_STARTED':
      return {
        ...state,
        isSubmitting: true,
        submissionError: null
      };

    case 'SUBMIT_SUCCEEDED':
      return {
        ...state,
        isSubmitting: false,
        isSubmitted: true
      };

    case 'SUBMIT_FAILED':
      return {
        ...state,
        isSubmitting: false,
        submissionError: action.message
      };

    default:
      return state;
  }
}

// --- Main Enterprise Wizard Component ---
export function EnterpriseOnboardingWizard() {
  const [state, dispatch] = useReducer(wizardReducer, {
    activeStep: 0,
    draft: INITIAL_DATA,
    touched: {},
    isSubmitting: false,
    isSubmitted: false,
    submissionError: null
  });

  // Step-Local Validation
  const stepErrors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (state.activeStep === 0) {
      if (!state.draft.companyName.trim()) errs.companyName = 'Company name is required.';
      if (!state.draft.registrationNumber.trim()) errs.registrationNumber = 'Registration number is required.';
    }

    if (state.activeStep === 1) {
      if (state.draft.contacts.length === 0) {
        errs.contacts = 'At least one contact person is required.';
      }
      state.draft.contacts.forEach((c, idx) => {
        if (!c.name.trim()) errs[`contact_${c.id}_name`] = 'Contact name is required.';
        if (!c.email.trim() || !c.email.includes('@')) errs[`contact_${c.id}_email`] = 'Valid email is required.';
      });
    }

    if (state.activeStep === 2) {
      if (!state.draft.agreeToTerms) {
        errs.agreeToTerms = 'You must agree to enterprise terms.';
      }
    }

    return errs;
  }, [state.activeStep, state.draft]);

  const isCurrentStepValid = Object.keys(stepErrors).length === 0;

  const handleNext = () => {
    if (!isCurrentStepValid) return;
    dispatch({ type: 'NEXT_STEP_REQUESTED' });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCurrentStepValid || state.isSubmitting) return;

    dispatch({ type: 'SUBMIT_STARTED' });
    const snapshot = structuredClone(state.draft);

    try {
      await new Promise(r => setTimeout(r, 1200));
      dispatch({ type: 'SUBMIT_SUCCEEDED' });
      alert(`Success! Onboarded "${snapshot.companyName}" with ${snapshot.contacts.length} contacts.`);
    } catch {
      dispatch({ type: 'SUBMIT_FAILED', message: 'Registration server error.' });
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', fontFamily: 'sans-serif', background: '#0f172a', color: '#f8fafc', padding: '24px', borderRadius: '12px' }}>
      <h2>Enterprise Onboarding Wizard</h2>
      
      {/* Progress Step Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
        <span style={{ fontWeight: state.activeStep === 0 ? 'bold' : 'normal', color: state.activeStep === 0 ? '#38bdf8' : '#64748b' }}>
          1. Company Profile
        </span>
        <span style={{ fontWeight: state.activeStep === 1 ? 'bold' : 'normal', color: state.activeStep === 1 ? '#38bdf8' : '#64748b' }}>
          2. Key Contacts ({state.draft.contacts.length})
        </span>
        <span style={{ fontWeight: state.activeStep === 2 ? 'bold' : 'normal', color: state.activeStep === 2 ? '#38bdf8' : '#64748b' }}>
          3. Plan & Review
        </span>
      </div>

      {/* Step 1: Company Profile */}
      {state.activeStep === 0 && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Company Legal Name *</label>
            <input
              type="text"
              value={state.draft.companyName}
              onChange={e => dispatch({ type: 'FIELD_CHANGED', field: 'companyName', value: e.target.value })}
              style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', borderRadius: '4px' }}
            />
            {stepErrors.companyName && <span style={{ color: '#f87171', fontSize: '0.8rem' }}>{stepErrors.companyName}</span>}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Business Registration Number *</label>
            <input
              type="text"
              value={state.draft.registrationNumber}
              onChange={e => dispatch({ type: 'FIELD_CHANGED', field: 'registrationNumber', value: e.target.value })}
              style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', borderRadius: '4px' }}
            />
            {stepErrors.registrationNumber && <span style={{ color: '#f87171', fontSize: '0.8rem' }}>{stepErrors.registrationNumber}</span>}
          </div>
        </div>
      )}

      {/* Step 2: Dynamic Contact List */}
      {state.activeStep === 1 && (
        <div>
          <h3>Key Contacts Directory (Stable UUID Binding)</h3>
          {state.draft.contacts.map((c, idx) => (
            <div key={c.id} style={{ display: 'flex', gap: '8px', marginBottom: '10px', background: '#1e293b', padding: '10px', borderRadius: '6px' }}>
              <input
                type="text"
                placeholder="Full Name"
                value={c.name}
                onChange={e => dispatch({ type: 'CONTACT_UPDATED', id: c.id, field: 'name', value: e.target.value })}
                style={{ flex: 1, padding: '6px', background: '#0f172a', border: '1px solid #475569', color: '#fff', borderRadius: '4px' }}
              />
              <input
                type="email"
                placeholder="Email"
                value={c.email}
                onChange={e => dispatch({ type: 'CONTACT_UPDATED', id: c.id, field: 'email', value: e.target.value })}
                style={{ flex: 1, padding: '6px', background: '#0f172a', border: '1px solid #475569', color: '#fff', borderRadius: '4px' }}
              />
              <button
                type="button"
                onClick={() => dispatch({ type: 'CONTACT_REMOVED', id: c.id })}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => dispatch({
              type: 'CONTACT_ADDED',
              contact: { id: `c_${Date.now()}`, name: '', email: '', role: 'Member' }
            })}
            style={{ background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginBottom: '16px' }}
          >
            + Add Another Contact
          </button>
        </div>
      )}

      {/* Step 3: Plan & Agreement */}
      {state.activeStep === 2 && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>Selected Plan Tier</label>
            <select
              value={state.draft.tier}
              onChange={e => dispatch({ type: 'FIELD_CHANGED', field: 'tier', value: e.target.value })}
              style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #475569', color: '#fff', borderRadius: '4px' }}
            >
              <option value="startup">Startup Tier ($5,000/yr)</option>
              <option value="enterprise">Enterprise Tier ($25,000/yr)</option>
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label>
              <input
                type="checkbox"
                checked={state.draft.agreeToTerms}
                onChange={e => dispatch({ type: 'FIELD_CHANGED', field: 'agreeToTerms', value: e.target.checked })}
              />
              {' '}I agree to enterprise compliance and master services agreements.
            </label>
            {stepErrors.agreeToTerms && <div style={{ color: '#f87171', fontSize: '0.8rem' }}>{stepErrors.agreeToTerms}</div>}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
        <button
          type="button"
          onClick={() => dispatch({ type: 'PREV_STEP_REQUESTED' })}
          disabled={state.activeStep === 0 || state.isSubmitting}
          style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
        >
          Previous Step
        </button>

        {state.activeStep < 2 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!isCurrentStepValid}
            style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 'bold', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Next Step →
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={!isCurrentStepValid || state.isSubmitting}
            style={{ background: '#10b981', color: '#fff', fontWeight: 'bold', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
          >
            {state.isSubmitting ? 'Registering...' : 'Complete Registration'}
          </button>
        )}
      </div>
    </div>
  );
}
```

---

# 🧪 LAYER 3 — Diagnostic Labs & DevTools Profiling

## Lab 01: Multi-Step State Persistence Audit
**Objective:** Prove that transitioning from Step 1 ──► Step 2 ──► Step 1 preserves draft inputs without unmount loss.
1. Enter `companyName: "Acme"` in Step 1.
2. Click Next to Step 2. (Step 1 component unmounts from JSX).
3. Click Previous back to Step 1.
4. **Verification:** `companyName` remains `"Acme"`.

---

## Lab 02: Dynamic Array Entity ID Stability Audit
**Objective:** Verify that deleting Row 0 in a 3-row contact list does not shift Row 1's validation errors onto Row 2.
1. Add Contact A (valid), Contact B (invalid email), Contact C (valid).
2. Delete Contact A.
3. **Verification:** Contact B retains its invalid email red border. Contact C remains green and valid.

---

## Lab 03: Field Adapter Type Bridge Audit
**Objective:** Test a polymorphic date picker adapter that translates between a JavaScript `Date` object and an ISO string `YYYY-MM-DD`.
- Verify that selecting a date updates the domain model with string `"2026-09-05"`.

---

## Lab 04: LocalStorage Sensitive Data Governance Audit
**Objective:** Inspect browser `localStorage` to verify that sensitive fields (`password`, `creditCard`) are excluded from auto-persisted draft payloads.
```typescript
const stored = JSON.parse(localStorage.getItem("onboarding_draft") || "{}");
console.assert(stored.data.password === undefined, "Security Violation: Password leaked into LocalStorage!");
```

---

## Lab 05: Chrome Accessibility Tree & Multi-Step Focus Audit
**Objective:** Ensure that clicking "Next Step" moves screen reader focus to the new step's `<h2>` heading (`tabIndex={-1}`) to announce the step change to blind users.

---

# 🔥 LAYER 4 — The Crucible: Gauntlet Challenges & Runbooks

## 8 Crucible Challenges

### Challenge 01: Multi-Step Form JSX Unmount Loss
```tsx
function Wizard() {
  const [step, setStep] = useState(1);
  return step === 1 ? <StepOne /> : <StepTwo />;
}
function StepOne() {
  const [email, setEmail] = useState(""); // What is wrong here?
}
```
- **Question:** What happens to `email` when the user clicks to Step 2?
- **Answer:** `<StepOne />` unmounts and all local state is wiped! Hoist state to `<Wizard />`.

---

### Challenge 02: Third-Party Object Contamination
```tsx
// Schema requires: countryId: string
// React-Select returns: { value: "US", label: "United States" }
onChange={option => setForm(prev => ({ ...prev, country: option }))}
```
- **Question:** What bug does this introduce?
- **Answer:** The domain payload now contains a UI library `{ value, label }` object instead of the required canonical string `"US"`. Use a Field Adapter.

---

### Challenge 03: The Premature Money Masking Trap
```tsx
const handleChange = (e) => {
  setValue(formatCurrency(e.target.value)); // e.g. "1" -> "$1.00"
};
```
- **Question:** Why can't the user type decimals (`$1.50`)?
- **Answer:** Formatting mid-keystroke alters string lengths and cursor positions. Store raw editing strings and format on blur!

---

### Challenge 04: LocalStorage Schema Version Crash
```tsx
// App upgrades from Schema v1 to v2 (adds required 'organizationType' field).
// User reloads page with v1 draft in LocalStorage.
```
- **Question:** How do you prevent JSON runtime crashes?
- **Answer:** Tag stored drafts with `version: 2`. On hydrate, if `draft.version !== currentVersion`, discard stale storage!

---

### Challenge 05: Dynamic Field Array Shift Bug
```tsx
errors[index] = "Invalid email"; // Using array index
```
- **Question:** Why does deleting row 0 shift the error to the wrong row?
- **Answer:** Array indices are mutable positions, not domain identities. Key errors by stable entity UUID `errors[contact.id]`.

---

### Challenge 06: Progressive vs Final Validation
```tsx
// Step 1: Personal Info. Step 3: Payment Info.
// User clicks "Next" on Step 1.
```
- **Question:** Should validation check Step 3's payment fields?
- **Answer:** No! Only validate fields belonging to Step 1. Progressive validation gates each step independently.

---

### Challenge 07: Unchecked Autosave Overwrites
```tsx
// User types 'A' -> Autosave Request 1
// User types 'B' -> Autosave Request 2
// Request 2 finishes (Draft: 'B'). Request 1 finishes later (Draft: 'A').
```
- **Question:** How do you prevent Request 1 from regressing the document?
- **Answer:** Monotonic sequence tokens (`useRef(0)`) or server-side revision headers (`v1, v2`).

---

### Challenge 08: The Monolithic 3,000-Line `useForm` Anti-Pattern
```tsx
// Custom hook handles validation, analytics, routing, toasts, storage, and modals
```
- **Question:** Why does this fail in enterprise teams?
- **Answer:** Violates Single Responsibility Principle. Compose modular hooks (`useDraftPersistence`, `useValidationEngine`, `useWizardMachine`).

---

## 6 Production Incident Post-Mortems

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 1: THE $2.4M MORTGAGE APPLICATION WIPE OUTAGE                                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Loan applicants lost 40 minutes of financial data when clicking "Back".  │
│ Root Cause:   Step components owned their local state. Unmounting wiped all data.      │
│ Fix:          Hoisted draft state to parent WizardController with LocalStorage backup. │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 2: THE UNENCRYPTED CVV LOCALSTORAGE SECURITY BREACH                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Security audit flagged PCI-DSS compliance violation for stored cards.    │
│ Root Cause:   Draft auto-persistence saved raw form objects including CVV and PAN.    │
│ Fix:          Implemented strict sensitive field blacklists in persistence middleware. │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 3: THE DELETED ROW INVOICE REALLOCATION BUG                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Deleting line item #1 shifted discounts onto line item #2.               │
│ Root Cause:   Items were keyed by array index in reducer action handlers.              │
│ Fix:          Refactored dynamic list to immutable UUID entity registries.             │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 4: THE THIRD-PARTY SELECT RUNTIME CRASH                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Backend API rejected payloads with 500: "countryId must be a string".    │
│ Root Cause:   Directly saved React-Select { label, value } object into API payload.   │
│ Fix:          Built FieldAdapter boundary to normalize UI objects to domain strings.   │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 5: THE STALE DRAFT UPGRADE PARSE ERROR                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      White screen of death for returning users after v2.0 deployment.         │
│ Root Cause:   JSON.parse(localStorage) hydrated old schema without required v2 keys.  │
│ Fix:          Added schema version validation to invalidate outdated drafts.           │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────────────┐
│ INCIDENT 6: THE SCREEN READER STEP CHANGE SILENCE                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Symptom:      Blind users did not know they advanced to Step 2 of registration.        │
│ Root Cause:   Next step transition updated DOM without transferring focus or ARIA cues.│
│ Fix:          Added step heading focus management with aria-live step announcements.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏆 Senior Architecture Decision Matrix

```text
                           ADVANCED FORM PATTERNS
                                     │
                 What pattern requirement is being addressed?
                                     │
     ┌──────────────────┬────────────┴───────────┬──────────────────┐
     ▼                  ▼                        ▼                  ▼
MULTI-STEP WIZARD   DYNAMIC ROW COLLECTIONS  THIRD-PARTY UI     DRAFT PERSISTENCE
─────────────────   ───────────────────────  ──────────────     ─────────────────
• Durable parent    • Stable UUID entity IDs • FieldAdapter     • LocalStorage
• Step-local gates  • Keyed by item.id       • toInternal()     • Sensitive blacklist
• Summary review    • O(1) row reordering    • toCanonical()    • Schema versioning
```

---

## 📋 40-Point KPI 08 Part 14 Mastery Checklist

- [x] Distinguish **Canonical Domain Values** from **Presentation / Editing Strings**.
- [x] Hoist state to a parent controller in multi-step wizard workflows.
- [x] Prevent state loss when step components unmount from JSX.
- [x] Implement **Step-Local Validation Gates** before advancing to the next step.
- [x] Allow non-destructive backward navigation between wizard steps.
- [x] Key dynamic list rows by **stable domain entity UUIDs**, never array indices.
- [x] Prevent error and value shifting when dynamic rows are deleted or reordered.
- [x] Build **Field Adapters** to decouple third-party UI libraries from domain schemas.
- [x] Avoid mid-keystroke formatting transforms that break cursor caret position.
- [x] Implement debounced draft persistence to `localStorage` or `IndexedDB`.
- [x] Blacklist sensitive data (passwords, credit cards, CVVs) from browser storage.
- [x] Include schema version headers in persisted drafts to prevent upgrade crashes.
- [x] Enforce TTL expiration on persisted browser drafts.
- [x] Model wizard transitions with formal state machines and semantic command reducers.
- [x] Announce step changes to screen readers using `aria-live` and heading focus.
- [x] Capture a complete immutable **Submission Snapshot** on final step submission.
- [x] Isolate compound form components using scoped context providers.
- [x] Distinguish explicit reset operations: `resetToBaseline` vs `clearErrors`.
- [x] Separate headless form validation logic from visual presentation markup.
- [x] Protect autosave workflows against out-of-order stale response races.

---

[⬅️ Previous Part (13: Form Performance & Optimization)](13-form-performance-and-optimization.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/14-advanced-form-patterns.html) | [Next Part (15: Forms & Controlled Inputs Crucible) ➡️](15-forms-and-controlled-inputs-crucible.md)
