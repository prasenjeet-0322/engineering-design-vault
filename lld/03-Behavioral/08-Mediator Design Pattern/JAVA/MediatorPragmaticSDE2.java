package mediator;

import java.util.ArrayList;
import java.util.List;

/**
 * <h1>09 - Mediator: The "Air Traffic Controller" (SDE-2+ Level)</h1>
 * 
 * <b>Scenario:</b> An Airport Control System. 
 * Multiple Flights (Colleagues) are landing and taking off. If they talk to 
 * each other directly, the system becomes a N-to-N spaghetti mess.
 * 
 * <b>Senior SDE-2 Insights:</b>
 * 1. <b>Hub-and-Spoke:</b> The Mediator turns <b>N-to-N</b> coupling into <b>1-to-N</b>. 
 *    Objects only know about the Mediator, not their peers.
 * 2. <b>SRP Mastery:</b> The logic for "Who can land now?" stays in the Tower, 
 *    not inside the Flight. This keeps the Flight class focused on just flying.
 * 3. <b>Observer Synergy:</b> Mediators often use the <b>Observer pattern</b> 
 *    internally to notify colleagues of state changes.
 * 
 * <b>Edge Cases Handled:</b>
 * - <b>Safety Guard:</b> Only one flight can land at a time.
 * - <b>Registration:</b> Flights must register with the tower before they can talk.
 */

// --- MEDIATOR INTERFACE ---
interface ATC {
    void registerFlight(Flight f);
    boolean requestLanding(Flight f);
}

// --- COLLEAGUE BASE ---
abstract class Flight {
    protected ATC tower;
    public Flight(ATC t) { this.tower = t; }
    public abstract void land();
}

// --- CONCRETE COLLEAGUES ---
class CommercialFlight extends Flight {
    private final String id;
    public CommercialFlight(ATC t, String id) { super(t); this.id = id; }

    @Override
    public void land() {
        if (tower.requestLanding(this)) {
            System.out.println(id + ": Landing sequence started.");
        } else {
            System.out.println(id + ": Landing denied. Circling airport.");
        }
    }
    public String getId() { return id; }
}

// --- CONCRETE MEDIATOR ---
class ControlTower implements ATC {
    private final List<Flight> flights = new ArrayList<>();
    private boolean runwayOccupied = false;

    @Override
    public void registerFlight(Flight f) { flights.add(f); }

    @Override
    public synchronized boolean requestLanding(Flight f) {
        // --- [INTERVIEW_MVP] (Centralized Decision) ---
        if (!runwayOccupied) {
            runwayOccupied = true;
            return true;
        }
        return false;
    }

    public void clearRunway() { runwayOccupied = false; }
}

public class MediatorPragmaticSDE2 {
    public static void main(String[] args) {
        ControlTower tower = new ControlTower();
        Flight f1 = new CommercialFlight(tower, "Boeing 747");
        Flight f2 = new CommercialFlight(tower, "Airbus A320");

        tower.registerFlight(f1);
        tower.registerFlight(f2);

        // [INTERVIEW_MVP]: Decision through mediator
        f1.land(); // Allowed
        f2.land(); // Denied (Runway occupied)

        // [PRODUCTION_ENHANCEMENT]: Releasing resource
        System.out.println("\n--- Runway Cleared ---");
        tower.clearRunway();
        f2.land(); // Now allowed
    }
}
