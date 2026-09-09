# Level 06 — React Fundamentals
## KPI 12 — Custom Hooks & Logic Composition
### PART 12 — Headless UI & Interaction Coordination Hooks

[⬅️ Previous Part](./11-form-state-and-schema-validation-hooks.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/12-headless-ui-and-interaction-coordination-hooks.html) | [Next Part ➡️](./13-testing-custom-hooks-and-isolation-contracts.md)

---

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Co-Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)

---

# PART 12 — Headless UI & Interaction Coordination Hooks

```text
                             THE HEADLESS INTERACTION SEPARATION
                             
   TIGHTLY COUPLED MONOLITH (Anti-Pattern)                  HEADLESS BEHAVIORAL MEMBRANE (Senior Standard)
   
  ┌──────────────────────────────────────────────┐         ┌──────────────────────────────────────────────┐
  │  function CustomDropdown({ items }) {        │         │  function useMenu({ items, onSelect }) {     │
  │    // ❌ Hardcoded <div> markup              │         │    // 1. Behavioral State & Invariants       │
  │    // ❌ Hardcoded CSS classes               │         │    // 2. Keyboard Navigation State Machine   │
  │    // ❌ Inaccessible click handlers         │         │    // 3. Focus Coordination & Roving Tabindex│
  │    // ❌ Broken portal click-outside checks  │         │    // 4. Stable ARIA Attribute Injection     │
  │    // ❌ Zero reusability in design systems  │         │    return { triggerProps, getItemProps, ... }│
  │  }                                           │         │  }                                           │
  │                                              │         │                                              │
  │  • Presentation locks behavior               │         │  ┌────────────────────────────────────────┐  │
  │  • Accessibility violations                  │         │  │ Consumer A (Tailwind)  Consumer B (MUI)│  │
  │  • Broken screen-reader active states        │         │  │ <button {...trigger}>  <div {...trigger│  │
  │  • Unusable across different design systems  │         │  └────────────────────────────────────────┘  │
  └──────────────────────────────────────────────┘         └──────────────────────────────────────────────┘
```

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. Executive Summary

A **Headless UI Hook** strictly decouples **interaction behavior and accessibility mechanics** from **visual presentation and DOM styling**.

The Hook assumes full ownership of:
1. **Behavioral State Transitions:** Open/closed lifecycle, active item tracking, committed selection.
2. **Keyboard Navigation Algorithms:** `ArrowDown`, `ArrowUp`, `Home`, `End`, `Escape`, `Enter`, `Space` with disabled item skipping and wrap-around policies.
3. **Focus Coordination:** Imperative DOM focus acquisition, roving `tabIndex`, or `aria-activedescendant` container focus.
4. **Accessibility Contracts (WAI-ARIA):** `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-haspopup`, `aria-disabled`, and stable ID generation.
5. **Outside Interaction & Overlay Dismissal:** Multimodal pointer tracking spanning portals and dynamic DOM boundaries.

The consumer component assumes 100% ownership of:
- Semantic markup (`<button>`, `<div>`, `<li>`).
- Styling (Tailwind, Vanilla CSS, Styled Components, Framer Motion animations).
- Visual layout, typography, themes, icons, and positioning.

The governing architectural equation:

$$\text{Headless Interaction Architecture} = \text{Behavioral State} + \text{Interaction Contracts} + \text{Stable Item Identity} + \text{DOM Coordination} + \text{ARIA Semantics} + \text{Presentation Independence}$$

> **Senior Axiom:** Headless UI does not mean *"no UI"*. It means *"no imposed visual implementation"*. The custom Hook answers *how the interaction behaves*, while the consuming component answers *how the interaction looks*.

---

### 2. The Core Interaction Coordination Mental Model

