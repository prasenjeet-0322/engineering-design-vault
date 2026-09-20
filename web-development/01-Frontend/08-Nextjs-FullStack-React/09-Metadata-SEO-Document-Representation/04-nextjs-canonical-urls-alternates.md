# Level 08 — Next.js & Full-Stack React

## KPI 09 — Metadata, SEO & Document Representation

# Part 04 — Canonical URLs, Alternates & URL Identity Architecture

---

# 1. Part Objective

A web application can expose the same underlying resource through multiple URLs.

For example:

```text
/products/123
/products/123?utm_source=google
/products/123?utm_source=email
/products/123?ref=homepage
```

Or through multiple localized representations:

```text
/en/products/123
/fr/products/123
/de/products/123
```

Or through tenant-specific hosts:

```text
acme.example.com/products/123
globex.example.com/products/123
```

The application therefore needs a clear answer to:

> **Which URL represents which resource, and how should alternate representations relate to one another?**

This is the purpose of canonical and alternate URL metadata.

The central model is:

```text
Request URL
     │
     ▼
URL normalization
     │
     ▼
Resource identity
     │
     ├── canonical URL
     │
     ├── alternate URLs
     │
     └── current representation
```

The key distinction is:

```text
URL received
    ≠
canonical identity
    ≠
all possible representations
```

---

# 2. Why URL Identity Is a Senior-Level Concern

At small scale, URL handling looks simple:

```text
/product/123
```

At production scale, URL identity can involve:

```text
domain
tenant
locale
path
query parameters
trailing slash policy
case normalization
legacy routes
redirects
rewrites
pagination
filters
tracking parameters
canonicalization
```

If these dimensions are not deliberately modeled, the application can create:

```text
duplicate representations
incorrect canonical URLs
incorrect alternate URLs
routing loops
cache fragmentation
incorrect social previews
inconsistent indexing signals
```

Therefore:

> **Canonicalization is fundamentally a resource-identity problem, not merely an SEO configuration problem.**

---

# 3. Canonical vs Current URL

Suppose the browser requests:

```text
https://example.com/products/123?utm_source=email
```

The application may determine:

```text
resource = Product 123
canonical =
https://example.com/products/123
```

The current URL is:

```text
https://example.com/products/123?utm_source=email
```

The canonical identity is:

```text
https://example.com/products/123
```

So:

```text
Current URL
    ↓
specific request representation

Canonical URL
    ↓
preferred resource identity
```

They do not have to be identical.

---

# 4. Canonical Is Not a Redirect

This distinction must be automatic.

## Redirect

```text
Browser
   │
   ▼
URL A
   │
   ▼
HTTP redirect
   │
   ▼
URL B
```

The browser navigates to URL B.

---

## Canonical metadata

```text
Browser
   │
   ▼
URL A
   │
   ▼
HTML document
   │
   └── canonical = URL B
```

The browser remains on URL A.

The document communicates its preferred URL identity.

Therefore:

```text
Redirect
=
navigation/routing behavior

Canonical
=
document identity signal
```

---

# 5. When Canonicalization Is Useful

Canonical URLs are useful when multiple URLs represent substantially the same resource.

Common examples:

```text
tracking parameters
```

```text
session-independent query parameters
```

```text
legacy URLs
```

```text
duplicate route forms
```

```text
content aliases
```

```text
sorting/filtering URLs
```

```text
localized representations
```

The critical question is:

> Do these URLs represent the same resource or meaningfully different representations?

That determines whether canonicalization is appropriate.

---

# 6. Tracking Parameters

Consider:

```text
/products/123?utm_source=email
/products/123?utm_source=google
/products/123?utm_campaign=sale
```

If these parameters affect only attribution:

```text
utm_source
utm_medium
utm_campaign
```

then they generally should not become separate resource identities.

The conceptual normalization is:

```text
Incoming URL
    │
    ├── tracking parameters
    │
    ▼
Canonical resource URL
```

Result:

```text
/products/123
```

The application therefore distinguishes:

```text
analytics context
```

from:

```text
resource identity
```

