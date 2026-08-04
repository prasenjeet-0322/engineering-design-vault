package command;

/**
 * <h1>The Command Interface</h1>
 * 
 * <p>Standardizes the execution of operations. By forcing every action to implement 
 * execute() and undo(), we can build complex features like Transaction Rollbacks 
 * or Ctrl+Z Undo History.
 */
public interface ICommand {
    void execute();
    void undo();
}
