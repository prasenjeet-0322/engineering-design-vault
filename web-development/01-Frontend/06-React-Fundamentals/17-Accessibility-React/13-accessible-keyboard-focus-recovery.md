# Level 17 — Accessibility Engineering
# KPI 17 — Accessibility in React
## PART 13 — Keyboard Navigation, Focus Recovery, Roving Tabindex & Interaction State Machines

[⬅️ Previous Part](./12-accessible-fallback-ux-progressive-degradation.md) | [📚 Level 17 Index](./README.md) | [🧪 Companion Lab](./examples/13-accessible-keyboard-focus-recovery.html) | [Next Part ➡️](./14-manual-screen-reader-auditing-runbooks.md)

---

> **Tier:** 🔴 MUST KNOW (Core Senior Frontend Competency)  
> **Standard:** WCAG 2.1 / 2.2 AA · WAI-ARIA 1.2 · WAI-ARIA Authoring Practices Guide (APG)  
> **Author & Lead System Architect:** Srikar Kudurmalla (Full Stack Developer | Founding Engineer)  
> **Co-Author:** Prasenjeet (Mid-Level Full Stack Developer)  

---

# 1. ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

Keyboard accessibility is not:
> *"Every interactive element has `tabIndex={0}`."*

It is a formal interaction contract and state machine.
A keyboard-accessible interaction system must define:

$$\text{Keyboard Input} \xrightarrow{\text{Filter}} \text{Interaction Owner} \xrightarrow{\text{Command}} \text{State Transition} \xrightarrow{\text{Update}} \text{Focus Target} \xrightarrow{\text{Sync}} \text{DOM / ARIA Projection} \xrightarrow{\text{AOM Bridge}} \text{Next User Action}$$

The senior-level equation is:

$$\mathbf{\text{Keyboard Accessibility}} = \mathbf{\text{Operability}} \times \mathbf{\text{Predictable Navigation}} \times \mathbf{\text{Focus Visibility}} \times \mathbf{\text{State Coherence}} \times \mathbf{\text{Recovery}}$$

If any factor in this equation approaches zero, keyboard accessibility fails catastrophically even when the DOM technically contains focusable HTML nodes.

---

# 2. 🧠 THE FUNDAMENTAL DISTINCTION

There are three concepts that are routinely confused in React applications:

$$\mathbf{\text{TAB NAVIGATION}} \neq \mathbf{\text{HARDWARE DOM FOCUS}} \neq \mathbf{\text{LOGICAL ACTIVE ITEM}}$$

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        THE THREE INTERACTION LAYERS                                    │
├───────────────────┬──────────────────────────────────┬─────────────────────────────────┤
│ Concept           │ Definition                       │ Implementation Mechanism        │
├───────────────────┼──────────────────────────────────┼─────────────────────────────────┤
│ Tab Navigation    │ Entering / exiting composite     │ document sequential tab stops   │
│                   │ widget interaction boundaries    │ (tabIndex: 0 vs -1)             │
├───────────────────┼──────────────────────────────────┼─────────────────────────────────┤
│ Hardware Focus    │ Active DOM node targeted by OS   │ document.activeElement          │
│                   │ keyboard dispatcher              │ el.focus()                      │
├───────────────────┼──────────────────────────────────┼─────────────────────────────────┤
│ Logical Active    │ Entity currently highlighted for │ activeId / roving state /       │
│ Item              │ interaction inside a widget      │ aria-activedescendant           │
└───────────────────┴──────────────────────────────────┴─────────────────────────────────┘
```

For example, in a combobox:
1. User presses `Tab` $	o$ Combobox `<input>` receives hardware DOM focus.
2. User presses `ArrowDown` $	o$ Logical active option changes from *Option A* to *Option B*.
3. **Crucial Realization:** Hardware DOM focus remains solidly on the `<input>` element while `aria-activedescendant="option-b"` communicates the logical item to the accessibility tree. That is a completely different architectural model from moving DOM focus between every child item.

---

# 3. NATIVE FIRST: THE SEMANTIC FOUNDATION

Before implementing custom keyboard state machines, always evaluate native HTML:
```html
<button> <a> <input> <select> <textarea> <details>
```

Native elements provide:
1. Native keyboard activation (`Enter`, `Space`).
2. Native sequential focus participation.
3. Native focus ring styling.
4. OS-level Accessibility Object Model (AOM) integration.
5. Built-in accessibility semantics and roles.

Creating a custom widget introduces 6 explicit architectural responsibilities:
$$\text{Semantic Role} + \text{Keyboard Dispatcher} + \text{Focus Trapping/Recovery} + \text{State Machine} + \text{ARIA Sync} + \text{Dynamic Reconciliation}$$

Therefore: **Custom interaction widgets must be justified by strict product requirements, not visual preference.**

---

# 4. 🧭 TAB ORDER ARCHITECTURE

The browser's natural tab sequence should always be the architectural foundation.
- **Anti-Pattern:** `<div tabIndex={0} onClick={handleClick}>Submit</div>`
- **Production Standard:** `<button type="button" onClick={handleClick}>Submit</button>`

Native buttons provide seamless accessibility across browser platforms, screen readers, and mobile switch control devices.

---

# 5. tabIndex IS NOT A GENERAL ACCESSIBILITY TOOL

```text
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                             tabIndex VALUE SEMANTICS                                  │
├────────────────┬───────────────────────────────────────┬──────────────────────────────┤
│ Value          │ Interaction Meaning                   │ Architectural Use Case       │
├────────────────┼───────────────────────────────────────┼──────────────────────────────┤
│ tabIndex={0}   │ Participates in natural sequential    │ Primary widget entry point   │
│                │ keyboard navigation (Tab / Shift+Tab) │ or custom interactive control│
├────────────────┼───────────────────────────────────────┼──────────────────────────────┤
│ tabIndex={-1}  │ Removed from natural tab order;       │ Roving widget items, dialogs,│
│                │ focusable ONLY programmatically       │ error summaries, toast alerts│
├────────────────┼───────────────────────────────────────┼──────────────────────────────┤
│ tabIndex={>0}  │ Enforces artificial global priority   │ 🛑 DANGEROUS ANTI-PATTERN    │
│                │ overriding document DOM order         │ NEVER USE IN PRODUCTION      │
└────────────────┴───────────────────────────────────────┴──────────────────────────────┘
```

---

# 6. WHY POSITIVE tabIndex SCALES POORLY

Suppose a layout defines:
- Header: `tabIndex={1}`
- Sidebar: `tabIndex={2}`
- Main Content: `tabIndex={3}`
- Modal Dialog: `tabIndex={4}`

When a new feature adds a search widget with `tabIndex={2}`, the global sequential ordering becomes fragmented and chaotic. The application now manages two competing ordering systems: DOM order and manual tab order.

**Rule:** Always maintain natural DOM ordering and rely strictly on `tabIndex={0}` and `tabIndex={-1}`.

---

# 7. COMPOSITE WIDGET MODEL

Composite widgets intentionally compress large numbers of interactive elements into a single sequential tab stop to protect keyboard users from tab fatigue:

```text
NON-COMPOSITE (Tab Fatigue):
[Tab] -> Item 1 -> [Tab] -> Item 2 -> [Tab] -> Item 3 -> ... -> [Tab] -> Item 500

