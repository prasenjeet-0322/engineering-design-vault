# PART 12: Fallback UX, Accessibility & Progressive Degradation

> **Tier:** 🔴 MUST KNOW (Core Senior Full-Stack Competency)  
> **Focus:** Designing failure UI that remains usable, accessible, understandable, and operational when the primary UI has failed.  
> **Author & Lead System Architect:** [Srikar Kudurmalla](https://www.linkedin.com/in/kudurmallasrikar/) (Full Stack Developer | Founding Engineer)  
> **Companion Interactive Lab:** [`examples/12-fallback-ux-accessibility-progressive-degradation.html`](./examples/12-fallback-ux-accessibility-progressive-degradation.html)

---

## 1. ⚡ 30-Second Executive Cheat Sheet

### Core Mental Model

An Error Boundary answers:
> **“What should React render when this subtree can no longer render normally?”**

It does **not** answer:
> **“How should the user recover from every possible failure?”**

That second question belongs to **resilience UX architecture**.

```text
Component Failure
       │
       ▼
Error Boundary
       │
       ▼
Failure Classification
       │
       ├── Expected / Recoverable (Inline domain state, retryable network)
       │
       ├── Unexpected / Isolated (Tier 4 WebGL crash, D3 calculation error)
       │
       └── Critical / Unrecoverable (Tier 1 Root crash, Auth token corruption)
       │
       ▼
Fallback UX
       │
       ├── Explain (Plain language: What happened & What is impacted)
       ├── Preserve (Form drafts, Session storage, Sibling features)
       ├── Recover (Bounded retry, Route redirect, Hard reload)
       ├── Escalate (Correlation ID, Telemetry bus, Support ticket)
       └── Degrade (Static 2D Table, Standard Textarea, Read-only view)
       │
       ▼
User Can Continue Safely (Zero WSOD, Zero Lost Data)
```

### Architectural Equation

$$\text{Effective Failure UX} = \text{Containment} \times \text{Comprehension} \times \text{Accessibility} \times \text{Recovery} \times \text{Preservation}$$

If any single factor approaches zero:
- **Zero Containment:** A leaf crash unmounts the whole app (100% blast radius).
- **Zero Comprehension:** The user sees a cryptic `TypeError: Cannot read properties of undefined`.
- **Zero Accessibility:** Screen reader users get stuck in a silent focus void (`<body>`).
- **Zero Recovery:** The user is locked out with no retry, reset, or navigation path.
- **Zero Preservation:** A 50-field checkout form draft is wiped because a recommendation widget crashed.

---

## 2. 🎯 The Five Responsibilities of a Good Fallback

A production-grade resilient fallback must provide concrete, unambiguous answers to five fundamental user questions:

```text
+---------------------------------------------------------------------------------------+
|                       THE 5 RESPONSIBILITIES OF A RESILIENT FALLBACK                  |
+---------------------------------------------------------------------------------------+
| 1. WHAT HAPPENED?     | Clear, non-technical explanation devoid of scary stack traces. |
| 2. WHAT WAS PRESERVED?| Explicit confirmation that uncommitted work/session is safe.   |
| 3. WHAT CAN USER DO?  | Contextually appropriate recovery action (Retry, Edit, Export).|
| 4. WHAT REMAINS OK?   | Reassurance that sibling widgets & navigation still work.      |
| 5. WHAT HAPPENS NEXT? | Escalation path (Support ticket, Incident correlation ID).     |
+---------------------------------------------------------------------------------------+
```

### Bad Fallback vs Resilient Fallback Comparison

| Criterion | ❌ Anti-Pattern (Naive Fallback) | ✅ Production Standard (Resilient Fallback) |
| :--- | :--- | :--- |
| **Headline** | `Something went wrong.` | `Real-time Revenue Chart is temporarily unavailable.` |
| **User Impact** | None specified (Implies entire app is broken). | `Your billing and invoicing tools remain operational.` |
| **Preservation** | Silent (User fears data loss). | `Your unsaved invoice draft (INV-9021) has been preserved.` |
| **Recovery Control** | `Fix` or `Reload` (Reloads whole page). | `↻ Retry 2D Chart View` (Bounded backoff retry). |
| **Observability** | None rendered. | `Incident Ref: ERR-9482-US (Copied to clipboard)` |
| **Accessibility** | `<div className="error">Error</div>` | `<section role="region" aria-labelledby="heading-id">` |

## 3. 🎨 Fallbacks Are Not Merely Visual Decorations

A common senior engineering misconception is treating fallback components as purely visual "error skins" designed by the design team. In reality, a fallback is an active **state machine transition node** within your application's failure architecture.

```text
                                  Primary UI Tree
                                         │
                                   💥 Runtime Crash
                                         │
                                         ▼
                            ┌────────────────────────┐
                            │ ResilientBoundary Fiber │
                            └────────────────────────┘
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
          [Fallback State Machine]                [Observability Bus]
          - Bounded Retry Counter                 - Dual Stack Capture
          - Focus Management Target               - Correlation ID Generation
          - Layout CLS Reservation                - PII Sanitization
          - Ephemeral State Preservation          - Sentry / Datadog Flush
```

A poorly designed fallback creates a **Secondary Cascade Failure**:
1. It requests missing theme/auth contexts and throws a second unhandled exception.
2. It drops keyboard focus into the document root, stranding assistive tech users.
3. It immediately triggers an unthrottled infinite retry loop, DoS'ing the backend and freezing the browser main thread.
4. It shifts layout dimensions, causing severe Cumulative Layout Shift (CLS > 0.4).

---

## 4. 🏢 Failure UX Tiers & Scope Containment

Different failure domains require radically different fallback designs and recovery scopes:

```text
+-------------------------------------------------------------------------------+
| TIER 1: ROOT-LEVEL LAST-RESORT RECOVERY                                       |
| - Scope: Entire Application Document                                          |
| - Layout: Fullscreen Zero-Dependency HTML/CSS Crash View                     |
| - Recovery: Hard Reload (window.location.reload()) + Session Cache Flush      |
| +---------------------------------------------------------------------------+ |
| | TIER 2: ROUTE-LEVEL SANDBOX FALLBACK                                      | |
| | - Scope: Active Router Outlet (/dashboard/analytics)                      | |
| | - Layout: Sandboxed View within Persistent Header & Navigation Shell      | |
| | - Recovery: Reset Route Key + "Return to Dashboard" Redirect CTA          | |
| | +-----------------------------------------------------------------------+ | |
| | | TIER 3: FEATURE POD FALLBACK                                          | | |
| | | - Scope: Autonomous Domain Module (e.g. Chat Pod, Invoice Pod)        | | |
| | | - Layout: Pod Error Card with Local Draft State Recovery              | | |
| | | - Recovery: Pod Context Unmount/Remount + Local Store Reset           | | |
| | | +-----------------------------------+ +-----------------------------+ | | |
| | | | TIER 4: WIDGET BULKHEAD FALLBACK  | | TIER 4: WIDGET BULKHEAD     | | | |
| | | | - Scope: Single Leaf Widget       | | - Scope: Third-Party Iframe | | | |
| | | | - Layout: Degraded 2D Table View  | | - Layout: Direct Link CTA   | | | |
| | | | - Recovery: Local Circuit Retry   | | - Recovery: Iframe Reload   | | | |
| | | +-----------------------------------+ +-----------------------------+ | | |
| | +-----------------------------------------------------------------------+ | |
| +---------------------------------------------------------------------------+ |
+-------------------------------------------------------------------------------+
```

### Architectural Scope Breakdown

| Failure Domain | Visual Footprint | User Work Preserved? | Focus Movement Strategy | Recovery Action |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 4: Widget** | Inline Card / Table ($<5\%$) | 100% Preserved | **Do NOT move focus** (Avoid disruption) | Local Component Retry |
| **Tier 3: Feature Pod** | Module Container ($20-40\%$) | 100% Form Drafts Preserved | Move focus to **Pod Heading** if active | Reset Pod Store / Restore Draft |
| **Tier 2: Route View** | Router Viewport ($60-80\%$) | Global Session Preserved | Move focus to **Route Error Heading** | Re-attempt Route / Navigate Home |
| **Tier 1: App Root** | Full Viewport ($100\%$) | Ephemeral Session Cleared | Move focus to **Fatal Alert Heading** | Hard Document Reload |

## 5. 📉 Progressive Degradation vs Catastrophic Failure

Enterprise applications should lose functionality gracefully rather than collapsing completely.

```text
   [ FULL EXPERIENCE ] ─── High-speed WebGL Visualizer, Real-time WebSockets, Live Audio
            │
      Hardware / Network Fault
            │
            ▼
 [ FEATURE DEGRADED ] ─── 2D Canvas Fallback, Polling REST fallback, Text Transcript
            │
      Extended Disconnect / Parser Error
            │
            ▼
  [ FEATURE REMOVED ] ─── Static Accessible HTML Table, Export CSV Link
            │
      Route Loader Timeout
            │
            ▼
   [ ROUTE DEGRADED ] ─── Sandboxed Outage Notice, Persistent Header/Nav Operational
            │
      Global Initialization Failure
            │
            ▼
 [ LAST-RESORT SHELL] ─── Emergency Static HTML Recovery Screen
```

### Principle of Maximum Useful Functionality:
> **Preserve the maximum amount of useful functionality consistent with data correctness and security.**

If the WebGL rendering engine crashes on a revenue dashboard, do not hide the entire revenue module. Degrade immediately to a clean, accessible HTML table of data points.

---

## 6. 🚫 Degradation vs Hiding Errors (The `return null` Anti-Pattern)

A dangerous anti-pattern in junior React codebases is silently swallowing errors:

```tsx
// ❌ DANGEROUS ANTI-PATTERN: Silent Degradation
function NaiveAnalyticsWidget() {
  try {
    return <ComplexChartEngine />;
  } catch (err) {
    return null; // 🚨 Silent disappearance!
  }
}
```

### Why `return null` on Exception is Disastrous:
1. **Zero User Comprehension:** The user is left wondering whether data is zero, loading, or missing due to permissions.
2. **Zero Recovery:** The user has no way to re-trigger or inspect the failed component.
3. **Zero Telemetry:** The engineering team receives no error reports or Sentry events.
4. **Layout Collapse:** Removing a 400px container instantly triggers severe Cumulative Layout Shift (CLS), jarring the user's viewport.

`null` is a valid intentional UI state (e.g. `if (!hasPermission) return null;`), but it is **never** an acceptable generic exception handling strategy.

## 7. ♿ Accessibility (a11y) as Core Resilience Architecture

A failure UI that cannot be navigated by keyboard users or announced by screen readers (NVDA, JAWS, VoiceOver, TalkBack) is **architecturally broken** and violates WCAG 2.1 AA legal compliance.

```text
+-------------------------------------------------------------------------------+
| WCAG 2.1 AA RESILIENCE CHECKLIST                                              |
+-------------------------------------------------------------------------------+
| [x] 1. Semantic Region Landmarks (<section role="region" aria-labelledby="...">)|
| [x] 2. Intentional Heading Hierarchy (Never skip heading levels)             |
| [x] 3. Context-Aware Focus Ownership (No focus drop to document root)         |
| [x] 4. Non-Disruptive Live Announcements (aria-live="polite" vs "assertive")  |
| [x] 5. Visible, High-Contrast Focus Rings (Minimum 3:1 contrast against bg)   |
| [x] 6. Color-Independent State Communication (Icons + Text + Badges)          |
| [x] 7. Actionable Controls with Explicit Descriptions (type="button")         |
| [x] 8. Minimum Text Contrast Ratio (4.5:1 normal text, 3:1 large text)        |
+-------------------------------------------------------------------------------+
```

---

## 8. 🗣️ Semantic Error Messages & Heading Hierarchies

Visual styling alone cannot convey error status to assistive technologies.

```tsx
// ❌ BAD: Div Soup with Color Reliance
<div className="bg-red-500 text-white p-4">
  <span>Error!</span>
  <button onClick={retry}>Retry</button>
</div>

// ✅ GOOD: Semantic Landmark with ARIA Labelling
<section 
  role="region" 
  aria-labelledby="analytics-failure-title" 
  className="p-5 border border-rose-900/50 bg-rose-950/20 rounded-xl"
>
  <div className="flex items-center gap-2 mb-2">
    <span aria-hidden="true" className="text-rose-400">⚠️</span>
    <h3 id="analytics-failure-title" className="text-sm font-bold text-rose-200">
      Real-Time Revenue Analytics Unavailable
    </h3>
  </div>

  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
    We could not render the interactive canvas chart. Your financial transactions and account balances remain secure and unaffected.
  </p>

  <button 
    type="button" 
    onClick={retry}
    aria-describedby="analytics-failure-title"
    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold focus-visible:outline-2 focus-visible:outline-rose-400"
  >
    Retry Revenue Chart
  </button>
</section>
```

## 9. 🎯 Focus Management & DOM Replacement Mechanics

When an uncaught exception occurs during rendering, React unmounts the failed DOM subtree and mounts the fallback component in its place.

```text
[1. User typing in search input inside Widget] ─── Focus on <input id="widget-search">
                        │
                  💥 Crash in Widget
                        │
[2. React reconciles and unmounts <input>] ────── Focused element disappears from DOM!
                        │
[3. Browser automatically resets focus] ──────── Focus drops to <body> (Document Root)
                        │
[4. Keyboard User presses TAB] ───────────────── Focus jumps to top navbar (Lost Context!)
```

### The "Lost Focus Trap"
If focus is dropped to `<body>`, keyboard and screen reader users lose their place entirely. When they press `Tab`, focus begins at the top-left of the entire web page (e.g. the logo or skip-nav link), forcing them to tab through 40+ controls to return to their task.

---

## 10. 🧭 Strategic Focus Movement (Scope-Based Transitions)

Should every Error Boundary automatically move focus? **No.** Automatic focus theft is highly disorienting if applied indiscriminately.

```text
+-----------------------+-----------------------------+------------------------------------+
| Failure Scope         | Focus Strategy              | Architectural Rationale            |
+-----------------------+-----------------------------+------------------------------------+
| Small Leaf Widget     | **PRESERVE / DO NOT STEAL** | User may be typing in an adjacent  |
| (e.g. Sparkline)      | Focus stays on active input | form; stealing focus disrupts task.|
+-----------------------+-----------------------------+------------------------------------+
| Feature Pod           | **SMART FOCUS**             | If focus was INSIDE failed pod,    |
| (e.g. Chat Box)       | Shift to Fallback Heading   | move to heading. Otherwise leave.  |
+-----------------------+-----------------------------+------------------------------------+
| Route Outage          | **ASSERTIVE FOCUS**         | Entire viewport changed. Move focus|
| (e.g. /analytics)     | Focus on <h2> Route Error   | to error heading with tabIndex="-1"|
+-----------------------+-----------------------------+------------------------------------+
| Application Root      | **CRITICAL FOCUS**          | App shell gone. Move focus to main |
| (Tier 1 Outage)       | Focus on <h1> Crash Title   | restart CTA immediately.           |
+-----------------------+-----------------------------+------------------------------------+
```

### Senior Implementation: Focus Ref Management in Boundaries
```tsx
export class ResilientBoundary extends Component<Props, State> {
  private headingRef = React.createRef<HTMLHeadingElement>();
  private retryBtnRef = React.createRef<HTMLButtonElement>();

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { tier } = this.props;

    // Only shift focus if the failure scope warrants an intentional transition
    if (tier === 'ROUTE' || tier === 'ROOT') {
      setTimeout(() => {
        if (this.headingRef.current) {
          this.headingRef.current.focus();
        }
      }, 50);
    }
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section aria-labelledby="error-heading">
          {/* tabIndex="-1" allows programmatic focus without adding to Tab sequence */}
          <h2 id="error-heading" ref={this.headingRef} tabIndex={-1} className="focus:outline-none focus:ring-2">
            Route Unavailable
          </h2>
          <button ref={this.retryBtnRef} type="button" onClick={this.handleReset}>
            Try Again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

## 11. 📢 `role="alert"` vs `role="region"` vs `aria-live` Semantics

A common mistake is slapping `role="alert"` on every error fallback.

```text
+-------------------+--------------------+------------------+------------------------------------+
| ARIA Role / Tag   | Live Politeness    | Interruption     | Ideal Use Case                     |
+-------------------+--------------------+------------------+------------------------------------+
| role="alert"      | assertive          | **IMMEDIATE**    | Critical Root outages, immediate   |
|                   |                    | Cuts off speech  | session expiry, irreversible loss. |
+-------------------+--------------------+------------------+------------------------------------+
| aria-live="polite"| polite             | **QUEUED**       | Leaf widget degradation, inline    |
|                   |                    | Waits for silence| table fallback, async retries.     |
+-------------------+--------------------+------------------+------------------------------------+
| role="region"     | Off / None         | **NONE**         | Large feature panel or route error |
|                   |                    | Discovered on tab| section with multiple controls.    |
+-------------------+--------------------+------------------+------------------------------------+
```

### Senior Accessibility Rule:
> **Never interrupt screen reader speech with `role="alert"` for minor leaf widget failures.** Use `aria-live="polite"` or rely on semantic landmarks (`<section role="region">`) so the user can discover the issue naturally.

---

## 12. 🔘 Actionable Recovery Controls & Semantic Button Names

Buttons inside fallbacks must communicate their precise operational scope.

```text
❌ Ambiguous Labels:
  [ Fix ]           <-- What will it fix?
  [ Retry ]         <-- What is being retried?
  [ Try Again ]     <-- Will my form input be erased?
  [ Click Here ]    <-- Destroys screen reader accessibility

✅ Actionable Semantic Labels:
  [ ↻ Retry Revenue Chart ]
  [ Return to Dashboard Overview ]
  [ Copy Diagnostic Event ID ]
  [ Authorize via Direct Invoice ]
```

## 13. 🔁 Bounded Retry Policies & Circuit Breakers

A naive retry button that executes an unthrottled loop creates a **Denial of Service (DoS)** on your backend and locks the browser UI thread.

```text
                              [ User Clicks Retry ]
                                        │
                                        ▼
                          [ Check Failure Count (N) ]
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                    [ N < 3 ]                      [ N >= 3 ]
                         │                             │
                 Calculate Backoff                     ▼
          Delay = 1000ms * (1.5 ^ N)         [ TRIP CIRCUIT BREAKER ]
                         │                   - State: OPEN
                         ▼                   - Disable Retry Button
               Execute State Reset           - Start 10s Cooldown Timer
                         │                   - Announce to Screen Reader
                         ▼                             │
             [ Component Re-Renders ]                  ▼
                         │                     [ Cooldown Expires ]
                 ┌───────┴───────┐                     │
                 ▼               ▼                     ▼
             [ Success ]     [ Crash ]          [ Reset to HALF_OPEN ]
                 │               │
                 ▼               ▼
           Reset Count (0)  Increment Count (N+1)
```

### TypeScript Bounded Retry State Machine Implementation
```tsx
export interface BoundedRetryState {
  attempt: number;
  maxAttempts: number;
  isRetrying: boolean;
  isCircuitOpen: boolean;
  cooldownRemaining: number;
}

export class BoundedRetryPolicy {
  private attempt = 0;
  private cooldownTimer: any = null;

  constructor(
    private readonly maxAttempts = 3,
    private readonly baseDelayMs = 1000,
    private readonly cooldownMs = 8000
  ) {}

  public recordFailure(onStateChange: (state: BoundedRetryState) => void): boolean {
    this.attempt += 1;

    if (this.attempt >= this.maxAttempts) {
      this.trip(onStateChange);
      return false; // Circuit tripped
    }

    onStateChange(this.getState());
    return true; // Still closed
  }

  private trip(onStateChange: (state: BoundedRetryState) => void): void {
    let remaining = Math.ceil(this.cooldownMs / 1000);
    
    this.cooldownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(this.cooldownTimer);
        this.attempt = 0;
        onStateChange(this.getState());
      } else {
        onStateChange({ ...this.getState(), cooldownRemaining: remaining });
      }
    }, 1000);
  }

  public getState(): BoundedRetryState {
    return {
      attempt: this.attempt,
      maxAttempts: this.maxAttempts,
      isRetrying: false,
      isCircuitOpen: this.attempt >= this.maxAttempts,
      cooldownRemaining: 0,
    };
  }
}
```

---

## 14. 🔄 Distinguishing Recovery Operations (Retry vs Reset vs Remount vs Reload)

Never confuse these four distinct recovery mechanisms:

```text
+-------------------+---------------------------------------+------------------------------------+
| Operation         | What It Does                          | Appropriate Use Case               |
+-------------------+---------------------------------------+------------------------------------+
| **Retry**         | Re-attempts an async/network function | Transient 503, WebGL shader retry  |
+-------------------+---------------------------------------+------------------------------------+
| **Reset**         | Clears error boundary state (hasError)| URL change, props change, manual   |
+-------------------+---------------------------------------+------------------------------------+
| **Remount**       | Unmounts and re-creates Fiber node    | Corrupted internal component state |
+-------------------+---------------------------------------+------------------------------------+
| **Reload**        | Full document refresh (location.reload)| Fatal Tier 1 Root crash only       |
+-------------------+---------------------------------------+------------------------------------+
```

## 15. 💾 Preserving User Work & Form Draft Protection

The single most destructive failure mode in web applications is **User Data Loss Due to Unrelated Crashes**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ CHECKOUT PAGE                                                          │
│                                                                        │
│ ┌──────────────────────────────────┐ ┌───────────────────────────────┐ │
│ │ PAYMENT FORM (50 Fields Filled)  │ │ RECOMMENDATIONS WIDGET        │ │
│ │ • Card: **** 4242                │ │ • Algorithm v2                │ │
│ │ • Billing Address: 123 Main St   │ │ • 💥 Unhandled TypeError      │ │
│ │ • Memo: Q3 Liquidity Draft       │ │                               │ │
│ └──────────────────────────────────┘ └───────────────────────────────┘ │
│                                                                        │
│ 🚨 MONOLITHIC BOUNDARY CATCHES CRASH -> UNMOUNTS BOTH FORM & WIDGET!   │
│ 💀 RESULT: User loses 15 minutes of uncommitted draft data!            │
└────────────────────────────────────────────────────────────────────────┘
```

