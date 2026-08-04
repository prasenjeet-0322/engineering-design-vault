import facade.ComputerFacade;

/**
 * <h1>Facade Pattern Demonstration</h1>
 * 
 * The client only interacts with the ComputerFacade.
 * It is completely shielded from the complexity of CPU, RAM, Disk, etc.
 */
public class Main {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("   Facade Pattern: Hiding Subsystem Complexity    ");
        System.out.println("==================================================");

        // One simple object to control a massive underlying hardware ecosystem
        ComputerFacade myComputer = new ComputerFacade();

        // The user just presses "Start"
        myComputer.startComputer();

        // ... doing some work ...

        // The user just presses "Shut Down"
        myComputer.shutDownComputer();
    }
}
