package uow;

import model.User;

public interface IUnitOfWork {
    void registerNewUser(User user);
    void registerNewTask(int userId, String task);
    void commit();
    void rollback();
}
