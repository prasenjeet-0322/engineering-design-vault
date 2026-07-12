package dao;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class TaskDAO {
    private final Map<Integer, String> tasks = new HashMap<>();

    public void save(int userId, String task) {
        tasks.put(userId, task);
        System.out.println("   [TaskDAO] Saved Task for User " + userId + ": " + task);
    }
}
