# KPI 6 — Borders, Outline, Border Radius & CSS Visual Geometry

[⬅️ KPI 05 — Colors & Backgrounds](./05-colors-backgrounds-visual-effects.md) | [📚 CSS Index](./README.md) | [KPI 07 — Display & Visibility ➡️](./07-display-visibility-participation.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Property / Concept | Box Model Impact | Syntax / Value Example | Senior Production Best Practice |
|---|---|---|---|
| **`border`** | ⚠️ **Yes** (Consumes layout space) | `border: 1.5px solid #e2e8f0;` | Always pair with `box-sizing: border-box` to avoid layout blowout. |
| **`outline`** | 🚀 **No** (Zero layout shift) | `outline: 2px solid #3b82f6;` | **Mandatory for accessibility**: Never remove outline without `:focus-visible` replacement. |
| **`outline-offset`** | 🚀 **No** (Floating ring) | `outline-offset: 2px;` | Creates clean floating focus rings that do not obscure button text/borders. |
| **`border-radius`** | ⚠️ Affects paint boundary | `border-radius: 8px;` | Pill buttons: `border-radius: 9999px`; Perfect circles: `aspect-ratio: 1/1; border-radius: 50%;`. |
| **Logical Borders** | ⚠️ **Yes** (i18n-ready) | `border-inline-start: 4px solid blue;` | Replaces `border-left` to automatically mirror in RTL languages (Arabic, Hebrew). |
| **Rounded Image Clipping** | ⚠️ Overflow interaction | `rounded-t-2xl overflow-hidden` (Child) | **Avoid `overflow: hidden` on parent cards** if card contains dropdowns/tooltips. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: The `border:hover` Layout Shift & `overflow:hidden` Trap
> 1. **The `:hover` Border Shift Trap:**  
>    **Question:** *"Why does adding `border: 2px solid blue` on button `:hover` cause surrounding UI cards to jump and vibrate?"*  
>    **Answer:** Adding a border on hover increases the element's physical border-box size by $4\text{px}$ horizontally and vertically, forcing the browser to trigger a full **Layout Reflow**.  
>    **Fix:** Declare an invisible border by default (`border: 2px solid transparent`) or use `outline` / `box-shadow: 0 0 0 2px blue;` which paints in the Compositor thread without altering box-model geometry!
>
> 2. **The `overflow: hidden` Dropdown Severance Trap:**  
>    **Question:** *"Why did adding `overflow: hidden` to clip a card's rounded header image break the card's action menu dropdown?"*  
>    **Answer:** `overflow: hidden` clips **all** descendants extending beyond the border-box. An absolute/fixed dropdown menu positioned at the bottom edge gets chopped in half!  
>    **Fix:** Apply `border-radius` directly to the top `<img className="rounded-t-2xl">` child instead of setting `overflow: hidden` on the outer card container.

---

## Overview
This document serves as the master engineering reference for CSS Element Boundaries, Box Model Border Calculations, Border Styles, Logical Bidirectional Borders (`border-inline-start`), Corner Geometry (`border-radius`, elliptical radii, pill vs circular math), Accessibility Focus Indicators (`outline`, `outline-offset`, `:focus-visible`), Border vs Outline comparative mechanics, and Overflow Clipping Strategies.

---

## Goal & Central Architectural Question
By the end of KPI 6, you should understand **how CSS establishes visual boundaries and geometric shapes without breaking page layout or accessibility**.

> **The Central Engineering Question:**  
> Does this visual boundary need to occupy physical layout space (Border) or float above the canvas without reflow (Outline/Shadow), and how do we round element geometry without inadvertently severing dropdowns, tooltips, or focus indicators?

---

## 🧭 Industry Frequency & Framework (Tailwind) Relevance

| Badge | Industry Frequency | Relevance in Tailwind / Modern Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of projects | `border-*`, `rounded-*`, `outline-*`, `focus-visible:ring-*`, `border-b` | Foundational for every button, input, card, badge, avatar, and divider. |
| 🟡 **Moderate** | Used in ~30% of layouts | `border-inline-start`, `outline-offset-*`, `rounded-t-*`, `rounded-full` | Crucial for internationalized side-borders, floating focus rings, and pill badges. |
| 🔵 **Foundational** | Rarely configured manually | `border-image`, elliptical radius (`50% / 30%`), `border-style: double` | Useful for specialized canvas graphics, decorative badges, and technical interviews. |

---

## Core Concepts (16 Subtopics)

### Part 1 — The `border` Property & Box Model Mechanics `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `border`, `border-2`, `border-slate-200`.

#### Definition & Mechanics
A `border` is the visible line surrounding an element's padding and content.

```css
/* Shorthand: [width] [style] [color] */
.card {
  border: 2px solid #0f172a;
}
```

```text
┌───────────────────────────────────────────────┐ ── Margin Area
│  ┌─────────────────────────────────────────┐  │ ── BORDER AREA (Consumes Layout Space)
│  │  ┌───────────────────────────────────┐  │  │ ── Padding Area
│  │  │  ┌─────────────────────────────┐  │  │  │ ── Content Area
│  │  │  │ Text / Child Content        │  │  │  │
│  │  │  └─────────────────────────────┘  │  │  │
│  │  └───────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: `border`
- **✅ When to Use:** Structural component outlines, card perimeters, input field boundaries, and table gridlines.
- **❌ When NOT to Add on `:hover` Dynamically:** Never introduce a border on `:hover` from `border: 0`—it causes jarring layout shifts ($2\text{px}\text{--}4\text{px}$ jump).
- **🚀 The Senior Leverage:** Set `border: 1px solid transparent;` on the base state, and simply change `border-color: #3b82f6;` on `:hover` for $0\text{ms}$ zero-layout-shift transitions.

---

### Part 2 — Border Styles `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `border-solid`, `border-dashed`, `border-dotted`, `border-double`, `border-none`.

| Style | Rendering Characteristic | Common Production Role |
|---|---|---|
| **`solid`** | Single continuous unbroken stroke | Standard for 99% of UI cards, inputs, and buttons. |
| **`dashed`** | Series of rectangular dashes | File upload dropzones, coupon vouchers, drag-and-drop targets. |
| **`dotted`** | Series of round dots | Subtle inline footnote indicators, secondary dividers. |
| **`double`** | Two parallel solid lines (requires $\ge 3\text{px}$) | Editorial borders, formal certificates, vintage styling. |
| **`none` / `hidden`** | No border rendered (0px) | Stripping default browser button/input borders. |

---

### Part 3 — Individual Borders & Directional Dividers `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `border-t`, `border-b`, `border-l`, `border-r`, `divide-y`.

```css
.list-item {
  border-bottom: 1px solid #e2e8f0; /* Crisp 1px hairline divider */
}
```

#### ⚖️ Senior Engineering Decision Matrix: Directional Borders
- **✅ When to Use:** List separators, sticky header bottom borders (`border-b`), and active navigation tab underlines.
- **🚀 Modern Leverage:** In Flex/Grid lists, use Tailwind's `divide-y divide-slate-200` to automatically apply borders between children without styling `:last-child` manually.

---

### Part 4 — Logical Border Properties (i18n / Bi-directional) `🟡 [Moderate]`
> **Tailwind Equivalent:** `border-s-4` (`border-inline-start`), `border-e-4` (`border-inline-end`).

```css
/* Physical (Hardcoded to left edge) */
.callout { border-left: 4px solid #3b82f6; }

/* Logical (Adapts to writing direction) */
.callout { border-inline-start: 4px solid #3b82f6; }
```

```text
LTR Mode (English):
┌───┬───────────────────────────────────────────┐
│ █ │ Left-side accent bar                      │
└───┴───────────────────────────────────────────┘

RTL Mode (Arabic / Hebrew):
┌───────────────────────────────────────────┬───┐
│ Right-side accent bar (Auto-mirrored!)    │ █ │
└───────────────────────────────────────────┴───┘
```

#### ⚖️ Senior Engineering Decision Matrix: Logical Properties
- **✅ When to Use:** Always use `border-inline-start` for callout accents, quote bars, and navigation active indicators in internationalized (i18n) codebases.

---

### Part 5 — `border-radius` (Corner Curvature Geometry) `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `rounded-none`, `rounded-sm` (2px), `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px).

#### 4-Corner Shorthand Order
Clockwise starting from **Top-Left**:
$$\text{Top-Left} \longrightarrow \text{Top-Right} \longrightarrow \text{Bottom-Right} \longrightarrow \text{Bottom-Left}$$

```css
.card {
  border-radius: 16px 16px 0 0; /* Rounded top corners only */
}
```

---

### Parts 6 & 7 — Percentage vs. Elliptical Border Radius `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `rounded-full` (9999px).

```css
/* Perfect Circle (Requires equal square width/height) */
.avatar-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
}

/* Elliptical Curvature (Rectangular container) */
.ellipse-badge {
  width: 200px;
  height: 100px;
  border-radius: 50%; /* Radii: 100px horizontal / 50px vertical -> Ellipse! */
}

/* Pill Shape (The Senior Standard) */
.pill-button {
  border-radius: 9999px; /* Automatically caps at half the minor axis */
}
```

#### ⚖️ Senior Engineering Decision Matrix: Rounding Geometries
- **✅ When to Use `border-radius: 50%`:** Avatars and circular icon buttons **with locked $1:1$ aspect ratio** (`aspect-square`).
- **✅ When to Use `border-radius: 9999px`:** Dynamic text pills, badges, and tags. Regardless of text length, `9999px` guarantees a perfect capsule/pill shape with flat top/bottom edges and half-circle ends without distorting into an ellipse.

---

### Parts 8, 9 & 10 — `outline`, Accessibility, and `outline-offset` `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `outline`, `outline-2`, `outline-offset-2`, `focus-visible:outline-blue-600`.

#### Definition & Mechanics
An `outline` is a visible stroke drawn outside the border-box that **occupies ZERO space in the CSS box model**.

```css
button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px; /* Leaves a 2px breathing gap around the button */
}
```

```text
┌───────────────────────────────────────────────┐ ── Outline Stroke (0px Layout Space)
│   ◄─── 2px outline-offset (Transparent Gap)   │
│  ┌─────────────────────────────────────────┐  │
│  │ [ Save Changes Button ]                 │  │ ── Button Border-Box
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: Outlines
- **✅ When to Use `:focus-visible`:** Keyboard focus states. It only shows outlines during keyboard tab navigation, avoiding distracting mouse-click rings.
- **❌ When NOT to Write `outline: none` or `outline: 0`:** Stripping outlines without providing an equally high-contrast focus indicator is a direct **WCAG 2.1 Failure (Criterion 2.4.7 Focus Visible)** and prevents keyboard-only users from navigating.
- **🚀 The Senior Leverage:** Use `outline-offset: 2px` or `4px` so dark focus rings do not overlap dark button borders or clip button text.

---

### Part 11 — Complete Border vs. Outline Architectural Matrix `🧭 [Comparison]`

| Dimension / Behavior | `border` | `outline` |
|---|---|---|
| **Box Model Participation** | ✅ Part of box model geometry | ❌ Excluded (0 layout space) |
| **Causes Layout Reflow** | ⚠️ Yes (if dynamically added/resized) | 🚀 No (Paints on compositor) |
| **Independent Sides** | ✅ Yes (`border-top`, `border-left`) | ❌ No (Renders around entire perimeter) |
| **Floating Gap Support** | ❌ No | ✅ Yes (via `outline-offset`) |
| **Primary Architecture Role** | Permanent component structure & dividers | Interactive accessibility focus rings |

---

### Part 12 — `border-radius` and Overflow Clipping Traps `🟢 [Daily Driver]`

```text
THE DROPDOWN SEVERANCE BUG:
┌───────────────────────────────────────────┐ ── Card Container (border-radius: 16px)
│ Card Header (Image rounded)               │
│                                           │
│ [ More Options ▾ ]                        │
│ ┌───────────────────────┐                 │
│ │ Edit Profile          │                 │
│ ├───────────────────────┤                 │
│ │ Share Link            │                 │
├─┴───────────────────────┴─────────────────┤ ◄── overflow: hidden CH भू CHOPPED OFF HERE!
  │ Delete Account (Invisible / Broken)     │
  └─────────────────────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: Clipping
- **❌ Anti-Pattern:** Setting `overflow: hidden` on a parent `.card` just to round the corners of a top banner image. This silently severs all absolute dropdowns, tooltip popovers, and focus rings that spill outside the card!
- **🚀 The Senior Solution:** Round the child image explicitly:
  ```html
  <div class="card rounded-2xl border bg-slate-900">
    <img class="rounded-t-2xl w-full object-cover" src="/hero.jpg" />
    <div class="p-6">{/* Dropdowns and popovers can now safely escape! */}</div>
  </div>
  ```

---

### Part 13 — Rounded UI Component Archetypes `🟢 [Daily Driver]`
1. **The Modern Card:** `border-radius: 16px;` (`rounded-2xl`).
2. **The Form Input / Standard Button:** `border-radius: 8px;` (`rounded-lg`).
3. **The Status Tag / Capsule Badge:** `border-radius: 9999px;` (`rounded-full`).
4. **The User Profile Avatar:** `aspect-ratio: 1/1; border-radius: 50%; object-fit: cover;`.

---

### Part 14 — `box-sizing` Interaction with Borders `🟢 [Daily Driver]`
Under standard `box-sizing: border-box`, declaring `width: 300px; border: 10px solid black;` keeps the total rendered width at **strictly $300\text{px}$** by shrinking the internal content width to $280\text{px}$.

---

### Part 15 — `border-image` `🔵 [Foundational]`
Allows an image or procedural gradient to act as the border stroke:
```css
.gradient-border-card {
  border: 4px solid transparent;
  border-image: linear-gradient(to right, #3b82f6, #ec4899) 1;
}
```
*Note:* `border-image` does not respect `border-radius` in standard CSS without complex SVG masks or `background-clip: padding-box, border-box` tricks.

---

### Part 16 — Senior Visual Geometry Decision Framework `🧭 [Decision Tree]`

```text
Adding a Boundary or Shape?
        │
        ├─► Is it a permanent UI divider or card edge? ──► Use border with box-sizing: border-box
        ├─► Is it a keyboard focus indicator? ───────────► Use :focus-visible { outline: 2px solid; outline-offset: 2px; }
        ├─► Is it a pill or badge with dynamic text? ────► Use border-radius: 9999px (NOT 50%)
        ├─► Is it a circular avatar? ────────────────────► Use aspect-square + border-radius: 50% + object-cover
        ├─► Need a side accent in an i18n app? ──────────► Use border-inline-start (NOT border-left)
        └─► Rounding a card with a top image? ───────────► Apply rounded-t-2xl directly to <img> (NEVER overflow:hidden on card)
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### 1. Bulletproof Design System Focus-Visible Ring
```tsx
import React from 'react';
import { cn } from '@/lib/utils';

export const focusRingStyles = 
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

export function Button({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium bg-blue-600 text-white transition-all',
        focusRingStyles,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

### 2. Dropdown-Safe Rounded Card with Top Image
```tsx
export function SafeMediaCard({ title, imageUrl }: { title: string; imageUrl: string }) {
  return (
    // Note: NO overflow-hidden on outer card, allowing dropdowns to escape!
    <div className="relative rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
      {/* Explicitly round top corners on image child */}
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-48 rounded-t-2xl object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {/* Dropdown Menu Component can safely overflow without clipping */}
      </div>
    </div>
  );
}
```

---

## 🧠 KPI 6 — Complete Integrated Theory Challenge & Step-by-Step Solutions

### Questions 1–7: Borders & Radius Math

**Task / Questions:**
1. What are the three components of `border: 3px dashed red;`?
2. Explain the difference between `border: 2px solid black;` and `outline: 2px solid black;` specifically in terms of the CSS box model and layout space.
3. An element has `width: 300px; border-left: 10px solid; border-right: 10px solid;`. Assuming `box-sizing: content-box`, what is the total rendered width excluding margins?
4. Now assume `box-sizing: border-box`. What is the total rendered width?
5. What happens if you use `border-radius: 50%;` on a $200\text{px} \times 200\text{px}$ box vs a $300\text{px} \times 200\text{px}$ box? Explain why the results differ.
6. What is the corner order in `border-radius: 10px 20px 30px 40px;`?
7. What does the syntax `border-radius: 50% / 30%;` mean?

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 1–7)</summary>

1. **Border Components:**
   - `3px`: `border-width`
   - `dashed`: `border-style`
   - `red`: `border-color`
2. **Border vs. Outline (Box Model):**
   - `border`: Fully participates in the CSS box model, consumes physical layout space, and contributes to the element's total rendered dimensions.
   - `outline`: Rendered outside the box model, consumes **$0\text{px}$ layout space**, and causes zero layout reflow to surrounding siblings.
3. **`content-box` Calculation:**
   $$\text{Rendered Width} = 300\text{ (content)} + 10\text{ (left border)} + 10\text{ (right border)} = \mathbf{320px}$$
4. **`border-box` Calculation:**
   $$\text{Rendered Width} = \mathbf{300px}\quad (\text{Internal content shrinks to } 300 - 20 = 280\text{px})$$
5. **Square vs. Rectangle `border-radius: 50%`:**
   - On $200\text{px} \times 200\text{px}$ (square): The $50\%$ radius calculates to $100\text{px}$ horizontally and $100\text{px}$ vertically. Because both radii are equal, it creates a **perfect circle**.
   - On $300\text{px} \times 200\text{px}$ (rectangle): The horizontal radius is $150\text{px}$ while the vertical radius is $100\text{px}$. Because the two axes are unequal, it creates an **ellipse**.
6. **Corner Order:** Clockwise starting from top-left:
   - `10px` = Top-Left
   - `20px` = Top-Right
   - `30px` = Bottom-Right
   - `40px` = Bottom-Left
7. **`50% / 30%` Elliptical Syntax:** Specifies separate horizontal and vertical radii across all corners: **$50\%$ horizontal radius** and **$30\%$ vertical radius**.
</details>

---

### Questions 8–13: Outline, Accessibility & Overflow

**Task / Questions:**
8. Why might `button { outline: none; }` be dangerous?
9. Why is `button:focus-visible { outline: 3px solid blue; outline-offset: 4px; }` generally safer? Explain the role of both `focus-visible` and `outline-offset`.
10. Does an outline take up layout space? If not, explain what happens to surrounding elements when an outline is added.
11. You have a `.card` with `border-radius: 20px` containing an `<img>`. The image extends visually into the rounded corner area. Why does this happen?
12. What CSS solution could clip the image to the rounded card?
13. Why should you not automatically use `overflow: hidden;` on every rounded component? Give at least three possible problems it could cause.

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 8–13)</summary>

8. **Danger of `outline: none`:** Destroys the visual focus indicator for keyboard users, making navigation impossible for users with motor or visual disabilities (direct WCAG 2.4.7 violation).
9. **`focus-visible` and `outline-offset` Role:**
   - `:focus-visible`: Selectively triggers the outline only during keyboard navigation (Tab key), preventing unwanted focus rings on mouse clicks.
   - `outline-offset: 4px`: Pushes the focus stroke outward by $4\text{px}$, leaving a clean gap that prevents the outline from obscuring button text or borders.
10. **Outline Layout Space:** It takes up **zero layout space**. When an outline is rendered, surrounding sibling elements do **not move or reflow**; the outline simply paints on top of whatever whitespace or elements surround it.
11. **Image Corner Overflow Cause:** By default, child elements (like `<img>` or `<div>`) render in their own rectangular box model above the parent's background. If the parent has `border-radius`, child pixels outside the curve remain visible unless explicitly clipped or rounded.
12. **Solutions to Clip Image:**
    - *Method A (Preferred):* Apply `border-radius: 20px 20px 0 0;` (or `rounded-t-2xl`) directly to the `<img>`.
    - *Method B:* Apply `overflow: hidden;` to the `.card` container.
13. **Three Problems Caused by Indiscriminate `overflow: hidden`:**
    1. *Dropdown / Popover Severance:* Absolute dropdown menus attached to card buttons get clipped at card edges.
    2. *Shadow Clipping:* Outer `box-shadow` effects get trimmed.
    3. *Focus Ring Truncation:* Negative or offset keyboard focus rings (`outline-offset`) get chopped off.
</details>

---

### Questions 14–20: Logical Properties, Pills & Sizing Traps

**Task / Questions:**
14. What is the difference between `border-left: 4px solid blue;` and `border-inline-start: 4px solid blue;`?
15. Why are logical border properties useful for internationalized interfaces?
16. Explain what `.tag { border-radius: 999px; }` creates. Why does it often create a pill-shaped component?
17. A developer creates a `.card` with `width: 100%; padding: 20px; border: 2px solid black;`. The card exceeds parent width. Explain why this happens with the default box model.
18. How would `box-sizing: border-box;` change that behavior?
19. What is `border-image` conceptually used for?
20. Explain the difference between `.input { border: 2px solid blue; }` vs `.input:focus-visible { outline: 3px solid blue; }`. Why might each exist for a different purpose?

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 14–20)</summary>

