import dao.InMemoryUserDAO;
import dao.TaskDAO;
import model.User;
import repository.UserRepositoryImpl;
import uow.IUnitOfWork;
import uow.UnitOfWorkImpl;

/**
 * <h1>Unit Of Work Pattern Demo</h1>
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Data Access: Unit Of Work Demo                 ");
        System.out.println("==================================================\n");

        UserRepositoryImpl userRepository = new UserRepositoryImpl(new InMemoryUserDAO());
        TaskDAO taskDAO = new TaskDAO();
        IUnitOfWork uow = new UnitOfWorkImpl(userRepository, taskDAO);

        System.out.println("Scenario: Adding a user and their initial task in one transaction.");
        User newUser = new User(101, "Charlie", "charlie@dev.com");
        
        uow.registerNewUser(newUser);
        uow.registerNewTask(101, "Setup Workstation");

        // Nothing happens in the DB until commit() is called!
        uow.commit();
        
        System.out.println("Scenario: Verifying retrieval...");
        System.out.println("Fetched from Repo: " + userRepository.getUser(101));
    }
}