---

# 7. Not Every Query Parameter Is Noise

Do not blindly remove all query parameters.

Consider:

```text
/products?category=laptops
```

versus:

```text
/products?category=phones
```

These may represent meaningfully different filtered representations.

Likewise:

```text
/search?q=react
```

and:

```text
/search?q=nextjs
```

represent different query results.

Therefore:

```text
Query parameter
    ≠
automatically non-canonical
```

The correct question is:

> **Does this parameter change the document's semantic representation or merely track how the user arrived?**

---

# 8. Resource Identity vs Representation State

A useful model is:

```text
Resource identity
        +
Representation state
```

For example:

```text
Product 123
    +
sort=price
```

may be different from:

```text
Product 123
```

depending on the route architecture.

For a product detail page:

```text
/products/123?utm_source=email
```

the parameter may not alter representation.

For a listing page:

```text
/products?category=laptops
```

the parameter may fundamentally alter representation.

Therefore canonicalization must be **domain-aware**.

---

# 9. `alternates`

Next.js exposes alternate URL relationships through metadata configuration.

Conceptually:

```ts
alternates: {
  canonical: '/products/123',
}
```

The broader concept is:

```text
alternates
    │
    ├── canonical
    └── alternate representations
```

Alternate representations can be important for localization and other URL relationships.

---

# 10. Canonical URL as a Function

For a production application, think of canonical URL generation as:

```text
canonicalURL =
    f(
        resource,
        locale,
        tenant,
        routing policy
    )
```

For example:

```text
Product 123
locale = en
tenant = acme
```

might resolve to:

```text
https://acme.example.com/en/products/123
```

while:

```text
Product 123
locale = fr
tenant = acme
```

might resolve to:

```text
https://acme.example.com/fr/products/123
```

The canonical URL is therefore derived from application identity rules.

---

# 11. Canonical URLs and `metadataBase`

Canonical URLs frequently need an absolute origin.

Conceptually:

```text
metadataBase
      +
relative canonical
      ↓
absolute canonical
```

For example:

```text
metadataBase:
https://example.com

canonical:
/products/123
```

becomes:

```text
https://example.com/products/123
```

This creates a deployment concern.

---

# 12. Environment-Specific Origins

Consider:

```text
local:
http://localhost:3000

staging:
https://staging.example.com

production:
https://example.com
```

A production deployment must not accidentally generate:

```text
https://staging.example.com/products/123
```

as its canonical URL.

Therefore:

```text
Deployment environment
        │
        ▼
Canonical origin
        │
        ▼
Metadata URLs
```

should be deliberately configured.

---

# 13. Host-Based Multi-Tenancy

Consider:

```text
acme.example.com/products/123
globex.example.com/products/123
```

The pathname is identical:

```text
/products/123
```

but the host changes tenant identity.

Therefore:

```text
Host
 ↓
Tenant
 ↓
Resource
 ↓
Canonical URL
```

The canonical URL must preserve the correct tenant representation when tenant identity is part of the public URL.

A catastrophic failure would be:

```text
acme.example.com/products/123
        ↓
canonical:
https://globex.example.com/products/123
```

This is not merely an SEO problem.

It indicates incorrect representation identity.

---

# 14. Locale-Based Routing

Consider:

```text
/en/products/123
/fr/products/123
/de/products/123
```

These may represent localized versions of the same underlying resource.

The model becomes:

```text
Resource
   │
   ├── English representation
   ├── French representation
   └── German representation
```

Canonical and alternate metadata should reflect that relationship.

This is where canonicalization becomes more subtle.

---

# 15. Canonical Does Not Always Mean "Choose One Language"

A common mistake is:

```text
/en/products/123
/fr/products/123
/de/products/123
```

with every page canonicalizing to:

```text
/en/products/123
```

That can incorrectly collapse distinct localized representations.

Instead, the application must determine whether:

```text
English
French
German
```

are:

```text
separate valid localized representations
```

or:

```text
duplicates of one representation
```

The routing and content model must answer that question.

---

# 16. Alternate Language Representations

