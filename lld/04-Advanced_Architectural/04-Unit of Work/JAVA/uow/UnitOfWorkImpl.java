package uow;

import dao.TaskDAO;
import model.User;
import repository.IUserRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * <h1>The Unit of Work</h1>
 * 
 * <p>Tracks all database operations within a "transactional" scope.
 */
public class UnitOfWorkImpl implements IUnitOfWork {
    private final IUserRepository userRepository;
    private final TaskDAO taskDAO;

    // Tracker lists
    private final List<User> newUsers = new ArrayList<>();
    private final Map<Integer, String> newTasks = new HashMap<>();

    public UnitOfWorkImpl(IUserRepository userRepository, TaskDAO taskDAO) {
        this.userRepository = userRepository;
        this.taskDAO = taskDAO;
    }

    @Override
    public void registerNewUser(User user) {
        newUsers.add(user);
    }

    @Override
    public void registerNewTask(int userId, String task) {
        newTasks.put(userId, task);
    }

    @Override
    public void commit() {
        System.out.println("\n[UoW] --- Starting Transaction Commit ---");
        try {
            for (User u : newUsers) {
                userRepository.addUser(u);
            }
            for (Map.Entry<Integer, String> entry : newTasks.entrySet()) {
                taskDAO.save(entry.getKey(), entry.getValue());
            }
            System.out.println("[UoW] --- Transaction Committed Successfully! ---\n");
            clear();
        } catch (Exception e) {
            System.out.println("[UoW] ❌ Commit Failed! Rolling back...");
            rollback();
        }
    }

    @Override
    public void rollback() {
        System.out.println("[UoW] --- Rolling Back Changes... ---");
        clear();
    }

    private void clear() {
        newUsers.clear();
        newTasks.clear();
    }
}
