# Implementation Plan: Chapter AI Chat

## 1. Overview
Add an interactive **AI Chat** interface to the chapter summary experience, allowing students to converse with AI about an entire course section. Grounded in both the generated chapter summary and aggregated lesson transcripts, with an optional Web Search toggle.

---

## 2. Major Components & Implementation Order

### Step 1: Backend Route (`POST /api/chat-chapter`)
- **File**: `backend/server.js`
- **Actions**:
  1. Add `app.post('/api/chat-chapter', async (req, res) => { ... })`.
  2. Validate `sectionPath` with `validateSubtitlePath`.
  3. Validate `messages` array and required parameters.
  4. Fetch AI configuration with `getAiConfig(db)`. Return early with friendly error if API key is missing.
  5. Check for cached chapter summary file (`section.summary.${langLower}.txt`) and read if present.
  6. Aggregate lesson transcripts from provided `lessons` array (or directory fallback), stripping timestamps and tags using `getCleanSubtitleText`.
  7. Construct system instruction grounding AI in the chapter title, summary, and transcripts.
  8. If `enableWebSearch` is true, append web search instructions.
  9. Invoke `callAiProvider(config, null, { isChat: true, messages, systemInstruction, enableWebSearch, returnSources: true })`.
  10. Return `{ success: true, reply, sources }`.
- **Checkpoint / Verification**:
  - Test endpoint with test script or `curl` to verify response format and status codes.

### Step 2: Frontend Tabbed Interface & Chat UI
- **File**: `frontend/src/components/ChapterSummaryModal.jsx`
- **Actions**:
  1. Import additional icons: `MessageSquare`, `Globe`, `Send`, `Trash2`, `ExternalLink`.
  2. Add state variables:
     - `activeTab`: `'summary' | 'chat'`
     - `chatMessages`: array of messages
     - `chatInput`: current text input
     - `chatLoading`: boolean
     - `chatError`: string or null
     - `webSearchEnabled`: boolean (default false)
  3. Add `chatEndRef` and `chatInputRef` for auto-scroll and input focus.
  4. Implement `handleChatSubmit` calling `POST /api/chat-chapter`.
  5. Implement `handleNewChat` to clear message history.
  6. Reset chat messages when `section.id` changes.
  7. Add tab switcher in the header/toolbar:
     - `[Summary]` tab
     - `[AI Chat]` tab (with message count badge if messages exist)
  8. Build the Chat view:
     - Sub-toolbar with grounding badge, `Web Search: ON/OFF` toggle, and "New Chat" button.
     - Scrollable chat log rendering user bubbles, assistant bubbles (using `renderMarkdown`), web sources, and loading spinner.
     - Bottom input bar with input field, send button, and `Enter` key handling.
- **Checkpoint / Verification**:
  - Verify tab switching works smoothly.
  - Verify sending a message renders reply and sources.
  - Verify Web Search toggle works.

### Step 3: Verification & Linting
- **Actions**:
  1. Run `npm run lint --prefix frontend`.
  2. Run `npm run build --prefix frontend`.
  3. Perform end-to-end verification.
- **Checkpoint / Verification**:
  - 0 lint errors, clean Vite production build.

---

## 3. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Large chapters exceed AI token limit | Truncate aggregated subtitle transcripts to 400,000 characters (same proven ceiling as `/api/summarize-section`). |
| Missing subtitles for some lessons | Gracefully skip lessons without subtitles and use available lesson transcripts. |
| Memory leaks / state bleed between chapters | Clear chat history when opening a different chapter section. |
| Modal height / scroll jumping | Fixed modal height with independent scroll containers for summary vs. chat log. |
