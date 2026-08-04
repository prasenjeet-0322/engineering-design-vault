package memento;

/**
 * <h1>The Memento (Snapshot)</h1>
 * 
 * <p>A value object that acts as a snapshot of the Originator's state.
 * It strictly DOES NOT have setters. Once created, a Memento is immutable.
 */
public class DocumentMemento {
    private final String content;
    private final String font;
    private final int fontSize;

    // Package-private or public constructor depending on language capabilities.
    // In strict Java, we'd nest this inside the Originator, but for clarity, 
    // we keep it separated and immutable.
    public DocumentMemento(String content, String font, int fontSize) {
        this.content = content;
        this.font = font;
        this.fontSize = fontSize;
    }

    // Getters for the Originator to use during restoration
    public String getContent() { return content; }
    public String getFont() { return font; }
    public int getFontSize() { return fontSize; }
}
