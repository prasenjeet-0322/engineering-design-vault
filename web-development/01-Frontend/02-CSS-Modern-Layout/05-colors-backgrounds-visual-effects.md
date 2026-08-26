# KPI 5 — CSS Colors, Backgrounds & Visual Effects

[⬅️ KPI 04 — Typography](./04-typography.md) | [📚 CSS Index](./README.md) | [KPI 06 — Borders & Visual Geometry ➡️](./06-borders-outline-visual-geometry.md)

---

## ⚡ 30-Second Executive Cheat Sheet

| Visual Property / Feature | Syntax / Shorthand Pattern | Default Value | Senior Production Best Practice |
|---|---|---|---|
| **`color` / `background-color`** | `rgb(r g b / alpha)` \| `hsl(h s% l%)` \| `oklch(...)` | `currentColor` / `transparent` | Use modern space-separated `rgb(0 0 0 / 0.5)` or CSS variables for dynamic theming. |
| **`currentColor`** | `border: 1px solid currentColor;` | Inherited foreground | Auto-synchronizes borders, SVG fills/strokes, and underlines with active text color. |
| **Alpha vs. Opacity** | `bg: rgb(0 0 0 / 50%)` vs `opacity: 0.5` | `opacity: 1` | Use background alpha for overlays; `opacity` fades the **entire DOM subtree & text**. |
| **`background-size`** | `cover` (fills/crops) \| `contain` (fits/letterboxes) | `auto` | Hero banners: `cover`; Logos / product photos: `contain`. |
| **Background Shorthand** | `background: url(...) position / size no-repeat;` | `none` | Slash `/` syntax is mandatory: `center / cover no-repeat`. |
| **Multiple Backgrounds** | `background: linear-gradient(...), url(...);` | `none` | **First declared layer renders on TOP** (gradient overlay over image). |
| **`background-origin` vs `clip`**| `origin: padding-box; clip: border-box;` | `padding-box` / `border-box` | `origin` = where coordinates begin; `clip` = where paint is geometrically bounded. |
| **Layered `box-shadow`** | `shadow: 0 4px 6px -1px #0001, 0 2px 4px -2px #0001;` | `none` | Stack subtle ambient + directional key shadows for realistic elevation. |

---

> [!CAUTION]
> ### 🎯 Senior Interview Gotcha: `opacity: 0.5` vs. `background: rgb(0 0 0 / 50%)`
> **Question:** *"Why does applying `opacity: 0.5` to a Hero container make text washed out and unreadable, whereas `background: rgb(0 0 0 / 50%)` keeps text crisp and accessible?"*  
> **Answer:**  
> - **`opacity` is a Compositing Group Property:** It creates a new Stacking Context and applies alpha transparency to the **entire rendered offscreen texture** (container, background image, paragraph text, headings, buttons, and child icons alike). No child element can override parent opacity via `opacity: 1`!  
> - **`background: rgb(... / 50%)` is a Paint Layer Property:** It strictly applies alpha channel transparency to the background fill rectangle during the Paint phase, leaving the foreground text and inline children at $100\%$ full opacity with crisp contrast!

---

## Overview
This document serves as the master engineering reference for CSS Color Spaces (Hex, RGB, HSL, modern OKLCH), Alpha Compositing vs. Layer Opacity, `currentColor` synchronization, Background Image Mechanics (`cover`, `contain`, `position`, `repeat`), Multiple Background Layer Stacking, Linear & Radial Gradients, `background-origin` vs. `background-clip` (including text masking), and Multi-Layered Elevation Shadows (`box-shadow`, `text-shadow`).

---

## Goal & Central Architectural Question
By the end of KPI 5, you should move beyond basic decorative styling and understand **how the browser compositor renders visual surfaces, manages layer stacks, calculates alpha blending, and maintains accessible contrast**.

> **The Central Engineering Question:**  
> What is being painted, which layer appears on top, does transparency affect only the surface or the entire DOM subtree, and how do we engineer depth without sacrificing performance or readability?

