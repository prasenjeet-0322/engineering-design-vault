# KPI 4 — CSS Typography

[⬅️ KPI 03 — Units & Values](./03-units-values.md) | [📚 CSS Index](./README.md) | [KPI 05 — Colors & Backgrounds ➡️](./05-colors-backgrounds-visual-effects.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Property / Rule | Value Type / Syntax | Default | Production Best Practice |
|---|---|---|---|
| **`font-family`** | `"CustomFont", SystemFallback, sans-serif` | User-Agent | Always conclude font stacks with a generic family (`sans-serif`, `serif`, `monospace`). |
| **`line-height`** | Unitless multiplier (e.g. `1.5`, `1.2`) | `normal` (~1.2) | **Always use unitless values**. Headings: `1.1`–`1.25`; Body copy: `1.5`–`1.7`. |
| **Single-Line Truncate** | `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` | `normal` | Tripartite recipe: all 3 properties are required to produce `...` truncation. |
| **`font-display`** | `swap` \| `optional` \| `block` \| `fallback` | `auto` | Use `swap` for body text (fastest readability); `optional` for zero layout shift (CLS = 0). |
| **Text Wrapping** | `overflow-wrap: break-word;` | `normal` | Prevents long URLs or unbroken strings from blowing out mobile container boundaries. |
| **Accessible Casing** | `text-transform: uppercase; letter-spacing: 0.05em;` | `none` | Keep normal casing in HTML; apply uppercase & tracking in CSS to preserve screen reader UX. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: Unitless `line-height` vs. Percentage / Length
> **Question:** *"Why is `body { line-height: 1.5; }` standard across design systems, but `body { line-height: 150%; }` or `body { line-height: 24px; }` causes overlapping text bugs?"*  
> **Answer:**  
> - When you declare a percentage or pixel value (`line-height: 150%` or `24px`) on `body` (with `font-size: 16px`), the browser calculates a **fixed pixel height of `24px`** and **inherits that computed `24px` down the entire tree**. When a child heading has `font-size: 48px`, its line height remains stuck at `24px`, causing multi-line heading text to violently collide!  
> - With **unitless `line-height: 1.5`**, the *multiplier itself* inherits. The child heading computes $48\text{px} \times 1.5 = \mathbf{72px}$, scaling proportionally and preventing layout collisions!

---

## Overview
This document serves as the master engineering reference for CSS Typography Systems, Typefaces & Font Stacks, Sizing & Hierarchy, Vertical Rhythm (`line-height`), Character Spacing (`letter-spacing`), Text Alignment & Transformation, Text Wrapping & Truncation (`white-space`, `overflow-wrap`, `text-overflow`), Web Font Formats, Loading Optimization & Performance (FOIT, FOUT, `font-display`), Variable Fonts, and Responsive Fluid Typography.

---

## Goal & Central Architectural Question
By the end of KPI 4, you should be able to build a **consistent, readable, responsive typography system** instead of styling individual headings, paragraphs, and labels in isolation.

> **The Central Engineering Question:**  
> Which font should I use, how does it load, how does it affect layout, what controls readability, and how should typography scale predictably across an entire application?

---

## 🧭 Industry Frequency & Framework (Tailwind) Relevance

| Badge | Industry Frequency | Relevance in Tailwind / Modern Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of projects | `font-*`, `text-*`, `leading-*`, `tracking-*`, `truncate`, `next/font` | Must master intuitively; foundational for all UI text, headings, buttons, and tokens. |
| 🟡 **Moderate** | Used in ~30% of layouts | `break-words`, `hyphens-auto`, `font-display: swap`, Variable Fonts | Crucial for data tables, internationalized text (RTL/LTR), and performance optimization. |
| 🔵 **Foundational** | Handled by bundlers/tools | WOFF2 font loading lifecycle, FOIT/FOUT font metric matching (`size-adjust`) | Critical for Core Web Vitals (CLS), technical interviews, and web performance audits. |

---

## Core Concepts (20 Subtopics)

### Part 1 — `font-family` and Font Stacks `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `font-sans`, `font-serif`, `font-mono`.

#### Definition & Mechanics
`font-family` defines which typeface the browser should render. A **Font Stack** is a prioritized fallback list evaluated from left to right:

```css
body {
  font-family: "Inter", Arial, sans-serif;
}
```

```text
Check: "Inter" available locally or loaded?
    ↓ Yes ──► Render "Inter"
    ↓ No
Check: "Arial" pre-installed on OS?
    ↓ Yes ──► Render "Arial"
    ↓ No
Fallback: OS Default "sans-serif"
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use:** Every production application must declare a prioritized font stack on `body` or `:root`.
- **❌ When NOT to Use:** Never specify a single isolated web font without fallbacks (`font-family: "CustomFont";`). If the CDN drops or network lags, browser defaults to an unpredictable serif.
- **⚠️ Bottlenecks & Tradeoffs:** Long font stacks with wildly different letter widths cause severe Cumulative Layout Shift (CLS) when custom fonts replace fallback fonts.
- **🚀 Modern Leverages:** In Next.js, use `next/font` which automatically generates matched fallback font definitions (`size-adjust`, `ascent-override`) to guarantee zero layout shift.

---

### Part 2 — Generic Font Families `🟢 [Daily Driver]`

#### Definition & Mechanics
Standardized W3C generic fallback categories mapped to the user's operating system:

| Generic Family | Visual Character | Production Role | Common OS Mapping |
|---|---|---|---|
| **`sans-serif`** | Clean glyphs without strokes | Modern SaaS, web apps, dashboards | Apple: San Francisco, Windows: Segoe UI, Android: Roboto |
| **`serif`** | Traditional glyphs with finishing strokes | Editorial articles, books, legal documents | Times New Roman, Georgia |
| **`monospace`** | Fixed-width characters (equal horizontal pitch) | Code blocks, terminal outputs, financial data | Fira Code, Courier, Menlo |
| **`system-ui`** | Native OS interface typeface | Zero-payload native app look and feel | Native OS UI engine |

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use `system-ui`:** High-performance dashboard apps (Linear, GitHub, internal tools) where **instant 0ms render speed, 0 KB font payload, and zero FOIT/FOUT** are prioritized over custom marketing branding.
- **❌ When NOT to Use `cursive` / `fantasy`:** Unreliable cross-platform rendering; renders completely different typefaces on Windows vs iOS.

---

### Part 3 — `font-size` & Fluid Typography `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `text-sm` (0.875rem), `text-base` (1rem), `text-xl` (1.25rem), `text-4xl` (2.25rem).

#### Definition & Mechanics
Controls text glyph height. Modern architectures use `rem` for system scaling and `clamp()` for fluid responsive titles:

```css
/* Accessible Base Scale */
p { font-size: 1rem; }

/* Fluid Responsive Heading */
h1 { font-size: clamp(2rem, 4vw + 1rem, 4.5rem); }
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use `clamp()`:** Hero headings, landing page titles, and marketing headers that need to scale smoothly from mobile ($360\text{px}$) to ultra-wide displays ($1920\text{px}+$ ) without rigid media query breakpoints.
- **❌ When NOT to Use Raw `vw` (`font-size: 5vw`):** Unbounded viewport text becomes unreadable on small phones ($320\text{px} \rightarrow 16\text{px}$) and cartoonishly huge on 4K screens ($3840\text{px} \rightarrow 192\text{px}$).
- **❌ When NOT to Use `px`:** Hardcoding `font-size: 16px` on body breaks user browser accessibility font-scaling for visually impaired users.
- **🚀 Modern Leverages:** Pair `clamp()` with a `rem` base (`clamp(2rem, 4vw + 1rem, 5rem)`) so the preferred value honors accessibility font zooms.

---

### Part 4 — `font-weight` & Faux-Bold Hazards `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `font-light` (300), `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700).

#### Definition & Mechanics
Controls glyph stroke thickness (`100` to `900`).

```css
.badge { font-weight: 600; }
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use:** Establish visual hierarchy (e.g. `700 Bold` for section headings, `500 Medium` for form labels, `400 Regular` for body copy).
- **❌ When NOT to Use Missing Weights:** If your `@font-face` only imports weights `400` and `700`, declaring `font-weight: 600` or `300` forces the browser engine to synthesize **"Faux Bold"** (blurring and smearing letter shapes).
- **⚠️ Bottlenecks:** Every static font weight requires a separate $\approx 25\text{KB}$ WOFF2 file download. Loading 6 static weights adds $150\text{KB}$ of network bloat.
- **🚀 Modern Leverages:** Use a **Variable Font** (`font-weight: 100 900`) to get every numeric weight from a single optimized file.

---

### Part 5 — `line-height` & Vertical Rhythm `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `leading-none` (1), `leading-tight` (1.25), `leading-normal` (1.5), `leading-relaxed` (1.625).

#### Definition & Mechanics
Controls line box height and vertical reading distance. Always declare as a **unitless multiplier**:

```css
h1 { line-height: 1.15; } /* Tight leading for large headings */
p  { line-height: 1.6; }  /* Relaxed leading for body paragraphs */
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use Unitless Values:** Always. Unitless multipliers inherit proportionally as a ratio ($1.5 \times \text{local font-size}$), preventing child collisions.
- **❌ When NOT to Use Percentages / Pixels on Root (`line-height: 150%` / `24px`):** Fixed numbers compute once on `body` ($16\text{px} \times 1.5 = 24\text{px}$) and pass $24\text{px}$ down to all children. When an `h1` has `font-size: 48px`, its line-height stays locked at $24\text{px}$, causing text lines to overlap!
- **⚠️ Tradeoff:** Too tight line-height ($<1.3$ on body) creates eye strain; too loose line-height ($>1.8$) disassociates paragraphs into floating disconnected lines.

---

### Part 6 — `letter-spacing` (Tracking) `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `tracking-tighter` (-0.05em), `tracking-normal` (0), `tracking-wide` (0.025em), `tracking-widest` (0.1em).

#### Definition & Mechanics
Controls horizontal whitespace between characters using relative `em` units:

```css
.pill-badge {
  text-transform: uppercase;
  letter-spacing: 0.08em; /* Essential clarity for uppercase */
}
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use:**
  - Positive tracking (`+0.05em` to `+0.1em`) on **small uppercase text, tags, and micro-labels** to prevent letterforms blending together.
  - Slight negative tracking (`-0.02em` to `-0.04em`) on **oversized bold display headings** ($>48\text{px}$) for tight, punchy visual balance.
- **❌ When NOT to Use:** Never add wide tracking to normal lowercase body copy—it disrupts word recognition and slows reading speed.

---

### Part 7 — `word-spacing` `🔵 [Foundational]`
#### Definition & Mechanics
Adjusts whitespace between full words (`word-spacing: 2px`).
- **Production Role:** Rarely used in design systems. Useful only in narrow editorial/typesetting contexts or custom justification layouts.

---

### Part 8 — `text-align` & Bidirectional i18n `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `text-start`, `text-end`, `text-center`, `text-justify`.

#### Definition & Mechanics
Aligns inline content within its parent block:

```css
.card-content {
  text-align: start; /* Automatically adapts: Left in English/LTR, Right in Arabic/RTL */
}
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use Logical `start` / `end`:** Always prefer `text-align: start` over `text-align: left` in internationalized (i18n) applications.
- **❌ When NOT to Use `text-align: justify` on Web:** CSS justification creates "rivers of whitespace" across paragraphs and lacks sophisticated hyphenation engines, making web text ugly and hard to scan.

---

### Part 9 — `text-transform` & Screen-Reader UX `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `uppercase`, `lowercase`, `capitalize`, `normal-case`.

#### Definition & Mechanics
Alters visual casing presentation without altering the underlying HTML text string.

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use:** Badges, navigation menus, and category pills that require uppercase styling.
- **❌ When NOT to Write Raw All-Caps in HTML (`<button>SUBMIT</button>`):** Screen readers (JAWS, VoiceOver) frequently misinterpret all-caps text as acronyms and read them letter-by-letter ("S-U-B-M-I-T").
- **🚀 The Senior Pattern:** Write semantic text in JSX (`<button>Submit</button>`) and apply CSS `text-transform: uppercase;`.

---

### Part 10 — `text-decoration` & Modern Polish `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `underline`, `no-underline`, `underline-offset-4`, `decoration-blue-500`.

#### Definition & Mechanics
Controls text embellishments:

```css
a.inline-link {
  text-decoration-line: underline;
  text-decoration-color: #3b82f6;
  text-underline-offset: 4px; /* Essential polish: clears descenders */
  text-decoration-thickness: 1.5px;
}
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use `text-underline-offset`:** Always add `text-underline-offset: 3px` or `4px` to links so the underline does not awkwardly cut through descending letters (`g`, `y`, `p`, `j`).
- **❌ When NOT to Remove Link Underlines Without Replacement:** Removing underlines (`text-decoration: none`) without a high-contrast color change violates WCAG 2.1 AA accessibility guidelines.

---

### Part 11 — Text Wrapping Primitives `🟡 [Moderate / Context-Specific]`
> **Tailwind Equivalent:** `whitespace-nowrap`, `break-words` (`overflow-wrap`), `break-all` (`word-break`), `hyphens-auto`.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        TEXT WRAPPING COMPARISON                        │
├───────────────────┬────────────────────────────────────────────────────┤
│ white-space       │ nowrap: Forces everything onto 1 horizontal line   │
├───────────────────┼────────────────────────────────────────────────────┤
│ overflow-wrap     │ break-word / anywhere: Breaks only oversized words │
├───────────────────┼────────────────────────────────────────────────────┤
│ word-break        │ break-all: Breaks ANY word at ANY letter boundary  │
├───────────────────┼────────────────────────────────────────────────────┤
│ hyphens           │ auto: Inserts dictionary syllable hyphens (e.g. -) │
└───────────────────┴────────────────────────────────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use `overflow-wrap: break-word` (or `anywhere`):** User-generated comments, chat message bubbles, article prose, and dynamic card headers containing long URLs or filenames.
- **✅ When to Use `word-break: break-all`:** ONLY in narrow technical columns (crypto wallet hashes `0x71C...`, Git commit SHAs, file paths).
- **❌ When NOT to Use `word-break: break-all`:** Never use on standard body copy (breaks normal words across lines without hyphens).

---

### Part 12 — Text Overflow & Truncation `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `truncate` (single-line), `line-clamp-2`, `line-clamp-3` (multi-line).

#### The Single-Line Truncate Recipe
```css
.single-line-truncate {
  white-space: nowrap;      /* 1. Stop line wrapping */
  overflow: hidden;          /* 2. Clip overflow */
  text-overflow: ellipsis;   /* 3. Render '...' */
}
```

#### The Multi-Line Clamp Recipe
```css
.multi-line-truncate {
  display: -webkit-box;
  -webkit-line-clamp: 3;     /* Number of lines before truncating */
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use Single-Line:** User table rows, breadcrumb pills, dropdown select options.
- **✅ When to Use Multi-Line `line-clamp-N`:** Blog article card previews, customer testimonials, product descriptions.
- **⚠️ Trap:** `text-overflow: ellipsis` has zero effect without `white-space: nowrap` and `overflow: hidden`.

---

### Parts 13 & 14 — Web Fonts & Formats (WOFF2) `🟢 [Daily Driver]`

#### Definition & Mechanics
- **`WOFF2` (Web Open Font Format 2):** Uses Brotli compression ($30\%\text{--}50\%$ smaller payloads than WOFF/TTF). Supported by $>97\%$ of browsers.

```css
@font-face {
  font-family: "Geist";
  src: url("/fonts/geist.woff2") format("woff2");
  font-weight: 100 900;
  font-display: swap;
}
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use:** Always ship `WOFF2` as the primary web font asset.
- **❌ When NOT to Serve Raw `.ttf` or `.otf` to Web Clients:** Uncompressed desktop font files waste mobile user bandwidth ($500\text{KB}+$ vs $30\text{KB}$ WOFF2).

---

### Parts 15 & 16 — Font Loading Strategies (`font-display`) `🟡 [Moderate / Performance]`

```text
                     font-display: swap vs optional
┌──────────────────────────────────────┬──────────────────────────────────────┐
│ font-display: swap                   │ font-display: optional               │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ 1. Show fallback font immediately    │ 1. 100ms window to load font         │
│ 2. Swap when custom font loads       │ 2. If missed: Keep fallback forever! │
│ ⚠️ Risk: FOUT & Layout Shift (CLS)   │ 🚀 Benefit: ZERO Layout Shift (CLS=0)│
└──────────────────────────────────────┴──────────────────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use `swap`:** Content-first sites (blogs, documentation, news) where reading text immediately is paramount.
- **✅ When to Use `optional`:** High-traffic e-commerce landing pages and mobile web apps where **Core Web Vitals (CLS = 0)** and performance take absolute priority.
- **❌ When NOT to Use `block` on Body Copy:** Hides text for up to 3 seconds on slow connections (FOIT blank screen). Use `block` only for icon fonts where fallback text would look corrupted.

---

### Part 17 — Variable Fonts vs. Static Files `🟡 [Moderate]`

#### ⚖️ Senior Engineering Decision Matrix
- **✅ When to Use Variable Fonts:** When a design system utilizes **3 or more font weights/styles** (`400`, `500`, `600`, `700`, `italic`). One $\approx 110\text{KB}$ variable font replaces 5 separate $\approx 25\text{KB}$ static files and eliminates multiple HTTP connection round-trips.
- **❌ When NOT to Use Variable Fonts:** Simple landing pages or microsites that only use **1 single weight** (`400 Regular`). Loading a $110\text{KB}$ variable file for 1 weight is wasteful compared to a single $25\text{KB}$ static WOFF2 file.

---

### Part 18 — Building a Design System Typography Scale `🟢 [Daily Driver]`
Establish mathematical design tokens in CSS variables:

```css
:root {
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
}
```

---

### Part 19 — Responsive & Fluid Typography `🟢 [Daily Driver]`
```css
h1 {
  font-size: clamp(2rem, 4vw + 1rem, 4.5rem);
  line-height: 1.15;
}
```

---

### Part 20 — Typography Debugging Diagnostic Framework `🧭 [Decision Framework]`

```text
Text Looks Broken or Misaligned?
        │
        ├─► Wrong typeface rendered? ────────────► Check font-family stack & network @font-face
        ├─► Text stroke too light/heavy? ────────► Verify supported font-weight files (no faux-bold)
        ├─► Lines colliding or spaced out? ──────► Check unitless line-height (h1: ~1.1, body: ~1.5)
        ├─► Line length exhausting to read? ────► Constrain container with max-width: 65ch
        ├─► Text blowing out container width? ───► Apply overflow-wrap: break-word or truncate
        ├─► Ellipsis ('...') not showing? ───────► Verify nowrap + overflow:hidden + text-overflow
        └─► Page jumping during font load? ──────► Optimize font-display (swap/optional) & size-adjust
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### 1. Modern Next.js Font Architecture (`next/font`)
In Next.js 14/15 App Router, manual `@font-face` declarations are replaced by `next/font`, which automatically self-hosts Google Fonts, eliminates render-blocking network calls, and **guarantees zero Cumulative Layout Shift (CLS)**:

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable)}>
      <body className="font-sans antialiased bg-slate-950 text-slate-50">
        {children}
      </body>
    </html>
  );
}
```

---

### 2. Multi-Line Clamping in React Component Cards
Single-line truncation uses `text-overflow: ellipsis`. For multi-line description text (e.g. blog post previews, product cards), use CSS line-clamp:

```tsx
export function ArticleCard({ title, excerpt }: { title: string; excerpt: string }) {
  return (
    <article className="p-6 rounded-2xl border bg-slate-900">
      <h3 className="text-xl font-bold truncate">{title}</h3>
      {/* Multi-line clamp: Clamps to exactly 3 lines with '...' */}
      <p className="mt-2 text-slate-400 line-clamp-3 leading-relaxed">
        {excerpt}
      </p>
    </article>
  );
}
```

---

### 3. Accessible Screen-Reader Casing Pattern
```tsx
// ❌ Bad for Screen Readers (Announces "S-A-V-E D-R-A-F-T")
<button>SAVE DRAFT</button>

