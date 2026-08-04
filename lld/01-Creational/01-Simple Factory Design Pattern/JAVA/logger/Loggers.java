package logger;

/**
 * ============================================================================
 * ✅ STAGE 2: All Logger Implementations — Simple Factory's Products
 * ============================================================================
 * All implementations are PACKAGE-PRIVATE (no `public` modifier on the class).
 * This enforces: ONLY LoggerFactory can instantiate these.
 * External code calling `new DebugLogger()` won't compile.
 *
 * Formatting: [HH:mm:ss.SSS][thread-name][LEVEL] message
 * Color codes: TRACE=Grey  DEBUG=Cyan  INFO=Green  WARN=Yellow  ERROR=Red
 * ============================================================================
 */

class DebugLogger implements ILogger {
    DebugLogger() {} // package-private constructor

    @Override
    public void log(String msg) {
        System.out.printf("\u001B[36m[%s][%s][DEBUG] %s\u001B[0m%n",
            timestamp(), Thread.currentThread().getName(), msg);
    }
    @Override public LogLevel getLevel() { return LogLevel.DEBUG; }
}

class InfoLogger implements ILogger {
    InfoLogger() {}

    @Override
    public void log(String msg) {
        System.out.printf("\u001B[32m[%s][%s][INFO ] %s\u001B[0m%n",
            timestamp(), Thread.currentThread().getName(), msg);
    }
    @Override public LogLevel getLevel() { return LogLevel.INFO; }
}

class WarnLogger implements ILogger {
    WarnLogger() {}

    @Override
    public void log(String msg) {
        System.out.printf("\u001B[33m[%s][%s][WARN ] %s\u001B[0m%n",
            timestamp(), Thread.currentThread().getName(), msg);
    }
    @Override public LogLevel getLevel() { return LogLevel.WARN; }
}

class ErrorLogger implements ILogger {
    ErrorLogger() {}

    @Override
    public void log(String msg) {
        System.out.printf("\u001B[31m[%s][%s][ERROR] %s\u001B[0m%n",
            timestamp(), Thread.currentThread().getName(), msg);
    }
    @Override public LogLevel getLevel() { return LogLevel.ERROR; }
}

class TraceLogger implements ILogger {
    TraceLogger() {}

    @Override
    public void log(String msg) {
        System.out.printf("\u001B[90m[%s][%s][TRACE] %s\u001B[0m%n",
            timestamp(), Thread.currentThread().getName(), msg);
    }
    @Override public LogLevel getLevel() { return LogLevel.TRACE; }
}
