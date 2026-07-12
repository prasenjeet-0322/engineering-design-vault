package container;

import java.util.HashMap;
import java.util.Map;

/**
 * <h1>The IoC Container</h1>
 * 
 * <p>A simple implementation of Inversion of Control using a Map 
 * to store and retrieve pre-configured service instances.
 */
public class ServiceContainer {
    private final Map<Class<?>, Object> services = new HashMap<>();

    public <T> void register(Class<T> type, T implementation) {
        services.put(type, implementation);
    }

    @SuppressWarnings("unchecked")
    public <T> T resolve(Class<T> type) {
        return (T) services.get(type);
    }
}
