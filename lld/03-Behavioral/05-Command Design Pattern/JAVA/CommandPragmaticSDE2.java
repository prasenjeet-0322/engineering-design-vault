package command;

import java.util.Stack;

/**
 * <h1>03 - Command: The "Invoker" Strategy (SDE-2+ Level)</h1>
 * 
 * <b>Scenario:</b> A Banking Transaction System. 
 * You need to perform 'Transfer' and 'Deposit' actions. If a transfer fails halfway, 
 * you must 'Undo' (Compensate) the transaction to maintain data integrity.
 * 
 * <b>Senior SDE-2 Insights:</b>
 * 1. <b>Decoupling:</b> The Sender (UI/API) doesn't know how the 
 *    logic works. It just triggers <code>command.execute()</code>.
 * 2. <b>Command History:</b> Use a <b>Stack</b> to store executed commands. 
 *    This enables the "Undo" feature (Ctrl+Z).
 * 3. <b>Queuing:</b> Commands can be serialized and put into a <b>Message Queue</b> 
 *    (Kafka/SQS) to be executed later by a background worker.
 * 
 * <b>Edge Cases Handled:</b>
 * - <b>Empty History:</b> Prevents undoing when nothing has happened.
 * - <b>State Snapshots:</b> Captures necessary data before execution for perfect undo.
 */

// --- COMMAND INTERFACE ---
interface Transaction {
    boolean execute();
    void rollback();
}

// --- RECEIVER (The logic owner) ---
class BankAccount {
    private double balance;
    public BankAccount(double b) { this.balance = b; }
    public void deposit(double amt) { balance += amt; }
    public void withdraw(double amt) { balance -= amt; }
    public double getBalance() { return balance; }
}

// --- CONCRETE COMMAND ---
class DepositCommand implements Transaction {
    private final BankAccount account;
    private final double amount;

    public DepositCommand(BankAccount acc, double amt) {
        this.account = acc;
        this.amount = amt;
    }

    @Override
    public boolean execute() {
        account.deposit(amount);
        System.out.println("Deposited: $" + amount);
        return true;
    }

    @Override
    public void rollback() {
        account.withdraw(amount);
        System.out.println("Undo Deposit: withdrew $" + amount);
    }
}

// --- INVOKER (The Controller) ---
class TransactionManager {
    private final Stack<Transaction> history = new Stack<>();

    public void executeTransaction(Transaction t) {
        // --- [INTERVIEW_MVP] (Execution) ---
        if (t.execute()) {
            history.push(t);
        }
    }

    public void undoLast() {
        // --- [PRODUCTION_ENHANCEMENT] (Undo Safety) ---
        if (!history.isEmpty()) {
            Transaction last = history.pop();
            last.rollback();
        } else {
            System.out.println("Nothing to undo.");
        }
    }
}

/**
 * 🎓 SDE-2+ READINESS CHECK:
 * - Why use Command instead of just calling the method? Command allows 
 *   Queuing, Scheduling, and Undo/Redo which raw method calls cannot do.
 */
public class CommandPragmaticSDE2 {
    public static void main(String[] args) {
        BankAccount myAccount = new BankAccount(1000.0);
        TransactionManager manager = new TransactionManager();

        // [INTERVIEW_MVP]: Execute actions
        manager.executeTransaction(new DepositCommand(myAccount, 500.0));
        System.out.println("Balance: " + myAccount.getBalance());

        // [PRODUCTION_ENHANCEMENT]: Rollback logic
        manager.undoLast();
        System.out.println("Final Balance: " + myAccount.getBalance());
    }
}
