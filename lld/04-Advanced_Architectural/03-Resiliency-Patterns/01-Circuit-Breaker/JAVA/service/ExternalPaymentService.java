package service;

/**
 * <h1>The Unreliable Service</h1>
 * 
 * <p>Simulates a 3rd party API (e.g. Stripe, PayPal) that might occasionally go down.
 */
public class ExternalPaymentService {
    
    private boolean isDown = false;

    public void simulateServerCrash() { this.isDown = true; }
    public void simulateServerRecovery() { this.isDown = false; }

    public String processPayment() throws Exception {
        if (isDown) {
            // A slow timeout simulation (this is what kills unregulated microservices!)
            Thread.sleep(2000); 
            throw new Exception("HTTP 500: Payment Gateway Timeout!");
        }
        
        return "HTTP 200: Payment Processed Successfully!";
    }
}
