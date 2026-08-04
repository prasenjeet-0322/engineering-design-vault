package lld.practice;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * ============================================================================
 * Low-Level Design: Multi-Floor Enterprise Parking Lot System
 * ============================================================================
 * Design Principles Applied:
 *  1. Single Responsibility Principle (SRP): Each class owns its state & behavior.
 *  2. Open-Closed Principle (OCP): Pluggable SpotAllocationStrategy & IPricingStrategy.
 *  3. Strategy Pattern: Decoupled allocation and pricing algorithms.
 *  4. Observer Pattern: DisplayBoard observes spot occupancy changes on each floor.
 *  5. Singleton Pattern: Thread-safe double-checked locking for main ParkingLot manager.
 * ============================================================================
 */

// ============================================================================
// 1. ENUMS (Fixed Categories)
// ============================================================================
enum VehicleType {
    MOTORCYCLE, CAR, TRUCK
}

enum ParkingSpotType {
    MOTORCYCLE, COMPACT, LARGE
}

// ============================================================================
// 2. VEHICLE ENTITIES (Abstraction & Inheritance)
// ============================================================================
abstract class Vehicle {
    private final String licensePlate;
    private final VehicleType type;

    public Vehicle(String licensePlate, VehicleType type) {
        this.licensePlate = licensePlate;
        this.type = type;
    }

    public String getLicensePlate() { return licensePlate; }
    public VehicleType getType() { return type; }
}

class Motorcycle extends Vehicle {
    public Motorcycle(String licensePlate) {
        super(licensePlate, VehicleType.MOTORCYCLE);
    }
}

class Car extends Vehicle {
    public Car(String licensePlate) {
        super(licensePlate, VehicleType.CAR);
    }
}

class Truck extends Vehicle {
    public Truck(String licensePlate) {
        super(licensePlate, VehicleType.TRUCK);
    }
}

// ============================================================================
// 3. PARKING SPOT ENTITY (State + Behavior)
// ============================================================================
class ParkingSpot {
    private final String spotId;
    private final ParkingSpotType spotType;
    private Vehicle parkedVehicle;

    public ParkingSpot(String spotId, ParkingSpotType spotType) {
        this.spotId = spotId;
        this.spotType = spotType;
        this.parkedVehicle = null;
    }

    public boolean isAvailable() {
        return this.parkedVehicle == null;
    }

    /**
     * Matching Rules:
     * - Motorcycle: fits in MOTORCYCLE, COMPACT, LARGE
     * - Car: fits in COMPACT, LARGE
     * - Truck: fits ONLY in LARGE
     */
    public boolean canFitVehicle(Vehicle vehicle) {
        if (!isAvailable()) return false;

        VehicleType vType = vehicle.getType();
        if (vType == VehicleType.MOTORCYCLE) return true;
        if (vType == VehicleType.CAR) return spotType == ParkingSpotType.COMPACT || spotType == ParkingSpotType.LARGE;
        if (vType == VehicleType.TRUCK) return spotType == ParkingSpotType.LARGE;

        return false;
    }

    public synchronized boolean parkVehicle(Vehicle vehicle) {
        if (!canFitVehicle(vehicle)) {
            return false;
        }
        this.parkedVehicle = vehicle;
        return true;
    }

    public synchronized void unparkVehicle() {
        this.parkedVehicle = null;
    }

    public String getSpotId() { return spotId; }
    public ParkingSpotType getSpotType() { return spotType; }
    public Vehicle getParkedVehicle() { return parkedVehicle; }
}

// ============================================================================
// 4. TICKET ENTITY (State + Behavior)
// ============================================================================
class Ticket {
    private final String ticketId;
    private final LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private final ParkingSpot spot;
    private final Vehicle vehicle;
    private boolean isPaid;

    public Ticket(String ticketId, ParkingSpot spot, Vehicle vehicle) {
        this.ticketId = ticketId;
        this.spot = spot;
        this.vehicle = vehicle;
        this.entryTime = LocalDateTime.now();
        this.isPaid = false;
    }

    public long getDurationInHours() {
        LocalDateTime end = (exitTime != null) ? exitTime : LocalDateTime.now();
        long hours = Duration.between(entryTime, end).toHours();
        return Math.max(1, hours); // Minimum 1 hour charge
    }

    public void markPaid() {
        this.isPaid = true;
        this.exitTime = LocalDateTime.now();
    }

