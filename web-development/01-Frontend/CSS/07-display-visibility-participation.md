# KPI 7 — Display, Visibility & Element Participation

[⬅️ KPI 06 — Borders & Visual Geometry](./06-borders-outline-visual-geometry.md) | [📚 CSS Index](./README.md) | [KPI 08 — Flexbox ➡️](./08-flexbox.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Property / Value | Generates Box? | Occupies Layout Space? | Visible on Screen? | Receives Mouse/Touch Clicks? | Animatable with Transitions? |
|---|---|---|---|---|---|
| **`display: none`** | ❌ **No** | ❌ **No** ($0\text{px}$) | ❌ No | ❌ No | ❌ No (Binary snap) |
| **`visibility: hidden`**| ⚠️ **Yes** | ✅ **Yes** (Reserved space) | ❌ No | ❌ No | ✅ Yes (Delays visibility) |
| **`opacity: 0`** | ⚠️ **Yes** | ✅ **Yes** (Reserved space) | ❌ No (Transparent) | ⚠️ **YES (Blocks clicks!)** | ✅ Yes (Smooth 60 FPS fade) |
| **`pointer-events: none`**| Unchanged | Unchanged | Unchanged | ❌ **No (Clicks pass through)**| N/A |
| **`display: contents`** | ❌ **No (Children only)**| ❌ **No (Wrapper stripped)**| Child content only | Child content only | ❌ No |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: The Invisible Click-Trap & Smooth Transition Recipe
> 1. **The `opacity: 0` Phantom Barrier:**  
>    **Question:** *"Why do users complain that they cannot click underlying buttons after an animated modal or toast notification fades to `opacity: 0`?"*  
>    **Answer:** `opacity: 0` only alters the visual Alpha paint channel; the element's box **still occupies physical layout space and sits in the interactive hit-test tree**. It acts as an invisible glass wall intercepting all click and touch events!
>
> 2. **The Accessible 60 FPS Transition Recipe:**  
>    To smoothly animate an element out of view without blocking clicks and without layout thrashing, combine **`opacity`**, **`visibility`**, and **`pointer-events`**:
>    ```css
>    /* Closed State */
>    .modal {
>      opacity: 0;
>      visibility: hidden;
>      pointer-events: none;
>      transition: opacity 0.25s ease, visibility 0.25s ease;
>    }
>    /* Open State */
>    .modal.is-open {
>      opacity: 1;
>      visibility: visible;
>      pointer-events: auto;
>    }
>    ```
>    *Why this works:* `visibility: hidden` removes the element from keyboard focus order (Tab key) and screen reader accessibility trees while `pointer-events: none` lets mouse clicks pass through instantly!

---

## Overview
This document serves as the master engineering reference for the CSS `display` formatting engine, Block vs. Inline vs. Inline-Block box generation, DOM tree vs. Box tree dissociation (`display: contents`), the 3-Tier Rendering Engine separation (**Layout vs. Painting vs. Interaction**), and robust visual hiding strategies (`display: none`, `visibility: hidden`, `opacity: 0`, `pointer-events`).

---

## Goal & Central Architectural Question
By the end of KPI 7, you should stop treating elements as simple visual boxes and master **how elements participate across the browser's Layout, Paint, and Interaction trees**.

> **The Central Engineering Question:**  
> Does the element generate a principal box, occupy physical layout space, remain visible to sighted users, expose itself to the accessibility tree, and intercept pointer interactions?

---

## 🧭 Industry Frequency & Framework (Tailwind) Relevance

| Badge | Industry Frequency | Relevance in Tailwind / Modern Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of projects | `block`, `inline`, `inline-block`, `hidden` (`display: none`), `invisible`, `opacity-0`, `pointer-events-none` | Foundational for modal visibility, responsive breakpoints (`hidden md:block`), badges, and overlays. |
| 🟡 **Moderate** | Used in ~30% of layouts | `contents` (`display: contents`), `pointer-events-auto`, `visible` | Essential for subgrid wrappers, headless UI slot components, and custom dialogs. |
| 🔵 **Foundational** | Handled by layout engines | Inline formatting context vertical alignment math, baseline metrics | Critical for inline icon alignment, typography leading debugging, and browser internals. |

---

## Core Concepts (15 Subtopics)

### Part 1 — What is `display`? `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `block`, `inline`, `inline-block`, `flex`, `grid`, `hidden`.

#### Definition & Mechanics
The `display` property dictates **how an element generates boxes and participates in normal document flow**.

```css
span { display: block; } /* Converts an inline tag to generate a block formatting context */
div  { display: inline; } /* Converts a div to flow inline inside text */
```

```text
┌───────────────────────────────────────────────────────────┐
│              HTML Semantics ≠ CSS Display                 │
├─────────────────────────────┬─────────────────────────────┤
│ HTML SEMANTICS (DOM)        │ CSS DISPLAY (BOX TREE)      │
│ Meaning & Document Tree     │ Layout Geometry & Flow      │
│ e.g. <section>, <span>      │ e.g. block, flex, none      │
└─────────────────────────────┴─────────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: `display`
- **✅ When to Use:** Transform element formatting contexts (e.g. turning `<a>` into `block` or `inline-flex` for clickable buttons).
- **❌ Anti-Pattern:** Never change semantic HTML tags solely for default styling (e.g. using `<div>` when `<button>` or `<nav>` is required). Pick the correct semantic HTML tag, then style its `display` via CSS.

---

### Part 2 — `display: block` `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `block`.

#### Definition & Mechanics
A block-level element:
1. Begins on a **new line** in normal document flow.
2. Expands its `width: auto` to **fill the entire available inline space** of its containing block (absorbing padding and borders inside that space).
3. Respects explicit `width` and `height` declarations.

```css
.card {
  display: block;
  width: 100%;
}
```

```text
┌───────────────────────────────────────────────────────────┐
│ Block Box 1 (Fills available width, breaks to new line)   │
└───────────────────────────────────────────────────────────┘
┌───────────────────────────────────────────────────────────┐
│ Block Box 2 (Starts on a fresh line below Box 1)          │
└───────────────────────────────────────────────────────────┘
```

---

### Part 3 — `display: inline` `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `inline`.

#### Definition & Mechanics
An inline-level box:
1. Flows horizontally alongside text glyphs within an **Inline Formatting Context**.
2. Does **not** start on a new line.
3. Sized strictly by its internal text content.
4. **Explicit `width` and `height` are IGNORED** on non-replaced inline boxes (`<span>`, `<em>`, `<strong>`).
5. Vertical padding and margins (`padding-top`, `margin-bottom`) paint visually but **do NOT push surrounding lines apart**.

```css
/* ❌ Ineffective: width/height ignored on non-replaced inline */
span.tag {
  display: inline;
  width: 200px;  /* Has NO effect! */
  height: 50px;  /* Has NO effect! */
}
```

---

### Part 4 — `display: inline-block` `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `inline-block`.

#### Definition & Mechanics
Combines the horizontal flow of inline elements with the box-sizing capabilities of block containers:
- **Externally:** Flows inline with surrounding text without breaking to a new line.
- **Internally:** Behaves like a block container; respects explicit `width`, `height`, vertical padding, and vertical margins.

```css
.badge {
  display: inline-block;
  width: 120px;
  height: 32px;
  vertical-align: middle;
}
```

#### ⚖️ Senior Engineering Decision Matrix: `inline-block`
- **✅ When to Use:** Badges, tags, chips, and small inline widgets embedded directly within paragraphs of text.
- **⚠️ White-Space Gotcha:** Consecutive `inline-block` elements in HTML produce a visual $\approx 4\text{px}$ gap between them caused by HTML whitespace/carriage returns.
- **🚀 Modern Replacement:** Use `display: inline-flex` with `gap` to eliminate unwanted HTML whitespace gaps.

---

### Part 5 — Block vs. Inline vs. Inline-Block Comparison Matrix `🧭 [Comparison]`

| Characteristic | `display: block` | `display: inline` | `display: inline-block` |
|---|---|---|---|
| **Starts on New Line?** | ✅ Yes | ❌ No | ❌ No |
| **Flows Alongside Text?** | ❌ No | ✅ Yes | ✅ Yes |
| **Respects `width` / `height`?** | ✅ Yes | ❌ **No** | ✅ Yes |
| **Vertical Margins Push Content?** | ✅ Yes | ❌ **No** (Paints, but no layout push) | ✅ Yes |
| **Default Width** | `auto` (Fills available space) | Content-dependent | Content-dependent |
| **Primary Production Role** | Layout sections, cards, heroes | Text styling (`<span>`, `<strong>`) | Badges, tags, inline chips |

---

### Part 6 — `display: none` `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `hidden` (or `max-md:hidden`).

```text
┌───────────────────────────────────────────────────────────┐
│               display: none Lifecycle                     │
├───────────────────┬───────────────────┬───────────────────┤
│ 1. Box Generation │ ❌ NO BOX GENERATED                   │
│ 2. Layout Space   │ ❌ 0px (Surrounding layout collapses) │
│ 3. Painting       │ ❌ Unpainted                          │
│ 4. Accessibility  │ ❌ REMOVED from Accessibility Tree    │
│ 5. Interaction    │ ❌ Non-interactive                    │
└───────────────────┴───────────────────┴───────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: `display: none`
- **✅ When to Use:** Responsive breakpoint switching (`className="hidden md:block"`), fully closed accordion panels, and elements that should be completely invisible to screen readers.
- **❌ When NOT to Use for Fade Animations:** `display: none` cannot be interpolated by CSS transitions (it snaps abruptly from 0 to 1).

---

### Part 7 — `visibility: hidden` `🟡 [Moderate]`
> **Tailwind Equivalent:** `invisible` (vs. `visible`).

```text
┌────────────┐
│ Box 1      │
└────────────┘
┌ ─ ─ ─ ─ ─ ─┐
  Empty Slot   ◄── Box 2 (visibility: hidden) STILL RESERVES FULL LAYOUT SPACE
└ ─ ─ ─ ─ ─ ─┘
┌────────────┐
│ Box 3      │
└────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: `visibility: hidden`
- **✅ When to Use:** When an element should disappear **without causing surrounding layout to shift or collapse** (e.g. hiding a table cell icon while preserving column alignment).
- **🚀 Accessibility Leverage:** Unlike `opacity: 0`, `visibility: hidden` **removes the element from the accessibility/Tab order**, preventing keyboard focus traps on invisible items.

---

### Part 8 — `opacity: 0` & Pointer Interception Hazards `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `opacity-0` (vs. `opacity-100`).

```css
.invisible-barrier {
  opacity: 0; /* Fully transparent, BUT STILL OCCUPIES SPACE & BLOCKS CLICKS! */
}
```

#### ⚖️ Senior Engineering Decision Matrix: `opacity: 0`
- **✅ When to Use:** 60 FPS GPU-accelerated fade-in/fade-out animations.
- **❌ The Critical Anti-Pattern:** Leaving `opacity: 0` active on a full-screen overlay without disabling pointer events. The invisible overlay blocks all user clicks to underlying buttons.
- **🚀 Mandatory Companion:** Always pair with `pointer-events: none;` and `visibility: hidden`.

---

### Part 9 — The Master 3-Way Visibility Matrix `🧭 [Comparison]`

| Dimension | `display: none` | `visibility: hidden` | `opacity: 0` |
|---|---|---|---|
| **Box Generation** | ❌ None | ✅ Yes | ✅ Yes |
| **Occupies Space** | ❌ No ($0\text{px}$) | ✅ Yes (Reserves geometric slot) | ✅ Yes (Reserves geometric slot) |
| **Painted on Screen** | ❌ No | ❌ No | ❌ No (Transparent) |
| **Blocks Pointer Clicks** | ❌ No | ❌ No | ⚠️ **YES (Click Trap)** |
| **Included in A11y Tree** | ❌ No | ❌ No | ⚠️ **YES (Focus Trap)** |
| **CSS Transitionable** | ❌ No | ✅ Yes (Step transition) | ✅ **Yes (Smooth float)** |

---

### Part 10 — `pointer-events: none` `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `pointer-events-none` (vs. `pointer-events-auto`).

#### Definition & Mechanics
Controls whether an element can be the target of mouse, pen, or touch interaction events.

```css
.badge-overlay {
  pointer-events: none; /* Clicks pass straight through to underlying card! */
}
```
*Rule:* `pointer-events: none` alters **interaction dispatch only**; it does not hide the element or affect box layout.

---

### Parts 11 & 12 — `display: contents` (DOM vs. Box Tree) `🟡 [Moderate]`
> **Tailwind Equivalent:** `contents`.

#### Definition & Mechanics
Instructs the browser **not to generate a principal box for the container**, while its children render directly into the parent layout:

```html
<div class="grid-container">
  <div class="wrapper"> <!-- display: contents strips this box! -->
    <div class="item">Item 1</div>
    <div class="item">Item 2</div>
  </div>
</div>
```

```text
[ DOM Tree Hierarchy ]                [ Rendered Box Tree ]
.grid-container                        .grid-container
  └── .wrapper (display: contents)       ├── .item (Item 1)
        ├── .item (Item 1)               └── .item (Item 2)
        └── .item (Item 2)
```

#### ⚖️ Senior Engineering Decision Matrix: `display: contents`
- **✅ When to Use:** In CSS Grid / Flexbox layouts where semantic HTML grouping (`<form>`, `<fieldset>`, `<section>`) is required, but you need child inputs to participate directly in the outer grid tracks.
- **❌ Anti-Pattern:** Setting `background`, `padding`, or `border` on a `display: contents` element—**they are completely stripped and will not paint!**
- **⚠️ Accessibility Warning:** Historically, certain browser engines dropped `<button>` and `<ul>` accessibility roles when styled with `display: contents`. Use on purely generic `<div>` wrappers only.

---

### Part 13 — The 3-Tier Rendering Engine Separation `🔵 [Foundational]`

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     BROWSER ENGINE SEPARATION                          │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. LAYOUT TIER    │ 2. PAINT TIER     │ 3. INTERACTION TIER            │
│ Box Geometry,     │ Rasterization,    │ Hit-Testing, Event Dispatch,   │
│ Dimensions, Flow  │ Pixels, Colors    │ Pointer Clicks, Tab Focus      │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ display: block    │ opacity: 0        │ pointer-events: none           │
│ display: none     │ visibility: hidden│ focus-visible                  │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

### Part 14 — Production Architecture: The Accessible Animated Modal `🟢 [Daily Driver]`

```css
.modal-backdrop {
  /* 1. Closed State Defaults */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;

  /* 2. Transition configuration */
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              visibility 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-backdrop.is-open {
  /* 3. Open State Activation */
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
```

---

### Part 15 — Senior Hiding Decision Framework `🧭 [Decision Tree]`

```text
Need to Hide an Element?
        │
        ├─► Should it collapse and free up layout space?
        │     ├─► Yes, permanent/responsive toggle ──────► display: none (Tailwind: hidden)
        │     └─► No, preserve empty layout geometry ────► visibility: hidden (Tailwind: invisible)
        │
        ├─► Does it need a smooth 60fps fade animation?
        │     └── Yes ───────────────────────────────────► opacity: 0 + visibility: hidden + pointer-events: none
        │
        └─► Is it a semantic wrapper breaking a Grid? ──► display: contents (Tailwind: contents)
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### 1. The Headless Animated Dropdown Transition
```tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export function ActionMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg bg-slate-800 text-white font-medium"
      >
        Options ▾
      </button>

      {/* Accessible Non-Click-Trapping Animated Dropdown */}
      <div
        className={cn(
          'absolute right-0 mt-2 w-48 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl transition-all duration-200 ease-out',
          isOpen
            ? 'opacity-100 visible pointer-events-auto translate-y-0 scale-100'
            : 'opacity-0 invisible pointer-events-none -translate-y-2 scale-95'
        )}
      >
        <button className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg">
          Edit Profile
        </button>
        <button className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-950/40 rounded-lg">
          Delete Account
        </button>
      </div>
    </div>
  );
}
```

---

### 2. The `<Slot>` / `display: contents` Radix UI Pattern
In component libraries (such as Radix UI and Shadcn UI), `display: contents` is often used on headless wrappers when passing props to children without introducing extra visual DOM nodes that would disrupt CSS Grid column alignment:

```tsx
export function GridWrapper({ children }: { children: React.ReactNode }) {
  // Strips wrapper box while keeping React context/tree intact
  return <div className="contents">{children}</div>;
}
```

---

## 🧠 KPI 7 — Complete Integrated Theory Challenge & Step-by-Step Solutions

### Questions 1–7: Block, Inline & Inline-Block Mechanics

**Task / Questions:**
1. What does the `display` property fundamentally control?
2. What is the difference between HTML semantics and CSS display behavior? Give an example using a `<div>` or `<span>`.
3. Explain the general behavior of `display: block;`. Do not simply say "it takes the full width."
4. Explain the general behavior of `display: inline;`. How does it participate in layout?
5. Why might setting `width: 300px; height: 100px;` on `span { display: inline; }` not behave as expected?
6. What problem does `display: inline-block;` solve? Explain how it combines inline and block behavior.
7. Compare `display: block`, `display: inline`, and `display: inline-block` in terms of new-line behavior, width/height behavior, and layout participation.

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 1–7)</summary>

1. **Fundamental Role of `display`:** Controls **box generation and formatting context participation**—how an element creates boxes in the box tree and how it arranges its children and interacts with siblings.
2. **Semantics vs. Display:**
   - *HTML Semantics:* Dictates document meaning and accessibility roles (e.g. `<span>` means inline phrasing text; `<div>` means generic grouping).
   - *CSS Display:* Dictates visual rendering geometry. Setting `span { display: block; }` turns the span into a block formatting box on screen without changing its underlying HTML semantic meaning.
3. **`display: block` Mechanics:** Starts on a new line in normal flow; with `width: auto`, it expands to fill available inline space across its containing block; fully honors explicit `width`, `height`, padding, and margins.
4. **`display: inline` Mechanics:** Participates inside an inline formatting line alongside text glyphs; does not break onto a new line; dimensions are strictly driven by content.
5. **Why `width`/`height` Fails on Inline:** The CSS specification dictates that explicit `width` and `height` properties do **not apply to non-replaced inline boxes**. They only size according to internal text metrics and font glyphs.
6. **`inline-block` Role:** Solves the need for **inline horizontal flow with explicit box dimensions**. It flows inline alongside text without forcing a line break, while internally behaving like a block box that respects `width`, `height`, and vertical margins.
7. **Three-Way Comparison:**
   - *`block`:* Breaks to new line; respects width/height; fills available inline width.
   - *`inline`:* No line break; ignores width/height; sized by text content.
   - *`inline-block`:* No line break; respects width/height; sized by content by default.
</details>

---

### Questions 8–13: Hiding Strategies & Visibility Mechanics

**Task / Questions:**
8. What happens to an element when `display: none;` is applied? Explain box generation, layout space, visibility, and interaction.
9. What is the difference between `display: none;` and `visibility: hidden;`?
10. An element has `opacity: 0;`. Is it removed from layout? Can it still block clicks? Explain why.
11. What does `pointer-events: none;` do? Does it remove, hide, or alter layout space?
12. Why can the combination `opacity: 0; pointer-events: none;` be useful?
13. Compare `display: none`, `visibility: hidden`, `opacity: 0`, and `pointer-events: none` across Layout, Painting, and Interaction.

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 8–13)</summary>

8. **`display: none` Effects:**
   - *Box Generation:* No box generated in the box tree.
   - *Layout Space:* $0\text{px}$ (surrounding content collapses into the space).
   - *Visibility:* Unpainted.
   - *Interaction:* Non-interactive (removed from hit-test and accessibility trees).
9. **`display: none` vs `visibility: hidden`:**
   - `display: none` collapses and eliminates layout space.
   - `visibility: hidden` **preserves the element's layout geometry**, keeping an empty blank space in the page flow while hiding the paint layer.
10. **`opacity: 0` Behavior:** It is **NOT** removed from layout (occupies full space). **Yes, it blocks clicks** because `opacity` only alters the alpha paint channel; the element remains active in the browser's hit-testing tree.
11. **`pointer-events: none` Behavior:** It disables mouse/touch event targeting on the element, allowing clicks to pass through. It does **not** remove the element, does **not** hide it visually, and does **not** alter layout space.
12. **Why Combine `opacity: 0` + `pointer-events: none`:** Allows smooth 60fps CSS opacity transitions while preventing the invisible element from creating an accidental "click barrier" over underlying UI controls.
13. **Comprehensive 4-Way Comparison:**
    - *`display: none`:* Layout: ❌ None | Paint: ❌ None | Interaction: ❌ None.
    - *`visibility: hidden`:* Layout: ✅ Reserved | Paint: ❌ None | Interaction: ❌ Disabled.
    - *`opacity: 0`:* Layout: ✅ Reserved | Paint: ❌ Transparent | Interaction: ⚠️ **Active**.
    - *`pointer-events: none`:* Layout: Unchanged | Paint: Unchanged | Interaction: ❌ **Disabled**.
</details>

---

### Questions 14–19: `display: contents`, Overlays & Transitions

**Task / Questions:**
14. What does `display: contents;` do? Explain the difference between the DOM tree and the box tree.
15. Does `display: contents;` remove `.wrapper` from the DOM? Explain precisely.
16. Why might `display: contents; background: red; padding: 20px; border: 2px solid black;` be problematic?
17. You create an invisible overlay with `opacity: 0;`. Users complain they cannot click buttons behind it. Explain the likely reason.
18. How would you modify the overlay so that when invisible it does not block pointer interaction?
19. Why is `opacity` commonly useful for animations compared with immediately using `display: none`?

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 14–19)</summary>

14. **`display: contents` Mechanics:** Strips the principal box of the container from the **Box Tree**, causing child elements to render directly in the parent container layout. The **DOM Tree remains completely intact** with all parent-child JavaScript relationships preserved.
15. **Removes from DOM?** **No.** The `.wrapper` node still exists in the HTML DOM tree, can be queried with `document.querySelector`, and still receives event bubbling. Only its rendered CSS box is removed.
16. **Problem with Styling `display: contents`:** Because no principal box is generated, **`background`, `padding`, and `border` are completely stripped and will not paint on screen**, making those CSS declarations totally useless.
17. **Overlay Click Barrier Cause:** `opacity: 0` makes pixels transparent but does not remove the element from the hit-test tree; the overlay physically covers the underlying buttons and intercepts all click events.
18. **Fix:** Add `pointer-events: none;` (and `visibility: hidden;`) to the invisible state.
19. **Why `opacity` for Animations:** `opacity` is a numeric continuous float ($0.0 \rightarrow 1.0$) that the browser compositor can interpolate smoothly at 60/120 FPS on the GPU. `display` is a discrete binary keyword (`none` vs `block`) that cannot be smoothly transitioned.
</details>

---

### Questions 20–22: Senior Architecture & Production Decisions

**Task / Questions:**
20. A notification should temporarily disappear, but surrounding layout must **not move**. Would you prefer `display: none;` or `visibility: hidden;`? Why?
21. A modal should fade in/out, not block clicks when hidden, and become interactive when visible. Describe an appropriate CSS state strategy using `opacity`, `visibility`, and `pointer-events`.
22. **Final Production Scenario:** You have a reusable card component:
    ```html
    <div class="card">
      <div class="card-header"><h2>Title</h2></div>
      <div class="card-body"><p>Content</p></div>
      <div class="dropdown">Menu</div>
    </div>
    ```
    - Decide whether `display: contents` is appropriate for `.card-header`.
    - Describe the closed/open state strategy for `.dropdown` to fade smoothly without blocking card clicks when closed.

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 20–22)</summary>

20. **Notification Decision:** Use **`visibility: hidden;`**. It preserves the exact geometric height and width of the notification slot, preventing surrounding content from jumping or jittering.
21. **Modal State Blueprint:**
    - *Closed State:* `opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.3s, visibility 0.3s;`
    - *Open State (`.is-open`):* `opacity: 1; visibility: visible; pointer-events: auto;`
22. **Final Production Architectural Decisions:**
    1. *`display: contents` on `.card-header`:* **Inappropriate / Not Recommended** if `.card-header` requires padding, background borders, or border-bottom divider lines. Use normal `display: block` (or `display: flex`). Only use `display: contents` if the card is a CSS Grid and `<h2>` needs to align directly to parent grid tracks.
    2. *Dropdown Closed State:*
       ```css
       .dropdown {
         opacity: 0;
         visibility: hidden;
         pointer-events: none;
         transform: translateY(-8px);
         transition: opacity 0.2s ease, visibility 0.2s ease, transform 0.2s ease;
       }
       ```
    3. *Dropdown Open State:*
       ```css
       .dropdown.is-open {
         opacity: 1;
         visibility: visible;
         pointer-events: auto;
         transform: translateY(0);
       }
       ```
    4. *Reasoning:* Ensures the closed dropdown leaves card content 100% clickable, hides the dropdown from keyboard screen readers, and animates with high-performance GPU transforms.
</details>

---

## Key Takeaways
1. **Never rely on `opacity: 0` alone:** Always pair with `pointer-events: none` and `visibility: hidden` to prevent invisible click barriers.
2. **`display: none` for structural removal:** Eliminates layout space and removes the node from accessibility trees.
3. **`visibility: hidden` for slot preservation:** Hides pixels while locking layout geometry in place.
4. **`display: contents` strips box geometry only:** Keeps the DOM tree intact while removing parent box wrappers.
5. **Inline boxes ignore explicit width/height:** Use `inline-block` or `inline-flex` for sized chips and badges.

---

[⬅️ KPI 06 — Borders & Visual Geometry](./06-borders-outline-visual-geometry.md) | [📚 CSS Index](./README.md) | [KPI 08 — Flexbox ➡️](./08-flexbox.md)
