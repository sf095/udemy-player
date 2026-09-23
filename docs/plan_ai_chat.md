# Technical Implementation Plan: Unified AI Chat Learning Assistant

## 1. Major Components & Dependencies

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (React 19)                  │
├────────────────────────────────────────────────────────┤
│  App.jsx                                               │
│    └─ Passes coursePath, onSeek, currentTime           │
│         │                                              │
│         ▼                                              │
│  NotesPanel.jsx (AI Chat Tab)                          │
│    ├─ Scope Switcher: [Lesson | Chapter | Course]      │
│    ├─ Chat History State & Sync                        │
│    ├─ Prompt Bar & Web Search Toggle                   │
│    └─ Message List                                     │
│         │                                              │
│         ▼                                              │
│  markdown.jsx                                          │
│    ├─ CodeBlock (Syntax style + Copy button)           │
│    └─ Clickable Timestamp Badges (calls onSeek)        │
└────────────────────────────────────────────────────────┘
                           │
                    REST API (JSON)
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 Backend (Express.js)                   │
├────────────────────────────────────────────────────────┤
│  server.js                                             │
│    ├─ POST /api/chat-lesson (Enhanced w/ currentTime)  │
│    ├─ POST /api/chat-chapter (Existing)                │
│    ├─ POST /api/chat-course (New syllabus context)     │
│    ├─ POST /api/userdata/chat (Save scope messages)    │
│    ├─ GET  /api/userdata/chat (Load scope messages)    │
│    └─ DELETE /api/userdata/chat (Clear scope messages) │
│                                                        │
│  progress_db.json                                      │
│    └─ Local chatHistory data store                     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Implementation Order

The implementation is broken down sequentially to ensure each layer is verified before building on top of it:

### Step 1: Backend Persistence & Endpoints
1. Add `chatHistory` storage schema and helper methods to `backend/server.js`.
2. Add routes:
   - `GET /api/userdata/chat`
   - `POST /api/userdata/chat`
   - `DELETE /api/userdata/chat`
3. Add `POST /api/chat-course` endpoint to assemble course curriculum (sections, lessons, section summaries) and query `callAiProvider`.
4. Update `POST /api/chat-lesson` to accept optional `currentTime` parameter and prompt for timestamp citations (`[MM:SS]`).

### Step 2: Markdown & Rich Message Rendering
1. Enhance `frontend/src/components/markdown.jsx`:
   - Implement `renderChatMessage(text, { onSeekTo })` supporting headers, bolding, lists, and code blocks with a copy button.
   - Parse `[MM:SS]` and `[HH:MM:SS]` into clickable badge elements calling `onSeekTo(seconds)`.
2. Add CSS styles in `frontend/src/index.css` for `.chat-timestamp-badge`, `.chat-code-block`, and scope selector pills.

### Step 3: Frontend Integration in NotesPanel
1. In `frontend/src/App.jsx`, ensure `coursePath` is passed down to `NotesPanel`.
2. In `frontend/src/components/NotesPanel.jsx`:
   - Add scope selector state: `chatScope` (`'lesson'` | `'chapter'` | `'course'`).
   - Automatically determine the active scope key:
     - Lesson: `lesson:<activeLesson.id>`
     - Chapter: `chapter:<activeSection.title || sectionPath>`
     - Course: `course:<coursePath>`
   - Implement loading and autosaving of chat history for the active scope key.
   - Connect message dispatching to `/api/chat-lesson`, `/api/chat-chapter`, or `/api/chat-course` based on `chatScope`.
   - Connect timestamp badge clicks to `onSeek(seconds)`.
   - Update "New Chat" button to clear current scope history from local state and `progress_db.json`.

---

## 3. Risks & Mitigation Strategies

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **Large Course Context Exceeds Token Limits** | AI provider rejects request or incurs excessive latency | For `/api/chat-course`, include full structure of sections and lesson titles, but only load existing short summaries for sections; cap total context at 150,000 chars. |
| **Malformed / Hallucinated Timestamps** | Clicking badge seeks to invalid time or crashes player | Validate parsed seconds: must be finite number `0 <= seconds <= activeLesson.duration`. If duration is unknown or invalid, disable seek or guard safely. |
| **Race Conditions in Chat Persistence** | Fast typing or multiple calls overwrite messages | Save the full array of messages for the active key; perform atomic file writes in `writeDb()`. |
| **Stale Chat on Lesson Switch** | User confused about what lesson chat belongs to | Key chat messages strictly by `scopeKey` (`lesson:<id>`). When `activeLesson.id` or `chatScope` changes, immediately switch to that scope's stored conversation. |

---

## 4. Parallel vs. Sequential Streams

- **Sequential**:
  1. Backend routes must be in place before frontend can test real end-to-end chat.
  2. `markdown.jsx` timestamp parser must be ready before testing video seeking from chat bubbles.
- **Can be built in parallel (or separate commits)**:
  - Backend persistence endpoints (`/api/userdata/chat`) can be implemented alongside `markdown.jsx` changes.

---

## 5. Verification Checkpoints

- **Checkpoint 1 (Backend)**: Verify curl requests to `/api/chat-course`, `/api/userdata/chat` return valid JSON and correctly update `progress_db.json`.
- **Checkpoint 2 (Markdown & Timestamps)**: Verify unit rendering of `[01:30]` produces a clickable badge, and code blocks display language tags and copy button.
- **Checkpoint 3 (UI Scope Switcher & Video Seeking)**: Verify in browser that toggling between Lesson, Chapter, and Course isolates messages; clicking a timestamp badge seeks the video player; refreshing retains messages.
- **Checkpoint 4 (Lint & Build)**: `npm run lint --prefix frontend` and `npm run build --prefix frontend` pass with zero warnings/errors.
