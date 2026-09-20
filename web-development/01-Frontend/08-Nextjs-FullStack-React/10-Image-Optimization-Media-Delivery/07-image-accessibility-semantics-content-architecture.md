# Level 08 — KPI 10 — Part 07

## Image Accessibility, Semantics & Content Architecture

---

# 1. Part Objective

This part establishes the architectural model for treating images as **semantic content**, not merely visual assets.

The central question is:

> **What does this image mean to the user, what information does it communicate, and how should that meaning be represented to users who cannot perceive the image visually?**

The previous parts focused primarily on:

```text
Part 01 → Image delivery mental model
Part 02 → Next.js <Image> mechanics
Part 03 → Responsive images
Part 04 → Formats and transformation
Part 05 → CDN and caching
Part 06 → Loading, priority and LCP
```

This part shifts the focus to:

```text
Image
  ↓
Content Meaning
  ↓
Semantic Role
  ↓
Alternative Representation
  ↓
Accessibility
  ↓
Content Architecture
```

The senior engineer must understand:

* meaningful vs decorative images
* alternative text
* accessible names
* semantic HTML
* image links
* image buttons
* captions
* figures
* complex images
* charts and diagrams
* functional images
* redundant text
* decorative imagery
* content ownership
* CMS image metadata
* localization
* dynamic image content
* accessibility testing
* design-system contracts

---

# 2. The Fundamental Mental Model

An image has at least two distinct identities:

```text
Visual Identity
+
Semantic Identity
```

Visual identity answers:

> What pixels are displayed?

Semantic identity answers:

> What information does this image communicate?

For example:

```text
/logo.png
```

could visually be:

```text
Company logo
```

But semantically it may represent:

```text
link to homepage
```

Those are different concerns.

Therefore:

```text
image asset
≠
image meaning
```

---

# 3. Image Accessibility Is Not Just `alt`

A common beginner mental model is:

```text
image accessibility
=
alt attribute
```

This is incomplete.

Image accessibility involves:

```text
semantic role
+
alternative text
+
surrounding context
+
caption
+
functional behavior
+
visible text
+
complex-image description
+
focus behavior
+
interaction semantics
```

The correct alternative representation depends on the image's purpose.

---

# 4. The Four Major Image Roles

A useful classification is:

```text
1. Informative
2. Decorative
3. Functional
4. Complex
```

These categories drive accessibility decisions.

---

# 5. Informative Images

An informative image communicates meaningful information.

Examples:

```text
Product photograph
Author portrait
News photograph
Map
Instructional illustration
Medical diagram
```

The image contributes information beyond decoration.

Therefore it generally requires an accessible textual alternative that communicates the relevant meaning.

For example:

```html
<img
  src="/product.jpg"
  alt="Black leather backpack with two front pockets"
/>
```

The purpose is not to describe every pixel.

The purpose is to communicate the relevant information.

---

# 6. Alt Text Is a Content Contract

The `alt` attribute should answer:

> **What would the user need to know if they could not see this image?**

This means alt text should be:

```text
meaningful
+
contextual
+
concise
+
purpose-driven
```

It should not automatically be:

```text
visual transcription
```

For example:

```text
alt="A photograph of a black backpack"
```

may be less useful than:

```text
alt="Black leather backpack with two front pockets"
```

depending on the surrounding context.

---

# 7. Context Determines Alt Text

The same image can require different alternative text depending on where it appears.

Consider:

```text
Company logo
```

On an about page:

```text
alt="Acme"
```

may be sufficient.

Inside a link:

```text
<a href="/">
  <img src="/logo.svg" alt="Acme home">
</a>
```

the accessible meaning may need to communicate the destination.

In a decorative footer:

```text
alt=""
```

may be appropriate if the image contributes no meaningful information.

Therefore:

```text
same asset
≠
same alt text
```

---

# 8. Decorative Images

A decorative image contributes no information necessary for understanding or interacting with the page.

Examples:

```text
Background texture
Decorative divider
Visual ornament
Purely aesthetic shape
```

The accessibility objective is:

