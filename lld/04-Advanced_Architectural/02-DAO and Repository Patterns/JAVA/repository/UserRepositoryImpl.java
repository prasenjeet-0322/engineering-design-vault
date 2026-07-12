package repository;

import dao.IUserDAO;
import model.User;
import java.util.List;

/**
 * <h1>The Repository</h1>
 * 
 * <p>The Repository acts as a mediator between the Domain layer 
 * and the Data Access layer. It provides a more "collection-like" 
 * interface and can coordinate multiple DAOs if needed.
 */
public class UserRepositoryImpl implements IUserRepository {
    private final IUserDAO userDAO;

    public UserRepositoryImpl(IUserDAO userDAO) {
        this.userDAO = userDAO;
    }

    @Override
    public void addUser(User user) {
        // Business logic could be here (e.g. validation)
        userDAO.save(user);
    }

    @Override
    public User getUser(int id) {
        return userDAO.findById(id);
    }

    @Override
    public List<User> getAllUsers() {
        return userDAO.findAll();
    }
}
