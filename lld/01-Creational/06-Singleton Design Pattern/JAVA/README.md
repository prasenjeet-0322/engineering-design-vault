# 🔒 Singleton — Java Implementation Guide

## 📁 Folder Structure

```
JAVA/
├── Main.java                          ← Multi-threaded test runner (run this)
└── evolution/
    ├── Stage1NaiveLazy.java           ← ❌ Thread-unsafe (race condition)
    ├── Stage1bSynchronizedMethod.java ← ❌ Thread-safe but slow (bottleneck)
    ├── Stage2DoubleChecked.java       ← ✅ Correct (volatile + synchronized)
    ├── Stage3BillPugh.java            ← ⭐⭐⭐ Clean & lock-free (recommended)
    └── Stage4EnumSingleton.java       ← ⭐⭐⭐⭐⭐ Unhackable (Joshua Bloch's way)
```

---

## ▶️ How to Run

```bash
cd JAVA/
javac -cp . evolution/*.java Main.java
java Main
```

**Expected output:**
```
[Stage 1a] ❌ Stage1NaiveLazy initialized!   ← may appear MULTIPLE times under load
[Stage 1b] ✅ Stage1bSynchronizedMethod initialized safely.
[Stage 2]  ✅ Stage2DoubleChecked initialized safely and performantly.
[Stage 3]  ✅ Stage3BillPugh initialized using JVM classloader guarantees.
[Stage 4]  ✅ Stage4EnumSingleton initialized. Unhackable via reflection/serialization.
```

---

## 🔑 The 4 Stages — Quick Reference

| Stage | Thread Safe? | Performant? | Hackable? | Use In Production? |
|---|---|---|---|---|
| 1a — Naive Lazy | ❌ No | ✅ Yes | ✅ Yes | ❌ Never |
| 1b — Synchronized Method | ✅ Yes | ❌ No (bottleneck) | ✅ Yes | ❌ Avoid |
| 2 — Double-Checked Locking | ✅ Yes (needs `volatile`!) | ✅ Yes | ✅ Yes (reflection) | ⚠️ Only if Bill Pugh unavailable |
| 3 — Bill Pugh | ✅ Yes | ✅ Yes | ✅ Yes (reflection) | ✅ Recommended for classes |
| 4 — Enum Singleton | ✅ Yes | ✅ Yes | ❌ No | ✅ Best overall |

---

## 🧠 The One Interview Fact You Must Know

> **Stage 2 without `volatile` is broken.** The Java Memory Model allows instruction reordering. Without `volatile`, Thread B can see a non-null `instance` reference before the constructor has finished executing — reading a partially-constructed object.

```java
// ❌ WRONG — missing volatile
private static Stage2DoubleChecked instance;

// ✅ CORRECT
private static volatile Stage2DoubleChecked instance;
```

---

## 📖 Full Documentation
See the top-level [`README.md`](../README.md) for:
- Formal definitions
- The anti-pattern debate (Singleton vs DI)
- Reflection & serialization attacks
- FAANG Q&A
- Python, TypeScript, Go cross-language comparisons
