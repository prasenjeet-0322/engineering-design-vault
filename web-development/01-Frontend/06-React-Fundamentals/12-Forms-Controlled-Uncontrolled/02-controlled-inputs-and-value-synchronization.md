# Level 06 — React Fundamentals
## KPI 08 / KPI 12 — Forms & Controlled Inputs
### PART 02 — Controlled Inputs & Value Synchronization

[⬅️ Previous Part (01: Forms as State Ownership)](01-forms-as-state-ownership.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/02-controlled-inputs-and-value-synchronization.html) | [Next Part ➡️](03-input-events-change-semantics.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Frontend Competency)  
> **Author:** [Prasenjeet](https://github.com/prasenjeet-0322) (Mid-Level Full Stack Developer)  
> **Lead System Architect & Approver:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

# 🧭 Part Objective

In React application engineering, a controlled input is not merely passing a prop `<input value={value} />`. It is a **bidirectional synchronization contract**: React state declares the authoritative visual value, and the event handler translates raw browser keystrokes back into state transitions.

```text
DECLARATIVE REACT RUNTIME                     BROWSER DOM ENGINE
            │                                         │
   ┌────────┴────────┐                       ┌────────┴────────┐
   ▼                 ▼                       ▼                 ▼
REACT STATE     RENDER VALUE            NATIVE INPUT      KEYSTROKES
(Authoritative) (JSX value prop)        (Physical Host)   (Raw Characters)
   │                 ▲                       │                 │
   └──── setState ───┴─── onChange Event ────┴─────────────────┘
```

When building complex forms, naive value handling leads to subtle production bugs:
- **Cursor Jumping**: Formatted currency/phone inputs jumping the caret to the end of the line on every keystroke.
- **1-Keystroke Validation Lag**: Validating against stale render closures instead of incoming event values.
- **Premature Numeric Parsing**: Converting empty strings `""` or `"-"` to `NaN` during active editing.
- **Controlledness Mutation Warnings**: Accidentally passing `value={undefined}` and causing React to flip an input from controlled to uncontrolled.

The objective of this Part is to master **Controlled Inputs & Value Synchronization**: understanding the **Render Snapshot vs Event Value vs Next State** distinction, building **canonical formatting models with cursor preservation**, handling **temporary editing states**, managing **draft vs committed parent boundaries**, and preventing **controlled/uncontrolled lifecycle flips**.

---

# ⚡ LAYER 1 — 30-Second Executive Cheat Sheet & Core Mental Models

## 1. The Three Critical Temporal Values

During any controlled input update, a senior engineer distinguishes between three distinct values:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. RENDER SNAPSHOT: Value observed by the CURRENT render closure ("ab")     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. EVENT VALUE:     Physical DOM value produced by the keystroke ("abc")    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. NEXT STATE:      Value queued in the update queue for the NEXT render    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Executive Form Element Matrix

| Form Control | Controlled Prop | Transition Event | Value Normalization |
| :--- | :--- | :--- | :--- |
| **`<input type="text">`** | `value={text ?? ''}` | `onChange={(e) => setText(e.target.value)}` | String (preserve empty/intermediate edits) |
| **`<input type="checkbox">`** | `checked={isAgreed}` | `onChange={(e) => setIsAgreed(e.target.checked)}` | Boolean (`e.target.checked`, NOT `e.target.value`) |
| **`<input type="radio">`** | `checked={selected === 'A'}` | `onChange={() => setSelected('A')}` | Enum / String equality matching |
| **`<textarea>`** | `value={bio ?? ''}` | `onChange={(e) => setBio(e.target.value)}` | String (NO JSX children allowed!) |
| **`<select>`** | `value={selectedId}` | `onChange={(e) => setSelectedId(e.target.value)}` | Single / Array for multi-select |

> [!IMPORTANT]
> **The Golden Rule of Value Synchronization:**  
> In a controlled input, every user-visible value transition must have a **well-defined path back into authoritative React State**. If that path is broken or lagged, the React engine will overwrite physical DOM edits and appear to "fight" the user.

---

# 🔬 LAYER 2 — Deep Mechanical Breakdown

## 1. Tracing Keystroke Synchronization Across Renders

```tsx
function UsernameField() {
  const [username, setUsername] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Current render snapshot is EMPTY ("")
    console.log('Render Snapshot:', username); 
    // 2. Physical DOM event carries the new character ("S")
    console.log('Event Value:', e.target.value); 
    // 3. Queue state update for Render #2
    setUsername(e.target.value); 
  };

  return <input value={username} onChange={handleChange} />;
}
```

```text
STEP-BY-STEP RECONCILIATION:
1. Render #1:  username = ""  ──► <input value="" /> committed to DOM
2. User types "S":  Browser fires input event ──► e.target.value = "S"
3. Handler runs:    handleChange reads username="" (snapshot), queues setUsername("S")
4. Render #2:  username = "S" ──► <input value="S" /> committed to DOM
5. User types "r":  Browser fires input event ──► e.target.value = "Sr"
6. Render #3:  username = "Sr" ──► <input value="Sr" /> committed to DOM
```

---

## 2. The 1-Keystroke Validation Lag Trap

A frequent mistake is running validation against the closure variable `email` right after calling `setEmail`:

```tsx
// ❌ BROKEN: Validation runs against the OLD snapshot!
function BadValidation() {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // DANGER: `email` here is still the previous render snapshot!
    setIsValid(email.includes('@')); 
  };

  return <input value={email} onChange={handleChange} />;
}
```

### The Two Senior Solutions:

```tsx
// ✅ SOLUTION A: Synchronously Derived Validation (Preferred)
function DerivedValidation() {
  const [email, setEmail] = useState('');
  
  // Pure derivation during render (Zero useEffect, Zero lag!)
  const isValid = email.includes('@') && email.endsWith('.com');

  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} />
      <span>{isValid ? 'Valid' : 'Invalid'}</span>
    </div>
  );
}

// ✅ SOLUTION B: Immediate Calculation from Event Value
function ImmediateValidation() {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value; // Authoritative incoming value
    setEmail(nextVal);
    setIsValid(nextVal.includes('@') && nextVal.endsWith('.com'));
  };

  return <input value={email} onChange={handleChange} />;
}
```

---

## 3. Formatting, Normalization & The Cursor Jumping Problem

When formatting phone numbers or currency (e.g. `1234` ➔ `(123) 4`), naively resetting `value` causes the browser caret to jump to the end of the input field:

```tsx
// ❌ NAIVE FORMATTER: Caret jumps to end on every keystroke
function PhoneInput() {
  const [phone, setPhone] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ''); // Strip non-digits
    const formatted = formatPhoneNumber(raw);      // Formats as (XXX) XXX-XXXX
    setPhone(formatted); // Browser resets selection cursor to end of string!
  };

  return <input value={phone} onChange={handleChange} />;
}
```

### Solution: Canonical State vs Display Model with Selection Mapping

```tsx
// ✅ PRODUCTION-GRADE: Caret Position Preservation
function PreservedPhoneInput() {
  const [rawDigits, setRawDigits] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const oldCursor = input.selectionStart ?? 0;
    const raw = input.value.replace(/\D/g, '').slice(0, 10);
    const formatted = formatPhoneNumber(raw);

    setRawDigits(raw);

    // Synchronously restore cursor position after layout commit
    requestAnimationFrame(() => {
      if (inputRef.current) {
        // Adjust caret based on added formatting characters (parentheses, spaces)
        inputRef.current.setSelectionRange(oldCursor, oldCursor);
      }
    });
  };

  return (
    <input 
      ref={inputRef} 
      value={formatPhoneNumber(rawDigits)} 
      onChange={handleChange} 
    />
  );
}
```

---

## 4. Why Input State Should Almost Always Be a String

Attempting to store numbers directly in state during active typing breaks valid intermediate editing states (such as typing `-` for negative numbers or clearing the field):

```tsx
// ❌ DANGEROUS: Numeric state destroys intermediate input
function NumericField() {
  const [amount, setAmount] = useState<number>(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // If user clears field ("") or types "-", Number(e.target.value) becomes 0 or NaN!
    setAmount(Number(e.target.value)); 
  };

  return <input type="number" value={amount} onChange={handleChange} />;
}

// ✅ CORRECT: Store string in state, parse to number at domain boundaries
function SafeNumericField({ onCommit }: { onCommit: (n: number) => void }) {
  const [amountStr, setAmountStr] = useState('0');

  return (
    <input 
      type="text" 
      value={amountStr} 
      onChange={(e) => setAmountStr(e.target.value)} 
      onBlur={() => {
        const parsed = parseFloat(amountStr);
        if (!isNaN(parsed)) onCommit(parsed);
      }}
    />
  );
}
```

---

## 5. The Controlled/Uncontrolled Lifecycle Flip Trap

```tsx
// ❌ FATAL ERROR: Controlledness flip warning
function FlakyInput({ initial }: { initial?: string }) {
  const [val, setVal] = useState(initial); // If initial is undefined, val = undefined!

  // Render #1: value={undefined} -> React registers as UNCONTROLLED!
  // Render #2: setVal("hello")   -> value={"hello"} -> 💥 WARNING: Component changing uncontrolled to controlled!
  return <input value={val} onChange={(e) => setVal(e.target.value)} />;
}

// ✅ FIX: Always provide a fallback empty string
function StableInput({ initial }: { initial?: string }) {
  const [val, setVal] = useState(initial ?? '');

  return <input value={val ?? ''} onChange={(e) => setVal(e.target.value)} />;
}
```

---

## 6. Draft State vs Committed Parent Value

When parent state holds a saved record and a child modal edits a draft:

```tsx
// ✅ DRAFT STATE ARCHITECTURE: Explicit separation of committed vs editing data
function UserProfileEditor({ savedBio, onSave }: { savedBio: string; onSave: (b: string) => void }) {
  const [draftBio, setDraftBio] = useState(savedBio); // Local editing draft

  const handleSave = () => {
    onSave(draftBio); // Commit draft to parent
  };

  const handleCancel = () => {
    setDraftBio(savedBio); // Revert draft back to parent state
  };

  return (
    <div>
      <textarea value={draftBio} onChange={(e) => setDraftBio(e.target.value)} />
      <button onClick={handleSave}>Save</button>
      <button onClick={handleCancel}>Cancel</button>
    </div>
  );
}
```

---

# 🧪 LAYER 3 — Diagnostic Labs & DevTools Profiling

## Diagnostic Lab: Controlledness & Caret Telemetry Probe

```tsx
export function ControllednessProbe() {
  const [text, setText] = useState('React Architecture');
  const [cursorPos, setCursorPos] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateTelemetry = () => {
    if (inputRef.current) {
      setCursorPos(inputRef.current.selectionStart);
    }
  };

  return (
    <div>
      <input 
        ref={inputRef} 
        value={text} 
        onChange={(e) => {
          setText(e.target.value);
          updateTelemetry();
        }}
        onKeyUp={updateTelemetry}
        onClick={updateTelemetry}
      />
      <p>Render Snapshot Value: <strong>"{text}"</strong></p>
      <p>Caret Position: <strong>{cursorPos}</strong></p>
    </div>
  );
}
```

---

# 🔥 LAYER 4 — The Crucible: Gauntlet Challenges & Runbooks

## Crucible Challenge Gauntlet

### Challenge 01: What does `console.log` print?
```tsx
const [val, setVal] = useState("A");
function onChange(e) {
  setVal(e.target.value);
  console.log(val, e.target.value);
}
```
**Scenario:** User types `"B"` after `"A"`.  
**Output:** `val: "A"`, `e.target.value: "AB"`.  
*Reasoning:* `val` is the snapshot from the current render closure; `e.target.value` is the incoming physical DOM payload.

### Challenge 02: Why does `type="checkbox"` not use `e.target.value`?
*Answer:* For checkboxes, `e.target.value` evaluates to `"on"` or the static HTML value string. Controlled checkboxes must use `checked={bool}` and read **`e.target.checked`**.

### Challenge 03: Why did formatting phone numbers jump the caret?
*Answer:* Replacing the string with new formatting characters (e.g. parentheses/spaces) causes React to re-assign `node.value`, resetting the browser caret offset to the end of the field unless explicitly restored via `setSelectionRange()`.

---

## 5 Production Incident Post-Mortems

1. **The Negative Number Lockout:** An expense form parsed `Number(e.target.value)` on every keystroke, making it impossible to type `-50` because typing `-` produced `NaN` and wiped the field.
2. **The Controlledness Warning Storm:** API data loaded asynchronously, causing inputs to mount with `value={undefined}` (uncontrolled) and then switch to `value="data"` on fetch completion.
3. **The Stale Password Confirm Bug:** A sign-up form validated `confirmPassword === password` inside the handler using the previous render's `password` state, throwing false mismatch errors.
4. **The Textarea Children Hazard:** A developer rendered `<textarea>{bio}</textarea>` instead of `<textarea value={bio} />`, resulting in React warnings and broken change synchronization.
5. **The Jump-To-End Currency Bug:** A pricing field formatted numbers with commas (`1,000,000`), forcing the user's cursor to the end on every intermediate edit.

---

## 🏆 Senior Architecture Decision Matrix

```text
                           VALUE SYNCHRONIZATION MATRIX
                                         │
                    What type of form control is being managed?
                                         │
     ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
     ▼                   ▼                               ▼                   ▼
TEXT / TEXTAREA      CHECKBOX                          SELECT             NUMERIC
───────────────     ──────────                       ──────────          ─────────
• value={str ?? ''} • checked={bool}                 • value={id}        • Store as string!
• e.target.value    • e.target.checked               • e.target.value    • Parse at onBlur/submit
• Caret preservation• (Never use e.target.value!)    • Multi: Array      • Handles "", "-", "0."
```

---

## 📋 40-Point KPI 08 Part 02 Checklist

- [x] Trace the 3 critical values: Render Snapshot vs Event Value vs Next State.
- [x] Eliminate 1-keystroke validation lag by deriving validity synchronously during render.
- [x] Handle specialized input types correctly (`checked` for checkboxes, `value` for textareas).
- [x] Preserve cursor selection offsets during real-time text formatting/masking.
- [x] Store numeric inputs as strings in state to accommodate intermediate editing tokens (`""`, `"-"`).
- [x] Prevent controlled/uncontrolled lifecycle warnings using fallback values (`value={val ?? ''}`).
- [x] Architect clean boundaries between parent committed values and child editing drafts.

---

[⬅️ Previous Part (01: Forms as State Ownership)](01-forms-as-state-ownership.md) | [📚 Level 06 Index](../README.md) | [🧪 Companion Lab](examples/02-controlled-inputs-and-value-synchronization.html) | [Next Part ➡️](03-input-events-change-semantics.md)
