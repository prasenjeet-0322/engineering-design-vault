package logger;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * ============================================================================
 * ✅ STAGE 2: SIMPLE FACTORY — The Logger Contract (Interface)
 * ============================================================================
 * Clients depend ONLY on this interface. They have zero knowledge of
 * DebugLogger, InfoLogger, ErrorLogger, or WarnLogger.
 * ============================================================================
 */
public interface ILogger {
    void log(String msg);
    LogLevel getLevel(); // Callers can ask "what level are you?" for routing decisions

    /** Utility: shared timestamp formatter (default method — no abstract class needed) */
    default String timestamp() {
        return LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss.SSS"));
    }
}
