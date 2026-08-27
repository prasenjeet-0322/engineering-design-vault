/**
 * KPI 07 — Part 04: Classes, extends, super, Instance vs Static & Prototype Internals
 * Demonstrates:
 * 1. Gotcha: Temporal Dead Zone (TDZ) on 'this' Before super()
 * 2. Prediction 1: Static Method and Property Inheritance Across Dual Chains
 * 3. Prediction 2: Subclass Initialization Order and Base Constructor Field Access
 * 4. Prediction 3: super.method() Receiver Dynamic this Binding
 * 5. Prediction 4: Private Class Field Brand Checking (#privateField)
 * 6. Practical Architecture: Domain Entity Hierarchy with Static Deserializers
 */

"use strict";

console.log("=== 1. PREDICTION 1: DUAL PROTOTYPE CHAINS OF EXTENDS ===");
class BaseService {
  static getEndpoint() {
    return "https://api.cloud.io/v1";
  }
  ping() {
    return "BASE_PONG";
  }
}

class AuthService extends BaseService {
  login() {
    return "LOGGED_IN";
  }
}

const authInstance = new AuthService();

// Static chain inheritance
console.log("AuthService.getEndpoint():", AuthService.getEndpoint()); // "https://api.cloud.io/v1"
console.log("authInstance can call static method?", typeof authInstance.getEndpoint); // undefined

// Instance chain inheritance
console.log("authInstance.ping():", authInstance.ping()); // "BASE_PONG"
console.log("authInstance.login():", authInstance.login()); // "LOGGED_IN"

console.log("Static Chain Linkage:", Object.getPrototypeOf(AuthService) === BaseService); // true
console.log("Instance Chain Linkage:", Object.getPrototypeOf(AuthService.prototype) === BaseService.prototype); // true

console.log("\n=== 2. PREDICTION 2: SUBCLASS INITIALIZATION ORDER TRAP ===");
class BaseInitializer {
  constructor() {
    this.setup();
  }
  setup() {
    console.log("BaseInitializer setup, childData is:", this.childData);
  }
}

class DerivedInitializer extends BaseInitializer {
  childData = "INITIALIZED_PAYLOAD";

  setup() {
    console.log("DerivedInitializer setup, childData is:", this.childData);
  }
}

// When instantiated, childData is undefined because Derived fields run AFTER Base constructor
new DerivedInitializer(); // Logs: "DerivedInitializer setup, childData is: undefined"

console.log("\n=== 3. PREDICTION 3: super.method() WITH DYNAMIC RECEIVER THIS ===");
class Logger {
  constructor(tag) {
    this.tag = tag;
  }
  format(msg) {
    return `[${this.tag}]: ${msg}`;
  }
}

class PrefixLogger extends Logger {
  constructor(tag, prefix) {
    super(tag);
    this.prefix = prefix;
  }
  format(msg) {
    return `${this.prefix} >> ${super.format(msg)}`;
  }
}

const logger = new PrefixLogger("TELEMETRY", ">>> PRODUCTION <<<");
console.log(logger.format("High Memory Alert"));

console.log("\n=== 4. PREDICTION 4: PRIVATE FIELD BRAND CHECKING ===");
class SecureVault {
  #secretKey;
  constructor(key) {
    this.#secretKey = key;
  }
  verifyKey(otherVault) {
    return otherVault.#secretKey;
  }
}

const vaultA = new SecureVault("ALPHA_KEY_99");
const vaultB = new SecureVault("BETA_KEY_100");

console.log("vaultA reading vaultB secret (Brand check passes):", vaultA.verifyKey(vaultB)); // "BETA_KEY_100"

try {
  vaultA.verifyKey({ fake: true });
} catch (err) {
  console.log("Reading private field on plain object caught:", err.name); // TypeError
}

console.log("\n=== 5. PRACTICAL ARCHITECTURE: DOMAIN ENTITY HIERARCHY ===");

class BaseEntity {
  constructor(id, createdAt = Date.now()) {
    this.id = id;
    this.createdAt = createdAt;
  }

  getAgeMs() {
    return Date.now() - this.createdAt;
  }
}

class UserEntity extends BaseEntity {
  #authToken;

  constructor(dto, token = "TOKEN_DEFAULT") {
    super(dto.id, dto.createdAt);
    this.name = dto.name;
    this.role = dto.role;
    this.#authToken = token;
  }

  static fromDTO(dto) {
    return new UserEntity(dto);
  }

  isAdmin() {
    return this.role === "ADMIN";
  }

  toDTO() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt
    };
  }
}

const userDTO = {
  id: "usr_9981",
  name: "Sunny",
  role: "ADMIN",
  createdAt: Date.now() - 5000
};

const user = UserEntity.fromDTO(userDTO);

console.log(`User ${user.name} is admin?`, user.isAdmin()); // true
console.log(`User entity age:`, `${Math.round(user.getAgeMs() / 1000)}s`);
console.log(`Serialized DTO keys (Prototypes & #private stripped):`, Object.keys(user.toDTO()));
