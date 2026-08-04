package logger;

import java.util.EnumMap;
import java.util.Map;

/**
 * ============================================================================
 * ✅ STAGE 2: Simple Factory — LoggerFactory
 * ============================================================================
 * WHAT CHANGED FROM THE ORIGINAL:
 *   1. ❌→✅  'return null'  replaced with a loud IllegalArgumentException
 *   2. ➕    Instance CACHING via EnumMap — stateless loggers are reused
 *   3. ➕    WARN and TRACE levels added (one place to change — that's the point)
 *   4. ➕    Package-private logger constructors enforce factory-only creation
 *
 * CALLER INTERACTION:
 *   Client only calls: LoggerFactory.createLogger(LogLevel.DEBUG)
 *   Client imports:    ILogger, LogLevel  ← That's it. Zero concrete classes.
 * ============================================================================
 */
public class LoggerFactory {

    /**
     * Instance cache: stateless loggers are singleton-per-level.
     * Initialized eagerly — all loggers created once at class load time.
     * ┌──────────────────────────────────────────────┐
     * │  LogLevel.DEBUG  ──→ DebugLogger (1 instance) │
     * │  LogLevel.INFO   ──→ InfoLogger  (1 instance) │
     * │  LogLevel.WARN   ──→ WarnLogger  (1 instance) │
     * │  LogLevel.ERROR  ──→ ErrorLogger (1 instance) │
     * │  LogLevel.TRACE  ──→ TraceLogger (1 instance) │
     * └──────────────────────────────────────────────┘
     */
    private static final Map<LogLevel, ILogger> CACHE = new EnumMap<>(LogLevel.class);

    static {
        CACHE.put(LogLevel.DEBUG, new DebugLogger());
        CACHE.put(LogLevel.INFO,  new InfoLogger());
        CACHE.put(LogLevel.WARN,  new WarnLogger());
        CACHE.put(LogLevel.ERROR, new ErrorLogger());
        CACHE.put(LogLevel.TRACE, new TraceLogger());
    }

    // Prevent instantiation — this is a utility class with static factory method
    private LoggerFactory() {}

    /**
     * The Simple Factory method.
     *
     * @param logLevel type-safe enum key — no typo risk, exhaustive matching
     * @return the cached ILogger for this level
     * @throws IllegalArgumentException if level is not registered (never null)
     */
    public static ILogger createLogger(LogLevel logLevel) {
        ILogger logger = CACHE.get(logLevel);
        if (logger == null) {
            // Loud, fast failure with full context — no silent NPE 10 frames later
            throw new IllegalArgumentException(
                "No logger registered for level: " + logLevel +
                ". Valid levels: " + CACHE.keySet()
            );
        }
        return logger;
    }
}
