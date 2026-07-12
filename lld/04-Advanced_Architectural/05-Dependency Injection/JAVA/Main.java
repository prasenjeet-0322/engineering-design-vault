import container.ServiceContainer;
import manager.NotificationManager;
import service.EmailService;
import service.INotificationService;
import service.SMSService;

/**
 * <h1>Dependency Injection & IoC Demo</h1>
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Architecture: Dependency Injection (DI) Demo   ");
        System.out.println("==================================================\n");

        // 1. Setup the Container
        ServiceContainer container = new ServiceContainer();
        
        // 2. Register Implementations (Configurable!)
        container.register(INotificationService.class, new EmailService());
        // container.register(INotificationService.class, new SMSService());

        // 3. Resolve and Use
        INotificationService injectedService = container.resolve(INotificationService.class);
        NotificationManager manager = new NotificationManager(injectedService);

        System.out.println("--- Scenario: Sending a System Alert ---");
        manager.notifyUser("Server CPU Usage at 90%!");
        
        System.out.println("\n✅ Notice how the Manager class is 100% decoupled from the specific Service implementation.");
    }
}
