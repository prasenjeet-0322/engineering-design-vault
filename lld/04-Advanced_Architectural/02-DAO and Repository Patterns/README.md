# 💾 Data Access Patterns: DAO vs Repository

## 📖 1. The Core Concept (The "Why")
As an application grows, the logic for **fetching data from a database** (SQL, NoSQL, APIs) starts to clutter the business logic. We need to separate *how* we get data from *what* we do with it.

### ⚠️ The Problem: Data Leakage
If your Service layer contains raw SQL queries or JDBC calls, you are locked into that specific database. If you switch from MySQL to MongoDB, you have to rewrite your entire project.

### ✅ The Solution: Two Layers of Abstraction

#### 1. DAO (Data Access Object)
*   **Layer:** Infrastructure.
*   **Purpose:** 1-to-1 mapping with a database table.
*   **Content:** Contains raw SQL, JDBC, or ORM (Hibernate) logic.
*   **Example:** `UserDAO.save(user)` handles `INSERT INTO users...`.

#### 2. Repository
*   **Layer:** Domain.
*   **Purpose:** Provides a "collection-like" interface for business objects.
*   **Content:** Coordinates multiple DAOs, handles caching, and applies business rules.
*   **Example:** `UserRepository.findAdmins()` might use `UserDAO` to query users and `RoleDAO` to filter by roles.

---

## 💻 2. SDE-2+ Enterprise Java Implementation

In modern Spring Boot applications, the `JPARepository` interface handles the DAO layer automatically, allowing you to focus on the Repository pattern for complex domain queries.

### 🏗️ Why it matters for Scaling 
By abstracting data access, you can easily implement **Unit Testing**. You can swap out the `MySQLUserDAO` for an `InMemoryUserDAO` during tests, allowing your tests to run in milliseconds without a real database!

## ▶️ Execution
To run the Java implementation, go into the `JAVA` folder and see the specific `README.md`.
