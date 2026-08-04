package state;

/**
 * <h1>Simple POJO for Demo purposes</h1>
 */
public class User {
    private final String name;
    private final boolean isAdmin;

    public User(String name, boolean isAdmin) {
        this.name = name;
        this.isAdmin = isAdmin;
    }

    public String getName() { return name; }
    public boolean isAdmin() { return isAdmin; }
}
