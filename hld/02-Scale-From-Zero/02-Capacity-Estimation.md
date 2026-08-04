# ⚡ 02 - Capacity Estimation

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Concept ID** | C003 |
| **Category** | Scalability Fundamentals |
| **Difficulty** | 🟡 Medium |
| **Interview Frequency** | 🔥 High |
| **Understanding** | [🔴 None / 🟡 Conceptual / 🟢 Applied] |
| **Can Explain** | [ ] Yes / [ ] No |
| **Whiteboard Drawn** | [ ] Yes / [ ] No |
| **Taught Someone** | [ ] Yes / [ ] No |
| **Next Review** | YYYY-MM-DD |
| **Mastery** | [🔴 Familiar / 🟡 Competent / 🟢 Expert] |

---

## ⚡ 1. The Core Definition & Trigger
*   **Two-Sentence Trigger:** Capacity Estimation (or Back-of-the-Envelope Calculation) is the mathematical process of estimating storage, memory, bandwidth, CPU, and database constraints based on user traffic projections. It is triggered at the absolute beginning of any high-level design project to determine whether the proposed architecture is bound by write volume, read throughput, memory caching limits, or network bandwidth.
*   **Scalability Dimension:** Primary: **Hardware Provisioning Sizing & Resource Cost Optimization**.

---

## ⚖️ 2. Trade-offs & Deep Dive

### SDE Sizing Cheat Sheet
To execute estimations quickly during an interview, memorize these standard sizing values:

#### 1. Powers of 2 & Data Sizing
*   $2^{10}$ = 1 Thousand Bytes = 1 Kilobyte (KB)
*   $2^{20}$ = 1 Million Bytes = 1 Megabyte (MB)
*   $2^{30}$ = 1 Billion Bytes = 1 Gigabyte (GB)
*   $2^{40}$ = 1 Trillion Bytes = 1 Terabyte (TB)
*   $2^{50}$ = 1 Quadrillion Bytes = 1 Petabyte (PB)

#### 2. Latency Numbers Every SDE Must Know
*   L1 cache reference: `0.5 ns`
*   Main memory reference (RAM): `100 ns`
*   Read 1 MB sequentially from memory: `250,000 ns` (0.25 ms)
*   SSD Random Read: `16,000 ns` (16 µs)
*   Read 1 MB sequentially from SSD: `1,000,000 ns` (1 ms)
*   Round-trip within same datacenter: `500,000 ns` (0.5 ms)
*   SATA Disk seek (HDD): `10,000,000 ns` (10 ms)
*   Send packet California to Netherlands: `150,000,000 ns` (150 ms)

#### 3. Quick QPS Conversion Rules (The "SDE Math Hack")
*   $1 \text{ Million requests/day} \approx 12 \text{ QPS}$
*   $10 \text{ Million requests/day} \approx 116 \text{ QPS} \approx 120 \text{ QPS}$
*   $100 \text{ Million requests/day} \approx 1,160 \text{ QPS} \approx 1,200 \text{ QPS}$
*   $1 \text{ Billion requests/day} \approx 11,600 \text{ QPS} \approx 12,000 \text{ QPS}$
*   *Conversion logic:* Divide requests by $100,000$ (rounding up $86,400$ seconds in a day to make calculations instant).

#### 4. Single Server Limits (Hardware Ceiling Reference)
*   **Web Application Server:** Handles $\approx 1,000 - 5,000 \text{ QPS}$ (depending on CPU/network operations).
*   **Key-Value Cache (Redis/Memcached):** Handles $\approx 100,000 - 250,000 \text{ QPS}$.
*   **Relational Database (PostgreSQL/MySQL):**
    *   Writes: $\approx 1,000 - 3,000 \text{ writes/sec}$ (due to B-Tree write lock contentions and WAL logs).
    *   Reads (with proper index scans): $\approx 10,000 \text{ QPS}$.
*   **Distributed Column Store (Cassandra):** Handles $\approx 10,000+ \text{ writes/sec}$ per node.

#### 5. Data Type Storage Sizing
*   `Char (ASCII)`: 1 byte
*   `Char (UTF-8)`: 1 to 4 bytes
*   `Int / Float`: 4 bytes
*   `Long (BigInt) / Double / Timestamp`: 8 bytes
*   `UUID (Standard)`: 16 bytes (raw binary) or 36 bytes (as string representations)
*   `IPv4 / IPv6 Address`: 4 bytes / 16 bytes

