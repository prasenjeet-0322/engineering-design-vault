package dao;

import model.User;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * <h1>In-Memory DAO Implementation</h1>
 * 
 * <p>Handles low-level data persistence logic (CRUD). In a real app, 
 * this would contain raw SQL or JDBC code.
 */
public class InMemoryUserDAO implements IUserDAO {
    private final Map<Integer, User> users = new HashMap<>();

    @Override
    public void save(User user) {
        users.put(user.getId(), user);
        System.out.println("   [DAO] Persisted User: " + user.getName());
    }

    @Override
    public User findById(int id) {
        return users.get(id);
    }

    @Override
    public List<User> findAll() {
        return new ArrayList<>(users.values());
    }

    @Override
    public void delete(int id) {
        users.remove(id);
    }
}