> **Do not force assistive technology users to consume information that provides no value.**

Conceptually:

```html
<img src="/decorative-pattern.svg" alt="" />
```

The empty alternative text communicates that the image should not be exposed as meaningful content.

---

# 9. Decorative Does Not Mean "Unimportant"

An image can be visually important to the design while still being semantically decorative.

For example:

```text
Large gradient illustration
```

may dominate the visual page but communicate no information.

Therefore:

```text
visual prominence
≠
semantic importance
```

This distinction is critical for accessibility architecture.

---

# 10. Functional Images

Some images are controls.

Examples:

```text
Icon button
Logo link
Image-based navigation
Thumbnail selector
Gallery control
```

In these cases the important question is:

> **What does the interaction do?**

Consider:

```text
[trash icon]
```

If it deletes an item, the accessible meaning is:

```text
Delete
```

not:

```text
Trash can
```

The semantic purpose is determined by the control's behavior.

---

# 11. Image Inside a Button

A button containing only an image still needs an accessible name.

Conceptually:

```html
<button>
  <img src="/close.svg" alt="" />
</button>
```

The button itself should communicate:

```text
Close dialog
```

The image may remain decorative because the control provides the semantic meaning.

The architecture is:

```text
Button
  ↓
Accessible Name
  ↓
Action
```

not:

```text
Image
  ↓
Action
```

---

# 12. Image Inside a Link

Consider:

```html
<a href="/products">
  <img src="/products.jpg" alt="Products">
</a>
```

The link's accessible name derives from the image alternative.

Therefore the image's alternative text becomes part of the navigation semantics.

This means image semantics and interactive semantics cannot always be designed independently.

---

# 13. Redundant Text

Consider:

```text
[Product image]
Black leather backpack
$120
```

If the image has:

```text
alt="Black leather backpack"
```

the same information may already exist immediately beside it.

A screen reader user could encounter the same information twice.

In such cases, the image may need a different alternative or may be treated as decorative depending on the component's semantics.

The principle is:

> **Accessibility should communicate information once, clearly, rather than unnecessarily duplicating it.**

---

# 14. The Surrounding Content Matters

Alt text should not be written in isolation.

Consider:

```text
Heading:
John Smith

Image:
John Smith

Paragraph:
Chief Executive Officer
```

If the image alt says:

```text
alt="John Smith, Chief Executive Officer"
```

the same information may be duplicated.

The image's alternative should be determined from the full content context.

Therefore:

```text
alt text quality
=
image meaning
+
surrounding content
```

---

# 15. Accessible Name vs Description

These concepts should remain distinct.

An accessible name identifies an element.

A description provides additional information.

For example:

```text
Button name:
"View chart"

Description:
"Revenue increased from $2 million to $3 million between January and June."
```

A complex chart should not attempt to place the entire interpretation into a short accessible name.

Instead, the architecture may provide:

```text
name
+
description
+
structured alternative data
```

---

# 16. Complex Images

Some images contain substantial information.

Examples:

```text
Chart
Graph
Technical diagram
Architecture diagram
Infographic
Map
Scientific figure
Process diagram
```

A short alt string may be insufficient.

For example:

```text
alt="Revenue chart"
```

identifies the object but does not communicate the information contained in the chart.

A complex image requires a richer alternative representation.

---

# 17. Complex Image Architecture

A useful structure is:

```text
Figure
  ↓
Image
  ↓
Short identification
  +
Detailed textual explanation
  +
Optional underlying data
```

Conceptually:

```html
<figure>
  <img
    src="/revenue-chart.png"
    alt="Revenue by quarter"
  />
  <figcaption>
    Revenue increased each quarter from Q1 through Q4.
  </figcaption>
</figure>
```

For highly complex visualizations, the accessible alternative may need a dedicated text representation.

---

# 18. The Principle of Information Equivalence

The goal is not:

```text
same pixels
```

The goal is:

```text
equivalent information
```

For a visual chart:

```text
Visual:
bar chart showing quarterly revenue
```

Accessible representation:

