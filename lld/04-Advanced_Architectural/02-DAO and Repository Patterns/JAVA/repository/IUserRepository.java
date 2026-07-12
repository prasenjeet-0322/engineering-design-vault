package repository;

import model.User;
import java.util.List;

public interface IUserRepository {
    void addUser(User user);
    User getUser(int id);
    List<User> getAllUsers();
}
