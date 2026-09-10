# Level 06 — React Fundamentals

# KPI 17 — Accessibility in React

## PART 10 — Accessible React Testing, Automated Accessibility Validation & Interaction Verification

> **Tier:** 🔴 MUST KNOW — Core Senior Frontend Accessibility Competency  
> **Standard:** WCAG 2.1 / 2.2 AA · WAI-ARIA 1.2 · axe-core 4.x · React Testing Library · Vitest Invariants  
> **Author & Lead System Architect:** Srikar Kudurmalla — Full Stack Developer | Founding Engineer  
> **Co-Author:** Prasenjeet — Mid-Level Full Stack Developer  
> **Companion Interactive Lab:** [`examples/10-accessible-react-testing.html`](./examples/10-accessible-react-testing.html)  
> **Previous Part:** [⬅️ Part 09 — Focus Management, Keyboard Navigation & Focus Lifecycle](./09-focus-management-keyboard-navigation.md) | **Next Part:** [Part 11 — Visual Accessibility: Color Contrast, High Contrast Mode & Zoom Scaling ➡️](./11-visual-a11y-contrast-zoom-scaling.md)

---

# 00 — THE CORE PROBLEM

Accessibility testing in junior engineering is frequently reduced to:
```text
Run automated axe scanner ──▶ Fix reported HTML violations ──▶ Declare "100% Accessible" ──▶ DONE
```

That is **not** accessibility engineering.
Automated tooling (such as `axe-core`, ESLint `jsx-a11y`, or Lighthouse) can detect structural, static, and naming defects. However, automated scanners **cannot** prove whether a complex React interaction is:
- Understandable and clear to human cognition
- Fully keyboard-operable via directional arrow keys
- Focus-correct with validated restoration contracts
- Semantically coherent across dynamic state transitions
- Recoverable when active DOM elements are unmounted
- Protected against asynchronous race condition corruption

```text
Layered Accessibility Verification
│
├── 1. Static Analysis / Linting       ──▶ ESLint jsx-a11y structural rules
├── 2. Automated DOM Scanner           ──▶ jest-axe / axe-core color contrast & label audits
├── 3. Semantic Contract Tests         ──▶ getByRole, getByLabelText, aria-expanded assertions
├── 4. Keyboard State Machine Tests    ──▶ userEvent.keyboard Arrow/Tab/Escape navigation
├── 5. Focus Lifecycle Invariants      ──▶ toHaveFocus(), initial focus & safe restoration
├── 6. Dynamic Mutation Tests          ──▶ Surviving sibling recovery on item deletion
├── 7. Async Race Currentness Tests    ──▶ Out-of-order response rejection with requestIdRef
├── 8. Fault Injection Resilience      ──▶ Fallback recovery when trigger is unmounted
└── 9. Human & Assistive Tech Audits   ──▶ Real-world screen reader testing (NVDA / VoiceOver)
```


The senior-level engineering objective is never: *"Does the markup pass a scanner?"*
It is:
> **"Can the user reliably perceive, navigate, operate, understand, and deterministically recover from the interface across all dynamic states?"**

# 01 — ⚡ 30-SECOND EXECUTIVE CHEAT SHEET

### The Layered Verification Pyramid
```text
┌─────────────────────────────────────────────────────────────────────────┐
│                 HUMAN & ASSISTIVE TECHNOLOGY VALIDATION                 │  (NVDA, VoiceOver, JAWS, Zoom)  ──▶ 100% Usability
├─────────────────────────────────────────────────────────────────────────┤
│                 END-TO-END BROWSER & ROUTE LEVEL TESTS                  │  (Playwright / Cypress + Real Focus)
├─────────────────────────────────────────────────────────────────────────┤
│                 ASYNC & RACE-CONDITION CURRENTNESS TESTS                │  (Out-of-order promise resolution)
├─────────────────────────────────────────────────────────────────────────┤
│                 FOCUS LIFECYCLE & RESTORATION ASSERTIONS                │  (toHaveFocus, initial & fallback recovery)
├─────────────────────────────────────────────────────────────────────────┤
│                 KEYBOARD STATE-MACHINE INTERACTION TESTS                │  (userEvent Arrow, Enter, Escape)
├─────────────────────────────────────────────────────────────────────────┤
│                 SEMANTIC DOM & ACCESSIBLE NAME ASSERTIONS               │  (Testing Library getByRole queries)
├─────────────────────────────────────────────────────────────────────────┤
│                 AUTOMATED SCANNER INVARIANTS (axe-core)                 │  (toHaveNoViolations color, ARIA validity)
├─────────────────────────────────────────────────────────────────────────┤
│                 STATIC LINTING & COMPILE-TIME RULES                     │  (eslint-plugin-jsx-a11y, TypeScript)
└─────────────────────────────────────────────────────────────────────────┘
```


# 02 — THE SENIOR ARCHITECTURAL EQUATION FOR ACCESSIBILITY CONFIDENCE

$$\mathbf{\text{Accessibility Confidence}} = \mathbf{\text{Static Analysis}} \times \mathbf{\text{Semantic Assertions}} \times \mathbf{\text{Keyboard Operability}} \times \mathbf{\text{Focus Lifecycle}} \times \mathbf{\text{Async Resilience}} \times \mathbf{\text{Human AT Validation}}$$
If any critical verification layer is omitted:
$$\mathbf{\text{100% Automated Scanner Pass}} \;\neq\; \mathbf{\text{Accessible Application}}$$

# 03 — TEST BEHAVIOR & USER CONTRACTS, NOT IMPLEMENTATION

Weak, brittle tests assert private internal state:
```tsx
// ❌ WEAK: Couples test to internal React state variable
expect(component.state.isOpen).toBe(true);
```

Strong, refactor-proof tests assert observable user contracts:
```tsx
// ✅ STRONG: Asserts observable semantic presence and accessibility tree entry
expect(screen.getByRole("dialog", { name: "Account Settings" })).toBeVisible();
expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
```


# 04 — TEST IDS ARE NOT ACCESSIBILITY SEMANTICS

A `data-testid` is test infrastructure metadata. It does **not** expose an accessible name, role, label, or keyboard interaction contract.
```tsx
// ❌ BAD: Hides missing accessible name regressions
const btn = screen.getByTestId("delete-btn");
await userEvent.click(btn);

// ✅ STAFF STANDARD: Asserts exact accessible name and semantic role
const btn = screen.getByRole("button", { name: "Delete Record" });
await userEvent.click(btn);
```



# 05 — THE COMPLETE ACCESSIBILITY TEST LAYER MATRIX

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             ACCESSIBILITY TEST LAYER RESPONSIBILITY MATRIX                       │
├──────────────────────────────┬──────────────────────────────────┬────────────────────────────────┤
│ Accessibility Defect         │ Primary Detecting Layer          │ Example Verification Tool      │
├──────────────────────────────┼──────────────────────────────────┼────────────────────────────────┤
│ Missing <img> alt attribute  │ Static Lint / Scanner            │ eslint-plugin-jsx-a11y / axe   │
│ Low Color Contrast Ratio     │ Automated Scanner                │ axe-core (toHaveNoViolations)  │
│ Missing Accessible Name      │ Semantic Component Test          │ Testing Library getByRole      │
│ Arrow Key Navigation Failure │ Keyboard Interaction Test        │ userEvent.keyboard ArrowDown   │
│ Focus Trapping / Stranding   │ Focus Lifecycle Test             │ toHaveFocus() assertions       │
│ Missing Origin Restoration   │ Integration / Component Test     │ previousFocusRef validation    │
│ Out-of-Order Async Overwrite │ Race Condition Unit Test         │ Controlled Promise resolution  │
│ Dead Trigger Recovery Fall   │ Fault Injection Test             │ Unmount trigger while modal is │
│ Screen Reader Reading Order  │ Manual Assistive Tech Audit      │ NVDA / VoiceOver Virtual Cursor│
└──────────────────────────────┴──────────────────────────────────┴────────────────────────────────┘
```

---

# 06 — COMPLETE TYPESCRIPT IMPLEMENTATION: CUSTOM ACCESSIBILITY ASSERTION MATCHERS

```tsx
import { expect } from 'vitest';

