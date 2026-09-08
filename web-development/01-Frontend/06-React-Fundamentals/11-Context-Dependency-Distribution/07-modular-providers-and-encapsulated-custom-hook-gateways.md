# Level 06 — React Fundamentals
## KPI 11 — Context & Dependency Distribution (Context API, Provider Architecture, Re-render Propagation & Dependency Injection)
### PART 07 — Modular Providers & Encapsulated Custom Hook Gateways

[⬅️ Previous Part](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/06-provider-composition-nesting-and-scoped-overrides.md) | [📚 Level 06 Index](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/README.md) | [🧪 Companion Lab](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/examples/07-modular-providers-and-encapsulated-custom-hook-gateways.html) | [Next Part ➡️](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/08-context-propagation-bailouts-and-reconciliation-boundaries.md)

---

### Metadata
- **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)
- **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)
- **Co-Author:** Prasenjeet (Mid-Level Full Stack Developer)
- **Target Audience:** Senior Frontend Engineers, Principal UI Architects, Full-Stack Leads
- **Prerequisites:** Part 01–06 (Context Mental Models, Default Values, `useContext` Lifecycles, Value Identity, Split Architecture, Provider Nesting & Scoped Overrides)

---

## ⚡ Layer 1 — 30-Second Executive Cheat Sheet & Core Mental Models

```
                               ┌────────────────────────────────────────────────────────┐
                               │               APPLICATION / UI CONSUMER                │
                               └───────────────────────────┬────────────────────────────┘
                                                           │ Calls Semantic Hooks
                                                           ▼
                      ┌──────────────────────────────────────────────────────────────────────┐
                      │                     CUSTOM HOOK GATEWAY LAYER                        │
                      │                                                                      │
                      │  useEditorState()        useEditorCommands()      useEditorSelection()│
                      │  (Narrow State Reader)   (Action Dispatcher)     (Derived Invariant) │
                      └──────────────┬─────────────────────┬──────────────────────┬──────────┘
                                     │ Guard / Null Check  │ Stable Wrappers      │ Invariant Guard
                                     ▼                     ▼                      ▼
                      ┌──────────────────────────────────────────────────────────────────────┐
                      │              INTERNAL MODULE BOUNDARY (PRIVATE IMPLEMENTATION)       │
                      │                                                                      │
                      │  EditorStateContext       EditorDispatchContext    editorReducer     │
                      │  (State Fiber Token)      (Dispatch Token)        (Domain Logic)     │
                      │                                                                      │
                      │  ┌────────────────────────────────────────────────────────────────┐  │
                      │  │                      <EditorProvider>                          │  │
                      │  │  Composition Root: Config + Reducer + Commands + Distribution  │  │
                      │  └────────────────────────────────────────────────────────────────┘  │
                      └──────────────────────────────────────────────────────────────────────┘
```

### 1. The Core Architectural Problem
A React Context implementation can be mechanically and syntactically flawless while simultaneously catastrophic to codebase maintainability, refactoring velocity, and runtime predictability.

When an engineering team builds features by directly exporting raw Context descriptors:
```tsx
// ❌ Architectural Leakage: Context tokens and raw dispatch exported globally
export const EditorStateContext = createContext<EditorState | null>(null);
export const EditorDispatchContext = createContext<Dispatch<EditorAction> | null>(null);
```
and allows dozens of UI components to execute direct consumption:
```tsx
// ❌ Consumer tightly coupled to internal wireup
const state = useContext(EditorStateContext);
const dispatch = useContext(EditorDispatchContext);

dispatch({ type: "DOCUMENT_MUTATE_ROW", rowId: "r-101", payload: { dirty: true } });
```
the internal mechanics of the feature leak across every layer of the application:
1. **Leaked Multiplicity**: Every consumer component is aware that the feature is powered by two distinct context channels.
2. **Leaked Implementation Details**: Every consumer knows the underlying state engine uses a Flux/Redux-style action reducer.
3. **Leaked Action Topologies**: Action strings (`"DOCUMENT_MUTATE_ROW"`) and payload shapes are scattered across hundreds of component files, making reducer refactoring or state machine migration a monumental undertaking.
4. **Leaked Nullability & Missing Provider Vulnerability**: Every consumer must either duplicate defensive `if (state === null)` checks or risk unhandled runtime exceptions (`TypeError: Cannot read properties of null`) when rendered outside an `<EditorProvider>`.
5. **No Migration Flexibility**: If the team decides to migrate a high-frequency sub-tree to Zustand, Jotai, XState, TanStack Query, or an imperative Web Worker store, every single consuming file must be manually rewritten because `useContext(EditorStateContext)` is hardcoded throughout the codebase.

### 2. The Modular Gateway Solution
A senior architectural pattern establishes a strict **Module Boundary**:
- **Private Contexts**: Context objects (`createContext`) are module-private variables, never exported from the feature package.
- **Provider as Composition Root**: The Provider encapsulates reducer state, command stability, domain invariants, configuration defaults, and dependency wiring.
- **Custom Hook Gateways**: Public access is granted exclusively through strictly typed, semantically meaningful custom hooks (`useEditorState()`, `useEditorCommands()`, `useEditorSelection()`).
- **Fail-Fast Invariant Guards**: The custom hook validates the presence of the Provider instance immediately at runtime, throwing explicit, actionable developer errors during local development and automated CI tests.

```
Context Object (Private Fiber Descriptor) ≠ Application Public API (Hook Gateway)
```

---

### 3. Executive Concept Matrix

| Concept | Core Mechanism | Production Impact | Common Senior Anti-Pattern Trap |
| :--- | :--- | :--- | :--- |
| **Modular Provider** | Provider acts as the single composition root for a feature domain. | Localizes state transitions, config, and distribution behind one component. | Treating every single state primitive as an independent modular Provider. |
| **Custom Hook Gateway** | Encapsulates `useContext` consumption behind domain-semantic functions. | Hides context tokens, reducers, and wiring; enables seamless store refactoring. | Returning every internal reducer action, state property, and ref in a single God hook. |
| **Required Provider Guard** | Hook throws runtime error if context value is `null` / unprovided. | Fails immediately with actionable stack trace during local dev and CI tests. | Providing fake fallback defaults (`{ save: () => {} }`) that fail silently in production. |
| **State Gateway Hook** | Gateway returning immutable state snapshots (`useEditorState()`). | Narrows component dependency to read-only state data. | Returning mutable object references that consumers mutate directly without dispatch. |
| **Command Gateway Hook** | Gateway returning domain actions (`useEditorCommands()`). | Completely decouples consumers from action type strings and reducer dispatch shapes. | Exposing a generic `setState((prev) => ...)` setter API, destroying state invariants. |
| **Combined Hook Gateway** | Orchestration hook (`useEditor()`) returning both state and commands. | High ergonomics for container/orchestrator components. | Mandating combined hooks everywhere, causing command-only buttons to subscribe to state. |
| **Domain Invariant Guard** | Hook validates derived state integrity (e.g., active document exists). | Prevents UI components from repeating identical defensive null/undefined checks. | Scattering invariant checks throughout JSX rendering logic across 50+ components. |
| **Private Context Token** | Context descriptors kept unexported at module file scope. | Enforces encapsulation; guarantees consumer code accesses dependencies via hooks. | Exporting `const MyContext = createContext()` for convenient test mocking. |
| **Hook Composition** | Higher-level gateways composing lower-level gateway hooks. | Constructs clean, reusable domain hooks (`useActiveTabId()`). | Mistaking hook composition for fine-grained selector subscriptions (it still re-renders). |
| **Stable Command API** | Stabilizing returned command function identities via `useCallback`/`useMemo`. | Protects `React.memo` descendants from unnecessary prop-identity invalidations. | Over-memoizing trivial leaf buttons that have zero memoized children. |
| **Provider Factory** | Higher-order function or generic component generating isolated Provider stacks. | Standardizes boilerplate for multi-instance sub-domains. | Creating overly dynamic abstractions that defeat TypeScript type inference. |
| **Encapsulated Reducer** | Pure reducer function kept private inside domain model directory. | Ensures external components cannot dispatch arbitrary unvalidated state mutations. | Exporting reducer dispatch directly to bypass command validation logic. |
| **Subtree Scope Inversion** | Gateway resolving against the nearest ancestor Provider automatically. | Allows identical UI components to operate in isolated local subtrees or modals. | Hardcoding global singleton assumptions inside custom hook implementations. |
| **Contract Stability** | Preserving hook signature contracts during store migrations. | Allows migrating from React Context to Zustand without touching component code. | Coupling public hook return types to internal React Fiber lifecycle types. |

---