```text
USER INTENT (Hardware)
   │
   ├── Pointer Event (click, pointerdown)
   ├── Keyboard Event (ArrowDown, Escape, Enter)
   └── Focus Event (focusin, focusout)
   │
   ▼
HEADLESS HOOK MEMBRANE
   ├── 1. Matches Event to Interaction Policy
   ├── 2. Executes Internal State Machine Transition (e.g. open -> closed)
   ├── 3. Computes Target Focus or ARIA Active ID
   └── 4. Injects Props via Prop-Getters ({ ...triggerProps }, { ...getItemProps(id) })
   │
   ▼
VIRTUAL DOM RECONCILIATION
   ├── Pure Visual Markup (<button className="...">, <ul role="menu">)
   └── Injected ARIA & Ref Handlers
   │
   ▼
REAL BROWSER DOM & ASSISTIVE TECHNOLOGY
   ├── Screen Reader announces: "Menu Expanded, Option 1 Focused, 1 of 5"
   └── Focus moved imperatively via element.focus()
```

---

### 3. The 5 Distinct Interaction Identities

Never collapse distinct interaction dimensions into a single `currentItem` state. A senior architect clearly distinguishes:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     THE 5 INTERACTION STATE DIMENSIONS                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Focused Item     │ The physical DOM element currently owning browser     │
│                     │ document.activeElement.                               │
├─────────────────────┼───────────────────────────────────────────────────────┤
│ 2. Active Item      │ The logical option currently targeted by keyboard     │
│                     │ navigation (highlighted via Arrow keys).              │
├─────────────────────┼───────────────────────────────────────────────────────┤
│ 3. Selected Item    │ The committed semantic domain value (e.g. "Canada").  │
├─────────────────────┼───────────────────────────────────────────────────────┤
│ 4. Disabled Item    │ Options present in the collection that are skipped by │
│                     │ keyboard navigation and cannot be selected.           │
├─────────────────────┼───────────────────────────────────────────────────────┤
│ 5. Open Status      │ Boolean or FSM status determining overlay visibility. │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Fundamental Distinctions Matrix

| Concept | Precise Architectural Meaning | Implementation / Code |
| :--- | :--- | :--- |
| **Headless Hook** | State + Interaction logic returning props & refs | `const menu = useMenu()` |
| **Disclosure** | Single trigger toggling an expandable container | `useDisclosure()` |
| **Roving tabIndex** | Focus shifts between DOM items (`tabIndex=0` on active) | `itemRef.current.focus()` |
| **`aria-activedescendant`** | Focus stays on container; ARIA ID highlights active item | `aria-activedescendant="opt-2"` |
| **Click Outside** | Detecting interactions outside the logical boundary | Multi-ref pointerdown listener |
| **Focus Trap** | Restricting Tab cycling strictly inside a modal overlay | `tab keydown listener` |
| **Focus Restoration** | Returning browser focus to trigger upon modal/menu close | `triggerRef.current?.focus()` |
| **Prop Getter** | Factory function returning combined event & ARIA props | `getItemProps({ id, onClick })` |
| **Dynamic Registry** | Central collection tracking mounted DOM items | `Map<string, { id, node, disabled }>` |

---

### 5. Semantic Commands vs. Raw Setters

```tsx
// ❌ Anti-pattern: Leaking implementation mechanics
const { isOpen, setIsOpen, activeIndex, setActiveIndex } = useBadMenu();
// Caller might accidentally execute an invalid state transition:
setIsOpen(false);
setActiveIndex(999); // ⚠️ Broken invariant!

// ✅ Senior Standard: Constrained semantic commands
const { isOpen, open, close, toggle, selectActive, moveNext, movePrevious } = useMenu({
  items: ["Profile", "Settings", "Logout"],
  onSelect: handleSelect,
});
```

Semantic commands enforce **unbreakable behavioral invariants**:
- `close()` automatically clears the active highlight, resets roving tabindex, and restores focus to the trigger button.
- `moveNext()` automatically skips disabled items and wraps around to index `0` if enabled.

---

