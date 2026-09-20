# Level 08 — Next.js & Full-Stack React

## KPI 09 — Metadata, SEO & Document Representation

# Part 06 — Robots, Indexing Directives & Crawler Control Architecture

---

# 1. Part Objective

Parts 03–05 established how a document describes itself:

```text
Part 03
Dynamic metadata
        ↓
Part 04
Canonical + alternate URL identity
        ↓
Part 05
Social/share representation
```

This part introduces a different concern:

> **How should automated crawlers interact with this document and its representation?**

The architecture changes from:

```text
"What does this page represent?"
```

to:

```text
"Should this page be crawled?"
"Should this page be indexed?"
"Which representation should search systems associate with it?"
```

These are different questions.

The core mental model is:

```text
Request
   │
   ▼
Crawler
   │
   ├── Can I access this URL?
   │
   ├── Should I crawl this resource?
   │
   ├── Should I index this representation?
   │
   └── Which URL should represent this resource?
```

A mature SEO architecture therefore separates:

```text
crawl control
index control
canonical identity
content accessibility
```

---

# 2. Crawl vs Index

One of the most important distinctions in this part is:

```text
Crawling
    =
fetching/processing a resource

Indexing
    =
including a resource in a search index
```

They are not equivalent.

Conceptually:

```text
Crawler
   │
   ▼
Can access URL?
   │
   ▼
Fetch document
   │
   ▼
Read indexing directives
   │
   ▼
Decide whether representation
should participate in search indexing
```

Therefore:

```text
not crawlable
    ≠
not indexable
```

and:

```text
indexable
    ≠
guaranteed to appear in search
```

Search engines ultimately control their own indexing decisions.

Your application provides signals and constraints.

---

# 3. Robots.txt vs Robots Metadata

There are two major mechanisms developers commonly encounter:

```text
robots.txt
```

and:

```text
robots metadata
```

They operate at different layers.

Conceptually:

```text
                    Crawler
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        robots.txt          Document metadata
             │                   │
       crawl policy        indexing directives
```

A useful conceptual distinction is:

```text
robots.txt
    =
crawler access policy

robots metadata
    =
document indexing directives
```

They should not be treated as interchangeable.

---

# 4. robots.txt

A `robots.txt` file is generally located at:

```text
/robots.txt
```

For example:

```text
User-agent: *
Disallow: /admin/
Disallow: /internal/
```

Conceptually:

```text
origin
   │
   └── /robots.txt
```

The crawler retrieves the policy associated with the origin.

This means robots policy is fundamentally connected to:

```text
origin
host
routing
deployment
tenant architecture
```

---

# 5. robots.txt Is Origin-Scoped

Consider:

```text
example.com
```

and:

```text
tenant.example.com
```

These may represent different origins/hosts.

Therefore the robots architecture must account for:

```text
Host
  ↓
robots policy
```

A multi-tenant application must decide whether:

```text
all tenants
```

share one crawler policy or whether:

```text
tenant A
tenant B
tenant C
```

require distinct policies.

---

# 6. Host-Aware robots Architecture

Suppose:

```text
acme.example.com
globex.example.com
```

have different public/private states.

The application may require:

```text
Host
  ↓
Tenant
  ↓
Crawler policy
```

For example:

```text
Tenant A:
public storefront

Tenant B:
private staging tenant
```

Their crawler policies should not accidentally become identical.

The dangerous failure is:

```text
staging tenant
      ↓
production robots policy
      ↓
crawler access unexpectedly allowed
```

---

# 7. robots.txt Is Not Authentication

This is a critical security rule.

Bad assumption:

```text
Disallow: /admin/
```

means:

```text
/admin/ is protected.
```

It does not.

A crawler policy is not an authorization boundary.

Security must remain:

```text
Authentication
     +
Authorization
     +
Server-side enforcement
```

not:

```text
robots.txt
     ↓
security
```

---

# 8. Private Data Must Not Depend on robots.txt

Suppose:

```text
/admin/users
```

contains confidential data.

Adding:

```text
Disallow: /admin/users
```

does not make the data private.

The endpoint must still enforce authorization.

The correct architecture is:

```text
Request
   ↓
Authentication
   ↓
Authorization
   ↓
Resource access
```

Robots policy is an additional crawler-control mechanism.

---

# 9. Indexing Directives

Document-level robots directives can communicate indexing preferences.

Conceptually:

```text
index
noindex
follow
nofollow
```