#### 6. System Design Rules of Thumb & Approximation Formulas
Use this cheat sheet to perform fast, accurate mental math calculations during your HLD interviews:

| Domain | Approximation Formula / Values | Practical Interview Example |
| :--- | :--- | :--- |
| **Time Constants** | <ul><li>$1\text{ Day} \approx 100,000\text{ seconds}$</li><li>$1\text{ Month} \approx 2.5 \times 10^6\text{ seconds}$</li><li>$1\text{ Year} \approx 3 \times 10^7\text{ seconds}$</li></ul> | If a system writes $10\text{M}$ items/day, divide by $100,000$ to get average write throughput. |
| **QPS & Throughput** | <ul><li>$\text{Avg QPS} = \frac{\text{Daily Requests}}{100,000}$</li><li>$\text{Peak QPS} = 2 \text{ to } 3 \times \text{Avg QPS}$</li></ul> | $12\text{M}$ requests/day $\rightarrow 12\text{M}/100,000 = 120\text{ Avg QPS} \rightarrow 240\text{ to } 360\text{ Peak QPS}$. |
| **Network Bandwidth** | <ul><li>$\text{Bandwidth (bits/s)} = \text{Throughput (Bytes/s)} \times 8$</li></ul> | $10\text{ MB/s}$ read throughput $\rightarrow 10 \times 8 = 80\text{ Mbps}$ network interface needed. |
| **Cache Sizing (80/20)** | <ul><li>$\text{RAM Cache} = \text{Daily Write Volume (GB)} \times 0.2$</li></ul> | If daily writes write $50\text{ GB}$ of new media/data, you need $10\text{ GB}$ of Redis memory capacity. |
| **Base62 URL Math** | <ul><li>$62^6 \approx 56.8 \text{ Billion unique keys}$</li><li>$62^7 \approx 3.5 \text{ Trillion unique keys}$</li><li>$62^8 \approx 218 \text{ Trillion unique keys}$</li></ul> | **Standard is 7 chars**: safely fits standard global scale demands (e.g., $10\text{M}$ URLs/day generated for over 100 years). |

---

### Step-by-Step Estimation Framework
Let's model the capacity requirements for a **Twitter-like microblogging platform**:

#### Step 1: User Traffic & QPS
*   Assume **100 Million Daily Active Users (DAU)**.
*   On average, a user posts 2 tweets per day and views their timeline 10 times per day.
*   **Total Writes per Day:** $100\text{M} \times 2 = 200\text{M}$ tweets/day.
*   **Total Reads per Day:** $100\text{M} \times 10 = 1\text{B}$ timeline views/day.
*   **Average Write QPS:**
    $$\text{Write QPS} = \frac{200,000,000 \text{ tweets}}{86,400 \text{ seconds/day}} \approx 2,300 \text{ writes/sec}$$
*   **Average Read QPS:**
    $$\text{Read QPS} = \frac{1,000,000,000 \text{ reads}}{86,400 \text{ seconds/day}} \approx 11,600 \text{ reads/sec}$$
*   **Rule of Thumb:** Design for **Peak QPS = 2 × Average QPS** (Peak Read = 23,200 QPS; Peak Write = 4,600 QPS).

#### Step 2: Storage Sizing
*   Let's assume a tweet record contains:
    *   `tweet_id`: 8 bytes
    *   `user_id`: 8 bytes
    *   `text_content`: 280 characters = 280 bytes
    *   `media_url` / metadata: 104 bytes
    *   **Total Size per Tweet:** $\approx 400\text{ bytes}$
*   **Daily Storage Requirement:**
    $$\text{Storage/day} = 200\text{M writes} \times 400\text{ bytes} = 80,000,000,000\text{ bytes} = 80\text{ GB/day}$$
*   **5-Year Storage Projection:**
    $$80\text{ GB/day} \times 365\text{ days} \times 5\text{ years} \approx 146\text{ TB}$$

#### Step 3: Cache Sizing (The Pareto Principle)
*   We follow the **80/20 rule**: 20% of hot tweets generate 80% of read traffic.
*   We want to cache the hot 20% of daily read tweets in RAM (Redis).
*   Daily read volume: $200\text{M new tweets/day} \times 400\text{ bytes} = 80\text{ GB}$ of new data generated.
*   **Memory needed to cache hot data:**
    $$\text{Cache Memory} = 20\% \times 80\text{ GB} = 16\text{ GB of RAM}$$

