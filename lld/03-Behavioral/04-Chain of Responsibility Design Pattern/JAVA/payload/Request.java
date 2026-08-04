package payload;

/**
 * <h1>The Payload</h1>
 * 
 * <p>Represents the data being passed through the Chain of Responsibility.
 */
public class Request {
    private final String userEmail;
    private final String password;
    private final String data;

    public Request(String userEmail, String password, String data) {
        this.userEmail = userEmail;
        this.password = password;
        this.data = data;
    }

    public String getUserEmail() { return userEmail; }
    public String getPassword() { return password; }
    public String getData() { return data; }
}