---

## 🧭 Industry Frequency & Framework (Tailwind) Relevance

| Badge | Industry Frequency | Relevance in Tailwind / Modern Stacks | What to Focus On |
|---|---|---|---|
| 🟢 **Daily Driver** | Used in 100% of projects | `bg-*`, `text-*`, `shadow-*`, `opacity-*`, `bg-cover`, `bg-center`, `currentColor` | Must master intuitively; used in every button, modal, card, hero, and theme token. |
| 🟡 **Moderate** | Used in ~30% of layouts | `bg-clip-text`, `linear-gradient`, `backdrop-blur`, `bg-contain`, inset shadows | Essential for glassmorphism UI, gradient text masks, and layered marketing banners. |
| 🔵 **Foundational** | Rarely configured manually | `background-origin`, `background-clip: padding-box`, color gamut math | Key for custom design system token pipelines, CSS canvas rendering, and audits. |

---

## Core Concepts (20 Subtopics)

### Part 1 — CSS Colors & Color Spaces `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `text-slate-900`, `bg-blue-600`, `border-emerald-500`.

#### Definition & Mechanics
A CSS color defines the color value applied to foreground (`color`), background (`background-color`), borders, or shadows.

```css
/* Hexadecimal */
color: #3b82f6;

/* Modern Space-Separated RGB */
color: rgb(59 130 246);

/* Modern Space-Separated HSL */
color: hsl(217 91% 60%);
```

#### ⚖️ Senior Engineering Decision Matrix: Color Formats
- **✅ When to Use Space-Separated RGB / HSL:** The modern CSS standard (`rgb(255 0 0 / 0.5)`). Integrates seamlessly with CSS Custom Properties to create dynamic alpha variants (`rgb(var(--primary-rgb) / var(--tw-bg-opacity))`).
- **❌ When NOT to Use Raw Hex with Alpha (`#ff000080`):** Hard to read and compute dynamically in JavaScript/React token systems.
- **🚀 Modern Leverages:** **`oklch()`** (OKLCH color space) offers perceptually uniform lightness, guaranteeing that switching hues never accidentally causes text contrast drops.

---

### Part 2 — Alpha Transparency vs. Element Opacity `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `bg-black/50` (Background Alpha) vs. `opacity-50` (Element Opacity).

```text
┌───────────────────────────────────────────────┐
│              OPACITY: 0.5                     │
│  ┌─────────────────────────────────────────┐  │ ◄── Fades Background (50%)
│  │  ┌───────────────────────────────────┐  │  │ ◄── Fades Text (50% - Illegible!)
│  │  │ [ Save Changes Button ]           │  │  │ ◄── Fades Button & Children (50%)
│  │  └───────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│       BACKGROUND: rgb(0 0 0 / 50%)            │
│  ┌─────────────────────────────────────────┐  │ ◄── Fades Background Only (50%)
│  │  ┌───────────────────────────────────┐  │  │ ◄── TEXT REMAINS 100% OPAQUE & CRISP
│  │  │ [ Save Changes Button ]           │  │  │ ◄── Button Stays 100% Solid
│  │  └───────────────────────────────────┘  │  │
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: Transparency
- **✅ When to Use Background Alpha (`bg-black/50`):** Modal backdrops, card surfaces, gradient overlays, and translucent navigation bars.
- **✅ When to Use `opacity`:** Disabled button states (`opacity-50 pointer-events-none`) and exit/enter fade animations in Framer Motion / CSS transitions.
- **❌ When NOT to Use `opacity` on Hero Containers:** Applying `opacity` to a container fades all child text and headings, causing severe WCAG contrast failures.

---

### Part 3 — HSL (Hue, Saturation, Lightness) `🟢 [Daily Driver]`
> **Tailwind Context:** Used by Shadcn UI and Radix themes (`hsl(var(--primary))`).

- **Hue ($0^\circ\text{--}360^\circ$):** Position on the color wheel ($0^\circ\text{ Red}, 120^\circ\text{ Green}, 240^\circ\text{ Blue}$).
- **Saturation ($0\%\text{--}100\%$):** Color intensity ($0\% = \text{gray}$, $100\% = \text{pure color}$).
- **Lightness ($0\%\text{--}100\%$):** Brightness ($0\% = \text{black}$, $50\% = \text{normal}$, $100\% = \text{white}$).

#### ⚖️ Senior Engineering Decision Matrix: HSL
- **✅ When to Use:** Creating programmatic color scales (e.g. generating `hover` states by adjusting Lightness: `hsl(220 80% 45%)` $\rightarrow$ `hsl(220 80% 35%)`).

---

### Part 4 — `currentColor` `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `text-current`, `border-current`, `fill-current`.

