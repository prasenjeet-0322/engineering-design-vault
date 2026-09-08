# Level 06 — React Fundamentals
## KPI 05 — Events & User Interaction
### PART 06 — Keyboard Interaction & Accessible User Input

[⬅️ Previous Part](05-forms-and-input-interaction.md) | [📚 Level 06 Index](README.md) | [🧪 Companion Lab](examples/06-keyboard-interaction-and-accessibility.html) | [Next Part ➡️](07-event-handler-identity-and-rendering.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## Layer 1 — ⚡ 30-Second Executive Cheat Sheet & Core Mental Models

### 1. The Core Problem
A user does not interact with a React application only through pointer clicks.
They interact through:
- Mouse
- Keyboard
- Touch
- Screen reader
- Browser controls
- Assistive technology

A senior React engineer therefore does not model interaction as:
$$\text{click} \longrightarrow \text{handler}$$

but as:
$$\text{USER INTENT} \longrightarrow \text{INTERACTION MECHANISM} \longrightarrow \text{EVENT} \longrightarrow \text{REACT HANDLER} \longrightarrow \text{APPLICATION ACTION} \longrightarrow \text{STATE / UI}$$

Keyboard interaction is one manifestation of this broader model.

---

### 2. Keyboard Interaction Mental Model
The basic pipeline is:

```
┌──────────────────────┐
│  User presses key    │
└──────────┬───────────┘
           │
           ▼
     Keyboard Event
           │
           ▼
     React Handler
           │
           ▼
 Interpret interaction
           │
           ▼
┌──────────────────────┐
│ Application behavior │
└──────────────────────┘
```

**Examples:**
- <kbd>Enter</kbd> $\rightarrow$ submit / activate
- <kbd>Escape</kbd> $\rightarrow$ dismiss / cancel
- <kbd>Arrow keys</kbd> $\rightarrow$ navigate
- <kbd>Tab</kbd> $\rightarrow$ move focus
- <kbd>Space</kbd> $\rightarrow$ activate appropriate controls

But the critical senior distinction is:
> **Do not manually recreate browser keyboard behavior when semantic HTML already provides it.**

---

### 3. Executive Concept Table

| Concept | Core Mechanism | Production Impact | Common Senior Trap |
| :--- | :--- | :--- | :--- |
| **`onKeyDown`** | React handler for key-down interaction | Common keyboard interaction boundary | Using it for every possible interaction |
| **`onKeyUp`** | React handler after key release | Useful for some interaction state | Assuming it is always preferable |
| **`event.key`** | Logical key value | Useful for intent-oriented logic | Confusing it with physical keyboard location |
| **`event.code`** | Physical key position/code | Useful for hardware-position semantics | Using it when logical key is required |
| **`event.repeat`** | Indicates repeated key events | Important for held-key behavior | Treating repeats as independent presses |
| **Modifier keys** | Shift/Ctrl/Alt/Meta state | Enables keyboard combinations | Building inaccessible custom shortcuts |
| **Focus** | Current keyboard interaction target | Fundamental accessibility concept | Managing focus only visually |
| **`tabIndex`** | Controls participation/order in tab navigation | Useful for carefully designed custom controls | Creating arbitrary positive tab order |
| **Native button** | Browser-provided interaction semantics | Gives keyboard/accessibility behavior | Replacing it with `<div>` |
| **Semantic HTML** | Platform-recognized interaction semantics | Reduces custom interaction code | Treating HTML semantics as optional |
| **Keyboard shortcut** | Application-specific key mapping | Powerful but easy to misuse | Intercepting keys globally |
| **`preventDefault()`** | Prevents default action | Useful when intentionally overriding behavior | Preventing expected browser behavior |
| **`stopPropagation()`** | Stops propagation | Useful for propagation boundaries | Using it as accessibility logic |
| **Focus management** | Programmatically moves focus when needed | Critical for dialogs/navigation | Moving focus arbitrarily |
| **Escape handling** | Common dismissal interaction | Useful for overlays/dialogs | Forgetting nested ownership |
| **Enter handling** | Common activation/submit interaction | Useful in appropriate contexts | Reimplementing native form submission |
| **Accessibility** | Interaction usable by diverse users | Production requirement | Treating it as a separate visual feature |

---

### 4. Golden Rule
> **Prefer semantic HTML and native interaction behavior first. Add keyboard handlers only when the application introduces behavior that the platform does not already provide.**

This single principle prevents a large class of React accessibility bugs.

---

## Layer 2 — 🔬 Deep Mechanical Breakdown

### 5. Keyboard Events Are Still Events
Keyboard interaction follows the same event model established earlier.
A handler:
```tsx
<input onKeyDown={handleKeyDown} />
```
receives an event describing the keyboard interaction.

Conceptually:
$$\text{physical interaction} \longrightarrow \text{browser keyboard event} \longrightarrow \text{React event boundary} \longrightarrow \text{handler} \longrightarrow \text{application decision}$$

The React event system does not change the fundamental fact that a keyboard event represents user interaction.

---

### 6. `onKeyDown`
Example:
```tsx
function SearchBox() {
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      clearSearch();
    }
  }

  return <input onKeyDown={handleKeyDown} />;
}
```

The important part is: `event.key === "Escape"`.  
The application is asking: *Did the user perform the logical Escape-key interaction?*

---

### 7. `onKeyUp`
React also provides:
```tsx
<input onKeyUp={handleKeyUp} />
```
This occurs when the key is released.

Conceptually:
$$\text{key press} \longrightarrow \text{keydown} \longrightarrow \dots \longrightarrow \text{keyup}$$

Do not automatically treat `keydown` and `keyup` as interchangeable. The appropriate event depends on the interaction contract.
- For an immediate action such as <kbd>Escape</kbd> $\rightarrow$ close, `keydown` is commonly appropriate.
- For behavior that depends on release semantics, `keyup` may be appropriate.

---

### 8. What About `onKeyPress`?
Do not build new interaction architecture around legacy `keypress` patterns.
Modern React keyboard interaction should generally be reasoned about through:
- `keydown`
- `keyup`
- along with semantic native controls.

The deeper browser-history details belong to the browser/web-platform curriculum.

---

### 9. `event.key`
`event.key` describes the logical key value.
Examples include:
`"Enter"`, `"Escape"`, `"ArrowUp"`, `"ArrowDown"`, `"ArrowLeft"`, `"ArrowRight"`, `"Tab"`, `" "`, `"a"`, `"b"`.

Example:
```tsx
function handleKeyDown(event: React.KeyboardEvent) {
  if (event.key === "Escape") {
    closeMenu();
  }
}
```
This is usually what you want when your application is expressing: *"When the user presses Escape..."*

---

### 10. `event.code`
`event.code` represents the physical keyboard key/code.
For example, a physical key may correspond to:
`KeyA`, `KeyB`, `Digit1`, `ArrowUp`, `Space`.

The distinction is:
- **`event.key`**: Logical key value (layout-aware, internationalized)
- **`event.code`**: Physical key identity (hardware position)

This matters with different keyboard layouts (QWERTY vs AZERTY vs Dvorak).

---

### 11. `key` vs `code`
- Suppose the application means: *"Press the logical Escape key."* $\implies$ Use `event.key === "Escape"`.
- Suppose the application is implementing something where the physical keyboard position matters (e.g., WASD gaming controls). $\implies$ `event.code` may be more appropriate.

The senior question is:
> *Does the application care about the character/meaning of the key or the physical key position?*

Do not blindly use one everywhere.

---

### 12. Modifier Keys
Keyboard events expose modifier state:
- `event.shiftKey`
- `event.ctrlKey`
- `event.altKey`
- `event.metaKey` (Command on Mac, Windows key on Windows)

Example:
```tsx
function handleKeyDown(event: React.KeyboardEvent) {
  if (event.metaKey && event.key === "k") {
    openCommandPalette();
  }
}
```
The interaction contract is:
$$\text{Meta} + \text{K} \longrightarrow \text{open command palette}$$

Keyboard shortcuts should always be designed intentionally.

---

### 13. Platform Differences
Do not assume `Ctrl` is the universal modifier for every operating environment.
A common cross-platform conceptual mapping is:
- **Windows / Linux** $\rightarrow$ `Ctrl`
- **macOS** $\rightarrow$ `Meta`

Therefore, application shortcuts often need platform-aware thinking. A simplistic `if (event.ctrlKey && event.key === "k")` may not provide the intended behavior on macOS.

---

### 14. `event.repeat`
When a key is held down, keyboard events repeat. React exposes: `event.repeat` (boolean).

Example:
```tsx
function handleKeyDown(event: React.KeyboardEvent) {
  if (event.key === "ArrowDown") {
    console.log({ repeat: event.repeat });
  }
}
```
- First press: `repeat = false`
- Held key: `repeat = true`

This matters for:
- Increment / decrement
- Game controls
- Keyboard list navigation
- Continuous movement

Do not assume one physical press always produces exactly one handler invocation.

---

### 15. Keyboard Event $\rightarrow$ Application Intent
A common anti-pattern is allowing low-level key checks to spread throughout the application (`if (event.key === "Escape") ...` everywhere).

A stronger architecture is:
$$\text{Keyboard event} \longrightarrow \text{interaction interpretation} \longrightarrow \text{semantic action}$$

For example:
```tsx
function handleKeyDown(event: React.KeyboardEvent) {
  if (event.key === "Escape") {
    onDismiss();
  }
}
```
The child translates <kbd>Escape</kbd> into `dismiss`. The parent need not know that <kbd>Escape</kbd> caused it.

---

### 16. Keyboard Interaction and Component Contracts
Consider:
```tsx
<Dialog onDismiss={closeDialog} />
```

Inside:
```tsx
function Dialog({ onDismiss }: { onDismiss: () => void }) {
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      onDismiss();
    }
  }

  return (
    <section onKeyDown={handleKeyDown}>
      {/* dialog content */}
    </section>
  );
}
```

The component contract is:
$$\text{Keyboard mechanics} \longrightarrow \text{onDismiss()} \longrightarrow \text{application behavior}$$

This follows the same event-boundary principles from Part 04.

---

### 17. The Semantic HTML Principle
Suppose you want something clickable.

#### Bad
```tsx
<div onClick={handleClick}>
  Save
</div>
```
You now potentially need to recreate:
- Keyboard activation (<kbd>Enter</kbd> / <kbd>Space</kbd>)
- Focusability
- Button semantics
- Disabled semantics
- Accessibility behavior

#### Better
```tsx
<button type="button" onClick={handleClick}>
  Save
</button>
```
The platform already understands `<button>` as an interactive control.

> **Use native semantics before implementing custom semantics.**

---

### 18. Why `<div>` Is Not a Button
A `<div>` is a generic container. It does not inherently communicate *"I am an actionable button"*. A button does.

The difference is architectural:
- `<div>`: Custom behavior required
- `<button>`: Browser + accessibility semantics built in

The second approach requires less code and creates fewer opportunities for interaction bugs.

---

### 19. The Dangerous Custom Button
Consider:
```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
>
  Save
</div>
```
A developer may think *"Now it is accessible."* Not necessarily! You may still need to reason about:
- Keyboard activation (<kbd>Enter</kbd> and <kbd>Space</kbd> handlers)
- Focus styling (`:focus-visible`)
- Disabled semantics (`aria-disabled`)
- ARIA state
- Screen reader expectations

This is why native controls should always be preferred.

---

### 20. Native Button vs Custom Interactive Element

| Requirement | Native `<button>` | Custom `<div>` |
| :--- | :--- | :--- |
| **Button semantics** | Built in | Must recreate |
| **Keyboard activation** | Built in (<kbd>Enter</kbd> & <kbd>Space</kbd>) | Must implement |
| **Focus behavior** | Built in | Must implement / manage |
| **Disabled behavior** | Built in | Must design |
| **Accessibility semantics** | Strong default | Easy to get wrong |
| **Maintenance** | Lower | Higher |
| **Appropriate default** | **Yes** | Only when genuinely necessary |

The senior default is: **button first**, not *div first*.

---

### 21. `tabIndex`
- **`tabIndex={0}`**: Elements participate in natural sequential keyboard navigation in DOM order.
- **`tabIndex={-1}`**: Elements become programmatically focusable (`element.focus()`) without being in the normal tab sequence.
- **Positive `tabIndex` (`tabIndex={1}`, `tabIndex={2}`)**: **Avoid.** It creates a custom navigation sequence that diverges from DOM order and becomes fragile and confusing to maintain.

---

### 22. Focus Is Application State in Some Interfaces
Consider a dialog:
$$\text{Open dialog} \longrightarrow \text{focus moves into dialog} \longrightarrow \text{user interacts} \longrightarrow \text{Escape} \longrightarrow \text{dialog closes} \longrightarrow \text{focus returns appropriately}$$

Focus determines:
- Where keyboard interaction goes
- What assistive technology perceives as active
- What control receives keyboard events

Therefore focus management is part of interaction architecture.

---

### 23. `document.activeElement`
When debugging focus:
```javascript
console.log(document.activeElement);
```
This tells you which element currently owns document focus. Use it to answer: *Who currently receives keyboard interaction?*

Extremely useful when debugging keyboard shortcuts, dialogs, menus, custom controls, and focus traps.

---

### 24. Focus vs Click
A common mistake is thinking `click` is the only activation mechanism. Keyboard users reach an element through <kbd>Tab</kbd> and activate a native button through <kbd>Enter</kbd> or <kbd>Space</kbd>.

Design the component around the **intent** rather than only pointer events.

---

### 25. Enter and Native Forms
Consider:
```tsx
<form onSubmit={handleSubmit}>
  <input />
  <button type="submit">Save</button>
</form>
```

Do not write:
```tsx
<input
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  }}
/>
```
if the desired behavior is ordinary form submission. The platform already submits forms upon pressing <kbd>Enter</kbd>.

---

### 26. The Reimplementation Trap
- **Bad architecture:** Every form input $\rightarrow$ `keydown` listener $\rightarrow$ `if Enter` $\rightarrow$ manually submit.
- **Better architecture:** Semantic form $\rightarrow$ native submission behavior $\rightarrow$ `onSubmit`.

The first duplicates platform behavior; the second integrates with it.

---

### 27. Escape as an Application Interaction
<kbd>Escape</kbd> is a good example of custom keyboard behavior:
```tsx
function Modal({ onDismiss }: { onDismiss: () => void }) {
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      onDismiss();
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {/* modal content */}
    </div>
  );
}
```
Ownership still matters: which component should respond? Not every ancestor should independently close itself.

---

### 28. Keyboard Event Propagation
Keyboard events participate in standard event propagation (bubble up through parent DOM nodes).

If a child stops propagation (`event.stopPropagation()`), an ancestor will not receive the keyboard event. Remember: propagation mechanics and application responsibility are separate concerns.

---

### 29. Nested Keyboard Interaction
Imagine:
```
Command Palette
  └── Search Input
        └── Suggestion List
```
- The palette wants: <kbd>Escape</kbd> $\rightarrow$ close palette
- The input wants: <kbd>ArrowDown</kbd> $\rightarrow$ move suggestion focus
- The suggestion list wants: <kbd>Enter</kbd> $\rightarrow$ select suggestion

A senior engineer asks:
- Which component interprets which key?
- At which abstraction layer?
- Should propagation continue?
- Does native behavior already exist?

---

### 30. Keyboard Navigation Is Not the Same as Keyboard Shortcut Handling
- **Navigation (<kbd>ArrowDown</kbd>, <kbd>ArrowUp</kbd>, <kbd>Tab</kbd>):** Moves through or within an interface.
- **Shortcut (<kbd>Meta+K</kbd>, <kbd>Escape</kbd>):** Invokes an application command.

Do not implement both through a single giant global keyboard listener.

---

### 31. Global Keyboard Listeners
Global listeners create a large interaction scope:
- Command palette
- Global shortcuts
- Escape-to-dismiss overlay

Potential hazards:
- Text input typing conflicts
- Nested component collisions
- Focus ownership hijacking
- Browser default shortcut overrides

**Rule:** Scope keyboard handling as narrowly as the interaction requires.

---

### 32. Input Fields and Global Shortcuts
Suppose you implement:
```javascript
window.addEventListener("keydown", (event) => {
  if (event.key === "k") {
    openPalette();
  }
});
```

Now the user types `"k"` inside a text input. The command palette unexpectedly opens!

The shortcut architecture must check interaction context:
- What element has focus?
- Is it an editable control (`<input>`, `<textarea>`, `contenteditable`)?
- Is a modifier key combination required?

---

### 33. Do Not Break Text Entry
Bad:
```tsx
<input onKeyDown={(event) => { event.preventDefault(); }} />
```
This destroys typing, cursor movement, selection, copy/paste, and input methods (IME). Keyboard handlers should be surgical.

---

### 34. `preventDefault()` Must Be Intentional
```tsx
function handleKeyDown(event: React.KeyboardEvent) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveSelectionDown();
  }
}
```
Ask:
1. What default behavior am I preventing? (e.g., page scroll)
2. Why?
3. What behavior replaces it?
4. Is that replacement accessible?

---

### 35. Keyboard Event vs Application Event
- **Bad abstraction:** Parent receives `KeyboardEvent` $\rightarrow$ parent decides what <kbd>Escape</kbd> means.
- **Better abstraction:** Child intercepts `KeyboardEvent` $\rightarrow$ recognizes <kbd>Escape</kbd> $\rightarrow$ emits `onDismiss()`.

This keeps DOM mechanics encapsulated inside the child.

---

### 36. Render Snapshot Reasoning
Keyboard handlers are closures over render snapshots:
```tsx
function Editor() {
  const [mode, setMode] = useState("insert");

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      console.log(mode);
    }
  }

  return <input onKeyDown={handleKeyDown} />;
}
```
The handler captures the `mode` value from the render that created it.

---

### 37. Prediction Walkthrough — Keyboard State
```tsx
function Editor() {
  const [mode, setMode] = useState("insert");

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setMode("normal");
      console.log(mode);
    }
  }

  return <input onKeyDown={handleKeyDown} />;
}
```

1. **Initial (Render #1):** `mode = "insert"`.
2. **User presses <kbd>Escape</kbd>:**
   - Handler closure sees `mode = "insert"`.
   - Requests `setMode("normal")`.
   - Logs `"insert"`.
3. **Render #2:** `mode = "normal"`.

State setters request future render state; they do not rewrite current closures.

---

### 38. Keyboard Interaction and Accessibility
Accessibility is not added at the end; it influences component architecture from the start:
- Can it be reached via keyboard?
- Can it be identified?
- Can it be operated?
- Can its state be understood?
- Can it be dismissed?
- Does focus behave predictably?

---

### 39. Native Controls Give You a Head Start
Prefer `<button>`, `<input>`, `<select>`, `<textarea>`, `<a href="...">` when their semantics match the requirement. They provide platform-recognized behavior for free.

---

### 40. Styling Is Not Semantics
`<div className="button">` may look like `<button>`, but:
$$\text{visual equivalence} \neq \text{semantic equivalence}$$

The browser and assistive technologies care about element semantics and interaction contracts.

---

### 41. Focus Visibility
Never remove focus indicators (`outline: none;`) without replacing them with an equally clear focus style (`:focus-visible`).

> **Never trade keyboard operability for visual styling.**

---

### 42. Accessible Interaction States
Interactive components have states: `focused`, `hovered`, `pressed`, `expanded`, `selected`, `disabled`.

Do not turn platform-managed state (like hover/focus) into React state without a real application ownership requirement.

---

### 43. `aria-*` Is Not a Replacement for Semantics
`<div role="button" aria-label="Save" />` communicates semantics to screen readers, but does **not** automatically provide keyboard activation or focus behavior.

Prefer `<button aria-label="Save">`. Use ARIA to supplement semantics, not to replace native controls.

---

### 44. Production Anti-Pattern #1 — Clickable `<div>`
- **Flawed:** `<div onClick={save}>Save</div>`
- **Failure:** Inaccessible to keyboard-only and screen reader users.
- **Refactor:** `<button type="button" onClick={save}>Save</button>`.

---

### 45. Production Anti-Pattern #2 — Manual Enter Submission
- **Flawed:** `<input onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />`
- **Failure:** Reinvents built-in form behavior and breaks standard accessibility tooling.
- **Refactor:** `<form onSubmit={handleSubmit}><input /><button type="submit">Save</button></form>`.

---

### 46. Production Anti-Pattern #3 — Positive `tabIndex`
- **Flawed:** `<div tabIndex={5}>`
- **Failure:** Breaks logical tab order.
- **Refactor:** Use natural DOM order and `tabIndex={0}` only on custom interactive widgets.

---

### 47. Production Anti-Pattern #4 — Global Keydown Everything
- **Flawed:** Attaching global `keydown` listeners on `window` for localized component behavior.
- **Failure:** Key conflicts when typing into form fields or nested overlays.
- **Refactor:** Scope keyboard handlers to the specific component container (`onKeyDown`).

---

### 48. Production Anti-Pattern #5 — Preventing Every Key
- **Flawed:** Unconditionally calling `event.preventDefault()` on keydown.
- **Failure:** Destroys browser typing, selection, navigation, and shortcuts.
- **Refactor:** Only prevent default for specifically handled keys (e.g., <kbd>ArrowDown</kbd> in a dropdown).

---

### 49. Production Anti-Pattern #6 — Keyboard Logic in Domain Services
- **Flawed:** Passing raw `KeyboardEvent` objects into business logic services.
- **Refactor:** Translate keyboard events into semantic intent (`onDismiss()`, `onSelect()`) at the component boundary.

---

## Layer 3 — 🧪 Diagnostic Labs & DevTools Profiling

### 50. Diagnostic Lab 1 — Inspect Keyboard Events
```tsx
function DebugKeyboard() {
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    console.table({
      key: event.key,
      code: event.code,
      repeat: event.repeat,
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey,
    });
  }

  return <input onKeyDown={handleKeyDown} placeholder="Press keys" />;
}
```

---

### 51. Diagnostic Lab 2 — Focus Inspector
```javascript
console.log(document.activeElement);
```
Track active element across <kbd>Tab</kbd>, <kbd>Shift+Tab</kbd>, and modal open/close sequences.

---

### 52. Diagnostic Lab 3 — Native vs Custom Control
Test navigating and activating `<button>` vs `<div role="button" tabIndex={0}>` using keyboard only to experience platform differences.

---

### 53. Diagnostic Lab 4 — Form Enter Behavior
Compare native `<form onSubmit={...}>` submission with manual `onKeyDown` Enter listeners.

---

### 54. Diagnostic Lab 5 — Event Propagation
Verify that `event.stopPropagation()` in an input's `onKeyDown` halts bubbling to parent container keydown listeners.

---

### 55. Diagnostic Lab 6 — Render Snapshot
Verify that keyboard handler closures capture the render snapshot in which they were created.

---

### 56. React DevTools Runbook
1. Open React DevTools $\rightarrow$ Profiler.
2. Focus component $\rightarrow$ Press keys $\rightarrow$ Inspect re-rendered subtrees.
3. Confirm that localized keyboard handling does not trigger whole-app re-renders.

---

## Layer 4 — 🔥 The Crucible

### 57. Prediction Challenge #1 — `key` vs `code`
- For <kbd>Shift+A</kbd>: `key = "A"`, `code = "KeyA"`.
- For international layouts: `key` reflects typed character; `code` reflects physical hardware key.

---

### 58. Prediction Challenge #2 — `repeat`
Holding a key produces `repeat = false` on first event, and `repeat = true` on subsequent continuous events.

---

### 59. Prediction Challenge #3 — Snapshot
`setMode("normal")` updates the next render; the immediate `console.log(mode)` in the handler logs `"insert"`.

---

### 60. Prediction Challenge #4 — Propagation
If child input handler calls `event.stopPropagation()`, the parent's `onKeyDown` will not fire.

---

### 61. Prediction Challenge #5 — Native Button
A native `<button>` provides built-in keyboard activation (<kbd>Enter</kbd> / <kbd>Space</kbd>), natural focus order, and screen reader announcements without custom code.

---

### 62. Prediction Challenge #6 — Form Enter
Never add manual Enter listeners when a standard `<form onSubmit={...}>` already provides accessible submission.

---

### 63. Prediction Challenge #7 — Global Shortcut
Global shortcuts must check whether `document.activeElement` is an editable input before triggering commands.

---

### 64. Prediction Challenge #8 — `preventDefault`
Preventing default on <kbd>ArrowDown</kbd> halts page scrolling so custom dropdown selection can execute cleanly.

---

### 65. Production Incident Runbook — "Keyboard Shortcut Breaks Typing"
- **Root Cause:** Global listener intercepted keystrokes while user was typing in an `<input>`.
- **Fix:** Guard with `if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;`.

---

### 66. Production Incident Runbook — "Custom Button Is Not Keyboard Accessible"
- **Root Cause:** `<div onClick={...}>` lacks keyboard listeners and focusability.
- **Fix:** Replace with `<button type="button" onClick={...}>`.

---

### 67. Production Incident Runbook — "Escape Closes the Wrong Thing"
- **Root Cause:** Uncoordinated nested <kbd>Escape</kbd> listeners.
- **Fix:** Child overlay consumes <kbd>Escape</kbd> and calls `stopPropagation()`.

---

### 68. Production Incident Runbook — "Tab Order Is Strange"
- **Root Cause:** Positive `tabIndex` values (`tabIndex={1}`).
- **Fix:** Remove positive `tabIndex` and rely on natural DOM ordering.

---

### 69. Production Incident Runbook — "Focus Disappears After Modal Opens"
- **Root Cause:** Focus remained on background trigger instead of moving to modal.
- **Fix:** Programmatically move focus to initial modal element on mount and restore on unmount.

---

### 70. Engineering Decision Matrix

| Requirement | Preferred Approach |
| :--- | :--- |
| Button interaction | Native `<button>` |
| Link navigation | Native `<a href>` |
| Form submission | Native `<form>` + `onSubmit` |
| Escape dismisses component | Scoped `onKeyDown` |
| Arrow navigation in custom widget | Explicit keyboard model |
| Global command shortcut | Carefully scoped global listener |
| Normal text entry | Let browser handle it |
| Keyboard focus | Native focus behavior |
| Custom focusable element | `tabIndex={0}` only when justified |
| Positive tab order | Avoid |
| Logical key intent | `event.key` |
| Physical keyboard position | `event.code` |
| Repeated key behavior | Consider `event.repeat` |
| Default browser behavior | Prevent only intentionally |
| Propagation | Stop only intentionally |
| Custom semantic role | Prefer native element first |

---

### 71. Senior-Level Questions
1. Is this behavior already provided by semantic HTML?
2. What user intent does the key represent?
3. Who owns that interaction?
4. Does the event need to propagate?
5. Am I preventing a browser behavior?
6. Can the interaction still be performed without a mouse?

---

### 72. Keyboard Interaction Architecture
```
                   USER
                     │
         ┌───────────┴───────────┐
         │                       │
      pointer                 keyboard
         │                       │
         ▼                       ▼
      browser                 browser
         │                       │
         └───────────┬───────────┘
                     ▼
                React event
                     │
                     ▼
           interaction boundary
                     │
                     ▼
              semantic action
                     │
                     ▼
               state / update
                     │
                     ▼
                   render
```

---

### 73. The Best Abstraction
Both mouse click and keyboard activation converge on the same semantic action: `onSave()`.

---

### 74. Example: Reusable Semantic Action
```tsx
function SaveButton({ onSave }: { onSave: () => void }) {
  return (
    <button type="button" onClick={onSave}>
      Save
    </button>
  );
}
```
No manual `onKeyDown` needed—the browser provides accessible keyboard activation automatically.

---

### 75. Example: Custom Escape Behavior
```tsx
function Panel({ onDismiss }: { onDismiss: () => void }) {
  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      onDismiss();
    }
  }

  return (
    <section onKeyDown={handleKeyDown}>
      {/* content */}
    </section>
  );
}
```

---

### 76. Accessibility Is an Architectural Constraint
Accessibility determines element choice, component APIs, focus management, and event boundaries from day one.

---

### 77. Completion Checklist
- [x] **Event Types:** Understand `onKeyDown` vs `onKeyUp`.
- [x] **Properties:** Distinguish `event.key` from `event.code` and handle `event.repeat`.
- [x] **Modifiers:** Implement platform-aware shortcut handling (`metaKey` vs `ctrlKey`).
- [x] **Semantics:** Prioritize native `<button>` over clickable `<div>`.
- [x] **Focus:** Manage focus predictably and avoid positive `tabIndex`.
- [x] **Forms:** Leverage built-in `<form onSubmit>` instead of manual Enter listeners.
- [x] **Safety:** Guard global listeners against input conflicts and text interference.
- [x] **Snapshots:** Reason about closures in keyboard event handlers.

---

### 78. Graduation Standard
You are ready when looking at:
```tsx
<div onClick={handleAction} onKeyDown={handleKeyDown} tabIndex={0} role="button">
  Save
</div>
```
prompts you to immediately refactor to `<button type="button" onClick={handleAction}>Save</button>`.

---

### 79. Final Mental Model
```
                  USER INTENT
                       │
         ┌─────────────┴─────────────┐
         │                           │
  native behavior             custom behavior
         │                           │
         ▼                           ▼
   semantic HTML               keyboard event
         │                           │
         └─────────────┬─────────────┘
                       ▼
              interaction contract
                       │
                       ▼
                semantic action
                       │
                       ▼
               application state
                       │
                       ▼
                     render
```

> **Use the platform's interaction semantics wherever they already express the intended behavior. Use React keyboard handlers to add application-specific interaction—not to unnecessarily rebuild the browser.**