14. **Physical vs. Logical:** `border-left` is hardcoded to the physical left side of the screen regardless of language. `border-inline-start` anchors to the start of the text writing line (left in English LTR; right in Arabic RTL).
15. **Utility in i18n:** Enables automatic right-to-left layout adaptation without writing separate CSS override stylesheets for RTL languages.
16. **`border-radius: 999px` (Pill Geometry):** CSS restricts corner radius curves from overlapping; when a value exceeds half the minor axis height, the browser caps the curvature at half the height. This guarantees perfectly rounded semi-circular end-caps with straight horizontal edges (a capsule/pill).
17. **`width: 100%` Blowout Cause:** Under default `box-sizing: content-box`, total width equals $\text{Parent Width } (100\%) + 40\text{px padding} + 4\text{px border}$, overflowing the parent by $44\text{px}$.
18. **`border-box` Fix:** Absorbs padding ($40\text{px}$) and border ($4\text{px}$) inside the $100\%$ boundary, keeping total rendered width at exactly $100\%$ of the parent.
19. **`border-image` Purpose:** Replaces solid color border strokes with custom sliced bitmap graphics or multi-stop linear/radial CSS gradients.
20. **Border vs. Outline in Form Inputs:**
    - `.input { border: 2px solid blue; }`: Establishes the permanent structural boundary of the input box.
    - `.input:focus-visible { outline: 3px solid blue; }`: Provides a temporary, non-layout-shifting accessibility focus ring during active keyboard editing.