A common example is:

```text
noindex
```

which communicates that the page should not be included in a search index.

The key distinction remains:

```text
crawl permission
        ≠
indexing preference
```

---

# 10. The `noindex` Mental Model

Consider:

```text
/search?q=react
```

A site may want the page to remain accessible to users but not be treated as a search result candidate.

Conceptually:

```text
User
  ↓
can access page

Crawler
  ↓
can fetch page

Indexing directive
  ↓
do not index
```

This is different from:

```text
robots.txt
  ↓
do not crawl
```

---

# 11. Why Blocking Crawl Can Conflict With Index Control

Suppose a URL is blocked by crawler access rules.

The crawler may not be able to retrieve the document and therefore may not be able to observe document-level directives.

Conceptually:

```text
robots.txt
   ↓
crawler cannot fetch document
   ↓
document-level directive cannot be reliably observed
```

Therefore:

> **Do not assume that combining crawl blocking and `noindex` gives a stronger version of `noindex`.**

The two mechanisms solve different problems.

---

# 12. Public Page vs Search Page

Consider an application with:

```text
/products/123
/search?q=react
```

A typical policy might be:

```text
Product page
    ↓
crawlable
indexable

Search result page
    ↓
crawlable
not intended for indexing
```

The important point is that:

```text
accessible
crawlable
indexable
```

are independent architectural dimensions.

---

# 13. URL Taxonomy

Before defining crawler policy, classify URLs.

For example:

```text
Public content
    /articles/*
    /products/*

Transactional
    /checkout/*
    /cart/*

User-specific
    /account/*
    /dashboard/*

Utility
    /search/*
    /preview/*

Internal
    /admin/*
    /internal/*
```

Then map each class to policy.

Example:

| URL class      | User access   | Search indexing    |
| -------------- | ------------- | ------------------ |
| Public article | Public        | Usually intended   |
| Product        | Public        | Usually intended   |
| Search results | Public        | Often not intended |
| Checkout       | User-specific | Not intended       |
| Dashboard      | Authenticated | Not intended       |
| Admin          | Restricted    | Not intended       |

The exact policy is application-specific.

---

# 14. URL Classification Before Metadata Generation

A mature architecture does not randomly attach:

```text
noindex
```

to individual pages.

Instead:

```text
URL
 ↓
Route classification
 ↓
Representation policy
 ↓
Metadata policy
 ↓
Crawler policy
```

For example:

```text
Route category:
search-results

→ index: false
→ canonical policy: defined
→ social policy: defined
```

This creates consistency.

---

# 15. Dynamic Routes

Dynamic routes create additional complexity.

Example:

```text
/products/[id]
```

Some products may be:

```text
published
```

while others are:

```text
draft
archived
private
```

Therefore indexing policy may depend on resource state.

Conceptually:

```text
Product
   │
   ├── published → indexable candidate
   ├── draft → noindex
   ├── private → protected
   └── archived → application-specific policy
```

The policy should derive from the resource state.

---

# 16. Resource State Machine

A useful model is:

```text
Draft
  │
  ▼
Published
  │
  ├── Active
  │
  └── Archived
```

Crawler policy can then derive from the state.

For example:

```text
draft
   ↓
not intended for indexing

published
   ↓
eligible for indexing

archived
   ↓
application-specific handling
```

The important architectural principle is:

> **Indexing policy should follow resource lifecycle semantics rather than arbitrary route logic.**

---

# 17. Authentication and Indexability

Authenticated pages generally create a different representation class.

For example:

```text
/dashboard
```

depends on:

```text
user
session
permissions
```

Therefore it is not equivalent to:

```text
/articles/react
```

which is public.

The architecture should classify:

```text
public representation
```

versus:

```text
personalized representation
```

before deciding crawler policy.

---

# 18. Personalized Pages

Consider:

```text
/account
```

The HTML may contain:

```text
username
orders
notifications
billing information
```

This is not a public resource representation.

Therefore the architecture should prevent accidental indexing.

Conceptually:

```text
User-specific representation
        ↓
not intended as public search representation
```

This should be enforced through the application's metadata/crawler policy rather than relying only on client behavior.

---

# 19. Query Parameters and Crawler Control

Query parameters introduce URL multiplicity.

Example:

```text
/products?sort=price
/products?sort=name
/products?filter=red
/products?filter=blue
```

Potentially:

```text
1 resource
   ↓
thousands of URLs
```

This creates crawl and indexing complexity.

