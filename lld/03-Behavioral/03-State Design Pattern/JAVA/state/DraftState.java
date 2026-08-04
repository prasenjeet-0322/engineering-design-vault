package state;

import context.Document;

public class DraftState implements IDocumentState {

    @Override
    public void render() {
        System.out.println("   [Draft] Rendering barebones text structure for Authors only.");
    }

    @Override
    public void publish(Document context, User currentUser) {
        System.out.println("   [Draft Action] 'Publish' clicked by " + currentUser.getName() + "...");
        
        // In the Draft State, anyone clicking "Publish" moves it to Moderation (not directly to Authored)
        System.out.println("      -> Moving document to Moderation Review.");
        context.changeState(new ModerationState());
    }
}
