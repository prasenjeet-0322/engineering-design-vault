package middleware;

import payload.Request;

public class ValidationMiddleware extends BaseMiddleware {

    @Override
    public boolean check(Request request) {
        System.out.println("   [Validation Middleware] Validating payload data...");

        if (request.getData() == null || request.getData().isEmpty()) {
            System.out.println("      -> ❌ Validation Failed: Missing payload data.");
            return false; // Chain HALTS here
        }

        System.out.println("      -> Validation Passed.");
        return checkNext(request);
    }
}