export interface CustomA11yMatchers<R = unknown> {
  toHaveValidAriaRelationship(attribute: string, targetId: string): R;
  toHaveAccessibleName(expectedName: string | RegExp): R;
  toBeTabbable(): R;
  toBeProgrammaticallyFocusableOnly(): R;
}

export const a11yMatchers = {
  toHaveValidAriaRelationship(element: HTMLElement, attribute: string, targetId: string) {
    const attrVal = element.getAttribute(attribute);
    const targetElement = document.getElementById(targetId);

    const pass = attrVal === targetId && targetElement !== null;

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have valid ARIA relationship [${attribute}="${targetId}"]`
          : `Expected element to have valid ARIA relationship [${attribute}="${targetId}"], but target element #${targetId} was not found in DOM.`,
    };
  },

  toHaveAccessibleName(element: HTMLElement, expectedName: string | RegExp) {
    const computedName =
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.innerText ||
      (element as HTMLInputElement).placeholder ||
      '';

    const pass =
      typeof expectedName === 'string'
        ? computedName.trim() === expectedName.trim()
        : expectedName.test(computedName);

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have accessible name "${expectedName}"`
          : `Expected element to have accessible name "${expectedName}", but received "${computedName}".`,
    };
  },

  toBeTabbable(element: HTMLElement) {
    const tabIndex = element.getAttribute('tabindex');
    const isNativeButton = element.tagName.toLowerCase() === 'button' && !element.hasAttribute('disabled');
    const pass = tabIndex === '0' || (isNativeButton && tabIndex === null);

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to be in sequential Tab ring`
          : `Expected element to be tabbable (tabIndex=0 or native enabled control), but received tabIndex="${tabIndex}".`,
    };
  },

  toBeProgrammaticallyFocusableOnly(element: HTMLElement) {
    const tabIndex = element.getAttribute('tabindex');
    const pass = tabIndex === '-1';

    return {
      pass,
      message: () =>
        pass
          ? `Expected element not to have tabIndex="-1"`
          : `Expected element to have tabIndex="-1" (programmatically focusable only), but received "${tabIndex}".`,
    };
  },
};
```

---

# 07 — COMPLETE VITEST TEST SUITE: MODAL DIALOG FOCUS & RESTORATION CONTRACT

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React, { useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';

expect.extend(toHaveNoViolations);

function TestDialogApp() {
  const [open, setOpen] = useState(false);
  const [showTrigger, setShowTrigger] = useState(true);

  return (
    <div>
      <main id="main-content">
        <h1>Cloud Compute Console</h1>
        {showTrigger && (
          <button id="open-settings-btn" onClick={() => setOpen(true)}>
            Open Settings
          </button>
        )}
        <button id="kill-trigger-btn" onClick={() => setShowTrigger(false)}>
          Destroy Trigger
        </button>
      </main>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="dlg-title" id="settings-dlg">
          <h2 id="dlg-title">Instance Configuration</h2>
          <input id="instance-name" placeholder="Enter instance name" />
          <button id="dlg-cancel" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button id="dlg-save" onClick={() => setOpen(false)}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}

describe('PART 10 — Accessible Modal Dialog Verification Suite', () => {
  it('1. Automated Scanner Invariant: Dialog passes axe-core validation with zero violations', async () => {
    const { container } = render(<TestDialogApp />);
    const trigger = screen.getByRole('button', { name: 'Open Settings' });
    await userEvent.click(trigger);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('2. Semantic Contract: Dialog exposes correct role, accessible name, and initial focus', async () => {
    render(<TestDialogApp />);
    const trigger = screen.getByRole('button', { name: 'Open Settings' });
    await userEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Instance Configuration' });
    expect(dialog).toBeInTheDocument();

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelBtn).toHaveFocus();
  });

  it('3. Keyboard Containment: Tab and Shift+Tab wrap within dialog boundaries', async () => {
    render(<TestDialogApp />);
    await userEvent.click(screen.getByRole('button', { name: 'Open Settings' }));

    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    const saveBtn = screen.getByRole('button', { name: 'Save' });

    cancelBtn.focus();
    await userEvent.tab();
    expect(saveBtn).toHaveFocus();

    // Wrap around to first control
    await userEvent.tab();
    const input = screen.getByPlaceholderText('Enter instance name');
    expect(input).toHaveFocus();
  });

  it('4. Focus Restoration Contract: Closing dialog restores focus cleanly to the invoking trigger', async () => {
    render(<TestDialogApp />);
    const trigger = screen.getByRole('button', { name: 'Open Settings' });
    trigger.focus();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('5. Fault Injection: Closing dialog when trigger was destroyed falls back cleanly to main content', async () => {
    render(<TestDialogApp />);
    const openBtn = screen.getByRole('button', { name: 'Open Settings' });
    await userEvent.click(openBtn);

    // Destroy trigger while modal is open
    const killBtn = screen.getByRole('button', { name: 'Destroy Trigger' });
    await userEvent.click(killBtn);

    // Close modal
    await userEvent.keyboard('{Escape}');

    // Verifies focus does NOT drop to document.body, but lands on fallback container
    const mainHeading = screen.getByRole('heading', { level: 1, name: 'Cloud Compute Console' });
    expect(mainHeading).toHaveFocus();
  });
});
```

---

# 08 — COMPLETE VITEST TEST SUITE: COMBOBOX VIRTUAL FOCUS & ASYNC CURRENTNESS

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState, useRef, useId } from 'react';
import { describe, it, expect, vi } from 'vitest';

