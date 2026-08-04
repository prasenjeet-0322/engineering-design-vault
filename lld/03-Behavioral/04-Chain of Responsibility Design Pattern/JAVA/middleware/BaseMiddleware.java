package middleware;

import payload.Request;

/**
 * <h1>The Abstract Handler</h1>
 * 
 * <p>Implements the chaining mechanics so concrete classes don't have to rewrite it.
 */
public abstract class BaseMiddleware {
    
    private BaseMiddleware next;

    /**
     * Builds the chain. Returns the NEXT element, allowing for fluent building:
     * middleware.setNext(a).setNext(b).setNext(c);
     */
    public BaseMiddleware setNext(BaseMiddleware next) {
        this.next = next;
        return next;
    }

    /**
     * Subclasses will implement this.
     * They MUST call checkNext() to continue the chain.
     */
    public abstract boolean check(Request request);

    /**
     * Triggers the next link in the chain, or returns true if we reached the end.
     */
    protected boolean checkNext(Request request) {
        if (next == null) {
            return true; // Reached the end of the chain, all checks passed!
        }
        return next.check(request);
    }
}
