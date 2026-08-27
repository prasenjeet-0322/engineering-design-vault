# 🕵️ Problem-Solving & Debugging Framework

Senior engineers aren't just fast coders; they are exceptional debuggers. This framework outlines the systematic approach you should take when encountering bugs, which is reflected in the "Debugging scenarios" section of the notes.

## 1. Stop, Read, and Isolate
**The Junior approach:** Immediately change code, guess and check, refresh the page.
**The Senior approach:** Read the error trace completely. Form a hypothesis.

- **What is the exact symptom?** (e.g., "The component unmounts unexpectedly", "The database query takes 4 seconds").
- **What is the error message?** Read the stack trace from top to bottom. 
- **Can I isolate it?** Remove surrounding code/components until only the broken piece remains.

## 2. The Context Layers Check
When a bug occurs, check the layers systematically from bottom to top (or top to bottom, depending on the bug type):

### Frontend UI/CSS Bugs
1. **DOM Structure:** Is the HTML semantic and nested correctly?
2. **Stacking Contexts:** (For z-index issues) Are there parent elements with `opacity`, `transform`, or `position` that are creating new contexts?
3. **Cascade & Specificity:** Is another class overriding your styles?

### React / State Bugs
1. **Render Cycle:** Is the state actually updating? (Check React DevTools).
2. **Stale Closures:** Is a `useEffect` or `useCallback` capturing an old variable?
3. **Reference Equality:** Are you passing a new object/array on every render, causing infinite loops?

### Network / API Bugs
1. **The Client Network Tab:** What did the browser actually send? (Headers, Payload).
2. **The Server Logs:** Did the request reach the server? What did the controller parse?
3. **The Database:** Was the query executed correctly? (Run the SQL manually).

## 3. Formulate and Test Hypotheses
Don't change 5 things at once. 
1. **Hypothesis:** "I think the modal is hidden because the parent has `overflow: hidden`."
2. **Test:** Disable `overflow: hidden` in the browser dev tools.
3. **Result:** Did it fix it? 
   - *Yes:* Implement the fix in code.
   - *No:* Revert the test. Move to the next hypothesis.

## 4. Understand the Tradeoffs of the Fix
Sometimes a quick fix creates a long-term problem.
- Does this `!important` ruin our CSS architecture?
- Does adding this `useMemo` actually improve performance, or just add memory overhead?
- Does fixing this N+1 query issue use too much RAM on the Node server?

Always refer back to the **Level 2 (Engineering Understanding)** notes to ensure your fix aligns with best practices.
