package facade;

import subsystems.*;

/**
 * <h1>ComputerFacade</h1>
 * 
 * <p>Provides a simple, high-level interface to the complex subsystems 
 * of booting or shutting down a computer. 
 * 
 * <p>The client doesn't need to know the order of operations 
 * (initialize memory BEFORE executing instructions, etc.), the facade handles it.
 */
public class ComputerFacade {
    private final CPU cpu;
    private final Memory memory;
    private final GPU gpu;
    private final DiskDrive diskDrive;
    private final NetworkInterface network;

    public ComputerFacade() {
        // High-level wrapper over multiple complex subsystems
        this.cpu = new CPU();
        this.memory = new Memory();
        this.gpu = new GPU();
        this.diskDrive = new DiskDrive();
        this.network = new NetworkInterface();
    }

    /**
     * Single abstract method to handle the complex boot sequence.
     */
    public void startComputer() {
        System.out.println("\n=== 🟢 Initiating Computer Boot Sequence ===");
        cpu.powerOn();
        memory.initialize(32); // 32GB
        gpu.enableGraphics();
        diskDrive.bootFromDisk("Linux OS");
        network.connectToNetwork();
        cpu.executeInstructions();
        System.out.println("=== Boot Sequence Complete. Ready to use. ===\n");
    }

    /**
     * Single abstract method to handle safe shutdown.
     */
    public void shutDownComputer() {
        System.out.println("\n=== 🔴 Initiating Computer Shutdown Sequence ===");
        network.disconnect();
        diskDrive.parkReaders();
        gpu.disableGraphics();
        memory.clear();
        cpu.halt();
        System.out.println("=== Shutdown Complete. Power off. ===\n");
    }
}
