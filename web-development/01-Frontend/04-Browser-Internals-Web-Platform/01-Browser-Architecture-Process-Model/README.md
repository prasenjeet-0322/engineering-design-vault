# KPI 01 — Browser Architecture & Process Model

[⬅️ Back to Level 04 Master Hub](../README.md) | [KPI 02: Navigation & Page Lifecycle ➡️](../02-Navigation-Page-Lifecycle/README.md)

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)

---

## 🎯 Purpose & Conceptual Boundary

Before learning how HTML parses or how CSS renders, you must understand the **host execution environment**. A modern web browser is a **multi-process distributed operating system** that sandboxes untrusted web code, isolates hardware graphics pipelines, manages memory address spaces, and coordinates inter-process communication (IPC) over high-speed message buses.

```text
                                BROWSER ARCHITECTURE MODEL
                                
                                ┌────────────────────────┐
                                │     BROWSER PROCESS    │  (Privileged OS Access)
                                │ (UI, Tabs, Disk, Auth) │
                                └───────────┬────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │ Mojo IPC                   │ Mojo IPC                   │ Mojo IPC
               ▼                            ▼                            ▼
  ┌────────────────────────┐   ┌────────────────────────┐   ┌────────────────────────┐
  │    NETWORK PROCESS     │   │      GPU PROCESS       │   │    RENDERER PROCESS    │ (Sandboxed)
  │ (DNS, TLS, Sockets)    │   │ (Raster, 3D, Draw UI)  │   │ ┌────────────────────┐ │
  └────────────────────────┘   └────────────────────────┘   │ │ Main Thread (DOM/V8│ │
                                                            │ ├────────────────────┤ │
                                                            │ │ Compositor Thread  │ │
                                                            │ ├────────────────────┤ │
                                                            │ │ Raster Threads     │ │
                                                            │ └────────────────────┘ │
                                                            └────────────────────────┘
```

---

## 🗺️ KPI 01 Complete Part Map (9 Parts)

| Part | Title | Status | Core Focus |
|---|---|---|---|
| **Part 01** | [Browser as a System](./01-browser-as-a-system.md) | ✅ Completed | What a browser actually is, Browser $\neq$ V8 $\neq$ Blink, host environment, process vs thread, specification vs implementation. |
| **Part 02** | [Browser Processes](./02-browser-processes.md) | ✅ Completed | Browser, Renderer, GPU, Network, Utility processes, process allocation models, crash isolation. |
| **Part 03** | [Renderer Process & Main Thread](./03-renderer-process-main-thread.md) | ✅ Completed | Renderer responsibilities, Main thread execution, DOM/CSSOM coordination, JS $\leftrightarrow$ rendering bridge. |
| **Part 04** | [Browser Event Loop & Scheduling](./04-browser-event-loop-tasks-rendering.md) | ✅ Completed | Tasks vs Microtasks, microtask starvation, frame budgets, cooperative yielding, React Scheduler boundaries. |
| **Part 05** | [Navigation, Document & Page Lifecycle](./05-navigation-document-page-lifecycle.md) | ✅ Completed | Navigation resolution, document creation, `DOMContentLoaded`, `load`, `pageshow`, `visibilitychange`, BFCache, SPA routing. |
| **Part 06** | [Site Isolation & Security Boundaries](./06-site-isolation-security-boundaries.md) | ⏳ Next | Origin vs Site, Spectre/Meltdown mitigations, Out-of-Process iframes (OOPIFs), OS sandboxing. |
| **Part 07** | [IPC & Cross-Process Communication](./07-ipc-cross-process-communication.md) | ⏳ Pending | Why processes cannot share memory, Mojo IPC, shared memory buffers, serialization costs, security validation. |
| **Part 08** | [Browser ↔ Operating System](./08-browser-operating-system.md) | ⏳ Pending | OS processes, threads, file descriptors, network sockets, GPU drivers, permissions, hardware mediation. |
| **Part 09** | [Observing Architecture & Production Debugging](./09-observing-architecture-production-debugging.md) | ⏳ Pending | Task Manager, `chrome://gpu`, `chrome://process-internals`, Perfetto traces, production jank diagnostics. |

---

## 🧠 Practical Competencies Unlocked

* **Understand Failure Blast Radiuses:** Why a JavaScript infinite loop or memory leak in one tab cannot crash other tabs or freeze the browser UI window.
* **Master Thread Responsiveness:** How the Compositor thread can continue smoothly scrolling pages and running CSS animations even when the Main Thread is blocked by heavy JavaScript execution.
* **Architect Secure Embeds:** How Site Isolation and Out-of-Process iframes (OOPIFs) protect sensitive enterprise portals (e.g. Stripe checkout, payment forms, auth widgets) from cross-origin memory snooping.
* **Observe & Prove:** How to use browser task managers, GPU diagnostics, and trace visualizers to verify process models and identify hardware acceleration fallbacks.

---

## 🎓 Graduation Criteria

1. Clearly articulate the role, OS privileges, and failure blast radius of the **Browser, Renderer, GPU, and Network processes**.
2. Diagram how the **Main Thread**, **Compositor Thread**, and **Raster Threads** interact to produce visual frames.
3. Explain why **Site Isolation (OOPIFs)** was introduced following hardware side-channel attacks (Spectre/Meltdown) and how it affects iframe communication.
4. Diagnose whether an application is utilizing dedicated GPU hardware acceleration or falling back to CPU software rendering using modern diagnostic surfaces.

---

[⬅️ Back to Level 04 Master Hub](../README.md) | [KPI 02: Navigation & Page Lifecycle ➡️](../02-Navigation-Page-Lifecycle/README.md)