The application should decide:

```text
Which query parameters
change representation identity?
```

This connects directly to Part 04.

---

# 20. Representation-Changing Parameters

Consider:

```text
/products?category=phones
```

If the parameter changes the actual resource set, it may represent a meaningful representation.

Compare:

```text
/products?utm_source=email
```

which typically does not change the underlying representation.

Therefore:

```text
representation-changing parameter
    ≠
tracking parameter
```

This distinction informs:

```text
canonical URL
indexing
crawl strategy
sitemap inclusion
```

---

# 21. Faceted Navigation

E-commerce systems often expose:

```text
/category/phones?brand=apple&storage=512
```

The combination count can explode.

For example:

```text
10 brands
×
5 storage options
×
8 colors
×
4 sizes
```

can create thousands of URL combinations.

The application must determine:

```text
Which combinations are valuable public representations?
```

and:

```text
Which are utility/filter states?
```

Crawler policy should follow that classification.

---

# 22. Search Pages

Internal search is another common case:

```text
/search?q=react
```

There may be:

```text
/search?q=react
/search?q=reactjs
/search?q=react+hooks
...
```

These pages are often useful to users but may not represent stable canonical content.

Therefore a common architectural decision is:

```text
User access:
allowed

Crawler access:
allowed or selectively controlled

Indexing:
not intended
```

The exact policy depends on the application's SEO strategy.

---

# 23. Preview Routes

Applications often have:

```text
/preview/article/123
```

or:

```text
/draft/article/123
```

These are generally not public representations.

A robust architecture classifies them explicitly:

```text
preview
    ↓
non-public representation
```

rather than relying on:

```text
"nobody knows the URL"
```

Security through obscurity is not authorization.

---

# 24. Staging Environments

A common production failure is:

```text
staging.example.com
```

being indexed.

The application should make environment policy explicit.

Conceptually:

```text
Production
   ↓
public indexing policy

Staging
   ↓
non-production indexing policy
```

This is especially important when:

```text
production data
```

is copied into:

```text
staging
```

because metadata may contain real content.

---

# 25. Environment-Aware Metadata

A representation policy can incorporate:

```text
environment
```

For example:

```text
production
    → normal public metadata

staging
    → noindex policy

development
    → not publicly accessible
```

The key is to make this deliberate and testable.

---

# 26. Environment Policy Must Not Replace Access Control

Again:

```text
staging
   ↓
noindex
```

does not mean:

```text
staging
   ↓
private
```

A staging application should still have appropriate access controls.

Correct:

```text
network/access control
+
authentication
+
authorization
+
crawler policy
```

---

# 27. `robots.txt` Generation in Next.js

Next.js supports application-level metadata and route conventions for metadata resources.

The important architectural concept is:

```text
application state
      ↓
robots policy
      ↓
/robots.txt
```

This makes crawler policy part of the application's deployment model.

A generated robots policy may depend on:

```text
environment
tenant
host
feature state
public routes
```

when the architecture requires it.

---

# 28. Dynamic robots Policy

Consider:

```text
Tenant A = public
Tenant B = suspended
Tenant C = staging
```

The robots response might need to reflect:

```text
Host
 ↓
Tenant state
 ↓
Crawler policy
```

This is another example of request context affecting document representation.

The cache identity must therefore account for any representation-affecting context.

---

# 29. robots.txt and Caching

Suppose:

```text
/robots.txt
```

is cached.

Then the application changes:

```text
Tenant state
```

or:

```text
environment policy
```

but the old robots response remains cached.

The crawler may continue receiving stale policy.

Therefore:

```text
robots policy
    ↓
cache
    ↓
invalidation
```

is a real production concern.

---

# 30. robots.txt Cache Identity

If policy depends on host:

```text
Host
   ↓
robots policy
```

then:

```text
cache key
```

must distinguish the host when necessary.

Otherwise:

```text
acme.example.com/robots.txt
```

could accidentally receive:

```text
globex.example.com/robots.txt
```

This is a classic representation/cache identity failure.

---

# 31. Robots + Multi-Tenant Architecture

A mature request model becomes:

```text
Request
   │
   ▼
Host
   │
   ▼
Tenant
   │
   ▼
Tenant state
   │
   ▼
Crawler policy
   │
   ▼
robots response
```

This is conceptually similar to the routing model established in KPI 07.

The important difference is the output:

```text
routing decision
```

versus:

```text
crawler-control representation
```

