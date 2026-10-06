# Spec: Fix Summary Auto-Scrolling to End (Ensure Scroll to Top on Completion)

## Objective
Fix the behavior where completing or loading a summary causes the view to scroll all the way to the end / bottom instead of remaining at the top. When a summary finishes generating or loading (for both Lesson Summary in the sidebar and Chapter Summary in the modal), the user should start reading from the beginning (top) of the summary text.

### User Stories
1. **Lesson Summary (Right Sidebar)**: As a user, when I generate or load a lesson summary in the "Summary" tab, the text view must always be positioned at the top (`scrollTop = 0`) so I can immediately read the summary from the start without having to manually scroll back up.
2. **Chapter Summary (Modal)**: As a user, when I open or generate a chapter summary in the Chapter Summary modal, the modal body must always display from the top (`scrollTop = 0`).
3. **No Unintended Scrolling from Inactive Tabs**: In `NotesPanel`, background events in the AI Chat tab (such as chat history retrieval or message state updates) must never scroll the panel or page while the user is viewing or generating a summary.

## Tech Stack
- **Frontend**: React 19 (Vite), Lucide-react, Vanilla CSS
- **App Wrapper**: Electron / Modern Web Browser (Chromium)
- **Backend**: Node.js, Express

## Commands
- **Frontend Dev**: `npm run dev --prefix frontend`
- **Backend Dev**: `npm run dev --prefix backend`
- **Full Dev Concurrent**: `npm run dev`
- **Lint**: `npm run lint --prefix frontend`
- **Build**: `npm run build --prefix frontend`

## Project Structure
- `frontend/src/components/NotesPanel.jsx` — Lesson summary container, chat scroll listener, tab switching logic.
- `frontend/src/components/ChapterSummaryModal.jsx` — Chapter summary modal scroll container, tab switching, summary generation handlers.

## Code Style
- Use standard React hooks (`useRef`, `useEffect`, `useCallback`).
- Surgical changes only: do not touch markdown rendering, AI API endpoints, or search highlighting logic.
- Example scroll reset:
```jsx
// Reset scroll to top when summary changes or when switching to summary tab
useEffect(() => {
  if (activeTab === 'summary' && summaryContentRef.current) {
    summaryContentRef.current.scrollTop = 0;
  }
}, [summary, activeTab]);
```
- Example chat scroll guard:
```jsx
// Scroll chat to bottom ONLY when chat tab is currently active
useEffect(() => {
  if (activeTab === 'chat' && chatEndRef.current) {
    chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }
}, [chatMessages, chatLoading, activeTab]);
```

## Testing Strategy
- **Manual Verification (Lesson Summary)**:
  1. Open a lesson with a long summary (or click "Generate Summary" on an unsummarized lesson).
  2. While summary is generating or upon loading, verify that once the text appears, the scroll position is at the very top (first header/paragraph visible, not scrolled to the bottom).
  3. Scroll down to the bottom of the summary, switch to another tab (e.g. "Notes" or "Content"), then switch back to "Summary": verify it displays from the top or preserves user position appropriately, and newly generated summaries reset to top.
  4. Verify that background chat loading (`/api/chat-history`) does not cause the summary view or panel to scroll down.
  5. In AI Chat tab, verify auto-scroll to latest message still works smoothly when new chat messages arrive.
  6. In Summary tab, press `Cmd/Ctrl + F`, search for a keyword, and verify active match scrolling still works as expected.
- **Manual Verification (Chapter Summary Modal)**:
  1. Click "Chapter Summary" on a section in the sidebar.
  2. Click "Generate Chapter Summary" (or let cached summary load).
  3. Verify the modal content displays from the very top (`scrollTop = 0`), not scrolled to the bottom.
  4. Switch between "Summary" and "Chat" tabs within the modal: verify summary stays at top and chat scrolls to bottom.
- **Automated Verification**:
  - `npm run lint --prefix frontend` passes with 0 warnings/errors.
  - `npm run build --prefix frontend` builds successfully without errors.

## Boundaries
- **Always**:
  - Guard `chatEndRef.current.scrollIntoView()` strictly with `activeTab === 'chat'` in `NotesPanel.jsx` (matching the existing guard in `ChapterSummaryModal.jsx`).
  - Reset `scrollTop = 0` on `summaryContentRef.current` when summary is loaded, newly generated, or when navigating to a new lesson.
  - Reset `scrollTop = 0` on the chapter summary scroll container when a chapter summary is loaded or generated.
  - Retain existing search match auto-scroll functionality (`scrollIntoView` for active search match) in the Summary tab.
- **Ask first**:
  - Altering markdown parsing rules, chat history persistence, or backend summarization APIs.
- **Never**:
  - Break chat auto-scroll when the user is actively on the AI Chat tab.
  - Introduce horizontal scrollbars or layout shifts in the right panel or modal.

## Success Criteria
- [ ] In `NotesPanel.jsx`, `chatEndRef.current.scrollIntoView` is only invoked when `activeTab === 'chat'`.
- [ ] In `NotesPanel.jsx`, when `summary` completes generation or is loaded from cache/lesson change, the summary container (`summaryContentRef`) is scrolled to the top (`scrollTop = 0`).
- [ ] In `ChapterSummaryModal.jsx`, a ref is added to the scrollable body, and its scroll position is reset to the top (`scrollTop = 0`) when a summary is generated or loaded.
- [ ] In-summary search navigation (`Cmd/Ctrl+F`) continues to scroll matched items into view properly.
- [ ] All lint and build checks pass cleanly without regression.

## Open Questions
- None. (Both Lesson Summary and Chapter Summary are in scope, and requirement is confirmed as scrolling to top upon completion).
