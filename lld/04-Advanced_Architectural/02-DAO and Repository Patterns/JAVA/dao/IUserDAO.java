package dao;

import model.User;
import java.util.List;

public interface IUserDAO {
    void save(User user);
    User findById(int id);
    List<User> findAll();
    void delete(int id);
}
