package middleware;

import payload.Request;

public class AuthMiddleware extends BaseMiddleware {

    @Override
    public boolean check(Request request) {
        System.out.println("   [Auth Middleware] Verifying credentials for: " + request.getUserEmail());

        // Hardcoded dummy check
        if (!request.getPassword().equals("admin123")) {
            System.out.println("      -> ❌ Authentication Failed: Invalid password.");
            return false; // Chain HALTS here.
        }

        System.out.println("      -> Authentication Passed.");
        return checkNext(request); // Continue to the next link
    }
}
