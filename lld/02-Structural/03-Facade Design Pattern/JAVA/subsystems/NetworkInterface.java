package subsystems;

public class NetworkInterface {
    public void connectToNetwork() {
        System.out.println("[Network] Connecting to primary Wi-Fi/Ethernet...");
    }
    
    public void disconnect() {
        System.out.println("[Network] Disconnecting from network.");
    }
}