Conceptually:

```text
Current document:
French product page

Alternates:
English → /en/products/123
French  → /fr/products/123
German  → /de/products/123
```

The metadata communicates:

```text
This document belongs to a family
of localized representations.
```

The important model is:

```text
                 Product 123
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
      en             fr            de
       │             │             │
       ▼             ▼             ▼
   /en/...        /fr/...       /de/...
```

---

# 17. Canonical + Alternates

A useful representation model is:

```text
Localized resource family
          │
          ├── current representation
          │
          ├── canonical identity
          │
          └── alternate representations
```

For example:

```text
Current:
https://example.com/fr/products/123

Canonical:
https://example.com/fr/products/123

Alternates:
en → https://example.com/en/products/123
de → https://example.com/de/products/123
```

The exact strategy depends on the application's localization model.

---

# 18. Canonicalization and Routing

Canonical metadata does not replace routing normalization.

Suppose:

```text
/products/123/
```

and:

```text
/products/123
```

are treated as equivalent.

The application may establish:

```text
canonical:
/products/123
```

and separately use routing policy to determine whether the slash form should redirect.

The layers are:

```text
Routing policy
    ↓
Should the URL change?

Canonical metadata
    ↓
What URL represents the resource?
```

These are related but distinct decisions.

---

# 19. Canonicalization and Redirects Together

A robust URL architecture can use both.

Example:

```text
Legacy:
 /product?id=123

Canonical:
 /products/123
```

Possible flow:

```text
Request
   │
   ▼
Legacy route
   │
   ▼
Redirect
   │
   ▼
/products/123
   │
   ▼
Canonical metadata
   │
   ▼
/products/123
```

This creates a stable external URL identity.

---

# 20. Canonicalization and Rewrites

Now consider:

```text
/public/products/123
```

internally rewritten to:

```text
/internal/catalog/123
```

The browser sees:

```text
/public/products/123
```

The internal route is not necessarily the public canonical URL.

Therefore:

```text
External URL
      ↓
Rewrite
      ↓
Internal implementation route
```

and:

```text
Canonical
      ↓
Public resource identity
```

should normally remain conceptually separate.

This connects canonical metadata to the middleware/routing architecture from KPI 07.

---

# 21. Canonical URLs and Cache Identity

This is one of the most important cross-KPI connections.

Suppose:

```text
/product/123?utm_source=email
```

and:

```text
/product/123?utm_source=google
```

have the same canonical identity.

If the cache treats them as completely separate entries:

```text
cache key A
cache key B
```

the application can experience unnecessary cache fragmentation.

Conversely, if the cache collapses URLs that actually represent different content, it can serve the wrong representation.

Therefore:

```text
Canonical identity
       ≠
automatically cache key
```

but both should be based on the same understanding of representation identity.

---

# 22. Canonical Identity vs Cache Identity

This distinction deserves explicit treatment.

### Canonical identity

Answers:

> Which URL should represent this resource?

### Cache identity

Answers:

> Which requests can safely reuse the same representation?

These questions are related but not identical.

For example:

```text
/product/123?utm_source=email
```

and:

```text
/product/123?utm_source=google
```

may share:

```text
canonical identity
```

and potentially share:

```text
cached representation
```

But:

```text
/products?category=laptops
```

and:

```text
/products?category=phones
```

may not.

Therefore:

```text
canonicalization
+
representation equivalence
```

must inform cache design.

---

# 23. Canonical Identity and Personalization

Consider:

```text
/products/123
```

with:

```text
?currency=USD
```

If currency changes the displayed price:

```text
USD representation
EUR representation
```

then currency may be representation-affecting.

You cannot automatically assume:

```text
same canonical URL
=
same rendered representation
```

The application needs to determine whether currency belongs in:

```text
URL identity
```

or:

```text
request/context state
```

and then design caching accordingly.

---

# 24. Canonicalization and Query Parameters

A useful classification is:

```text
                 Query Parameter
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
Representation-changing       Tracking/context
          │                         │
          ▼                         ▼
Potentially canonical           Usually normalized
identity dimension
```

