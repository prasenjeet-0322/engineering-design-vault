# 🎭 Facade — Java Implementation Guide

## 📁 Folder Structure

```
JAVA/
├── Main.java                          ← Integration Demo (Run this)
├── facade/                            ← The simple abstraction
│   └── ComputerFacade.java
└── subsystems/                        ← The complex, hidden internals
    ├── CPU.java
    ├── DiskDrive.java
    ├── GPU.java
    ├── Memory.java
    └── NetworkInterface.java
```

---

## ▶️ How to Run

Navigate to the `JAVA/` directory and compile/run the application:

```bash
cd "02-Structural/02-Facade Design Pattern/JAVA/"
javac subsystems/*.java facade/*.java Main.java
java Main
```

**Expected output:**
```
==================================================
   Facade Pattern: Hiding Subsystem Complexity    
==================================================

=== 🟢 Initiating Computer Boot Sequence ===
[CPU] Powered on.
[Memory] Initializing 32GB of RAM.
[GPU] Graphics enabled and display active.
[DiskDrive] Booting Linux OS from NVMe SSD.
[Network] Connecting to primary Wi-Fi/Ethernet...
[CPU] Executing boot instructions.
=== Boot Sequence Complete. Ready to use. ===


=== 🔴 Initiating Computer Shutdown Sequence ===
[Network] Disconnecting from network.
[DiskDrive] Parking disk readers.
[GPU] Display scaling down.
[Memory] Clearing RAM.
[CPU] Halting execution.
=== Shutdown Complete. Power off. ===
```

---

## 📖 Full Documentation
See the top-level [`README.md`](../README.md) for conceptual explanations, FAANG interview Q&A, and real-world system design usage.