## Layer 2 — 🔬 Deep Mechanical Breakdown & Fiber Internals

### 6. Functional State Updaters in High-Frequency Interactions

```tsx
export function useToggle(initialValue = false): [boolean, () => void, (val: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  // ✅ Functional updater guarantees transition against queued state
  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  return [value, toggle, setValue];
}
```

#### Why Functional Updates are Mandatory:
If multiple keyboard or pointer events fire within the same browser frame, direct snapshot updates `setValue(!value)` evaluate against the captured stale render snapshot, dropping consecutive toggles. Functional updates `setValue(p => !p)` resolve against React's internal fiber update queue.

---

### 7. Headless Disclosure API Contract

```tsx
export interface UseDisclosureProps {
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  triggerProps: {
    "aria-expanded": boolean;
    "aria-controls": string;
    onClick: () => void;
  };
  panelProps: {
    id: string;
    hidden?: boolean;
  };
}

export function useDisclosure({
  defaultOpen = false,
  isOpen: controlledOpen,
  onOpen,
  onClose,
}: UseDisclosureProps = {}): UseDisclosureReturn {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const panelId = useId();

  const open = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(true);
    onOpen?.();
  }, [isControlled, onOpen]);

  const close = useCallback(() => {
    if (!isControlled) setUncontrolledOpen(false);
    onClose?.();
  }, [isControlled, onClose]);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  return useMemo(() => ({
    isOpen,
    open,
    close,
    toggle,
    triggerProps: {
      "aria-expanded": isOpen,
      "aria-controls": panelId,
      onClick: toggle,
    },
    panelProps: {
      id: panelId,
      hidden: !isOpen,
    },
  }), [isOpen, open, close, toggle, panelId]);
}
```

---

### 8. `useClickOutside`: Multi-Boundary & Portal-Safe Coordination

```text
THE PORTAL CLICK-OUTSIDE DILEMMA:

React Virtual Tree:
  <App>
    <DropdownTrigger ref={triggerRef} />
    <Portal>
      <DropdownMenu ref={menuRef} />
    </Portal>
  </App>

Real Browser DOM Tree:
  <body>
    <div id="root">
      <button id="trigger">Click Me</button>
    </div>
    <div id="portal-root">
      <div id="menu">Option 1</div>  <── Click here is NOT inside triggerRef.current!
    </div>
  </body>
```

If your hook only checks `triggerRef.current.contains(e.target)`, clicking inside the Portal menu will incorrectly trigger `onOutsideClick()`!

#### The Senior Solution: Multi-Boundary Set
```tsx
export function useClickOutside(
  elements: Array<React.RefObject<HTMLElement | null>>,
  onOutsideClick: (event: PointerEvent) => void,
  enabled: boolean = true
): void {
  const savedHandler = useRef(onOutsideClick);
  savedHandler.current = onOutsideClick;

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      // Check if clicked target is contained within ANY of the registered boundaries
      const isInside = elements.some((ref) => {
        const el = ref.current;
        return el && el.contains(target);
      });

      if (!isInside) {
        savedHandler.current(event);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [elements, enabled]);
}
```

---

### 9. Keyboard Navigation: Roving `tabIndex` vs. `aria-activedescendant`

```text
ROVING TABINDEX ARCHITECTURE:
┌──────────────────────────────┐
│ Container (<ul role="menu">) │
│   ├── Item 1 (tabIndex = -1) │
│   ├── Item 2 (tabIndex = 0)  │ <── Physical DOM Focus on Item 2!
│   └── Item 3 (tabIndex = -1) │
└──────────────────────────────┘
• Focus moves imperatively: itemRefs[activeId].current.focus()
• Best for: Menus, toolbars, standalone lists.

ARIA-ACTIVEDESCENDANT ARCHITECTURE:
┌──────────────────────────────────────────────────────────┐
│ Container (<input role="combobox" aria-activedescendant="opt-2">) │ <── Focus stays on input!
│   ├── Item 1 (id="opt-1")                                │
│   ├── Item 2 (id="opt-2") [Visual Highlight Active]      │
│   └── Item 3 (id="opt-3")                                │
└──────────────────────────────────────────────────────────┘
• Physical DOM Focus stays on <input> so user can continue typing!
• Best for: Comboboxes, autocomplete dropdowns, data grids.
```