```text
Q1: $2M
Q2: $2.4M
Q3: $2.8M
Q4: $3.1M
```

The user receives the meaningful information without needing the visual presentation.

Therefore:

```text
accessible alternative
≠
pixel description
```

It is an information representation.

---

# 19. Charts Are Data, Not Just Images

If a chart represents data that matters to the user, consider exposing the underlying data directly.

For example:

```text
Revenue:
Q1 → $2M
Q2 → $2.4M
Q3 → $2.8M
Q4 → $3.1M
```

This is often more useful than:

```text
alt="A blue bar chart with four bars"
```

The latter describes appearance.

The former communicates meaning.

---

# 20. Diagrams Require Structural Thinking

Consider an architecture diagram:

```text
Browser
   ↓
CDN
   ↓
API
   ↓
Database
```

A useful alternative may describe the relationships:

```text
Requests flow from the browser through the CDN and API to the database.
```

This communicates the architecture.

Simply saying:

```text
alt="Architecture diagram"
```

does not.

The alternative should preserve the important conceptual relationships.

---

# 21. Captions

A caption provides visible contextual information about an image.

For example:

```text
[Photograph]

Figure 1. Deployment architecture for the production environment.
```

Captions are useful when the information should be visible to all users.

This creates an important distinction:

```text
alt
=
alternative representation

caption
=
visible contextual representation
```

They can complement each other.

They should not necessarily duplicate each other.

---

# 22. `<figure>` and `<figcaption>`

When an image and its caption form a meaningful unit:

```html
<figure>
  <img src="/diagram.png" alt="..." />
  <figcaption>
    Production deployment architecture.
  </figcaption>
</figure>
```

This expresses the relationship semantically.

The semantic model becomes:

```text
Figure
├── visual representation
└── visible explanation
```

This is stronger than treating the image and caption as unrelated elements.

---

# 23. Content vs Decoration

A useful question is:

> If this image disappeared, would the user lose information or functionality?

If yes:

```text
content
```

If no:

```text
possibly decorative
```

This is not an absolute rule, but it is a useful classification heuristic.

---

# 24. Image Meaning Depends on Product Context

Consider a photograph of a shirt.

On a shopping product page:

```text
important product information
```

On a decorative fashion landing page:

```text
possibly atmospheric
```

Inside an article:

```text
may provide contextual evidence
```

The same image file can therefore have different semantic roles.

This reinforces:

```text
asset identity
≠
content role
```

---

# 25. CMS Image Architecture

A production CMS should not store only:

```text
image URL
```

It may need metadata such as:

```text
asset ID
title
description
alt text
caption
credit
focal point
locale
content type
copyright status
```

For example:

```text
ImageAsset
├── id
├── source
├── altText
├── caption
├── credit
├── focalPoint
├── locale
└── usageMetadata
```

This allows image semantics to become part of the content model.

---

# 26. Alt Text Ownership

A critical architecture question is:

> Who is responsible for writing the alternative text?

Possible ownership models:

```text
Content author
Designer
CMS editor
Frontend developer
Automated system
```

The strongest systems define explicit ownership.

For editorial content:

```text
CMS/editor
```

may own semantic meaning.

For UI icons:

```text
component API
```

may own semantics.

The frontend should not invent meaningful content that belongs to the content system.

---

# 27. Avoid Hardcoding Content Meaning in Components

A weak component might contain:

```jsx
<Image
  src={image.url}
  alt="Product image"
/>
```

This forces every image to have the same semantic description.

A stronger content-driven model might be:

```jsx
<Image
  src={image.url}
  alt={image.altText}
/>
```

The component renders semantic content supplied by the content model.

The principle is:

```text
component
=
presentation + semantics contract

CMS/domain
=
content meaning
```

---

# 28. Design System Image Contracts

A design system should define image semantics explicitly.

For example:

```text
<ContentImage>
  required:
    source
    alt

<DecorativeImage>
  semantics:
    decorative

<FunctionalIcon>
  semantics:
    derived from control

<FigureImage>
  source
  alt
  caption
```

This prevents every application team from independently reinventing image semantics.

