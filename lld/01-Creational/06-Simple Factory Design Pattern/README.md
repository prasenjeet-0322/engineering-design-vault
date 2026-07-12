# 📎 Simple Factory — In the Wild (Case Studies)

This file shows how the Simple Factory pattern appears **inside larger system designs** — and most importantly, when it should be **upgraded to Factory Method**.

---

## Case Study 1: When Simple Factory Is Enough
*(Already implemented — see existing Logger Simple Factory demo)*

If you have:
- A small, stable set of products (3-5, unlikely to grow)
- All products initialized the same way
- One team/one file owns the creation logic

→ **Simple Factory is the right tool.** Don't over-engineer.

---

## Case Study 2: The Breaking Point — When to Upgrade
**Trigger:** Team A needs `FileLogger`, Team B needs `CloudLogger`, Team C needs `DatabaseLogger` — all at the same time. All must modify `LoggerFactory.java`. Merge conflicts every sprint.

**The upgrade path:**
```
Simple Factory (one class, switch/if-else)
        ↓ OCP starts hurting
Factory Method (interface + concrete creators per product)
        ↓ product families needed
Abstract Factory (suite of related factories)
```

**The senior rule:**
> Start Simple. Stay Simple as long as the switch statement doesn't grow. The moment adding a new `case` requires modifying a shared class that multiple teams own — refactor to Factory Method.

---

## Case Study 3: EnumMap Factory (Production-Grade Simple Factory)
*(Already implemented in this module)*

Using `EnumMap<LoggerType, Supplier<ILogger>>` instead of `if/else`:
- O(1) lookup
- Extensible without touching the lookup logic
- Still a Simple Factory — just a faster one

---

## 📚 See Also
- [Individual Pattern README (JAVA)](../JAVA/README.md)
- [Full Combined Patterns Index](../../07-Combined-Patterns/README.md)