#### Definition & Mechanics
`currentColor` represents the computed value of the element's own `color` property. If not declared locally, it inherits from the parent.

```css
.btn-outline {
  color: #2563eb;
  border: 2px solid currentColor; /* Automatically #2563eb */
}

.btn-outline:hover {
  color: #dc2626; /* Border automatically flips to #dc2626! */
}
```

#### ⚖️ Senior Engineering Decision Matrix: `currentColor`
- **✅ When to Use:** Inline SVG icons (`<svg fill="currentColor">`), component borders, and focus rings that should automatically match text color changes without redundant CSS rules.
- **🚀 The Senior Leverage:** Eliminates dozens of repetitive hover/active color overrides across complex icon buttons.

---

### Part 5 — Background Basics `🟢 [Daily Driver]`
CSS background properties paint behind the padding and content areas of an element:
- `background-color`
- `background-image`
- `background-repeat`
- `background-position`
- `background-size`
- `background-attachment`
- `background-origin`
- `background-clip`

---

### Parts 6, 7 & 8 — `background-image`, `repeat`, and `position` `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `bg-[url(...)]`, `bg-no-repeat`, `bg-center`, `bg-top-right`.

```css
.hero {
  background-image: url("/assets/hero.webp");
  background-repeat: no-repeat;
  background-position: center center;
}
```
- **`background-repeat`:** Defaults to `repeat` (tiles horizontally & vertically). Set `no-repeat` for hero banners.
- **`background-position`:** Controls focal point anchor (`center`, `top right`, `50% 25%`).

---

### Part 9 — `background-size` (`cover` vs. `contain`) `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `bg-cover`, `bg-contain`, `bg-auto`.

```text
┌───────────────────────────┐      ┌───────────────────────────┐
│     COVER (Fills Box)     │      │   CONTAIN (Fits Entire)   │
│ ┌───────────────────────┐ │      │ ┌───────────────────────┐ │
│ │ Image fills entire    │ │      │ │                       │ │
│ │ container area.       │ │      │ │  Entire image visible.│ │
│ │ (Edges are cropped)   │ │      │ │  (Empty bars remain)  │ │
│ └───────────────────────┘ │      │ │                       │ │
│                           │      │ └───────────────────────┘ │
└───────────────────────────┘      └───────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: `cover` vs `contain`
- **✅ When to Use `cover`:** Hero background banners, card media covers, and full-viewport ambient backgrounds where edge cropping is acceptable.
- **✅ When to Use `contain`:** Brand logos, product thumbnails, diagrams, and technical schematics where **every single pixel of the image must remain visible** without cropping.

---

### Part 10 — Background Shorthand Syntax `🟢 [Daily Driver]`

```css
/* Syntax: [image] [position] / [size] [repeat] [attachment] [color] */
.hero {
  background: #0f172a url("/hero.webp") center / cover no-repeat;
}
```
> [!IMPORTANT]
> In the CSS `background` shorthand, `size` **can only appear immediately following `position` separated by a slash `/`** (`center / cover`). Reversing them or omitting the slash is a syntax error.

---

### Part 11 — Multiple Background Layers `🟢 [Daily Driver]`
> **Tailwind Equivalent:** Arbitrary gradients + URLs (`bg-[linear-gradient(...),url(...)]`).

An element can declare a comma-separated stack of backgrounds.

```css
.hero {
  background:
    linear-gradient(rgb(15 23 42 / 0.8), rgb(15 23 42 / 0.8)), /* Top Layer (Overlay) */
    url("/hero.webp") center / cover no-repeat;                   /* Bottom Layer (Image) */
}
```

```text
       [ USER EYE ]
            │
            ▼