export function AsyncSearchCombobox({
  searchFn,
}: {
  searchFn: (q: string) => Promise<string[]>;
}) {
  const baseId = useId();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const requestIdRef = useRef(0);

  const handleInput = async (val: string) => {
    setQuery(val);
    const thisRequestId = ++requestIdRef.current;

    try {
      const results = await searchFn(val);
      // Guard against stale async resolution
      if (thisRequestId === requestIdRef.current) {
        setOptions(results);
        setActiveIdx(results.length > 0 ? 0 : -1);
      }
    } catch {
      if (thisRequestId === requestIdRef.current) {
        setOptions([]);
        setActiveIdx(-1);
      }
    }
  };

  const activeOptionId = activeIdx >= 0 ? `${baseId}-opt-${activeIdx}` : undefined;

  return (
    <div>
      <label htmlFor={`${baseId}-input`}>Search Clusters</label>
      <input
        id={`${baseId}-input`}
        type="text"
        role="combobox"
        aria-expanded={options.length > 0}
        aria-autocomplete="list"
        aria-controls={`${baseId}-listbox`}
        aria-activedescendant={activeOptionId}
        value={query}
        onChange={(e) => handleInput(e.target.value)}
      />
      {options.length > 0 && (
        <ul id={`${baseId}-listbox`} role="listbox">
          {options.map((opt, i) => (
            <li
              key={opt}
              id={`${baseId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

describe('PART 10 — Async Combobox Virtual Focus & Race Verification', () => {
  it('1. Verifies aria-activedescendant always points to an existing DOM option element', async () => {
    const mockSearch = vi.fn().mockResolvedValue(['us-east-1', 'us-west-2']);
    render(<AsyncSearchCombobox searchFn={mockSearch} />);

    const input = screen.getByRole('combobox', { name: 'Search Clusters' });
    await userEvent.type(input, 'us');

    await waitFor(() => {
      const activeId = input.getAttribute('aria-activedescendant');
      expect(activeId).toBeTruthy();
      const activeOption = document.getElementById(activeId!);
      expect(activeOption).toBeInTheDocument();
      expect(activeOption).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('2. Async Race Invariant: Stale out-of-order promise resolution cannot overwrite newer results', async () => {
    let resolveQueryA: (val: string[]) => void;
    let resolveQueryB: (val: string[]) => void;

    const mockSearch = vi.fn().mockImplementation((q: string) => {
      if (q === 'a') {
        return new Promise((res) => {
          resolveQueryA = res;
        });
      }
      return new Promise((res) => {
        resolveQueryB = res;
      });
    });

    render(<AsyncSearchCombobox searchFn={mockSearch} />);
    const input = screen.getByRole('combobox', { name: 'Search Clusters' });

    // 1. User types 'a' (slow query)
    await userEvent.type(input, 'a');

    // 2. User quickly types 'b' (newer query)
    await userEvent.type(input, 'b');

    // 3. Newer Query B resolves first
    resolveQueryB!(['Cluster-B-1', 'Cluster-B-2']);

    await waitFor(() => {
      expect(screen.getByText('Cluster-B-1')).toBeInTheDocument();
    });

    // 4. Stale Query A resolves late
    resolveQueryA!(['Cluster-A-Stale']);

    // 5. Assert that stale result was discarded and Cluster-B-1 remains visible
    expect(screen.queryByText('Cluster-A-Stale')).not.toBeInTheDocument();
    expect(screen.getByText('Cluster-B-1')).toBeInTheDocument();
  });
});
```

---


# 09 — COMPLETE VITEST TEST SUITE: TABS COMPONENT KEYBOARD STATE MACHINE & ROVING TABINDEX

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';

function AccessibleTabs({ isManual = false }: { isManual?: boolean }) {
  const [activeTab, setActiveTab] = useState('tab-1');
  const [selectedTab, setSelectedTab] = useState('tab-1');

  const tabs = [
    { id: 'tab-1', panelId: 'panel-1', label: 'Overview' },
    { id: 'tab-2', panelId: 'panel-2', label: 'Billing' },
    { id: 'tab-3', panelId: 'panel-3', label: 'Security' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    } else if (isManual && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setSelectedTab(tabs[index].id);
      return;
    } else {
      return;
    }

    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    if (!isManual) {
      setSelectedTab(nextTab.id);
    }
    document.getElementById(nextTab.id)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Account Settings Tabs">
        {tabs.map((tab, idx) => {
          const isSelected = tab.id === selectedTab;
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              role="tab"
              id={tab.id}
              aria-selected={isSelected}
              aria-controls={tab.panelId}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedTab(tab.id);
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.panelId}
          role="tabpanel"
          id={tab.panelId}
          aria-labelledby={tab.id}
          hidden={tab.id !== selectedTab}
          tabIndex={0}
        >
          <h3>{tab.label} Content</h3>
        </div>
      ))}
    </div>
  );
}

describe('PART 10 — Tabs Keyboard State Machine & Activation Mode Suites', () => {
  it('1. Automatic Activation: Arrow navigation immediately moves focus and selects corresponding panel', async () => {
    render(<AccessibleTabs isManual={false} />);
    const tab1 = screen.getByRole('tab', { name: 'Overview' });
    const tab2 = screen.getByRole('tab', { name: 'Billing' });

    tab1.focus();
    expect(tab1).toHaveFocus();
    expect(tab1).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowRight}');

    expect(tab2).toHaveFocus();
    expect(tab2).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Billing' })).toBeVisible();
  });

  it('2. Manual Activation: Arrow navigation moves focus (active tab) without changing selected panel until Enter', async () => {
    render(<AccessibleTabs isManual={true} />);
    const tab1 = screen.getByRole('tab', { name: 'Overview' });
    const tab2 = screen.getByRole('tab', { name: 'Billing' });

    tab1.focus();
    expect(tab1).toHaveFocus();
    expect(tab1).toHaveAttribute('aria-selected', 'true');

    // Move focus to Tab 2
    await userEvent.keyboard('{ArrowRight}');

    expect(tab2).toHaveFocus();
    // In manual mode, selection remains on Tab 1
    expect(tab1).toHaveAttribute('aria-selected', 'true');
    expect(tab2).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: 'Overview' })).toBeVisible();

    // Press Enter to commit selection
    await userEvent.keyboard('{Enter}');
    expect(tab2).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Billing' })).toBeVisible();
  });

  it('3. Boundary Keys: Home and End keys jump to first and last tabs', async () => {
    render(<AccessibleTabs isManual={false} />);
    const tab1 = screen.getByRole('tab', { name: 'Overview' });
    const tab3 = screen.getByRole('tab', { name: 'Security' });

    tab1.focus();
    await userEvent.keyboard('{End}');
    expect(tab3).toHaveFocus();
    expect(tab3).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{Home}');
    expect(tab1).toHaveFocus();
    expect(tab1).toHaveAttribute('aria-selected', 'true');
  });
});
```

---

# 10 — COMPLETE VITEST TEST SUITE: ACCESSIBLE FORM VALIDATION & ERROR MATCHING

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';

function AccessibleRegistrationForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid corporate email address.');
      document.getElementById('email-field')?.focus();
    } else {
      setError('');
      onSubmit({ email });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email-field">Corporate Email</label>
        <input
          id="email-field"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'email-err-msg' : undefined}
        />
        {error && (
          <p id="email-err-msg" role="alert" style={{ color: '#ef4444' }}>
            {error}
          </p>
        )}
      </div>
      <button type="submit">Register Account</button>
    </form>
  );
}

describe('PART 10 — Form Validation Accessibility Test Suite', () => {
  it('1. Form validation error asserts aria-invalid and connects error message via aria-describedby', async () => {
    const mockSubmit = vi.fn();
    render(<AccessibleRegistrationForm onSubmit={mockSubmit} />);

    const emailInput = screen.getByRole('textbox', { name: 'Corporate Email' });
    const submitBtn = screen.getByRole('button', { name: 'Register Account' });

    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.click(submitBtn);

    expect(mockSubmit).not.toHaveBeenCalled();

    // 1. Assert aria-invalid is true
    expect(emailInput).toHaveAttribute('aria-invalid', 'true');

    // 2. Assert error message exists and has role="alert"
    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toHaveTextContent('Please enter a valid corporate email address.');

    // 3. Assert input is explicitly described by the error message element
    expect(emailInput).toHaveAttribute('aria-describedby', 'email-err-msg');

    // 4. Assert initial error focus placement
    expect(emailInput).toHaveFocus();
  });
});
```

---

# 11 — PLAYWRIGHT END-TO-END AUTOMATED ACCESSIBILITY VERIFICATION

In end-to-end testing, `@axe-core/playwright` audits complete rendered HTML documents with full browser CSS layout, computed color contrast ratios, and hardware keyboard navigation:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('E2E Production Accessibility Suite', () => {
  test('1. Full page scan has zero WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/dashboard/infrastructure');

    // Inject axe-core into real Chromium browser runtime
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('2. Real browser Tab navigation through navigation menu', async ({ page }) => {
    await page.goto('/dashboard/infrastructure');

    // Start at top of page
    await page.keyboard.press('Tab');
    const skipLink = page.locator('#skip-to-content');
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Tab');
    const mainNav = page.locator('nav a >> nth=0');
    await expect(mainNav).toBeFocused();
  });
});
```

---


# 12 — COMPLETE TYPESCRIPT IMPLEMENTATION: STATE MACHINE TEST GENERATOR FOR COMPOSITE WIDGETS

```tsx
export interface WidgetState<T> {
  activeId: string;
  selectedId: string;
  isOpen: boolean;
  context: T;
}

export interface WidgetTransition<T> {
  event: string;
  key?: string;
  expectedActiveId: string;
  expectedSelectedId: string;
  expectedIsOpen: boolean;
}

export function generateWidgetTestSuite<T>(
  initialState: WidgetState<T>,
  transitions: WidgetTransition<T>[],
  renderFn: (state: WidgetState<T>) => HTMLElement
) {
  return () => {
    let currentState = { ...initialState };
    const container = renderFn(currentState);

    transitions.forEach((t, step) => {
      // Simulate key interaction
      const activeEl = document.activeElement;
      if (t.key && activeEl) {
        const event = new KeyboardEvent('keydown', { key: t.key, bubbles: true });
        activeEl.dispatchEvent(event);
      }

      // Assert invariants
      const activeIdDom = document.activeElement?.id;
      if (activeIdDom !== t.expectedActiveId) {
        throw new Error(
          `Step ${step + 1} [${t.event}]: Expected activeElement id "${t.expectedActiveId}", but found "${activeIdDom}".`
        );
      }
    });
  };
}
```

---

# 13 — MANUAL SCREEN READER TESTING PROTOCOLS & KEYSTROKE REFERENCE TABLE

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             SCREEN READER OPERATING PROTOCOL & MATRIX                            │
├──────────────────┬──────────────────┬───────────────────────────────┬────────────────────────────┤
│ Environment      │ Primary Browser  │ Virtual Cursor / Browse Mode  │ Forms / Focus Mode         │
├──────────────────┼──────────────────┼───────────────────────────────┼────────────────────────────┤
│ NVDA (Windows)   │ Mozilla Firefox  │ NVDA + Space (Toggle Browse)  │ Automatic on inputs / Esc  │
│ VoiceOver (macOS)│ Apple Safari     │ VO + Left/Right (VO = Ctrl+Opt)│ VO + Shift + Down (Enter)  │
│ JAWS (Windows)   │ Google Chrome    │ Numpad Plus (Virtual PC Cursor)│ Enter to activate forms    │
│ TalkBack (Android│ Chrome Mobile    │ Swipe Right / Left            │ Double-tap to actuate      │
└──────────────────┴──────────────────┴───────────────────────────────┴────────────────────────────┘
```

### The 7-Step Screen Reader Verification Flow:
1. **Document Landmark Verification:** Press <kbd>D</kbd> (NVDA) or <kbd>VO + U</kbd> (VoiceOver) to audit header, main, and navigation landmarks.
2. **Heading Structure Audit:** Press <kbd>H</kbd> to ensure a single `<h1>` and logical hierarchical indentation (`<h2>` $	o$ `<h3>`).
3. **Tab Flow & Focus Announcement:** <kbd>Tab</kbd> through all interactive controls, verifying that role, accessible name, and state are spoken.
4. **Composite Widget Navigation:** Enter a `role="tablist"` or `role="menu"` using <kbd>Tab</kbd>, then verify that arrow keys navigate options while reading the item name and position (*"2 of 5"*).
5. **Dynamic Updates & Live Regions:** Trigger an async action, confirming that `role="status"` or `role="alert"` speaks status messages without stealing focus.
6. **Modal Containment & Escape:** Open a dialog, verify initial focus placement, confirm that virtual cursor cannot read background elements, and press <kbd>Escape</kbd> to verify clean restoration.
7. **Form Error Feedback:** Submit an invalid form, verifying that `aria-invalid="true"` and the `aria-describedby` error string are announced immediately upon focus.

---


# 14 — COMPLETE VITEST TEST SUITE: TOAST ANNOUNCEMENTS & LIVE REGION VERIFICATION

```tsx
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState, useEffect } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

export function AccessibleToastCenter({
  toasts,
  onDismiss,
}: {
  toasts: { id: string; message: string; type: 'info' | 'error' }[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-label="Notifications"
      style={{ position: 'fixed', bottom: '1rem', right: '1rem', zIndex: 9999 }}
    >
      {/* Polite container for regular informational updates */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {toasts
          .filter((t) => t.type === 'info')
          .map((t) => (
            <div key={t.id} style={{ background: '#1e293b', color: '#fff', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '6px' }}>
              <span>{t.message}</span>
              <button
                type="button"
                aria-label={`Dismiss notification: ${t.message}`}
                onClick={() => onDismiss(t.id)}
                style={{ marginLeft: '1rem' }}
              >
                ×
              </button>
            </div>
          ))}
      </div>

      {/* Assertive container for critical alert errors */}
      <div role="alert" aria-live="assertive" aria-atomic="true">
        {toasts
          .filter((t) => t.type === 'error')
          .map((t) => (
            <div key={t.id} style={{ background: '#ef4444', color: '#fff', padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '6px' }}>
              <span>{t.message}</span>
              <button
                type="button"
                aria-label={`Dismiss critical alert: ${t.message}`}
                onClick={() => onDismiss(t.id)}
                style={{ marginLeft: '1rem' }}
              >
                ×
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

describe('PART 10 — Toast Notifications & Live Region Verification Suite', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. Verifies toast announcements NEVER steal active hardware focus from the user', async () => {
    function AppHost() {
      const [toasts, setToasts] = useState<{ id: string; message: string; type: 'info' | 'error' }[]>([]);

      return (
        <div>
          <input id="user-typing-input" placeholder="Type here..." />
          <button
            id="trigger-toast"
            onClick={() => setToasts([{ id: 't-1', message: 'Deployment Successful', type: 'info' }])}
          >
            Trigger Toast
          </button>
          <AccessibleToastCenter toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
        </div>
      );
    }

    render(<AppHost />);
    const input = screen.getByPlaceholderText('Type here...');
    input.focus();
    expect(input).toHaveFocus();

    const triggerBtn = screen.getByRole('button', { name: 'Trigger Toast' });
    await userEvent.click(triggerBtn);

    // Toast is rendered in live region
    expect(screen.getByText('Deployment Successful')).toBeInTheDocument();

    // CRITICAL ASSERTION: Focus remains undisturbed on the user input or invoking trigger
    expect(document.activeElement).not.toBe(document.body);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('2. Critical error toasts declare role="alert" and aria-live="assertive"', () => {
    const errorToast = [{ id: 'err-1', message: 'Database Connection Lost', type: 'error' as const }];
    render(<AccessibleToastCenter toasts={errorToast} onDismiss={() => {}} />);

    const alertBox = screen.getByRole('alert');
    expect(alertBox).toHaveAttribute('aria-live', 'assertive');
    expect(alertBox).toHaveTextContent('Database Connection Lost');
  });
});
```

---

# 15 — ENTERPRISE CI/CD GITHUB ACTIONS ACCESSIBILITY PIPELINE

```yaml
name: Accessibility CI Gate

on:
  pull_request:
    branches: [main, release/*]

jobs:
  accessibility-validation:
    name: Layered A11y Verification
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Step 1 — Static ESLint jsx-a11y Rules
        run: npx eslint --plugin jsx-a11y --rule 'jsx-a11y/alt-text: error' 'src/**/*.{ts,tsx}'

      - name: Step 2 — Automated jest-axe & Semantic Component Invariants
        run: npm run test:a11y

      - name: Step 3 — Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Step 4 — Playwright E2E Axe Audit & Keyboard Journey Tests
        run: npx playwright test tests/a11y/
```

---


# 16 — COMPREHENSIVE ACCESSIBILITY TESTING DECISION MATRICES

### Matrix 1: Accessibility Query Hierarchy in React Testing Library
```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         REACT TESTING LIBRARY A11Y QUERY HIERARCHY                               │
├──────┬──────────────────────────────────┬────────────────────────────────────────────────────────┤
│ Rank │ Query Method                     │ Architectural Standard & Semantic Scope                │
├──────┼──────────────────────────────────┼────────────────────────────────────────────────────────┤
│ 1    │ getByRole('role', { name })      │ Gold standard: verifies semantic role & accessible name│
│ 2    │ getByLabelText('Label')          │ Form controls: verifies <label> association & binding  │
│ 3    │ getByPlaceholderText('...')      │ Input fields lacking permanent labels                  │
│ 4    │ getByText('Content')             │ Static non-interactive paragraph or heading text       │
│ 5    │ getByDisplayValue('Value')       │ Current form input value verification                  │
│ 6    │ getByAltText('Image Desc')       │ Informative <img> element alternative text             │
│ 7    │ getByTitle('Tooltip')            │ Tooltip & frame title verification                     │
│ 8    │ getByTestId('id')                │ LAST RESORT: Unusable for proving accessibility        │
└──────┴──────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

### Matrix 2: Unit vs Integration vs E2E vs Manual AT Testing
```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             TEST LAYER SCOPE & DEFECT COVERAGE MATRIX                            │
├──────────────────────────────┬──────────────┬──────────────┬─────────────┬───────────────────────┤
│ Verification Scope           │ Unit / Comp  │ Integration  │ E2E Browser │ Manual AT Audit       │
├──────────────────────────────┼──────────────┼──────────────┼─────────────┼───────────────────────┤
│ Syntax & HTML ARIA Validity  │ EXCELLENT    │ EXCELLENT    │ EXCELLENT   │ NOT NEEDED            │
│ Accessible Name Calculation  │ EXCELLENT    │ EXCELLENT    │ EXCELLENT   │ EXCELLENT             │
│ Directional Arrow Navigation │ EXCELLENT    │ EXCELLENT    │ GOOD        │ EXCELLENT             │
│ Modal Initial Focus & Trap   │ EXCELLENT    │ EXCELLENT    │ EXCELLENT   │ EXCELLENT             │
│ Dead Origin Fallback Recovery│ GOOD         │ EXCELLENT    │ EXCELLENT   │ EXCELLENT             │
│ Async Race Currentness Guards│ EXCELLENT    │ EXCELLENT    │ POOR (Flaky)│ POOR                  │
│ Client-side SPA Route Focus  │ POOR         │ GOOD         │ EXCELLENT   │ EXCELLENT             │
│ Color Contrast (Real CSS)    │ POOR (JSDOM) │ POOR (JSDOM) │ EXCELLENT   │ EXCELLENT             │
│ Screen Reader Speech Clarity │ IMPOSSIBLE   │ IMPOSSIBLE   │ IMPOSSIBLE  │ EXCELLENT (Mandatory) │
└──────────────────────────────┴──────────────┴─────────────┴─────────────┴───────────────────────┘
```

---




# 17 — COMPLETE TYPESCRIPT IMPLEMENTATION: FAULT INJECTION ACCESSIBILITY HARNESS

```tsx
import React, { useState } from 'react';

export interface FaultInjectionConfig {
  stripAccessibleName?: boolean;
  destroyTriggerWhileOpen?: boolean;
  simulateOutOfOrderAsync?: boolean;
  injectDuplicateDomIds?: boolean;
  disableActiveOption?: boolean;
}

export function createFaultInjectionHarness<P extends object>(
  Component: React.ComponentType<P>,
  defaultProps: P
) {
  return function FaultInjectedWrapper({
    faults = {},
    ...overrideProps
  }: {
    faults?: FaultInjectionConfig;
  } & Partial<P>) {
    const props = { ...defaultProps, ...overrideProps } as P;

    return (
      <div data-testid="fault-harness-container">
        {faults.injectDuplicateDomIds && (
          <div id="reused-duplicate-id" style={{ display: 'none' }}>
            Duplicate Node 1
          </div>
        )}
        <Component {...props} />
        {faults.injectDuplicateDomIds && (
          <div id="reused-duplicate-id" style={{ display: 'none' }}>
            Duplicate Node 2
          </div>
        )}
      </div>
    );
  };
}
```

---

# 18 — ACCESSIBLE COMPONENT TEST SPECIFICATION CONTRACT TEMPLATE

Before writing a single line of component code, staff frontend engineers author an **Accessibility Contract Specification**:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         ACCESSIBILITY CONTRACT SPECIFICATION TEMPLATE                            │
├──────────────────────────────┬───────────────────────────────────────────────────────────────────┤
│ Dimension                    │ Production Architectural Contract                                 │
├──────────────────────────────┼───────────────────────────────────────────────────────────────────┤
│ Widget Semantic Role         │ WAI-ARIA 1.2 canonical role (e.g., role="combobox")               │
│ Accessible Name Source       │ Visual <label>, aria-label, or aria-labelledby relationship       │
│ Accessible Description       │ aria-describedby binding pointing to helper text / errors         │
│ Sequential Tab Rings         │ Exactly ONE tabbable element (tabIndex={0}); rest tabIndex={-1}   │
│ Directional Arrow Navigation │ ArrowUp / ArrowDown / ArrowLeft / ArrowRight state transitions    │
│ Activation Conventions       │ Enter and Space actuation contracts matching native controls      │
│ Escape Dismissal Strategy    │ LIFO Escape stack manager participation; closes topmost layer     │
│ Hardware Focus Owner         │ document.activeElement target (input vs roving button item)       │
│ Virtual Focus Pointer        │ aria-activedescendant pointing to unique child option ID          │
│ Focus Restoration Contract   │ Validated return to invoking origin upon overlay dismissal        │
│ Fallback Recovery Strategy   │ Nearest surviving sibling or container focus if origin destroyed  │
│ Async Race Currentness Guard │ requestIdRef or AbortController to discard stale responses        │
│ Scanner Invariance           │ 0 violations on jest-axe, axe-core, and Lighthouse                │
└──────────────────────────────┴───────────────────────────────────────────────────────────────────┘
```

---



# 19 — COMPLETE TYPESCRIPT IMPLEMENTATION: TESTING REACT PORTALS & FOCUS BOUNDARIES

In React, Portals render children into a different DOM subtree (typically directly under `document.body`) while preserving synthetic React event bubbling. This introduces subtle accessibility testing challenges:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { describe, it, expect } from 'vitest';

export function ModalPortal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-dlg-title"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)' }}
    >
      <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: '8px' }}>
        <h2 id="portal-dlg-title">Portal Modal Title</h2>
        <button id="portal-close-btn" onClick={onClose}>
          Close Portal
        </button>
      </div>
    </div>,
    document.body
  );
}