#### Step 4: Network Bandwidth
*   **Write Bandwidth Ingress:**
    $$2,300 \text{ writes/sec} \times 400\text{ bytes} \approx 920\text{ KB/s} \approx 7.36\text{ Mbps}$$
*   **Read Bandwidth Egress:**
    $$11,600 \text{ reads/sec} \times 400\text{ bytes} \approx 4.64\text{ MB/s} \approx 37.1\text{ Mbps}$$

### Example 2: IoT Telemetry Tracking System (Write-Heavy Scenario)
Let's model capacity requirements for a system where **500 Million IoT devices** (e.g., active GPS trackers on vehicles) send telemetry pings to a central ingestion engine.

#### Step 1: Device Traffic & QPS
*   **Total Devices:** 500 Million active devices.
*   **Reporting Frequency:** Each device sends 1 ping every 10 seconds.
*   **Average Write QPS:**
    $$\text{Write QPS} = \frac{500,000,000 \text{ devices}}{10 \text{ seconds}} = 50,000,000 \text{ writes/sec (50M QPS)}$$
*   *Design takeaway:* A single-instance relational database (max 3k writes/sec) will crash instantly. This requires a highly distributed tier (e.g., Kafka ingest pipeline with partitioning keys, writing to a Cassandra cluster with 1,000+ nodes).

#### Step 2: Storage Sizing
*   Assume each ping payload is minimal to conserve cellular data:
    *   `device_id`: 16 bytes (UUID)
    *   `timestamp`: 8 bytes (Long)
    *   `latitude`: 8 bytes (Double)
    *   `longitude`: 8 bytes (Double)
    *   `status_flags`: 10 bytes
    *   **Total Payload Size:** $50 \text{ bytes}$
*   **Daily Storage Requirement:**
    $$\text{Storage/day} = 50\text{M writes/sec} \times 86,400\text{ sec/day} \times 50\text{ bytes} \approx 216\text{ TB/day}$$
*   **1-Year Storage Projection:**
    $$216\text{ TB/day} \times 365\text{ days} \approx 78.84\text{ PB/year}$$
*   *Design takeaway:* Keeping raw historical telemetry on SSDs is cost-prohibitive. We must partition storage into **Hot Storage** (last 7 days on Cassandra/SSD) and **Cold Storage** (archived to S3/Glacier using compression like Parquet formats).

#### Step 3: Network Bandwidth
*   **Write Bandwidth Ingress:**
    $$50,000,000 \text{ writes/sec} \times 50\text{ bytes} = 2,500,000,000 \text{ bytes/sec} = 2.5\text{ GB/sec}$$
*   Convert to Bits (Ingress Bandwidth):
    $$2.5 \text{ GB/s} \times 8 \approx 20\text{ Gbps}$$
*   *Design takeaway:* This requires multiple 10GbE network interface cards (NICs) on our API gateways, fronted by an elastic network load balancer (NLB).

---

## 💥 3. Resiliency & Operations

### Operational Pitfalls & Mitigations
*   **The "Silent" Storage Crash:**
    *   *Problem:* Underestimating disk write growth. If storage capacity is hit, relational databases lock tables immediately, causing global write outages.
    *   *Mitigation:* Set automated alerts at 70% disk capacity, build automated log-clearing/archiving scripts, and decouple unstructured media files (images/videos) entirely from relational storage databases, routing them directly to S3.

---

## 🚫 4. Interview Playbook

### Common Mistakes (The "Junior" Signals)
*   Wasting 10 minutes performing complex arithmetic (e.g., dividing 200,000,000 by 86,400 exactly down to the decimal). The interviewer wants to see structural, logical estimation; round $86,400$ to $100,000$ to do fast mental math.
*   Forgetting to convert bytes to bits when calculating network bandwidth (e.g., mixing up Megabytes/sec with Megabits/sec; 1 MB/s = 8 Mbps).

### Interview Tip (The "Strong Hire" Signal)
> *"When sizing capacity, we don't design systems for average load. We design for peak traffic, using a 2x-3x buffer on average QPS to handle daily spikes. Additionally, we enforce the 80/20 rule to cache 20% of our daily read volume in high-performance memory, and compute egress network bandwidth in bits-per-second to ensure we select load balancers and network interfaces capable of handling peak throughput without queueing delays."*

---

## 💡 5. My Custom Study Notes & Whiteboard
*Use this section to document your sketches, code blocks, or personal notes.*
