# Spec: Chapter AI Chat

## Objective
Provide users with an interactive AI Chat interface for entire course chapters (sections) within the `ChapterSummaryModal`. Students can ask high-level overview questions or deep-dive into specific concepts across all lessons in a chapter, grounded in both the generated chapter summary and the lesson subtitle transcripts, with optional live web search.

### User Stories
- As a student, I want to ask questions about an entire chapter's content in a conversational AI chat, so I can synthesize complex concepts across multiple lessons without asking lesson-by-lesson.
- As a student, I want the AI to answer using both the chapter summary and the underlying lesson transcripts, so that answers are both conceptually accurate and grounded in specific lesson details.
- As a student, I want an optional Web Search toggle so the AI can bring in up-to-date industry documentation or external explanations when the course material requires further context.
- As a student, I want to switch easily between reading the Markdown summary and chatting with AI within the same modal dialog.

---

## Tech Stack
- **Backend**: Node.js, Express.js (CommonJS) running on `http://127.0.0.1:3003`
- **Frontend**: React 19, Vite, Lucide-React icons, CSS Variables
- **AI Integrations**: Existing unified `callAiProvider` supporting Google Gemini, Anthropic Claude, and OpenAI / OpenAI-compatible models

---

## Commands
- **Dev**: `npm run dev` (starts backend on port 3003 and frontend Vite server concurrently)
- **Frontend Build**: `npm run build --prefix frontend`
- **Frontend Lint**: `npm run lint --prefix frontend`
- **Backend Test / Run**: `npm run backend`
- **Desktop Pack**: `npm run package`

---

## Project Structure
- `backend/server.js`: New route `POST /api/chat-chapter` implementing context assembly (summary + aggregated subtitle transcripts) and calling `callAiProvider`.
- `frontend/src/components/ChapterSummaryModal.jsx`: Enhanced with a tabbed interface (`Summary` vs `AI Chat`), chat message history, input bar, web search toggle, new chat action, and markdown message rendering.
- `docs/spec_chapter_ai_chat.md`: This specification document.
- `docs/plan_chapter_ai_chat.md`: Implementation plan (Phase 2).
- `docs/tasks_chapter_ai_chat.md`: Task breakdown (Phase 3).

---

## Backend API Specification

### `POST /api/chat-chapter`
Conversational chat grounded in the chapter's summary and lesson subtitle transcripts.

#### Request Body
```json
{
  "sectionPath": "/path/to/course/01 - Introduction",
  "messages": [
    { "role": "user", "content": "Can you explain how the topics in this chapter connect together?" }
  ],
  "langCode": "en",
  "enableWebSearch": false,
  "lessons": [
    {
      "title": "01 - Welcome",
      "subtitle": "/path/to/course/01 - Introduction/01 - Welcome.srt",
      "subtitles": { "en": "/path/to/course/01 - Introduction/01 - Welcome.srt" }
    }
  ]
}
```

#### Response (Success: 200 OK)
```json
{
  "success": true,
  "reply": "In this chapter, the lessons build upon...",
  "sources": [
    { "title": "Example Source", "url": "https://example.com" }
  ]
}
```

#### Response (Error: 400 / 403 / 500)
```json
{
  "error": "Error description message"
}
```

#### Grounding & System Instruction Logic
1. Validate `sectionPath` via `validateSubtitlePath`.
2. Check if cached chapter summary exists at `${sectionPath}/section.summary.${langCode}.txt`. If exists, read it into memory as `chapterSummary`.
3. Aggregate clean subtitle text across all lessons in the section (matching `langCode` or fallback), with each lesson headed by `### Lesson: <title>`.
4. Truncate combined transcript text to a safe limit (e.g. 400,000 characters) if it exceeds capacity.
5. Format system instruction:
   ```text
   You are an expert offline course teaching assistant.
   The student is studying an entire chapter/section titled: "[Section Title]".

   Below is the summary of this chapter:
   [Chapter Summary]
   ---
   {chapterSummary}
   ---

   Below are the transcripts of the individual lessons in this chapter:
   ---
   {combinedTranscripts}
   ---

   Use the chapter summary and lesson transcripts to answer the student's question accurately and helpfully.
   Prioritize the course material. Keep responses clear, concise, and structured.
   Respond in the same language as the student's message unless requested otherwise.
   ```
6. If `enableWebSearch` is true, append instruction allowing search augmentation.
7. Call `callAiProvider(config, null, { isChat: true, messages, systemInstruction, enableWebSearch, returnSources: true })`.

---

## Frontend UI / UX Specification

