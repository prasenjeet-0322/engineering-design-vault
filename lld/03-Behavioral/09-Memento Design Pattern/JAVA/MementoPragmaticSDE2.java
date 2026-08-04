package originator;

import java.util.Stack;

/**
 * <h1>08 - Memento: The "Snapshot" Pattern (SDE-2+ Level)</h1>
 * 
 * <b>Scenario:</b> A Video Game Save System. 
 * A Player has Health and a List of Items. You need to "Save" the state before 
 * a boss fight and "Reload" if the player dies.
 * 
 * <b>Senior SDE-2 Insights:</b>
 * 1. <b>Encapsulation:</b> The Memento object should be <b>Immutable</b>. 
 *    Only the Originator (Player) should be able to read/write its contents.
 * 2. <b>Memory Management:</b> For 10k users, storing 100 snapshots each in RAM 
 *    will crash the server. In production, old mementos are moved to 
 *    <b>Disk/S3</b> or serialized to a Database.
 * 3. <b>Deep vs Shallow:</b> If the state contains mutable objects (like a List), 
 *    the Memento must store a <b>Deep Copy</b> to prevent accidental state corruption.
 * 
 * <b>Edge Cases Handled:</b>
 * - <b>Empty History:</b> Prevents crashing on 'Undo' when no saves exist.
 * - <b>State Corruption:</b> Uses immutable fields in Memento.
 */

// --- MEMENTO (The Snapshot - Immutable) ---
class PlayerSnapshot {
    private final int health;
    private final String weapon;

    public PlayerSnapshot(int h, String w) {
        this.health = h;
        this.weapon = w;
    }
    // Only getters, no setters (Immutable)
    public int getHealth() { return health; }
    public String getWeapon() { return weapon; }
}

// --- ORIGINATOR (The State Owner) ---
class GamePlayer {
    private int health;
    private String weapon;

    public GamePlayer(int h, String w) { this.health = h; this.weapon = w; }

    public void takeDamage(int d) { health -= d; }
    public void setWeapon(String w) { weapon = w; }

    // [INTERVIEW_MVP]: Create Snapshot
    public PlayerSnapshot save() {
        return new PlayerSnapshot(health, weapon);
    }

    // [INTERVIEW_MVP]: Restore Snapshot
    public void load(PlayerSnapshot s) {
        this.health = s.getHealth();
        this.weapon = s.getWeapon();
    }

    @Override public String toString() { return "Player[HP=" + health + ", Weapon=" + weapon + "]"; }
}

// --- CARETAKER (The History Manager) ---
class SaveManager {
    private final Stack<PlayerSnapshot> history = new Stack<>();

    public void backup(GamePlayer p) { history.push(p.save()); }

    public void undo(GamePlayer p) {
        // [PRODUCTION_ENHANCEMENT]: Boundary safety
        if (!history.isEmpty()) {
            p.load(history.pop());
        } else {
            System.out.println("No saves found.");
        }
    }
}

public class MementoPragmaticSDE2 {
    public static void main(String[] args) {
        GamePlayer hero = new GamePlayer(100, "Sword");
        SaveManager saves = new SaveManager();

        // [INTERVIEW_MVP]: Save state
        saves.backup(hero);
        
        System.out.println("Boss Fight: " + hero);
        hero.takeDamage(90);
        hero.setWeapon("Broken Stick");
        System.out.println("Post-Fight (Bad): " + hero);

        // [PRODUCTION_ENHANCEMENT]: Restore state
        saves.undo(hero);
        System.out.println("Reloaded Save: " + hero);
    }
}