---

### 10. Item Registry & Stable Domain Identity

Never navigate collections using raw array indices if items can be sorted, filtered, or dynamically added/removed:

```tsx
export interface CollectionItem<T = any> {
  id: string; // Stable Unique ID
  disabled?: boolean;
  value?: T;
  node?: HTMLElement | null;
}

export function useCollectionRegistry<T = any>() {
  const registryRef = useRef<Map<string, CollectionItem<T>>>(new Map());

  const registerItem = useCallback((item: CollectionItem<T>) => {
    registryRef.current.set(item.id, item);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    registryRef.current.delete(id);
  }, []);

  const getOrderedEnabledItems = useCallback((): CollectionItem<T>[] => {
    const items = Array.from(registryRef.current.values());
    return items.filter((i) => !i.disabled);
  }, []);

  return { registerItem, unregisterItem, getOrderedEnabledItems, registryRef };
}
```

---

### 11. Complete Headless Menu Hook (`useMenu`) Reference Implementation

```tsx
export interface UseMenuProps<T = string> {
  items: Array<{ id: string; label: string; disabled?: boolean; value: T }>;
  onSelect?: (item: T) => void;
}

export function useMenu<T = string>({ items, onSelect }: UseMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const menuId = useId();

  // 1. Filter enabled items
  const enabledItems = useMemo(() => items.filter((i) => !i.disabled), [items]);

  // 2. Open / Close commands
  const openMenu = useCallback(() => {
    setIsOpen(true);
    if (enabledItems.length > 0) {
      setActiveId(enabledItems[0].id);
    }
  }, [enabledItems]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setActiveId(null);
    // Focus restoration
    triggerRef.current?.focus();
  }, []);

  // 3. Multi-boundary click outside
  useClickOutside([triggerRef, menuRef], closeMenu, isOpen);

  // 4. Keyboard Navigation Handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeMenu();
        break;

      case "ArrowDown": {
        e.preventDefault();
        const currentIdx = enabledItems.findIndex((i) => i.id === activeId);
        const nextIdx = currentIdx < enabledItems.length - 1 ? currentIdx + 1 : 0;
        const nextId = enabledItems[nextIdx]?.id ?? null;
        setActiveId(nextId);
        if (nextId && itemRefs.current.get(nextId)) {
          itemRefs.current.get(nextId)!.focus();
        }
        break;
      }

      case "ArrowUp": {
        e.preventDefault();
        const currentIdx = enabledItems.findIndex((i) => i.id === activeId);
        const prevIdx = currentIdx > 0 ? currentIdx - 1 : enabledItems.length - 1;
        const prevId = enabledItems[prevIdx]?.id ?? null;
        setActiveId(prevId);
        if (prevId && itemRefs.current.get(prevId)) {
          itemRefs.current.get(prevId)!.focus();
        }
        break;
      }

      case "Enter":
      case " ": {
        e.preventDefault();
        const activeItem = items.find((i) => i.id === activeId);
        if (activeItem && !activeItem.disabled) {
          onSelect?.(activeItem.value);
          closeMenu();
        }
        break;
      }

      case "Home":
        e.preventDefault();
        if (enabledItems.length > 0) {
          setActiveId(enabledItems[0].id);
          itemRefs.current.get(enabledItems[0].id)?.focus();
        }
        break;

      case "End":
        e.preventDefault();
        if (enabledItems.length > 0) {
          const last = enabledItems[enabledItems.length - 1];
          setActiveId(last.id);
          itemRefs.current.get(last.id)?.focus();
        }
        break;
    }
  }, [isOpen, activeId, enabledItems, items, openMenu, closeMenu, onSelect]);

  // 5. Injected Prop Getters
  const getTriggerProps = useCallback(() => ({
    ref: triggerRef,
    "aria-haspopup": "menu" as const,
    "aria-expanded": isOpen,
    "aria-controls": menuId,
    onClick: () => (isOpen ? closeMenu() : openMenu()),
    onKeyDown: handleKeyDown,
  }), [isOpen, menuId, openMenu, closeMenu, handleKeyDown]);

  const getMenuProps = useCallback(() => ({
    ref: menuRef,
    id: menuId,
    role: "menu" as const,
    "aria-activedescendant": activeId ?? undefined,
    onKeyDown: handleKeyDown,
  }), [menuId, activeId, handleKeyDown]);

  const getItemProps = useCallback((itemId: string, disabled: boolean = false) => ({
    ref: (node: HTMLElement | null) => {
      if (node) itemRefs.current.set(itemId, node);
      else itemRefs.current.delete(itemId);
    },
    role: "menuitem" as const,
    id: itemId,
    tabIndex: activeId === itemId ? 0 : -1,
    "aria-disabled": disabled ? true : undefined,
    onClick: () => {
      if (disabled) return;
      const item = items.find((i) => i.id === itemId);
      if (item) {
        onSelect?.(item.value);
        closeMenu();
      }
    },
  }), [activeId, items, onSelect, closeMenu]);

  return {
    isOpen,
    activeId,
    open: openMenu,
    close: closeMenu,
    getTriggerProps,
    getMenuProps,
    getItemProps,
  };
}
```

