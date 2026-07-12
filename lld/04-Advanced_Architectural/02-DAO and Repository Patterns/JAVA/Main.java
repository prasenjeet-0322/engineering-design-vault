import dao.InMemoryUserDAO;
import model.User;
import repository.IUserRepository;
import repository.UserRepositoryImpl;

/**
 * <h1>DAO vs Repository Pattern Demo</h1>
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Data Access: DAO vs Repository Demo            ");
        System.out.println("==================================================\n");

        // The Application Layer only talks to the Repository!
        IUserRepository userRepository = new UserRepositoryImpl(new InMemoryUserDAO());

        System.out.println("--- Scenario 1: Adding Users via Repository ---");
        userRepository.addUser(new User(1, "Alice", "alice@example.com"));
        userRepository.addUser(new User(2, "Bob", "bob@example.com"));

        System.out.println("\n--- Scenario 2: Fetching Users ---");
        for (User u : userRepository.getAllUsers()) {
            System.out.println("Fetched: " + u);
        }
    }
}