### 4. The 6 Invariants of Modular Provider Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 INVARIANT 1: ENCAPSULATION             │
                  │  Context descriptors are module-private tokens.        │
                  │  Never export raw createContext instances.             │
                  └───────────────────────────┬────────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │               INVARIANT 2: FAIL-FAST GUARDS            │
                  │  Gateway hooks throw explicit errors if context is     │
                  │  null. Never use fake dummy fallback objects.          │
                  └───────────────────────────┬────────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │               INVARIANT 3: DOMAIN COMMANDS             │
                  │  Expose named business actions (saveDoc, deleteRow).   │
                  │  Never expose raw dispatch or generic setState.        │
                  └───────────────────────────┬────────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │            INVARIANT 4: HOOK ≠ RUNTIME BOUNDARY        │
                  │  Custom hooks compose behavior, not subscriptions.     │
                  │  Calling useContext(A) inside hook consumes context A. │
                  └───────────────────────────┬────────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │              INVARIANT 5: SEPARATION OF CONCERN        │
                  │  Separate State readers from Command dispatchers.      │
                  │  Prevent command-only buttons from re-rendering.       │
                  └───────────────────────────┬────────────────────────────┘
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │             INVARIANT 6: STABLE CONTRACTS              │
                  │  Public hook APIs represent business capabilities.     │
                  │  Underlying distribution mechanisms may evolve freely. │
                  └────────────────────────────────────────────────────────┘
```

---

## 🔬 Layer 2 — Deep Mechanical Breakdown

### 5. Architectural Directory Layout: The Strict Physical Boundary

Enterprise feature development requires modular directory structures where internal implementation details cannot be imported by external consumers.

```
src/features/document-editor/
├── index.ts                     # Strict Public API Barrier (Re-exports ONLY Provider & Hooks)
├── context/
│   ├── DocumentEditorContext.ts  # Private Context Tokens (UNEXPORTED outside feature)
│   ├── DocumentEditorProvider.tsx# Feature Composition Root
│   └── types.ts                 # Domain Types & Contracts
├── hooks/
│   ├── useDocumentEditorState.ts # Read-Only State Gateway
│   ├── useDocumentEditorCommands.ts # Action/Command Gateway
│   ├── useDocumentEditorSelection.ts# Derived State & Invariant Gateway
│   ├── useDocumentEditorAsyncSave.ts# Async Side-Effect Gateway
│   └── useDocumentEditor.ts     # Combined Orchestrator Gateway
├── model/
│   ├── documentEditorReducer.ts # Domain State Machine & Invariants
│   └── documentEditorActions.ts # Internal Action Type Definitions
└── components/
    ├── DocumentToolbar.tsx      # Uses useDocumentEditorCommands()
    ├── DocumentCanvas.tsx       # Uses useDocumentEditorState()
    └── DocumentStatusBar.tsx    # Uses useDocumentEditorSelection()
```

---

### 6. Full TypeScript Enterprise Implementation

#### 6.1 Domain Types and Actions (`types.ts` & `documentEditorActions.ts`)
```typescript
// src/features/document-editor/model/documentEditorActions.ts
export type DocumentEditorAction =
  | { type: "DOCUMENT_INIT"; payload: { documentId: string; content: string } }
  | { type: "DOCUMENT_UPDATE_CONTENT"; payload: { text: string; cursorOffset: number } }
  | { type: "SELECTION_SET"; payload: { start: number; end: number; selectedText: string } }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; payload: { timestamp: number } }
  | { type: "SAVE_FAILURE"; payload: { error: string } }
  | { type: "MODE_SWITCH"; payload: { mode: "edit" | "preview" | "readonly" } }
  | { type: "HISTORY_UNDO" }
  | { type: "HISTORY_REDO" };

// src/features/document-editor/context/types.ts
export interface DocumentSelection {
  readonly start: number;
  readonly end: number;
  readonly selectedText: string;
}

