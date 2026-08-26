# KPI 09 — Arrays & Functional Data Manipulation

[⬅️ KPI 08 — Iterators, Iterables & Generators](../08-Iterators-Generators/README.md) | [📚 JavaScript Index](../README.md) | [KPI 10 — Error Handling & Debugging ➡️](../10-Error-Handling-Debugging/README.md)

---

## Overview

Arrays are the primary data structure in modern frontend applications—powering UI lists, table grids, state management collections, API response handling, and real-time event streams.

This 10-part master curriculum provides an exhaustive, senior-level deep dive into Array Engine Mechanics (V8 Element Kinds, Memory Layouts), Intent-Driven Method Classification, Declarative Transformations (`map`, `filter`, `reduce`), Search & Predicates (`find`, `findIndex`, `some`, `every`), In-Place vs Immutable Sorting (`toSorted`), Structural Transformations (`flat`, `flatMap`), Method Chaining Pipelines, Complex State Transitions, and High-Throughput Performance Profiling.

---

## 🗺️ Module Architecture & Navigation

| Part | Title | Document | Key Architectural Focus | Status |
|---|---|---|---|---|
| **Part 1** | Array Mental Model, Iteration, Mutation & `forEach()` | [01-array-mental-model-iteration-mutation-foreach.md](./01-array-mental-model-iteration-mutation-foreach.md) | V8 Element Kinds, shallow copy object reference traps, `forEach()` return semantics, async `forEach` bugs, and local mutation purity | 🟢 Complete |
| **Part 2** | `map()` — Transformation, Referential Integrity & Data Mapping | [02-map-transformation-referential-integrity.md](./02-map-transformation-referential-integrity.md) | 1-to-1 value projections, React list rendering keys, structural sharing, DTO $\to$ ViewModel mapping, and `parseInt` traps | 🟢 Complete |
| **Part 3** | `filter()` — Selection, Search Pipelines & Immutable Updates | [03-filter-selection-search-pipelines.md](./03-filter-selection-search-pipelines.md) | Predicate filtering, `filter(Boolean)` scalar data loss traps, nullish checks, multi-facet search pipelines, and immutable item deletion | 🟢 Complete |
| **Part 4** | `find()`, `findIndex()`, `some()` & `every()` | [04-find-findIndex-some-every.md](./04-find-findIndex-some-every.md) | Early-exit searching, vacuous truth in `every()`, `-1` index hazards, RBAC access control, and form validation engines | 🟢 Complete |
| **Part 5** | `reduce()` — Accumulation, Grouping & Anti-Patterns | [05-reduce-accumulation-grouping-antipatterns.md](./05-reduce-accumulation-grouping-antipatterns.md) | Universal folding ($T[] \to U$), $O(N^2)$ spread traps, entity indexing, frequency maps, `Object.groupBy()`, and pipeline composition | 🟢 Complete |
| **Part 6** | `sort()` — In-Place Mutation, Comparators & `toSorted()` | [06-sort-comparators-stable-ordering.md](./06-sort-comparators-stable-ordering.md) | ASCII string coercion trap, TimSort stability, ES2023 `toSorted()`, `Intl.Collator`, and multi-column table sorting | 🟢 Complete |
| **Part 7** | `flat()` & `flatMap()` — Nested Structural Transformations | [07-flat-flatmap-nested-structures.md](./07-flat-flatmap-nested-structures.md) | 1-to-many projections, infinite query flattening, parent context preservation, and command palette search indexing | 🟢 Complete |
| **Part 8** | Method Chaining & Functional Data Pipelines | [08-method-chaining-data-pipelines.md](./08-method-chaining-data-pipelines.md) | Canonical pipeline ordering, filter-early rule, top-N sorting vs slicing, ViewModel projection, and selector architecture | 🟢 Complete |
| **Part 9** | Complex Immutable Updates & State Transformations | [09-complex-immutable-updates-state-architecture.md](./09-complex-immutable-updates-state-architecture.md) | Structural sharing, shallow spread pitfalls, multi-tier nested `.map()`, normalized stores (`byId`/`allIds`), and optimistic rollbacks | 🟢 Complete |
| **Part 10** | Senior-Level Array Decisions, Performance & Master KPI Architecture | [10-senior-array-decisions-performance-profiling.md](./10-senior-array-decisions-performance-profiling.md) | Large dataset benchmarks ($>10^5$ items), TypedArrays (`Uint8Array`), and complete KPI architecture | 🟡 In Progress |

