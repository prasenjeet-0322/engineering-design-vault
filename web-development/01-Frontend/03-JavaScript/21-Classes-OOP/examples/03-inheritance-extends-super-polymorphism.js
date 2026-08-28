/**
 * KPI 21 — Part 03: Inheritance, `extends`, `super`, Method Overriding & Polymorphism
 * Demonstrates:
 * 1. Gotcha: Accessing `this` before `super()` in Derived Constructors (TDZ)
 * 2. Gotcha: Method Overriding & `super.method()` Prototype Delegation
 * 3. Prediction 1: Dual Prototype Chain & Static Inheritance
 * 4. Prediction 2: `instanceof` Prototype Traversal
 * 5. Practical Architecture: Standalone Polymorphic Notification Engine
 */

"use strict";

console.log("=== 1. GOTCHA: DERIVED CONSTRUCTOR TDZ ACCESS VIOLATION ===");

class BaseEntity {
  constructor(id) {
    this.id = id;
  }
}

class DerivedEntity extends BaseEntity {
  constructor(id, role) {
    try {
      // 💥 Attempting to access this before super():
      this.role = role;
    } catch (err) {
      console.log("  ✅ Accessing `this` before `super()` threw:", err.name); // ReferenceError
    }
    super(id);
    this.role = role; // 🟢 Safe after super()
  }
}

const entity = new DerivedEntity(101, "ADMIN");
console.log("  Initialized Entity:", entity);

console.log("\n=== 2. GOTCHA: METHOD OVERRIDING & SUPER.METHOD() DELEGATION ===");

class UserAccount {
  constructor(name) {
    this.name = name;
  }

  getPermissions() {
    return ["READ_CONTENT"];
  }
}

class AdminAccount extends UserAccount {
  constructor(name) {
    super(name);
  }

  // 🟢 Method Overriding with super.method() extension
  getPermissions() {
    return [...super.getPermissions(), "WRITE_CONTENT", "DELETE_USER"];
  }
}

const regularUser = new UserAccount("Sunny");
const superAdmin = new AdminAccount("Alice");

console.log("  Regular User Permissions:", regularUser.getPermissions());
console.log("  Admin User Permissions (Overridden + Extended):", superAdmin.getPermissions());

console.log("\n=== 3. PREDICTION: DUAL PROTOTYPE CHAIN & STATIC INHERITANCE ===");

class SuperClass {
  static category = "ENTERPRISE_SYSTEM";
}

class SubClass extends SuperClass {}

console.log("  Static Property Inherited on SubClass:", SubClass.category); // ENTERPRISE_SYSTEM
console.log("  Is SubClass.__proto__ === SuperClass?:", Object.getPrototypeOf(SubClass) === SuperClass); // true

console.log("\n=== 4. PREDICTION: INSTANCEOF PROTOTYPE CHAIN TRAVERSAL ===");

console.log("  superAdmin instanceof AdminAccount:", superAdmin instanceof AdminAccount); // true
console.log("  superAdmin instanceof UserAccount:", superAdmin instanceof UserAccount);   // true
console.log("  superAdmin instanceof Object:", superAdmin instanceof Object);             // true
console.log("  superAdmin instanceof Array:", superAdmin instanceof Array);               // false

console.log("\n=== 5. PRACTICAL ARCHITECTURE: STANDALONE POLYMORPHIC NOTIFICATION ENGINE ===");

class BaseNotification {
  constructor(recipient, message) {
    this.recipient = recipient;
    this.message = message;
  }

  send() {
    throw new Error("send() must be implemented by concrete subclass");
  }
}

class EmailNotification extends BaseNotification {
  constructor(recipient, message, subject = "System Notification") {
    super(recipient, message);
    this.subject = subject;
  }

  send() {
    return `📧 [Email]: To: ${this.recipient} | Subject: "${this.subject}" | Body: ${this.message}`;
  }
}

class SMSNotification extends BaseNotification {
  send() {
    return `📱 [SMS]: To: ${this.recipient} | Text: ${this.message}`;
  }
}

class PushNotification extends BaseNotification {
  send() {
    return `🔔 [Push]: To: ${this.recipient} | Alert: ${this.message}`;
  }
}

// 🟢 Polymorphic Dispatch
const notificationQueue = [
  new EmailNotification("sunny@vault.com", "Your report is ready", "Weekly Analytics"),
  new SMSNotification("+1-555-0199", "Code: 492019"),
  new PushNotification("device_token_xyz", "New server deployment successful")
];

console.log("  ▶️ Executing Polymorphic Dispatch:");
notificationQueue.forEach((notification) => {
  console.log("   ", notification.send());
});

console.log("\n  🎉 [Inheritance, extends, super & Polymorphism Verification Completed Successfully!]");