### `ChapterSummaryModal.jsx`
1. **Modal Header Tabs**:
   - `[Summary]` tab (with `FileText` or `Sparkles` icon).
   - `[AI Chat]` tab (with `MessageSquare` icon and optional message count badge if > 0).
2. **Toolbar Behavior**:
   - In `Summary` mode: Retains language dropdown, cached status badge, and "Regenerate" button.
   - In `AI Chat` mode: Shows grounding status ("Grounded in Chapter Summary & Transcripts"), Web Search toggle button (`Globe` icon, `Web Search: ON/OFF`), and "New Chat" button (`Trash2` icon).
3. **Chat Body View**:
   - Empty state when `messages.length === 0`: Friendly prompt ("Ask anything about this chapter...").
   - Scrollable chat log:
     - User bubble: right-aligned, primary accent background (`var(--primary)`), white text.
     - Assistant bubble: left-aligned, card background (`var(--bg-hover)`), markdown formatted, web source links if available.
     - Error bubble: error warning styling with retry or error message.
   - Loading indicator: Spinner + "Formulating answer..." or "Searching web & formulating answer...".
4. **Chat Input Footer**:
   - Text input (`placeholder="Ask a question about this chapter..."`).
   - Send button (`Send` icon, disabled when input is empty or request is in flight).
   - Keyboard support: `Enter` sends message (unless `Shift+Enter` for multiline if textarea, or standard input `Enter`).
5. **State Management**:
   - Ephemeral session state: Messages, webSearch flag, and input are kept in component state so switching between "Summary" and "AI Chat" tabs preserves conversation history.
   - Closing the modal resets state or keeps it during the current course session.

---

## Code Style & Conventions
- **Frontend**: React functional component with standard hooks (`useState`, `useRef`, `useCallback`, `useEffect`).
- **Icons**: Lucide icons (`MessageSquare`, `Sparkles`, `FileText`, `Globe`, `Send`, `Trash2`, `RefreshCw`, `AlertCircle`, `ExternalLink`).
- **CSS / Styling**: Inline styles utilizing project CSS variables (`var(--primary)`, `var(--bg-main)`, `var(--bg-card)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-color)`).
- **Backend**: Express router endpoints with explicit status codes, `validateSubtitlePath` security checks, and detailed error messages.

```jsx
// Tab bar snippet
<div className="chapter-modal-tabs" style={{ display: 'flex', gap: '8px' }}>
  <button
    className={`panel-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
    onClick={() => setActiveTab('summary')}
  >
    <FileText size={14} /> Summary
  </button>
  <button
    className={`panel-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
    onClick={() => setActiveTab('chat')}
  >
    <MessageSquare size={14} /> AI Chat
  </button>
</div>
```

---

## Testing Strategy
- **Unit / Verification**:
  - Verify `/api/chat-chapter` responds with appropriate status codes (400 on missing parameters, 403 on traversal attempt, 200 on successful AI response).
  - Verify web search returns sources when enabled on compatible models.
  - Verify graceful fallback when chapter summary is not yet generated (falls back to lesson transcripts).
- **UI Testing**:
  - Verify switching between `Summary` and `AI Chat` tabs preserves conversation.
  - Verify "New Chat" clears the conversation.
  - Verify scrolling and auto-scroll to latest message.
  - Verify lint check: `npm run lint --prefix frontend`.
  - Verify build check: `npm run build --prefix frontend`.

---

## Boundaries
- **Always do:** Validate all file paths with `validateSubtitlePath`; sanitize inputs; maintain consistent styling with `NotesPanel.jsx`; keep chat responsive.
- **Ask first:** Adding new heavy npm dependencies; altering database schema or existing config structure.
- **Never do:** Write files outside the course directory; swallow AI errors without user feedback; block the UI thread.

---

## Success Criteria
- [ ] Students can click "Summarize Chapter" on any section and toggle between "Summary" and "AI Chat".
- [ ] AI answers questions with context from both the chapter summary and all lesson subtitle transcripts in the section.
- [ ] Students can toggle Web Search ON/OFF in Chapter Chat.
- [ ] "New Chat" resets conversation history cleanly.
- [ ] No layout regressions in `ChapterSummaryModal.jsx` or main app.
- [ ] `npm run lint --prefix frontend` and `npm run build --prefix frontend` pass with 0 errors.

---

## Open Questions & Confirmations
- Confirmed: Option A selected for all 4 design points (Tabs inside modal, Summary + Transcripts context, Web search toggle enabled, Ephemeral in-session chat persistence).
