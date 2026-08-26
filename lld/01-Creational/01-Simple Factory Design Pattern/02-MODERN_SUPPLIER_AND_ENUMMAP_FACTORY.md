# 🛡️ Module 02: Modern Supplier Lambdas & High-Performance EnumMap Factory

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: ⚡ Anatomy & OCP Violation](./01-ANATOMY_AND_OCP_VIOLATION.md) &nbsp; | &nbsp; [Next: ⚖️ When to Use vs. Upgrade](./03-WHEN_TO_USE_VS_WHEN_TO_UPGRADE.md)

---

## 🎯 Executive Overview

In production-grade enterprise Java, naive `if/else` chains and bulky `switch` statements inside a Simple Factory are considered a code smell. 

Senior engineers evolve the Simple Factory idiom into a **High-Performance Supplier Registry** using:
1. **`EnumMap<K, Supplier<V>>`**: Extremely fast $O(1)$ array-indexed lookups with zero hashing overhead.
2. **Java 8+ Constructor References (`Class::new`)**: Deferring object creation until the supplier is explicitly called.
3. **Dynamic Extension Hooks**: Allowing new products to register dynamically without modifying core factory code.

---

## ⚡ 1. The `EnumMap` + `Supplier` Architecture

An `EnumMap` in Java is internally backed by a **flat primitive array (`Object[]`) indexed directly by the Enum's ordinal value (`enum.ordinal()`)**. It delivers unmatched performance compared to `HashMap` or `switch-case` string comparisons:

```java
import java.util.EnumMap;
import java.util.Map;
import java.util.function.Supplier;

public class HighPerformanceLoggerFactory {

    // 🚀 Backed by a flat array under the hood: O(1) array index lookup!
    private static final Map<LogLevel, Supplier<ILogger>> registry = new EnumMap<>(LogLevel.class);

    static {
        // Register constructor references lazily
        registry.put(LogLevel.DEBUG, DebugLogger::new);
        registry.put(LogLevel.INFO, InfoLogger::new);
        registry.put(LogLevel.ERROR, ErrorLogger::new);
    }

    public static ILogger getLogger(LogLevel level) {
        Supplier<ILogger> supplier = registry.get(level);
        if (supplier == null) {
            throw new IllegalArgumentException("Unsupported log level: " + level);
        }
        return supplier.get(); // Instantiates only when requested
    }

    // 🟢 Extensibility hook: register new custom loggers at runtime!
    public static void registerLogger(LogLevel level, Supplier<ILogger> supplier) {
        registry.put(level, supplier);
    }
}
```

---

## 📊 2. Performance & Memory Comparison

```mermaid
graph TD
    A[Inbound LogLevel.DEBUG] --> B{Lookup Mechanism}
    B -->|Naive If/Else| C[Sequential String Equals Checks: O\(N\) Branching]
    B -->|HashMap| D[Hashcode Calculation + Bucket Traversal: O\(1\) with Hash Overhead]
    B -->|EnumMap Supplier| E[Direct Array Index Access: array\[ordinal\] -> O\(1\) Instant]
```

| Mechanism | Lookup Complexity | CPU Branch Misprediction | Dynamic Registration Support |
|---|:---:|:---:|:---:|
| **Naive `if/else` String** | $O(N)$ string comparisons | 🔴 High | ❌ No (Hardcoded) |
| **Standard `switch(enum)`** | $O(1)$ jump table | 🟡 Low | ❌ No (Hardcoded) |
| **`HashMap<String, Supplier>`** | $O(1)$ bucket lookup | 🟢 Minimal | ✅ Yes (`registry.put()`) |
| **`EnumMap<Enum, Supplier>`** | **$O(1)$ direct array index** | 🟢 **Zero (Pure Array Index)** | ✅ **Yes (High Performance)** |

---

## 🔑 Key Takeaways for Interviews

1. Present the **`EnumMap<Type, Supplier<Product>>`** implementation when asked to code a production-ready Simple Factory in Java.
2. Explain that `EnumMap` uses a **flat array indexed by `ordinal()`**, making lookups faster and more memory-efficient than standard `HashMap`.
3. Highlight that using **`Supplier<T>` constructor references (`Product::new`)** enables lazy instantiation and allows runtime dynamic extensions.