┌───────────────────────┐ ── Layer 1: Dark Tint Gradient (Top)
├───────────────────────┤
┌───────────────────────┐ ── Layer 2: Hero Photograph (Bottom)
└───────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: Multiple Backgrounds
- **✅ When to Use:** Darkening or tinting dynamic hero images to guarantee readable text contrast (WCAG 4.5:1 ratio) without adding extra empty `<div>` overlay nodes in HTML.
- **⚠️ Stacking Rule:** The **first declared background layer is rendered on TOP**; subsequent layers are painted underneath.

---

### Parts 12, 13 & 14 — Linear & Radial Gradients `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600`, `bg-[radial-gradient(...)]`.

```css
/* Linear Gradient with Explicit Color Stops */
.gradient-bar {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
}

/* Radial Glow / Spotlight */
.hero-glow {
  background: radial-gradient(circle at 50% 0%, rgb(59 130 246 / 0.3) 0%, transparent 70%);
}
```

#### ⚖️ Senior Engineering Decision Matrix: Gradients
- **✅ When to Use Linear:** Call-to-action buttons, progress bars, and header background accents.
- **✅ When to Use Radial:** Dark-mode spotlight effects, atmospheric ambient glows, and illuminated hero headers.
- **⚠️ Performance Bottleneck:** Rendering multiple complex radial gradients with large blur spreads on low-end mobile devices can trigger GPU overdraw and drop frame rates during scrolling.

---

### Parts 15 & 16 — `background-origin` vs. `background-clip` `🟡 [Moderate]`
> **Tailwind Equivalent:** `bg-clip-text text-transparent` (Gradient Text), `bg-origin-border`.

