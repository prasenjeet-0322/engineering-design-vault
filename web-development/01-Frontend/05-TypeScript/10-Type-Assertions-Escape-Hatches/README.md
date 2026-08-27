# KPI 10 — Type Assertions & Escape Hatches

[⬅️ Back to Level 05 Master Hub](../README.md)

---

## 🎯 Purpose
Safely evaluate and control type assertions, const assertions, non-null assertions, and unsafe escape hatches.

---

## 🗺️ Core Scope
- Type assertions (as T) vs Type narrowing vs Type guards
- Const assertions (as const) & tuple literal inference
- Non-null assertions (!) and double assertions (as unknown as T)
- The golden rule: 'TypeScript compiler satisfied ≠ Runtime data valid'
- Auditing and eliminating any and unsafe assertions in codebases

---

## 🧠 Practical Competency
Minimize type assertions across applications and enforce safe fallback mechanisms when assertions are unavoidable.

---

## 🎓 Graduation Criteria
Refactor a legacy module containing unsafe as and ! assertions into 100% type-safe guarded code.