---

# 32. robots Policy and Custom Domains

Suppose:

```text
acme.com
```

and:

```text
acme.example.com
```

represent the same tenant.

The application may need both hosts to produce coherent crawler policy.

Otherwise:

```text
canonical:
https://acme.com/product/123

robots:
https://acme.example.com/...
```

can create confusing operational behavior.

The domain architecture should therefore define:

```text
canonical host
alternate hosts
crawler policy
redirect policy
```

together.

---

# 33. Canonical vs robots.txt

These mechanisms solve different problems.

```text
Canonical
    =
which URL represents the resource?

robots.txt
    =
what crawler access policy applies?

noindex
    =
should this representation be considered for indexing?
```

Therefore:

```text
canonical
≠
robots
≠
noindex
```

They can cooperate, but they are not substitutes.

---

# 34. Canonical vs noindex

Suppose:

```text
/products?sort=price
```

is a duplicate-like representation.

You might think:

```text
canonical = /products
noindex = true
```

But these are different signals.

The architectural question is:

```text
Does this URL represent
a useful canonical resource?
```

versus:

```text
Should this URL participate
in indexing?
```

The policy should be based on the representation model.

---

# 35. Redirect vs noindex

If a URL should no longer exist as a meaningful public representation:

```text
old-product-url
```

then a redirect may be more appropriate than simply:

```text
noindex
```

The distinction:

```text
redirect
    =
resource/navigation identity change

noindex
    =
representation should not be indexed
```

Do not use indexing directives as a substitute for URL migration.

---

# 36. Deleted Resources

Consider:

```text
/products/123
```

which previously existed but is now deleted.

Possible application behaviors include:

```text
not found
redirect
replacement resource
archived representation
```

The correct behavior depends on the domain.

The SEO/crawler policy should follow the resource lifecycle decision.

Do not blindly apply:

```text
noindex
```

to every deleted resource.

---

# 37. 404/410 vs noindex

These concepts represent different states.

```text
404
    =
resource not found

410
    =
resource intentionally gone

noindex
    =
resource exists but should not be indexed
```

This distinction matters because:

```text
resource existence
```

and:

```text
indexing eligibility
```

are separate dimensions.

---

# 38. Soft 404 Failure

A common architecture failure is:

```text
missing product
    ↓
HTTP 200
    ↓
"Product not found"
```

The application has created a representation that technically exists as a response but semantically represents a missing resource.

This can confuse:

```text
users
crawlers
indexing systems
analytics
```

Resource existence should therefore be represented consistently.

---

# 39. Indexing Policy as a Function

A useful abstraction is:

```text
indexingPolicy =
    f(
      route,
      resourceState,
      visibility,
      authentication,
      tenant,
      locale,
      environment,
      representation
    )
```

For example:

```text
if environment !== "production"
    → noindex

if resource.visibility !== "public"
    → noindex

if route.category === "search"
    → noindex
```

The exact rules are application-specific.

The important point is that the policy is deterministic and explainable.

---

# 40. Avoid Scattered SEO Conditions

Bad architecture:

```text
if draft → noindex
```

in one component,

then:

```text
if preview → noindex
```

in another,

then:

```text
if staging → noindex
```

in a third.

This creates policy drift.

Prefer:

```text
Representation Policy
        │
        ├── canonical
        ├── indexing
        ├── social
        └── crawler policy
```

where appropriate.

---

# 41. Crawler Policy Object

A conceptual model:

```text
CrawlerPolicy
{
    crawlable
    indexable
    canonicalUrl
}
```

Then:

```text
Resource
   ↓
Representation policy
   ↓
CrawlerPolicy
```

The metadata layer serializes the result.

This makes policy testable independently from rendering.

---

# 42. Policy Testing

Test the policy independently.

Example:

```text
describe("article crawler policy")
```

Cases:

```text
published article
draft article
private article
preview article
staging environment
localized article
tenant-specific article
```

Expected result:

```text
crawlable?
indexable?
canonical?
```

This is much more robust than manually inspecting generated HTML.

---

# 43. Production Debugging

When a page unexpectedly appears in search:

Do not start by changing random metadata.

Trace:

```text
URL
 ↓
route classification
 ↓
resource state
 ↓
visibility
 ↓
indexing policy
 ↓
robots metadata
 ↓
robots.txt
 ↓
canonical identity
 ↓
sitemap inclusion
```

Then determine where the policy diverged.

---

