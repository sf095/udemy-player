# Tasks: Unified AI Chat Learning Assistant

## Task List

- [x] Task 1: Backend Chat Persistence API
  - Acceptance: `GET /api/userdata/chat`, `POST /api/userdata/chat`, and `DELETE /api/userdata/chat` correctly read, write, and clear conversations in `progress_db.json` keyed by `coursePath` and `scopeKey`.
  - Verify: Test curl requests for POST, GET, and DELETE, checking `progress_db.json` on disk.
  - Files: `backend/server.js`

- [x] Task 2: Course-Level Chat Endpoint & Enhanced Lesson Grounding
  - Acceptance: `POST /api/chat-course` handles course syllabus questions with structured section & lesson overviews. `POST /api/chat-lesson` accepts optional `currentTime` and instructs model to cite timestamps `[MM:SS]`.
  - Verify: Test curl requests against `/api/chat-course` and `/api/chat-lesson` verifying successful JSON responses.
  - Files: `backend/server.js`

- [x] Task 3: Rich Markdown & Interactive Timestamp Seeking Renderer
  - Acceptance: `renderChatMessage` in `markdown.jsx` renders markdown formatting, code blocks with a "Copy" button, and converts `[MM:SS]` into clickable `<button>` elements calling `onSeekTo(seconds)`.
  - Verify: Check rendering in UI; verify clicking a badge seeks the video player; verify CSS in `index.css`.
  - Files: `frontend/src/components/markdown.jsx`, `frontend/src/index.css`

- [x] Task 4: Connect Course Path & Props to NotesPanel
  - Acceptance: `coursePath` is passed from `App.jsx` to `NotesPanel.jsx`, ensuring full context is available for all scopes.
  - Verify: Verify prop is received in `NotesPanel.jsx` without breaking existing player functionality.
  - Files: `frontend/src/App.jsx`

- [x] Task 5: NotesPanel Scope Switcher & Persistent Chat Integration
  - Acceptance: The Chat tab in `NotesPanel.jsx` includes a Scope Selector (`Lesson` | `Chapter` | `Course`). Each scope maintains its own persistent conversation loaded from and saved to disk. "New Chat" clears the active scope.
  - Verify: Switch between scopes, send messages, change lessons, and reload to confirm conversations persist accurately and reset on "New Chat".
  - Files: `frontend/src/components/NotesPanel.jsx`

- [x] Task 6: Final Verification, Lint & Build
  - Acceptance: All linting rules and production builds pass with 0 errors.
  - Verify: Run `npm run lint --prefix frontend` and `npm run build --prefix frontend`.
  - Files: All touched files

- [x] Task 7: Scope Simplification for Right Sidebar AI Chat
  - Acceptance: Removed "Chapter" and "Course" scope selector pills from `NotesPanel.jsx`. The AI Chat in the right panel is strictly focused on the current active lesson and its transcript subtitles. Unused `activeSection` prop removed.
  - Verify: Checked `NotesPanel.jsx` and `App.jsx`, verified with `npm run build --prefix frontend`.
  - Files: `frontend/src/components/NotesPanel.jsx`, `frontend/src/App.jsx`

