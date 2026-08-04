package subsystems;

public class DiskDrive {
    public void bootFromDisk(String osName) {
        System.out.println("[DiskDrive] Booting " + osName + " from NVMe SSD.");
    }
    
    public void parkReaders() {
        System.out.println("[DiskDrive] Parking disk readers.");
    }
}