```text
┌───────────────────────────────────────────────────────────┐ ── Border Box
│ Border Area                                               │
│  ┌─────────────────────────────────────────────────────┐  │ ── Padding Box
│  │ Padding Area                                        │  │
│  │  ┌───────────────────────────────────────────────┐  │  │ ── Content Box
│  │  │ Content Area                                  │  │  │
│  │  └───────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

| Property | Core Responsibility | Mental Model |
|---|---|---|
| **`background-origin`** | Positioning anchor | **Where coordinates `(0,0)` begin** for background placement. |
| **`background-clip`** | Painting boundary | **Where paint is geometrically clipped / masked**. |

#### Gradient Text Masking Recipe
```css
.gradient-title {
  background-image: linear-gradient(to right, #3b82f6, #ec4899);
  background-clip: text;
  -webkit-background-clip: text; /* Required for WebKit/Blink */
  color: transparent;
}
```

---

### Parts 17 & 18 — `box-shadow` & Multi-Layer Depth `🟢 [Daily Driver]`
> **Tailwind Equivalent:** `shadow-sm`, `shadow-md`, `shadow-xl`, `shadow-2xl`, `shadow-inner`.

```css
/* Syntax: [inset] [x-offset] [y-offset] [blur] [spread] [color] */
.card-elevated {
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),   /* Layer 1: Crisp ambient edge contact */
    0 10px 15px -3px rgb(0 0 0 / 0.1); /* Layer 2: Diffuse directional depth */
}
```

```text
┌─────────────────────────────────────────┐
│ box-shadow Parameters:                  │
│                                         │
│ 1. X-Offset: Horizontal distance (px)   │
│ 2. Y-Offset: Vertical distance (px)     │
│ 3. Blur: Gaussian softening radius (px) │
│ 4. Spread: Expands/contracts shadow (px)│
│ 5. Color: RGBA with alpha channel       │
└─────────────────────────────────────────┘
```

#### ⚖️ Senior Engineering Decision Matrix: Elevation Shadows
- **✅ When to Use Layered Shadows:** Always combine 2+ subtle shadows (contact shadow + ambient spread). Single harsh shadows (`box-shadow: 0 10px 20px black;`) look dated and amateur.
- **✅ When to Use `inset` Shadows:** Pressed button states, sunken input wells, and progress bar tracks.
- **⚠️ Performance:** Animated `box-shadow` transitions force CPU repaint on every frame. For 60 FPS hover animations, animate `transform: translateY(-2px)` or cross-fade a pseudo-element's `opacity` instead.

---

### Part 19 — `text-shadow` `🟡 [Moderate]`
> **Tailwind Equivalent:** Custom plugin or `drop-shadow-*`.

Applies shadow to individual text glyphs (`text-shadow: 0 2px 4px rgb(0 0 0 / 0.5);`).
- **Production Role:** Subtle readability enhancer on images; avoid heavy spreads that reduce typography legibility.

---

### Part 20 — Visual Production Thinking & Accessibility `🧭 [Decision Framework]`

```text
Designing Visual Effects?
        │
        ├─► Darkening an image for text? ────────► Use multiple background gradient overlay (NOT opacity on container)
        ├─► Syncing icons/borders with text? ────► Use currentColor
        ├─► Creating card elevation? ────────────► Use multi-layered subtle shadows with low alpha (< 15%)
        ├─► Need glassy translucent backdrop? ──► Combine bg: rgb(... / 70%) with backdrop-filter: blur(12px)
        └─► Checking contrast compliance? ──────► Ensure 4.5:1 contrast ratio between text and underlying background
```

---

## ⚛️ Senior React Ecosystem Architecture & Component Patterns

### 1. Synchronized Dynamic Icon Button with `currentColor`
```tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'destructive' | 'neutral';
}

export function ActionButton({ variant = 'primary', className, children, ...props }: ActionButtonProps) {
  const variantStyles = {
    primary: 'text-blue-600 hover:text-blue-700 border-current bg-blue-50/50',
    destructive: 'text-rose-600 hover:text-rose-700 border-current bg-rose-50/50',
    neutral: 'text-slate-700 hover:text-slate-900 border-current bg-slate-100/50',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-medium transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {/* SVG fill="currentColor" automatically adopts button text color */}
      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
      </svg>
      {children}
    </button>
  );
}
```

---

### 2. High-Performance Glassmorphic Modal Surface
```tsx
export function GlassModalCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl p-6 border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-2xl shadow-black/40">
      <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
      <div className="mt-4 text-slate-300 leading-relaxed">{children}</div>
    </div>
  );
}
```

---

## 🧠 KPI 5 — One Complete Integrated Challenge & Step-by-Step Solutions

### Part A — Colors

**Task / Questions:**
1. What is the difference between `color: #ff0000;` and `color: rgb(255 0 0);`?
2. What do the following represent: `#RRGGBB`? Explain what each pair controls.
3. What is the difference between `background-color: rgb(0 0 0 / 50%);` and `opacity: 0.5;`? Explain exactly which parts of an element are affected.
4. What do H, S, and L represent in `hsl(220 80% 50%);`?
5. Why can HSL be convenient when designing color variations?
6. What is `currentColor`?
7. Explain what happens here:
   ```css
   .button {
     color: blue;
     border: 2px solid currentColor;
   }
   ```
   Then explain what happens if `color` becomes red.

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 1–7)</summary>