### The Solution: Ephemeral Draft Store Synchronization
Form state must be decoupled from volatile component fibers. By synchronizing input changes to an ephemeral storage adapter (e.g. `sessionStorage` or Zustand store), drafts survive even if the enclosing pod remounts:

```tsx
// usePreservedDraft.ts
import { useState, useEffect } from 'react';

export function usePreservedDraft<T>(storageKey: string, initialValues: T) {
  const [values, setValues] = useState<T>(() => {
    try {
      const cached = sessionStorage.getItem(storageKey);
      return cached ? JSON.parse(cached) : initialValues;
    } catch {
      return initialValues;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch (e) {
      console.warn('[DraftPreservation] Storage quota exceeded or disabled:', e);
    }
  }, [storageKey, values]);

  const clearDraft = () => {
    sessionStorage.removeItem(storageKey);
    setValues(initialValues);
  };

  return [values, setValues, clearDraft] as const;
}
```

---

## 16. 🎯 Failure Scope vs Recovery Scope Alignment

Resilience engineering dictates that:
$$\text{Recovery Scope} \equiv \text{Failure Scope}$$

```text
Failed Widget  ──> Recover Widget  (Do NOT reset feature pod)
Failed Pod     ──> Recover Pod     (Do NOT reset router outlet)
Failed Route   ──> Recover Route   (Do NOT reload entire document)
```

