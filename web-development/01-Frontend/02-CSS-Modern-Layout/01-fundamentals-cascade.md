# KPI 1 — Fundamentals & Cascade

[📚 CSS Engineering Roadmap](./README.md) | [KPI 02 — Box Model & Sizing ➡️](./02-box-model-sizing.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Concept | The Core Rule / Formula | Code Example | Quick Mental Model |
|---|---|---|---|
| **Cascade Resolution Hierarchy** | `Origin & Importance` $\rightarrow$ `Context` $\rightarrow$ `@layer` $\rightarrow$ `Specificity` $\rightarrow$ `Source Order` | `color: blue !important;` | Specificity ONLY matters *within the same importance tier*. |
| **Specificity Vector** | `(Inline, ID, Class/Attr/Pseudo-class, Element/Pseudo-element)` | `#app .card p` $\rightarrow$ `(0, 1, 1, 1)` | Leftmost column always beats any number in right columns. |
| **Direct vs Inheritance** | Direct Declaration ALWAYS beats any inherited style | `p { color: blue; }` beats `#app { color: red; }` | Inheritance has no specificity (effective specificity = 0). |
| **Pseudo-class vs Element** | Single colon (`:hover`, `:first-child`) vs Double colon (`::before`, `::after`) | `.btn:hover::after` | Pseudo-classes match element state; pseudo-elements create virtual boxes. |
| **CSS-Wide Keywords** | `initial` (W3C default) \| `inherit` (parent value) \| `unset` (dynamic) \| `revert` (UA default) | `color: revert;` | `revert` rolls back to User-Agent styles, ignoring author CSS. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: The `!important` Cascade Inversion
> **Question:** *"If a User Stylesheet declares `p { color: red !important; }` and your Author Stylesheet declares `p { color: blue !important; }`, which one wins?"*  
> **Answer:** **The User Stylesheet (`red`) wins!**  
> **Why:** For *normal* styles, Author beats User (`Author Normal > User Normal`). But for *`!important`* styles, the cascade hierarchy **inverts** (`User !important > Author !important`) to guarantee user accessibility preferences override author styles!

---

## Overview
This document serves as the master engineering reference for CSS Fundamentals, Selector Matching, Specificity Calculation, Property Inheritance, the Cascade Algorithm, Cascade Origins, and CSS-Wide Keywords (`initial`, `inherit`, `unset`, `revert`, `revert-layer`).

---

## Learning Objectives
- Master every selector category: basic, compound, attribute, combinators, state pseudo-classes, structural pseudo-classes, and pseudo-elements.
- Calculate exact 3-column specificity vectors `(IDs, Classes/Attributes/Pseudo-classes, Elements/Pseudo-elements)` alongside inline styles and `!important`.
- Understand the 6-stage Cascade Resolution Algorithm (Importance, Origin, Layer, Specificity, Order of Appearance).
- Master inheritance rules and distinguish between inherited values and direct element declarations.
- Master the precise differences between the 5 CSS-wide keywords: `inherit`, `initial`, `unset`, `revert`, and `revert-layer`.
- Confidently predict style resolution and debug production cascade conflicts without trial and error.

---

## Problem or Context
In CSS, multiple style sheets, nested selectors, and inherited properties compete simultaneously to style the exact same HTML element. Without a deterministic resolution algorithm, styling complex interfaces would lead to non-deterministic chaos. 

The **Cascade, Specificity, and Inheritance Engine** is CSS's conflict-resolution system. It allows developers to define global defaults that cascade downward while providing predictable mechanisms to override them locally.

---

## Core Concepts

### 1. The Cascade Algorithm (Resolution Order) `🟢 [Daily Driver]`
When multiple declarations target the same property on an element, the browser resolves conflicts using the following strict hierarchy:

```text
                                 [Target Element Property]
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │ 1. Is there a Direct Declaration on Element? │
                      └──────────────────────┬───────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼ (YES: Competing Direct Rules)             ▼ (NO: No Direct Rule)
        ┌───────────────────────────────┐               ┌───────────────────────────────┐
        │ 2. Importance & Origin Tier   │               │ Inherited Property?           │
        │    - Transitions              │               │ (e.g. color, font-family)     │
        │    - User-Agent !important    │               │ - YES: Take parent's Computed │
        │    - User !important          │               │ - NO:  Use Initial Spec Value │
        │    - Author !important        │               └───────────────────────────────┘
        │    - Animations               │
        │    - Author Normal            │
        │    - User Normal              │
        │    - User-Agent Normal        │
        └──────────────┬────────────────┘
                       │ (If tied)
                       ▼
        ┌───────────────────────────────┐
        │ 3. Cascade Layer (@layer)     │
        │    Normal: later layer wins   │
        │    !important: earlier layer  │
        └──────────────┬────────────────┘
                       │ (If tied)
                       ▼
        ┌───────────────────────────────┐
        │ 4. Specificity Vector         │
        │    (Inline, ID, Class, Type)  │
        └──────────────┬────────────────┘
                       │ (If tied)
                       ▼
        ┌───────────────────────────────┐
        │ 5. Order of Appearance        │
        │    Last declared rule wins    │
        └───────────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: The Cascade
- **✅ When to Use:** Rely on the cascade to establish global design foundations (`@layer base` / reset) and selectively override them at the component or utility level.
- **❌ When NOT to Use `!important` as a Quick Fix:** Using `!important` to bypass specificity breaks the natural cascade hierarchy, creating an escalating "specificity arms race" across component stylesheets.
- **⚠️ Bottlenecks & Tradeoffs:** Overly deep descendant nesting (`#app .main .sidebar .card p`) increases CSS file parse time, causes selector matching performance overhead, and makes overriding styles nearly impossible without heavy hacks.
- **🚀 Modern Leverages:** Use **CSS Cascade Layers (`@layer`)** in modern design systems to establish clear priority tiers (`base`, `components`, `utilities`) without calculating selector specificity.

---

### 1.1 The 4-Stage Value Processing Lifecycle `🔵 [Foundational]`
Every CSS property undergoes a 4-step transformation pipeline before appearing on screen:

```text
[Specified Value] ──► [Computed Value] ──► [Used Value] ──► [Actual Value]
 (Raw CSS code)        (Inherited stage)    (Layout stage)   (Pixel snapping)
```

1. **Specified Value:** The exact value written in CSS (e.g., `font-size: 2em`, `width: 50%`, `inherit`).
2. **Computed Value:** Resolved during style computation (relative units like `em`, `rem` converted to `px`; keywords like `inherit` or `initial` resolved). **This is the exact value passed down to children during inheritance.**
3. **Used Value:** Resolved after layout and box-model geometry are calculated (e.g., `width: 50%` turns into `350px` based on parent width).
4. **Actual Value:** The final value rendered after rounding/antialiasing to device hardware pixels (e.g., `350.33px` converted to `350.5px` or `350px`).

---

### 2. Specificity Calculation `🟢 [Daily Driver]`

Specificity is represented as a 3-part vector `(a, b, c)` or 4-part vector `(Inline, ID, Class/Attr/Pseudo-class, Element/Pseudo-element)`:

| Component | Selector Types Included | Specificity Weight |
|---|---|---|
| **Inline** | `style="..."` on HTML element | Overrides any selector specificity |
| **A (IDs)** | `#id` | `(1, 0, 0)` |
| **B (Classes, Attr, Pseudo-classes)** | `.class`, `[type="text"]`, `:hover`, `:focus`, `:nth-child()`, `:not()`, `:is()` | `(0, 1, 0)` |
| **C (Elements, Pseudo-elements)** | `div`, `p`, `h1`, `::before`, `::after`, `::placeholder`, `::marker` | `(0, 0, 1)` |
| **Zero (0)** | Universal `*`, Combinators (`+`, `~`, `>`, space), `:where()` | `(0, 0, 0)` |

#### ⚖️ Senior Engineering Decision Matrix: Specificity
- **✅ When to Use Low Specificity Classes (`0, 1, 0`):** Single-class naming (BEM or utility classes like Tailwind) keeps specificity flat across the entire codebase, making overrides predictable.
- **❌ When NOT to Use ID Selectors (`#header`):** Never use IDs for CSS styling in reusable components. An ID `(1, 0, 0)` permanently locks out class-based overrides (`0, 1, 0`) and requires inline styles or `!important` to change.
- **⚠️ Bottlenecks:** High-specificity selectors (`body.theme-dark div#app main.content ul.list li.item > a.link`) create rigid coupling to HTML DOM structures, breaking styles when HTML is refactored.
- **🚀 Modern Leverages:** Use **`:where()`** to apply default styles with **zero specificity `(0, 0, 0)`**, allowing consumers to override defaults with a single basic class.

---

### 3. Selector Categories & Combinators `🟢 [Daily Driver]`

#### ⚖️ Senior Engineering Decision Matrix: Selectors
- **✅ When to Use Child Combinators (`>`):** Use direct child combinator `.card > p` when styles should only apply to immediate children, avoiding accidental bleeding into nested child components.
- **✅ When to Use Sibling Combinators (`+`, `~`):** Use adjacent sibling `h2 + p` to apply contextual top spacing (e.g. paragraph immediately following a heading).
- **❌ When NOT to Use Deep Descendant Selectors (`.card p`):** Descendant spaces match *every* `<p>` tag at any depth, unexpectedly breaking nested sub-cards or badges.
- **🚀 Modern Leverages:** Use **`:is()`** and **`:has()`** (the CSS parent selector) for clean, composable relational styling without extra JavaScript state.

---

### 4. Direct Declaration vs. Inheritance `🟢 [Daily Driver]`

```text
                    HTML TREE
                 ┌─────────────┐
                 │    #app     │ (color: red)
                 └──────┬──────┘
                        │
                 ┌──────▼──────┐
                 │      p      │ (color: blue)
                 └─────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: Inheritance
- **✅ When to Use Inheritance:** Set global typography defaults (`font-family`, `color`, `line-height`) at the `:root` / `body` level and let them naturally cascade downward to all text nodes.
- **❌ When NOT to Expect Box Model Inheritance:** Margins, padding, borders, backgrounds, and dimensions do NOT inherit. Never assume a child `<div>` will inherit its parent's padding or border.
- **⚠️ Common Gotcha:** A direct tag rule (`p { color: blue; }`) with low specificity `(0, 0, 1)` **always defeats** an inherited rule from a parent ID (`#app { color: red; }`).

---

### 5. CSS-Wide Keywords `🟢 [Daily Driver]`

| Keyword | Inherited Property (e.g., `color`) | Non-Inherited Property (e.g., `margin`) | Senior Use Case |
|---|---|---|---|
| **`inherit`** | Takes parent's computed value | Explicitly forces inheritance from parent | Forcing `<button>` or `<input>` to inherit parent `font-family` / `color`. |
| **`initial`** | Sets to CSS spec default (`black`) | Sets to CSS spec default (`0px`) | Hard-resetting a property to official W3C baseline. |
| **`unset`** | Acts as `inherit` | Acts as `initial` | Universal dynamic reset. |
| **`revert`** | Rolls back to User-Agent styles | Rolls back to User-Agent styles | Stripping all author styles while retaining native browser button/input controls. |
| **`revert-layer`**| Rolls back to previous `@layer` | Rolls back to previous `@layer` | Reverting custom component theme overrides back to base design system layer. |

#### ⚖️ Senior Engineering Decision Matrix: CSS-Wide Keywords
- **✅ When to Use `color: inherit` & `font: inherit`:** Form elements (`<button>`, `<input>`, `<textarea>`) do NOT inherit typography by default in browsers. Always set `font: inherit; color: inherit;` on form controls.
- **✅ When to Use `revert`:** When building a "Reset Component" toggle that removes custom author styling and restores native browser form rendering.
- **❌ When NOT to Confuse `initial` with `revert`:** Setting `display: initial` on a `<div>` makes it `inline` (the W3C initial default), NOT `block`! To restore block rendering, use `display: revert;`.

---

## Comparisons & Matrices

### Specificity Battle Matrix (Tricky Showdowns)

| Selector A | Specificity A | Selector B | Specificity B | Winner | Key Insight |
|---|---|---|---|---|---|
| `#nav .link` | `(1, 1, 0)` | `header nav a.link.active:hover` | `(0, 3, 2)` | **Selector A** | 1 ID in Column A defeats any number of classes/elements in Columns B & C. |
| `:is(.card, #modal)` | `(1, 0, 0)` | `.modal-body` | `(0, 1, 0)` | **Selector A** | `:is()` takes the specificity of its **highest** argument (`#modal`). |
| `:where(#modal .btn)` | `(0, 0, 0)` | `button` | `(0, 0, 1)` | **Selector B** | `:where()` is always `(0, 0, 0)`; even a single element selector beats it. |
| `.btn:not(.disabled)` | `(0, 2, 0)` | `.btn.primary` | `(0, 2, 0)` | **Tie (Source Order)** | `:not()` adds the specificity of its inner argument. |
| `div::before` | `(0, 0, 2)` | `p` | `(0, 0, 1)` | **Selector A** | Pseudo-elements count as element type selectors in Column C. |
| `p` (direct) | `(0, 0, 1)` | `#hero .card #title` (inherited) | *N/A (Inherited)* | **Selector A** | Direct declaration always defeats inheritance, no matter how specific the parent is. |

---

### Production Cascade Debugging Checklist
Whenever a style is not applying in production, follow this 5-step diagnostic procedure:

```text
Step 1: Check DevTools "Computed" Tab
   └── Does the property show up? If crossed out, DevTools will show the winning selector.

Step 2: Check Direct Declaration vs Inheritance
   └── Is the rule written on a parent element while a universal reset (* { ... }) or element tag (a { ... }) has a direct rule?

Step 3: Check Specificity Column Vector
   └── Count: Inline styles > IDs (Column A) > Classes/Attrs/Pseudos (Column B) > Types (Column C).

Step 4: Check Cascade Layers (@layer) & !important
   └── Is the declaration locked inside an unlayered style or overridden by an inverted !important layer rule?

Step 5: Check Source Order
   └── If specificities are identical, check stylesheet link order or bundler chunk ordering (e.g. CSS Modules vs Global CSS).
```

---

### Pseudo-Class vs. Pseudo-Element
| Feature | Pseudo-Class (`:`) | Pseudo-Element (`::`) |
|---|---|---|
| **Purpose** | Targets an element in a specific **state** or DOM structure | Targets a specific **sub-part** or injects cosmetic content |
| **Examples** | `:hover`, `:focus`, `:first-child`, `:disabled` | `::before`, `::after`, `::placeholder`, `::marker` |
| **DOM Impact** | Selects existing DOM elements | Generates virtual boxes (no actual DOM node added) |
| **Specificity** | Contributes to Column B: `(0, 1, 0)` | Contributes to Column C: `(0, 0, 1)` |

### Combinator Cheatsheet
| Syntax | Name | Matches |
|---|---|---|
| `A B` | Descendant | Any `B` nested inside `A` at any depth |
| `A > B` | Child | Only direct children `B` of `A` |
| `A + B` | Adjacent Sibling | `B` immediately after `A` sharing same parent |
| `A ~ B` | General Sibling | Any `B` appearing after `A` sharing same parent |

---

## Complete KPI 1 Challenges & Step-by-Step Solutions

### Challenge 1 — Basic Selector Matching
**Given:**
```html
<section class="card featured">
  <h2>Product</h2>
  <p class="text">Description</p>
</section>

<div class="card">
  <p class="featured">Another product</p>
</div>
```

**Task / Questions:**
For each selector, identify which element(s) match and explain why:
1. `.card`
2. `.featured`
3. `.card.featured`
4. `.card, .featured`
5. `section.featured`
6. `div.featured`
7. `p`
8. `*`

**Expected Understanding:**
Compound class matching vs. selector lists vs. tag/class qualification.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **`.card`**: Matches `<section class="card featured">` and `<div class="card">`. Both elements have the class `card`.
2. **`.featured`**: Matches `<section class="card featured">` and `<p class="featured">`. Both have the class `featured`.
3. **`.card.featured`**: Matches `<section class="card featured">`. It requires BOTH classes on the exact same element.
4. **`.card, .featured`**: Matches `<section class="card featured">`, `<div class="card">`, and `<p class="featured">`. Matches any element containing either class.
5. **`section.featured`**: Matches `<section class="card featured">`. It is a `<section>` tag with class `featured`.
6. **`div.featured`**: Matches **None**. The `<div>` only has `class="card"`, not `featured`.
7. **`p`**: Matches `<p class="text">` and `<p class="featured">`. Matches all `<p>` tags.
8. **`*`**: Matches all elements in snippet (`<section>`, `<h2>`, `<p class="text">`, `<div>`, `<p class="featured">`).
</details>

---

### Challenge 2 — Attribute Selectors
**Given:**
```html
<input type="email" name="email">
<input type="password" disabled>
<a href="https://example.com">Website</a>
<a href="document.pdf">Document</a>
<button class="btn-primary">Submit</button>
<input type="text" name="username">
<div class="button-wrapper"></div>
```

**Task / Questions:**
1. Which element matches `[type="email"]`?
2. Which element matches `input[disabled]`?
3. Which element matches `[href^="https"]`?
4. Which element matches `[href$=".pdf"]`?
5. Which element matches `[class*="btn"]`?
6. Which element matches `input[type="text"]`?
7. Does `.button-wrapper` match `[class*="btn"]`? Explain precisely.

**Expected Understanding:**
Attribute selector wildcards (`^=`, `$=` `*=`) and substring matching mechanics.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **`[type="email"]`**: Matches `<input type="email" name="email">`.
2. **`input[disabled]`**: Matches `<input type="password" disabled>`.
3. **`[href^="https"]`**: Matches `<a href="https://example.com">` (starts with `"https"`).
4. **`[href$=".pdf"]`**: Matches `<a href="document.pdf">` (ends with `".pdf"`).
5. **`[class*="btn"]`**: Matches `<button class="btn-primary">` AND `<div class="button-wrapper">`.
6. **`input[type="text"]`**: Matches `<input type="text" name="username">`.
7. **Does `.button-wrapper` match `[class*="btn"]`?** Yes. The substring `"btn"` is contained inside `"button-wrapper"` (b-t-n). The wildcard `*=` checks for any contiguous occurrence of the substring.
</details>

---

### Challenge 3 — Combinators
**Given:**
```html
<section class="article">
  <h1>Title</h1>
  <p class="intro">Introduction</p>
  <div class="content">
    <p>Paragraph 1</p>
    <p>Paragraph 2</p>
  </div>
  <p class="footer-text">Footer text</p>
</section>
```

**Task / Questions:**
For each selector, answer which element(s) match, why, and what relationship the combinator represents:
1. `.article p`
2. `.article > p`
3. `h1 + p`
4. `h1 ~ p`
5. `.content > p`
6. `.intro + .content`
7. `.content + .footer-text`

**Expected Understanding:**
Descendant (` `), Direct Child (`>`), Adjacent Sibling (`+`), and General Sibling (`~`) relationships.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **`.article p`** (Descendant): Matches `<p class="intro">`, `<p>Paragraph 1</p>`, `<p>Paragraph 2</p>`, `<p class="footer-text">`. (All `<p>` tags nested inside `.article` at any depth).
2. **`.article > p`** (Child): Matches `<p class="intro">` and `<p class="footer-text">`. (Only direct `<p>` children; Paragraphs 1 & 2 are direct children of `.content`).
3. **`h1 + p`** (Adjacent Sibling): Matches `<p class="intro">`. (The single `<p>` immediately following `<h1>`).
4. **`h1 ~ p`** (General Sibling): Matches `<p class="intro">` and `<p class="footer-text">`. (All sibling `<p>` tags coming after `<h1>` under `.article`).
5. **`.content > p`** (Child): Matches `<p>Paragraph 1</p>` and `<p>Paragraph 2</p>`.
6. **`.intro + .content`** (Adjacent Sibling): Matches `<div class="content">`. (`.content` immediately follows `.intro`).
7. **`.content + .footer-text`** (Adjacent Sibling): Matches `<p class="footer-text">`. (`.footer-text` immediately follows `.content`).
</details>

---

### Challenge 4 — State Pseudo-Classes
**Given:**
```html
<input type="email" required value="test@example.com">
<input type="email" required value="invalid-email">
<input type="checkbox" checked>
<button class="primary">Submit</button> <!-- Assume currently hovered -->
<button class="primary" disabled>Submit Disabled</button>
```

**Task / Questions:**
1. Which elements match `input:required`?
2. Which element matches `input:valid`?
3. Which element matches `input:invalid`?
4. Which element matches `input:checked`?
5. Which element matches `.primary:not(:disabled)`?
6. Which element matches `.primary:hover`?
7. Which element matches `.primary:disabled`?

**Expected Understanding:**
Dynamic client state matching, form validation pseudo-classes, and negation filtering (`:not`).

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **`input:required`**: Matches the 1st input (`value="test@example.com"`) and 2nd input (`value="invalid-email"`).
2. **`input:valid`**: Matches the 1st input (`value="test@example.com"`).
3. **`input:invalid`**: Matches the 2nd input (`value="invalid-email"`).
4. **`input:checked`**: Matches the 3rd input (`<input type="checkbox" checked>`).
5. **`.primary:not(:disabled)`**: Matches the 1st button (`<button class="primary">`).
6. **`.primary:hover`**: Matches the 1st button (since it is currently hovered).
7. **`.primary:disabled`**: Matches the 2nd button (`<button class="primary" disabled>`).
</details>

---

### Challenge 5 — Structural Pseudo-Classes
**Given:**
```html
<div class="container">
  <h2>Title</h2>               <!-- Child 1, h2:nth-of-type(1) -->
  <p class="item">Paragraph 1</p> <!-- Child 2, p:nth-of-type(1) -->
  <div class="item">Box 1</div>   <!-- Child 3, div:nth-of-type(1) -->
  <p class="item">Paragraph 2</p> <!-- Child 4, p:nth-of-type(2) -->
  <div class="item">Box 2</div>   <!-- Child 5, div:nth-of-type(2) -->
</div>
```

**Task / Questions:**
For each selector, identify matching element(s), why, and the conditions checked:
1. `.item:first-child`
2. `.item:nth-child(3)`
3. `.item:nth-child(even)`
4. `p:nth-child(4)`
5. `p:nth-of-type(2)`
6. `.item:last-child`
7. `.item:nth-child(2)`
8. **Critical Question:** Why does `.item:nth-child(2)` not mean "the second element having the item class"?

**Expected Understanding:**
Understanding that `:nth-child` evaluates index across **all DOM siblings first**, whereas `:nth-of-type` filters by tag name first.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **`.item:first-child`**: Matches **None**. Child 1 is `<h2>`, which does not have `.item`.
2. **`.item:nth-child(3)`**: Matches `<div class="item">Box 1</div>`. Child 3 has `.item`.
3. **`.item:nth-child(even)`**: Checks Child 2 (`<p class="item">Paragraph 1</p>`) and Child 4 (`<p class="item">Paragraph 2</p>`). Both have `.item`, so both match.
4. **`p:nth-child(4)`**: Matches `<p class="item">Paragraph 2</p>`. (Child 4 is a `<p>`).
5. **`p:nth-of-type(2)`**: Matches `<p class="item">Paragraph 2</p>`. (The second `<p>` tag inside `.container`).
6. **`.item:last-child`**: Matches `<div class="item">Box 2</div>`. (Child 5 is the last child and has `.item`).
7. **`.item:nth-child(2)`**: Matches `<p class="item">Paragraph 1</p>`. (Child 2 has `.item`).
8. **Why it doesn't mean "2nd item class":** `:nth-child(2)` evaluates the 2nd child in the DOM first, and then verifies if it has `.item`. It does not filter all `.item` elements and pick the 2nd one.
</details>

---

### Challenge 6 — Pseudo-Elements
**Given:**
```css
.card::before { content: "New"; }
.card::after { content: ""; height: 2px; }
.card:hover::after { height: 4px; }
.title::first-letter { font-size: 40px; }
input::placeholder { color: gray; }
li::marker { color: blue; }
```

**Task / Questions:**
1. Where does `.card::before` conceptually appear?
2. Does `.card::after` generate visible text? Explain.
3. What changes when `.card` is hovered?
4. Which character receives `font-size: 40px`?
5. What receives the gray color?
6. What receives the blue color?
7. How many actual HTML elements are added to the DOM?

**Expected Understanding:**
Virtual box generation vs DOM nodes, content requirement, and pseudo-element targeting.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Where does `.card::before` appear?** As the first inline child inside `.card` (before all other children).
2. **Does `.card::after` generate visible text?** No, because `content: ""` is an empty string, but it creates a visible box if dimensions/backgrounds are styled.
3. **What changes on hover?** The height of the `::after` pseudo-element increases from `2px` to `4px`.
4. **Which character receives `font-size: 40px`?** Only the first letter of the element matching `.title`.
5. **What receives the gray color?** The placeholder text inside `<input>` fields.
6. **What receives the blue color?** The bullet point / list numbering marker of `<li>` items.
7. **How many actual HTML elements are added to the DOM?** **0**. Pseudo-elements create rendered boxes, not DOM nodes.
</details>

---

### Challenge 7 — Inheritance Mechanics
**Given:**
```css
.app { color: red; font-family: Arial; border: 2px solid black; }
.card { color: blue; }
h2 { font-family: initial; }
.description { color: inherit; border: inherit; }
```
```html
<div class="app">
  <section class="card">
    <h2>Profile</h2>
    <p class="description">Welcome back.</p>
  </section>
</div>
```

**Task / Questions:**
1. What color does the `.app` text context provide?
2. Does `font-family` inherit?
3. Does `border` normally inherit?
4. What color does `.card` establish for its descendants?
5. What font family does `h2` use with `font-family: initial`?
6. Why does `.description` use `color: inherit`?
7. What happens with `border: inherit` if the parent has no border?
8. Does `padding` normally inherit?

**Expected Understanding:**
Inherited (typography) vs. non-inherited (box-model) CSS properties and explicit inheritance.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Color provided by `.app`:** `red`.
2. **Does `font-family` inherit?** Yes, typography properties inherit down the DOM tree.
3. **Does `border` normally inherit?** No, box-model properties do not inherit by default.
4. **Color established by `.card`:** `blue` (overrides inherited `red` for its descendants).
5. **Font family of `h2` with `font-family: initial`:** Browser default (typically `Times New Roman` or system serif).
6. **Why does `.description` use `color: inherit`?** It explicitly pulls `color: blue` from parent `.card`.
7. **What happens with `border: inherit` if parent `.card` has no border?** It receives `border: none` (the computed border of `.card`, NOT `.app`).
8. **Does `padding` normally inherit?** No.
</details>

---

### Challenge 8 — Basic Specificity & Cascade
**Given:**
```css
section { color: green; }           /* (0, 0, 1) */
.card { color: red; }               /* (0, 1, 0) */
.featured { color: blue; }          /* (0, 1, 0) */
.card { padding: 20px; }            /* (0, 1, 0) */
.card { padding: 30px; }            /* (0, 1, 0) - Later order */
.featured { border: 2px solid black; }
.title { color: red; }
```
```html
<section class="card featured">
  <h2 class="title">Title</h2>
  <p>Description</p>
</section>
```

**Task / Questions:**
1. Which declarations compete for the section's color?
2. What is the final section color?
3. What is the final padding?
4. Does the section receive a border?
5. What color does `h2` inherit initially?
6. What color does `p` inherit?
7. Why does `.title` change the `h2` color?

**Expected Understanding:**
Cascade resolution via specificity vector, source order tie-breaking, and direct declaration overrides.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Declarations competing for `<section>` color:** `section`, `.card`, `.featured`.
2. **Final `<section>` color:** `blue`. `.card` and `.featured` tie on specificity `(0, 1, 0)`; `.featured` wins by order of appearance.
3. **Final padding:** `30px`. Equal specificity; later rule wins.
4. **Does section receive border?** Yes (`2px solid black` from `.featured`).
5. **Color `h2` inherits initially:** `blue` (from `<section>`).
6. **Color `p` inherits:** `blue` (from `<section>`).
7. **Why does `.title` change `h2` color to `red`?** Direct declaration on `h2` with specificity `(0, 1, 0)` overrides inherited `blue`.
</details>

---

### Challenge 9 — Specificity Calculation Deep Dive

**Task / Questions:**
Calculate the specificity vector `(Inline, ID, Class/Attr/Pseudo, Type)` for all selectors and determine the winner:

#### Question 1
```css
p { color: red; }
.card-text { color: blue; }
```
- Specificity of both selectors? Which color wins and why?

#### Question 2
```css
section { color: red; }
.card { color: blue; }
#app { color: green; }
```
- Specificity of each? Which color wins and why?

#### Question 3
```css
p { color: red; }
.text { color: blue; }
.card .text { color: green; }
#app .card p { color: purple; }
```
- Specificity of every selector? Which declaration wins and why?

#### Question 4
```css
input { color: red; }
.field { color: blue; }
input[type="email"] { color: green; }
input[type="email"]:focus { color: purple; }
```
*(Assume input is focused)*
- Specificity of every selector? Which declaration wins and why?

#### Question 5
```css
.card::before { color: red; }
div::before { color: blue; }
```
- Specificity of `.card::before` and `div::before`? Which wins and why?

#### Question 6
```css
button { color: red; }
.btn { color: blue; }
.btn:not(.disabled) { color: green; }
```
- Specificity of every selector? Which declaration wins for a button with class `btn`?

#### Question 7 — `:is()` and `:where()`
```css
button { color: red; }
:is(.btn, #app button) { color: blue; }
:where(#app .btn) { color: green; }
```
- Specificity of each? Which color wins? Why does `:is()` have that specificity? Why does `:where()` have zero specificity?

<details>
<summary>Detailed Step-by-Step Calculations for All 7 Sub-questions</summary>

- **Q1:** `p`: `(0, 0, 1)`, `.card-text`: `(0, 1, 0)` $\rightarrow$ **Winner:** `.card-text` (`blue`).
- **Q2:** `section`: `(0, 0, 1)`, `.card`: `(0, 1, 0)`, `#app`: `(1, 0, 0)` $\rightarrow$ **Winner:** `#app` (`green`).
- **Q3:** `p`: `(0, 0, 1)`, `.text`: `(0, 1, 0)`, `.card .text`: `(0, 2, 0)`, `#app .card p`: `(1, 1, 1)` $\rightarrow$ **Winner:** `#app .card p` (`purple`).
- **Q4:** `input`: `(0, 0, 1)`, `.field`: `(0, 1, 0)`, `input[type="email"]`: `(0, 1, 1)`, `input[type="email"]:focus`: `(0, 2, 1)` $\rightarrow$ **Winner:** `input[type="email"]:focus` (`purple`).
- **Q5:** `.card::before`: `(0, 1, 1)`, `div::before`: `(0, 0, 2)` $\rightarrow$ **Winner:** `.card::before` (`red`).
- **Q6:** `button`: `(0, 0, 1)`, `.btn`: `(0, 1, 0)`, `.btn:not(.disabled)`: `(0, 2, 0)` $\rightarrow$ **Winner:** `.btn:not(.disabled)` (`green`).
- **Q7:** `button`: `(0, 0, 1)`, `:is(...)`: `(1, 0, 1)` (takes highest argument `#app button`), `:where(...)`: `(0, 0, 0)` $\rightarrow$ **Winner:** `:is(.btn, #app button)` (`blue`).
</details>

---

### Challenge 10 — Specificity Debugging
**Given:**
```html
<div id="app">
  <section class="card featured">
    <p class="text">Hello</p>
  </section>
</div>
```
```css
p { color: red; }
.text { color: blue; }
.card .text { color: green; }
.featured p { color: orange; }
#app .text { color: purple; }
.text { color: black; }
```

**Task / Questions:**
1. List all matching selectors.
2. Calculate specificity for each.
3. List all competing color declarations.
4. Which color wins?
5. Why does the final `.text` declaration not automatically win?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

- **Matching Selectors & Specificities:**
  - `p`: `(0, 0, 1)`
  - `.text` (blue): `(0, 1, 0)`
  - `.card .text`: `(0, 2, 0)`
  - `.featured p`: `(0, 1, 1)`
  - `#app .text`: `(1, 1, 0)`
  - `.text` (black): `(0, 1, 0)`
- **Winning Color:** **`purple`** (`#app .text`).
- **Why the final `.text` (black) does not win:** Source order is ONLY evaluated when competing declarations have **equal specificity**. `#app .text` has an ID `(1, 1, 0)` which outranks `.text` `(0, 1, 0)` before order of appearance is considered.
</details>

---

### Challenge 11 — `!important`
**Given:**
```html
<div id="app" class="card">Hello</div>
```
```css
div { color: red; }
.card { color: blue !important; }
#app { color: green; }
```

**Task / Questions:**
1. Which selectors match?
2. What is the final color?
3. Why does it win?
4. At what stage does `!important` affect conflict resolution?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

- **Winning Color:** **`blue`**.
- **Why:** `!important` moves a declaration into the **Author Important** origin tier, which is evaluated before Normal declarations. Even though `#app` has higher specificity `(1, 0, 0)` than `.card` `(0, 1, 0)`, all Important declarations beat all Normal declarations.
- **Stage of Resolution:** Importance is checked at the Origin & Importance tier (Stage 2), long before Specificity (Stage 4) is evaluated.
</details>

---

### Challenge 12 — `!important` vs Specificity
**Given:**
```html
<button id="save" class="btn primary">Save</button>
```
```css
button { background: gray; }
.btn { background: blue !important; }
.primary { background: green !important; }
#save { background: purple !important; }
```

**Task / Questions:**
1. Separate normal and important declarations.
2. Which declaration is eliminated first?
3. Calculate specificity of the remaining declarations.
4. What is the final background?
5. Explain the complete decision.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Separate Normal & Important:**
   - Normal: `button` (gray).
   - Important: `.btn` (blue), `.primary` (green), `#save` (purple).
2. **Eliminated First:** `button` (gray) is eliminated because it lacks `!important`.
3. **Compare Specificity Among Remaining Important Rules:**
   - `.btn`: `(0, 1, 0)`
   - `.primary`: `(0, 1, 0)`
   - `#save`: `(1, 0, 0)`
4. **Final Background:** **`purple`**. When multiple declarations have `!important`, specificity resolves the conflict among them.
</details>

---

### Challenge 13 — Direct Declaration vs. Inheritance
**Given:**
```html
<div class="card">
  <h2 class="title">Heading</h2>
  <p>Description</p>
</div>
```
```css
.card { color: blue; }
.title { color: purple; }
```

**Task / Questions:**
1. What color does `.card` establish?
2. What color does `h2` use?
3. What color does `p` use?
4. Why doesn't `h2` use the inherited color?
5. What happens if `.title { color: purple }` is removed?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. `.card` establishes `color: blue` for the subtree.
2. `<h2>` uses **`purple`** (direct declaration via `.title`).
3. `<p>` uses **`blue`** (inherits from `.card`).
4. `<h2>` does not use inherited color because **any direct declaration on an element overrides inherited styles**.
5. If `.title { color: purple }` is removed, `<h2>` will inherit `blue` from `.card`.
</details>

---

### Challenge 14 — Full Cascade Challenge
**Given:**
```html
<div id="app">
  <section class="card featured">
    <p id="message" class="text highlight">Hello</p>
  </section>
</div>
```
```css
p { color: red; }                            /* Normal (0, 0, 1) */
.text { color: blue; }                       /* Normal (0, 1, 0) */
.highlight { color: orange; }                /* Normal (0, 1, 0) */
.card .text { color: green; }                /* Normal (0, 2, 0) */
.featured p { color: brown; }                /* Normal (0, 1, 1) */
#app .text { color: purple; }                /* Normal (1, 1, 0) */
#message { color: pink; }                    /* Normal (1, 0, 0) */
.text { color: black !important; }           /* Important (0, 1, 0) */
#message { color: cyan !important; }         /* Important (1, 0, 0) */
```

**Task / Questions:**
1. List all matching selectors.
2. Separate normal and important declarations.
3. Which declarations are eliminated?
4. Calculate specificity of the remaining declarations.
5. What is the final color?
6. Explain the entire cascade decision process.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Match All Selectors:** All 9 selectors match the target `<p>` element.
2. **Filter by Origin & Importance:**
   - Eliminate all 7 normal declarations (red, blue, orange, green, brown, purple, pink).
   - Retain the 2 important declarations:
     - `.text { color: black !important; }` $\rightarrow$ Specificity `(0, 1, 0)`
     - `#message { color: cyan !important; }` $\rightarrow$ Specificity `(1, 0, 0)`
3. **Compare Specificity of Important Declarations:**
   - `#message` `(1, 0, 0)` beats `.text` `(0, 1, 0)`.
4. **Final Color:** **`cyan`**.
</details>

---

### Challenge 15 — Source Order
**Given:**
```css
.text { color: red; }
.text { color: blue; }
.text { color: green; }
```

**Task / Questions:**
1. What is the specificity of each selector?
2. Which declaration wins?
3. Why?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Specificity:** All three have identical specificity `(0, 1, 0)`.
2. **Winner:** **`green`**.
3. **Why:** When specificity and origin are tied, the last declared rule in the stylesheet wins (Source Order).
</details>

---

### Challenge 16 — Source Order Mixed Test

**Task / Questions:**

#### Question 1
```css
.card { background: red; }
.card { background: blue; }
.card { background: green; }
```
- Specificity of each? Are they equal? Final background and why?

#### Question 2
```css
#app { color: green; }
.card { color: red; }
```
- Specificity of each? Which selector appears later? What is the final color for an element matching both? Why does source order not decide the result?

#### Question 3
```css
.card { color: red; padding: 20px; }
.card { color: blue; padding: 30px; margin: 20px; }
.card { color: green; }
```
- Final color? Final padding? Final margin? Which properties required conflict resolution?

#### Question 4
```css
.card.featured { border-color: red; }
.featured.card { border-color: blue; }
```
- Specificity of both? Final border color? Does changing HTML `class="card featured"` to `class="featured card"` change the result?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

- **Q1:** Specificity `(0, 1, 0)` for all three $\rightarrow$ **`green` wins** (source order).
- **Q2:** `#app` is `(1, 0, 0)`, `.card` is `(0, 1, 0)` $\rightarrow$ **`green` (#app) wins**. Source order is never evaluated because `#app` has higher specificity.
- **Q3:**
  - `color`: `green` (later declaration overrides red and blue).
  - `padding`: `30px` (later declaration overrides `20px`).
  - `margin`: `20px` (no competing margin declarations).
- **Q4:** Both selectors have specificity `(0, 2, 0)`. **`blue` (.featured.card) wins** by source order. Changing HTML class order has **zero impact**.
</details>

---

### Challenge 17 — Cascade Origins

**Task / Questions:**

#### Question 1
```text
User-agent CSS: p { color: black; }
Author CSS:     p { color: blue; }
```
- Which declarations compete? Which origin does each belong to? What is the final color and why?

#### Question 2
```html
<div id="app">
  <p>Hello</p>
</div>
```
```css
#app { color: red; }
p { color: blue; }
```
- Does `#app` directly apply to the `<p>`? Final color? Does specificity between `#app` and `p` decide this? Explain the role of direct declaration vs inheritance.

#### Question 3
```text
User CSS:   p { color: red; }
Author CSS: p { color: blue !important; }
```
- Final color? Why? Does specificity matter before importance and origin here?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

- **Q1:** **`blue` wins**. Author Normal outranks User-Agent Normal.
- **Q2:** **`blue` wins**. `p` is a direct declaration on the element, whereas `#app` is only inherited. Direct declarations always beat inheritance regardless of specificity.
- **Q3:** **`blue` wins**. Author `!important` outranks User Normal. Origin & Importance are resolved at Stage 2 before specificity.
</details>

---

### Challenge 18 — CSS-Wide Keyword: `initial`
**Given:**
```css
.parent {
  color: red;
  margin: 20px;
}
.child {
  color: initial;
  margin: initial;
}
```

**Task / Questions:**
1. What happens to `color`? Does it inherit `red`?
2. What happens to `margin`?
3. What does `initial` mean?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **`color: initial`**: Resets to official CSS spec default (`black` in browsers), **does not inherit red**.
2. **`margin: initial`**: Resets to `0px`.
3. **Definition:** `initial` explicitly sets the property to its official W3C specification initial default value.
</details>

---

### Challenge 19 — CSS-Wide Keyword: `inherit`
**Given:**
```css
.parent {
  color: blue;
  border: 3px solid red;
}
.child {
  color: inherit;
  border: inherit;
}
```

**Task / Questions:**
1. Final color of `.child`?
2. Final border of `.child`?
3. Does `border` normally inherit?
4. Why does `border: inherit` work?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Final color:** `blue` (inherits from parent).
2. **Final border:** `3px solid red`.
3. **Does border normally inherit?** No, box-model properties are non-inherited.
4. **Why `border: inherit` works:** The `inherit` keyword explicitly instructs the browser to copy the parent element's computed value.
</details>

---

### Challenge 20 — CSS-Wide Keyword: `unset`
**Given:**
```css
.parent {
  color: purple;
  margin: 20px;
}
.child {
  color: unset;
  margin: unset;
}
```

**Task / Questions:**
1. Final color?
2. Final margin?
3. Why do they behave differently?
4. What does `unset` mean for inherited vs non-inherited properties?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Final color:** `purple`.
2. **Final margin:** `0px`.
3. **Why they differ:** `unset` acts dynamically: if the property naturally inherits (`color`), it acts as `inherit`; if the property does not inherit (`margin`), it acts as `initial`.
</details>

---

### Challenge 21 — CSS-Wide Keyword: `revert`
**Given:**
```text
User-agent CSS: p { color: black; }
```
```css
p {
  color: red;
  color: blue;
  color: revert;
}
```

**Task / Questions:**
1. What author declarations exist before evaluating `revert`?
2. What does `color: revert` do?
3. What is the final color?
4. How is `revert` different from `initial`?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Author declarations:** `red` and `blue`.
2. **What `revert` does:** Rolls back author styles to the **User-Agent stylesheet default** (`black`), ignoring prior author declarations (`red`, `blue`).
3. **Final color:** `black`.
4. **Difference from `initial`:** `initial` resets to official CSS spec default, whereas `revert` resets to browser User-Agent stylesheet styles (e.g., `revert` on `display` for a `<div>` gives `block`, whereas `initial` gives `inline`).
</details>

---

### Challenge 22 — CSS-Wide Keyword: `revert-layer`
**Given:**
```css
@layer base {
  .btn { color: black; }
}

@layer components {
  .btn { color: blue; }
  .btn.reset { color: revert-layer; }
}
```
```html
<button class="btn reset">Save</button>
```

**Task / Questions:**
1. Which declarations are relevant?
2. What does `revert-layer` do?
3. What is the final color?
4. How is `revert-layer` different from `revert`?

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Relevant declarations:** `.btn` (black in `@layer base`), `.btn` (blue in `@layer components`), `.btn.reset` (revert-layer in `@layer components`).
2. **What `revert-layer` does:** Rolls back the property to the value established in the preceding cascade layer (`@layer base`).
3. **Final color:** **`black`**.
4. **Difference from `revert`:** `revert` rolls back all author layers all the way to the User-Agent stylesheet; `revert-layer` only rolls back to the previous `@layer` within author styles.
</details>

---

### Challenge 23 — Final KPI 1 Debugging Test

#### Scenario A: `h2.title`
```html
<div id="app">
  <section class="card featured">
    <h2 class="title">Dashboard</h2>
  </section>
</div>
```
```css
#app { color: red; }
.card { color: blue; }
.featured { color: green; }
.title { color: purple; }
```
**Questions:**
1. List all possible color sources.
2. Which declaration applies directly to `h2`?
3. Does inheritance determine the final result?
4. Final color and explanation?

#### Scenario B: `p#message.text.highlight`
```html
<div id="app">
  <section class="card">
    <p id="message" class="text highlight">Hello</p>
  </section>
</div>
```
```css
p { color: red; }
.text { color: orange; }
.highlight { color: yellow; }
.card .text { color: brown; }
#app .text { color: pink; }
#message { color: cyan !important; }
.text { color: black !important; }
```
**Questions:**
1. List all matching declarations.
2. Separate normal and important declarations.
3. Which declarations are eliminated and why?
4. Calculate specificity of the important declarations.
5. Final color and complete cascade decision?

#### Scenario C: `button.btn.primary.reset`
```html
<button class="btn primary reset">Save</button>
```
```css
.btn { color: blue; }
.primary { color: green; }
.btn.primary { color: orange; }
.reset { color: revert; }
```
*(User-agent stylesheet: `button { color: black; }`)*
**Questions:**
1. List all matching author declarations.
2. Before considering `revert`, which author declaration would win?
3. What does `color: revert` do here?
4. Which lower-priority declaration becomes relevant?
5. Final color and full decision process?

<details>
<summary>Complete Step-by-Step Breakdown for Scenario A, B, and C</summary>

- **Scenario A:**
  - Direct declaration: `.title` targets `h2` directly with specificity `(0, 1, 0)`.
  - Ancestor rules (`#app`, `.card`, `.featured`) rely on inheritance.
  - **Final Color:** **`purple`**. Direct declaration always overrides inherited styles.
- **Scenario B:**
  - Normal declarations (red, orange, yellow, brown, pink) are eliminated by `!important`.
  - Compare important: `#message` `(1, 0, 0)` vs `.text` `(0, 1, 0)`.
  - **Final Color:** **`cyan`**.
- **Scenario C:**
  - Without `revert`, `.btn.primary` `(0, 2, 0)` would win.
  - `.reset { color: revert; }` `(0, 1, 0)` wins the author cascade for `.reset`.
  - `color: revert` rolls back author-origin styles and pulls from User-Agent (`button { color: black; }`).
  - **Final Color:** **`black`**.
</details>

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### 1. The Component Override Dilemma & `tailwind-merge` (`cn` Helper)
In React component engineering, consumers frequently attempt to override default styles:

```tsx
// ❌ Buggy React Component Pattern
export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const baseStyles = "px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700";
  return <button className={`${baseStyles} ${className}`} {...props} />;
}

// Consumer Call:
<Button className="bg-red-600" />
```

#### The Senior Cascade Breakdown
- **The Issue:** The button rendered background often remains **blue** instead of red.
- **Why:** In pure CSS, `bg-blue-600` and `bg-red-600` have identical specificity `(0, 1, 0)`. The CSS Cascade resolves ties by **order of appearance in the compiled CSS bundle**, NOT the order classes appear in the JSX string. If `.bg-blue-600` was emitted after `.bg-red-600` in the CSS build, blue wins unconditionally.
- **The Senior Solution (`cn` Utility in shadcn/ui):**
  ```tsx
  import { clsx, type ClassValue } from 'clsx';
  import { twMerge } from 'tailwind-merge';

  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }

  // ✅ Production Safe Button:
  export function Button({ className, ...props }: ButtonProps) {
    return (
      <button 
        className={cn("px-4 py-2 rounded-lg text-white bg-blue-600", className)} 
        {...props} 
      />
    );
  }
  ```
  `tailwind-merge` understands Tailwind's internal class hierarchy and removes conflicting declarations (`bg-blue-600` is surgically deleted from the DOM string when `bg-red-600` is passed).

---

### 2. Design System Specificity Inversion with `@layer`
When building or consuming component libraries (e.g. Radix UI, Headless UI, Tailwind v4), CSS cascade layers guarantee consumers can override library styles without resorting to `!important`:

```css
/* Design System Core (Priority: Low) */
@layer base, components, utilities;

@layer components {
  .ui-dialog {
    background: white;
    padding: 2rem;
    border-radius: 12px;
  }
}

/* Application / Consumer Layer (Priority: High) */
@layer utilities {
  .p-4 { padding: 1rem; } /* Easily overrides .ui-dialog padding */
}
```

---

## Key Takeaways
1. **Direct Declaration > Inheritance:** Even an element selector (`p`) directly targeting a node beats an ID selector (`#parent`) on an ancestor.
2. **Specificity Vector:** Specificity is calculated as `(Inline, IDs, Classes/Attr/Pseudo-classes, Elements/Pseudo-elements)`. Columns are evaluated strictly from left to right.
3. **HTML Class Order Irrelevant:** Order of classes in the HTML `class=""` attribute has zero impact on specificity or source order.
4. **`:nth-child(n)` checks DOM position first:** It checks if the $n$-th child matches the selector, NOT the $n$-th matching element.
5. **`!important` reverses the Cascade Hierarchy:** Important declarations belong to a higher origin tier; specificity only resolves ties among declarations *within the same importance tier*.
6. **React Component Overrides Require Class Merging:** In utility CSS, specificity ties resolve by bundle order; always use `tailwind-merge` (`cn()`) for component props.
7. **CSS-Wide Keywords:**
   - `inherit`: Forces inheritance from parent.
   - `initial`: Resets to official CSS spec default.
   - `unset`: `inherit` for inherited properties, `initial` for non-inherited.
   - `revert`: Rolls back to browser User-Agent stylesheet defaults.
   - `revert-layer`: Rolls back to the previous `@layer`.

---

[📚 CSS Engineering Roadmap](./README.md) | [KPI 02 — Box Model & Sizing ➡️](./02-box-model-sizing.md)