---

## Layer 3 — 🛠️ Production Crucibles & Anti-Patterns

### 12. Production Incident #1 — The Global Escape Clashing Cascade

#### Symptom:
When a user opened a dropdown *inside* an open modal and pressed `Escape`, both the dropdown and the entire modal closed simultaneously.

#### Root Cause:
Both `useModal` and `useDropdown` attached uncoordinated `window.addEventListener("keydown")` listeners that fired concurrently.

#### The Senior Fix:
Implement an **Overlay Stack Manager**. The topmost mounted overlay registers itself at the top of the stack and calls `e.stopPropagation()` on `Escape`.

---

### 13. Production Incident #2 — Lost Focus on Modal Dismissal

#### Symptom:
When users closed an accessibility modal, focus jumped to the top `<body>` tag, forcing screen-reader users to re-tab through the entire 100-link page header.

#### Root Cause:
The modal hook did not store `triggerRef.current` (or `document.activeElement` at mount) and failed to restore focus on unmount.

---

### 14. Production Incident #3 — The Non-Native `<div onClick>` Keyboard Trap

#### Symptom:
A keyboard-only motor-impaired user could not open a custom menu because the trigger was built with `<div onClick={...}>` without `role="button"`, `tabIndex={0}`, or `onKeyDown` handlers.

#### The Senior Rule:
Always prefer native `<button>` elements in headless consumers. If `div` is mandatory, the headless hook must inject full keyboard handling and ARIA roles.

---

### 15. Decision Matrix: Roving `tabIndex` vs. `aria-activedescendant`

| Metric | Roving `tabIndex` | `aria-activedescendant` |
| :--- | :--- | :--- |
| **Physical DOM Focus** | Moves to individual `<li>` or `<button>` | Stays fixed on parent `<input>` |
| **Combobox / Typeahead** | 🔴 Unusable (Interrupts typing) | 🟢 Mandatory (User can keep typing) |
| **Toolbar / Menu** | 🟢 Ideal (Screen readers announce item directly) | 🟡 Usable but complex |
| **Virtual Scrolling** | 🟡 Requires managing focused node | 🟢 Seamless (Only updates ARIA ID) |

---

## Layer 4 — 🧪 Diagnostic Gauntlet & Master Checklist