COMPOSITE WIDGET (Efficient):
[Tab] -> Enter Widget -> [ArrowDown / ArrowUp / Home / End] -> [Tab] -> Leave Widget
```

Common composite widgets:
- Tabs (`role="tablist"`)
- Toolbars (`role="toolbar"`)
- Listboxes (`role="listbox"`)
- Data Grids (`role="grid"`)
- Menu Bars (`role="menubar"`)
- Tree Views (`role="tree"`)

---

# 8. ROVING TABINDEX PATTERN

In a roving tabindex system:
- **Active Item:** Assigned `tabIndex={0}` (receives focus when the user tabs into the widget).
- **Inactive Items:** Assigned `tabIndex={-1}` (bypassed during Tab navigation).

```text
Initial State:
[Button A (tabIndex=0)]  [Button B (tabIndex=-1)]  [Button C (tabIndex=-1)]
         ▲ Focused

User presses ArrowRight:
[Button A (tabIndex=-1)]  [Button B (tabIndex=0)]  [Button C (tabIndex=-1)]
                                   ▲ Focused
```

**The Invariant:** At all times, exactly **one** item within the composite widget possesses `tabIndex={0}`.

---

# 9. ROVING TABINDEX STATE ARCHITECTURE

```typescript
type RovingState<TId extends string = string> = {
  activeId: TId | null;
  focusedId: TId | null;
};
```

When the user moves the active selection:
1. Update logical `activeId` state.
2. Synchronize DOM `tabIndex` attributes (`0` for active, `-1` for others).
3. Coordinate physical DOM focus (`element.focus()`).

---

# 10. aria-activedescendant ARCHITECTURE

In the `aria-activedescendant` pattern:
1. Hardware DOM focus remains permanently on the container or `<input>`.
2. The owning container declares `aria-activedescendant="<child-id>"`.
3. Screen readers announce the active child item based on the referenced DOM ID.

```html
<input
  type="text"
  role="combobox"
  aria-expanded="true"
  aria-controls="framework-listbox"
  aria-activedescendant="option-vue"
/>
<ul id="framework-listbox" role="listbox">
  <li id="option-react" role="option" aria-selected="false">React</li>
  <li id="option-vue" role="option" aria-selected="true" class="active">Vue.js</li>
</ul>
```

---

# 11. ROVING TABINDEX VS aria-activedescendant COMPARISON

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               ROVING TABINDEX VS ARIA-ACTIVEDESCENDANT ARCHITECTURE                    │
├─────────────────────┬──────────────────────────────┬───────────────────────────────────┤
│ Architectural Trait │ Roving Tabindex              │ aria-activedescendant             │
├─────────────────────┼──────────────────────────────┼───────────────────────────────────┤
│ Hardware DOM Focus  │ Physically moves between DOM │ Remains fixed on container / input│
│                     │ nodes                        │                                   │
├─────────────────────┼──────────────────────────────┼───────────────────────────────────┤
│ Active State        │ Native :focus pseudo-class   │ Synthetic CSS class + ARIA attr   │
├─────────────────────┼──────────────────────────────┼───────────────────────────────────┤
│ Virtualization      │ Difficult (focused node must │ Highly suitable (target must exist│
│                     │ remain mounted)              │ in DOM during announcement)       │
├─────────────────────┼──────────────────────────────┼───────────────────────────────────┤
│ Best Fit Widgets    │ Toolbars, TabLists, Menus,   │ Comboboxes, Autocomplete Search,  │
│                     │ Radiogroups, Dynamic Grids   │ Virtualized Dropdown Menus        │
└─────────────────────┴──────────────────────────────┴───────────────────────────────────┘
```

---

# 12. STABLE IDENTITY OVER ARRAY INDICES

Never use numeric array indices as the source of truth for active items:

```typescript
// ❌ ANTI-PATTERN: Volatile index state
const [activeIndex, setActiveIndex] = useState(1); // Points to "B"

// When array is sorted: ['C', 'A', 'B'] -> activeIndex 1 now points to "A"!

// ✅ PRODUCTION STANDARD: Stable Entity Identity
const [activeId, setActiveId] = useState<string>('item-b');
const activeIndex = items.findIndex(item => item.id === activeId);
```

Entity identity survives sorting, filtering, insertion, and dynamic element deletion.

---

# 13. KEYBOARD INTERACTION AS A FINITE STATE MACHINE

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TABS COMPOSITE STATE MACHINE                              │
│                                                                                        │
│                ┌───────────────┐   ArrowRight / ArrowDown   ┌───────────────┐          │
│                │   TAB A (0)   │ ─────────────────────────> │   TAB B (0)   │          │
│                │  (tabIndex=0) │ <───────────────────────── │  (tabIndex=0) │          │
│                └───────────────┘   ArrowLeft / ArrowUp      └───────────────┘          │
│                        │                                            │                  │
│                   Home │                                            │ End              │
│                        ▼                                            ▼                  │
│                ┌───────────────┐                            ┌───────────────┐          │
│                │ FIRST TAB (0) │                            │ LAST TAB (0)  │          │
│                └───────────────┘                            └───────────────┘          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 14. AUTOMATIC VS MANUAL TAB ACTIVATION

1. **Automatic Activation (Default for simple tabs):**
   - Pressing `ArrowRight` immediately moves focus AND selects the new tab.
2. **Manual Activation (Recommended for heavy tabs or data fetching):**
   - Pressing `ArrowRight` moves focus to the next tab without rendering its panel.
   - Pressing `Enter` or `Space` activates the focused tab.

---

# 15. KEYBOARD INTERACTION CONTRACT TABLE

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                     COMPREHENSIVE KEYBOARD NAVIGATION SPECIFICATION                    │
├───────────────┬──────────────────────────┬─────────────────────────────────────────────┤
│ Key / Combo   │ Context                  │ Expected Architectural Action               │
├───────────────┼──────────────────────────┼─────────────────────────────────────────────┤
│ Tab           │ Entering Widget          │ Focuses current active item (tabIndex=0)    │
│ Tab           │ Inside Widget            │ Exits widget to next document tab stop      │
│ ArrowRight    │ Horizontal Toolbar/Tabs  │ Moves active item to next sibling           │
│ ArrowLeft     │ Horizontal Toolbar/Tabs  │ Moves active item to previous sibling       │
│ ArrowDown     │ Vertical Menu/Listbox    │ Moves active item to next sibling           │
│ ArrowUp       │ Vertical Menu/Listbox    │ Moves active item to previous sibling       │
│ Home          │ Any Composite Widget     │ Moves active item to first enabled item     │
│ End           │ Any Composite Widget     │ Moves active item to last enabled item      │
│ Enter / Space │ Manual Activation Widget │ Activates / selects the focused item        │
│ Escape        │ Dialog / Popover / Menu  │ Dismisses overlay and restores focus        │
└───────────────┴──────────────────────────┴─────────────────────────────────────────────┘
```

---

# 16. BOUNDARY WRAPPING POLICIES

- **Cyclic Wrapping:** Navigating past the last item wraps around to the first item (`A 	o B 	o C 	o A`). Best for toolbars and menus.
- **Bounded Navigation:** Navigation stops at boundary edges (`A 	o B 	o C 	o C`). Best for date pickers and paginated data grids.

---

# 17. HOME / END KEY CONTEXT SCOPING

`Home` and `End` have distinct native browser behavior in text inputs (moving the text caret to the start/end of the string).
**Rule:** When keyboard listeners capture `Home` or `End`, verify whether `event.target` is an `<input>` or `<textarea>` before intercepting.

---

# 18. DANGERS OF GLOBAL KEYBOARD HIJACKING

Attaching unconstrained `window.addEventListener('keydown', ...)` listeners causes severe accessibility regressions:
- Intercepts caret navigation in form fields.
- Conflicts with screen reader virtual cursor navigation shortcuts.
- Breaks native browser scrolling.

**Rule:** Always scope keyboard handlers to container components using React synthetic event handlers (`onKeyDown`).

---

# 19. event.target VS event.currentTarget

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  // e.currentTarget: The composite widget container holding the listener
  // e.target: The specific child element where the key event originated

  if (e.target instanceof HTMLInputElement) {
    return; // Preserve native input behavior
  }
};
```