## 17. 🛡️ Progressive Preservation Model

```text
                 Enterprise App Root (Survives)
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
  App Shell (Survives)                    Route Viewport (Survives)
                                                    │
                               ┌────────────────────┼────────────────────┐
                               │                    │                    │
                        Feature A (Survives)  Feature B (Survives)  Feature C (Degraded)
                                                                         │
                                                                   Widget (Fallback)
```

When **Widget C** fails:
- App Shell, Header, Sidebar survive.
- Route Viewport survives.
- Feature A and Feature B remain 100% interactive.
- User drafts in Feature A are untouched.
- Feature C renders a graceful localized fallback.

---

## 18. 🔌 Fallback Dependency Inversion & Minimalism

The **Fallback Dependency Rule**:
> **A fallback must never depend on the complex shared infrastructure that may have caused the original failure.**

```tsx
// ❌ DANGEROUS: Dependency-Heavy Fallback
function FancyFallback() {
  const { theme } = useTheme();           // Could be uninitialized!
  const { user } = useAuth();             // Could have threw 401!
  const { t } = useIntl();                // Translation bundle might have failed to load!
  const { flags } = useFeatureFlags();    // Network socket might be dead!

  return <ComplexModal theme={theme}>{t('errors.crash')}</ComplexModal>;
}

// ✅ RESILIENT: Zero-Dependency Fallback
function ResilientFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div style={{ padding: '16px', background: '#1e293b', color: '#f8fafc', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#fca5a5' }}>
        Service Temporarily Unavailable
      </h3>
      <p style={{ fontSize: '12px', margin: '0 0 12px 0', color: '#94a3b8' }}>
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button 
        type="button" 
        onClick={onReset}
        style={{ padding: '6px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px' }}
      >
        Try Again
      </button>
    </div>
  );
}
```

## 19. 📜 The Fallback Dependency Rule

For Tier 1 (Root) and Tier 2 (Route) boundaries:
1. **No External Context Hooks:** Avoid `useTheme`, `useAuth`, `useSelector`.
2. **Vanilla Inline CSS:** Do not rely on dynamic CSS-in-JS runtimes that may fail during script parse errors.
3. **Hardcoded Text Alternatives:** Provide baked-in English fallback strings in case internationalization dictionaries failed to load.