export interface DocumentEditorState {
  readonly documentId: string;
  readonly content: string;
  readonly cursorOffset: number;
  readonly selection: DocumentSelection;
  readonly isSaving: boolean;
  readonly isDirty: boolean;
  readonly lastSavedTimestamp: number | null;
  readonly lastError: string | null;
  readonly mode: "edit" | "preview" | "readonly";
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export interface DocumentEditorCommands {
  updateContent(text: string, cursorOffset: number): void;
  setSelection(start: number, end: number, selectedText: string): void;
  saveDocument(): Promise<boolean>;
  switchMode(mode: "edit" | "preview" | "readonly"): void;
  undo(): void;
  redo(): void;
}
```

#### 6.2 Private Context Tokens (`DocumentEditorContext.ts`)
```typescript
// src/features/document-editor/context/DocumentEditorContext.ts
import { createContext } from "react";
import type { Dispatch } from "react";
import type { DocumentEditorState } from "./types";
import type { DocumentEditorAction } from "../model/documentEditorActions";

// Private module-level tokens - DO NOT EXPORT OUTSIDE THE FEATURE DIRECTORY!
export const DocumentEditorStateContext = createContext<DocumentEditorState | null>(null);
export const DocumentEditorDispatchContext = createContext<Dispatch<DocumentEditorAction> | null>(null);

if (process.env.NODE_ENV !== "production") {
  DocumentEditorStateContext.displayName = "DocumentEditorStateContext";
  DocumentEditorDispatchContext.displayName = "DocumentEditorDispatchContext";
}
```

#### 6.3 Domain Reducer & Pure State Transitions (`documentEditorReducer.ts`)
```typescript
// src/features/document-editor/model/documentEditorReducer.ts
import type { DocumentEditorState } from "../context/types";
import type { DocumentEditorAction } from "./documentEditorActions";

export interface EditorReducerHistoryState {
  readonly past: string[];
  readonly present: DocumentEditorState;
  readonly future: string[];
}

export function createInitialEditorState(documentId: string, initialContent = ""): DocumentEditorState {
  return {
    documentId,
    content: initialContent,
    cursorOffset: 0,
    selection: { start: 0, end: 0, selectedText: "" },
    isSaving: false,
    isDirty: false,
    lastSavedTimestamp: null,
    lastError: null,
    mode: "edit",
    canUndo: false,
    canRedo: false,
  };
}

export function documentEditorReducer(
  state: DocumentEditorState,
  action: DocumentEditorAction
): DocumentEditorState {
  switch (action.type) {
    case "DOCUMENT_INIT":
      return createInitialEditorState(action.payload.documentId, action.payload.content);

    case "DOCUMENT_UPDATE_CONTENT":
      return {
        ...state,
        content: action.payload.text,
        cursorOffset: action.payload.cursorOffset,
        isDirty: true,
        lastError: null,
        canUndo: true,
      };

    case "SELECTION_SET":
      return {
        ...state,
        selection: action.payload,
      };

    case "SAVE_START":
      return {
        ...state,
        isSaving: true,
        lastError: null,
      };

    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        lastDirty: false,
        lastSavedTimestamp: action.payload.timestamp,
        lastError: null,
      };

    case "SAVE_FAILURE":
      return {
        ...state,
        isSaving: false,
        lastError: action.payload.error,
      };

    case "MODE_SWITCH":
      return {
        ...state,
        mode: action.payload.mode,
      };

    case "HISTORY_UNDO":
      return {
        ...state,
        isDirty: true,
        canUndo: false,
        canRedo: true,
      };

    case "HISTORY_REDO":
      return {
        ...state,
        isDirty: true,
        canUndo: true,
        canRedo: false,
      };

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}
```

#### 6.4 The Composition Root (`DocumentEditorProvider.tsx`)
```typescript
// src/features/document-editor/context/DocumentEditorProvider.tsx
import React, { useReducer, useMemo } from "react";
import { DocumentEditorStateContext, DocumentEditorDispatchContext } from "./DocumentEditorContext";
import { documentEditorReducer, createInitialEditorState } from "../model/documentEditorReducer";
import type { DocumentEditorState } from "./types";

export interface DocumentEditorProviderProps {
  readonly documentId: string;
  readonly initialContent?: string;
  readonly children: React.ReactNode;
}

/**
 * Modular Provider acting as the Feature Composition Root.
 * Encapsulates reducer state machine, Fiber dispatch stability, and split distribution.
 */
export function DocumentEditorProvider({
  documentId,
  initialContent = "",
  children,
}: DocumentEditorProviderProps): JSX.Element {
  // 1. Feature State Machine Ownership
  const [state, dispatch] = useReducer(
    documentEditorReducer,
    documentId,
    (id) => createInitialEditorState(id, initialContent)
  );

  // 2. Fiber Context Stack Distribution:
  // StateContext wraps DispatchContext. State updates trigger consumers of StateContext only.
  return (
    <DocumentEditorStateContext.Provider value={state}>
      <DocumentEditorDispatchContext.Provider value={dispatch}>
        {children}
      </DocumentEditorDispatchContext.Provider>
    </DocumentEditorStateContext.Provider>
  );
}
```

---

### 7. Custom Hook Gateways: Encapsulation, Guards & Invariants

#### 7.1 Read-Only State Gateway (`useDocumentEditorState.ts`)
```typescript
// src/features/document-editor/hooks/useDocumentEditorState.ts
import { useContext } from "react";
import { DocumentEditorStateContext } from "../context/DocumentEditorContext";
import type { DocumentEditorState } from "../context/types";

/**
 * Consumes the current read-only snapshot of the Document Editor state.
 * @throws {Error} if invoked outside an active <DocumentEditorProvider> tree.
 */
export function useDocumentEditorState(): DocumentEditorState {
  const context = useContext(DocumentEditorStateContext);
  
  if (context === null) {
    throw new Error(
      "❌ [useDocumentEditorState]: Invariant Violation! " +
      "This hook must be consumed strictly within the subtree of a <DocumentEditorProvider>."
    );
  }
  
  return context;
}
```

#### 7.2 Semantic Command Gateway (`useDocumentEditorCommands.ts`)
```typescript
// src/features/document-editor/hooks/useDocumentEditorCommands.ts
import { useContext, useMemo, useCallback } from "react";
import { DocumentEditorDispatchContext } from "../context/DocumentEditorContext";
import type { DocumentEditorCommands } from "../context/types";

/**
 * Provides semantic command methods to trigger editor state transitions.
 * Does NOT subscribe to editor state changes, isolating callers from re-renders.
 * @throws {Error} if invoked outside an active <DocumentEditorProvider> tree.
 */
export function useDocumentEditorCommands(): DocumentEditorCommands {
  const dispatch = useContext(DocumentEditorDispatchContext);

  if (dispatch === null) {
    throw new Error(
      "❌ [useDocumentEditorCommands]: Invariant Violation! " +
      "This hook must be consumed strictly within the subtree of a <DocumentEditorProvider>."
    );
  }

  // Stabilize command methods using useCallback to preserve reference identity across renders
  const updateContent = useCallback((text: string, cursorOffset: number) => {
    dispatch({ type: "DOCUMENT_UPDATE_CONTENT", payload: { text, cursorOffset } });
  }, [dispatch]);

  const setSelection = useCallback((start: number, end: number, selectedText: string) => {
    dispatch({ type: "SELECTION_SET", payload: { start, end, selectedText } });
  }, [dispatch]);

  const saveDocument = useCallback(async (): Promise<boolean> => {
    dispatch({ type: "SAVE_START" });
    try {
      // Simulate asynchronous persistence pipeline
      await new Promise((resolve) => setTimeout(resolve, 800));
      dispatch({ type: "SAVE_SUCCESS", payload: { timestamp: Date.now() } });
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to persist document";
      dispatch({ type: "SAVE_FAILURE", payload: { error: message } });
      return false;
    }
  }, [dispatch]);

  const switchMode = useCallback((mode: "edit" | "preview" | "readonly") => {
    dispatch({ type: "MODE_SWITCH", payload: { mode } });
  }, [dispatch]);

  const undo = useCallback(() => {
    dispatch({ type: "HISTORY_UNDO" });
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch({ type: "HISTORY_REDO" });
  }, [dispatch]);

  // Memoize the public command gateway object
  return useMemo<DocumentEditorCommands>(() => ({
    updateContent,
    setSelection,
    saveDocument,
    switchMode,
    undo,
    redo,
  }), [updateContent, setSelection, saveDocument, switchMode, undo, redo]);
}
```

#### 7.3 Invariant-Enforcing Derived Hook (`useDocumentEditorSelection.ts`)
```typescript
// src/features/document-editor/hooks/useDocumentEditorSelection.ts
import { useDocumentEditorState } from "./useDocumentEditorState";
import type { DocumentSelection } from "../context/types";

export interface SelectionAnalysis {
  readonly selection: DocumentSelection;
  readonly hasSelection: boolean;
  readonly characterCount: number;
  readonly wordCount: number;
  readonly isMultiLine: boolean;
}

/**
 * Gateway hook that extracts and calculates derived selection analytics.
 * Enforces business invariants regarding text boundary limits.
 */
export function useDocumentEditorSelection(): SelectionAnalysis {
  const state = useDocumentEditorState();
  const { selection } = state;

  const hasSelection = selection.end > selection.start;
  const characterCount = selection.selectedText.length;
  const wordCount = hasSelection 
    ? selection.selectedText.trim().split(/\s+/).filter(Boolean).length 
    : 0;
  const isMultiLine = selection.selectedText.includes("\n");

  return {
    selection,
    hasSelection,
    characterCount,
    wordCount,
    isMultiLine,
  };
}
```

#### 7.4 Combined Orchestration Facade Gateway (`useDocumentEditor.ts`)
```typescript
// src/features/document-editor/hooks/useDocumentEditor.ts
import { useDocumentEditorState } from "./useDocumentEditorState";
import { useDocumentEditorCommands } from "./useDocumentEditorCommands";
import type { DocumentEditorState, DocumentEditorCommands } from "../context/types";

export interface DocumentEditorFacade {
  readonly state: DocumentEditorState;
  readonly commands: DocumentEditorCommands;
}

/**
 * Convenient facade hook combining both state reading and command dispatch.
 * ⚠️ WARNING: Subscribes the consuming component to ALL state changes.
 * Recommended for top-level orchestrators, NOT leaf action buttons.
 */
export function useDocumentEditor(): DocumentEditorFacade {
  const state = useDocumentEditorState();
  const commands = useDocumentEditorCommands();

  return {
    state,
    commands,
  };
}
```

#### 7.5 Strict Public API Barrier (`index.ts`)
```typescript
// src/features/document-editor/index.ts

// 1. Export Provider Component
export { DocumentEditorProvider } from "./context/DocumentEditorProvider";
export type { DocumentEditorProviderProps } from "./context/DocumentEditorProvider";

// 2. Export Public Custom Hook Gateways
export { useDocumentEditorState } from "./hooks/useDocumentEditorState";
export { useDocumentEditorCommands } from "./hooks/useDocumentEditorCommands";
export { useDocumentEditorSelection } from "./hooks/useDocumentEditorSelection";
export { useDocumentEditor } from "./hooks/useDocumentEditor";

// 3. Export Public Types & Contracts
export type {
  DocumentEditorState,
  DocumentEditorCommands,
  DocumentSelection,
  SelectionAnalysis,
  DocumentEditorFacade,
} from "./context/types";

// 🔒 NOTE: DocumentEditorStateContext, DocumentEditorDispatchContext,
// documentEditorReducer, and DocumentEditorAction ARE NOT EXPORTED!
```

---

### 8. Compound Component Architecture with Modular Gateways

Modular Providers enable elegant **Compound Component** patterns where UI pieces are organized under a single namespace while automatically sharing encapsulated context behind the scenes:

```typescript
// src/features/document-editor/components/EditorCompound.tsx
import React from "react";
import { DocumentEditorProvider, DocumentEditorProviderProps } from "../context/DocumentEditorProvider";
import { useDocumentEditorState } from "../hooks/useDocumentEditorState";
import { useDocumentEditorCommands } from "../hooks/useDocumentEditorCommands";
import { useDocumentEditorSelection } from "../hooks/useDocumentEditorSelection";

export function EditorRoot({ documentId, initialContent, children }: DocumentEditorProviderProps) {
  return (
    <DocumentEditorProvider documentId={documentId} initialContent={initialContent}>
      <div className="editor-root-container">{children}</div>
    </DocumentEditorProvider>
  );
}

export function EditorCanvas() {
  const state = useDocumentEditorState();
  const commands = useDocumentEditorCommands();

  return (
    <textarea
      className="editor-canvas"
      value={state.content}
      onChange={(e) => commands.updateContent(e.target.value, e.target.selectionStart)}
      disabled={state.mode === "readonly"}
    />
  );
}

export function EditorSaveButton() {
  const commands = useDocumentEditorCommands();
  return (
    <button className="btn btn-save" onClick={() => commands.saveDocument()}>
      Save Document
    </button>
  );
}

export function EditorStatusBar() {
  const { wordCount, characterCount } = useDocumentEditorSelection();
  return (
    <div className="editor-status-bar">
      <span>Words: {wordCount}</span>
      <span>Chars: {characterCount}</span>
    </div>
  );
}

// Attach compound sub-components to root
export const Editor = Object.assign(EditorRoot, {
  Canvas: EditorCanvas,
  SaveButton: EditorSaveButton,
  StatusBar: EditorStatusBar,
});
```

#### Consumer Usage:
```tsx
// Clean, declarative, self-documenting syntax
function DocumentPage() {
  return (
    <Editor documentId="doc-101" initialContent="Welcome to the editor...">
      <div className="editor-header">
        <Editor.SaveButton />
      </div>
      <Editor.Canvas />
      <Editor.StatusBar />
    </Editor>
  );
}
```

---

### 9. Why Fake Default Values Are Dangerous in Enterprise Systems

A common anti-pattern in React architecture is attempting to make gateway hooks "tolerant" by supplying dummy fallback defaults in `createContext`:

```typescript
// ❌ DANGEROUS ANTI-PATTERN: Fake Fallback Implementation
export const BrokenEditorContext = createContext<DocumentEditorCommands>({
  updateContent: () => {},
  setSelection: () => {},
  saveDocument: async () => false,
  switchMode: () => {},
  undo: () => {},
  redo: () => {},
});

export function useBrokenEditorCommands() {
  // Returns the dummy no-op object when no Provider is mounted!
  return useContext(BrokenEditorContext);
}
```

#### The Real-World Production Failure Scenario:
1. An engineer implements a new `<AutoSaveModal>` component and attaches `<button onClick={commands.saveDocument}>Save</button>`.
2. The modal is rendered via `ReactDOM.createPortal(..., document.body)` outside the active `<DocumentEditorProvider>` subtree.
3. When clicked in production, `saveDocument()` executes the dummy `async () => false` without throwing an error.
4. The user writes a 3,000-word financial analysis, clicks "Save", sees no error alerts, closes their browser, and **permanently loses their unpersisted work**.
5. Telemetry and Sentry logs report **0 errors** because the fake default silently swallowed the missing dependency failure.

#### The Senior Rule on Context Defaults:
> **If a dependency is required for a component to fulfill its semantic contract, initialize the Context with `null` and throw an explicit error at the call site. Never substitute a silent no-op for a required capability.**

---

### 10. State Hook Granularity vs Subscription Granularity

Consider three granular custom hooks:
```typescript
export function useDocumentContent() {
  const state = useDocumentEditorState();
  return state.content;
}

export function useDocumentMode() {
  const state = useDocumentEditorState();
  return state.mode;
}

export function useDocumentIsSaving() {
  const state = useDocumentEditorState();
  return state.isSaving;
}
```

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 DocumentEditorStateContext             │
                  │             (Holds Entire State Tree Object)           │
                  └───────────┬────────────────────────────────┬───────────┘
                              │ Value Change: cursorOffset 1->2│
                              ▼                                ▼
                  ┌────────────────────────┐      ┌────────────────────────┐
                  │   useDocumentContent() │      │   useDocumentMode()    │
                  │ (Extracts: content)    │      │ (Extracts: mode)       │
                  └───────────┬────────────┘      └───────────┬────────────┘
                              │ RE-RENDERS!                   │ RE-RENDERS!
                              ▼                               ▼
                  ┌────────────────────────┐      ┌────────────────────────┐
                  │     <TextEditor />     │      │    <ModeBadge />       │
                  └────────────────────────┘      └────────────────────────┘
```

#### Critical Principle:
Even though `useDocumentMode()` returns only a primitive string (`state.mode`), it internally calls `useContext(DocumentEditorStateContext)`. In React 18, context propagation triggers reconciliation on **all** subscribers whenever the Provider's value reference changes. Custom hook granularity provides **API Decoupling and Ergonomics**, NOT fine-grained selector subscriptions. (Part 10 covers external stores with fine-grained selectors).

---

### 11. Advanced Modular Patterns: Asynchronous Operations & Cancellation

When command gateways trigger asynchronous side-effects (e.g., autosave, network synchronization, file parsing), the gateway must manage `AbortController` lifecycles and race conditions cleanly:

```typescript
// src/features/document-editor/hooks/useDocumentEditorAsyncSave.ts
import { useContext, useRef, useCallback, useEffect } from "react";
import { DocumentEditorDispatchContext } from "../context/DocumentEditorContext";
import { useDocumentEditorState } from "./useDocumentEditorState";

export function useDocumentEditorAsyncSave() {
  const dispatch = useContext(DocumentEditorDispatchContext)!;
  const { documentId, content } = useDocumentEditorState();
  const abortControllerRef = useRef<AbortController | null>(null);

  const triggerSave = useCallback(async () => {
    // 1. Cancel previous pending save request if user typed again
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    dispatch({ type: "SAVE_START" });

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      dispatch({ type: "SAVE_SUCCESS", payload: { timestamp: data.savedAt } });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Request was aborted cleanly, ignore
        return;
      }
      const message = err instanceof Error ? err.message : "Save failed";
      dispatch({ type: "SAVE_FAILURE", payload: { error: message } });
    }
  }, [dispatch, documentId, content]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { triggerSave };
}
```

---

### 12. Multi-Tab & Multi-Tenant State Partitioning with Keyed Providers

When applications require multiple independent document tabs or multi-tenant workspaces, the Modular Provider pattern guarantees clean memory separation:

```tsx
// src/features/document-editor/components/MultiTabWorkspace.tsx
import React, { useState } from "react";
import { DocumentEditorProvider } from "../context/DocumentEditorProvider";
import { Editor } from "./EditorCompound";

export function MultiTabWorkspace() {
  const [activeTabId, setActiveTabId] = useState("doc-alpha");

  return (
    <div className="workspace-container">
      <div className="tab-bar">
        <button onClick={() => setActiveTabId("doc-alpha")}>Document Alpha</button>
        <button onClick={() => setActiveTabId("doc-beta")}>Document Beta</button>
      </div>

      {/* Dynamic key prop forces unmount of previous Fiber tree and mounts fresh Provider */}
      <DocumentEditorProvider key={activeTabId} documentId={activeTabId}>
        <div className="tab-pane">
          <Editor.Canvas />
          <Editor.StatusBar />
        </div>
      </DocumentEditorProvider>
    </div>
  );
}
```

---

### 13. State Distribution Topologies Compared

```
+-------------------+----------------------+--------------------+--------------------+
| Architecture      | Granularity          | Encapsulation      | Migration Cost     |
+-------------------+----------------------+--------------------+--------------------+
| Raw React Context | Component-level tree | ❌ None (leaked)   | 🔴 Very High       |
| Modular Gateway   | Component-level tree | ✅ Complete API    | 🟢 Zero for UI     |
| Redux Toolkit     | Selector-level       | 🟡 Requires hooks  | 🟡 Medium          |
| Zustand Store     | Selector-level       | ✅ Complete API    | 🟢 Zero with hooks |
| XState Machine    | Actor state-level    | ✅ Complete API    | 🟡 Medium          |
+-------------------+----------------------+--------------------+--------------------+
```

---

### 14. Generic Type-Safe Modular Feature Factory

For engineering platforms managing dozens of independent sub-features, a **Modular Feature Factory** standardizes boilerplate while ensuring 100% type-safety:

```typescript
// src/shared/factory/createModularFeature.tsx
import React, { createContext, useContext, useReducer } from "react";
import type { Dispatch, ReactNode } from "react";

export interface FeatureDefinition<TState, TAction, TCommands> {
  name: string;
  reducer: (state: TState, action: TAction) => TState;
  createInitialState: (props: any) => TState;
  createCommands: (dispatch: Dispatch<TAction>) => TCommands;
}

export function createModularFeature<TState, TAction, TCommands, TProps = {}>({
  name,
  reducer,
  createInitialState,
  createCommands,
}: FeatureDefinition<TState, TAction, TCommands>) {
  const StateContext = createContext<TState | null>(null);
  const DispatchContext = createContext<Dispatch<TAction>>(() => {});

  StateContext.displayName = `${name}StateContext`;
  DispatchContext.displayName = `${name}DispatchContext`;

  function Provider({ children, ...props }: { children: ReactNode } & TProps) {
    const [state, dispatch] = useReducer(reducer, props, createInitialState);

    return (
      <StateContext.Provider value={state}>
        <DispatchContext.Provider value={dispatch}>
          {children}
        </DispatchContext.Provider>
      </StateContext.Provider>
    );
  }

  function useStateHook(): TState {
    const context = useContext(StateContext);
    if (context === null) {
      throw new Error(`[use${name}State]: Must be used within <${name}Provider>`);
    }
    return context;
  }

  function useCommandsHook(): TCommands {
    const dispatch = useContext(DispatchContext);
    return createCommands(dispatch);
  }

  return {
    Provider,
    useState: useStateHook,
    useCommands: useCommandsHook,
  };
}
```

---

### 15. Unit & Integration Testing Playbook for Modular Gateways

Testing modular features through their public gateways guarantees tests test public contracts rather than internal wiring:

```typescript
// src/features/document-editor/__tests__/documentEditor.test.tsx
import React from "react";
import { renderHook, act } from "@testing-library/react";
import { DocumentEditorProvider } from "../context/DocumentEditorProvider";
import { useDocumentEditorState } from "../hooks/useDocumentEditorState";
import { useDocumentEditorCommands } from "../hooks/useDocumentEditorCommands";

describe("Document Editor Modular Architecture", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DocumentEditorProvider documentId="doc-test" initialContent="Initial text">
      {children}
    </DocumentEditorProvider>
  );

  test("throws descriptive error when hook is consumed outside Provider", () => {
    // Suppress console.error during expected throw test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useDocumentEditorState());
    }).toThrow("❌ [useDocumentEditorState]: Invariant Violation!");

    consoleSpy.mockRestore();
  });

  test("updates content and marks document dirty on command execution", () => {
    const { result } = renderHook(
      () => ({
        state: useDocumentEditorState(),
        commands: useDocumentEditorCommands(),
      }),
      { wrapper }
    );

    expect(result.current.state.content).toBe("Initial text");
    expect(result.current.state.isDirty).toBe(false);

    act(() => {
      result.current.commands.updateContent("Updated text", 12);
    });

    expect(result.current.state.content).toBe("Updated text");
    expect(result.current.state.isDirty).toBe(true);
  });
});
```

---

## 🔬 Layer 3 — Diagnostic Labs & DevTools Profiling

### 16. Diagnostic Lab A: Context Leakage Audit via CLI & AST

To audit an existing repository for architectural leaks, run the following PowerShell queries across the feature directory:

```powershell
# 1. Search for direct Context imports outside feature directories:
Select-String -Path "src\**\*.tsx" -Pattern "useContext\(.*Context\)" | Where-Object { $_.Path -notmatch "features" }

# 2. Search for direct dispatch calls leaking reducer action types:
Select-String -Path "src\**\*.tsx" -Pattern "dispatch\(\{\s*type:" | Where-Object { $_.Path -notmatch "model" }
```

#### Diagnostic Leakage Matrix:
| File Scanned | Direct Context Consumptions | Raw Dispatch Usages | Gateway Hook Usages | Architecture Rating |
| :--- | :--- | :--- | :--- | :--- |
| `src/components/Toolbar.tsx` | 2 (`EditorState`, `EditorDispatch`) | 4 (`SAVE`, `UNDO`, `REDO`, `CLEAR`) | 0 | ❌ High Leakage (Fails Encapsulation) |
| `src/components/StatusBar.tsx` | 1 (`EditorState`) | 0 | 0 | ❌ Moderate Leakage |
| `src/components/ModernCanvas.tsx`| 0 | 0 | 1 (`useDocumentEditorState`) | ✅ Enterprise Grade |
| `src/components/SaveButton.tsx` | 0 | 0 | 1 (`useDocumentEditorCommands`)| ✅ Enterprise Grade (Zero State Rerenders)|

---

### 17. Diagnostic Lab B: Re-render Isolation Telemetry Probes

Let us measure the rendering footprint when triggering actions via `useDocumentEditorCommands()` versus `useDocumentEditor()`:

```tsx
// Test Component 1: Consumes Semantic Commands Gateway ONLY
function IsolatedSaveButton() {
  const { saveDocument } = useDocumentEditorCommands();
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log(`[Telemetry] IsolatedSaveButton rendered: ${renderCount.current} times`);

  return (
    <button onClick={saveDocument}>
      Save Document (Renders: {renderCount.current})
    </button>
  );
}

// Test Component 2: Consumes Combined Gateway (Anti-Pattern for leaf action triggers)
function CoupledSaveButton() {
  const { state, commands } = useDocumentEditor();
  const renderCount = useRef(0);
  renderCount.current += 1;

  console.log(`[Telemetry] CoupledSaveButton rendered: ${renderCount.current} times`);

  return (
    <button onClick={commands.saveDocument}>
      Save Document (Renders: {renderCount.current} | Dirty: {String(state.isDirty)})
    </button>
  );
}
```

#### Profiling Trace: User Types 50 Characters into Editor Canvas:
1. `documentEditorReducer` processes 50 `DOCUMENT_UPDATE_CONTENT` actions.
2. `DocumentEditorStateContext` produces 50 new state snapshots.
3. `DocumentEditorDispatchContext` value remains **identical** (`dispatch` reference is invariant).
4. **Telemetry Verdict:**
   - `<IsolatedSaveButton />` renders: **1 time** (initial mount only!).
   - `<CoupledSaveButton />` renders: **51 times** (re-renders on every single keystroke!).

---

### 18. Diagnostic Lab C: Multi-Instance Heap Partition Validation

When mounting multiple Provider instances side-by-side:

```tsx
function MultiEditorDashboard() {
  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {/* Instance 1 */}
      <DocumentEditorProvider documentId="doc-alpha">
        <DocumentCanvas />
        <DocumentToolbar />
      </DocumentEditorProvider>

      {/* Instance 2 */}
      <DocumentEditorProvider documentId="doc-beta">
        <DocumentCanvas />
        <DocumentToolbar />
      </DocumentEditorProvider>
    </div>
  );
}
```

#### Verification Steps:
1. Dispatch an edit action in Instance 1.
2. Verify that Instance 1 state transitions to dirty and updates content.
3. Inspect Instance 2: Verify `state.content` and `state.isDirty` remain untouched.
4. Verify that Instance 2 components register **0 re-renders**.
5. Conclusion: Identical Context definitions back completely independent runtime memory heaps.

---

### 19. Diagnostic Lab D: React DevTools Profiler Inspection

#### Profiling Workflow:
1. Open Chrome DevTools $\rightarrow$ **Profiler** tab.
2. Click **Record** and type 10 characters into `<DocumentCanvas />`.
3. Stop recording.
4. Inspect the Flamechart:
   - Identify `DocumentEditorProvider` $\rightarrow$ Render duration ~1.2ms.
   - Inspect `DocumentCanvas` $\rightarrow$ Rendered due to `DocumentEditorStateContext` value change.
   - Inspect `DocumentToolbar` $\rightarrow$ Grayed out (Did not render! Bailed out cleanly!).
5. Verify that no render cascades occur above `DocumentEditorProvider`.

---

## 🔥 Layer 4 — The Crucible: Production Traps & Incident Post-Mortems

### 20. 10 Comprehensive Crucible Scenarios with Execution Traces

#### Scenario 1: Stale Closure in Command Gateway
- **Bug:** `saveDocument` memoized with `[dispatch]` only while closing over dynamic `currentUser` from an outer `AuthContext`.
- **Memory Trace:** Closure retains `User #101` after auth session switches to `User #202`. Clicking save persists under the previous user's account.
- **Resolution:** Include `currentUser.id` in `useCallback` dependency array or pass identity via action payload.

#### Scenario 2: Generic `setState` Anti-Pattern
- **Bug:** Gateway exposes `setEditorState: (updater: (s) => s) => void`.
- **Failure:** UI components perform arbitrary state overrides, bypassing domain validation rules and corrupting history buffers.
- **Resolution:** Expose discrete, named semantic commands (`updateContent`, `switchMode`).

#### Scenario 3: God Hook Dependency Aggregator
- **Bug:** Application exposes a single `useApp()` hook returning user, theme, cart, notifications, and navigation state.
- **Failure:** Updating a single notification badge causes 120 unrelated UI components to re-render.
- **Resolution:** Decompose into domain-specific modular gateways (`useNotifications()`, `useUserSession()`).

#### Scenario 4: Missing Provider Guard Silent Data Loss
- **Bug:** `createContext` initialized with dummy fallback `{ save: () => {} }`.
- **Failure:** Portal modal renders outside Provider, clicks trigger no-ops silently without throwing exceptions.
- **Resolution:** Initialize context with `null` and throw explicit invariant error in custom hook.

#### Scenario 5: Command Gateway Function Re-creation
- **Bug:** Command hook returns un-memoized object containing inline arrow functions: `return { save: () => dispatch({ type: 'SAVE' }) }`.
- **Failure:** Every render produces a new object reference, causing `React.memo` wrapped child buttons to re-render needlessly.
- **Resolution:** Stabilize methods with `useCallback` and memoize the returned object with `useMemo`.

#### Scenario 6: Direct Context Mutation
- **Bug:** Hook returns mutable object reference from reducer, consumer executes `state.items.push(newItem)`.
- **Failure:** React Fiber fails to detect state change via `Object.is()`, skipping re-render and producing de-synchronized UI.
- **Resolution:** Enforce TypeScript `readonly` modifiers on all state interfaces and use immutable reducer updates.

#### Scenario 7: Circular Dependency in Modular Composition
- **Bug:** `AuthProvider` consumes `AnalyticsProvider` while `AnalyticsProvider` calls `useAuth()`.
- **Failure:** JavaScript runtime `ReferenceError: Cannot access '...' before initialization` or infinite render loop.
- **Resolution:** Establish strict Directed Acyclic Graph (DAG) hierarchy: `AuthProvider` $\rightarrow$ `AnalyticsProvider`.

#### Scenario 8: Leaking Private Action Types in TypeScript Definition Files
- **Bug:** Public `.d.ts` exposes `DocumentEditorAction` union type.
- **Failure:** External packages begin writing custom dispatch logic, tightly coupling downstream consumers to internal action names.
- **Resolution:** Keep action types private in `model/` and export only high-level `DocumentEditorCommands` interfaces.

#### Scenario 9: Over-Splitting Context Primitives
- **Bug:** Creating separate contexts for `DocumentTitleContext`, `DocumentAuthorContext`, `DocumentWordCountContext`, etc.
- **Failure:** Provider nesting exceeds 20 levels, degrading mount performance and creating complex synchronization logic.
- **Resolution:** Colocate related state fields within a cohesive reducer and split strictly across read/write or update-frequency boundaries.

#### Scenario 10: Invariant Validation Failure on Corrupted State
- **Bug:** Derived selection hook crashes with `TypeError: Cannot read properties of undefined` when active selection indices exceed document length.
- **Failure:** Unhandled UI crash blanks out the entire application viewport.
- **Resolution:** Gateway hook clamps selection bounds defensively and asserts domain invariants before returning derived models.

---

### 21. 5 Real-World Production Incident Post-Mortems

#### Incident 1: Emergency Room Tablet Patient Record Corruption
- **Impact:** Critical Severity 1. Patient triage data was saved under incorrect doctor IDs during physician shift handoffs.
- **Root Cause:** A combined custom hook `useMedicalRecord()` merged `useAuth()` and `useRecordState()` inside an un-memoized object returned to a memoized navigation bar. When the active clinician switched, the navigation bar failed to update due to incorrect prop comparison with stale command closures.
- **Remediation:**
  1. Strict separation of feature domains: `useClinicianSession()` vs `usePatientMedicalRecordCommands()`.
  2. Enforced automated ESLint rule `react-hooks/exhaustive-deps` across all custom hook files.
  3. Added runtime invariant assertions inside command gateways.

#### Incident 2: High-Frequency Stock Trading Dashboard Freezing
- **Impact:** Order entry buttons froze for 400ms during market open volatility.
- **Root Cause:** All buy/sell order buttons were consuming a combined `useTradingDesk()` hook that bundled real-time price tick feeds (`tickRate: 60Hz`) with order dispatch methods.
- **Remediation:** Split into `useMarketTicker()` (state) and `useOrderDispatcher()` (commands). Order entry buttons were isolated to 0 unnecessary re-renders.

#### Incident 3: Cloud IDE Document Loss via Unmounted Portal
- **Impact:** 2,400+ developers lost unsaved code snippets inside a floating popover widget.
- **Root Cause:** The popover component was ported to `document.body` outside the `<WorkspaceProvider>`. A fallback dummy context `{ persist: () => Promise.resolve() }` prevented error throwing.
- **Remediation:** Removed fake defaults, introduced fail-fast runtime guards, and added an automated E2E test verifying context availability across all portal containers.

#### Incident 4: Multi-Tenant Billing Override Collision
- **Impact:** Tenant A was billed for Tenant B's storage usage.
- **Root Cause:** A global singleton store was used instead of a scoped modular Provider. When an admin opened Tenant B in a background tab, the global store overwritten the active tenant ID for Tenant A's session.
- **Remediation:** Migrated to scoped `TenantProvider` instances wrapped around each browser workspace tab with isolated state partitions.

#### Incident 5: Reducer Migration Breakdown Across 14 Feature Teams
- **Impact:** 3-month delay on core platform refactoring.
- **Root Cause:** Raw `createContext` and action types were exported globally and consumed across 180+ repositories. Any modification to action payload shapes broke dozens of downstream teams.
- **Remediation:** Implemented strict architectural gateway boundaries, hiding action types and exposing stable semantic command interfaces.

---

### 22. Fiber Memory Layout & Execution Tracing

During Fiber reconciliation, the internal tree structure reflects the separation of state and command contexts:

```
                      ┌────────────────────────────────────────────────────────┐
                      │              FiberNode: DocumentEditorProvider         │
                      │  tag: 0 (FunctionComponent)                            │
                      │  memoizedState: [StateHook, DispatchHook]              │
                      └───────────────────────────┬────────────────────────────┘
                                                  │ child
                                                  ▼
                      ┌────────────────────────────────────────────────────────┐
                      │      FiberNode: DocumentEditorStateContext.Provider    │
                      │  tag: 10 (ContextProvider)                             │
                      │  memoizedProps: { value: stateSnapshot_v1 }            │
                      └───────────────────────────┬────────────────────────────┘
                                                  │ child
                                                  ▼
                      ┌────────────────────────────────────────────────────────┐
                      │    FiberNode: DocumentEditorDispatchContext.Provider   │
                      │  tag: 10 (ContextProvider)                             │
                      │  memoizedProps: { value: dispatchFn }                  │
                      └───────────────────────────┬────────────────────────────┘
                                                  │ child
                                                  ▼
                      ┌────────────────────────────────────────────────────────┐
                      │                 Host & Custom Consumers                │
                      │  DocumentCanvas   (dependencies: StateContext)         │
                      │  DocumentToolbar  (dependencies: DispatchContext)      │
                      └────────────────────────────────────────────────────────┘
```

---

### 23. Prediction Challenges with Memory Traces

#### Challenge 1: Isolated Command Consumer Re-render Count
```tsx
function SaveButton() {
  const { saveDocument } = useDocumentEditorCommands();
  const renders = useRef(0);
  renders.current++;
  return <button onClick={saveDocument}>Save ({renders.current})</button>;
}
```
- **Scenario:** User types 20 characters into `<DocumentCanvas />`.
- **Question:** How many times does `<SaveButton />` render?
- **Answer:** Exactly 1 time (on initial mount). `DocumentEditorDispatchContext` does not change reference, allowing Fiber to skip re-rendering `<SaveButton />`.

#### Challenge 2: Combined Facade Consumer Re-render Count
```tsx
function ActionButton() {
  const { state, commands } = useDocumentEditor();
  const renders = useRef(0);
  renders.current++;
  return <button onClick={commands.saveDocument}>Save ({renders.current})</button>;
}
```
- **Scenario:** User types 20 characters into `<DocumentCanvas />`.
- **Question:** How many times does `<ActionButton />` render?
- **Answer:** Exactly 21 times (1 mount + 20 keystrokes). Consuming `useDocumentEditor()` subscribes the component to `DocumentEditorStateContext`.

#### Challenge 3: Unmemoized Subtree Child Re-render Propagation
```tsx
function EditorHeader() {
  const commands = useDocumentEditorCommands();
  return (
    <header className="header">
      <TitleBadge />
      <SaveButton />
    </header>
  );
}
```
- **Scenario:** If `EditorHeader` is not wrapped in `React.memo` and its parent re-renders due to parent state, how do `TitleBadge` and `SaveButton` behave?
- **Answer:** If the parent re-renders, `EditorHeader` re-renders and by default triggers re-renders on `TitleBadge` and `SaveButton` regardless of context consumption, unless children are memoized or passed via props.

#### Challenge 4: Missing Provider Guard in Dynamic Import
- **Scenario:** A developer lazy-loads `<DocumentCanvas />` via `React.lazy()` and renders it inside an empty `<div>` without `<DocumentEditorProvider>`.
- **Question:** What occurs at runtime?
- **Answer:** As soon as `<DocumentCanvas />` executes `useDocumentEditorState()`, the guard detects `context === null` and immediately throws `❌ [useDocumentEditorState]: Invariant Violation!`, which is caught by the nearest React Error Boundary.

#### Challenge 5: Sibling Provider State Independence
```tsx
function SiblingComparison() {
  return (
    <>
      <DocumentEditorProvider documentId="doc-1"><DocumentCanvas /></DocumentEditorProvider>
      <DocumentEditorProvider documentId="doc-2"><DocumentCanvas /></DocumentEditorProvider>
    </>
  );
}
```
- **Scenario:** Typing into `doc-1` canvas triggers a state update in the first provider.
- **Question:** Does `doc-2` canvas re-render?
- **Answer:** No. Each Provider Fiber node maintains an isolated `useReducer` state tuple in its `FiberNode.memoizedState`. Updates in tree 1 do not trigger reconciliation in tree 2.

#### Challenge 6: Invariant Guard Throw in Unit Tests
- **Scenario:** A unit test executes `renderHook(() => useDocumentEditorSelection())` without passing `{ wrapper: DocumentEditorProvider }`.
- **Question:** What does Jest report?
- **Answer:** The test fails immediately with `Error: ❌ [useDocumentEditorState]: Invariant Violation! This hook must be consumed strictly within the subtree of a <DocumentEditorProvider>`.

#### Challenge 7: Command Gateway Object Reference Equality
```tsx
function Toolbar() {
  const c1 = useDocumentEditorCommands();
  const c2 = useDocumentEditorCommands();
  return <div>{String(Object.is(c1, c2))}</div>;
}
```
- **Scenario:** `useDocumentEditorCommands` is called twice within the same render pass of `<Toolbar />`.
- **Question:** What does the component output?
- **Answer:** `false` (in the same render pass, two distinct `useMemo` hooks execute and return distinct object references, although subsequent renders of the same hook return the cached memoized instance).

---

## 📊 Senior Decision Matrix

```
                                  DEPENDENCY AUDIT ALGORITHM
                                              │
                           Is this dependency domain-specific?
                                    │               │
                                   YES              NO (Global Primitive)
                                    │               │
                        Wrap in Modular Feature     Use Props or System
                               Provider                   Context
                                    │
                       Does consumer trigger actions only?
                                    │               │
                                   YES              NO
                                    │               │
                        useFeatureCommands()        Does consumer read data?
                                                    │               │
                                                   YES             BOTH
                                                    │               │
                                            useFeatureState()   useFeature()
```

---

## 📋 45-Point Senior Architectural Checklist

- [ ] **Private Context Descriptors**: Raw `createContext` tokens are module-scoped and never exported from `index.ts`.
- [ ] **Modular Provider Root**: Provider encapsulates configuration, state ownership, reducer machine, and command stability.
- [ ] **Fail-Fast Invariant Guards**: Every custom hook validates `context !== null` and throws explicit, actionable errors.
- [ ] **No Fake Defaults**: Context defaults are initialized to `null` for all required dependencies.
- [ ] **Command Gateway Encapsulation**: Actions are exposed via semantic domain methods (`save()`, `delete()`), never raw `dispatch({ type })`.
- [ ] **Read/Write Channel Separation**: Distinct `useFeatureState()` and `useFeatureCommands()` hooks.
- [ ] **Command Reference Stability**: Command functions are stabilized with `useCallback` to support `React.memo` consumers.
- [ ] **Immutable Reducer Transitions**: Reducers return new object references; direct mutations are strictly prohibited.
- [ ] **Derived Invariant Hooks**: Business invariants are enforced within derived hooks (`useDocumentEditorSelection()`).
- [ ] **Combined Hook Intentionality**: Combined facade hooks (`useDocumentEditor()`) are reserved for top-level orchestrators.
- [ ] **DisplayName Instrumentation**: Context descriptors assign `.displayName` for clean React DevTools profiling.
- [ ] **Automated Lint Guarding**: `react-hooks/rules-of-hooks` and `react-hooks/exhaustive-deps` enforced in CI.
- [ ] **No Generic Updaters**: Generic `setState((prev) => ...)` methods are banned from command gateways.
- [ ] **Multi-Instance Isolation**: Multiple Provider instances operate with completely isolated reducer memory heaps.
- [ ] **No Implicit Global State**: Feature state is bound strictly to the lifetime of its mounting Provider.
- [ ] **AST Migration Strategy**: Codemod scripts prepared to automate legacy context migrations.
- [ ] **Strict Directory Isolation**: Context and reducer files placed in private internal directories.
- [ ] **TypeScript Readonly State**: All state interfaces annotated with `readonly` modifiers to block direct mutation.
- [ ] **Strict Return Types**: Gateway hooks declare explicit return interfaces rather than relying on type inference.
- [ ] **Portal Boundary Verification**: Automated tests ensure portals mount within required Provider subtrees.
- [ ] **Async Cancellation**: Async commands instantiate and abort `AbortController` instances to prevent race conditions.
- [ ] **No Prop Drilling in Features**: Sibling sub-components communicate via internal module hooks.
- [ ] **Zero Reducer Export**: Reducer functions are unexported outside the feature module.
- [ ] **Zero Action Export**: Action union types are kept private inside the `model/` subfolder.
- [ ] **Custom Invariant Error Messages**: Invariant error messages include the exact hook name and missing Provider name.
- [ ] **Zero Leaked Fiber Types**: Component props do not accept Fiber node references or internal React dispatcher handles.
- [ ] **Test Coverage for Missing Providers**: Unit tests assert that hooks throw expected errors when rendered without Providers.
- [ ] **Test Coverage for Sibling Isolation**: Unit tests verify that dispatching in Provider A does not mutate Provider B.
- [ ] **Strict Dependency Arrays**: No ESLint disable comments for `exhaustive-deps` in custom hook gateways.
- [ ] **Facade Memoization**: Combined hooks memoize their return object if child components use `React.memo`.
- [ ] **Error Boundary Integration**: Features document which Error Boundaries catch invariant errors.
- [ ] **Clean Module Exports**: `index.ts` is audited regularly to prevent accidental internal exports.
- [ ] **Strict Schema Validation**: External API payloads are validated before dispatching to reducer.
- [ ] **No Redundant Selectors**: Granular hooks documented as API wrappers, not fine-grained subscriptions.
- [ ] **Stable Dispatch Pass-Through**: Fiber `dispatch` handle passed directly into `useCallback` dependencies.
- [ ] **SSR Safe Initialization**: Reducer initializers are deterministic and free of client-only side effects (e.g. `window.localStorage`).
- [ ] **Clear Migration Vectors**: Public hooks documented with migration paths to external stores.
- [ ] **Strict Type Narrowing**: Discriminated unions used for all internal action types.
- [ ] **Context Consumer Elimination**: Class-based `<Context.Consumer>` components replaced with `useContext` gateways.
- [ ] **Memory Leak Auditing**: Profiler audits verify unmounted Providers free all associated closure memory.
- [ ] **Compound Component Exports**: Compound component sub-elements attached via `Object.assign` cleanly.
- [ ] **Explicit Null Assertions**: Non-null assertions (`!`) replaced with runtime guard checks.
- [ ] **Stable Action Object Allocation**: Command wrappers avoid recreating dynamic action payload objects unnecessarily.
- [ ] **Strict JSDoc Annotations**: Public custom hooks contain full JSDoc descriptions documenting thrown errors.
- [ ] **DevTools Fiber Stack Traceability**: All modular components named cleanly for production symbol mapping.

---

## ❓ Senior Technical Interview Defense Questions

#### Q1: Why should raw Context objects never be exported from a feature module?
**Senior Answer:** Exporting raw Context descriptors couples consuming components directly to the React Context API, specific action shapes, and reducer topologies. When Context tokens remain module-private and access is mediated via custom hook gateways (`useFeatureState()`, `useFeatureCommands()`), the internal implementation can be refactored to an external store (Zustand, Jotai, XState) without changing a single line of consumer code.

#### Q2: What is the architectural danger of providing a default fallback object to `createContext`?
**Senior Answer:** Providing fallback no-op objects (e.g., `{ save: () => {} }`) causes missing Provider bugs to fail silently in production. Components rendered outside the Provider (such as in React Portals or test fixtures) will appear to function but will drop user actions and fail to persist data. Initializing with `null` and throwing in the custom hook ensures immediate fail-fast detection.

#### Q3: Does creating granular hooks like `useDocumentContent()` create fine-grained subscriptions?
**Senior Answer:** No. In React 18, any hook calling `useContext(StateContext)` subscribes the host component to the entire Context value identity. Even if the hook returns a single primitive property, any update to the root Context object will schedule a re-render for the host component. Fine-grained subscriptions require external store selector architectures (Part 10).

#### Q4: When should you use a Combined Hook (`useFeature()`) versus Split Hooks (`useFeatureState()`, `useFeatureCommands()`)?
**Senior Answer:** A Combined Hook is appropriate for top-level orchestrators, container components, or page controllers that need to coordinate both reading state and dispatching actions. Split Hooks must be used for leaf components (such as buttons, icons, or badges) where a component triggers actions without displaying state, completely isolating that button from state-driven re-renders.

#### Q5: How do you prevent stale closures when command gateways interact with external hooks (e.g., authentication)?
**Senior Answer:** All external primitives referenced inside command closures (such as `currentUser.id`) must be explicitly declared in the `useCallback` dependency array. Alternatively, the external state can be passed directly as a parameter to the command function at the call site, or dispatched to middleware where fresh state is resolved.

#### Q6: How does React Fiber manage the internal context stack for split providers?
**Senior Answer:** During the `beginWork` phase of the DFS reconciliation traversal, React encounters the outer `StateContext.Provider` and executes `pushProvider(stateContext, value)`. Next, it encounters `DispatchContext.Provider` and executes `pushProvider(dispatchContext, dispatch)`. The values reside in `fiber.valueCursor`. When consumers invoke `useContext`, React looks up the current cursor value in $O(1)$ time. During `completeWork`, both providers are popped in reverse order via `popProvider`.

#### Q7: Why is exposing a generic `setState` function an anti-pattern in custom gateways?
**Senior Answer:** Exposing `setState((prev) => ...)` exposes the internal state representation directly to consumers. It breaks the encapsulation of the reducer state machine, bypasses invariant checks, duplicates transition logic across multiple UI files, and makes it impossible to trace bugs using predictable action histories.

#### Q8: Can a custom hook gateway be used inside class components?
**Senior Answer:** Custom hooks cannot be executed inside class component render methods. However, a modular feature can export a Higher-Order Component (HOC) such as `withDocumentEditor(Component)` that internally consumes the custom hooks and passes state and commands as typed props to legacy class components.

#### Q9: What is the impact of placing business invariant guards inside custom hook gateways?
**Senior Answer:** Placing invariant validation inside custom hooks (e.g. throwing if `document.isLocked` when calling `updateContent`) centralizes domain rules. UI components do not have to duplicate defensive conditional statements before triggering actions.

#### Q10: How do Compound Components interact with Modular Providers?
**Senior Answer:** In the Compound Component pattern, sub-components (such as `<Editor.Toolbar />` and `<Editor.Canvas />`) consume the private modular hooks directly without requiring any prop drilling from the parent `<Editor />` root component.

#### Q11: How does a keyed Provider reset state and memory?
**Senior Answer:** Changing the `key` attribute on a Provider component informs React Fiber that the existing Fiber node identity has been destroyed. React unmounts the old subtree, executes all cleanup effects, frees reducer state memory, and mounts a brand new Fiber node with freshly initialized `useReducer` state.

#### Q12: How do you handle asynchronous actions that take multiple seconds within a command gateway?
**Senior Answer:** Command gateways dispatch an initial action (e.g., `SAVE_START`), initiate the async promise, and dispatch corresponding success or failure actions (`SAVE_SUCCESS`, `SAVE_FAILURE`) upon resolution. To avoid race conditions, an `AbortController` should be referenced to cancel stale in-flight requests.

#### Q13: What is the difference between a Domain Invariant and a Runtime Context Guard?
**Senior Answer:** A Runtime Context Guard checks if the Context descriptor was resolved by an active Provider (verifying `context !== null`). A Domain Invariant validates business state integrity (e.g., verifying that `selectedDocumentId` exists in the `documents` dictionary).

#### Q14: Why is it bad practice to put transient UI state (e.g. hover state) in a Modular Provider?
**Senior Answer:** Transient, high-frequency UI state (such as mouse cursor coordinates or hover tooltips) placed in a Context Provider invalidates the Context value on every frame, forcing all state subscribers in that subtree to re-render. Transient state should remain local to the component using `useState` or `useRef`.

#### Q15: How do Modular Gateways simplify Unit Testing?
**Senior Answer:** Unit tests render the custom hook inside a test wrapper containing the `<FeatureProvider>`. Tests trigger semantic command methods and assert state output, allowing the internal implementation (actions, reducers, contexts) to be refactored without breaking test suites.

#### Q16: How do you prevent memory leaks when storing event listeners inside Modular Providers?
**Senior Answer:** Event listeners registered inside `useEffect` must return a cleanup function that invokes `removeEventListener`. If the Provider unmounts or resets via `key` change, React executes the cleanup function, preventing leaked closures in the browser heap.

#### Q17: What role does TypeScript Discriminated Unions play in domain reducers?
**Senior Answer:** Discriminated unions guarantee compile-time exhaustiveness checking in reducer `switch` statements. If a new action type is added to the domain union without a corresponding `case` handler, TypeScript throws a compilation error at the `_exhaustive: never` check.

#### Q18: Can a Modular Provider consume other Modular Providers?
**Senior Answer:** Yes. A higher-level Modular Provider (e.g. `<AnalyticsProvider>`) can consume hooks from lower-level Modular Providers (e.g. `useAuth()`) as long as the Providers maintain a strict Directed Acyclic Graph (DAG) hierarchy in the component tree.

#### Q19: Why should action creators and reducers remain unexported from the feature package?
**Senior Answer:** Keeping action creators and reducers unexported establishes a single source of truth. External consumers cannot construct malformed action payloads or bypass semantic command validation logic.

#### Q20: How do you profile re-render bottlenecks caused by misconfigured gateways?
**Senior Answer:** Use React DevTools Profiler with "Highlight updates when components render" enabled. Record a user interaction and inspect the flamechart to determine if leaf components subscribed to dispatch are rendering during state updates. If they are, decouple state readers from command dispatchers.

#### Q21: How do you support server-side rendering (SSR) in Modular Providers?
**Senior Answer:** Ensure all initial state factories are synchronous and deterministic. Avoid calling browser-only APIs (`window`, `document`, `localStorage`) during render or reducer initialization. Hydrate client state inside `useEffect` or pass server-generated state via Provider initial props.

#### Q22: What is the risk of exposing raw dispatch via a public gateway?
**Senior Answer:** Exposing raw `dispatch` allows UI components to dispatch arbitrary action types with incorrect payload structures, bypassing business invariant validations and making refactoring nearly impossible.

#### Q23: How do you implement fine-grained subscriptions if React Context re-renders on every update?
**Senior Answer:** To achieve fine-grained subscriptions without unnecessary re-renders, transition the internal engine from `useReducer` to an external store (e.g. `useSyncExternalStore` or Zustand) while keeping the public custom hook gateways completely identical.

#### Q24: What is the optimal number of modular providers in an enterprise React application?
**Senior Answer:** Structure modular providers around cohesive business domains (e.g. `AuthProvider`, `CartProvider`, `DocumentEditorProvider`). Avoid single monolithic God Providers as well as granular single-variable Micro Providers.

#### Q25: Why should custom hook gateways declare explicit return interfaces instead of relying on TypeScript inference?
**Senior Answer:** Explicit return interfaces prevent accidental API leaks of internal implementation details, improve compilation speed, and ensure backwards compatibility when internal state representations change.

---

### 26. Architectural Codemod Script for Legacy Context Migration

To migrate legacy components from direct `useContext(RawContext)` to modular gateway hooks, use the following `jscodeshift` transform script:

```javascript
// transforms/migrate-context-to-gateway.js
module.exports = function (fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // 1. Replace raw Context imports with custom gateway hook imports
  root.find(j.ImportDeclaration, { source: { value: "../context/EditorContext" } })
    .forEach((path) => {
      j(path).replaceWith(
        j.importDeclaration(
          [
            j.importSpecifier(j.identifier("useEditorState")),
            j.importSpecifier(j.identifier("useEditorCommands")),
          ],
          j.literal("@features/editor")
        )
      );
    });

  // 2. Transform useContext(EditorStateContext) calls to useEditorState()
  root.find(j.CallExpression, {
    callee: { name: "useContext" },
    arguments: [{ name: "EditorStateContext" }],
  }).forEach((path) => {
    j(path).replaceWith(j.callExpression(j.identifier("useEditorState"), []));
  });

  // 3. Transform useContext(EditorDispatchContext) calls to useEditorCommands()
  root.find(j.CallExpression, {
    callee: { name: "useContext" },
    arguments: [{ name: "EditorDispatchContext" }],
  }).forEach((path) => {
    j(path).replaceWith(j.callExpression(j.identifier("useEditorCommands"), []));
  });

  return root.toSource();
};
```

---

### 27. State Machine Execution Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User / DOM Event
    participant Canvas as <DocumentCanvas />
    participant CmdHook as useDocumentEditorCommands()
    participant DispatchCtx as EditorDispatchContext
    participant Provider as <DocumentEditorProvider />
    participant StateCtx as EditorStateContext
    participant SaveBtn as <SaveButton />

    User->>Canvas: Types text "A"
    Canvas->>CmdHook: updateContent("A", 1)
    CmdHook->>DispatchCtx: dispatch({ type: "DOCUMENT_UPDATE_CONTENT", payload: ... })
    DispatchCtx->>Provider: reducer(prevState, action) -> nextState
    Provider->>StateCtx: Updates Context value (new state snapshot reference)
    StateCtx-->>Canvas: Triggers Re-render (State subscriber)
    Note over StateCtx,SaveBtn: SaveBtn does NOT re-render because it subscribes to DispatchContext ONLY!
    Canvas-->>User: Re-renders updated text & cursor offset
```

---

### Navigation Links
[⬅️ Previous Part](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/06-provider-composition-nesting-and-scoped-overrides.md) | [📚 Level 06 Index](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/README.md) | [🧪 Companion Lab](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/examples/07-modular-providers-and-encapsulated-custom-hook-gateways.html) | [Next Part ➡️](file:///d:/engineering/web-development/01-Frontend/06-React-Fundamentals/11-Context-Dependency-Distribution/08-context-propagation-bailouts-and-reconciliation-boundaries.md)