---

# 20. KEYBOARD EVENT OWNERSHIP HIERARCHY

$$\text{Topmost Modal Overlay} \succ \text{Nested Submenu} \succ \text{Composite Widget} \succ \text{Native Control} \succ \text{Document}$$

---

# 21. FOCUS VISIBILITY & FOCUS-VISIBLE

Never remove focus outlines without providing a high-contrast replacement:

```css
/* ❌ Catastrophic A11y Anti-Pattern */
:focus {
  outline: none;
}

/* ✅ Production Focus Ring */
:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}
```

---

# 22. FOCUS VS HOVER DISPARITY

Hover states represent mouse cursor proximity. Focus states represent the active keyboard target. Never trigger destructive actions or hide essential controls exclusively behind hover states.

---

# 23. DYNAMIC FOCUS RECOVERY PRINCIPLES

When an interactive element is removed from the DOM:
$$\text{Element Unmounted} \implies \text{document.activeElement resets to document.body}$$

This causes screen readers to lose context and forces keyboard users to re-navigate the entire document from the beginning.
**Focus recovery must be explicit and deterministic.**

---

# 24. CONDITIONAL FOCUS RESTORATION

When closing a modal or popup:
1. Verify if the `triggerRef` or `restoreTarget` element is still mounted in the DOM.
2. If mounted $	o$ restore focus to `restoreTarget`.
3. If unmounted $	o$ redirect focus to a safe fallback (container heading or parent landmark).

---

# 25. FOCUS RECOVERY ON DYNAMIC DELETION

When deleting item $B$ from a collection $[A, B, C]$:
- **Policy 1 (Next Item):** Shift focus to $C$.
- **Policy 2 (Previous Item):** Shift focus to $A$ (if $B$ was the last item).
- **Policy 3 (Container):** Shift focus to the parent `<div tabIndex={-1}>` container if the collection is now empty.

---

# 26. THE FOCUS RECOVERY STATE MACHINE

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         FOCUS RECOVERY DECISION TREE                                   │
│                                                                                        │
│                                Focused Item Removed                                    │
│                                         │                                              │
│                                         ▼                                              │
│                         Does successor item exist at index?                            │
│                                    /          \                                       │
│                              YES  /            \  NO                                  │
│                                  ▼              ▼                                      │
│                         Focus Successor     Does predecessor item exist?               │
│                                                /          \                           │
│                                          YES  /            \  NO                      │
│                                              ▼              ▼                          │
│                                     Focus Predecessor    Focus Container Landmark      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```


# 27. MODAL FOCUS ARCHITECTURE

A production modal dialog lifecycle requires:
1. **Trigger Preservation:** Capture `document.activeElement` before modal render.
2. **Initial Focus Acquisition:** Programmatically focus the first focusable child or dialog container on mount.
3. **Focus Trapping:** Prevent `Tab` and `Shift+Tab` from escaping the dialog boundaries.
4. **Escape Key Dismissal:** Listen for `Escape` and invoke the close callback.
5. **Deterministic Focus Restoration:** Restore focus to the preserved trigger element on unmount.

---

# 28. NESTED MODAL / OVERLAY FOCUS STACK

When multiple overlays open sequentially (Modal $	o$ Popover $	o$ Confirmation Dialog), Escape key handling and focus recovery must be managed using a **LIFO (Last-In-First-Out) Overlay Stack**. Only the topmost overlay processes `Escape` and receives focus.

---

# 29. FOCUS TRAP IS NOT SUFFICIENT ALONE

A focus trap only controls keyboard containment. A complete accessible dialog also requires:
- Semantic role (`role="dialog"` or `role="alertdialog"`).
- Accessible name (`aria-labelledby`) and description (`aria-describedby`).
- `aria-modal="true"` to hide backdrop content from screen readers.
- Focus restoration upon dismissal.

---

# 30. event.preventDefault() PRECISION

Never invoke `preventDefault()` indiscriminately in keyboard handlers. Only call `e.preventDefault()` when a specific, recognized custom key combination is handled.

---

# 31. stopPropagation() IS NOT FOCUS MANAGEMENT

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              EVENT DISPATCH METHOD MATRIX                              │
├─────────────────────┬──────────────────────────────────────────────────────────────────┤
│ Method              │ Purpose                                                          │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ e.preventDefault()  │ Cancels default browser action (e.g. scrolling on ArrowDown)     │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ e.stopPropagation() │ Prevents the event from bubbling up the React DOM hierarchy      │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ element.focus()     │ Directly modifies hardware browser focus target                  │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ setState()          │ Triggers React component re-render cycle                         │
└─────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

# 32. KEYBOARD + REACT RENDERING LIFECYCLE

$$\text{Keyboard Event} \to \text{React State Setter} \to \text{Re-render Element Tree} \to \text{DOM Commit} \to \text{Browser Focus Call}$$

Updating React state alone **does not** move browser hardware focus. Focus is imperative DOM state that must be explicitly synchronized.

---

# 33. THE FOCUS / STATE SPLIT

```typescript
// State update changes React virtual representation
setActiveId(nextId);

// Imperative focus moves hardware OS focus
const targetElement = document.getElementById(nextId);
targetElement?.focus();
```

---

# 34. useLayoutEffect FOR FOCUS SYNCHRONIZATION

When focus must be moved synchronously before the browser repaints the screen (avoiding visible focus flickers or layout jumps), `useLayoutEffect` ensures that DOM nodes are mutated and focused immediately after the commit phase:

```typescript
useLayoutEffect(() => {
  if (shouldFocus && elementRef.current) {
    elementRef.current.focus();
  }
}, [shouldFocus]);
```

---

# 35. CALLBACK REFS FOR DYNAMIC FOCUS TARGETS

When focus targets are dynamically mounted or conditionally rendered, callback refs execute immediately upon node attachment:

```tsx
<button
  ref={(node) => {
    if (node && isNewlyAdded) {
      node.focus();
    }
  }}
>
  New Item