</details>

---

### Questions 21–25: Senior Architecture & Production Decisions

**Task / Questions:**
21. You are building a button with `border-radius: 8px;` and want a visible keyboard focus state. Would you remove the outline completely? Explain your production decision.
22. A card has `width: 400px; padding: 20px; border: 5px solid black;`. Calculate the total rendered width using:
    - a. `content-box`
    - b. `border-box`
23. You need a visual line on only the starting side of a component that should automatically adapt between LTR and RTL layouts. Which property would you choose and why?
24. You want a profile image to appear perfectly circular. The image container is currently $300\text{px} \times 200\text{px}$. You add `border-radius: 50%;`. Will it become a circle? If not, what should you change?
25. **Final Production Scenario:** You are building a reusable card component with:
    - Rounded corners
    - A border
    - An image at the top
    - A dropdown menu inside the card
    - Keyboard-focusable buttons
    - Support for RTL layouts  
    *Explain your CSS decisions for:* (1) Border sizing & `box-sizing`, (2) Rounded image clipping, (3) Avoiding dropdown clipping, (4) Keyboard focus styling, (5) RTL-aware border placement.

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 21–25)</summary>

21. **Button Focus Decision:** **Never remove the outline completely.** Keep `:focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }` to guarantee accessibility for keyboard users while keeping mouse clicks clean.
22. **Width Calculations ($400\text{px}$ width, $20\text{px}$ padding, $5\text{px}$ border):**
    - a. `content-box`: $400 + (2 \times 20) + (2 \times 5) = \mathbf{450px}$.
    - b. `border-box`: $\mathbf{400px}$ (content shrinks to $350\text{px}$).
