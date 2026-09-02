# KPI 03 — HTML Parsing & DOM Construction

[⬅️ KPI 02: Navigation & Page Lifecycle](../02-Navigation-Page-Lifecycle/README.md) | [📚 Level 04 Master Hub](../README.md) | [KPI 04: CSSOM & Style System ➡️](../04-CSSOM-Style-System/README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer \| Founding Engineer)

---

# 🏛️ KPI CONTRACT & SYSTEM BOUNDARY

To ensure zero redundancy, deep causal mechanics, and strict architectural discipline, all material in KPI 03 adheres to this formal boundary contract.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   KPI 03 CONTRACT                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  KPI: KPI 03 — HTML Parsing & DOM Construction                                         │
│  Pillar: Pillar 1: Foundational Browser Model                                          │
│  Primary System Boundary: Byte stream conversion to in-memory C++ DOM tree             │
│  Inputs: Network byte stream chunks, character encodings, script/stylesheet streams     │
│  Outputs: C++ DOM Tree (Node/Element graph), DOM mutation events, DCL event trigger    │
│  Prerequisites: KPI 01 (Multi-process model & Main Thread), KPI 02 (Response streaming) │
│  Exit Capability: Predict, profile, diagnose, and optimize HTML parsing & DOM trees     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧭 Boundary Ownership Matrix

| System Domain | Status in KPI 03 | Owning KPI / Reference | Rationale |
| :--- | :---: | :--- | :--- |
| **Byte $\to$ Token $\to$ Node Pipeline** | **PRIMARY** | **KPI 03 (Here)** | Core mechanism of HTML5 parsing algorithm. |
| **HTML5 Error Recovery & Foster Parenting** | **PRIMARY** | **KPI 03 (Here)** | Deterministic malformed markup repair. |
| **C++ DOM Tree Memory Representation** | **PRIMARY** | **KPI 03 (Here)** | Blink/V8 `Node`, `Element`, `ContainerNode` pointers. |
| **Parser-Blocking Scripts & `document.write`** | **PRIMARY** | **KPI 03 (Here)** | Main thread tokenizer halting mechanics. |
| **CSSOM $\leftrightarrow$ Script Execution Interlock** | **PRIMARY** | **KPI 03 (Here)** | Why stylesheets block subsequent synchronous scripts. |
| **Speculative Preload Scanner** | **PRIMARY** | **KPI 03 (Here)** | Secondary thread resource lookahead discovery. |
| **Script Attributes (`defer`, `async`, `module`)** | **PRIMARY** | **KPI 03 (Here)** | Execution timing relative to parser and DCL. |
| Network Transport, TLS & QUIC | REFERENCE | [KPI 02](../02-Navigation-Page-Lifecycle/README.md) / [KPI 12](../12-Browser-Networking/README.md) | Hands off network byte streams to parser. |
| CSSOM Cascade & Style Calculation | REFERENCE | [KPI 04](../04-CSSOM-Style-System/README.md) | Produces CSSOM tree required for styling. |
| Render Tree, Layout & Compositing | REFERENCE | [KPI 05](../05-Rendering-Pipeline-Reflow-Repaint-Compositing/README.md) | Consumes DOM + CSSOM to compute geometry. |
| Event Loop & Task Queues | REFERENCE | [KPI 06](../06-Browser-Event-Loop-Scheduling/README.md) | Schedules script tasks and parser yield steps. |
| V8 JS Compilation & Execution | REFERENCE | [KPI 09](../09-JavaScript-Execution-in-Browser/README.md) | Executes JavaScript encountered by parser. |
| Core Web Vitals (FCP, LCP, INP) | REFERENCE | [KPI 20](../20-Browser-Performance-Core-Web-Vitals/README.md) | Metrics affected by parsing bottlenecks. |
| React/Next.js Hydration against DOM | REFERENCE | [KPI 23](../23-Browser-React-Nextjs-Execution-Model/README.md) & Level 06 | Hydrates virtual tree onto server-parsed DOM. |

---

## 🔒 Core Invariants (What Must Always Be True)