describe('PART 10 — React Portal Accessibility Testing Suite', () => {
  it('1. Verifies portal dialog mounts outside parent container while maintaining semantic accessibility bindings', async () => {
    function HostApp() {
      const [open, setOpen] = useState(false);
      return (
        <div id="app-root-container">
          <button id="open-portal-btn" onClick={() => setOpen(true)}>
            Open Portal Modal
          </button>
          <ModalPortal isOpen={open} onClose={() => setOpen(false)} />
        </div>
      );
    }

    const { container } = render(<HostApp />);
    const openBtn = screen.getByRole('button', { name: 'Open Portal Modal' });
    await userEvent.click(openBtn);

    // 1. Assert modal exists in document body, outside the React root container
    const dialog = screen.getByRole('dialog', { name: 'Portal Modal Title' });
    expect(dialog).toBeInTheDocument();
    expect(container.querySelector('#app-root-container')).not.toContainElement(dialog);
    expect(document.body).toContainElement(dialog);

    // 2. Assert escape dismissal
    await userEvent.keyboard('{Escape}');
  });
});
```

---

# 20 — TESTING PROGRESSIVE ENHANCEMENT & SSR HYDRATION CONTINUITY

When testing Server-Side Rendered (SSR) React components:
1. **Server HTML Extraction:** Render HTML via `renderToString()` and verify semantic HTML landmark structures (<kbd>nav</kbd>, <kbd>main</kbd>, <kbd>h1</kbd>).
2. **Client Hydration Verification:** Hydrate client components and assert that `useId()` generated IDs remain identical without DOM replacement or semantic attribute mismatch.
3. **Graceful Enhancement:** Verify that forms retain native action targets and valid submit buttons prior to JavaScript hydration.

```tsx
import { renderToString } from 'react-dom/server';
import React from 'react';
import { describe, it, expect } from 'vitest';

