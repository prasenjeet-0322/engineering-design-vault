# Stage 2 — Simple Factory (The Pattern)

> **Goal:** Show the clean, production-grade solution — and prove its advantages over Stages 0 and 1.

## Run
```bash
# From the JAVA/ directory
javac -d out logger/*.java Main.java
java -cp out Main
```

## File Responsibilities

| File | Layer | Role |
|---|---|---|
| `logger/ILogger.java` | Contract | Interface all clients depend on; `getLevel()` + `timestamp()` |
| `logger/LogLevel.java` | Contract | Type-safe enum key — no string typos possible |
| `logger/LoggerFactory.java` | Factory | **One place** that knows how to create and cache loggers |
| `logger/Loggers.java` | Products | All 5 implementations (package-private — factory-only creation) |
| `Main.java` | Client | Imports only `ILogger`, `LogLevel`, `LoggerFactory` — zero concrete classes |

## How the Client Interacts (Stage 2)

```
Main.java                   LoggerFactory               Loggers.java
──────────                  ─────────────               ──────────────
import ILogger    ✅         EnumMap cache:              DebugLogger  ← package-private
import LogLevel   ✅           DEBUG → DebugLogger       InfoLogger   ← package-private
import LoggerFactory ✅        INFO  → InfoLogger        WarnLogger   ← package-private
                              WARN  → WarnLogger         ErrorLogger  ← package-private
ILogger log =                 ERROR → ErrorLogger        TraceLogger  ← package-private
  createLogger(DEBUG) ──→     TRACE → TraceLogger
                              throw if unknown ✅
```

## What Stage 2 Fixes

| Problem from Stage 0/1 | Stage 2 Solution |
|---|---|
| Switch duplicated in every service | One `EnumMap` in `LoggerFactory` |
| Private helper not shareable | `LoggerFactory` is `public` — any class can call it |
| `null` returned for unknown levels | `IllegalArgumentException` with full context |
| String typo compiles silently | `LogLevel` enum — typo is a compile error |
| New concrete class on every call | `EnumMap` cache — stateless loggers reused |
| Clients import concrete classes | Clients only see `ILogger` — zero concrete imports |
| Constructor callable by anyone | Package-private constructors in `Loggers.java` |