1. **Difference:** There is **zero visual difference** in the rendered pixel color. `#ff0000` is hexadecimal notation, while `rgb(255 0 0)` is functional RGB decimal notation.
2. **`#RRGGBB` Breakdown:**
   - `RR` = Red intensity in base-16 ($00\text{ to }FF = 0\text{ to }255$).
   - `GG` = Green intensity in base-16.
   - `BB` = Blue intensity in base-16.
3. **Background Alpha vs Opacity:**
   - `background-color: rgb(0 0 0 / 50%)`: Strictly alpha-blends the **background paint layer** at $50\%$ transparency. Foreground text, borders, and children remain $100\%$ fully opaque and crisp.
   - `opacity: 0.5`: Creates a compositing group that renders the **entire element subtree** (background, text, images, icons, and nested child components) at $50\%$ opacity.
4. **HSL Meaning:**
   - **H (Hue):** Angular position on the color wheel ($220^\circ = \text{Blue}$).
   - **S (Saturation):** Color purity/intensity ($80\% = \text{vibrant}$).
   - **L (Lightness):** Luminance/brightness ($50\% = \text{balanced mid-tone}$).
5. **Why HSL is convenient:** It decouples color identity (Hue) from shade/tint (Lightness). Hover, active, or dark-mode shades can be created simply by incrementing or decrementing Lightness percentage without calculating complex hex/RGB channels.
6. **`currentColor`:** A CSS keyword that resolves to the element's computed `color` property value (or its inherited text color).
7. **Button Behavior:** The border renders in `blue` because it references `currentColor`. When `color` changes to `red`, the border automatically updates to `red` with zero extra CSS declarations.
</details>

---

### Part B — Backgrounds

**Task / Questions:**
8. What is the difference between `background-size: cover;` and `background-size: contain;`?
9. A hero section has `width: 1200px; height: 500px;`. Its background image has an aspect ratio that does not match the container. Explain what happens with `cover` vs `contain`.
10. Why is `background-position: center;` commonly used?
11. What is the default behavior of a background image regarding repetition?
12. What does `background-repeat: no-repeat;` do?

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 8–12)</summary>

8. **`cover` vs `contain`:**
   - `cover`: Scales the image proportionally so it **completely covers** the entire container box; overflowing edges are cropped.
   - `contain`: Scales the image proportionally so the **entire image fits inside** the container box without cropping; may leave empty letterbox space.
9. **Mismatched Aspect Ratio Behavior ($1200\text{px} \times 500\text{px}$ Container):**
   - With `cover`: The image scales until both dimensions are completely filled. The dimension exceeding the container aspect ratio is clipped/cropped at the edges.
   - With `contain`: The image scales until its largest dimension touches the container edge. The remaining space displays the container's `background-color` (letterboxing).
10. **`background-position: center`:** Anchors the image focal point in the direct middle ($50\% \text{ horizontal}, 50\% \text{ vertical}$), ensuring that proportional cropping in `cover` crops equally from opposite edges rather than slicing off the top or left.
11. **Default Repetition:** The browser defaults to `background-repeat: repeat` (tiles the image horizontally and vertically across the container).
12. **`background-repeat: no-repeat`:** Renders the image exactly once at its designated position and size without tiling.
</details>

---

### Part C — Multiple Background Layers

**Given:**
```css
.hero {
  background:
    linear-gradient(
      rgb(0 0 0 / 60%),
      rgb(0 0 0 / 60%)
    ),
    url("hero.jpg") center / cover no-repeat;
}
```

**Task / Questions:**
13. How many background layers exist?
14. Which layer appears on top?
15. Why might a developer add the gradient layer?
16. Does the gradient change the original image file?
17. Why is this generally better than applying `opacity: 0.6;` to the entire `.hero` element when readable text exists inside it?

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 13–17)</summary>

