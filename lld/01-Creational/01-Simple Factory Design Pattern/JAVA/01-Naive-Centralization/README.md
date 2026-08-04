# Stage 1 — Naive Centralization (First Attempt)

> **Goal:** Show the first "fix" someone tries — and why it's still not enough.

## Run
```bash
# From the JAVA/ directory
javac "01-Naive-Centralization/Main.java"
java -cp "01-Naive-Centralization" Main
```

## What This Shows

| Aspect | Status |
|---|---|
| Creation logic in one place (within this file) | ✅ Better |
| Other classes can reuse `getLogger()` | ❌ Still broken — it's `private` |
| Safe failure for unknown levels | ❌ Still broken — returns `null` |
| Compile-time safe key (no typos) | ❌ Still broken — uses raw `String` |
| Decoupled from concrete classes | ❌ Still imports `DebugLoggerV1`, `InfoLoggerV1` |

## The Key Realization
> Moving the `switch` to a private helper within the **same class** doesn't solve the reuse problem.
> The creation logic must move to a **separate, dedicated class**.
> → That dedicated class is `LoggerFactory` (Stage 2).