23. **Starting Side Line:** Choose **`border-inline-start: [N]px solid [color];`** because it dynamically maps to the left side in LTR and flips to the right side in RTL.
24. **Profile Image Fix:** It will render as an **ellipse** because $300\text{px} \neq 200\text{px}$. Fix: Lock to a $1:1$ aspect ratio (`width: 200px; height: 200px;` or `aspect-ratio: 1/1;`) and add `object-fit: cover;` alongside `border-radius: 50%;`.
25. **Final Production Architectural Blueprint:**
    1. *Sizing:* Apply `box-sizing: border-box; width: 100%;` to ensure border and padding are absorbed without container blowout.
    2. *Image Clipping:* Apply `border-top-left-radius: 16px; border-top-right-radius: 16px;` (or `rounded-t-2xl`) directly to the `<img>` element with `object-fit: cover;`.
    3. *Dropdown Protection:* **Do NOT place `overflow: hidden` on the card container**. This allows the absolute dropdown menu to open freely beyond the card boundaries without being clipped.
    4. *Focus Styling:* Use `button:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }` for non-reflowing keyboard accessibility.
    5. *RTL Border Placement:* Use `border-inline-start: 4px solid var(--accent);` for accent bars to ensure automatic bidirectional mirroring.
</details>

---

## Key Takeaways
1. **Borders consume layout space; Outlines do not:** Never use borders for hover/focus state animations without declaring an initial transparent border.
2. **Preserve focus accessibility:** Never write `outline: none` without providing a high-contrast `:focus-visible` replacement.
3. **Pills vs Circles:** Use `border-radius: 9999px` for dynamic text pills; use `aspect-ratio: 1/1; border-radius: 50%;` for circular avatars.
4. **Avoid `overflow: hidden` on card containers:** Round top images directly on child tags to keep dropdowns and tooltips functional.
5. **Embrace logical borders:** Use `border-inline-start` for automatic RTL internationalization.

---

[⬅️ KPI 05 — Colors & Backgrounds](./05-colors-backgrounds-visual-effects.md) | [📚 CSS Index](./README.md) | [KPI 07 — Display & Visibility ➡️](./07-display-visibility-participation.md)