    public String getTicketId() { return ticketId; }
    public LocalDateTime getEntryTime() { return entryTime; }
    public ParkingSpot getSpot() { return spot; }
    public Vehicle getVehicle() { return vehicle; }
    public boolean isPaid() { return isPaid; }
}

// ============================================================================
// 5. DISPLAY BOARD ENTITY (State + Observer Pattern Behavior)
// ============================================================================
class DisplayBoard {
    private final Map<ParkingSpotType, Integer> freeSpotCounts;

    public DisplayBoard() {
        this.freeSpotCounts = new HashMap<>();
        for (ParkingSpotType type : ParkingSpotType.values()) {
            freeSpotCounts.put(type, 0);
        }
    }

    public synchronized void updateCount(ParkingSpotType type, int change) {
        int current = freeSpotCounts.getOrDefault(type, 0);
        freeSpotCounts.put(type, Math.max(0, current + change));
    }

    public void showDisplay() {
        System.out.println("  [DISPLAY BOARD] Free Spots Status:");
        for (Map.Entry<ParkingSpotType, Integer> entry : freeSpotCounts.entrySet()) {
            System.out.println("    - " + entry.getKey() + ": " + entry.getValue() + " available");
        }
    }
}

// ============================================================================
// 6. PARKING FLOOR ENTITY (Container of Spots + DisplayBoard Observer)
// ============================================================================
class ParkingFloor {
    private final int floorNumber;
    private final List<ParkingSpot> spots;
    private final DisplayBoard displayBoard;

    public ParkingFloor(int floorNumber, List<ParkingSpot> spots) {
        this.floorNumber = floorNumber;
        this.spots = spots;
        this.displayBoard = new DisplayBoard();

        // Initialize display board counts
        for (ParkingSpot spot : spots) {
            displayBoard.updateCount(spot.getSpotType(), 1);
        }
    }

    public ParkingSpot findAvailableSpot(Vehicle vehicle) {
        for (ParkingSpot spot : spots) {
            if (spot.isAvailable() && spot.canFitVehicle(vehicle)) {
                return spot;
            }
        }
        return null;
    }

    public boolean parkVehicle(Vehicle vehicle, ParkingSpot spot) {
        if (spot.parkVehicle(vehicle)) {
            displayBoard.updateCount(spot.getSpotType(), -1);
            return true;
        }
        return false;
    }

    public void unparkVehicle(ParkingSpot spot) {
        spot.unparkVehicle();
        displayBoard.updateCount(spot.getSpotType(), 1);
    }

    public int getFloorNumber() { return floorNumber; }
    public List<ParkingSpot> getSpots() { return spots; }
    public DisplayBoard getDisplayBoard() { return displayBoard; }
}

// ============================================================================
// 7. STRATEGY PATTERNS (Pluggable Algorithms)
// ============================================================================
interface SpotAllocationStrategy {
    ParkingSpot findSpot(List<ParkingFloor> floors, Vehicle vehicle);
}

class FirstAvailableSpotStrategy implements SpotAllocationStrategy {
    @Override
    public ParkingSpot findSpot(List<ParkingFloor> floors, Vehicle vehicle) {
        for (ParkingFloor floor : floors) {
            ParkingSpot spot = floor.findAvailableSpot(vehicle);
            if (spot != null) {
                return spot;
            }
        }
        return null;
    }
}

interface IPricingStrategy {
    double calculateFee(Ticket ticket);
}

class FlatRatePricingStrategy implements IPricingStrategy {
    private final double hourlyRate;

    public FlatRatePricingStrategy(double hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    @Override
    public double calculateFee(Ticket ticket) {
        return ticket.getDurationInHours() * hourlyRate;
    }
}

// ============================================================================
// 8. PARKING LOT SINGLETON MANAGER (Orchestrator)
// ============================================================================
class ParkingLotManager {
    private static volatile ParkingLotManager instance;
    private final String name;
    private final List<ParkingFloor> floors;
    private SpotAllocationStrategy allocationStrategy;
    private IPricingStrategy pricingStrategy;
    private final Map<String, Ticket> activeTickets;

    private ParkingLotManager(String name) {
        this.name = name;
        this.floors = new ArrayList<>();
        this.allocationStrategy = new FirstAvailableSpotStrategy();
        this.pricingStrategy = new FlatRatePricingStrategy(10.0); // $10/hr flat rate
        this.activeTickets = new HashMap<>();
    }

