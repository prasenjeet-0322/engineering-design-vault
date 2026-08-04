package originator;

import memento.DocumentMemento;

/**
 * <h1>The Originator</h1>
 * 
 * <p>The object that holds the actual state we care about. 
 * It knows how to create a snapshot of itself (Memento) 
 * and how to restore its state from a given snapshot.
 */
public class TextDocument {
    private String content;
    private String font;
    private int fontSize;

    public TextDocument(String content, String font, int fontSize) {
        this.content = content;
        this.font = font;
        this.fontSize = fontSize;
    }

    // Mutators (State Changes)
    public void setContent(String content) { this.content = content; }
    public void setFont(String font) { this.font = font; }
    public void setFontSize(int fontSize) { this.fontSize = fontSize; }

    @Override
    public String toString() {
        return "Document State -> [Content: '" + content + "', Font: " + font + " " + fontSize + "pt]";
    }

    // --- Memento Logic ---

    /**
     * Creates a snapshot of the current state.
     */
    public DocumentMemento save() {
        System.out.println("   [Originator] Saving state to Memento...");
        return new DocumentMemento(content, font, fontSize);
    }

    /**
     * Overwrites current state with data from the snapshot.
     */
    public void restore(DocumentMemento memento) {
        this.content = memento.getContent();
        this.font = memento.getFont();
        this.fontSize = memento.getFontSize();
        System.out.println("   [Originator] State restored from Memento.");
    }
}