---

## 📁 Runnable Code Examples (`examples/`)

- [`examples/01-array-mental-model-iteration-mutation-foreach.js`](./examples/01-array-mental-model-iteration-mutation-foreach.js): Demonstrates the async `forEach` trap vs sequential `for...of` & concurrent `Promise.all`, shallow copy nested object mutation trap, `forEach` return contract (`undefined`), sparse array hole skipping, and encapsulated local mutation purity.
- [`examples/02-map-transformation-referential-integrity.js`](./examples/02-map-transformation-referential-integrity.js): Demonstrates the `parseInt` in `map` radix coercion bug & unary fixes, arrow function block body return trap, object literal parentheses rule, structural sharing preservation, and DTO $\to$ ViewModel transformation pipelines.
- [`examples/03-filter-selection-search-pipelines.js`](./examples/03-filter-selection-search-pipelines.js): Demonstrates the `filter(Boolean)` scalar data loss trap vs explicit nullish checks (`!= null`), reference preservation of filtered items, `filter()` vs `find()` return invariants, async predicate filtering (`Promise.all` + mask), and multi-facet audit log query engines.
- [`examples/04-find-findIndex-some-every.js`](./examples/04-find-findIndex-some-every.js): Demonstrates vacuous truth in `[].every()` & `-1` index sentinel value handling, `find()` and `some()` early termination execution traces, `findIndex()` vs `indexOf()` reference matching, and form validation / RBAC engines.
- [`examples/05-reduce-accumulation-grouping-antipatterns.js`](./examples/05-reduce-accumulation-grouping-antipatterns.js): Demonstrates $O(N^2)$ accumulator spread benchmark vs $O(N)$ local mutation, missing return fallback to `undefined`, empty array `TypeError` prevention, pipeline composition (`pipe`), and multi-field cart aggregators.
- [`examples/06-sort-comparators-stable-ordering.js`](./examples/06-sort-comparators-stable-ordering.js): Demonstrates `sort()` in-place mutation vs immutable `toSorted()`, lexicographical number sort fix, TimSort stability, multi-field composite sorting, `Intl.Collator` natural alphanumeric comparison, and dynamic data table sorting engines.
- [`examples/07-flat-flatmap-nested-structures.js`](./examples/07-flat-flatmap-nested-structures.js): Demonstrates `flat()` on object property myth vs `flatMap()`, parent context preservation during 1-to-many unrolling, depth levels (`1`, `2`, `Infinity`), 0/1/M element expansion, recursive category tree walker, and command palette search indexing.
- [`examples/08-method-chaining-data-pipelines.js`](./examples/08-method-chaining-data-pipelines.js): Demonstrates global sort $\to$ slice vs local slice $\to$ sort ordering invariant, property stripping pre-filter bug fix, type and shape flow tracking, invariant normalization extraction, and paginated e-commerce catalog pipelines.
- [`examples/09-complex-immutable-updates-state-architecture.js`](./examples/09-complex-immutable-updates-state-architecture.js): Demonstrates shallow spread mutation trap vs structural sharing, reference preservation in single-item updates, multi-tier nested updates, normalized store cascade deletions, optimistic rollbacks, and atomic Kanban transitions.

---

## 🧭 Industry Badges & Evaluation Guide

- 🟢 **[Daily Driver]**: Core mental models used constantly in day-to-day frontend development.
- 🟡 **[Moderate]**: Intermediate patterns used for specialized SDK configuration, architecture, and code reviews.
- 🔵 **[Foundational / Engine Internals]**: V8 engine internals, AST scope analysis, memory context lifting, and Staff-level concepts.
