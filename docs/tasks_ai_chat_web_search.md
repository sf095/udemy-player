# Tasks: AI Chat Web Search Integration

- [x] Task 1: Create standalone web search helper
  - Acceptance: `backend/lib/web-search.js` exports `searchWeb(query, maxResults)` which queries DuckDuckGo and returns an array of `{ title, snippet, url }` with no external dependencies.
  - Verify: Run a standalone Node.js test script to verify clean extraction and graceful error handling on network failure.
  - Files: `backend/lib/web-search.js`

- [x] Task 2: Update Gemini API caller for search grounding
  - Acceptance: `callGemini` accepts `tools` parameter; if Google Search grounding is passed, it extracts `groundingMetadata.groundingChunks` (titles and URLs) and returns `{ text, sources }`.
  - Verify: Call `callGemini` with `tools: [{ googleSearch: {} }]` and confirm text and sources format.
  - Files: `backend/server.js`

- [x] Task 3: Update `callAiProvider` and `/api/chat-lesson` endpoint
  - Acceptance: `/api/chat-lesson` accepts `enableWebSearch: boolean`. For Gemini, it passes the `googleSearch` tool. For OpenAI/Claude, it invokes `searchWeb` for the latest query and supplies web context + sources. Both return `{ success: true, reply, sources }`.
  - Verify: Send test POST requests to `/api/chat-lesson` with `enableWebSearch: false` and `enableWebSearch: true`.
  - Files: `backend/server.js`

- [x] Task 4: Add Web Search toggle and citation display to Chat UI
  - Acceptance: `frontend/src/components/NotesPanel.jsx` contains a `[🌐 Web Search]` toggle button. When enabled, sends `enableWebSearch: true`. Assistant messages render clickable source links underneath if sources are returned.
  - Verify: Frontend compiles with zero errors and state changes are visible in UI.
  - Files: `frontend/src/components/NotesPanel.jsx`

- [x] Task 5: End-to-end verification and build check
  - Acceptance: Frontend builds without errors (`npm run build --prefix frontend`). Both search ON and search OFF work as expected.
  - Verify: `npm run build --prefix frontend` succeeds.
  - Files: `docs/tasks_ai_chat_web_search.md`
