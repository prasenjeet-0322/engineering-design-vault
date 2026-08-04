package subsystems;

public class Memory {
    public void initialize(long capacity) {
        System.out.println("[Memory] Initializing " + capacity + "GB of RAM.");
    }
    
    public void clear() {
        System.out.println("[Memory] Clearing RAM.");
    }
}
