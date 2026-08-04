package middleware;

/**
 * <h1>05 - Chain of Responsibility: The "Pipeline" Pattern (SDE-2+ Level)</h1>
 * 
 * <b>Scenario:</b> An API Gateway Middleware. 
 * Every request must pass through:
 * 1. <b>Auth:</b> Is the token valid?
 * 2. <b>Rate Limit:</b> Is the user spamming (10k user scale)?
 * 3. <b>Validator:</b> Is the JSON payload correct?
 * 
 * <b>Senior SDE-2 Insights:</b>
 * 1. <b>Short-Circuiting:</b> Each handler can stop the chain (Fail-Fast). 
 *    If Auth fails, Rate Limit is never checked.
 * 2. <b>Order of Operations:</b> The sequence is critical. Rate limiting should 
 *    happen <i>before</i> heavy Auth to protect the Auth DB from DDoS attacks.
 * 3. <b>Decoupling:</b> The Client only knows the 'Start' of the chain. 
 *    Handlers only know their 'Next' neighbor.
 * 
 * <b>Edge Cases Handled:</b>
 * - <b>Empty Chain:</b> Returns success by default.
 * - <b>Broken Chain:</b> Ensures the next link is null-checked.
 */

// --- BASE HANDLER ---
abstract class Handler {
    protected Handler next;
    public void setNext(Handler n) { this.next = n; }

    public abstract boolean handle(String request);

    protected boolean checkNext(String request) {
        if (next == null) return true; // End of chain
        return next.handle(request);
    }
}

// --- CONCRETE HANDLERS ---
class AuthHandler extends Handler {
    @Override
    public boolean handle(String req) {
        if (!req.contains("TOKEN_VALID")) {
            System.out.println("❌ Auth failed. Stopping chain.");
            return false;
        }
        System.out.println("✅ Auth passed.");
        return checkNext(req);
    }
}

class RateLimitHandler extends Handler {
    @Override
    public boolean handle(String req) {
        if (req.contains("SPAM")) {
            System.out.println("❌ Rate limit exceeded. Stopping chain.");
            return false;
        }
        System.out.println("✅ Rate limit OK.");
        return checkNext(req);
    }
}

/**
 * 🎓 SDE-2+ READINESS CHECK:
 * - CoR vs Decorator? CoR is usually for 'Decision Making' (Can we proceed?). 
 *   Decorator is for 'Wrapping Behavior' (Add something to the result).
 */
public class ChainPragmaticSDE2 {
    public static void main(String[] args) {
        // [INTERVIEW_MVP]: Linking the chain
        Handler auth = new AuthHandler();
        Handler limit = new RateLimitHandler();
        auth.setNext(limit);

        // [PRODUCTION_ENHANCEMENT]: Testing Short-circuit
        System.out.println("Request 1: Valid");
        auth.handle("TOKEN_VALID");

        System.out.println("\nRequest 2: Invalid Token");
        auth.handle("TOKEN_INVALID");
    }
}
