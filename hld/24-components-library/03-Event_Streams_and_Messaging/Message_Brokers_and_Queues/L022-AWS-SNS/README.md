# ⚡ L022: AWS SNS (Simple Notification Service)

## 📖 Overview
### What is this component?
**AWS SNS (Simple Notification Service)** is a fully managed, serverless publish-subscribe (Pub/Sub) messaging service provided by Amazon Web Services. Designed for high-throughput, push-based event fan-out, SNS enables event producers to broadcast a single message simultaneously to thousands of subscriber endpoints, including SQS queues, AWS Lambda functions, HTTP/HTTPS webhooks, mobile push notifications (APNS/FCM), and SMS text messages.

### Core Capabilities
* **Push-Based Event Fan-Out:** Instantly broadcasts a single published event to thousands of subscribed queues, functions, and webhooks in parallel with near-zero latency.
* **Declarative Message & Body Filtering:** Filters events on the server side using **Subscription Filter Policies** (attribute or message body rules), so endpoints only receive events matching specific criteria.
* **SNS FIFO Topics:** Combines fan-out routing with strict single-lane message ordering and exact-once delivery when paired with SQS FIFO queues.
* **Multi-Protocol Target Delivery:** Native push integration with AWS SQS, AWS Lambda, HTTP/S Webhooks, Email, SMS, and Mobile Push Notifications (iOS APNS / Android FCM).

---

## 🎯 ⚡ TRIGGER POINTS: When to Use AWS SNS

