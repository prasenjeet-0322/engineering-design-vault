import middleware.AuthMiddleware;
import middleware.BaseMiddleware;
import middleware.RateLimitMiddleware;
import middleware.ValidationMiddleware;
import payload.Request;

/**
 * <h1>Chain of Responsibility Demonstration</h1>
 * 
 * <p>Demonstrates building a linear pipeline. The Controller only executes 
 * if EVERY link in the chain successfully calls `checkNext()`.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Chain of Responsibility: API Middleware Config ");
        System.out.println("==================================================\n");

        // 1. Build the Chain
        BaseMiddleware auth = new AuthMiddleware();
        BaseMiddleware rateLimit = new RateLimitMiddleware(2); // Max 2 requests
        BaseMiddleware validation = new ValidationMiddleware();

        // auth -> rateLimit -> validation
        auth.setNext(rateLimit).setNext(validation);

        // 2. Simulate API Requests (The Invoker)
        System.out.println("--- Scenario 1: Perfect Request ---");
        Request req1 = new Request("alice@example.com", "admin123", "{ 'item': 'laptop' }");
        executePipeline(auth, req1);

        System.out.println("\n--- Scenario 2: Bad Password (Halted at Auth) ---");
        Request req2 = new Request("bob@example.com", "wrongPass", "{ 'item': 'phone' }");
        executePipeline(auth, req2);

        System.out.println("\n--- Scenario 3: Bad Payload (Halted at Validation) ---");
        Request req3 = new Request("carl@example.com", "admin123", "");
        executePipeline(auth, req3);

        System.out.println("\n--- Scenario 4: Rate Limit Exceeded (Halted at RateLimit) ---");
        Request req4 = new Request("alice@example.com", "admin123", "{ 'item': 'mouse' }");
        executePipeline(auth, req4); // Request 2: OK
        
        Request req5 = new Request("alice@example.com", "admin123", "{ 'item': 'monitor' }");
        executePipeline(auth, req5); // Request 3: BLOCKED
    }

    private static void executePipeline(BaseMiddleware middlewareChain, Request request) {
        boolean success = middlewareChain.check(request);
        if (success) {
            System.out.println("   ✅ ALL CHECKS PASSED. Reached Controller. Processing data: " + request.getData());
        } else {
            System.out.println("   ❌ PIPELINE ABORTED. Controller never reached.");
        }
    }
}