</button>
```

---

# 36. ASYNC FOCUS HAZARDS & CONCURRENCY RACES

If an asynchronous operation triggers a focus change upon completion, rapid user interaction can make that focus transition stale:
1. User clicks *Search A* (slow, 2000ms latency).
2. User clicks *Search B* (fast, 500ms latency).
3. Search B finishes and focuses Result B.
4. Search A finishes late and forcefully steals focus, transporting the user back to Result A.

---

# 37. FOCUS IS USER STATE

Browser focus represents the user's active keyboard position. Unprompted focus theft is equivalent to snatching the keyboard away from the user.

---

# 38. FOCUS THEFT AS A CONCURRENCY BUG

Every asynchronous focus transition must verify **Currentness** before invoking `.focus()`.

---

# 39. FOCUS CURRENTNESS ARCHITECTURE

```typescript
export function useAsyncFocusManager() {
  const currentOperationIdRef = useRef(0);

  const requestFocus = useCallback(async (asyncTask: () => Promise<string | null>) => {
    const opId = ++currentOperationIdRef.current;
    const targetId = await asyncTask();

    // Verify currentness: Only focus if no newer operation has started
    if (opId === currentOperationIdRef.current && targetId) {
      document.getElementById(targetId)?.focus();
    }
  }, []);

  return { requestFocus };
}
```

---

# 40. KEYBOARD INTERACTION & DYNAMIC LISTS

When items are deleted, sorted, or filtered by asynchronous events while the user is actively navigating with arrow keys, the interaction state machine must reconcile the active ID against the updated collection.

---

# 41. DYNAMIC COLLECTION RECONCILIATION ALGORITHM

```typescript
function reconcileActiveId<T extends { id: string }>(
  items: T[],
  currentActiveId: string | null,
  previousItems: T[]
): string | null {
  if (items.length === 0) return null;
  if (items.some(item => item.id === currentActiveId)) {
    return currentActiveId; // Active item still exists
  }

  // Active item was removed. Find previous item's index in old array
  const prevIndex = previousItems.findIndex(item => item.id === currentActiveId);
  if (prevIndex === -1) return items[0].id;

  // Fallback to item at same index, or last surviving item
  const nextTarget = items[prevIndex] || items[items.length - 1];
  return nextTarget.id;
}
```

---

# 42. KEYBOARD NAVIGATION & VIRTUALIZATION

In virtualized lists (e.g. `react-window` / `@tanstack/react-virtual`), navigating to an unrendered item requires:
1. Updating logical state.
2. Scrolling the virtual window to materialize the target DOM node.
3. Establishing hardware focus on the newly mounted element.

---

# 43. VIRTUALIZATION CONTRACT SEQUENCE

$$\text{ArrowDown} \to \text{Update Target Index} \to \text{Virtualizer.scrollToIndex()} \to \text{Wait for Layout Commit} \to \text{Focus Node}$$

---

# 44. PRODUCTION REFERENCE IMPLEMENTATIONS

### 1. `useRovingTabIndex.ts`

```typescript
import { useState, useCallback, KeyboardEvent } from 'react';

export interface UseRovingTabIndexOptions<TId extends string> {
  itemIds: TId[];
  initialActiveId?: TId;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
}

export function useRovingTabIndex<TId extends string>({
  itemIds,
  initialActiveId,
  orientation = 'horizontal',
  loop = true,
}: UseRovingTabIndexOptions<TId>) {
  const [activeId, setActiveId] = useState<TId>(() => initialActiveId ?? itemIds[0]);

  const moveNext = useCallback(() => {
    setActiveId((current) => {
      const idx = itemIds.indexOf(current);
      if (idx === -1) return itemIds[0];
      if (idx === itemIds.length - 1) return loop ? itemIds[0] : current;
      return itemIds[idx + 1];
    });
  }, [itemIds, loop]);

  const movePrevious = useCallback(() => {
    setActiveId((current) => {
      const idx = itemIds.indexOf(current);
      if (idx === -1) return itemIds[0];
      if (idx === 0) return loop ? itemIds[itemIds.length - 1] : current;
      return itemIds[idx - 1];
    });
  }, [itemIds, loop]);

  const moveFirst = useCallback(() => {
    if (itemIds.length > 0) setActiveId(itemIds[0]);
  }, [itemIds]);

  const moveLast = useCallback(() => {
    if (itemIds.length > 0) setActiveId(itemIds[itemIds.length - 1]);
  }, [itemIds]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const isHorizontal = orientation === 'horizontal' || orientation === 'both';
      const isVertical = orientation === 'vertical' || orientation === 'both';

      if (isHorizontal && e.key === 'ArrowRight') {
        e.preventDefault();
        moveNext();
      } else if (isHorizontal && e.key === 'ArrowLeft') {
        e.preventDefault();
        movePrevious();
      } else if (isVertical && e.key === 'ArrowDown') {
        e.preventDefault();
        moveNext();
      } else if (isVertical && e.key === 'ArrowUp') {
        e.preventDefault();
        movePrevious();
      } else if (e.key === 'Home') {
        e.preventDefault();
        moveFirst();
      } else if (e.key === 'End') {
        e.preventDefault();
        moveLast();
      }
    },
    [orientation, moveNext, movePrevious, moveFirst, moveLast]
  );

  const getItemProps = useCallback(
    (id: TId) => ({
      tabIndex: activeId === id ? 0 : -1,
      onKeyDown: handleKeyDown,
      onClick: () => setActiveId(id),
    }),
    [activeId, handleKeyDown]
  );

  return {
    activeId,
    setActiveId,
    moveNext,
    movePrevious,
    moveFirst,
    moveLast,
    handleKeyDown,
    getItemProps,
  };
}
```

---

### 2. `useActiveDescendant.ts`

```typescript
import { useState, useCallback, KeyboardEvent } from 'react';

export interface UseActiveDescendantOptions<TId extends string> {
  itemIds: TId[];
  initialActiveId?: TId;
  loop?: boolean;
}

export function useActiveDescendant<TId extends string>({
  itemIds,
  initialActiveId,
  loop = true,
}: UseActiveDescendantOptions<TId>) {
  const [activeId, setActiveId] = useState<TId | null>(() => initialActiveId ?? null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (itemIds.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveId((current) => {
          if (!current) return itemIds[0];
          const idx = itemIds.indexOf(current);
          if (idx === -1 || idx === itemIds.length - 1) return loop ? itemIds[0] : current;
          return itemIds[idx + 1];
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveId((current) => {
          if (!current) return itemIds[itemIds.length - 1];
          const idx = itemIds.indexOf(current);
          if (idx <= 0) return loop ? itemIds[itemIds.length - 1] : current;
          return itemIds[idx - 1];
        });
      } else if (e.key === 'Home') {
        e.preventDefault();
        setActiveId(itemIds[0]);
      } else if (e.key === 'End') {
        e.preventDefault();
        setActiveId(itemIds[itemIds.length - 1]);
      }
    },
    [itemIds, loop]
  );

  return {
    activeId,
    setActiveId,
    handleKeyDown,
    activeDescendantId: activeId ? String(activeId) : undefined,
  };
}
```

---

### 3. `useFocusRecovery.ts`

```typescript
import { useRef, useCallback } from 'react';

export type FocusRecoveryPolicy = 'next' | 'previous' | 'container' | 'none';

export function useFocusRecovery(containerRef: React.RefObject<HTMLElement>) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const captureFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
  }, []);

  const recoverFocus = useCallback(
    (
      deletedIndex: number,
      survivingElements: HTMLElement[],
      policy: FocusRecoveryPolicy = 'next'
    ) => {
      if (policy === 'none') return;

      if (survivingElements.length === 0) {
        containerRef.current?.focus();
        return;
      }

      let target: HTMLElement | undefined;
      if (policy === 'next') {
        target = survivingElements[deletedIndex] || survivingElements[survivingElements.length - 1];
      } else if (policy === 'previous') {
        target = survivingElements[deletedIndex - 1] || survivingElements[0];
      } else if (policy === 'container') {
        containerRef.current?.focus();
        return;
      }

      target?.focus();
    },
    [containerRef]
  );

  return {
    captureFocus,
    recoverFocus,
  };
}
```


# 45. ABSTRACTION PURITY: DON'T LEAK KEYBOARD DETAILS

```typescript
// ❌ ANTI-PATTERN: Leaking key event plumbing to consumer
<ToolbarItem onArrowRight={handleRight} onArrowLeft={handleLeft} onHome={handleHome} />