// ✅ Accessible Senior Pattern (Announces "Save Draft", Renders "SAVE DRAFT")
<button className="uppercase tracking-wider font-semibold text-xs">
  Save Draft
</button>
```

---

## Complete KPI 4 Challenges & Step-by-Step Solutions

### Challenge 1 — Font Stack
**Given:**
```css
.text {
  font-family: "Inter", Arial, sans-serif;
}
```
*(Assume: `Inter` is unavailable, `Arial` is available)*

**Task / Questions:**
1. Which font is used?
2. What happens if Arial is also unavailable?
3. Why should a font stack usually include a generic font family?

**Expected Understanding:**
Left-to-right font fallback evaluation and generic family safety net.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Font Used:** **`Arial`** (browser skips unavailable `Inter` and takes the first available match).
2. **If Arial is unavailable:** The browser falls back to the system's default **`sans-serif`** generic typeface (e.g. Helvetica, Roboto, Segoe UI).
3. **Why generic families are essential:** Prevents the browser from arbitrarily falling back to an incompatible category (such as a serif font like Times New Roman) if all custom and system names fail.
</details>

---

### Challenge 2 — `em`, `rem`, and Typography
**Given:**
```css
html {
  font-size: 16px;
}

.card {
  font-size: 20px;
}

.card h2 {
  font-size: 2em;
  line-height: 1.2;
}