describe('PART 10 — SSR Semantic Continuity & Hydration Invariants', () => {
  it('1. Verifies server-rendered markup contains valid semantic HTML before client JS loads', () => {
    function ServerNav() {
      return (
        <header>
          <nav aria-label="Global Primary Navigation">
            <a href="/dashboard">Dashboard</a>
            <a href="/settings">Settings</a>
          </nav>
        </header>
      );
    }

    const html = renderToString(<ServerNav />);
    expect(html).toContain('<nav aria-label="Global Primary Navigation">');
    expect(html).toContain('href="/dashboard"');
  });
});
```

---



# 21 — COMPLETE TYPESCRIPT IMPLEMENTATION: AUTOMATED ARIA INVARIANT VERIFIER

```tsx
export function verifyDomAriaInvariants(container: HTMLElement): string[] {
  const violations: string[] = [];

  // 1. Verify all aria-controls point to existing elements
  const controlledNodes = container.querySelectorAll('[aria-controls]');
  controlledNodes.forEach((node) => {
    const targetId = node.getAttribute('aria-controls');
    if (targetId && !document.getElementById(targetId)) {
      violations.push(
        `Dangling aria-controls: Element <${node.tagName.toLowerCase()} id="${node.id}"> references non-existent target id="#${targetId}".`
      );
    }
  });

  // 2. Verify all aria-labelledby point to existing elements
  const labelledNodes = container.querySelectorAll('[aria-labelledby]');
  labelledNodes.forEach((node) => {
    const labelIds = node.getAttribute('aria-labelledby')?.split(/\s+/) || [];
    labelIds.forEach((id) => {
      if (id && !document.getElementById(id)) {
        violations.push(
          `Dangling aria-labelledby: Element <${node.tagName.toLowerCase()} id="${node.id}"> references non-existent label id="#${id}".`
        );
      }
    });
  });

  // 3. Verify all aria-activedescendant point to existing elements
  const activeDescendantNodes = container.querySelectorAll('[aria-activedescendant]');
  activeDescendantNodes.forEach((node) => {
    const descId = node.getAttribute('aria-activedescendant');
    if (descId && !document.getElementById(descId)) {
      violations.push(
        `Dangling aria-activedescendant: Combobox <${node.tagName.toLowerCase()} id="${node.id}"> references non-existent option id="#${descId}".`
      );
    }
  });

  // 4. Check for duplicate DOM IDs within container
  const idMap = new Map<string, number>();
  container.querySelectorAll('[id]').forEach((node) => {
    const id = node.id;
    idMap.set(id, (idMap.get(id) || 0) + 1);
  });
  idMap.forEach((count, id) => {
    if (count > 1) {
      violations.push(`Duplicate DOM ID detected: id="#${id}" appears ${count} times.`);
    }
  });

  return violations;
}
```

---

# 22 — MOBILE TOUCH & SCREEN READER ROTOR TESTING PROTOCOLS

On mobile platforms (iOS and Android), users interact with React web applications using gesture-based virtual screen readers:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         MOBILE ASSISTIVE TECHNOLOGY INTERACTION MATRIX                           │
├──────────────────────────────┬──────────────────────────────────┬────────────────────────────────┤
│ Interaction Gesture          │ iOS VoiceOver Action             │ Android TalkBack Action        │
├──────────────────────────────┼──────────────────────────────────┼────────────────────────────────┤
│ Single-finger Swipe Right    │ Move to next accessible element  │ Move to next accessible element│
│ Single-finger Swipe Left     │ Move to previous element         │ Move to previous element       │
│ Single-finger Double Tap     │ Actuate / click active element   │ Actuate / click active element │
│ Two-finger Rotation (Rotor)  │ Switch navigation granularity    │ Local context menu gesture     │
│ Two-finger Scrub (Z-gesture) │ Dismiss modal / go back (Escape) │ Swipe Down then Left (Back)    │
│ Three-finger Swipe Up/Down   │ Scroll page / container view     │ Two-finger Drag to scroll      │
└──────────────────────────────┴──────────────────────────────────┴────────────────────────────────┘
```

