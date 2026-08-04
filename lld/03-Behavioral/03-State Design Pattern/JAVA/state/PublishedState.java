package state;

import context.Document;

public class PublishedState implements IDocumentState {

    @Override
    public void render() {
        System.out.println("   [Published] Rendering final HTML document with CSS and Ads for the Public.");
    }

    @Override
    public void publish(Document context, User currentUser) {
        // Business logic: It's already published!
        System.out.println("   [Published Action] ❌ Cannot publish. Document is already live!");
    }
}