---

## 20. 🌐 Localization Failure Safety & Baseline Fallback Dictionaries

If your localization engine fails to fetch `messages_en.json`, wrapping your fallback in `t('error.key')` will trigger an infinite exception loop.

```tsx
export function safeTranslate(key: string, fallbackText: string, t?: (k: string) => string): string {
  try {
    if (t) {
      const translated = t(key);
      if (translated && translated !== key) return translated;
    }
  } catch {
    // Fall back immediately to baseline dictionary
  }
  return fallbackText;
}
```

---

## 21. 🎨 Design System Failure Independence

If your design system's `<Button />` or `<Modal />` component relies on styled-components or emotion stylesheets that failed to inject into `<head>`, rendering that component in an error fallback will cause a second crash.

At the root level, always use standard HTML5 primitives (`<button type="button">`, `<div>`, `<section>`) with inline styles.

---

## 22. ⚖️ Error Fallback vs Empty State vs Loading State

Do not collapse distinct lifecycle conditions into generic error fallbacks:

| State | Semantic Meaning | Correct Component |
| :--- | :--- | :--- |
| **Empty** | Zero records returned from database (`items.length === 0`). | `<EmptyInboxIllustration />` |
| **Loading** | Async fetch in-flight. | `<SkeletonFeed />` |
| **Error** | 500 Internal Server Error or Render Exception. | `<ResilientBoundaryFallback />` |
| **Forbidden** | User lacks required RBAC role (403). | `<AccessDeniedView />` |
| **Offline** | Device disconnected from internet. | `<OfflineModeBanner />` |

---

## 23. 🔐 Error Fallback vs Permission / 403 Domain States

A 403 Forbidden is **not** a component crash. It is a valid, expected domain outcome. Never `throw new Error('403')` to trigger an Error Boundary. Instead, render domain UI:

```tsx
if (user.role !== 'ADMIN') {
  return <AccessDeniedNotice requiredRole="ADMIN" />;
}
```

---

## 24. ✍️ Error Fallback vs Input Validation States

Invalid user input (e.g. "invalid email address") is a normal user interaction state. It belongs in localized form field error state (`<span role="alert" className="text-rose-500">`), never in an Error Boundary.

## 25. 📐 Information Architecture of an Error Message

Every user-facing failure message must adhere to the **3-Part Structure**:

$$\text{Error Message} = \text{WHAT HAPPENED} + \text{WHAT IS THE IMPACT} + \text{WHAT TO DO NEXT}$$

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [WHAT HAPPENED]   Payment history could not be synchronized with Stripe │
│ [WHAT IS IMPACT]  Your active subscription and balance remain safe.    │
│ [WHAT TO DO NEXT] Click retry below, or download your PDF receipt.     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 26. 🔒 Security & Data Sanitization (Preventing Stack Leakage)

Never render raw stack traces (`error.stack`) or un-sanitized database errors (`error.message`) in production UI. They leak:
- Internal AWS/GCP server hostnames.
- Database table names and SQL syntax.
- JWT tokens, passwords, and PII found in JSON payloads.

```tsx
export function sanitizeErrorMessage(error: Error, isProduction = process.env.NODE_ENV === 'production'): string {
  if (!isProduction) return error.message;
  
  // Production Safe Whitelist
  if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
    return 'Unable to connect to the network. Please verify your internet connection.';
  }
  if (error.message.includes('WebGL')) {
    return 'Hardware acceleration encountered a temporary glitch. Switched to 2D view.';
  }
  return 'A temporary rendering error occurred. Our engineering team has been notified.';
}
```

---

## 27. 🔗 Distributed Correlation IDs & Telemetry Ingestion Bridges

Provide a 6-character alphanumeric **Correlation ID** on every fallback. This allows customer support agents to instantly look up the full Sentry trace when a customer reports an issue.

```tsx
const correlationId = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
// Telemetry Bus Payload
TelemetryBus.dispatch({
  correlationId,
  errorName: error.name,
  errorMessage: error.message,
  componentStack: errorInfo?.componentStack,
  url: window.location.href,
  timestamp: Date.now()
});
```

---

## 28. 🛡️ Non-Fatal Telemetry Dispatch & Defensive Analytics

A telemetry logging failure must **never** prevent the fallback UI from rendering:

```tsx
public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  try {
    Sentry.captureException(error, { extra: errorInfo });
  } catch (telemetryErr) {
    // Defensive containment: Do NOT allow analytics crashes to break fallback UI
    console.error('[Telemetry Failure]', telemetryErr);
  }
}
```

---

## 29. 🎭 User-Facing Error Models vs Internal Error Models

Decouple your internal technical error from what the user sees:

```ts
// Internal Technical Error Model (Sent to Sentry)
interface InternalDiagnosticError {
  rawError: Error;
  fiberStack: string;
  lineage: string[];
  sessionToken: string;
}

// User-Facing Error Model (Rendered on Screen)
interface UserFacingFailurePresentation {
  title: string;
  description: string;
  correlationId: string;
  canRetry: boolean;
  recoveryActions: Array<{ label: string; action: () => void }>;
}
```

---

## 30. 📜 TypeScript Recovery Contracts & Discriminated Unions

```ts
export type RecoveryAction =
  | { readonly kind: 'retry'; readonly label: string; readonly execute: () => void }
  | { readonly kind: 'navigate'; readonly label: string; readonly href: string }
  | { readonly kind: 'reload'; readonly label: string }
  | { readonly kind: 'custom'; readonly label: string; readonly onClick: () => void };

export interface FailurePresentation {
  readonly title: string;
  readonly description: string;
  readonly correlationId: string;
  readonly actions: readonly RecoveryAction[];
}
```

---

## 31. 🚫 Eliminating Boolean Fallback APIs

Avoid antipattern boolean flags in boundary props:

```ts
// ❌ WEAK: Permits impossible states (e.g. loading + hasError + isOffline)
interface BadProps {
  isLoading: boolean;
  hasError: boolean;
  isOffline: boolean;
  canRetry: boolean;
}

// ✅ STRONG: Discriminated Union State Machine
export type FailureState =
  | { readonly status: 'HEALTHY' }
  | { readonly status: 'DEGRADED'; readonly reason: string; readonly correlationId: string }
  | { readonly status: 'CIRCUIT_OPEN'; readonly cooldownSec: number }
  | { readonly status: 'UNRECOVERABLE'; readonly fatalId: string };
```

## 32. 🔥 Production Crucible #1 — The Red Screen Trap

### Incident Post-Mortem
- **Incident Date:** October 14, 2025 (Peak SaaS Billing Window)
- **Impact:** 120,000 enterprise customers saw a full-screen red crash banner on `/dashboard`.
- **Root Cause:** A secondary marketing promotion card rendered an invalid date string: `promo.date.toLocaleDateString()`.
- **Architectural Failure:** The entire dashboard was wrapped in a single monolithic Error Boundary. The failure of a 100px banner unmounted the navigation sidebar, financial summary, and customer support chat.
- **Financial Loss:** $340,000 in delayed invoice approvals over 4 hours.
- **Remediation:** Isolated all auxiliary dashboard widgets inside Tier 4 Bulkhead boundaries.

```tsx
// eslint-rules/enforce-granular-bulkhead.js
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid monolithic error boundaries at page root without widget bulkheads' }
  },
  create(context) {
    return {
      JSXElement(node) {
        if (node.openingElement.name.name === 'DashboardContainer') {
          const hasBulkhead = node.children.some(
            c => c.type === 'JSXElement' && c.openingElement.name.name === 'ResilientBoundary'
          );
          if (!hasBulkhead) {
            context.report({
              node,
              message: 'DashboardContainer must isolate child widgets inside <ResilientBoundary tier="WIDGET">'
            });
          }
        }
      }
    };
  }
};
```

---

## 33. 🔥 Production Crucible #2 — Fallback Causes Second Failure

### Incident Post-Mortem
- **Incident Date:** January 9, 2026
- **Impact:** Infinite React re-render crash loop freezing user browser tabs.
- **Root Cause:** The fallback component used `useTheme()` and `useTranslation()`. The original crash was caused by a corrupted ThemeContext initialization. When the boundary mounted the fallback, the fallback itself threw an exception, escaping to the browser window.
- **Remediation:** Enforced the **Fallback Dependency Rule**: Tier 1 and Tier 2 fallbacks must be 100% dependency-free with vanilla inline styling.

---

## 34. 🔥 Production Crucible #3 — Focus Lost After Route Failure