```text
Invariant 1: The HTML parser processes byte chunks incrementally as they arrive over the network; it does NOT wait for the full document to download.
Invariant 2: DOM tree construction is single-threaded and executes strictly on the Renderer Main Thread.
Invariant 3: A synchronous <script> without defer/async immediately halts the HTML tokenizer because JS can invoke document.write() to mutate the stream.
Invariant 4: A synchronous <script> cannot execute until all preceding external stylesheets are fully downloaded and parsed into the CSSOM.
Invariant 5: HTML parsing never throws a fatal syntax error; the HTML5 tree construction algorithm deterministically repairs malformed syntax into a valid tree.
Invariant 6: The Speculative Preload Scanner does NOT construct DOM nodes; it only scans raw tokens on a background thread to initiate early network fetches.
```

---

## 🗺️ Part Architecture & Delivery Plan (5 Deep Parts)

```text
KPI 03 — HTML Parsing & DOM Construction
│
├── PART 01 — Byte Stream to Token Pipeline (Bytes → Characters → Tokenizer State Machine → HTML5 Error Correction)
├── PART 02 — Tree Construction & DOM Memory Architecture (Open Element Stack, Foster Parenting, C++ Node Layout)
├── PART 03 — Parser-Blocking Scripts & The CSSOM Interlock (Synchronous Scripts, document.write, CSSOM Blocking)
├── PART 04 — Speculative Preload Scanner & Script Execution Scheduling (defer, async, type=module, fetchpriority)
└── PART 05 — Production Failure Traces, Profiling & Crucible (DevTools Parser Profiling, Large DOMs, Interview Traps)
```

---

## 📚 KPI 03 Part Index

| Part & File | Status | Key Focus & Causal Mechanics | Companion Lab |
| :--- | :---: | :--- | :--- |
| **[Part 01: Byte Stream to Tokens Pipeline](./01-byte-stream-to-tokens-pipeline.md)** | ✅ Completed | Byte stream decoding, character sets, tokenizer state machine, token emission, malformed tag recovery. | [🧪 Lab 01: Tokenizer State Machine](./examples/01-tokenizer-state-machine-lab.html) |
| **[Part 02: Tree Construction & DOM Memory](./02-tree-construction-dom-memory.md)** | ⏳ Next | Tree construction dispatcher, stack of open elements, foster parenting, C++ Node/Element pointer graph in Blink. | [🧪 Lab 02: DOM Tree & Foster Parenting](./examples/02-dom-tree-memory-lab.html) |
| **[Part 03: Parser-Blocking Scripts & CSSOM](./03-parser-blocking-scripts-cssom.md)** | ⏳ Pending | Parser pausing, synchronous `<script>`, `document.write` stream mutation, the CSSOM script-blocking lock. | [🧪 Lab 03: Parser-Blocking Lock Simulator](./examples/03-parser-blocking-cssom-lab.html) |
| **[Part 04: Speculative Preload Scanner](./04-speculative-preload-scanner.md)** | ⏳ Pending | Background preload scanner, lookahead token discovery, `defer` vs `async` vs `module` vs `fetchpriority`. | [🧪 Lab 04: Preload Scanner Waterfall](./examples/04-preload-scanner-waterfall-lab.html) |
| **[Part 05: Failure Traces & Crucible](./05-dom-parsing-crucible-diagnostics.md)** | ⏳ Pending | 10-step DevTools parser investigation runbook, large DOM memory bloat, prediction challenges, Staff interview traps. | [🧪 Lab 05: Parser Telemetry Analyzer](./examples/05-dom-parsing-telemetry-lab.html) |

---

## 🧪 Interactive Diagnostic Labs

* Companion interactive HTML diagnostic visualizers are placed in the [`examples/`](./examples/) directory for live runtime inspection.

---

[⬅️ KPI 02: Navigation & Page Lifecycle](../02-Navigation-Page-Lifecycle/README.md) | [📚 Level 04 Master Hub](../README.md) | [KPI 04: CSSOM & Style System ➡️](../04-CSSOM-Style-System/README.md)
