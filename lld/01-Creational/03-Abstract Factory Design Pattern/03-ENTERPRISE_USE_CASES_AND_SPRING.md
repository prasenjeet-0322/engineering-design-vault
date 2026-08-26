# 🏛️ Module 03: Enterprise Use Cases & Multi-Cloud Architecture

[🏠 Back to Master Guide](./README.md) &nbsp; | &nbsp; [Previous: ⚖️ Creational Pattern Comparison](./02-ABSTRACT_FACTORY_VS_FACTORY_METHOD_VS_BUILDER.md) &nbsp; | &nbsp; [Next: 🎙️ Interview Playbook](./04-INTERVIEW_PLAYBOOK_AND_ARTICULATION.md)

---

## 🎯 Executive Overview

In enterprise software engineering, the **Abstract Factory Pattern** is the standard architectural mechanism for **Cross-Platform Portability** and **Multi-Cloud Abstraction Layers**.

This module deconstructs two primary enterprise applications:
1. **Hibernate ORM SQL Dialect Abstraction**.
2. **Multi-Cloud Infrastructure SDKs (AWS vs. GCP vs. Azure)**.
3. **Spring Dependency Injection as the Meta-Abstract Factory**.

---

## 💾 1. Hibernate ORM Database Dialect Factory

Hibernate must generate raw SQL across dozens of databases (PostgreSQL, MySQL, Oracle, SQL Server). Each database requires a specific family of SQL generators:

```mermaid
graph TD
    Client[Hibernate Engine] -->|Uses Abstract Factory| DialectFactory[DatabaseDialectFactory]

    subgraph PostgreSQL Family (PostgreSQLDialect)
        DialectFactory --> PostgresLimit[PostgresLimitHandler: LIMIT / OFFSET]
        DialectFactory --> PostgresLock[PostgresLockingStrategy: FOR UPDATE NOWAIT]
        DialectFactory --> PostgresType[PostgresTypeDescriptor: JSONB / UUID]
    end

    subgraph Oracle Family (OracleDialect)
        DialectFactory --> OracleLimit[OracleLimitHandler: ROWNUM / FETCH FIRST]
        DialectFactory --> OracleLock[OracleLockingStrategy: FOR UPDATE]
        DialectFactory --> OracleType[OracleTypeDescriptor: VARCHAR2 / CLOB]
    end
```

* **Guarantee:** When connected to PostgreSQL, Hibernate's `PostgreSQLDialectFactory` ensures that all query builders, type handlers, and locks belong strictly to the **PostgreSQL family**, preventing fatal SQL syntax crashes.

---

## ☁️ 2. Multi-Cloud Infrastructure SDK (AWS vs. GCP vs. Azure)

Enterprise multi-cloud platforms abstract cloud providers behind an **Abstract Cloud Factory**:

```java
// 1. Abstract Products
public interface ComputeInstance { void start(); }
public interface StorageBucket { void upload(byte[] data); }

// 2. Abstract Factory
public interface CloudProviderFactory {
    ComputeInstance createCompute();
    StorageBucket createStorage();
}

// 3. Concrete Family 1: AWS
public class AwsCloudFactory implements CloudProviderFactory {
    public ComputeInstance createCompute() { return new Ec2Instance(); }
    public StorageBucket createStorage() { return new S3Bucket(); }
}

// 4. Concrete Family 2: GCP
public class GcpCloudFactory implements CloudProviderFactory {
    public ComputeInstance createCompute() { return new ComputeEngineInstance(); }
    public StorageBucket createStorage() { return new GcsBucket(); }
}

// 5. Client Workflow (100% Cloud-Agnostic)
public class CloudDeployer {
    private final ComputeInstance server;
    private final StorageBucket storage;

    public CloudDeployer(CloudProviderFactory cloudFactory) {
        this.server = cloudFactory.createCompute();
        this.storage = cloudFactory.createStorage();
    }

    public void deployApp() {
        server.start();
        storage.upload("app.jar".getBytes());
    }
}
```

---

## 🔑 Key Takeaways for Interviews

1. Cite **Hibernate SQL Dialects** or **Multi-Cloud Provisioning (AWS vs GCP vs Azure)** as real-world enterprise Abstract Factory architectures.
2. Emphasize that Abstract Factory prevents **accidental cross-family mixing** (e.g. attempting to mount an AWS S3 Bucket to a GCP Compute Engine instance).