### Incident Post-Mortem
- **Incident Date:** March 22, 2026
- **Impact:** Severe accessibility audit failure (ADA compliance lawsuit risk).
- **Root Cause:** When route navigation to `/settings/security` threw a 500 error, React replaced the page DOM. The user's active keyboard focus on the navigation link vanished, resetting focus to `<body>`. Screen readers announced nothing, leaving blind users trapped in silence.
- **Remediation:** Implemented programmatic focus shifts to `<h2 tabIndex="-1">` upon route boundary mount with `aria-live="assertive"`.

---

## 35. 🔥 Production Crucible #4 — The Runaway Retry Storm

### Incident Post-Mortem
- **Incident Date:** May 18, 2026
- **Impact:** 1.8M requests per minute hammering an already degraded PostgreSQL database.
- **Root Cause:** A developer added an automated `useEffect(() => { reset(); }, [error])` inside a fallback component. Every render failure triggered an immediate re-render, creating a distributed DoS attack across 40,000 connected clients.
- **Remediation:** Implemented `BoundedRetryPolicy` with circuit breaker tripping after 3 attempts and a mandatory 8-second cooldown.

---

## 36. 🔥 Production Crucible #5 — User Data Disappears on Payment Form

### Incident Post-Mortem
- **Incident Date:** July 30, 2026
- **Impact:** 22% spike in checkout abandonment.
- **Root Cause:** A currency conversion sparkline threw an exception inside the payment form. Because both components lived in the same boundary, resetting the boundary remounted the form, wiping customer credit card details and shipping addresses.
- **Remediation:** Separated state ownership using `usePreservedDraft` with `sessionStorage` synchronization.

## 37. 📊 Decision Matrix — Choosing Fallback Scope

| Situation | Recommended Scope | Fallback UI Strategy | Focus Behavior |
| :--- | :--- | :--- | :--- |
| **Canvas / WebGL Chart Crash** | Tier 4 (Widget) | Accessible 2D HTML Table | **Do NOT move focus** |
| **Third-Party Iframe (Stripe)** | Tier 4 (Widget) | Direct Invoice / Alt Method Link | Focus retry button |
| **Feature Pod (Real-time Chat)** | Tier 3 (Feature) | Pod Offline Card + Cached Messages | Shift focus to Pod Header |
| **Route View (/billing)** | Tier 2 (Route) | Outage Card + "Back to Home" | **Shift focus to <h2> Heading** |
| **Global Shell / App Root** | Tier 1 (Root) | Zero-CSS Emergency Outage Screen | Shift focus to Restart CTA |

---

## 38. 📊 Decision Matrix — What Should the User See?

| Error Condition | What the User Should See | What the User Should NOT See |
| :--- | :--- | :--- |
| **Empty Database** | "No orders found. Create your first order." | "Error 500 / Something went wrong" |
| **Validation Error** | Red inline field helper text | Full-page Error Boundary takeover |
| **403 Forbidden** | "Contact your team admin for billing access." | Cryptic JSON permission error |
| **Network Offline** | "You're offline. Changes will sync when reconnected."| Silent failure or white screen |
| **Component Crash** | Degraded feature card with correlation ID | Raw JavaScript stack trace |

---

## 39. 🧪 Accessibility Diagnostic Protocol (5-Step Audit)

```text
  [Step 1: Keyboard Only] ──> [Step 2: Screen Reader] ──> [Step 3: Tab Order] ──> [Step 4: Semantics] ──> [Step 5: Recovery]
```

1. **Step 1 (Keyboard Test):** Unplug mouse. Trigger crash via keyboard. Verify focus does not reset to `<body>`.
2. **Step 2 (Screen Reader Test):** Turn on VoiceOver/NVDA. Verify error is announced cleanly via `aria-live`.
3. **Step 3 (Tab Order Test):** Press `Tab`. Verify fallback retry button is immediately reachable.
4. **Step 4 (Semantic Landmark Test):** Verify fallback is enclosed in `<section role="region" aria-labelledby="...">`.
5. **Step 5 (Recovery Test):** Press `Enter` on Retry button. Verify state recovers smoothly.

---

## 40. 🛠️ Browser & DevTools Diagnostic Runbook

### Chrome DevTools Protocol
1. Open **DevTools > Elements**.
2. Inspect the replacement fallback DOM node.
3. Check **Accessibility Tree** pane: verify Computed Role is `region` or `alert`.
4. Open **Console**: verify structured telemetry payload dispatched with Correlation ID.
5. In **Network tab**, set throttling to "Offline" to verify offline domain handling.

---

## 41. 🔮 Prediction Challenges (Staff Engineering Review)

### Prediction Challenge 1
```tsx
<ErrorBoundary fallback={<Fallback />}>
  <SearchBox />
  <CheckoutForm />
</ErrorBoundary>
```
*Scenario:* `SearchBox` crashes on input parse.  
*Question:* Will `CheckoutForm` survive?  
*Answer:* **No.** Because both components share a single parent boundary, the fallback replaces the entire subtree, unmounting the checkout form and wiping user inputs.  
*Correction:* Wrap `SearchBox` in its own Tier 4 Bulkhead.

### Prediction Challenge 2
*Scenario:* A user is typing inside a text input. A secondary notification widget crashes.  
*Question:* Should the notification widget fallback automatically steal focus?  
*Answer:* **No.** Stealing focus interrupts the user's typing flow. Only route-level or root-level failures warrant intentional focus movement.

### Prediction Challenge 3
```tsx
function Fallback() {
  return <button onClick={() => window.location.reload()}>Try Again</button>;
}
```
*Question:* Is this equivalent to retrying the failed component?  
*Answer:* **No.** `window.location.reload()` reloads the entire browser document, destroying all client-side state, cache, and WebSocket connections.

## 44. 📋 50-Point Enterprise Production Readiness Checklist