.card p {
  font-size: 1rem;
  line-height: 150%;
}
```

**Task / Questions:**
1. What is the `h2` font size?
2. What is the `h2` computed line height?
3. What is the paragraph font size?
4. What is the paragraph computed line height?
5. Why does `2em` use a different reference than `1rem` here?

**Expected Understanding:**
`em` references inherited parent font-size; `rem` references root `<html>`; unitless multiplier and percentage line-height calculations.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **`h2` Font Size:**
   $$\text{Inherited parent (.card = 20px)} \times 2\text{em} = 20 \times 2 = \mathbf{40px}$$
2. **`h2` Computed Line Height:**
   $$\text{Element Font (40px)} \times 1.2 = \mathbf{48px}$$
3. **Paragraph Font Size:**
   $$\text{Root Font (html = 16px)} \times 1\text{rem} = \mathbf{16px}$$
4. **Paragraph Computed Line Height:**
   $$\text{Element Font (16px)} \times 150\% = 16 \times 1.5 = \mathbf{24px}$$
5. **Reference Difference:** `2em` evaluates against the immediate parent's font size (`.card` = `20px`), whereas `1rem` bypasses all ancestors and resolves strictly against root `<html>` (`16px`).
</details>

---

### Challenge 3 — Font Weight Debugging
**Given:**
A font only provides real weights `400` and `700`.
```css
.title {
  font-weight: 600;
}
```

**Task / Questions:**
1. Does this guarantee that a real 600-weight font file exists?
2. What might the browser do?
3. Why should you check which weights a web font actually provides?

**Expected Understanding:**
Font weight fallback synthesis vs real font glyph files.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Guaranteed 600 weight?** **No.** Declaring a numeric weight in CSS does not generate or load non-existent font files.
2. **What the browser does:** The browser applies its font-weight matching algorithm—it will either snap to the closest available loaded weight (`700` or `400`) or attempt synthetic faux-bold rendering (which distorts typography geometry).
3. **Why check available weights:** To avoid blurry/distorted faux weights and ensure design fidelity matches loaded network assets.
</details>

---

### Challenge 4 — Text Wrapping
**Given:**
```css
.title {
  white-space: nowrap;
}
```
*(The container becomes narrower than the title)*

**Task / Questions:**
1. What happens to normal line wrapping?
2. What potential problem can occur?
3. What property could allow long words or strings to break when appropriate?
4. Why might `word-break: break-all` be a poor default choice?

**Expected Understanding:**
Line break suppression, container overflow, and safe word breaking.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Normal line wrapping:** Completely suppressed; text is forced onto a single horizontal line.
2. **Potential problem:** Text will physically overflow and spill outside its container or trigger unwanted horizontal page scrollbars.
3. **Property to allow safe breaking:** `overflow-wrap: break-word;` (or `overflow-wrap: anywhere;`).
4. **Why `word-break: break-all` is poor for body copy:** It breaks words at random character boundaries regardless of English hyphenation rules, making sentences difficult to read.
</details>

---

### Challenge 5 — Single-Line Ellipsis Recipe

**Task / Questions:**
Complete the CSS declarations for a title that stays on one line and shows an ellipsis when truncated:
```css
.title {
  /* Complete this */
}
```
1. Write the 3 required declarations.
2. Explain the exact role of each declaration.

**Expected Understanding:**
The tripartite requirement for CSS single-line truncation.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

```css
.title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```
- **`white-space: nowrap`:** Prevents the text from wrapping onto a second line.
- **`overflow: hidden`:** Clips the portion of text extending beyond the container boundary.
- **`text-overflow: ellipsis`:** Renders the `...` truncation indicator where the text is clipped.
</details>

---

### Challenge 6 — `text-align` and Logical Direction

**Task / Questions:**
1. What does `text-align: start` mean?
2. How is it different from `text-align: left`?
3. Why can `start` and `end` be useful in internationalized interfaces?

**Expected Understanding:**
Logical properties and bidirectional (LTR vs RTL) typography.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **`text-align: start`:** Aligns text to the inline starting edge according to the active writing mode/direction.
2. **Difference from `left`:** `left` is physically hardcoded to the left side regardless of language; `start` dynamically shifts (left in LTR languages like English, right in RTL languages like Arabic or Hebrew).
3. **Why useful in i18n:** Enables automatic right-to-left layout adaptation without writing separate CSS overrides or conditional classes.
</details>

---

### Challenge 7 — `text-transform`
**Given:**
```html
<p class="label">premium plan</p>
```
```css
.label {
  text-transform: uppercase;
}
```

**Task / Questions:**
1. How is the text displayed visually?
2. Does this change the original HTML text?
3. Give one realistic UI use case for `text-transform: uppercase`.
4. What readability issue can occur if large blocks of body text are forced into uppercase?

**Expected Understanding:**
Presentation vs DOM content, accessibility, and reading ergonomics.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Visual Display:** **`PREMIUM PLAN`**
2. **Changes HTML content?** **No.** The underlying text remains lowercase `"premium plan"` in the DOM, for copy-paste operations, and for SEO indexing.
3. **Realistic UI use case:** Category tags, badge pills, table column headers, or short navigation links.
4. **Readability issue with body text:** All-caps text removes distinct letter ascenders and descenders (word shapes), reducing reading speed and creating severe visual fatigue.
</details>

---

### Challenge 8 — Font Loading & Layout Shifts

**Task / Questions:**
1. What phenomenon is it when fallback text is displayed and later swapped for the custom font?
2. What layout problem can happen when the font changes?
3. What does `font-display: swap` generally do?
4. Why is a visually compatible fallback font useful?

**Expected Understanding:**
FOUT, Cumulative Layout Shift (CLS), and font-display optimization.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Phenomenon Name:** **FOUT** (Flash of Unstyled Text).
2. **Layout problem:** **Layout Shift / Cumulative Layout Shift (CLS)**. If the custom font has different x-height or letter widths than the fallback font, paragraphs will re-wrap and push surrounding elements down the page.
3. **What `font-display: swap` does:** Instructs the browser to render the fallback font immediately with zero delay, and swap in the custom font as soon as it finishes downloading.
4. **Why compatible fallbacks matter:** Choosing a fallback font with similar metric dimensions minimizes visual jumping and prevents CLS penalties in Google Core Web Vitals.
</details>

---

### Challenge 9 — Variable Fonts

**Task / Questions:**
1. What is the main difference between static fonts and variable fonts?
2. What does the `wght` axis control?
3. What does the `wdth` axis control?
4. Why should you not assume every variable font supports every axis?
5. Give one major advantage of using a variable font.

**Expected Understanding:**
Continuous variation axes, single-file efficiency, and variable font limitations.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Main difference:** Static fonts require separate binary files for each weight/style (`Regular.woff2`, `Bold.woff2`), whereas a variable font packs an entire multi-dimensional design continuum into a single file.
2. **`wght` Axis:** Controls continuous **font weight / stroke thickness** (e.g. `100` to `900`).
3. **`wdth` Axis:** Controls **font width / horizontal compression** (condensed vs expanded).
4. **Why not assume all axes:** Font designers choose which axes to build into their font; some variable fonts only include `wght`, while others support `wdth`, `slnt`, `ital`, or custom axes.
5. **Major advantage:** Delivers infinite stylistic weights and optical sizing with fewer HTTP network requests and smaller total payload size.
</details>

---

### Challenge 10 — Typography Production Decision Test

**Task / Questions:**
Choose the best approach and explain why:
1. **A body text container should avoid excessively long lines:** (`width: 100%`, `max-width: 65ch`, `font-size: 5vw`, `white-space: nowrap`).
2. **A hero heading should scale fluidly but stay within readable limits.**
3. **A small uppercase UI label needs slightly more visual spacing between letters.**
4. **A button label must remain on one line, but if it becomes too long, the UI should indicate truncation.**
5. **Your custom font fails to load. What prevents the browser from being left without an appropriate font choice?**
6. **A design system has inconsistent heading sizes across 50 components. What architectural approach should you use?**

**Expected Understanding:**
Translating real-world design requirements into production CSS typography primitives.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **`max-width: 65ch`:** Directly constrains line length to ~65 characters for optimal reading ergonomics.
2. **`font-size: clamp(min, preferred, max)`** (e.g. `clamp(2rem, 5vw + 1rem, 4.5rem)`): Smooth viewport scaling bounded by minimum and maximum safety limits.
3. **`letter-spacing: [N]em`** (e.g. `letter-spacing: 0.05em`): Adds tracking breathing room.
4. **`white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`**: Standard single-line truncation recipe.
5. **A well-structured font stack ending in a generic family** (e.g. `Inter, Arial, sans-serif`).
6. **A centralized Design Token Scale in CSS variables** (e.g. `--text-h1`, `--text-h2`, `--text-base`) mapped through Tailwind or CSS classes.
</details>

---

### Challenge 11 — Final Comprehensive Typography Debugging Test
**Given:**
```css
html {
  font-size: 16px;
}

