package middleware;

import payload.Request;
import java.util.HashMap;
import java.util.Map;

public class RateLimitMiddleware extends BaseMiddleware {

    private final int requestLimit;
    private final Map<String, Integer> requestCounts = new HashMap<>();

    public RateLimitMiddleware(int requestLimit) {
        this.requestLimit = requestLimit;
    }

    @Override
    public boolean check(Request request) {
        System.out.println("   [Rate Limit Middleware] Checking quota...");
        
        String email = request.getUserEmail();
        int count = requestCounts.getOrDefault(email, 0) + 1;
        requestCounts.put(email, count);

        if (count > requestLimit) {
            System.out.println("      -> ❌ Rate Limit Exceeded: " + email + " made " + count + " requests.");
            return false; // Chain HALTS here.
        }

        System.out.println("      -> Quota OK (" + count + "/" + requestLimit + ").");
        return checkNext(request);
    }
}
