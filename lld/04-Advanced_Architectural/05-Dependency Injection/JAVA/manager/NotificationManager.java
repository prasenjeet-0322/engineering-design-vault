package manager;

import service.INotificationService;

/**
 * <h1>The Service Consumer</h1>
 * 
 * <p>The NotificationManager DOES NOT create its own dependencies. 
 * Instead, they are injected into it via the constructor.
 */
public class NotificationManager {
    private final INotificationService service;

    // Dependency Injected Here
    public NotificationManager(INotificationService service) {
        this.service = service;
    }

    public void notifyUser(String message) {
        service.send(message);
    }
}
