# 🎯 LLD Practice Questions (Classified by Difficulty)

To master Low-Level Design and Machine Coding, practice these problems in order.

---

## 🟢 LEVEL 1: Easy (Focus on Basic OOP & State)
*Target: SDE-1 / Junior SDE-2*

1.  **Design a Parking Lot**: Focus on Entities (Vehicle, Spot), Enums (VehicleType), and basic assignment logic.
2.  **Design a Vending Machine**: Focus on the **State Design Pattern** (Ready, CoinInserted, Dispensing).
3.  **Design an Elevator System**: Focus on basic scheduling algorithms and state transitions.
4.  **Design an LRU Cache (Single Threaded)**: Focus on HashMaps and Doubly Linked Lists.

---

## 🟡 LEVEL 2: Medium (Focus on Patterns & Rule Engines)
*Target: SDE-2 / Senior SDE-2*

1.  **Design Tic-Tac-Toe / Snake & Ladder**: Focus on the **Strategy Pattern** for winning rules and Game Loop logic.
2.  **Design Splitwise**: Focus on balancing algorithms, user graphs, and exact/percentage/equal split **Strategies**.
3.  **Design an ATM**: Focus on the **Chain of Responsibility Pattern** for dispensing different denominations of cash.
4.  **Design BookMyShow (Ticket Booking)**: Focus on handling concurrent seat booking (optimistic locking vs DB locks).
5.  **Design a Logging Framework**: Focus on the **Chain of Responsibility** (Info -> Debug -> Error) and **Observer Pattern** for log appenders.

---

## 🟠 LEVEL 3: Hard (Focus on Concurrency & Data Structures)
*Target: SDE-3 / Architect*

1.  **Design a Thread-Safe LRU/LFU Cache**: Focus on Double-Checked Locking, `ReadWriteLock`, and avoiding Cache Stampedes.
2.  **Design an In-Memory Message Queue (Kafka Lite)**: Focus on Consumer Groups, offset tracking, and Pub/Sub multithreading.
3.  **Design a Distributed Task Scheduler**: Focus on Cron parsing, Leader Election for worker nodes, and execution retries.
4.  **Design a Rate Limiter**: Focus on the Token Bucket / Sliding Window algorithms using `ConcurrentHashMap` and thread-safe atomic counters.
5.  **Design a Rule Engine**: Focus on AST parsing, composable criteria using the **Composite Pattern**, and dynamic rule execution.

---

## 💡 How to Practice
1.  **Pick a Problem**: Give yourself 90 minutes.
2.  **Use the [LLD Delivery Framework](./000-LLD_DELIVERY_FRAMEWORK.md)**: Don't skip the Interface definition phase.
3.  **Identify the Core Pattern**: Is it a State problem? A Strategy problem? An Observer problem?
4.  **Add Concurrency**: Ask yourself, "What breaks if two users click 'Book' at the exact same millisecond?"