    public static ParkingLotManager getInstance(String name) {
        if (instance == null) {
            synchronized (ParkingLotManager.class) {
                if (instance == null) {
                    instance = new ParkingLotManager(name);
                }
            }
        }
        return instance;
    }

    public void addFloor(ParkingFloor floor) {
        floors.add(floor);
    }

    public synchronized Ticket parkVehicle(Vehicle vehicle) {
        ParkingSpot spot = allocationStrategy.findSpot(floors, vehicle);
        if (spot == null) {
            System.out.println("❌ No available spot found for " + vehicle.getType() + " [" + vehicle.getLicensePlate() + "]");
            return null;
        }

        // Find floor containing this spot
        for (ParkingFloor floor : floors) {
            if (floor.getSpots().contains(spot)) {
                if (floor.parkVehicle(vehicle, spot)) {
                    String ticketId = "TICKET-" + UUID.randomUUID().toString().substring(0, 8);
                    Ticket ticket = new Ticket(ticketId, spot, vehicle);
                    activeTickets.put(ticketId, ticket);
                    System.out.println("✅ Vehicle [" + vehicle.getLicensePlate() + "] parked at spot [" 
                                       + spot.getSpotId() + "]. Issued Ticket: " + ticketId);
                    return ticket;
                }
            }
        }
        return null;
    }

    public synchronized double unparkVehicle(String ticketId) {
        Ticket ticket = activeTickets.get(ticketId);
        if (ticket == null) {
            System.out.println("❌ Invalid Ticket ID: " + ticketId);
            return 0.0;
        }

        double fee = pricingStrategy.calculateFee(ticket);
        ticket.markPaid();

        // Free the spot on its floor
        ParkingSpot spot = ticket.getSpot();
        for (ParkingFloor floor : floors) {
            if (floor.getSpots().contains(spot)) {
                floor.unparkVehicle(spot);
                break;
            }
        }

        activeTickets.remove(ticketId);
        System.out.println("🚗 Vehicle [" + ticket.getVehicle().getLicensePlate() + "] unparked from spot [" 
                           + spot.getSpotId() + "]. Fee Charged: $" + fee);
        return fee;
    }

    public List<ParkingFloor> getFloors() { return floors; }
}

// ============================================================================
// 9. EXECUTABLE DEMO & SYSTEM HARNESS
// ============================================================================
public class ParkingLotSystem {
    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("   ENTERPRISE PARKING LOT LLD DEMO SYSTEM");
        System.out.println("=================================================\n");

        // 1. Initialize Parking Lot
        ParkingLotManager lot = ParkingLotManager.getInstance("Downtown Central Parking");

        // 2. Setup Floor 1 with Spots
        List<ParkingSpot> floor1Spots = Arrays.asList(
            new ParkingSpot("F1-M1", ParkingSpotType.MOTORCYCLE),
            new ParkingSpot("F1-C1", ParkingSpotType.COMPACT),
            new ParkingSpot("F1-L1", ParkingSpotType.LARGE)
        );
        ParkingFloor floor1 = new ParkingFloor(1, floor1Spots);
        lot.addFloor(floor1);

        // 3. Display Initial Status
        System.out.println("--- INITIAL FLOOR 1 STATUS ---");
        floor1.getDisplayBoard().showDisplay();
        System.out.println();

        // 4. Park Vehicles
        Vehicle car = new Car("KA-01-HH-1234");
        Vehicle bike = new Motorcycle("KA-02-EE-5678");

        System.out.println("--- PARKING VEHICLES ---");
        Ticket ticket1 = lot.parkVehicle(car);
        Ticket ticket2 = lot.parkVehicle(bike);
        System.out.println();

        // 5. Display Updated Status
        System.out.println("--- FLOOR 1 STATUS AFTER PARKING ---");
        floor1.getDisplayBoard().showDisplay();
        System.out.println();

        // 6. Unpark Vehicles & Collect Fees
        System.out.println("--- UNPARKING & BILLING ---");
        if (ticket1 != null) {
            lot.unparkVehicle(ticket1.getTicketId());
        }
        System.out.println();

        // 7. Display Final Status
        System.out.println("--- FINAL FLOOR 1 STATUS ---");
        floor1.getDisplayBoard().showDisplay();
        System.out.println("\n=================================================");
    }
}
