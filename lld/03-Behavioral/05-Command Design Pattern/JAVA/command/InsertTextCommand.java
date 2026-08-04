package command;

import receiver.TextEditor;

public class InsertTextCommand implements ICommand {
    private final TextEditor editor;
    private final String textToInsert;

    public InsertTextCommand(TextEditor editor, String textToInsert) {
        this.editor = editor;
        this.textToInsert = textToInsert;
    }

    @Override
    public void execute() {
        editor.insertText(textToInsert);
    }

    @Override
    public void undo() {
        // To undo an insertion, we delete the exact length of the text we inserted
        editor.deleteText(textToInsert.length());
    }
}