```text
[x] 1.  Tier 1 Root Boundary mounted at the root of the React application tree.
    - Standard: <Tier1RootBoundary><App /></Tier1RootBoundary>
[x] 2.  Tier 1 Boundary contains zero external Context dependencies (Theme, Auth, Intl).
    - Standard: Uses standalone class component state only.
[x] 3.  Tier 1 Fallback uses vanilla inline CSS to prevent stylesheet parse dependencies.
    - Standard: style={{ backgroundColor: '#090d16', color: '#fff' }}
[x] 4.  Tier 1 Fallback renders a unique Incident Correlation ID (e.g. ERR-9821-US).
    - Standard: Correlation ID generated in getDerivedStateFromError.
[x] 5.  Tier 1 Fallback offers a single-click hard reload (window.location.reload).
    - Standard: Handler clears ephemeral cache and reloads.
[x] 6.  Tier 2 Route Boundaries wrap every router outlet view.
    - Standard: <ResilientBoundary tier="ROUTE" resetKeys={[location.pathname]}><Outlet /></ResilientBoundary>
[x] 7.  Persistent navigation header, sidebar, and breadcrumbs reside OUTSIDE Route boundaries.
    - Verification: Header remains 100% interactive when route crashes.
[x] 8.  Route Boundaries include resetKeys={[location.pathname]} for automatic recovery.
    - Verification: Clicking a different sidebar link automatically clears error state.
[x] 9.  Route Fallback includes a "Return to Dashboard" escape hatch button.
    - Standard: <button onClick={() => navigate('/dashboard')}>Return Home</button>
[x] 10. Tier 3 Feature Pod boundaries wrap distinct domain sub-modules.
    - Standard: Max 3-4 feature pods per viewport page.
[x] 11. Feature Context Providers are mounted strictly INSIDE Feature Pod boundaries.
    - Standard: <ResilientBoundary><PodProvider><PodContent /></PodProvider></ResilientBoundary>
[x] 12. Feature Pod boundaries clean up active WebSocket listeners on unmount.
    - Standard: useEffect cleanup calls socket.disconnect() / controller.abort().
[x] 13. Feature Pod boundaries abort active fetch requests via AbortController on error.
    - Standard: signal.aborted check inside long-polling / streaming effects.
[x] 14. Feature Pods sync critical draft state to sessionStorage before unmounting.
    - Standard: usePreservedDraft hook stores debounced input state.
[x] 15. Tier 4 Widget Bulkheads wrap all WebGL and Canvas elements.
    - Standard: <ResilientBoundary tier="WIDGET" name="WebGLChart"><canvas /></ResilientBoundary>
[x] 16. Tier 4 Widget Bulkheads wrap all third-party iframes (Stripe, Zendesk, Recaptcha).
    - Standard: Prevents iframe script errors from bubbling up.
[x] 17. Tier 4 Widget Bulkheads wrap all complex code editors (Monaco, CodeMirror).
    - Fallback: Simple HTML5 <textarea> fallback view.
[x] 18. Tier 4 Widget Bulkheads wrap all heavy D3 / SVG charting components.
    - Fallback: Static accessible HTML table view with data points.
[x] 19. All Widget Bulkheads provide degraded, zero-loss functional fallback UI.
    - Standard: User can still read dataset values in text format.
[x] 20. All boundaries implement BoundaryCircuitBreaker to halt infinite retry loops.
    - Standard: BoundedRetryPolicy with maxAttempts=3.
[x] 21. Circuit Breaker default trip threshold set to 3 consecutive failures.
    - Standard: Failure count resets upon successful child render.
[x] 22. Circuit Breaker cooldown timer set between 5,000ms and 15,000ms.
    - Standard: 8000ms default cooldown period.
[x] 23. Circuit Breaker provides visible cooldown countdown to the end-user.
    - Standard: "🚨 Limit reached. Cooldown: 7s".
[x] 24. Boundaries dispatch structured payloads to central TelemetryBus.
    - Standard: { correlationId, tier, name, error, timestamp }.
[x] 25. Telemetry payloads include full boundary lineage path (App > Route > Pod > Widget).
    - Standard: Extracted via BoundaryLineageContext.
[x] 26. TelemetryBus flushes errors with appropriate severity tags (FATAL, ERROR, WARN, INFO).
    - Standard: Root=FATAL, Route=ERROR, Feature=WARN, Widget=INFO.
[x] 27. TelemetryBus scrubs PII (passwords, credit cards, auth tokens) before network egress.
    - Standard: Regex sanitizer removes auth header tokens and card numbers.
[x] 28. Boundaries wrap Suspense components rather than residing inside Suspense children.
    - Standard: <ResilientBoundary><Suspense><LazyComp /></Suspense></ResilientBoundary>
[x] 29. Asynchronous errors bridged to render phase via useAsyncError() hook.
    - Standard: const throwAsync = useAsyncError(); fetch().catch(throwAsync);
[x] 30. Event handlers utilize try/catch with TelemetryBus dispatch.
    - Standard: try { onClick() } catch(e) { TelemetryBus.dispatch(...) }
[x] 31. Fallback UI elements comply with WCAG 2.1 AA accessibility guidelines.
    - Standard: Contrast ratio >= 4.5:1 for all text.
[x] 32. Fallback containers declare role="region" or role="alert".
    - Standard: <section role="region" aria-labelledby="heading-id">
[x] 33. Fallback alerts utilize aria-live="polite" (or "assertive" for Tier 1).
    - Standard: Do not interrupt ongoing screen reader speech for minor widget errors.
[x] 34. Focus is automatically managed and directed to the retry CTA upon error.
    - Standard: Focus shifts to <h2 tabIndex="-1"> on route-level outages.
[x] 35. Keyboard navigation is fully supported across all fallback UI states.
    - Standard: Tab order reaches retry CTA and secondary action links.
[x] 36. Fallback color contrast ratios meet minimum 4.5:1 for standard text.
    - Standard: Chrome DevTools Lighthouse Accessibility score 100.
[x] 37. Fallback layouts preserve container aspect ratios to eliminate CLS (Cumulative Layout Shift).
    - Standard: min-height or aspect-ratio set on fallback cards.
[x] 38. AST ESLint rule active to enforce bulkheads on high-risk third-party widgets.
    - Standard: eslint-rules/enforce-granular-bulkhead.js.
[x] 39. Unit test suite verifies widget failure does not unmount sibling widgets.
    - Standard: expect(screen.getByTestId('healthy-metric')).toBeInTheDocument().
[x] 40. Unit test suite verifies feature pod reset button successfully remounts children.
    - Standard: fireEvent.click(screen.getByRole('button', { name: /Reset/i })).
[x] 41. Unit test suite verifies circuit breaker trips to OPEN after 3 failures.
    - Standard: expect(screen.getByText(/Limit reached/i)).toBeInTheDocument().
[x] 42. Unit test suite verifies route boundary auto-resets on location change.
    - Standard: rerender with new routeKey resets error state.
[x] 43. Unit test suite verifies telemetry event lineage metadata correctness.
    - Standard: expect(onErrorSpy).toHaveBeenCalledWith(..., ['Root', 'Route', 'Pod', 'Widget']).
[x] 44. Memory leak verification confirms discarded pods release all event listeners.
    - Standard: Heap snapshot delta 0KB on pod unmount.
[x] 45. Staging environment displays debug overlay when errors are caught.
    - Standard: Overlay only mounted if process.env.NODE_ENV !== 'production'.
[x] 46. Production bundle strips detailed stack traces from end-user UI display.
    - Standard: Only display sanitized user-friendly messages in prod builds.
[x] 47. Support diagnostic export button allows users to copy debug JSON payload.
    - Standard: "Copy Diagnostic Report" button in Route fallback.
[x] 48. Sentry / Datadog release tags attached to all boundary telemetry events.
    - Standard: Tag: { release: 'v4.18.2', commit: 'e78bf01' }.
[x] 49. End-to-end Cypress/Playwright tests verify fault injection recovery in CI.
    - Standard: Automated simulation of WebGL context lost recovery.
[x] 50. Post-mortem runbook established with MTTD target < 5m and MTTR target < 15m.
    - Standard: Automated alerts on Slack #eng-resilience when Tier 1/2 boundaries trip.
```

## 45. 💻 Production-Grade TypeScript Reference Implementation

Here is the complete, self-contained reference implementation for the accessible resilience suite, including `AccessibleResilientBoundary`, `BoundedRetryPolicy`, `usePreservedDraft`, `A11yLiveAnnouncer`, and `RouteOutageView`.