# 44. When a Page Is Not Appearing

The opposite problem requires a different trace:

```text
URL
 ↓
is it publicly accessible?
 ↓
can crawler fetch it?
 ↓
robots policy
 ↓
noindex?
 ↓
canonical points elsewhere?
 ↓
sitemap?
 ↓
resource quality/state?
```

Do not assume:

```text
"it's in the sitemap"
```

means:

```text
"it must be indexed."
```

---

# 45. Sitemap Relationship

Sitemaps and robots directives are related but distinct.

Conceptually:

```text
Sitemap
    =
URLs the site wants crawlers to discover

robots
    =
crawler policy

canonical
    =
preferred resource identity

noindex
    =
indexing directive
```

These signals should not contradict one another unnecessarily.

For example:

```text
sitemap
    contains URL

but

page
    says noindex
```

may indicate policy drift.

---

# 46. SEO Representation Graph

At this point KPI 09 has a broader architecture:

```text
                    Resource
                       │
              Representation Model
                       │
       ┌───────────────┼────────────────┐
       ▼               ▼                ▼
     Page          Metadata          Crawler Policy
       │               │                │
       │        ┌──────┼──────┐         ├── robots.txt
       │        ▼      ▼      ▼         └── indexing
       │      SEO     Canonical Social
       │             /alternate
       │
       ▼
    HTML
```

The goal is consistency across these representations.

---

# 47. Production Scenario — Search Pages

Suppose the application has:

```text
/search?q=react
```

Users need the page.

Business does not want thousands of search-result URLs indexed.

Architecture:

```text
User
 ↓
search page
 ↓
accessible

Crawler
 ↓
may fetch

Indexing policy
 ↓
noindex
```

The URL can remain useful without becoming a canonical search-result document.

---

# 48. Production Scenario — Draft Content

An editor creates:

```text
/articles/react-server-components
```

but status is:

```text
draft
```

The editor previews it while authenticated.

The architecture should distinguish:

```text
preview representation
```

from:

```text
public representation
```

A robust design might enforce:

```text
Authentication
      +
Authorization
      +
non-indexable preview representation
```

The exact access model depends on the product.

---

# 49. Production Scenario — Tenant Suspension

Suppose:

```text
tenant = Acme
state = suspended
```

The application must determine:

```text
Should pages remain public?
Should they redirect?
Should they return unavailable?
Should crawler policy change?
```

This is a business/domain decision first.

Crawler behavior should follow the resulting resource state.

Do not encode the entire tenant lifecycle inside SEO metadata.

---

# 50. Production Scenario — Staging Accident

A staging deployment accidentally becomes publicly accessible.

A layered defense should include:

```text
network/access controls
        +
authentication
        +
environment-aware indexing policy
        +
appropriate robots policy
```

No single layer should be treated as sufficient security.

---

# 51. 4-Pillar Engineering Decision Matrix

## robots.txt

### When to use

When you need crawler access policy at the origin/URL level.

### When not to use

Do not use it as an authorization mechanism or as the only mechanism for protecting private data.

### Bottlenecks

Incorrect host policy, stale caching, overly broad rules.

### Modern alternative

Generate crawler policy from explicit application/environment/tenant state where appropriate.

---

## `noindex`

### When to use

When a resource is accessible but should not be intended for search indexing.

### When not to use

Do not use it as a replacement for redirects, authorization, or resource deletion semantics.

### Bottlenecks

Policy drift and incorrect assumptions about crawlability.

### Modern alternative

Centralize indexing policy around route/resource representation.

---

## Route classification

### When to use

When an application has multiple public, private, utility, and transactional URL classes.

### When not to use

Avoid building arbitrary SEO logic directly into unrelated components.

### Bottlenecks

Scattered conditions and inconsistent policy.

### Modern alternative

Use an explicit representation/crawler policy layer.

---

## Environment-aware crawler policy

### When to use

When staging, preview, or non-production deployments can become externally accessible.

### When not to use

Never rely on crawler policy as the sole environment security boundary.

### Bottlenecks

Caching and configuration drift.

### Modern alternative

Combine environment-aware metadata with actual access controls.

---

# 52. Prediction Challenges

## Challenge 1

A page has:

```text
noindex
```

but is also blocked in:

```text
robots.txt
```

What is the architectural problem?

The system is mixing two different control mechanisms:

```text
crawl access
```

and:

```text
indexing directives
```

You must reason about whether the crawler can even observe the document-level directive.

