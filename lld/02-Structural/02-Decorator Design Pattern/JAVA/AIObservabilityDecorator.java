package decorator;

/**
 * <h1>Modern Add-on: AI Observability (2025 AI Standard)</h1>
 * 
 * <b>Scenario:</b> You need to track exactly how many tokens each user consumes 
 * and how long the LLM takes to respond.
 * 
 * <b>2025 Senior Insight:</b>
 * You don't want to add tracking logic inside your <code>OpenAIService</code>. 
 * Use a <b>Decorator</b> to wrap any AI service with observability metrics. 
 * This keeps the business logic clean and matches "Production-Grade" standards.
 */

interface AIService {
    String completion(String prompt);
}

class OpenAIService implements AIService {
    @Override public String completion(String p) {
        return "AI Response for " + p;
    }
}

class ObservabilityDecorator implements AIService {
    private final AIService wrappee;

    public ObservabilityDecorator(AIService s) { this.wrappee = s; }

    @Override
    public String completion(String prompt) {
        // --- [INTERVIEW_MVP] (Telemetry Injection) ---
        long start = System.currentTimeMillis();
        
        String response = wrappee.completion(prompt);
        
        long end = System.currentTimeMillis();

        // --- [PRODUCTION_ENHANCEMENT] (Detailed Metrics) ---
        System.out.println("[METRIC] Latency: " + (end - start) + "ms");
        System.out.println("[METRIC] Tokens: " + (prompt.length() / 4)); // Rough estimate
        
        return response;
    }
}

class AIObservabilityDemo {
    public static void main(String[] args) {
        AIService base = new OpenAIService();
        
        // Wrap with observability
        AIService trackedAI = new ObservabilityDecorator(base);
        
        trackedAI.completion("Explain Bridge vs Adapter.");
    }
}