Examples:

### Tracking

```text
utm_source
utm_medium
utm_campaign
```

Usually not resource identity.

### Representation

```text
category
page
sort
filter
query
```

Potentially representation-changing.

But the correct classification is application-specific.

---

# 25. Pagination

Consider:

```text
/products?page=1
/products?page=2
/products?page=3
```

These may be distinct representations of a collection.

Therefore, blindly canonicalizing every page to:

```text
/products
```

can destroy meaningful URL identity.

The correct approach depends on the application's content model and how pagination is intended to be represented.

The senior engineer should never apply a blanket rule such as:

```text
"Remove all query parameters from canonical URLs."
```

---

# 26. Filtered Collections

Consider:

```text
/products?brand=apple
/products?brand=samsung
```

The result sets differ.

Therefore:

```text
brand
```

may affect representation.

The application must determine whether filtered collection URLs are:

```text
indexable content
```

or:

```text
navigation/state URLs
```

That decision affects:

```text
canonical
robots
routing
caching
```

This demonstrates why SEO metadata cannot be designed independently from application routing.

---

# 27. Search Pages

Consider:

```text
/search?q=react
```

and:

```text
/search?q=nextjs
```

The result representation changes with:

```text
q
```

Therefore:

```text
q
```

is representation-affecting.

The application may still decide that search-result pages should not be indexed.

That creates a separate question:

```text
Does query affect representation?
        ↓
Yes

Should representation be indexed?
        ↓
Separate policy decision
```

This distinction is important.

---

# 28. Canonical vs Robots

These fields answer different questions.

### Canonical

```text
Which URL represents this resource?
```

### Robots

```text
What should crawlers do with this document?
```

Therefore:

```text
canonical
    ≠
indexing policy
```

A document can have:

```text
canonical = /products/123
robots = noindex
```

depending on the application's intended behavior.

---

# 29. Canonical vs Open Graph URL

Open Graph can contain a URL representing the shared object.

The application should avoid creating contradictory signals such as:

```text
canonical:
https://example.com/products/123

og:url:
https://example.com/products/456
```

unless there is a deliberate reason.

A useful invariant is:

```text
Public document identity
        ↓
should remain internally coherent
```

Metadata fields should describe the same representation.

---

# 30. Canonical URL Generation Function

A useful architecture is:

```text
getCanonicalUrl(resourceContext)
```

Conceptually:

```text
resourceContext
    │
    ├── tenant
    ├── locale
    ├── resource
    └── routing policy
    │
    ▼
canonical URL
```

This centralizes URL identity rules.

Instead of scattering:

```text
"https://example.com/products/" + id
```

through:

```text
page.tsx
generateMetadata()
sitemap
Open Graph
redirect logic
emails
```

you establish a consistent URL-generation boundary.

---

# 31. URL Builders

A mature application often has domain-aware URL builders:

```text
routes.product(id)
routes.productCanonical(product)
routes.localizedProduct(locale, product)
routes.tenantProduct(tenant, product)
```

The important principle is:

> **URL construction should encode application identity rules rather than being assembled ad hoc in every consumer.**

This reduces divergence between:

```text
routing
metadata
navigation
sitemaps
structured data
```

---

# 32. Canonical URL and Type Safety

TypeScript can help represent route inputs.

For example:

```text
ProductRouteInput
{
    id
    locale
    tenant
}
```

Then:

```text
buildProductUrl(input)
```

can enforce required dimensions.

The important distinction remains:

```text
Type correctness
    ≠
URL correctness
```

A function can be perfectly type-safe while producing the wrong domain.

Testing must therefore validate actual URL semantics.

---

# 33. Testing Canonical URLs

Canonical URL logic should be tested independently.

Example test matrix:

| Input                            | Expected canonical  |
| -------------------------------- | ------------------- |
| `/products/123`                  | `/products/123`     |
| `/products/123?utm_source=email` | `/products/123`     |
| `/products/123?ref=home`         | depends on policy   |
| `/en/products/123`               | localized canonical |
| `/fr/products/123`               | localized canonical |
| tenant A + product 123           | tenant A URL        |
| tenant B + product 123           | tenant B URL        |