---

# 29. Component API Design

A dangerous API:

```tsx
<ImageComponent
  src={src}
/>
```

with an implicit default:

```text
alt="image"
```

This hides a critical accessibility decision.

A stronger API may force the caller to choose:

```tsx
<ContentImage
  src={src}
  alt={alt}
/>
```

or:

```tsx
<DecorativeImage
  src={src}
/>
```

The API itself communicates semantic intent.

---

# 30. Avoid Generic Alt Text

Generic values such as:

```text
"image"
"photo"
"picture"
"graphic"
```

usually communicate little.

The user already knows that an image exists.

The useful question is:

> What information does the image contribute?

---

# 31. Avoid Unnecessary "Image of..."

An alt value does not necessarily need:

```text
"Image of a red car"
```

if:

```text
"Red Tesla Model 3"
```

already communicates the useful meaning.

The exact wording depends on context.

The goal is not a rigid grammatical formula.

The goal is efficient information transfer.

---

# 32. Localization

Alt text is content.

Therefore it may require localization.

Consider:

```text
English:
"Black leather backpack"

French:
"Sac à dos en cuir noir"

German:
"Schwarzer Lederrucksack"
```

The image itself may remain identical while the semantic representation changes by locale.

Therefore:

```text
image representation identity
≠
semantic content identity
```

---

# 33. Locale and CDN Identity

A useful distinction:

```text
same pixels
+
different language alt text
```

does not necessarily require:

```text
different image bytes
```

Therefore the image CDN should not automatically multiply image representations merely because alt text changes.

The semantic layer can vary independently from the visual delivery layer.

This is an important architecture boundary.

---

# 34. Multi-Tenant Content

In a multi-tenant platform:

```text
Tenant A
image + alt text

Tenant B
same image + different alt text
```

The visual asset may be shared while the semantic content is tenant-specific.

Therefore content ownership and image caching should remain conceptually separate.

The system should distinguish:

```text
asset identity
representation identity
content context
```

---

# 35. User-Generated Images

User-generated images introduce additional concerns:

* unknown content quality
* missing alt text
* offensive or sensitive content
* privacy
* localization
* moderation
* automatic captioning
* user-provided descriptions

A platform may provide:

```text
optional user description
```

or:

```text
automated suggestion
```

but should be careful about treating generated descriptions as unquestionably accurate.

---

# 36. AI-Generated Alt Text

Automated image description can help at scale.

For example:

```text
uploaded image
      ↓
vision model
      ↓
suggested alt text
      ↓
editor review
      ↓
published content
```

The important architectural distinction is:

```text
automation
=
suggestion
```

rather than blindly assuming:

```text
automation
=
authoritative semantic truth
```

For important content, human/content-owner validation may remain necessary.

---

# 37. Privacy and Alt Text

Alt text can accidentally expose information.

Consider an image containing:

```text
patient name
address
medical information
private document
```

An automated description might surface information that should not be exposed.

Therefore accessibility metadata is still data.

The system should consider:

```text
privacy
+
authorization
+
content classification
```

when generating or publishing semantic descriptions.

---

# 38. Image Security vs Accessibility

Accessibility does not override authorization.

For example:

```text
private image
```

should not become publicly discoverable simply because an accessible description exists.

The architecture must maintain:

```text
authorization boundary
+
semantic accessibility
```

together.

---

# 39. SVG Accessibility

SVG requires additional semantic consideration.

An SVG can be:

```text
decorative icon
functional icon
informational illustration
complex diagram
```

The correct semantics depend on the use.

A decorative icon inside a labeled button may not need its own accessible text.

A standalone informative SVG may require an accessible name or textual equivalent.

Therefore:

```text
SVG
≠
automatically decorative
```

and:

```text
SVG
≠
automatically accessible
```

---

# 40. Icon Semantics

Consider:

```text
<button>
  [download icon]
</button>
```

The user needs:

```text
Download
```

The icon itself does not need to expose:

```text
"Arrow pointing downward"
```

The control's purpose is what matters.

This is a recurring principle:

```text
functional context
overrides literal visual description
```

---

# 41. Icon-Only Controls

An icon-only button should have a clear accessible name.

For example:

```text
[×]
```

should communicate:

```text
Close
```

not:

```text
Times symbol
```

Similarly:

```text
[🔍]
```

may communicate:

```text
Search
```

rather than:

```text
Magnifying glass
```

The semantic action matters more than the visual object.

---

# 42. Image Buttons and State

Some icons change based on state.

Example:

```text
[heart]
```

may represent:

```text
Add to favorites
```

while:

```text
[filled heart]
```

represents:

```text
Remove from favorites
```

The accessible name should reflect the current action/state.

Therefore:

```text
visual state
↔
accessible state
```

must remain synchronized.

---

# 43. Image Links and Destination Semantics

Consider:

```text
[product image]
```

linked to:

```text
/products/123
```

The accessible name should identify the destination/content meaning.

For example:

```text
"Black leather backpack"
```

is more useful than:

```text
"Product image"
```

because it communicates what the user will encounter.

---

# 44. Thumbnail Galleries

A thumbnail image can have two semantic roles simultaneously:

```text
visual representation
+
selection control
```

For example:

```text
[image thumbnail]
```

may select:

```text
Hero image #3
```

The accessible name should communicate the action and relevant content.

Conceptually:

```text
Thumbnail
  ↓
"View black backpack from rear"
```

rather than simply:

```text
"Image"
```

---

# 45. Zoomable Images

A product image may open a zoom viewer.

The architecture may be:

```text
Thumbnail
   ↓
selection
   ↓
large image
   ↓
zoom interaction
```

Each layer has different semantics.

The thumbnail's accessible name may describe:

```text
"View side of backpack"
```

while the expanded image may expose:

```text
"Black leather backpack, side view"
```

The interaction should remain understandable without relying solely on visual differences.

---

# 46. Captions vs Alt Text in Editorial Content

Consider an article image:

```text
Photograph of a spacecraft
```

Caption:

```text
"Engineers prepare the spacecraft for launch at the Kennedy Space Center."
```

Alt text might be:

```text
"Engineers preparing a spacecraft for launch"
```

The caption provides contextual information visible to everyone.

Alt text provides an alternative representation.

They may overlap somewhat, but they serve different purposes.

---

# 47. Image Credit

Photo credits can be important content.

For example:

```text
Photo: NASA / John Doe
```

This information should not necessarily be hidden exclusively in alt text.

If the credit is editorially important, it should be represented visibly.

Again:

```text
alt
≠
container for every piece of image metadata
```

---

# 48. Content Model Example

A production editorial image could be modeled as:

```text
EditorialImage
├── assetId
├── source
├── altText
├── caption
├── credit
├── title
├── locale
├── focalPoint
├── width
├── height
└── accessibilityReviewStatus
```

This separates:

```text
visual asset
```

from:

```text
editorial semantics
```

and:

```text
delivery metadata
```

---

# 49. Image Semantics Pipeline

A mature architecture can look like:

```text
CMS / Domain
      ↓
Image Asset
      ↓
Semantic Metadata
      ↓
Component Contract
      ↓
Accessible HTML
      ↓
Assistive Technology
```

Parallel to:

```text
Image Asset
      ↓
Representation Selection
      ↓
Transformation
      ↓
CDN
      ↓
Browser
```

The two pipelines meet at rendering but solve different problems.

---

# 50. Two-Pipeline Architecture

```text
                    IMAGE ASSET
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
       Semantic Pipeline       Delivery Pipeline
             │                       │
       alt/caption/role       resize/format/CDN
             │                       │
             ▼                       ▼
        Accessible UI         Optimized Image
             │                       │
             └───────────┬───────────┘
                         ▼
                       Browser
```

This separation is extremely useful.

A developer can optimize delivery without accidentally changing semantics.

---

# 51. Accessibility and Performance Can Conflict

Sometimes accessibility and performance decisions appear to compete.

For example:

```text
high-resolution image
```

may provide important visual information but cost more bytes.

The solution is not to remove the information.