```tsx
// ============================================================================
// 1. BoundedRetryPolicy.ts
// ============================================================================
export interface BoundedRetryState {
  attempt: number;
  maxAttempts: number;
  isCircuitOpen: boolean;
  cooldownRemaining: number;
}

export class BoundedRetryPolicy {
  private attempt = 0;
  private cooldownTimer: any = null;

  constructor(
    private readonly maxAttempts = 3,
    private readonly cooldownSec = 8
  ) {}

  public recordFailure(onStateChange: (state: BoundedRetryState) => void): boolean {
    this.attempt += 1;

    if (this.attempt >= this.maxAttempts) {
      this.trip(onStateChange);
      return false; // Circuit tripped
    }

    onStateChange(this.getState());
    return true; // Still closed
  }

  private trip(onStateChange: (state: BoundedRetryState) => void): void {
    let remaining = this.cooldownSec;
    
    this.cooldownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(this.cooldownTimer);
        this.attempt = 0;
        onStateChange(this.getState());
      } else {
        onStateChange({
          attempt: this.attempt,
          maxAttempts: this.maxAttempts,
          isCircuitOpen: true,
          cooldownRemaining: remaining,
        });
      }
    }, 1000);
  }

  public reset(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
    this.attempt = 0;
  }

  public getState(): BoundedRetryState {
    return {
      attempt: this.attempt,
      maxAttempts: this.maxAttempts,
      isCircuitOpen: this.attempt >= this.maxAttempts,
      cooldownRemaining: 0,
    };
  }
}

// ============================================================================
// 2. usePreservedDraft.ts
// ============================================================================
import { useState, useEffect } from 'react';

export function usePreservedDraft<T>(storageKey: string, initialValues: T) {
  const [values, setValues] = useState<T>(() => {
    try {
      const cached = typeof window !== 'undefined' ? sessionStorage.getItem(storageKey) : null;
      return cached ? JSON.parse(cached) : initialValues;
    } catch {
      return initialValues;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch (e) {
      console.warn('[DraftPreservation] Storage quota exceeded:', e);
    }
  }, [storageKey, values]);

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
    setValues(initialValues);
  };

  return [values, setValues, clearDraft] as const;
}

// ============================================================================
// 3. AccessibleResilientBoundary.tsx
// ============================================================================
import React, { Component, ErrorInfo, ReactNode } from 'react';

export interface AccessibleBoundaryProps {
  name: string;
  tier: 'ROOT' | 'ROUTE' | 'FEATURE' | 'WIDGET';
  children: ReactNode;
  fallback?: (props: {
    error: Error;
    correlationId: string;
    reset: () => void;
    retry: () => void;
    retryState: BoundedRetryState;
    headingRef: React.RefObject<HTMLHeadingElement>;
    retryBtnRef: React.RefObject<HTMLButtonElement>;
  }) => ReactNode;
  resetKeys?: any[];
  onReset?: () => void;
  onError?: (error: Error, info: ErrorInfo, correlationId: string) => void;
  autoFocusStrategy?: 'smart' | 'heading' | 'retry' | 'none';
  customHeading?: string;
}

interface AccessibleBoundaryState {
  hasError: boolean;
  error: Error | null;
  correlationId: string | null;
  retryState: BoundedRetryState;
}

export class AccessibleResilientBoundary extends Component<
  AccessibleBoundaryProps,
  AccessibleBoundaryState
> {
  private retryPolicy = new BoundedRetryPolicy(3, 8);
  private headingRef = React.createRef<HTMLHeadingElement>();
  private retryBtnRef = React.createRef<HTMLButtonElement>();

  constructor(props: AccessibleBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      correlationId: null,
      retryState: this.retryPolicy.getState(),
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<AccessibleBoundaryState> {
    const correlationId = `ERR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    return { hasError: true, error, correlationId };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { correlationId } = this.state;
    const { tier, name, onError, autoFocusStrategy = 'smart' } = this.props;

    this.retryPolicy.recordFailure((retryState) => this.setState({ retryState }));
    onError?.(error, errorInfo, correlationId || 'unknown');

    // Strategic WCAG Focus Management
    setTimeout(() => {
      if (autoFocusStrategy === 'heading' || tier === 'ROUTE' || tier === 'ROOT') {
        this.headingRef.current?.focus();
      } else if (autoFocusStrategy === 'retry') {
        this.retryBtnRef.current?.focus();
      }
    }, 50);
  }

  public override componentDidUpdate(prevProps: AccessibleBoundaryProps): void {
    if (this.state.hasError && this.props.resetKeys && prevProps.resetKeys) {
      const changed = this.props.resetKeys.some((k, i) => !Object.is(k, prevProps.resetKeys![i]));
      if (changed) {
        this.handleReset();
      }
    }
  }

  public handleReset = (): void => {
    this.retryPolicy.reset();
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      correlationId: null,
      retryState: this.retryPolicy.getState(),
    });
  };

  public handleRetry = (): void => {
    if (this.state.retryState.isCircuitOpen) return;
    this.handleReset();
  };

  public override render(): ReactNode {
    const { hasError, error, correlationId, retryState } = this.state;
    const { name, tier, fallback, children, customHeading } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback({
          error,
          correlationId: correlationId!,
          reset: this.handleReset,
          retry: this.handleRetry,
          retryState,
          headingRef: this.headingRef,
          retryBtnRef: this.retryBtnRef,
        });
      }

      // Default WCAG 2.1 AA Compliant Fallback
      return (
        <section
          role="region"
          aria-labelledby={`heading-${correlationId}`}
          className="p-5 border border-rose-900/50 bg-rose-950/20 rounded-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-800/40">
                {tier} BULKHEAD
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Ref: <strong className="text-slate-200">{correlationId}</strong>
              </span>
            </div>

            <h3
              id={`heading-${correlationId}`}
              ref={this.headingRef}
              tabIndex={-1}
              className="text-sm font-bold text-rose-200 mb-1 focus:outline-none focus:ring-1 focus:ring-rose-400 rounded"
            >
              {customHeading || `${name} is temporarily unavailable`}
            </h3>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Your other features remain operational. {error.message}
            </p>
          </div>

          <div className="pt-3 border-t border-rose-900/30 flex items-center justify-between">
            {retryState.isCircuitOpen ? (
              <span className="text-xs font-semibold text-amber-400 animate-pulse">
                🚨 Limit reached. Cooldown: {retryState.cooldownRemaining}s
              </span>
            ) : (
              <button
                ref={this.retryBtnRef}
                type="button"
                onClick={this.handleRetry}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-400 transition"
              >
                ↻ Retry Component ({retryState.attempt}/3)
              </button>
            )}
            <span className="text-[10px] text-slate-500 font-mono">Preserved State: OK</span>
          </div>
        </section>
      );
    }

    return children;
  }
}

// ============================================================================
// 4. A11yLiveAnnouncer.tsx (Accessible Live Region Coordinator)
// ============================================================================
import React, { createContext, useContext, useState, FC, ReactNode } from 'react';

interface A11yAnnouncement {
  id: string;
  message: string;
  politeness: 'polite' | 'assertive';
}

interface A11yContextValue {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}

const A11yLiveContext = createContext<A11yContextValue>({
  announce: () => {},
});

export const A11yLiveAnnouncerProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<A11yAnnouncement[]>([]);

  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const id = `ann-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setAnnouncements((prev) => [...prev.slice(-4), { id, message, politeness }]);
  };

  return (
    <A11yLiveContext.Provider value={{ announce }}>
      {children}
      {/* Off-screen live regions for NVDA, JAWS, VoiceOver */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {announcements.filter((a) => a.politeness === 'polite').slice(-1)[0]?.message}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {announcements.filter((a) => a.politeness === 'assertive').slice(-1)[0]?.message}
      </div>
    </A11yLiveContext.Provider>
  );
};

export const useA11yAnnounce = () => useContext(A11yLiveContext);

// ============================================================================
// 5. ZeroCLSContainer.tsx (Zero Cumulative Layout Shift Fallback Slot)
// ============================================================================
export const ZeroCLSContainer: FC<{
  minHeightPx?: number;
  aspectRatio?: string;
  children: ReactNode;
}> = ({ minHeightPx = 200, aspectRatio = '16/9', children }) => {
  return (
    <div
      style={{
        minHeight: `${minHeightPx}px`,
        aspectRatio,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        transition: 'height 0.2s ease-in-out',
      }}
      className="zero-cls-slot"
    >
      {children}
    </div>
  );
};
```

## 46. 🧪 Complete Vitest & React Testing Library Suite (8 Test Suites)

```tsx
// AccessibleResilientBoundary.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React, { useState } from 'react';
import { AccessibleResilientBoundary } from './AccessibleResilientBoundary';

const FaultyComponent: React.FC<{ shouldThrow?: boolean; message?: string }> = ({
  shouldThrow = true,
  message = 'Simulated Render Crash',
}) => {
  if (shouldThrow) throw new Error(message);
  return <div data-testid="healthy-view">Healthy Content</div>;
};

describe('Accessible Fallback UX & Resilience Suite', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.useRealTimers();
  });

  // Suite 1: Widget Bulkhead Isolation
  it('isolates widget crash without crashing sibling components', () => {
    render(
      <div>
        <AccessibleResilientBoundary name="Widget:Chart" tier="WIDGET">
          <FaultyComponent message="WebGL Context Lost" />
        </AccessibleResilientBoundary>
        <div data-testid="sibling-form">Active Form Input</div>
      </div>
    );

    expect(screen.getByText(/Widget:Chart is temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByTestId('sibling-form')).toBeInTheDocument();
  });

  // Suite 2: Bounded Retry & Circuit Breaker Tripping
  it('trips circuit breaker after 3 consecutive failures', () => {
    const TestLoop = () => (
      <AccessibleResilientBoundary name="Widget:Flapping" tier="WIDGET">
        <FaultyComponent shouldThrow={true} message="Persistent DB Error" />
      </AccessibleResilientBoundary>
    );

    const { rerender } = render(<TestLoop />);
    
    // Attempt 1
    fireEvent.click(screen.getByRole('button', { name: /Retry Component/i }));
    rerender(<TestLoop />);

    // Attempt 2
    fireEvent.click(screen.getByRole('button', { name: /Retry Component/i }));
    rerender(<TestLoop />);

    // Attempt 3 -> Trips Circuit Breaker
    expect(screen.getByText(/Limit reached/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retry Component/i })).not.toBeInTheDocument();
  });

  // Suite 3: Strategic Focus Movement on Route Failure
  it('shifts programmatic focus to <h2> heading on route outage', () => {
    render(
      <AccessibleResilientBoundary name="Route:/analytics" tier="ROUTE" autoFocusStrategy="heading">
        <FaultyComponent message="Route Bundle Failed" />
      </AccessibleResilientBoundary>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const heading = screen.getByRole('heading', { level: 3 });
    expect(document.activeElement).toBe(heading);
  });

  // Suite 4: Automatic Reset on Route Key Change
  it('automatically clears error state when resetKeys change', () => {
    const RouteContainer = ({ path }: { path: string }) => (
      <AccessibleResilientBoundary name={`Route:${path}`} tier="ROUTE" resetKeys={[path]}>
        <FaultyComponent shouldThrow={path === '/broken'} />
      </AccessibleResilientBoundary>
    );

    const { rerender } = render(<RouteContainer path="/broken" />);
    expect(screen.getByText(/Route:/broken is temporarily unavailable/i)).toBeInTheDocument();

    // Navigate to /healthy
    rerender(<RouteContainer path="/healthy" />);
    expect(screen.getByTestId('healthy-view')).toBeInTheDocument();
  });

  // Suite 5: WCAG Semantic Region Landmarks
  it('renders fallback inside an accessible region landmark with aria-labelledby', () => {
    render(
      <AccessibleResilientBoundary name="Widget:A11y" tier="WIDGET">
        <FaultyComponent message="A11y Crash" />
      </AccessibleResilientBoundary>
    );

    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-labelledby');
  });

  // Suite 6: Correlation ID Generation
  it('generates a unique alphanumeric correlation ID on crash', () => {
    render(
      <AccessibleResilientBoundary name="Widget:Telemetry" tier="WIDGET">
        <FaultyComponent message="Telemetry Crash" />
      </AccessibleResilientBoundary>
    );

    expect(screen.getByText(/Ref:/i)).toHaveTextContent(/ERR-[A-Z0-9]{6}/);
  });

  // Suite 7: Custom Fallback Render Prop
  it('supports custom fallback render props with degraded view', () => {
    render(
      <AccessibleResilientBoundary
        name="Widget:Custom"
        tier="WIDGET"
        fallback={({ error, reset }) => (
          <div data-testid="custom-degraded-view">
            <h4>Custom Degraded: {error.message}</h4>
            <button onClick={reset}>Try Again</button>
          </div>
        )}
      >
        <FaultyComponent message="Custom Exception" />
      </AccessibleResilientBoundary>
    );

    expect(screen.getByTestId('custom-degraded-view')).toBeInTheDocument();
    expect(screen.getByText(/Custom Exception/i)).toBeInTheDocument();
  });

  // Suite 8: Zero-Loss Draft State Survival
  it('verifies form input state survives sibling widget crash', () => {
    const TestDashboard = ({ crashWidget }: { crashWidget: boolean }) => {
      const [text, setText] = useState('My Invoice Note');
      return (
        <div>
          <AccessibleResilientBoundary name="Widget:Sparkline" tier="WIDGET">
            <FaultyComponent shouldThrow={crashWidget} message="Sparkline Crash" />
          </AccessibleResilientBoundary>
          <input 
            data-testid="draft-input" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
          />
        </div>
      );
    };

    const { rerender } = render(<TestDashboard crashWidget={false} />);
    expect(screen.getByTestId('draft-input')).toHaveValue('My Invoice Note');

    // Trigger crash in sparkline
    rerender(<TestDashboard crashWidget={true} />);
    expect(screen.getByTestId('draft-input')).toHaveValue('My Invoice Note');
  });
});
```