This is much stronger than testing only:

```text
page renders successfully
```

---

# 34. Canonical URL Failure Modes

## Failure 1 — Wrong host

```text
acme.example.com
```

produces:

```text
globex.example.com
```

canonical.

### Likely issue

Tenant/origin resolution.

---

## Failure 2 — Wrong locale

```text
/fr/products/123
```

produces:

```text
/en/products/123
```

canonical.

### Likely issue

Locale context was lost.

---

## Failure 3 — Tracking parameters preserved

```text
/products/123?utm_source=email
```

canonicalizes to itself.

### Possible issue

URL normalization does not distinguish tracking context from resource identity.

---

## Failure 4 — Meaningful filter removed

```text
/products?brand=apple
```

canonicalizes to:

```text
/products
```

even though the filtered page is intentionally treated as a distinct representation.

### Likely issue

Over-aggressive canonicalization.

---

## Failure 5 — Canonical points to nonexistent resource

```text
/products/123
```

canonical:

```text
/products/macbook-pro
```

but that slug does not exist.

### Likely issue

Resource-to-URL mapping inconsistency.

---

# 35. Canonical URL and Caching Failure

Suppose:

```text
/products/123?currency=USD
```

and:

```text
/products/123?currency=EUR
```

produce different prices.

But the cache key ignores:

```text
currency
```

Then:

```text
USD request
   ↓
cached USD representation
   ↓
EUR request
   ↓
receives USD representation
```

This demonstrates:

```text
URL identity
+
representation identity
+
cache identity
```

must be reasoned about together.

---

# 36. Production Architecture

A mature architecture can look like:

```text
                     REQUEST
                        │
                        ▼
                 URL Normalization
                        │
                        ▼
                  Route Resolution
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           Tenant     Locale    Params
              │         │         │
              └─────────┼─────────┘
                        ▼
                 Resource Identity
                        │
              ┌─────────┼──────────┐
              ▼         ▼          ▼
          Page URL   Canonical   Alternates
              │         │          │
              └─────────┼──────────┘
                        ▼
                   Metadata
                        │
                        ▼
                      HTML
```

The central principle:

```text
URL metadata should be derived
from the same identity model that
drives application routing.
```

---

# 37. 4-Pillar Engineering Decision Matrix

## Canonical URL

### When to use

When a resource has a preferred public URL identity.

### When not to use

Do not use canonical metadata as a substitute for:

* redirects
* authorization
* routing normalization

### Bottlenecks / tradeoffs

Incorrect canonicalization can create contradictory resource identity signals.

### Modern alternative

Centralize canonical URL generation and test it as a first-class domain concern.

---

## Alternate URLs

### When to use

When multiple legitimate representations exist, especially localized representations.

### When not to use

Do not invent alternate URLs that do not correspond to valid representations.

### Bottlenecks

Incorrect alternate relationships can point consumers to:

```text
404
wrong locale
wrong tenant
wrong resource
```

### Modern alternative

Generate alternates from the same route/resource identity model.

---

## Query-Parameter Canonicalization

### When to use

When parameters are clearly non-semantic tracking/navigation context.

### When not to use

When a parameter changes the actual document representation.

### Bottlenecks

Over-normalization can collapse genuinely distinct content.

### Modern alternative

Maintain an explicit parameter classification policy.

---

# 38. Prediction Challenges

## Challenge 1

These requests arrive:

```text
/products/123?utm_source=email
/products/123?utm_source=google
```

The product content is identical.

What should you investigate before deciding whether they share canonical identity?

**Answer:**

Determine whether the query parameters alter resource representation or are merely attribution context.

---

## Challenge 2

These routes exist:

```text
/en/products/123
/fr/products/123
```

Should both automatically canonicalize to `/en/products/123`?

**Answer:**

No automatic assumption should be made. Determine whether the locale paths represent legitimate localized representations or duplicate URLs.

---

## Challenge 3

Two tenants use:

```text
acme.example.com/products/123
globex.example.com/products/123
```

Should their canonical URLs be identical?

**Answer:**

Not if tenant identity is part of the public resource representation. The canonical URL must preserve the correct tenant context.

---

## Challenge 4

A filtered collection:

```text
/products?brand=apple
```

is canonicalized to:

```text
/products
```

What should you investigate?

**Answer:**

Whether `brand=apple` materially changes the intended representation and whether filtered collection pages are intentionally distinct public resources.

---

## Challenge 5

A page's canonical URL is correct, but its cache serves the wrong locale.

Is canonical metadata sufficient to fix this?

**Answer:**

No. Canonical metadata does not repair cache identity. Locale must participate in representation/cache identity where locale changes the output.

---

# 39. Senior Interview Gotchas

### Gotcha 1

**"Canonical URL means the URL the browser is currently on."**

Not necessarily.

It is the preferred resource identity.

---

### Gotcha 2

**"Every query parameter should be removed."**

False.

Some query parameters change the representation.

---

### Gotcha 3

**"Canonical replaces redirects."**

False.

Canonical metadata and redirects operate at different layers.

---

### Gotcha 4

**"All localized pages should canonicalize to one language."**

Not necessarily.

Localized representations may legitimately coexist.

---

### Gotcha 5

**"Canonical URL is the cache key."**

Not necessarily.

Canonical identity and cache reuse are related but distinct concepts.

---

### Gotcha 6

**"Robots and canonical solve the same problem."**

No.

Robots communicates crawler behavior; canonical communicates preferred URL identity.

---

### Gotcha 7

**"If canonical is correct, metadata is correct."**

No.

Open Graph, robots, locale, title, description, and other metadata can still contradict the document.

---

# 40. 30-Second Executive Cheat Sheet

```text
Canonical URL
    =
preferred public identity of a resource.

Redirect
    =
navigation behavior.

Rewrite
    =
internal routing transformation.

Alternate URL
    =
another legitimate representation.

Canonicalization must understand:

    tenant
    locale
    route
    resource
    query parameters
    URL policy

Important distinction:

tracking parameter
    ≠
representation parameter

And:

canonical identity
    ≠
cache identity

But both should be based on
the same representation model.

Core invariant:

Metadata URL identity
    must agree with
application resource identity.
```

---

# 41. Completion Checklist

You should be able to explain:

* [ ] Canonical URL
* [ ] Current URL vs canonical URL
* [ ] Canonical vs redirect
* [ ] Canonical vs rewrite
* [ ] `alternates`
* [ ] `metadataBase`
* [ ] Absolute URL generation
* [ ] Environment-specific origins
* [ ] Host-based tenant canonicalization
* [ ] Locale-aware canonicalization
* [ ] Alternate language representations
* [ ] Tracking query parameters
* [ ] Representation-affecting query parameters
* [ ] Pagination URL identity
* [ ] Filter URL identity
* [ ] Search URL identity
* [ ] Canonical vs robots
* [ ] Canonical vs Open Graph URL
* [ ] Canonical identity vs cache identity
* [ ] URL builders
* [ ] Canonical URL testing
* [ ] Multi-tenant URL correctness
* [ ] Locale URL correctness
* [ ] Canonical failure modes
* [ ] Production URL-identity architecture

---

# Part Boundary

This part establishes **canonical and alternate URL identity architecture**.

It deliberately does not yet go deeply into:

```text
Open Graph
    ↓
Social card architecture
    ↓
Dynamic social images
    ↓
Robots policy
    ↓
Structured data
```

Those are separate metadata consumers and should be treated as separate architectural concerns.

The governing mental model for this part is:

```text
Request URL
    ↓
Normalize
    ↓
Resolve resource identity
    ↓
Determine representation
    ↓
Generate canonical / alternates
    ↓
Generate metadata
    ↓
Render document
```

**Part 04 is complete when you can look at a URL space and determine which URLs are equivalent, which represent distinct resources, which are alternate representations, which should redirect, and which canonical identity should be communicated to external consumers.**