// ✅ PRODUCTION STANDARD: Clean Declarative Hook Integration
const { getItemProps } = useRovingTabIndex({ itemIds: ['bold', 'italic', 'underline'] });

return (
  <div role="toolbar" aria-label="Format Toolbar">
    <button {...getItemProps('bold')}>Bold</button>
    <button {...getItemProps('italic')}>Italic</button>
    <button {...getItemProps('underline')}>Underline</button>
  </div>
);
```

---

# 46. SENIOR DIAGNOSTIC PROTOCOL

When keyboard navigation or focus recovery breaks in production, execute this diagnostic runbook:

1. **Hardware Inspection:** Log `document.activeElement` to confirm the exact DOM element holding focus.
2. **Logical State Inspection:** Verify if the React component's `activeId` matches the focused node.
3. **Tab Sequence Audit:** Check `tabIndex` attributes across all siblings. Ensure exactly **one** item has `tabIndex={0}`.
4. **Accessibility Tree Inspection:** Verify `aria-activedescendant` points to a valid, currently mounted element in the DOM.
5. **Lifecycle Trace:** Replay the action sequence: `Keydown 	o Handler 	o setState 	o Commit 	o Focus`.

---

# 47. BROWSER CONSOLE DIAGNOSTIC SCRIPTS

```javascript
// 1. Inspect current hardware focus target
console.log('Current Focus:', document.activeElement);

// 2. Identify all naturally tabbable elements in current view
const tabbables = document.querySelectorAll(
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
);
console.log(`Found ${tabbables.length} tabbable elements:`, tabbables);

// 3. Detect duplicate tabIndex={0} violations inside composite widgets
document.querySelectorAll('[role="toolbar"], [role="tablist"], [role="radiogroup"]').forEach(widget => {
  const zeroStops = widget.querySelectorAll('[tabindex="0"]');
  if (zeroStops.length > 1) {
    console.error('CRITICAL: Duplicate tabIndex=0 detected in composite widget:', widget, zeroStops);
  }
});
```

---

# 48. 🔥 PRODUCTION CRUCIBLE #1 — ARROW KEY HIJACKING IN FORM INPUTS

### The Incident
In an enterprise CRM suite, engineers implemented a global keyboard listener to navigate between customer records using `ArrowLeft` and `ArrowRight`. Customers immediately complained that they could no longer edit text inside input fields without accidentally changing records.

### Root Cause Analysis (RCA)
The global listener attached to `window` intercepted arrow key events indiscriminately without verifying whether `event.target` was an editable text input (`<input>`, `<textarea>`, or `contenteditable`).

### The Fix
```diff
- window.addEventListener("keydown", (e) => {
-   if (e.key === "ArrowRight") navigateNextRecord();
- });
+ window.addEventListener("keydown", (e) => {
+   const target = e.target;
+   if (
+     target instanceof HTMLInputElement ||
+     target instanceof HTMLTextAreaElement ||
+     (target instanceof HTMLElement && target.isContentEditable)
+   ) {
+     return; // Preserve native text editing
+   }
+   if (e.key === "ArrowRight") navigateNextRecord();
+ });
```

---

# 49. 🔥 PRODUCTION CRUCIBLE #2 — ROVING TABINDEX WITH DUPLICATE ENTRIES

### The Incident
Users navigating a rich text editor toolbar via `Tab` experienced erratic jumps. Instead of entering the toolbar once and tabbing to the main editor, users had to press `Tab` 5 times to traverse individual buttons.

### Root Cause Analysis (RCA)
Each toolbar button maintained its own local `useState` for focus state. Due to uncoordinated state updates, multiple buttons remained set to `tabIndex={0}`.

### The Fix
Centralize roving state in the parent toolbar container and derive each button's `tabIndex` from a single `activeId`.

---

# 50. 🔥 PRODUCTION CRUCIBLE #3 — DELETED ACTIVE ITEM CREATES FOCUS DEAD-END

### The Incident
In a dynamic todo application, users deleted an item using the keyboard `Delete` key. When the item vanished from the DOM, focus reset to `document.body`, forcing the user to tab through the navigation bar and header 40+ times.

### Root Cause Analysis (RCA)
The component unmounted the active node without executing a focus recovery policy.

### The Fix
```typescript
const handleDelete = (id: string, index: number) => {
  const surviving = items.filter(item => item.id !== id);
  setItems(surviving);

  // Execute deterministic recovery policy
  requestAnimationFrame(() => {
    const nextTarget = surviving[index] || surviving[surviving.length - 1];
    if (nextTarget) {
      document.getElementById(nextTarget.id)?.focus();
    } else {
      containerRef.current?.focus();
    }
  });
};
```

---

# 51. 🔥 PRODUCTION CRUCIBLE #4 — DIALOG CLOSES, FOCUS DISAPPEARS

### The Incident
A modal confirmation dialog was opened from a notification bell. While the dialog was open, an incoming WebSocket event refreshed the notifications list and replaced the original bell button. When the user closed the modal, the application attempted `triggerRef.current.focus()`, which silently failed because the node was detached.

### Root Cause Analysis (RCA)
Focus restoration lacked fallback resolution for detached trigger elements.

### The Fix
```typescript
const restoreFocus = (triggerEl: HTMLElement | null, fallbackEl: HTMLElement | null) => {
  if (triggerEl && document.body.contains(triggerEl)) {
    triggerEl.focus();
  } else if (fallbackEl && document.body.contains(fallbackEl)) {
    fallbackEl.focus();
  } else {
    document.querySelector('main')?.focus();
  }
};
```

---

# 52. 🔥 PRODUCTION CRUCIBLE #5 — STALE ASYNC FOCUS THEFT

### The Incident
In an asynchronous search combobox, a user typed "React" (Request A), quickly erased it, and typed "Next" (Request B). Request B completed in 200ms and focused the first Next.js result. At 800ms, the slow Request A resolved and forcefully moved focus to the old React result while the user was actively typing.

### Root Cause Analysis (RCA)
The asynchronous completion handler lacked an operation generation counter to verify currentness.

### The Fix
Implement the Generation Counter pattern in `useAsyncFocusManager` to discard stale focus requests.

---

# 53. 🔥 PRODUCTION CRUCIBLE #6 — tabIndex={0} ON ALL DATA GRID CELLS

### The Incident
A high-density financial data table with 50 columns and 100 rows rendered `tabIndex={0}` on every `<td>`. Keyboard users required 5,000 Tab presses to bypass the table.

### Root Cause Analysis (RCA)
Failure to implement the WAI-ARIA Grid composite pattern.

### The Fix
Transform the table into a composite 2D roving grid:
1. Table container or active cell holds single sequential tab stop (`tabIndex={0}`).
2. Arrow keys (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`) navigate internal cell coordinates.
3. Single `Tab` exits the entire 5,000-cell grid immediately.

---

# 54. 🧪 PREDICTION CHALLENGE

```tsx
<button
  tabIndex={activeId === item.id ? 0 : -1}
  onKeyDown={handleKeyDown}
>
  {item.label}
</button>
```

When executing `setActiveId(nextId)`:
1. **Does React state update?** $	o$ Yes.
2. **Does the component re-render?** $	o$ Yes.
3. **Does the new button automatically receive hardware DOM focus?** $	o$ **NO.** Updating `tabIndex` only affects sequential tab participation, not active focus.
4. **What happens to the old button's tabIndex?** $	o$ Changes from `0` to `-1`.
5. **What happens if the focused button is removed?** $	o$ Focus drops to `document.body` unless focus recovery is implemented.

