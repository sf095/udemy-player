# Spec: New Chat Button in AI Chat

## Objective
Add a "New Chat" button to the AI Chat tab in the Udemy Offline Player. This button will allow users to clear the current chat history, reset the input field, clear any error messages, and start a fresh session context grounded in the subtitles of the current lesson.

## Tech Stack
- Frontend: React 19, Vite, Vanilla CSS, Lucide React (for icons)
- Backend: Express, Node.js (stateless API endpoint `/api/chat-lesson`)

## Commands
- Run whole app in dev mode: `npm run dev`
- Run frontend only: `npm run dev --prefix frontend`
- Run backend only: `npm run dev --prefix backend`

## Project Structure
- `frontend/src/components/NotesPanel.jsx` — Contains the sidebar layout, the AI Chat tab UI, state, and API request logic.

## Code Style
- React hooks (`useState`, `useRef`, `useCallback`)
- Clean JSX with semantic HTML
- Inline styles using the app's predefined CSS custom properties (variables) like `var(--border-color)`, `var(--text-secondary)`, `var(--primary)`, and `var(--transition-fast)`.
- Use Lucide React icons for visual consistency.

## Testing Strategy
- **Manual verification**:
  1. Open a course, select a lesson, and ensure subtitles are loaded.
  2. Switch to the **AI Chat** tab.
  3. Send one or more questions to the AI, receiving replies.
  4. Verify that the "New Chat" button is visible and active.
  5. Click the "New Chat" button.
  6. Confirm that:
     - The chat feed is cleared (resets to empty/grounding explanation state).
     - The chat input is cleared.
     - The chat input field is focused.
     - Any previous chat errors are cleared.
     - Sending a new message still works correctly.

## Boundaries
- **Always do**: Use existing theme colors and styling tokens. Ensure input focus is restored to the input text field after clicking "New Chat".
- **Ask first**: If we need to persist chat history to disk (currently, we assume client-only transient chat history is desired).
- **Never do**: Modify or clear the "Notes" or "Summary" tabs/states when resetting the chat.

## Success Criteria
- [x] A styled "New Chat" button is added to the AI Chat tab (only visible when subtitles and API key are available).
- [x] Clicking the button triggers a function that resets `chatMessages` to `[]`, `chatInput` to `''`, and `chatError` to `null`.
- [x] Clicking the button automatically focuses the chat input field.
- [x] The button uses a Lucide icon (e.g., `Plus` or `Trash2` or `RefreshCw`) and styled to fit the modern player interface.
- [x] Switching lessons continues to clear the chat automatically (pre-existing behavior).
