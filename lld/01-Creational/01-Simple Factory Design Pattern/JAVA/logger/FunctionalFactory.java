package logger;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

/**
 * <h1>Pragmatic SDE-2+ Simple Factory (Functional)</h1>
 * 
 * <b>Why this is Senior-Level:</b>
 * Simple factories usually use <code>new</code> in a switch. 
 * This advanced version uses <b>Functional Interfaces</b> to handle products 
 * that require dynamic runtime parameters (like a log prefix).
 * 
 * <b>Strategy:</b>
 * 1. Implement basic static creation logic for MVP.
 * 2. Use <code>Optional</code> and <code>Function</code> registry for Production.
 */
public class FunctionalFactory {

    // --- [INTERVIEW_MVP] (The Registry) ---
    // Maps a Type to a "Creator Function"
    private static final Map<LogLevel, Function<String, ILogger>> REGISTRY = new HashMap<>();

    static {
        REGISTRY.put(LogLevel.DEBUG, prefix -> new CustomLogger("[DEBUG] " + prefix, LogLevel.DEBUG));
        REGISTRY.put(LogLevel.INFO,  prefix -> new CustomLogger("[INFO]  " + prefix, LogLevel.INFO));
    }

    /**
     * [PRODUCTION_ENHANCEMENT]: Senior API.
     * Prevents NullPointerExceptions and enables dynamic injection.
     */
    public static Optional<ILogger> createLogger(LogLevel level, String prefix) {
        Function<String, ILogger> creator = REGISTRY.get(level);
        return (creator != null) ? Optional.of(creator.apply(prefix)) : Optional.empty();
    }
}

class CustomLogger implements ILogger {
    private final String prefix;
    private final LogLevel level;

    public CustomLogger(String p, LogLevel l) { this.prefix = p; this.level = l; }
    @Override public void log(String msg) { System.out.println(prefix + ": " + msg); }
    @Override public LogLevel getLevel() { return level; }
}