Instead:

```text
responsive delivery
+
appropriate representation
+
accessible alternative
```

can preserve meaning while controlling performance cost.

---

# 52. Accessible Alternatives Reduce Dependency on Pixels

For complex visual content, a textual representation can provide the essential information even if the image cannot be loaded.

This creates resilience:

```text
image unavailable
      ↓
meaning still available
```

Therefore accessibility can also improve content robustness.

---

# 53. Broken Image Behavior

If an image fails to load:

```text
network failure
CDN failure
404
invalid source
```

the user should still receive meaningful information where appropriate.

A good semantic model ensures that the image's alternative remains meaningful even when pixels are unavailable.

This is another reason alt text is content rather than decoration.

---

# 54. Testing Image Accessibility

Testing should happen at multiple levels.

### Static inspection

Verify:

```text
alt presence
decorative handling
semantic HTML
```

### Automated accessibility testing

Useful for detecting:

* missing alternatives
* malformed semantics
* some labeling problems

### Screen reader testing

Necessary for understanding:

```text
actual announcement
interaction flow
redundancy
context
```

### Content review

Necessary for determining:

```text
is the alternative actually meaningful?
```

Automation cannot fully determine content intent.

---

# 55. Testing Matrix

| Image type     | Test                                 |
| -------------- | ------------------------------------ |
| Informative    | Alt communicates purpose             |
| Decorative     | Hidden from unnecessary announcement |
| Functional     | Action/destination is understandable |
| Complex        | Equivalent information available     |
| Figure         | Image/caption relationship is clear  |
| Icon button    | Control has accessible name          |
| Thumbnail      | Selection action is understandable   |
| User-generated | Semantic content is appropriate      |
| Localized      | Alt/caption are localized correctly  |

---

# 56. Accessibility Regression Testing

A production design system should prevent regressions such as:

```text
component update
→
alt accidentally removed
```

or:

```text
icon button
→
label removed
```

or:

```text
decorative image
→
announced unnecessarily
```

Therefore semantic contracts should be tested as part of component development.

---

# 57. Design-System-Level Enforcement

A design system can encode constraints such as:

```text
ContentImage:
  requires alt

DecorativeImage:
  explicitly decorative

IconButton:
  requires accessible label

Figure:
  supports caption
```

This shifts accessibility from:

```text
developer memory
```

toward:

```text
system architecture
```

---

# 58. Accessibility as a Data Contract

A useful senior-level model is:

```text
ImageComponentProps
=
VisualData
+
SemanticData
+
InteractionData
```

For example:

```text
VisualData:
src
width
height

SemanticData:
alt
caption

InteractionData:
href
action
state
```

This prevents semantic requirements from being treated as optional decoration.

---

# 59. Four-Pillar Engineering Matrix

## Pillar 1 — Correctness

Ask:

* Does the image communicate its intended meaning?
* Is decorative content excluded appropriately?
* Are functional images labeled by purpose?
* Are complex visuals represented equivalently?
* Does the semantic state match the visual state?

---

## Pillar 2 — Performance

Ask:

* Does accessibility metadata avoid unnecessary network work?
* Are complex alternatives available without requiring huge images?
* Are responsive representations used?
* Can semantic content remain available when images fail?

---

## Pillar 3 — Maintainability

Ask:

* Is semantic ownership clear?
* Does the CMS provide meaningful metadata?
* Do components enforce accessibility contracts?
* Can localization be handled systematically?
* Are image roles explicit?

---

## Pillar 4 — Scalability

Ask:

* Can thousands of editorial images have reliable metadata?
* Can user-generated images receive semantic alternatives?
* Can multiple tenants/locales maintain independent semantics?
* Can design-system components enforce consistent behavior?

---

# 60. Prediction Challenges

### Challenge 1

A product card contains:

```text
Image
Product name
Price
```

The image alt is:

```text
"Black leather backpack"
```

The visible product name is also:

```text
"Black leather backpack"
```

What should you investigate?

**Expected reasoning:**

The image may be redundant with adjacent text and may not need to repeat the same information.