---

# 55. ARCHITECTURAL DECISION MATRIX

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        COMPOSITE WIDGET ARCHITECTURE MATRIX                            │
├───────────────────┬───────────────────┬───────────────────┬────────────────────────────┤
│ Component Pattern │ Native HTML       │ Roving Tabindex   │ aria-activedescendant      │
├───────────────────┼───────────────────┼───────────────────┼────────────────────────────┤
│ Button Group      │ ✅ Best (Native)  │ Unnecessary       │ Unnecessary                │
├───────────────────┼───────────────────┼───────────────────┼────────────────────────────┤
│ Tabs Widget       │ Custom buttons    │ ✅ Recommended    │ Possible (Rare)            │
├───────────────────┼───────────────────┼───────────────────┼────────────────────────────┤
│ Formatting Toolbar│ Custom buttons    │ ✅ Recommended    │ Not Recommended            │
├───────────────────┼───────────────────┼───────────────────┼────────────────────────────┤
│ Combobox / Auto   │ <input>           │ Not Recommended   │ ✅ Recommended             │
├───────────────────┼───────────────────┼───────────────────┼────────────────────────────┤
│ Virtualized List  │ Custom rows       │ Complex           │ ✅ Highly Recommended      │
├───────────────────┼───────────────────┼───────────────────┼────────────────────────────┤
│ 2D Data Grid      │ <table> / custom  │ ✅ 2D Roving Grid │ Possible                   │
└───────────────────┴───────────────────┴───────────────────┴────────────────────────────┘
```

---

# 56. 🧪 COMPANION INTERACTIVE LAB OVERVIEW

The companion laboratory is located at:
[`examples/13-accessible-keyboard-focus-recovery.html`](./examples/13-accessible-keyboard-focus-recovery.html)

### Key Features Demonstrated:
1. **Mode A — Roving Tabindex Toolbar:** Live inspection of active entity ID, hardware `document.activeElement`, and deliberate duplicate `tabIndex={0}` bug injection.
2. **Mode B — `aria-activedescendant` Combobox:** Input hardware focus retention, visual active descendant mapping, and dynamic deletion dangling reference detection.
3. **Mode C — Dynamic Focus Recovery Sandbox:** Configurable recovery policies (*Next*, *Previous*, *Container*, *None*) with real-time focus tracking upon row deletion.
4. **Mode D — Async Stale Focus Race Condition:** Out-of-order asynchronous search simulation with toggleable generation currentness guard.

---

# 57. LAB ACCEPTANCE CRITERIA

- Real-time display of `document.activeElement`, active tag, and tabIndex.
- Clear visual differentiation between hardware focus and active descendant.
- Demonstrates focus loss to `document.body` when unmanaged deletion occurs.
- Verifies generation counter preventing stale asynchronous focus theft.

---

# 58. 🎯 50-POINT MASTER CHECKLIST

### Native Semantics & Tab Order
- [ ] 1. Native HTML interactive elements are preferred over custom `<div>` widgets.
- [ ] 2. Custom widgets have documented architectural justification.
- [ ] 3. Positive `tabIndex` values (>0) are completely eliminated from the codebase.
- [ ] 4. Natural document DOM order reflects the logical reading and navigation sequence.
- [ ] 5. `tabIndex={-1}` is used exclusively for programmatic focus targets.
- [ ] 6. `tabIndex={0}` is applied only to primary interactive controls and widget entry points.
- [ ] 7. Focus rings (`:focus-visible`) are prominent, high-contrast, and never removed with `outline: none`.
- [ ] 8. Focus styling is clearly distinguishable from mouse hover styling.
- [ ] 9. Skip links exist for bypassing repetitive header and navigation blocks.
- [ ] 10. Interactive elements inside disabled containers are correctly removed from the tab sequence.

### Roving Tabindex Architecture
- [ ] 11. Composite widgets (toolbars, tabs, menus) expose exactly one sequential tab stop.
- [ ] 12. `tabIndex={0}` is dynamically assigned to the single active entity.
- [ ] 13. All inactive sibling items maintain `tabIndex={-1}`.
- [ ] 14. Active entity state is tracked via stable string IDs, never volatile array indices.
- [ ] 15. Arrow keys (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`) navigate between sibling items.
- [ ] 16. `Home` and `End` keys jump to the first and last enabled items respectively.
- [ ] 17. Boundary wrapping policy (cyclic vs bounded) is explicitly defined.
- [ ] 18. Disabled items are gracefully bypassed during arrow navigation.
- [ ] 19. Clicking an item synchronizes both the active entity ID and hardware DOM focus.
- [ ] 20. Roving state updates trigger synchronous focus transitions without layout flickers.

### `aria-activedescendant` Architecture
- [ ] 21. Hardware DOM focus remains anchored to the owning container or `<input>`.
- [ ] 22. `aria-activedescendant` references a valid, currently mounted DOM node ID.
- [ ] 23. Active descendant options display clear synthetic visual focus styling.
- [ ] 24. `aria-selected="true"` is synchronized with the active option.
- [ ] 25. Active options are automatically scrolled into view (`scrollIntoView({ block: 'nearest' })`).
- [ ] 26. Virtualized lists ensure the active descendant target is materialized before reference.
- [ ] 27. Clearing selection correctly removes the `aria-activedescendant` attribute.
- [ ] 28. Screen readers accurately announce active options during rapid arrow key navigation.

### Focus Recovery & Dynamic Removal
- [ ] 29. Deleting a focused item triggers an explicit focus recovery policy.
- [ ] 30. Focus recovery prioritizes the next sibling item.
- [ ] 31. If deleting the last item, focus shifts to the previous sibling.
- [ ] 32. If deleting the final remaining item, focus shifts to the parent container landmark.
- [ ] 33. Focus never inadvertently drops to `document.body`.
- [ ] 34. Asynchronous list re-ordering reconciles active IDs against updated collections.
- [ ] 35. Modals preserve the triggering element before opening.
- [ ] 36. Closing a modal restores focus to the trigger element if still mounted.
- [ ] 37. Missing or unmounted modal triggers fall back to a safe landmark or main heading.
- [ ] 38. Nested overlays use a LIFO stack to route Escape key dismissal and focus return.

### Asynchronous & Concurrency Safety
- [ ] 39. Asynchronous focus transitions verify operation currentness before calling `.focus()`.
- [ ] 40. Slow out-of-order network responses are prevented from stealing active focus.
- [ ] 41. Component unmounting cancels pending programmatic focus timeouts or animation frames.
- [ ] 42. Focus requests check if target elements are currently connected to the DOM (`document.body.contains`).

### Event Handling & Abstraction
- [ ] 43. Global `window` keyboard listeners are strictly avoided unless implementing app-wide shortcuts.
- [ ] 44. Keyboard listeners verify `event.target` to prevent hijacking native form inputs.
- [ ] 45. `e.preventDefault()` is called only for handled, custom keyboard combinations.
- [ ] 46. `e.stopPropagation()` is never conflated with focus management.
- [ ] 47. Reusable hooks encapsulate keyboard state machines without leaking raw key codes.

### Automated Testing & Verification
- [ ] 48. Unit tests verify Tab navigation enters composite widgets at the active item.
- [ ] 49. Unit tests verify Arrow keys move `tabIndex={0}` and hardware focus across items.
- [ ] 50. Integration tests verify item deletion recovers focus to the correct adjacent element.