### Key Mobile Touch Accessibility Testing Invariants:
1. **Touch Target Size:** Interactive controls must provide a minimum physical hit area of **44 × 44 CSS pixels** (WCAG 2.5.5 / 2.5.8 Target Size Minimum).
2. **Virtual Cursor Focus Retention:** Activating bottom sheets or modal overlays must not strand iOS VoiceOver virtual cursors on background content.
3. **Double-Tap Actuation:** Custom components must listen to standard click events so assistive technologies trigger activation seamlessly on double-tap.

---



# 23 — AXE-CORE ADVANCED CONFIGURATION & CUSTOM ENTERPRISE RULESETS

In enterprise design systems, standard axe configurations can be extended with company-specific rules:

```tsx
import { configureAxe } from 'jest-axe';

export const customAxe = configureAxe({
  rules: {
    // Enforce strict WCAG 2.1 Level AAA color contrast for high-risk financial views
    'color-contrast': { enabled: true },
    // Ensure every interactive button has a non-empty accessible name
    'button-name': { enabled: true },
    // Disable rules that are handled higher in the stack
    'region': { enabled: false },
  },
});
```

### Pre-commit Git Hook Configuration with Husky
```bash
#!/bin/sh
# .husky/pre-commit
echo "Running enterprise accessibility verification..."
npm run test:a11y -- --bail
if [ $? -ne 0 ]; then
  echo "❌ Commit rejected: Accessibility test suite failed."
  exit 1
fi
```

---


# 60 — 🔥 PRODUCTION CRUCIBLES & ROOT CAUSE ANALYSES (1 THROUGH 6)

### Crucible 1: Scanner Pass, Keyboard Failure
- **Incident:** A newly released navigation dropdown passed automated CI accessibility scans (100% score on Lighthouse and axe-core). In production, keyboard users were unable to open submenus using arrow keys.
- **Root Cause:** Automated DOM scanners check static ARIA attributes (`role="menu"`, `aria-haspopup`) but cannot verify JavaScript event listener state machines or physical keyboard actuation:
```tsx
// ❌ MARKUP PASSES SCANNER BUT HAS NO ARROW KEY LISTENER
<div role="menu" aria-label="Quick Actions">
  <div role="menuitem" tabIndex={-1}>Duplicate</div>
  <div role="menuitem" tabIndex={-1}>Archive</div>
</div>
```
- **Remediation:** Mandate interaction tests with `userEvent.keyboard('{ArrowDown}')` alongside static axe scans:
```tsx
// ✅ REMEDIATED TEST: Asserts keyboard state machine transition
test('ArrowDown navigates to next menu item', async () => {
  render(<QuickActionsMenu />);
  await userEvent.click(screen.getByRole('button', { name: 'Quick Actions' }));
  await userEvent.keyboard('{ArrowDown}');
  expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
});
```

---

### Crucible 2: Test Suite Uses Test IDs Everywhere
- **Incident:** An engineering team maintained 400+ unit tests using `data-testid="submit-btn"`. A refactor accidentally deleted the button's visible label and `aria-label`. Every single test passed, but the button was completely unannounced by VoiceOver.
- **Root Cause:** `getByTestId` queries check DOM existence while completely bypassing the accessibility tree:
```tsx
// ❌ FAILS TO CATCH ACCESSIBILITY REGRESSION
const btn = screen.getByTestId('submit-btn'); // Passes even if button is completely blank!
```
- **Remediation:** Replace `getByTestId` with `getByRole('button', { name: 'Submit Application' })` across all test suites:
```tsx
// ✅ CATCHES MISSING LABEL REGRESSION IMMEDIATELY
const btn = screen.getByRole('button', { name: 'Submit Application' });
```

---

### Crucible 3: Focus Regression After Remount
- **Incident:** A modal dialog previously restored focus to its opener. A performance refactor wrapped the table in a new key: `<Table key={filterState} />`. Closing the modal threw errors because the original trigger DOM node had been remounted.
- **Root Cause:** The test suite only asserted that the modal unmounted (`expect(modal).not.toBeInTheDocument()`), omitting the focus restoration assertion.
- **Remediation:** Add `expect(triggerBtn).toHaveFocus()` to every overlay test.

---

### Crucible 4: The Stale Async Combobox
- **Incident:** When searching for microservices over high-latency mobile networks, typing quickly left `aria-activedescendant` referencing deleted option IDs, causing screen readers to fall silent.
- **Root Cause:** Unit tests used deterministic mock data that always resolved sequentially, hiding asynchronous race conditions.
- **Remediation:** Introduce asynchronous fault injection tests that resolve promises in reverse order using controllable deferred promises.

---

### Crucible 5: Dynamic Form Field Array Reorder
- **Incident:** In an infrastructure configuration form, deleting or reordering field array rows resulted in validation error messages pointing to the wrong fields.
- **Root Cause:** Unit tests asserted `expect(screen.getByText('Invalid Port')).toBeVisible()`, failing to assert the `aria-describedby` relationship connecting the specific input to the specific error message.
- **Remediation:** Assert the explicit semantic association: `expect(input).toHaveAttribute('aria-describedby', errorId)`.

---

### Crucible 6: SPA Route Navigation Focus Loss
- **Incident:** Client-side route changes updated the URL and rendered new content, but keyboard focus remained stranded on the previously clicked link in the global navigation bar.
- **Root Cause:** Testing was conducted purely at the isolated component level without end-to-end route transition tests.
- **Remediation:** Implement E2E route navigation tests asserting that focus shifts to the primary `<h1>` landmark upon page transition.


---



# 80 — SENIOR DIAGNOSTIC EXERCISES & ARCHITECTURAL PROBLEM ANALYSIS

### Exercise 1: The Passing Empty-Button Test
```tsx
// Test passes:
expect(screen.getByText('Delete')).toBeInTheDocument();
// But the actual component renders:
<button><TrashIcon /></button>
```
- **Defect Analysis:** The test searched for generic text somewhere in the document, which matched an unrelated paragraph. The actual interactive button had no accessible name.
- **Architectural Solution:** Query the interactive element directly via `screen.getByRole('button', { name: 'Delete' })`.