---

## Challenge 2

A staging site suddenly appears in search.

What should you investigate?

```text
environment
 ↓
accessibility
 ↓
robots.txt
 ↓
indexing metadata
 ↓
sitemap
 ↓
canonical
```

Do not assume robots.txt was the only control.

---

## Challenge 3

Acme and Globex have different crawler policies, but both receive Acme's `/robots.txt`.

What failed?

Likely:

```text
host-aware representation
```

or:

```text
cache identity
```

---

## Challenge 4

A deleted product page returns HTTP 200 with:

```text
noindex
```

Is that automatically correct?

No.

First determine whether the resource should:

```text
exist
redirect
be unavailable
remain archived
```

Crawler policy follows resource semantics.

---

## Challenge 5

A search page is public and useful to users but should not become a search-engine landing page.

What conceptual model fits?

```text
accessible
    +
crawl/index policy deliberately separated
```

rather than making the page inaccessible.

---

# 53. Senior Interview Gotchas

### Gotcha 1

**"robots.txt protects private pages."**

False.

It is not an authorization boundary.

---

### Gotcha 2

**"`noindex` means the crawler cannot access the page."**

False.

Indexing and crawling are separate concerns.

---

### Gotcha 3

**"Everything in the sitemap gets indexed."**

False.

A sitemap is a discovery signal, not a guaranteed indexing command.

---

### Gotcha 4

**"Canonical means the other URLs cannot be crawled."**

False.

Canonical expresses preferred resource identity.

---

### Gotcha 5

**"A private page is safe because it has `noindex`."**

False.

Authorization must prevent unauthorized access.

---

### Gotcha 6

**"Staging only needs robots.txt."**

False.

Staging requires actual access/security controls as well.

---

### Gotcha 7

**"Every dynamic route should be indexable."**

False.

Indexability depends on the semantic role and lifecycle of the representation.

---

# 54. 30-Second Executive Cheat Sheet

```text
Crawl
    =
can crawler access/fetch?

Index
    =
should representation participate
in search indexing?

robots.txt
    =
crawler access policy

noindex
    =
indexing directive

canonical
    =
preferred resource identity

sitemap
    =
discovery signal
```

Never confuse:

```text
crawler policy
with
authorization
```

A production architecture is:

```text
Request
   ↓
Route classification
   ↓
Resource state
   ↓
Visibility
   ↓
Representation policy
   │
   ├── canonical
   ├── indexing
   ├── social
   └── crawler policy
```

---

# 55. Completion Checklist

You should be able to explain:

* [ ] Crawl vs index
* [ ] robots.txt mental model
* [ ] document-level indexing directives
* [ ] robots vs noindex
* [ ] robots vs authentication
* [ ] robots vs authorization
* [ ] route classification
* [ ] public vs private representations
* [ ] dynamic resource states
* [ ] draft vs published content
* [ ] preview routes
* [ ] authenticated pages
* [ ] query parameters
* [ ] faceted navigation
* [ ] search pages
* [ ] staging environments
* [ ] host-aware robots policies
* [ ] multi-tenant crawler policy
* [ ] robots caching
* [ ] cache identity
* [ ] canonical vs noindex
* [ ] redirect vs noindex
* [ ] deleted resources
* [ ] 404/410 vs noindex
* [ ] sitemap relationship
* [ ] crawler-policy testing
* [ ] SEO debugging
* [ ] indexing failure diagnosis
* [ ] environment-aware crawler architecture

---

# Part Boundary

This part establishes:

```text
Crawler
   ↓
access policy
   +
indexing policy
```

The KPI progression is now:

```text
Part 01
Metadata Mental Model
        ↓
Part 02
Static Metadata
        ↓
Part 03
Dynamic Metadata
        ↓
Part 04
Canonical URLs + Alternates
        ↓
Part 05
Open Graph + Social Representation
        ↓
Part 06
Robots + Indexing Directives
```

The next part should move into **structured data / JSON-LD and machine-readable entity representation**.

That introduces another representation layer:

```text
Human-readable document
        +
machine-readable structured representation
```

The key engineering question becomes:

> **How do we expose domain entities to search systems in a structured, semantically consistent, and maintainable way without duplicating or contradicting application data?**

**Part 06 is complete when you can design crawler and indexing policy from route, resource, tenant, environment, and representation state—and can clearly distinguish robots.txt, noindex, canonical URLs, redirects, authorization, and sitemap discovery.**
