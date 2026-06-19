# Task List: Video Summarization and AI Chat

Here is the discrete task list for the implementation.

## Tasks

- [ ] **Task 1: Backend AI Summarization & Chat Endpoints**
  - **Description**: Add `/api/summarize-lesson`, `/api/clear-summary`, and `/api/chat-lesson` endpoints in `backend/server.js`.
  - **Acceptance**:
    - Summarize endpoint finds or caches `.summary.[lang].txt` files next to subtitle files.
    - Chat endpoint reads subtitle files and uses it to answer quick questions using Gemini API.
    - Gracefully handles missing Gemini API keys or missing subtitle files.
  - **Verify**: Run curl queries or check behavior via manual testing of routes.
  - **Files**: `backend/server.js`

- [ ] **Task 2: CSS Layout & Styles for Multi-Tab Panel & Chat bubbles**
  - **Description**: Implement UI styles in `frontend/src/index.css` for panel tabs, chat bubble lines, status messages, and Markdown typography.
  - **Acceptance**: Beautiful styles fitting the offline Udemy player's deep-blue glassmorphic dark theme.
  - **Verify**: Open interface in browser.
  - **Files**: `frontend/src/index.css`

- [ ] **Task 3: Refactor NotesPanel into a Tabbed RightPanel**
  - **Description**: Update `frontend/src/components/NotesPanel.jsx` to feature three tabs: "Notes", "Summary", "AI Chat".
  - **Acceptance**:
    - "Notes" tab retains all original features.
    - "Summary" tab features a "Generate Summary" state, loading spinner, and the rendered summary.
    - "AI Chat" tab features message lists, scrollable feed, input text area, and loading indicator.
  - **Verify**: Switch tabs in player right sidebar, verify no crash, clean layout.
  - **Files**: `frontend/src/components/NotesPanel.jsx`

- [ ] **Task 4: Coordinate App State & Current Subtitle Path**
  - **Description**: Connect the active subtitle track (language + path) from `VideoPlayer.jsx` and `App.jsx` to the newly refactored right panel.
  - **Acceptance**:
    - Summary and Chat load context dynamically using the active subtitle track's file path.
    - Switching subtitle languages dynamically changes the summary file track.
  - **Verify**: Play video, translate to a different language, verify right sidebar summary/chat target that language track.
  - **Files**: `frontend/src/App.jsx`, `frontend/src/components/VideoPlayer.jsx`
