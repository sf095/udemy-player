# Tasks: Chapter AI Chat

## Phase 3: Task Breakdown

- [x] **Task 1: Implement `/api/chat-chapter` endpoint in backend**
  - **Acceptance**: Backend exposes `POST /api/chat-chapter` taking `sectionPath`, `messages`, `langCode`, `enableWebSearch`, and `lessons`. Aggregates cached summary if present and lesson transcripts, constructs system instruction, calls `callAiProvider`, and returns `{ success: true, reply, sources }`.
  - **Verify**: Run node verification script against `http://localhost:3003/api/chat-chapter` or mock test.
  - **Files**: `backend/server.js`

- [x] **Task 2: Build Tabbed Navigation in `ChapterSummaryModal.jsx`**
  - **Acceptance**: Modal header/toolbar features two distinct tabs: `[Summary]` and `[AI Chat]`. Clicking tabs switches views while maintaining modal state and size.
  - **Verify**: Visual check and state switching without layout shifts.
  - **Files**: `frontend/src/components/ChapterSummaryModal.jsx`

- [x] **Task 3: Build Chat View & Message List in `ChapterSummaryModal.jsx`**
  - **Acceptance**: When in `chat` tab, displays sub-toolbar (grounding indicator, `Web Search` toggle, `New Chat` button), scrollable message history with user and assistant markdown bubbles, citation sources if available, and loading state.
  - **Verify**: Chat messages render properly, markdown formats as expected, sources link externally.
  - **Files**: `frontend/src/components/ChapterSummaryModal.jsx`

- [x] **Task 4: Implement Chat Submission & Reset Handlers**
  - **Acceptance**: Input field and submit button dispatch `POST /api/chat-chapter`, update message history, handle errors gracefully, and support resetting conversation via "New Chat". Chat history resets when changing `section.id`.
  - **Verify**: Submit queries, check response bubbles, test "New Chat" clearing, test auto-focus.
  - **Files**: `frontend/src/components/ChapterSummaryModal.jsx`

- [x] **Task 5: Quality Gates & Verification**
  - **Acceptance**: Frontend lints without errors (`npm run lint --prefix frontend`) and builds cleanly (`npm run build --prefix frontend`).
  - **Verify**: Execute lint and build commands in terminal.
  - **Files**: None (verification across project)
