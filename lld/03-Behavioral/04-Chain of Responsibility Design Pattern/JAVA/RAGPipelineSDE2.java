package middleware;

/**
 * <h1>05 - Modern CoR: The "RAG Pipeline" (2025 Edition)</h1>
 * 
 * <b>Scenario:</b> Building an AI Search Engine. 
 * The request must pass through:
 * 1. <b>QueryRewriter:</b> Re-writes the user query for better retrieval.
 * 2. <b>Retriever:</b> Fetches chunks from a Vector DB.
 * 3. <b>Re-Ranker:</b> Scores the best chunks.
 * 4. <b>Synthesizer:</b> Calls LLM to generate the final answer.
 * 
 * <b>2025 Senior Insights:</b>
 * 1. <b>Pipeline Short-Circuit:</b> If the Rewriter finds the query is 
 *    unsafe (PII/Harmful), it stops the chain immediately.
 * 2. <b>Async/Streaming:</b> In a real system, each link would handle 
 *    <b>Streams</b> or <b>CompletableFutures</b> to reduce latency.
 */

abstract class PipelineStep {
    protected PipelineStep next;
    public void setNext(PipelineStep n) { this.next = n; }

    public abstract String process(String input);

    protected String callNext(String input) {
        if (next == null) return input;
        return next.process(input);
    }
}

class QueryRewriter extends PipelineStep {
    @Override
    public String process(String input) {
        System.out.println("AI: Re-writing query for better Vector search...");
        return callNext(input + " [context-aware]");
    }
}

class VectorRetriever extends PipelineStep {
    @Override
    public String process(String input) {
        System.out.println("AI: Fetching 5 chunks from Pinecone...");
        return callNext(input + " + [retrieved-chunks]");
    }
}

/**
 * 🎓 SDE-2+ READINESS CHECK:
 * - Why CoR for RAG? It allows you to "Plug-and-Play" different search 
 *   strategies (e.g. Semantic Search vs Keyword Search) without changing 
 *    the Synthesizer logic.
 */
public class RAGPipelineSDE2 {
    public static void main(String[] args) {
        PipelineStep rewriter = new QueryRewriter();
        PipelineStep retriever = new VectorRetriever();
        rewriter.setNext(retriever);

        // [INTERVIEW_MVP]: Execution of the AI chain
        String result = rewriter.process("What is SOLID?");
        System.out.println("Final Pipeline Output: " + result);
    }
}