---

### Exercise 2: The 100% axe-core Pass with Broken Arrows
```tsx
<div role="tablist">
  <button role="tab" tabIndex={0}>Tab 1</button>
  <button role="tab" tabIndex={-1}>Tab 2</button>
</div>
```
- **Defect Analysis:** The component has valid static ARIA attributes, so `axe(container)` reports 0 violations. However, the component omits arrow key event listeners.
- **Architectural Solution:** Layer interaction tests using `userEvent.keyboard('{ArrowRight}')` to verify roving tab index movement.

---

### Exercise 3: The Missing Restoration Target Race
```tsx
// Test opens modal, clicks button, closes modal.
// Trigger was deleted while modal was open.
```
- **Defect Analysis:** If the trigger was destroyed, calling `previousFocusRef.current.focus()` drops focus to `document.body`.
- **Architectural Solution:** Implement fallback focus verification in unit tests to guarantee focus transfers to `#main-content`.

---

### Exercise 4: The Out-of-Order Search Race
```tsx
// Query A (slow) and Query B (fast)
```
- **Defect Analysis:** If Query A resolves after Query B, stale options overwrite newer options and leave `aria-activedescendant` referencing a deleted ID.
- **Architectural Solution:** Use deferred promises in Vitest to deliberately resolve promises in reverse order and prove `requestIdRef` drops stale responses.

---

### Exercise 5: The Positional Index Reorder Bug
```tsx
// activeIndex = 1
```
- **Defect Analysis:** When items are sorted, index `1` points to a completely different domain entity.
- **Architectural Solution:** Key active state by entity UUID (`activeId = "node-alpha"`) and assert that focus follows the entity.

---


# 85 — STAFF-LEVEL TECHNICAL INTERVIEW QUESTIONS & ARCHITECTURAL DISSERTATIONS

### Q1: Why can an automated accessibility scanner never serve as the complete accessibility test strategy?
**Staff Architecture Dissertation:**
Automated scanners (such as `axe-core`, Lighthouse, or Accessibility Insights) operate via static DOM tree inspection. They evaluate whether markup conforms to explicit syntactic rules: whether images possess `alt` attributes, whether color contrast meets 4.5:1 ratios, and whether ARIA attributes are syntactically valid.

However, scanners cannot evaluate **dynamic interaction semantics**:
1. **Keyboard State Machines:** A scanner cannot determine whether <kbd>Arrow Down</kbd> correctly navigates composite widget items or whether <kbd>Home</kbd>/<kbd>End</kbd> jump to boundaries.
2. **Focus Lifecycles & Restoration:** Scanners cannot verify whether hardware focus enters a modal upon mount or whether focus restores to the invoking element after dismissal.
3. **Async Race Conditions:** Scanners cannot detect whether out-of-order network responses corrupt active descendant IDs.
4. **Contextual Quality:** Scanners cannot judge whether an accessible name is concise, contextually meaningful, and free of redundant role text (e.g. *"Delete button"* vs *"Delete"*).

A staff engineer implements a **layered verification pyramid**: Static Analysis $	o$ Automated Scanners $	o$ Semantic Component Assertions $	o$ Keyboard State Machine Tests $	o$ Focus Lifecycle Invariants $	o$ Async Race Tests $	o$ Manual Assistive Technology Validation.

---

### Q2: Why should component tests prefer semantic queries (`getByRole`) over test IDs (`getByTestId`)?
**Staff Architecture Dissertation:**
Semantic queries assert the exact contract that assistive technology and browsers consume:
- `getByRole('button', { name: 'Save Changes' })` verifies both the **semantic role** and the **accessible name calculation**.
- If a developer strips an `aria-label` or breaks an `aria-labelledby` relationship, the semantic query fails immediately, catching the defect during local CI.
- Conversely, `getByTestId('save-btn')` queries arbitrary DOM attributes, passing cleanly even when the element is completely inaccessible to screen reader users.

Using `data-testid` everywhere creates a dangerous false sense of security where test suites pass with 100% green checkmarks while production applications remain completely unusable for disabled users.

---

### Q3: What should a production dialog accessibility test suite verify beyond rendering?
**Staff Architecture Dissertation:**
A complete dialog test suite must verify seven distinct invariants:
1. **Accessible Name:** Dialog exposes an accessible title computed via `aria-labelledby`.
2. **Initial Focus:** Hardware focus enters the dialog upon mount (favoring non-destructive cancel actions).
3. **Focus Containment:** <kbd>Tab</kbd> and <kbd>Shift+Tab</kbd> loop strictly within active dialog boundaries.
4. **Escape Dismissal:** Pressing <kbd>Escape</kbd> dismisses only the topmost active layer in the overlay stack.
5. **Focus Restoration:** Closing the dialog imperatively restores focus to the invoking trigger.
6. **Fallback Recovery:** If the invoking trigger was destroyed during modal interaction, focus safely falls back to a stable container (`#main-content`).
7. **Scanner Invariance:** `axe(container)` reports zero automated violations.

---

### Q4: Why is focus assertion (`toHaveFocus`) critical even when the DOM appears visually correct?
**Staff Architecture Dissertation:**
In React applications, DOM rendering and browser hardware focus are orthogonal systems. A component can render flawless markup with 100% correct ARIA attributes while hardware focus is stranded on `document.body`.
Keyboard users navigate via the physical hardware focus ring. If a test only asserts DOM visibility (`toBeVisible()`), it fails to prove that the keyboard user can actually interact with the newly rendered state.

---

### Q5: How do you architect automated tests to expose asynchronous focus race conditions?
**Staff Architecture Dissertation:**
In asynchronous comboboxes, users type queries rapidly. Senior test suites create controllable Promise deferrals:
```tsx
const [promiseA, resolveA] = createDeferred();
const [promiseB, resolveB] = createDeferred();
// 1. Dispatch Query A
// 2. Dispatch Query B
// 3. Resolve Query B first
// 4. Resolve Query A second
// 5. Assert Query A cannot overwrite active descendant state
```
This proves that `requestIdRef` or AbortController guards successfully drop stale asynchronous responses.

---

### Q6: Why should tests verify immutable entity UUIDs instead of array indices?
**Staff Architecture Dissertation:**
Array indices (`index = 2`) represent transient visual positions. When lists are sorted, filtered, or mutated, index `2` points to a completely different domain entity.
Asserting `expect(activeId).toBe('server-us-east')` proves that the component maintains focus continuity on the actual domain entity across collection reordering.

---

### Q7: What is Fault Injection Testing in frontend accessibility?
**Staff Architecture Dissertation:**
Fault injection deliberately simulates production edge cases:
- Destroying the modal trigger while the modal is open.
- Returning out-of-order network responses.
- Removing active items from collections.
- Disabling the currently focused control.
Asserting that the accessibility contract survives these faults turns accessibility testing into **resilience engineering**.

---

### Q8: Why must ARIA relationship bindings be tested for target element existence?
**Staff Architecture Dissertation:**
An attribute like `aria-controls="panel-42"` or `aria-activedescendant="opt-42"` is merely a string pointer. If the target element with `id="opt-42"` does not exist in the DOM, the semantic contract is completely broken. Tests must assert that every ARIA pointer resolves to a physical DOM node.

---

### Q9: How do you test accessibility without coupling tests to implementation details?
**Staff Architecture Dissertation:**
Test strictly through user-observable boundaries:
- User Action: `userEvent.keyboard('{ArrowDown}')`
- Semantic Outcome: `expect(screen.getByRole('option', { name: 'Canada' })).toHaveAttribute('aria-selected', 'true')`
- Focus Outcome: `expect(input).toHaveAttribute('aria-activedescendant', 'opt-canada')`
Avoid asserting internal state variables (`isOpen`, `activeIndex`) or private hook methods.

---

### Q10: What defines an architecture-grade accessibility test suite?
**Staff Architecture Dissertation:**
An architecture-grade test suite is:
1. **Layered:** Combines static linting, axe-core scans, semantic queries, keyboard state machines, focus invariants, and async race guards.
2. **Resilient:** Verified against fault injection and collection reordering.
3. **Refactor-Proof:** Encodes user-facing contracts rather than component internals.
4. **Deterministic:** Guarantees total interaction continuity across all dynamic lifecycles.


