package subsystems;

public class CPU {
    public void powerOn() {
        System.out.println("[CPU] Powered on.");
    }

    public void executeInstructions() {
        System.out.println("[CPU] Executing boot instructions.");
    }
    
    public void halt() {
        System.out.println("[CPU] Halting execution.");
    }
}