---

# 59. 🎤 10 STAFF-LEVEL INTERVIEW QUESTIONS & DISSERTATIONS

### Q1: What is the fundamental difference between DOM focus and an active item?
**Answer:** DOM focus is the hardware-level browser state representing the single DOM element currently targeted by OS keyboard events (`document.activeElement`). Active item is an application-level logical concept representing the currently selected or highlighted entity within a composite widget. They can align physically (roving tabindex) or diverge logically (`aria-activedescendant`), where DOM focus remains on an input while the active item is projected to the accessibility tree.

### Q2: Why is placing `tabIndex={0}` on every element inside a data table considered an architectural failure?
**Answer:** It violates the composite widget model by flooding the sequential document tab order. In a 50x100 table, this creates 5,000 sequential tab stops, causing extreme tab fatigue for keyboard users. The correct architecture is a 2D composite grid with a single tab stop into the table, internal arrow navigation, and a single tab stop out.

### Q3: What core invariant must a roving tabindex implementation preserve at all times?
**Answer:** Exactly **one** interactive item in the composite widget must possess `tabIndex={0}`, while all other sibling items have `tabIndex={-1}`. If multiple items have `tabIndex={0}`, sequential tab navigation enters at unpredictable points; if zero items have `tabIndex={0}`, the widget becomes unreachable via `Tab`.

### Q4: Under what conditions should an architect choose `aria-activedescendant` over roving tabindex?
**Answer:** `aria-activedescendant` is preferred when the user must type into a text input while simultaneously selecting options from a dynamic or virtualized list (e.g. Combobox, Autocomplete, Command Palette). Moving physical DOM focus to list items would blur the text input and break typing flow.

### Q5: Why is calling `setActiveId(nextId)` insufficient to move keyboard focus in React?
**Answer:** React state updates virtual DOM representations and schedules re-renders. Browser focus is imperative DOM state managed by the browser engine. Changing `tabIndex` attributes during a render does not instruct the browser to transfer hardware focus; `element.focus()` must be explicitly invoked.

### Q6: Why must active entity state be stored as stable entity IDs rather than numeric array indices?
**Answer:** Numeric indices represent volatile array positions. In dynamic applications where collections are filtered, sorted, paginated, or mutated via WebSockets, an index can silently point to a different entity. Stable unique IDs ensure that logical interaction follows the domain entity regardless of collection re-ordering.

### Q7: How does asynchronous code introduce focus theft vulnerabilities, and how do you prevent it?
**Answer:** If multiple asynchronous operations request focus upon resolution, out-of-order completion allows a slow, older request to steal focus from a newer user action. This is prevented by using a Generation Counter (Operation ID) pattern, verifying that an operation is still current before calling `.focus()`.

### Q8: What happens to browser focus when an active element is deleted from the DOM, and how should React applications respond?
**Answer:** When the active element is removed, the browser resets `document.activeElement` to `document.body`, throwing the user back to the start of the page. React applications must implement deterministic focus recovery, programmatically transferring focus to the next adjacent sibling, previous sibling, or parent container landmark before or immediately upon unmount.

### Q9: Why is attaching global `window.addEventListener('keydown')` listeners dangerous in enterprise design systems?
**Answer:** Global listeners capture keystrokes from all DOM contexts, frequently hijacking native text editing (e.g. arrow keys moving caret), conflicting with nested modal dialogs, and colliding with screen reader shortcut modes. Key handlers should be scoped to component boundaries via React synthetic event handlers.

### Q10: What is the comprehensive senior-level definition of keyboard accessibility?
**Answer:** A deterministic, state-machine-driven interaction contract where every interactive capability is fully operable via standard keyboard conventions, sequential navigation is predictable and concise, focus is visually clear and resilient against dynamic mutations, and asynchronous operations respect the user's active interaction context.

---

# 60. 🏆 GRADUATION GATE

To pass this milestone, you must be able to design, implement, and debug:

$$\text{Tab Entry} \to \text{Roving / ActiveDescendant Navigation} \to \text{Dynamic Deletion} \to \text{Focus Recovery} \to \text{Overlay Dismissal} \to \text{Focus Restoration}$$

You must be capable of diagnosing and rectifying:
- Focus resetting to `document.body`.
- Stale asynchronous focus theft.
- Multiple `tabIndex={0}` collisions in composite widgets.
- Broken `aria-activedescendant` references to unmounted virtual nodes.
- Global keyboard handler collisions with native form controls.

---

# 61. 🌟 FINAL SENIOR ARCHITECTURAL PRINCIPLE

> *"Keyboard accessibility is an interaction-state architecture problem, not a collection of ad-hoc `onKeyDown` handlers."*

The complete mental model is:

$$\text{Keyboard Input} \to \text{Interaction Owner} \to \text{Command} \to \text{State Machine Transition} \to \text{Stable Entity ID} \to \text{DOM / ARIA Projection} \to \text{Hardware Focus Sync} \to \text{Dynamic Recovery}$$

When building any interactive component, always ask:
1. **What is the interaction state machine?**
2. **Who owns each keyboard command?**
3. **What is the stable entity identity?**
4. **Where is hardware DOM focus at every moment?**
5. **What happens when the focused target changes or vanishes?**


---

# 62. 📦 COMPLETE PRODUCTION COMPONENT IMPLEMENTATIONS

### 1. `AccessibleRovingToolbar.tsx`

```tsx
import React, { useRef } from 'react';
import { useRovingTabIndex } from './useRovingTabIndex';

export interface ToolbarItemConfig {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface AccessibleRovingToolbarProps {
  label: string;
  items: ToolbarItemConfig[];
  onAction?: (id: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const AccessibleRovingToolbar: React.FC<AccessibleRovingToolbarProps> = ({
  label,
  items,
  onAction,
  orientation = 'horizontal',
}) => {
  const itemIds = items.filter(item => !item.disabled).map(item => item.id);
  const { activeId, getItemProps } = useRovingTabIndex({
    itemIds,
    orientation,
    loop: true,
  });

  return (
    <div
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      style={{
        display: 'inline-flex',
        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
        gap: '4px',
        padding: '6px',
        background: '#1e293b',
        borderRadius: '6px',
        border: '1px solid #334155',
      }}
    >
      {items.map((item) => {
        const isItemDisabled = item.disabled ?? false;
        const itemProps = !isItemDisabled ? getItemProps(item.id) : {};

        return (
          <button
            key={item.id}
            type="button"
            id={item.id}
            disabled={isItemDisabled}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: activeId === item.id ? '1px solid #38bdf8' : '1px solid #334155',
              background: activeId === item.id ? '#0f172a' : 'transparent',
              color: isItemDisabled ? '#64748b' : '#f8fafc',
              cursor: isItemDisabled ? 'not-allowed' : 'pointer',
              outline: 'none',
            }}
            {...itemProps}
            onClick={() => {
              if (!isItemDisabled) {
                if (itemProps.onClick) itemProps.onClick();
                onAction?.(item.id);
              }
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
```

---

### 2. `AccessibleComboboxActiveDescendant.tsx`