### 16. Senior Prediction Challenge #1: Active Item on Filtered Collection

```tsx
const items = [{ id: "1", name: "Apple" }, { id: "2", name: "Banana" }, { id: "3", name: "Cherry" }];
// User highlights "Banana" (id: "2").
// User types "C" in search box, filtering list to only [{ id: "3", name: "Cherry" }].
```

#### Question:
What should the active highlight state be after the filter occurs?

#### Answer:
Because `"Banana"` (id: "2") is no longer in the filtered set, the headless hook must reconcile its active ID and reset to the first available enabled item (`"Cherry"` / id: "3"). Holding a stale `activeId: "2"` would break keyboard `Enter` selection.

---

### 17. 10 Senior Interview Questions & Master Answers

#### Q1: What is a Prop-Getter in Headless Hook API design?
> **Answer:** A prop-getter is a function (e.g. `getTriggerProps(userProps)`) that merges internal behavioral event handlers and ARIA attributes with user-supplied props, ensuring both custom callbacks and internal invariants execute without conflicts.

#### Q2: Why is physical DOM focus management kept separate from React state?
> **Answer:** Physical focus is an imperative browser concept (`document.activeElement`, `element.focus()`). Storing the focused HTML node in `useState` causes unnecessary re-renders. React state models logical active/selected items, while refs coordinate physical focus.

#### Q3: How do you handle click-outside detection when overlays are rendered in React Portals?
> **Answer:** Pass a multi-boundary array of refs (`[triggerRef, menuRef]`) to the outside-click listener and verify that the clicked `event.target` is not contained within *any* of the registered elements.

#### Q4: What is the purpose of focus restoration in dialogs and menus?
> **Answer:** When an overlay closes, focus must return to the trigger element that opened it. This prevents focus from resetting to the top of the document, maintaining keyboard navigation continuity for accessibility.

#### Q5: How do you handle disabled items in keyboard navigation algorithms?
> **Answer:** Filter the registered collection down to `enabledItems = items.filter(i => !i.disabled)`. Arrow navigation calculations (next/previous) operate strictly against the enabled subset, skipping disabled options.

#### Q6: Why must functional state updates (`setOpen(p => !p)`) be used in disclosure toggles?
> **Answer:** To prevent stale closure bugs when rapid user events or external triggers fire within the same event loop frame before React has committed the next render snapshot.

#### Q7: What is an Overlay Stack and why is it needed for `Escape` handling?
> **Answer:** An overlay stack is a centralized registry of open overlays (modals, popovers, tooltips). When `Escape` is pressed, only the topmost overlay at the top of the stack is closed, preventing nested modals from closing all at once.

#### Q8: What ARIA attributes are mandatory for a disclosure trigger?
> **Answer:** `aria-expanded` (boolean indicating open/closed status) and `aria-controls` (matching the unique `id` of the panel being disclosed).

#### Q9: Why is `useId()` preferred over hardcoded strings for ARIA references?
> **Answer:** `useId()` generates deterministic, unique IDs that prevent collisions across multiple instances of the component on the same page and guarantee SSR/client hydration consistency.

#### Q10: How do you unit test a headless interaction hook?
> **Answer:** Use `@testing-library/react-hooks` or render a test component harness. Simulate keyboard events (`fireEvent.keyDown(el, { key: "ArrowDown" })`), verify active ARIA attributes, and assert that focus moves to the correct DOM node.

---

### 18. 50-Point Senior Headless UI Checklist

#### Behavioral State & Semantics
- [ ] 1. Open/closed state is independent of active/highlighted item.
- [ ] 2. Active item is independent of committed selected item.
- [ ] 3. Functional state updates are used for all toggle commands.
- [ ] 4. Semantic commands (`open`, `close`, `toggle`) are exposed over raw setters.
- [ ] 5. Controlled and uncontrolled state modes are supported.
- [ ] 6. Disabled state prevents both pointer and keyboard activation.
- [ ] 7. Wrap-around navigation is configurable.
- [ ] 8. Reset command restores initial interaction state.
- [ ] 9. Multi-select collections track Sets/Arrays of selected IDs.
- [ ] 10. Typeahead search string buffer is supported for list navigation.