## 47. 🥋 10 Staff-Level Interview Questions & Architectural Answers

### 1. Why isn't a fallback merely a visual component?
> **Staff Answer:** A fallback participates actively in **failure containment, accessibility tree reconstruction, focus management, state preservation, bounded retry state machines, and distributed telemetry correlation**. Treating it as a static visual box leads to secondary failures, lost user input, and WCAG accessibility violations.

### 2. Should every Error Boundary move focus to its fallback?
> **Staff Answer:** **No.** Focus movement should strictly follow the **semantic scope of the transition**. Moving focus on minor leaf widget failures interrupts the user's active task (e.g. typing in a search input). For route-level or root-level outages where the entire viewport has disappeared, focus must be intentionally shifted to the error heading (`<h2 tabIndex="-1">`).

### 3. Why should root fallbacks have fewer dependencies than feature fallbacks?
> **Staff Answer:** Root fallbacks execute when global application invariants have broken down (e.g. broken theme provider, missing auth context, corrupted Redux store). If the fallback relies on those same compromised providers, it will trigger an uncaught exception, resulting in a fatal White Screen of Death (WSOD).

### 4. What is progressive degradation in enterprise web architecture?
> **Staff Answer:** Progressive degradation is the discipline of preserving the maximum amount of useful functionality when sub-systems fail—such as falling back from a WebGL canvas chart to a static 2D HTML table rather than unmounting the whole analytics module.

### 5. Why is `Something went wrong` considered an architectural anti-pattern?
> **Staff Answer:** It provides zero comprehension, zero impact assessment, and zero actionable guidance. A senior fallback must communicate: **What happened** (Real-time stream unavailable), **What is preserved** (Your draft is safe), and **What to do next** (Retry or download CSV).

### 6. Should HTTP 403 Forbidden errors be handled by Error Boundaries?
> **Staff Answer:** **No.** A 403 Forbidden is an expected domain state, not an unhandled runtime rendering crash. It should be handled by domain UI components (`<AccessDeniedNotice />`) rather than throwing exceptions into Error Boundaries.

### 7. Why is `Retry` fundamentally different from `Reload`?
> **Staff Answer:** `Retry` re-executes a localized operation or resets an error boundary state while preserving in-memory client state, active WebSocket connections, and user drafts. `Reload` (`window.location.reload()`) restarts the entire browser document, destroying all client-side ephemeral state.

### 8. How does a broad boundary cause user data loss?
> **Staff Answer:** When an Error Boundary catches an exception, it unmounts its entire child subtree. If a 50-field checkout form is placed under the same boundary as an auxiliary recommendation widget, a crash in the recommendation widget unmounts the form, wiping all uncommitted input state.

### 9. Why must error telemetry dispatch be wrapped in defensive try/catch blocks?
> **Staff Answer:** Observability is secondary to user recovery. If your Sentry SDK or analytics fetch throws a network or parsing exception inside `componentDidCatch`, it must never crash the boundary or prevent the fallback UI from rendering.

### 10. What is the governing axiom of resilient fallback UX?
> **Staff Answer:**
> **"The recovery mechanism should be no broader, no more destructive, and no less accessible than the failure requires."**

---

## 48. 🔬 Interactive Companion Lab Walkthrough

The standalone companion lab located at [`examples/12-fallback-ux-accessibility-progressive-degradation.html`](./examples/12-fallback-ux-accessibility-progressive-degradation.html) provides an interactive sandbox to test all 7 core resilience scenarios:

```text
+---------------------------------------------------------------------------------+
| LAB ARCHITECTURE OVERVIEW                                                       |
|                                                                                 |
| 1. Persistent Top Navigation Shell (WCAG 2.1 AA Compliant)                      |
| 2. Scenario Presets (A: Healthy -> G: Progressive Degradation)                  |
| 3. Interactive Viewport: Live Revenue Sparkline + Protected Form Draft          |
| 4. Fault Injection Matrix: WebGL NaN Error, WebSocket Desync, Route Outage      |
| 5. Live A11y & Focus Inspector: Active Element, ARIA Role, Focus Strategy       |
| 6. Screen Reader Live Region Feed: Real-time aria-live polite/assertive stream  |
| 7. Distributed Telemetry Bus: Correlation ID & Error Payload Logging            |
+---------------------------------------------------------------------------------+
```

### 7 Guided Experiments in the Lab
1. **Scenario A (Healthy Dashboard):** Inspect baseline WCAG contrast and active draft synchronization.
2. **Scenario B (Widget Bulkhead Crash):** Trigger WebGL crash. Observe Sparkline degrade to a 2D table while the Payment Form draft remains 100% intact.
3. **Scenario C (Route Sandboxed Crash):** Trigger Route 500 error. Navigation shell remains functional; focus shifts to `<h2>` Route Outage heading.
4. **Scenario D (Focus Management):** Compare `smart` vs `heading` vs `retry` focus strategies in the live active element inspector.
5. **Scenario E (Bounded Retry Policy):** Click retry 3 times rapidly. Observe the Circuit Breaker trip to `OPEN` with an 8-second cooldown timer.
6. **Scenario F (Broad Boundary Anti-Pattern):** Toggle Monolithic Wrap mode. Trigger a crash and observe the catastrophic loss of form draft inputs.
7. **Scenario G (Progressive Degradation):** Crash both Sparkline and WebSocket streams simultaneously. Verify the dashboard remains operable.

---

## 49. 🏁 Graduation Gate & Final Senior Mental Model

You pass this masterclass only when you can mechanically evaluate any component failure in production:

```text
1. What failed? (Leaf widget vs Route vs Global Shell)
2. Is it expected or unexpected? (Domain 403 vs TypeError)
3. Which boundary caught it? (Tier 4 Bulkhead vs Tier 2 Route)
4. What is the blast radius? (< 5% vs 100%)
5. What remains alive? (Sibling features, Form drafts, Shell)
6. What fallback should render? (Degraded Table vs Error Card)
7. What does the user need to know? (WHAT + IMPACT + NEXT)
8. Where should focus go? (Preserve vs Shift to Heading)
9. What recovery is valid? (Bounded Retry vs Navigate Home)
10. What state must be preserved? (Session storage draft)
11. Can retry safely occur? (Circuit breaker check)
12. What telemetry was dispatched? (Correlation ID + Dual Stack)
```

### The Ultimate Resilience Rule:
> **Do not merely catch the failure. Preserve the user's ability to understand what happened, continue useful work, and recover within the smallest correct failure domain.**

---

**KPI 16 Part 12 — COMPLETE.**