---

### Challenge 2

A trash-can icon appears inside:

```text
<button>
```

What should the accessible meaning communicate?

**Expected reasoning:**

The action, such as "Delete", rather than a literal visual description such as "Trash can".

---

### Challenge 3

A revenue chart contains four years of data.

Alt text is:

```text
"Revenue chart"
```

Is that necessarily sufficient?

**Expected reasoning:**

No. If the data is meaningful, a richer textual/data representation may be required.

---

### Challenge 4

The same image is used on two pages.

Page A uses it as a product image.

Page B uses it as a decorative background.

Should the semantic treatment necessarily be identical?

**Expected reasoning:**

No. Semantic role depends on context.

---

### Challenge 5

An icon-only button visually shows a magnifying glass.

What should the accessible name be?

**Expected reasoning:**

The control's function, such as "Search", rather than "Magnifying glass".

---

### Challenge 6

A CMS stores:

```text
image URL
```

but no alt text.

Who should automatically invent the semantic meaning?

**Expected reasoning:**

The architecture should define semantic ownership. The frontend should not blindly invent editorial meaning.

---

### Challenge 7

An AI system generates alt text containing private information visible in an uploaded image.

What should happen?

**Expected reasoning:**

The generated semantic metadata must pass through privacy/content controls before publication.

---

### Challenge 8

A localized page uses the same image bytes but different alt text.

Does the CDN necessarily need a new image representation?

**Expected reasoning:**

No. Semantic localization and visual representation identity are separate concerns.

---

# 61. Senior Interview Questions

### Question 1

> How do you design image accessibility in a component library?

Discuss:

```text
semantic image roles
required alt
decorative variants
functional images
icon controls
figure/caption
complex images
content ownership
testing
```

---

### Question 2

> How do you decide whether an image is decorative?

Discuss:

```text
Does it communicate information?
Does it affect interaction?
Would removing it remove meaningful content?
Is the same information already available as text?
```

---

### Question 3

> Why isn't `alt="image"` useful?

Because it identifies the medium rather than communicating the information conveyed by the image.

---

### Question 4

> How would you make a chart accessible?

Discuss:

```text
short identification
+
detailed textual explanation
+
underlying data where appropriate
+
visible caption
```

---

### Question 5

> How would you model image metadata in a CMS?

Discuss:

```text
asset identity
alt
caption
credit
locale
focal point
content type
accessibility ownership
```

---

### Question 6

> How should an icon button be represented?

Discuss:

```text
button semantics
+
accessible name
+
decorative icon
+
state synchronization
```

---

# 62. Anti-Patterns

## Anti-Pattern 1 — Generic Alt Text

```text
alt="image"
```

This communicates almost no useful information.

---

## Anti-Pattern 2 — Describing Pixels Instead of Meaning

```text
alt="Blue rectangle with three white lines"
```

may be inappropriate when the image actually represents:

```text
Menu
```

---

## Anti-Pattern 3 — Putting Everything Into Alt

Trying to encode:

```text
caption
credit
author
date
full article context
```

into one alt string produces poor experiences.

---

## Anti-Pattern 4 — Same Alt for Every Context

```text
asset
→
one hardcoded alt
```

ignores semantic context.

---

## Anti-Pattern 5 — Frontend Invents Editorial Meaning

The component should not guess what a photograph means when that information belongs to the content model.

---

## Anti-Pattern 6 — Decorative Images Announced as Content

This creates unnecessary noise for assistive technology users.

---

## Anti-Pattern 7 — Functional Icon Described Literally

```text
"trash can"
```

instead of:

```text
"Delete"
```

when the icon is a delete control.

---

## Anti-Pattern 8 — Complex Image With Only a Generic Label

```text
alt="Chart"
```

when the chart contains essential information.

---

## Anti-Pattern 9 — Accessibility Added After Architecture

If semantic requirements are considered only after the component is built, the resulting API often makes accessibility optional.

---

# 63. Production Image Semantics Architecture

A mature architecture can look like:

```text
                   CONTENT / CMS
                         │
                         ▼
                  Image Metadata
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
        Alt           Caption        Role/Usage
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                 Design System API
                         │
                         ▼
                 Semantic HTML
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
       Visual Browser          Assistive Tech
```

In parallel:

```text
Image Asset
    ↓
Responsive Selection
    ↓
Transformation
    ↓
CDN
    ↓
Optimized Pixels
```

The two systems meet at the rendered component.

---

# 64. Semantic Image Decision Tree

When implementing an image, ask:

```text
Does the image communicate information?
        │
   ┌────┴────┐
   │         │
  YES        NO
   │         │
   ▼         ▼
Informative  Decorative
   │
   ▼
Does it perform an action?
   │
   ├── YES → Functional semantics
   │
   └── NO
        │
        ▼
Does it contain complex information?
        │
   ├── YES → Rich alternative
   │
   └── NO → Concise alternative
```

Then ask:

```text
Is the same information already present nearby?
```

If yes, avoid unnecessary duplication.

---

# 65. The Most Important Invariants

### Invariant 1

```text
image asset ≠ image meaning
```

### Invariant 2

```text
visual importance ≠ semantic importance
```

### Invariant 3

```text
functional image → describe function
```

### Invariant 4

```text
decorative image → avoid unnecessary semantics
```

### Invariant 5

```text
alt text ≠ caption
```

### Invariant 6

```text
alt text ≠ pixel inventory
```

### Invariant 7

```text
complex image → information equivalence
```

### Invariant 8

```text
same asset ≠ same semantic role
```

### Invariant 9

```text
component API should encode semantic intent
```

### Invariant 10

```text
semantic content and image delivery are separate pipelines
```

### Invariant 11

```text
accessibility metadata is still content/data
```

### Invariant 12

```text
authorization boundaries still apply to accessible content
```

---

# 66. Completion Checklist

You should be able to explain:

### Semantic Roles

* [ ] informative images
* [ ] decorative images
* [ ] functional images
* [ ] complex images
* [ ] contextual semantics

### Alternative Text

* [ ] purpose-driven alt text
* [ ] contextual alt text
* [ ] redundant information
* [ ] generic alt anti-pattern
* [ ] information equivalence

### Interactive Images

* [ ] image buttons
* [ ] image links
* [ ] icon-only controls
* [ ] thumbnails
* [ ] zoom interactions
* [ ] stateful icons

### Complex Content

* [ ] charts
* [ ] diagrams
* [ ] maps
* [ ] infographics
* [ ] textual/data alternatives
* [ ] figure/caption

### Content Architecture

* [ ] CMS metadata
* [ ] alt ownership
* [ ] localization
* [ ] multi-tenant semantics
* [ ] user-generated images
* [ ] automated alt suggestions

### Engineering

* [ ] design-system contracts
* [ ] component API semantics
* [ ] accessibility testing
* [ ] screen reader testing
* [ ] regression testing
* [ ] semantic/content separation

---

# 67. Final Mental Model

The complete image architecture now has two parallel dimensions:

```text
                         IMAGE
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
       SEMANTIC SYSTEM              DELIVERY SYSTEM
             │                           │
       What does it mean?          How is it delivered?
             │                           │
       alt / caption / role         size / format / CDN
             │                           │
       interaction semantics        cache / transformation
             │                           │
       complex alternatives         responsive selection
             │                           │
             └─────────────┬─────────────┘
                           ▼
                         UI
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
        Visual User                 Assistive User
```

The senior-level principle is:

> **An image is simultaneously a visual resource and a semantic content object. Production architecture must optimize how its pixels are delivered without losing the meaning those pixels communicate.**

The strongest implementation therefore follows:

```text
Content Meaning
      ↓
Semantic Role
      ↓
Accessible Representation
      ↓
Component Contract
      ↓
Semantic HTML

AND

Asset Identity
      ↓
Responsive Representation
      ↓
Transformation
      ↓
Cache/CDN
      ↓
Optimized Pixels
```

The two pipelines should remain independently understandable while producing one coherent user experience.

**Part 07 complete.**
