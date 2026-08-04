package command;

import java.util.HashMap;
import java.util.Map;

/**
 * <h1>Modern Add-on: Agentic Tool-Use (2025 AI Standard)</h1>
 * 
 * <b>Scenario:</b> You are building an AI Agent. The LLM returns a "Tool Call" 
 * (e.g., <code>{ "tool": "search", "query": "LLD" }</code>). Your code must 
 * safely execute this tool.
 * 
 * <b>2025 Senior Insight:</b>
 * This is a perfect use of the <b>Command + Registry</b> patterns. 
 * The Registry prevents "Prompt Injection" by ensuring the LLM can only call 
 * pre-approved, safe commands.
 */

// --- TOOL INTERFACE (Command) ---
interface AgentTool {
    String execute(String input);
}

// --- CONCRETE TOOLS ---
class SearchTool implements AgentTool {
    @Override public String execute(String q) { return "Search results for: " + q; }
}

class CalculatorTool implements AgentTool {
    @Override public String execute(String expr) { return "Result: 42"; }
}

// --- TOOL REGISTRY ---
class ToolRegistry {
    private final Map<String, AgentTool> availableTools = new HashMap<>();

    public void register(String name, AgentTool tool) { availableTools.put(name, tool); }

    public String runTool(String name, String input) {
        // --- [INTERVIEW_MVP] (Safe Execution) ---
        AgentTool tool = availableTools.get(name);
        if (tool == null) throw new IllegalArgumentException("AI attempted to use unauthorized tool: " + name);
        
        return tool.execute(input);
    }
}

class AgentToolDemo {
    public static void main(String[] args) {
        ToolRegistry registry = new ToolRegistry();
        registry.register("web_search", new SearchTool());

        // Simulated AI decision
        String aiRequest = "web_search";
        String aiInput = "Design patterns for AI agents";

        System.out.println("Agent executing: " + registry.runTool(aiRequest, aiInput));
    }
}
