# 📋 DevTools Runbook: Inspecting Live Process Topologies & OOPIFs

[⬅️ Back to KPI 01 Index](../README.md) | [🧪 Lab 01](./01-main-thread-vs-compositor-lab.html) | [🧪 Lab 02](./02-layout-thrashing-benchmark-lab.html) | [🧪 Lab 03](./03-event-loop-microtask-starvation-lab.html)

> **Module:** Level 04 — KPI 01: Browser Architecture & Process Model  
> **Diagnostic Surfaces:** Chrome Task Manager (`Shift + Esc`), `chrome://process-internals`, DevTools Console

---

## 🎯 Diagnostic Objective
Learn how to inspect the browser's live process architecture, map visual webpage components to their underlying operating system PIDs, verify Out-of-Process iframes (OOPIFs), and observe crash blast-radius containment.

---

## 🛠️ Step 1: Open and Configure Chrome Task Manager

1. Open Chrome or Edge.
2. Press **`Shift + Esc`** (or go to `Menu (⋮) ➔ More Tools ➔ Task Manager`).
3. Right-click any column header (e.g. "Task") to customize the visible telemetry metrics.
4. **Enable the following columns:**
   * ✅ **Process ID (PID):** The unique operating system process identifier.
   * ✅ **Memory footprint (Private memory):** Actual physical RAM committed solely to this process.
   * ✅ **CPU:** Real-time CPU core utilization.
   * ✅ **GPU Memory:** VRAM allocated to this process on the graphics card.
   * ✅ **JavaScript Memory:** V8 heap memory allocated for JS objects.

```text
┌──────────────────────────────────────┬───────┬───────────────────┬──────────────┐
│ Task                                 │ PID   │ Memory footprint  │ GPU Memory   │
├──────────────────────────────────────┼───────┼───────────────────┼──────────────┤
│ Browser                              │ 12040 │ 142 MB            │ 35 MB        │
│ GPU Process                          │ 14220 │ 89 MB             │ 210 MB       │
│ Network Service                      │ 9812  │ 45 MB             │ 0 MB         │
│ Tab: GitHub                          │ 18304 │ 120 MB            │ 12 MB        │
│ Subframe: https://www.youtube.com    │ 21008 │ 65 MB             │ 28 MB        │
└──────────────────────────────────────┴───────┴───────────────────┴──────────────┘
```

---

## 🛠️ Step 2: Proving Site Isolation & Out-of-Process Iframes (OOPIF)

1. Open a page that embeds a cross-origin third-party iframe (e.g. a blog with a YouTube embed or a checkout page with Stripe).
2. Look at Chrome Task Manager.
3. **Observation:**
   * Notice that the parent webpage has one **PID** (e.g. `18304`).
   * Notice that the embedded iframe is listed on a separate line prefixed with `Subframe: https://...` and holds a **completely different PID** (e.g. `21008`)!
4. **Architectural Verification:** This proves that the iframe is running in an **Out-of-Process Iframe (OOPIF)** with its own sandboxed virtual memory address space.

---

## 🛠️ Step 3: Observing Blast-Radius Containment & Crash Isolation

1. In your browser tab, open DevTools (`F12`) and navigate to the **Console**.
2. Run this command to deliberately crash the renderer process:
   ```javascript
   chrome.send('crash'); // In chromium internal testing or simulate via infinite allocation
   ```
   *(Alternative: In Chrome Task Manager, select the specific Tab and click **"End Process"**).*
3. **What to Observe:**
   * The tab immediately shows the **"Aw, Snap!" (Error code: Result code 5 / SIGSEGV)** crash screen.
   * Look at your other open tabs: **They are 100% functional and completely unaffected.**
   * Look at the top browser window (tabs, address bar, bookmarks): **The Browser Process remains alive.**
4. **Conclusion:** This visually verifies the **Fault Containment Guarantee** of the multi-process architecture.

---

## 🛠️ Step 4: Inspecting Process Trees via `chrome://process-internals`

1. Open a new tab and navigate to `chrome://process-internals` (or `edge://process-internals`).
2. Navigate to the **"Frame Trees"** tab.
3. You will see a real-time visual diagram showing:
   * The Root Frame (Host domain).
   * Child Subframes (Cross-origin iframes).
   * The exact **Site Instance** and **Process ID** assigned to each frame.

---

[⬅️ Back to KPI 01 Index](../README.md) | [🧪 Lab 01](./01-main-thread-vs-compositor-lab.html) | [🧪 Lab 02](./02-layout-thrashing-benchmark-lab.html) | [🧪 Lab 03](./03-event-loop-microtask-starvation-lab.html)