#### Keyboard & Focus Architecture
- [ ] 11. `ArrowDown` / `ArrowUp` navigate enabled items sequentially.
- [ ] 12. `Home` / `End` jump to first and last enabled items.
- [ ] 13. `Enter` / `Space` commit active item selection.
- [ ] 14. `Escape` dismisses overlay and stops event propagation.
- [ ] 15. Focus is imperatively restored to trigger upon dismissal.
- [ ] 16. Focus traps restrict Tab cycling inside modal overlays.
- [ ] 17. Initial focus targets first interactive element on open.
- [ ] 18. Roving `tabIndex` sets `0` on active and `-1` on inactive.
- [ ] 19. `aria-activedescendant` keeps focus on parent input.
- [ ] 20. PreventDefault is called on captured navigation keys.

#### DOM & Multi-Boundary Coordination
- [ ] 21. Multi-boundary click outside supports portal overlays.
- [ ] 22. `pointerdown` is used for responsive outside click detection.
- [ ] 23. Dynamic item registry unregisters unmounted nodes cleanly.
- [ ] 24. Stable domain IDs are used for all collection keys.
- [ ] 25. Trigger ref and panel ref are typed strictly.
- [ ] 26. Dynamic collection filtering resets active index safely.
- [ ] 27. Overlay stack manager coordinates nested Escapes.
- [ ] 28. Scroll lock helper prevents background scrolling under modals.
- [ ] 29. Virtual scrolling integration maintains active item visibility.
- [ ] 30. Unmount cleans up all document-level event listeners.

#### Accessibility (WAI-ARIA)
- [ ] 31. `aria-expanded` reflects true open state.
- [ ] 32. `aria-controls` references valid panel ID.
- [ ] 33. `aria-haspopup` is set appropriately (`menu`, `listbox`, `dialog`).
- [ ] 34. `aria-disabled` is injected on disabled options.
- [ ] 35. `aria-selected` is set on selected listbox options.
- [ ] 36. ARIA roles (`menu`, `menuitem`, `listbox`, `option`) are injected.
- [ ] 37. `useId()` generates collision-free IDs.
- [ ] 38. Native `<button>` elements are recommended in documentation.
- [ ] 39. Screen reader live regions announce status changes when needed.
- [ ] 40. High contrast mode compatibility is preserved.

#### Prop Getters & Developer Ergonomics
- [ ] 41. Prop-getters merge user event handlers with internal handlers.
- [ ] 42. TypeScript generics type return contracts accurately.
- [ ] 43. Prop-getter functions are referentially stable (`useCallback`).
- [ ] 44. Internal state is not exposed directly.
- [ ] 45. Custom styling is 100% unrestrained.
- [ ] 46. Animation lifecycle hooks (e.g. `isClosing`) are supported.
- [ ] 47. SSR-safe execution is verified.
- [ ] 48. React 18 StrictMode double-mount is verified.
- [ ] 49. Unit test suite covers full keyboard navigation matrix.
- [ ] 50. Documentation includes complete Tailwind and headless examples.

---

### 19. Graduation Gate

You have mastered Part 12 when you can build a complete `useMenu` hook from scratch that coordinates roving `tabIndex`, portal-safe click-outside, `Escape` stack handling, and full WAI-ARIA roles while allowing consumers to style it arbitrarily with Tailwind CSS.

---

[⬅️ Previous Part](./11-form-state-and-schema-validation-hooks.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](./examples/12-headless-ui-and-interaction-coordination-hooks.html) | [Next Part ➡️](./13-testing-custom-hooks-and-isolation-contracts.md)