13. **Layer Count:** **2 background layers** (Layer 1: Linear gradient; Layer 2: Bitmap image).
14. **Top Layer:** The **`linear-gradient`** appears on top (in CSS multiple backgrounds, the first declared item is painted in the foreground).
15. **Why Add Gradient:** To overlay a semi-transparent dark tint ($60\%$ black) over the photograph, darkening bright spots to guarantee high-contrast readability for white heading text (WCAG accessibility compliance).
16. **Changes Original File?** **No.** It is purely a CSS GPU paint-layer compositing effect; the original image asset remains unchanged.
17. **Why Better than `opacity: 0.6`:** `opacity: 0.6` on `.hero` would make the hero's **text, headings, and CTA buttons $40\%$ transparent and washed out**. Multiple background layering darkens only the image surface, keeping text $100\%$ crisp and opaque.
</details>

---

### Part D — Gradients

**Task / Questions:**
18. What is a linear gradient?
19. Explain `linear-gradient(to right, red, blue);`.
20. What are color stops? Explain `linear-gradient(to right, red 0%, blue 50%, purple 100%);`.
21. What is the difference between a linear gradient and a radial gradient?
22. Give one realistic use case for each (Linear vs Radial).

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 18–22)</summary>

18. **Linear Gradient:** A procedural CSS `<image>` that generates a progressive mathematical color transition along a straight vector axis.
19. **`linear-gradient(to right, red, blue)`:** Transitions colors horizontally from the left edge (`red`) to the right edge (`blue`).
20. **Color Stops:** Explicit position percentages along the gradient line where a color reaches pure saturation. In `red 0%, blue 50%, purple 100%`, `red` is pure at the start ($0\%$), transitions smoothly to pure `blue` at the midpoint ($50\%$), and concludes at pure `purple` at the end ($100\%$).
21. **Linear vs Radial:** Linear transitions along a straight directional line (angle/direction); Radial transitions outward symmetrically from a central focal point (circle or ellipse).
22. **Realistic Use Cases:**
    - *Linear Gradient:* Shimmering call-to-action button backgrounds or gradient text fills.
    - *Radial Gradient:* Atmospheric dark-mode hero spotlights or subtle vignette shadows.
</details>

---

### Part E — Background Origin vs Clip

**Task / Questions:**
23. What does `background-origin` control?
24. What does `background-clip` control?
25. Explain the difference between `background-origin` and `background-clip` in one precise statement.
26. What are the three common box values that can be used with these concepts?

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 23–26)</summary>

23. **`background-origin`:** Sets the box area that establishes the **positioning coordinate reference frame `(0,0)`** for the background image.
24. **`background-clip`:** Sets the bounding box that **geometrically clips / masks the painted background**.
25. **One Precise Statement:** `background-origin` determines **where the image starts positioning**, whereas `background-clip` determines **where the background paint is allowed to be visible**.
26. **Three Common Box Values:** `border-box`, `padding-box`, and `content-box` (plus `text` for `background-clip`).
</details>

---

### Part F — Shadows

**Given:**
```css
.card {
  box-shadow: 10px 20px 30px 5px rgb(0 0 0 / 20%);
}
```

**Task / Questions:**
27. What does `10px` represent?
28. What does `20px` represent?
29. What does `30px` represent?
30. What does `5px` represent?
31. What does the final color value represent?
32. What does `inset` do in `box-shadow: inset 0 0 10px black;`?
33. Why might multiple subtle shadows look more realistic than one large shadow?

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 27–33)</summary>

27. **`10px`:** **X-Offset** (shifts shadow $10\text{px}$ to the right).
28. **`20px`:** **Y-Offset** (shifts shadow $20\text{px}$ downward).
29. **`30px`:** **Blur Radius** (Gaussian blur distance; larger value = softer, more diffuse edges).
30. **`5px`:** **Spread Radius** (expands the shadow perimeter outward by $5\text{px}$ in all directions before blur is applied).
31. **Color Value:** The shadow's color and alpha transparency ($20\%$ black).
32. **`inset`:** Reverses shadow projection so it renders **inside the element's border box**, creating an indented/sunken well effect.
33. **Multiple Shadows Realism:** Real-world lighting consists of direct light (casting a sharp contact shadow) and ambient bounce light (casting a wide, diffuse glow). Stacking two subtle shadows accurately mimics natural physics.
</details>