```tsx
import React, { useState, useRef, useEffect, useId } from 'react';
import { useActiveDescendant } from './useActiveDescendant';

export interface ComboboxOption {
  id: string;
  label: string;
}

export interface AccessibleComboboxProps {
  label: string;
  options: ComboboxOption[];
  onSelect: (option: ComboboxOption) => void;
  placeholder?: string;
}

export const AccessibleComboboxActiveDescendant: React.FC<AccessibleComboboxProps> = ({
  label,
  options,
  onSelect,
  placeholder = 'Type to search...',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  );
  const optionIds = filteredOptions.map(opt => opt.id);

  const { activeId, setActiveId, handleKeyDown, activeDescendantId } = useActiveDescendant({
    itemIds: optionIds,
    loop: true,
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!isOpen) {
        setIsOpen(true);
        e.preventDefault();
        return;
      }
      handleKeyDown(e);
    } else if (e.key === 'Enter' && isOpen && activeId) {
      e.preventDefault();
      const selected = filteredOptions.find(opt => opt.id === activeId);
      if (selected) {
        setQuery(selected.label);
        onSelect(selected);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '320px' }}>
      <label
        htmlFor={listboxId + '-input'}
        style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#94a3b8' }}
      >
        {label}
      </label>
      <input
        ref={inputRef}
        id={listboxId + '-input'}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeDescendantId ? activeDescendantId : undefined}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleInputKeyDown}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '6px',
          color: '#f8fafc',
          outline: 'none',
        }}
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '6px',
            listStyle: 'none',
            padding: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 50,
          }}
        >
          {filteredOptions.map((opt) => (
            <li
              key={opt.id}
              id={opt.id}
              role="option"
              aria-selected={activeId === opt.id}
              onClick={() => {
                setQuery(opt.label);
                onSelect(opt);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              style={{
                padding: '8px 12px',
                background: activeId === opt.id ? '#1e3a8a' : 'transparent',
                color: activeId === opt.id ? '#93c5fd' : '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
```

---

### 3. `AccessibleDynamicEditableList.tsx`

```tsx
import React, { useState, useRef } from 'react';
import { useFocusRecovery, FocusRecoveryPolicy } from './useFocusRecovery';

export interface ListItem {
  id: string;
  name: string;
}

export interface AccessibleDynamicEditableListProps {
  initialItems: ListItem[];
  policy?: FocusRecoveryPolicy;
}

export const AccessibleDynamicEditableList: React.FC<AccessibleDynamicEditableListProps> = ({
  initialItems,
  policy = 'next',
}) => {
  const [items, setItems] = useState<ListItem[]>(initialItems);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const { recoverFocus } = useFocusRecovery(containerRef);

  const handleDelete = (id: string, index: number) => {
    const survivingItems = items.filter(item => item.id !== id);
    setItems(survivingItems);

    requestAnimationFrame(() => {
      const survivingElements = survivingItems
        .map(item => itemRefs.current.get(item.id))
        .filter((el): el is HTMLButtonElement => el !== undefined);

      recoverFocus(index, survivingElements, policy);
    });
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      aria-label="Editable Items List"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        background: '#1e293b',
        borderRadius: '8px',
        border: '1px solid #334155',
        outline: 'none',
      }}
    >
      <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem' }}>Active Tasks</h3>
      {items.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No items remaining in the list.</p>
      ) : (
        items.map((item, index) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#0f172a',
              borderRadius: '4px',
              border: '1px solid #334155',
            }}
          >
            <span style={{ color: '#f8fafc' }}>{item.name}</span>
            <button
              type="button"
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
                else itemRefs.current.delete(item.id);
              }}
              onClick={() => handleDelete(item.id, index)}
              aria-label={`Delete ${item.name}`}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
};
```

---

# 63. 🧪 VITEST AUTOMATED TEST SUITES

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { AccessibleRovingToolbar } from './AccessibleRovingToolbar';
import { AccessibleComboboxActiveDescendant } from './AccessibleComboboxActiveDescendant';
import { AccessibleDynamicEditableList } from './AccessibleDynamicEditableList';

describe('AccessibleRovingToolbar', () => {
  const items = [
    { id: 'bold', label: 'Bold' },
    { id: 'italic', label: 'Italic' },
    { id: 'underline', label: 'Underline' },
  ];

  it('assigns tabIndex=0 strictly to the first enabled item initially', () => {
    render(<AccessibleRovingToolbar label="Formatting" items={items} />);
    const boldBtn = screen.getByRole('button', { name: 'Bold' });
    const italicBtn = screen.getByRole('button', { name: 'Italic' });
    const underlineBtn = screen.getByRole('button', { name: 'Underline' });

    expect(boldBtn).toHaveAttribute('tabindex', '0');
    expect(italicBtn).toHaveAttribute('tabindex', '-1');
    expect(underlineBtn).toHaveAttribute('tabindex', '-1');
  });

  it('transfers tabIndex=0 to the next item upon ArrowRight keydown', async () => {
    render(<AccessibleRovingToolbar label="Formatting" items={items} />);
    const boldBtn = screen.getByRole('button', { name: 'Bold' });
    const italicBtn = screen.getByRole('button', { name: 'Italic' });

    boldBtn.focus();
    fireEvent.keyDown(boldBtn, { key: 'ArrowRight' });

    expect(boldBtn).toHaveAttribute('tabindex', '-1');
    expect(italicBtn).toHaveAttribute('tabindex', '0');
  });

  it('cycles back to the first item when pressing ArrowRight on the last item', () => {
    render(<AccessibleRovingToolbar label="Formatting" items={items} />);
    const boldBtn = screen.getByRole('button', { name: 'Bold' });
    const underlineBtn = screen.getByRole('button', { name: 'Underline' });

    underlineBtn.focus();
    fireEvent.click(underlineBtn);
    fireEvent.keyDown(underlineBtn, { key: 'ArrowRight' });

    expect(boldBtn).toHaveAttribute('tabindex', '0');
    expect(underlineBtn).toHaveAttribute('tabindex', '-1');
  });
});

describe('AccessibleComboboxActiveDescendant', () => {
  const options = [
    { id: 'opt-react', label: 'React' },
    { id: 'opt-vue', label: 'Vue' },
  ];

  it('maintains hardware focus on input while shifting aria-activedescendant', () => {
    render(<AccessibleComboboxActiveDescendant label="Framework" options={options} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: 'Framework' });

    input.focus();
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'opt-react');
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'opt-vue');
    expect(document.activeElement).toBe(input);
  });
});

describe('AccessibleDynamicEditableList - Focus Recovery', () => {
  const items = [
    { id: '1', name: 'Task 1' },
    { id: '2', name: 'Task 2' },
    { id: '3', name: 'Task 3' },
  ];

  it('recovers focus to the successor item when the middle item is deleted', async () => {
    render(<AccessibleDynamicEditableList initialItems={items} policy="next" />);
    const deleteBtn2 = screen.getByRole('button', { name: 'Delete Task 2' });

    deleteBtn2.focus();
    fireEvent.click(deleteBtn2);

    await new Promise(resolve => requestAnimationFrame(resolve));
    const deleteBtn3 = screen.getByRole('button', { name: 'Delete Task 3' });
    expect(document.activeElement).toBe(deleteBtn3);
  });

  it('recovers focus to the container landmark when the final remaining item is deleted', async () => {
    render(<AccessibleDynamicEditableList initialItems={[{ id: '1', name: 'Task 1' }]} policy="next" />);
    const deleteBtn = screen.getByRole('button', { name: 'Delete Task 1' });
    const container = screen.getByRole('region', { name: 'Editable Items List' }) || screen.getByLabelText('Editable Items List');

    deleteBtn.focus();
    fireEvent.click(deleteBtn);

    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(document.activeElement).toBe(container);
  });
});
```
