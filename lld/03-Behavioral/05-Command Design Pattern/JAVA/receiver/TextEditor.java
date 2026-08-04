package receiver;

/**
 * <h1>The Receiver</h1>
 * 
 * <p>The object that actually contains the business logic and performs the real work.
 * The Commands merely wrap method calls to this object.
 */
public class TextEditor {
    private StringBuilder document;

    public TextEditor() {
        this.document = new StringBuilder();
    }

    public void insertText(String text) {
        document.append(text);
        System.out.println("   [Editor] Inserted text: '" + text + "'");
    }

    public void deleteText(int length) {
        if (length > document.length()) {
            length = document.length();
        }
        document.delete(document.length() - length, document.length());
        System.out.println("   [Editor] Deleted last " + length + " characters.");
    }

    public String readDocument() {
        return document.toString();
    }
}