| Trigger Scenario / Architectural Problem | Why AWS SNS is the EXACT Solution | Alternatives & Why They Fail |
| :--- | :--- | :--- |
| **1. Multi-Queue Fan-Out Architecture** <br>*(1 order checkout event must trigger Shipping Queue, Billing Queue, and Fraud Audit Queue).* | Publish **ONCE to an SNS Topic**. SNS automatically fans out copies of the event into all 3 subscribed **SQS Queues**. | **Application 3x Writes:** Producer must make 3 separate network calls to SQS, risking partial failure if call #2 drops. |
| **2. Server-Side Message Filtering** <br>*(Analytics service only wants `region=US` events; Fraud service wants `amount >= $500`).* | Attach **SNS Subscription Filter Policies** so SNS drops unneeded messages at the edge before sending to SQS/Lambda. | **Application Side Filtering:** Wastes bandwidth, queue storage, and consumer CPU processing unwanted events. |
| **3. Mobile Push & Global SMS Dispatch** <br>*(Sending iOS/Android push alerts or OTP SMS globally).* | SNS directly interfaces with Apple APNS, Google FCM, and global telecom carriers for SMS text delivery. | **Custom Socket Fleets:** Requires maintaining millions of open TCP connections on expensive EC2 server fleets. |
| **4. Cross-Account Event Streaming** <br>*(Account A publishes order events to Account B's processing pipeline).* | Configure **SNS Topic Resource Policies** to grant publish/subscribe permissions securely across AWS accounts without VPC peering. | **Custom API Proxies:** High latency, requires managing API Gateway endpoints and IAM roles manually. |

---

## 📋 Tracker Metadata
| Column | Value / Status |
| :--- | :--- |
| **Category** | Event Streams & Messaging / Pub-Sub Fan-Out |
| **Type** | Serverless Push-Based Event Router |
| **Primary Use Case** | SNS+SQS event fan-out, microservice notifications, mobile push alerts |
| **Strengths** | Global scale, instant push delivery, SNS+SQS fan-out, subscription filtering |
| **Weaknesses** | Zero message storage/retention (messages lost if no subscriber queue is bound) |
| **Best For** | SNS + SQS Fan-Out architecture, serverless notifications |
| **Never Use When** | Point-to-point task queueing without SQS, long-term event log storage |
| **Max Scale** | Millions of messages/sec; 12,500,000 subscriptions per topic |
| **Consistency Model** | At-least-once (Standard); Exactly-once (FIFO SNS) |
| **CAP Choice** | **AP** (Standard SNS); **CP** (FIFO SNS) |
| **Understanding** | 🟢 Applied |
| **Internals Known** | [x] Yes / [ ] No |
| **Interview Ready** | [x] Yes / [ ] No |
| **Used In Projects** | [x] Yes / [ ] No |
| **Key Config Known** | [x] Yes / [ ] No |
| **Comparison Known** | [x] Yes / [ ] No |
| **Last Revised** | 2026-08-05 |
| **Next Review** | 2026-11-05 |
| **Mastery** | 🟢 Expert |

---

## ⚖️ Architectural Trade-offs & Deep Dive

```
                             AWS SNS FAN-OUT ARCHITECTURE

     PRODUCER                     SNS TOPIC                       SUBSCRIBERS
┌─────────────────┐         ┌───────────────────┐         ┌───────────────────────┐
│ Order API       │────────►│ Topic:            │────────►│ SQS Queue: Shipping   │
└─────────────────┘         │ order-events      │         └───────────────────────┘
                            └─────────┬─────────┘         ┌───────────────────────┐
                                      ├──────────────────►│ SQS Queue: Billing    │
                                      │                   └───────────────────────┘
                                      │ Filter:           ┌───────────────────────┐
                                      │ { "region": "US" }│ Lambda: US-Analytics  │
                                      └──────────────────►└───────────────────────┘
```

1. **No Message Persistence (Ephemeral Delivery):**
   Unlike Kafka or SQS, an SNS Topic does **NOT** store messages. If an SNS topic receives an event and no subscriber queue/endpoint is bound, the event is deleted immediately. **Always bind SQS queues to SNS topics for production durability.**
2. **Push Delivery Protocol Retries:**
   For HTTP/HTTPS webhook subscribers, SNS automatically executes an **Exponential Backoff Retry Policy** (up to 300 retries over 23 hours) if the target endpoint returns a `5xx` error or times out.

---

## ⚙️ Internal Architecture (The "Deep Dive")

### 1. Raw Message Delivery (`RawMessageDelivery`)
By default, SNS wraps published messages in a JSON envelope containing metadata (`TopicArn`, `MessageId`, `Timestamp`, `MessageAttributes`).

* **Default SNS JSON Envelope:**
  ```json
  {
    "Type" : "Notification",
    "MessageId" : "12345-abc-6789",
    "TopicArn" : "arn:aws:sns:us-east-1:123456789012:order-events",
    "Message" : "{\"orderId\": \"ORD-9981\", \"amount\": 150.00}",
    "Timestamp" : "2026-08-05T14:30:00.000Z"
  }
  ```
* **Raw Message Delivery Enabled (`RawMessageDelivery = true`):** Removes the SNS JSON wrapper when pushing to SQS queues, delivering raw JSON directly to worker processes (`{"orderId": "ORD-9981", "amount": 150.00}`).

### 2. Subscription Filter Policies (Attribute vs Body Filtering)
SNS evaluates filter policies against message attributes or message bodies before pushing events:

```json
{
  "FilterPolicyScope": "MessageAttributes",
  "FilterPolicy": "{\"event_type\": [\"ORDER_CREATED\", \"ORDER_PAID\"], \"amount\": [{\"numeric\": [\">=\", 100]}]}"
}
```

---

## 🛠️ Critical Configurations & Production Tuning

```json
{
  "TopicArn": "arn:aws:sns:us-east-1:123456789012:order-events.fifo",
  "Attributes": {
    "FifoTopic": "true",
    "ContentBasedDeduplication": "true",
    "KmsMasterKeyId": "alias/aws/sns"
  }
}
```

---

## 💥 Failure Modes, Edge Cases & Disaster Recovery

### ⚠️ 1. The Missing `RawMessageDelivery` Parsing Crash
* **The Problem:** Workers consuming from SQS expect raw JSON `{"orderId": 101}`, but receive the SNS JSON wrapper `{"Type": "Notification", "Message": "..."}`. Worker `JSON.parse` breaks or fails schema validation.
* **Fix:** Enable `RawMessageDelivery: true` on the SQS subscription, or parse `JSON.parse(record.body).Message` in application code.

### ⚠️ 2. The Un-buffered Webhook Outage
* **The Problem:** SNS pushes directly to a public HTTP Webhook endpoint (`https://api.mycompany.com/webhook`). When the server drops, SNS retries for 23 hours and then discards the events.
* **Fix:** Never subscribe HTTP endpoints directly to SNS for critical workflows. Use **SNS ➔ SQS Queue ➔ Worker API** pattern.

---

## 🥊 Direct Competitors & Alternatives
* **AWS SNS vs. AWS EventBridge:** SNS = High-throughput, low-latency Pub/Sub fanout. EventBridge = Enterprise Event Bus with complex schema matching, third-party SaaS integrations (Zendesk, Datadog), and 300+ rules.
* **AWS SNS vs. Google Cloud Pub/Sub:** SNS handles fan-out to SQS; GCP Pub/Sub combines SNS (fan-out) and SQS (queueing) in a single service.

---

## 💼 Production Experience & Lessons Learned

### 1. Real-World Use Case
* **Platform:** *Global E-Commerce Order Platform*.
* **Implementation:** Deployed AWS SNS Topics to fan out `OrderCompleted` events to 4 independent SQS queues driving inventory reservation, email dispatch, shipping generation, and analytics logging.

### 2. Lessons Learned (Gotchas)
* **Gotcha 1: Un-encrypted Topic Compliance Violation:** Deploying SNS topics without AWS KMS encryption allowed sensitive customer PII to transit unencrypted in internal AWS storage.
  * *Fix:* Enforced AWS KMS Encryption (`KmsMasterKeyId = "alias/aws/sns"`) across all production topics via Terraform.
