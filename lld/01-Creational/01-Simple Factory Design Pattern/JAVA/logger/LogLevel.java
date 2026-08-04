package logger;

/**
 * Type-safe factory key. Using an enum instead of raw Strings means:
 * - Typos caught at compile time ("DEBG" is impossible)
 * - Switch is exhaustive — the compiler warns if a case is missing
 * - New level (WARN, TRACE) = add one entry here + one case in LoggerFactory
 */
public enum LogLevel {
    DEBUG, INFO, WARN, ERROR, TRACE
}
