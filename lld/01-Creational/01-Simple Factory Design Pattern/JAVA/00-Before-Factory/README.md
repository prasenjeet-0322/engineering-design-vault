# Stage 0 — Direct Construction (The Problem)

> **Goal:** Show WHY a factory is needed — before any pattern exists.

## Run
```bash
# From the JAVA/ directory
javac "00-Before-Factory/*.java"
java -cp "00-Before-Factory" Main
```

## What This Shows

| File | Responsibility | Problem |
|---|---|---|
| `LoggersV0.java` | All concrete logger types | Clients import these directly |
| `OrderService.java` | Business logic + logger creation | Mixed concerns + if/else creation |
| `PaymentService.java` | Business logic + logger creation | **Exact duplicate** of OrderService switch |
| `Main.java` | Runner | Shows both services with duplicated logic |

## The Core Problem
```
OrderService.java          PaymentService.java
  if DEBUG → new Debug()     if DEBUG → new Debug()  ← copy-paste
  if INFO  → new Info()      if INFO  → new Info()   ← copy-paste
  if ERROR → new Error()     if ERROR → new Error()  ← copy-paste
```
Adding `WarnLogger` = change **every** service file. Miss one → silent `null` → NPE.
