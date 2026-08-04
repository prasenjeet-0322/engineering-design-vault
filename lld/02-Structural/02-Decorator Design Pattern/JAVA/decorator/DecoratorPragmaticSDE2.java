package decorator;

/**
 * <h1>03 - Decorator: The "Middleware" Pattern (SDE-2+ Level)</h1>
 * 
 * <b>Scenario:</b> You have a <code>MessageService</code>. You need to add 
 * Logging, User Authentication, and Payload Encryption dynamically.
 * 
 * <b>Senior SDE-2 Insights:</b>
 * 1. <b>Composition > Inheritance:</b> Prevents class explosion. No need for 
 *    'AuthenticatedEncryptedLoggedService' classes.
 * 2. <b>Order Matters:</b> Stacking order defines the pipeline. Auth should 
 *    happen before Logging to protect PII.
 * 3. <b>OCP Mastery:</b> Add new middleware without touching the base service.
 * 
 * <b>Edge Cases Handled:</b>
 * - <b>Recursive Wrapping:</b> Correctly delegates through multiple layers.
 * - <b>Transparency:</b> Client only sees the <code>MessageService</code> interface.
 */

interface Notifier { void send(String msg); }

class BaseNotifier implements Notifier {
    @Override public void send(String msg) { System.out.println("Base: " + msg); }
}

// --- BASE DECORATOR ---
abstract class NotifierDecorator implements Notifier {
    protected final Notifier wrappee;
    public NotifierDecorator(Notifier n) { this.wrappee = n; }
    @Override public void send(String msg) { wrappee.send(msg); }
}

// --- MIDDLEWARE LAYERS ---
class LogDecorator extends NotifierDecorator {
    public LogDecorator(Notifier n) { super(n); }
    @Override public void send(String msg) {
        // [PRODUCTION_ENHANCEMENT] (Pre-processing)
        System.out.println("[LOG]: Activity timestamped.");
        super.send(msg);
    }
}

class SecurityDecorator extends NotifierDecorator {
    public SecurityDecorator(Notifier n) { super(n); }
    @Override public void send(String msg) {
        // [PRODUCTION_ENHANCEMENT] (Validation)
        System.out.println("[AUTH]: User session valid.");
        super.send(msg);
    }
}

public class DecoratorPragmaticSDE2 {
    public static void main(String[] args) {
        // --- [INTERVIEW_MVP] (Atomic Setup) ---
        Notifier basic = new BaseNotifier();

        // --- [PRODUCTION_ENHANCEMENT] (Pipeline Construction) ---
        // Stack: Security -> Logging -> Base
        Notifier pipeline = new SecurityDecorator(new LogDecorator(basic));
        
        pipeline.send("Hello SDE-2!");
    }
}