---

### Part G — Final Engineering Scenario

**Requirements:**
1. Full-width hero background image.
2. Image should fill the entire hero.
3. Some image cropping is acceptable.
4. Text must remain readable.
5. The text itself should not become transparent.
6. A subtle depth effect is needed on a content card.
7. The design should support changing main text color while keeping the border synchronized.

**Task / Questions:**
34. Which `background-size` value would you choose and why?
35. Would you use `opacity` on the entire hero to darken the image? Explain.
36. What technique would you use instead to darken the image?
37. How would you create the subtle card depth effect? Explain the role of blur and alpha.
38. How could `currentColor` help synchronize the text and border?
39. Explain the complete visual layer order you would expect (`Hero background image`, `Gradient overlay`, `Hero content`). Which is closest to the user?
40. **Final Theory Question:** A developer says: *"I used `opacity: 0.5` to make my background image darker, but now my text and buttons are also transparent."*
    - Explain why this happened.
    - Explain why this is a property of parent compositing rather than background adjustment.
    - How you would redesign the solution.

<details>
<summary>Solution & Step-by-Step Breakdown (Questions 34–40)</summary>

34. **`background-size: cover`:** Fills the full hero viewport without distortion, accepting proportional cropping to maintain aspect ratio.
35. **Use `opacity` on hero?** **No.** `opacity` creates an offscreen alpha composite that fades headings, text, and buttons to $50\%$ transparency.
36. **Darkening Technique:** Use a **multi-background CSS gradient overlay** (`background: linear-gradient(rgb(0 0 0 / 0.6), rgb(0 0 0 / 0.6)), url(...) center / cover no-repeat;`).
37. **Subtle Card Depth:** Stack two shadows with low alpha:
   ```css
   box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 10px 20px -5px rgb(0 0 0 / 0.15);
   ```
   Blur diffuses the edge; low alpha ($10\%\text{--}15\%$) ensures elevation looks natural rather than muddy.
38. **`currentColor` Synchronization:** Setting `.card { border: 1.5px solid currentColor; }` binds the border to whatever `color` is declared on the card, updating automatically across theme states.
39. **Visual Layer Stacking Order:**
    ```text
    [ CLOSEST TO USER ] ──► Hero Foreground Content (Text & Buttons)
                                   │
                                   ▼
                            ──► Gradient Darkening Overlay (Layer 1)
                                   │
                                   ▼
    [ FURTHEST BACK   ] ──► Hero Bitmap Image (Layer 2)
    ```
40. **Final Question Explanation & Fix:**
    1. *Why it happened:* `opacity` is inherited across the rendering pipeline for the entire element box.
    2. *Compositing behavior:* The browser renders the element and all its children to an offscreen bitmap texture, then composites that entire texture onto the page at $50\%$ alpha.
    3. *Redesign:* Remove `opacity: 0.5` from the parent and apply semi-transparent alpha directly to the background layer (`background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(...)`).
</details>

---

## Key Takeaways
1. **Never use `opacity` for dark overlays:** Use multi-background gradients with alpha channels to protect text contrast.
2. **Use `currentColor` for DRY components:** Auto-sync icon fills and borders with foreground typography.
3. **Layer shadows for realism:** Combine small contact shadows with diffuse ambient shadows using low alpha ($<15\%$).
4. **Slash syntax in background shorthand:** Size must follow position with a slash (`center / cover`).
5. **Stacking order:** In multi-background declarations, the first item is painted on top.

---

[⬅️ KPI 04 — Typography](./04-typography.md) | [📚 CSS Index](./README.md) | [KPI 06 — Borders & Visual Geometry ➡️](./06-borders-outline-visual-geometry.md)
