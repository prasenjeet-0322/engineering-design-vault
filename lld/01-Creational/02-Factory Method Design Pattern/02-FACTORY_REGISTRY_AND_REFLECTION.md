# 🛡️ Module 02: Factory Registry, Suppliers & Reflection

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: ⚡ Parallel Hierarchies](./01-PARALLEL_HIERARCHIES_AND_DIP.md) &nbsp; | &nbsp; [Next: ⚖️ Factory Family Comparison](./03-FACTORY_METHOD_VS_SIMPLE_FACTORY_VS_ABSTRACT_FACTORY.md)

---

## 🎯 Executive Overview

While the classic Gang of Four (GoF) Factory Method pattern satisfies the Open/Closed Principle (OCP), it introduces a major software engineering drawback: **Class Explosion**. 

For every new Product class you create, you are forced to create a corresponding `ConcreteFactory` subclass. If you have 50 loggers, you end up with 100 classes in your repository.

This module details how modern senior engineers eliminate class explosion using:
1. **The Factory Registry Pattern (`Map<String, Supplier<Product>>`)** with Java 8+ lambdas.
2. **Dynamic Plugin Discovery via Java `ServiceLoader` (SPI)**.
3. **Reflection-based dynamic instantiation**.

---

## 💥 1. The Class Explosion Problem

```
Classical GoF Factory Method:
┌─────────────────────┐       ┌─────────────────────────┐
│     Product         │       │        Creator          │
├─────────────────────┤       ├─────────────────────────┤
│ ILogger             │       │ LoggerFactory           │
│ ├── FileLogger      │ ◄───► │ ├── FileLoggerFactory   │
│ ├── CloudLogger     │ ◄───► │ ├── CloudLoggerFactory  │
│ ├── DatabaseLogger  │ ◄───► │ ├── DatabaseLoggerFactory│
│ ├── KafkaLogger     │ ◄───► │ ├── KafkaLoggerFactory  │
│ └── ConsoleLogger   │ ◄───► │ └── ConsoleLoggerFactory│
└─────────────────────┘       └─────────────────────────┘
  5 Products = 10 Classes! 
```

---

## 🚀 2. The Modern Fix: Parameterized Registry (`Supplier<T>`)

Using Java 8+ `java.util.function.Supplier` or constructor references (`FileLogger::new`), we can maintain a single thread-safe registry that is **100% OCP compliant** without creating a single factory subclass:

```java
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

public class DynamicLoggerFactory {
    // Thread-safe registry mapping product identifiers to constructor suppliers
    private static final Map<String, Supplier<ILogger>> registry = new ConcurrentHashMap<>();

    // Static initializer or plugin registration hook
    static {
        register("FILE", FileLogger::new);
        register("CONSOLE", ConsoleLogger::new);
        register("CLOUD", CloudWatchLogger::new);
    }

    // 🟢 OCP Extension Point: New plugins register dynamically at runtime!
    public static void register(String type, Supplier<ILogger> supplier) {
        registry.put(type.toUpperCase(), supplier);
    }

    public static ILogger getLogger(String type) {
        Supplier<ILogger> supplier = registry.get(type.toUpperCase());
        if (supplier == null) {
            throw new IllegalArgumentException("Unknown logger type: " + type);
        }
        return supplier.get(); // Instantiates product dynamically
    }
}
```

### Why this is the Preferred Senior Approach:
1. **Zero Class Explosion:** 50 products require only 50 product classes, not 100 classes.
2. **OCP Compliant:** Adding a new `KafkaLogger` simply invokes `DynamicLoggerFactory.register("KAFKA", KafkaLogger::new)` at plugin startup without modifying the factory source code.
3. **Lazy Execution:** Constructors are only executed when `supplier.get()` is invoked.

---

## 🔌 3. Java `ServiceLoader` SPI (True Plugin Architecture)

In enterprise frameworks (like JDBC drivers or SLF4J logger bindings), the factory uses Java's built-in **Service Provider Interface (SPI)** to discover products on the classpath automatically:

```java
import java.util.ServiceLoader;

public class ServiceLoaderLoggerFactory {
    public static ILogger loadLogger() {
        ServiceLoader<ILogger> loader = ServiceLoader.load(ILogger.class);
        for (ILogger logger : loader) {
            return logger; // Returns the first discovered implementation on classpath!
        }
        throw new IllegalStateException("No ILogger implementation found in META-INF/services!");
    }
}
```

* How JDBC works: `DriverManager.getConnection()` uses `ServiceLoader` to discover `org.postgresql.Driver` or `com.mysql.cj.jdbc.Driver` on the classpath without hardcoded references.

---

## 📊 Summary: Factory Implementation Strategies

| Strategy | OCP Compliant? | Boilerplate Classes | Performance | Recommended For |
|---|:---:|:---:|:---:|---|
| **Simple Factory (Switch)** | ❌ No (Modifies switch) | 🟢 Lowest (1 class) | 🟢 Ultra Fast | Fixed, small sets (2-3 types) |
| **GoF Factory Method** | ✅ Yes (Add creator) | 🔴 High (2N classes) | 🟢 Ultra Fast | Polymorphic framework templates |
| **Supplier Registry (`Map`)** | ✅ Yes (Dynamic register) | 🟢 Lowest (1 class) | 🟢 Fast (Lambda pointer) | ⭐ **Modern Enterprise Java** |
| **Java `ServiceLoader` (SPI)** | ✅ Yes (Classpath JARs) | 🟢 Lowest (Config file) | 🟡 Moderate (Disk/Classpath scan) | Extensible third-party plugins |

---

## 🔑 Key Takeaways for Interviews

1. Highlight the **Class Explosion drawback** of the classical GoF Factory Method pattern.
2. Demonstrate how modern Java replaces multiple creator subclasses with a **`Map<String, Supplier<Product>>` Registry**.
3. Cite **JDBC `DriverManager`** and **Java `ServiceLoader`** as real-world examples of dynamic plugin factory discovery.