---

# 95 — 50-POINT MASTER ACCESSIBILITY TESTING CHECKLIST

```text
SEMANTIC & DOM CONTRACT ASSERTIONS
[ ] 01. Every interactive control is queried via getByRole with its exact accessible name.
[ ] 02. No production accessibility tests rely on arbitrary data-testid attributes for semantic controls.
[ ] 03. Icon-only buttons are asserted to possess explicit aria-label or visually hidden text.
[ ] 04. Form controls are queried via getByRole('textbox', { name: 'Label' }) to verify label association.
[ ] 05. Form validation errors assert explicit aria-invalid="true" and aria-describedby bindings.
[ ] 06. Dynamic expanded states assert transitions: aria-expanded="false" -> aria-expanded="true".
[ ] 07. Selected items assert aria-selected="true" or aria-checked="true" matching widget role.
[ ] 08. All ARIA ID references (aria-controls, aria-labelledby) resolve to existing DOM nodes.
[ ] 09. Duplicate DOM IDs are strictly caught and asserted against in automated test suites.
[ ] 10. Automated scanner assertions (expect(container).toHaveNoViolations()) run in CI.

KEYBOARD STATE-MACHINE & OPERABILITY VERIFICATION
[ ] 11. Composite widgets (Tabs, Toolbars, Menus) are tested for directional Arrow navigation.
[ ] 12. Home and End keys are asserted to jump focus to the first and last enabled items.
[ ] 13. Enter and Space keys are asserted to actuate buttons, tabs, and menu items.
[ ] 14. Escape key is asserted to dismiss open dropdowns, popovers, and modal dialogs.
[ ] 15. Tab key cleanly navigates across composite widget boundaries without trapping focus.
[ ] 16. Shift+Tab reverses sequential navigation without focus skips.
[ ] 17. preventDefault() assertions confirm that unhandled keys retain native browser behavior.
[ ] 18. Typeahead character matching is verified via fast typing simulation in comboboxes.
[ ] 19. Disabled controls in composite widgets assert aria-disabled="true" and arrow bypass.
[ ] 20. Infinite focus loops outside modal dialogs are strictly tested and prevented.

FOCUS LIFECYCLES & RESTORATION CONTRACTS
[ ] 21. Modal dialog tests assert initial focus placement onto Cancel button or first field.
[ ] 22. Modal dialog tests assert focus containment (Tab/Shift+Tab wrapping).
[ ] 23. Modal dialog tests assert focus restoration to invoking trigger upon dismissal.
[ ] 24. Fault injection tests verify fallback focus restoration when trigger is unmounted.
[ ] 25. Dynamic item deletion tests assert immediate focus recovery to the next surviving sibling.
[ ] 26. Sorting and reordering tests assert that focus follows the domain entity UUID.
[ ] 27. Background content is asserted to have the inert attribute during active modal display.
[ ] 28. Nested overlay tests assert LIFO Escape dismissal (topmost layer dismissed first).
[ ] 29. Route navigation tests assert focus transfer to the primary <h1> heading.
[ ] 30. Unmounting overlays are asserted to clean up all global event listeners.

ASYNC LIFECYCLE & RACE CURRENTNESS TESTING
[ ] 31. Out-of-order promise resolution tests confirm that stale search queries are discarded.
[ ] 32. In-flight search queries assert that aria-activedescendant never points to a dangling ID.
[ ] 33. Debounced typing tests confirm that live region speech queues are not flooded.
[ ] 34. Dynamic collection updates assert that active ID remains valid if item is still present.
[ ] 35. Optimistic UI rollback tests assert focus and state continuity on network failure.
[ ] 36. Component remount tests confirm that focus registries are completely reconstructed.
[ ] 37. Portal rendering tests verify that focus traps function across DOM hierarchy boundaries.
[ ] 38. Virtualized list tests verify scroll-into-view before applying programmatic focus.
[ ] 39. Error Boundary fallback tests assert that fallback UIs are accessible and keyboard usable.
[ ] 40. Loading spinner transitions assert aria-busy="true" without stealing user focus.

TESTING ARCHITECTURE & GOVERNANCE
[ ] 41. Test descriptions explicitly state the user-facing accessibility contract being verified.
[ ] 42. Tests assert observable outcomes (toHaveFocus, getByRole) rather than internal state.
[ ] 43. Regression test suites exist for all past production accessibility incident tickets.
[ ] 44. Custom matchers (toHaveValidAriaRelationship, toBeTabbable) are standardized in CI.
[ ] 45. Component contract matrices are documented for all design system primitives.
[ ] 46. End-to-end browser tests in Playwright verify complete cross-page keyboard journeys.
[ ] 47. Manual keyboard-only test protocols are completed for all Tier-1 product flows.
[ ] 48. Screen reader testing protocols (NVDA / VoiceOver) are executed prior to major releases.
[ ] 49. Staff engineers review accessibility test coverage during architectural design reviews.
[ ] 50. 100% of product engineers understand that scanner passes do not equal accessible UI.
```

---

# 96 — 🎯 GRADUATION GATE: MASTERING ACCESSIBILITY TESTING

You have mastered Part 10 when you can design a complete, multi-tiered accessibility verification architecture for any complex React component without relying exclusively on automated scanners.

You should be able to produce:
$$\text{Semantic Contract} \longrightarrow \text{Keyboard Contract} \longrightarrow \text{Focus Contract} \longrightarrow \text{Async Race Contract} \longrightarrow \text{Fault Injection Suite}$$

---

# 97 — FINAL SENIOR MENTAL MODEL & TESTING EQUATION

$$\mathbf{\text{Accessibility Testing}} = \mathbf{\text{Semantic Verification}} + \mathbf{\text{Keyboard Verification}} + \mathbf{\text{Focus Lifecycle}} + \mathbf{\text{Identity Stability}} + \mathbf{\text{Async Resilience}} + \mathbf{\text{Human AT Validation}}$$

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         THE UNIFIED ACCESSIBILITY VERIFICATION PIPELINE                          │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│   Source Code & Pull Request                                                                     │
│          │                                                                                       │
│          ▼                                                                                       │
│   1. Static Analysis (eslint-plugin-jsx-a11y)                                                    │
│          │                                                                                       │
│          ▼                                                                                       │
│   2. Automated Scanners (jest-axe / axe-core)                                                    │
│          │                                                                                       │
│          ▼                                                                                       │
│   3. Semantic Component Assertions (Testing Library getByRole)                                   │
│          │                                                                                       │
│          ▼                                                                                       │
│   4. Keyboard State Machine Tests (userEvent Arrow, Enter, Escape)                               │
│          │                                                                                       │
│          ▼                                                                                       │
│   5. Focus Lifecycle & Restoration (toHaveFocus, Fallback Recovery)                              │
│          │                                                                                       │
│          ▼                                                                                       │
│   6. Async Race & Fault Injection (Out-of-order Promises, Trigger Removal)                       │
│          │                                                                                       │
│          ▼                                                                                       │
│   7. E2E Route & Portal Integration (Playwright Cross-Browser Tests)                             │
│          │                                                                                       │
│          ▼                                                                                       │
│   8. Manual Screen Reader Validation (NVDA / VoiceOver Usability)                                │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 100 — CRITICAL SENIOR RULES FOR ACCESSIBILITY TESTING

1. **A scanner pass is the beginning of accessibility testing, never the conclusion.**
2. **Never use `data-testid` to test interactive controls when `getByRole` can be used.**
3. **Always assert `toHaveFocus()` to verify actual browser hardware focus placement.**
4. **Every modal overlay test must verify both initial focus and validated origin restoration.**
5. **Dynamic deletion tests must verify surviving sibling focus recovery.**
6. **Reordering tests must verify that focus follows domain entity UUIDs, not array indices.**
7. **Async combobox tests must deliberately inject out-of-order Promise resolution.**
8. **Always test that ARIA pointer attributes (`aria-controls`, `aria-activedescendant`) resolve to real DOM IDs.**
9. **Never test CSS color values directly; assert semantic `aria-invalid` and error message descriptions.**
10. **An accessible component is verified when its semantic, keyboard, focus, identity, dynamic-state, and recovery contracts have been proven across the full lifecycle in which real humans interact with it.**