body {
  font-family: "Inter", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
}

.article {
  max-width: 65ch;
}

.article h1 {
  font-size: clamp(2rem, 5vw, 5rem);
  line-height: 1.1;
}

.article p {
  font-size: 1.125rem;
  line-height: 1.7;
}

.button-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```
*(Assume Viewport: `1000px` width. `Inter` fails to load. Width of `0` in Arial is `8px`)*

**Task / Questions:**
1. Which font does `body` use?
2. What is the body font size?
3. What is the body's computed line height?
4. What maximum width does `65ch` represent under the given assumption?
5. What is the preferred `h1` font size from `5vw`?
6. What is the final `h1` font size after `clamp()`?
7. What is the `h1` computed line height?
8. What is the paragraph font size?
9. What is the paragraph computed line height?
10. What happens when `.button-text` does not fit in its available width?
11. Which three properties work together to create that behavior?

**Expected Understanding:**
Comprehensive evaluation of font stacks, line-height multipliers, `clamp()`, `ch` width metrics, and truncation recipes.

<details>
<summary>Solution & Step-by-Step Breakdown</summary>

1. **Font Used by `body`:** **`Arial`** (`Inter` failed to load).
2. **Body Font Size:** $1\text{rem} = \mathbf{16px}$.
3. **Body Computed Line Height:** $16\text{px} \times 1.5 = \mathbf{24px}$.
4. **`65ch` Maximum Width:** $65 \times 8\text{px} = \mathbf{520px}$.
5. **Preferred `h1` from `5vw`:** $5\% \times 1000\text{px} = \mathbf{50px}$.
6. **Final `h1` Font Size:**
   - Min: $2\text{rem} = 32\text{px}$
   - Preferred: $50\text{px}$
   - Max: $5\text{rem} = 80\text{px}$
   - $\text{clamp}(32\text{px}, 50\text{px}, 80\text{px}) = \mathbf{50px}$.
7. **`h1` Computed Line Height:** $50\text{px} \times 1.1 = \mathbf{55px}$.
8. **Paragraph Font Size:** $1.125\text{rem} = 1.125 \times 16\text{px} = \mathbf{18px}$.
9. **Paragraph Computed Line Height:** $18\text{px} \times 1.7 = \mathbf{30.6px}$.
10. **Behavior of `.button-text`:** Text stays on a single line; overflowing content is hidden and replaced with `...` (ellipsis).
11. **Three Cooperating Properties:** `white-space: nowrap`, `overflow: hidden`, and `text-overflow: ellipsis`.
</details>

---

## Key Takeaways
1. **Always use unitless `line-height`:** Proportional multipliers (`1.5`) inherit cleanly without computing fixed pixel heights.
2. **Headings tight, body relaxed:** Use `1.1` to `1.25` line-height for large titles; `1.5` to `1.7` for body copy.
3. **Use `next/font` for Zero CLS in React:** Automatically self-hosts fonts and injects size-adjust CSS fallback metrics.
4. **Accessibility over visual capitalization:** Write natural casing in HTML and use `text-transform: uppercase` in CSS.
5. **Clamp fluid typography:** Never leave raw `vw` typography unbounded.

---

[⬅️ KPI 03 — Units & Values](./03-units-values.md) | [📚 CSS Index](./README.md) | [KPI 05 — Colors & Backgrounds ➡️](./05-colors-backgrounds-visual-effects.md)
