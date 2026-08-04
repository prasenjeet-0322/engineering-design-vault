package state;

import context.Document;

public class ModerationState implements IDocumentState {

    @Override
    public void render() {
        System.out.println("   [Moderation] Rendering document with Editor markup and approval buttons.");
    }

    @Override
    public void publish(Document context, User currentUser) {
        System.out.println("   [Moderation Action] 'Approve' clicked by " + currentUser.getName() + "...");
        
        // Business logic: Only Admins can approve moderation
        if (currentUser.isAdmin()) {
            System.out.println("      -> Approved! Moving document to Public distribution.");
            context.changeState(new PublishedState());
        } else {
            System.out.println("      -> ❌ FAILED: Only Admins can approve documents in Moderation.");
        }
    }
}
