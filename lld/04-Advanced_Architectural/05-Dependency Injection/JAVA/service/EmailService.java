package service;

public class EmailService implements INotificationService {
    @Override
    public void send(String message) {
        System.out.println("   📧 [EmailService] Sending Email: " + message);
    }
}
