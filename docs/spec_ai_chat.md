# Spec: Unified AI Chat Learning Assistant

## 1. Objective

Provide an integrated, context-aware AI Chat learning assistant for the local Udemy Course Player inside the right-hand `NotesPanel`. The assistant acts as an offline-first AI tutor that allows learners to ask questions, clarify confusing concepts, explore code examples, and navigate course materials effectively.

### User Decisions (Validated)
1. **UI Location**: Integrated into `NotesPanel.jsx` with an intuitive scope selector (`Lesson` / `Chapter` / `Course`).
2. **Communication Protocol**: Non-streaming JSON requests (reliable, simple, uniform across all AI providers).
3. **History Persistence**: Persisted on disk in `progress_db.json` per course and scope key so learning conversations survive lesson switches and app restarts.

### User Stories
- **Multi-Scope Learning**:
  - **Lesson Scope**: Ask questions about specific code, explanations, or concepts in the active video lesson grounded in its subtitle transcript and current playback position.
  - **Chapter Scope**: Synthesize high-level topics across all lessons in the current section grounded in the chapter summary and all subtitle transcripts.
  - **Course Scope**: Ask syllabus-wide questions (e.g., *"Which lesson covers authentication?"* or *"What prerequisites do I need for section 3?"*) grounded in the entire curriculum structure and cached section summaries.
- **Interactive Video Timestamps**: When the AI cites a timestamp (e.g. `[04:15]`), students can click the badge to seek the video player to that exact time.
- **Rich Code & Markdown**: Answers render formatted markdown with syntax-styled code blocks and a 1-click "Copy Code" button.
- **Persistent Sessions**: Chat history is preserved per scope key in `progress_db.json` with a dedicated "New Chat" button to reset the current scope.
- **Web Search Augmentation**: Toggleable live web search support across compatible AI providers for current information beyond course recording dates.

---

## 2. Tech Stack

- **Frontend**: React 19.x, Vite 8.x, Lucide-React icons, CSS Variables (`frontend/src/index.css`)
- **Backend**: Node.js & Express 4.19+ (CommonJS) running on `http://127.0.0.1:3003`
- **Database**: `backend/progress_db.json` (local JSON store with atomic file writes)
- **AI Engine**: Existing unified `callAiProvider` (Gemini, Claude, OpenAI) in `backend/server.js`
- **Desktop**: Electron 42.x shell

---

## 3. Executable Commands

| Task | Command |
|---|---|
| **Dev Environment** (concurrent backend + frontend) | `npm run dev` |
| **Run Backend Only** | `npm run backend` |
| **Run Frontend Only** | `npm run frontend` |
| **Frontend Lint Check** | `npm run lint --prefix frontend` |
| **Frontend Production Build** | `npm run build --prefix frontend` |
| **Desktop Application Packaging** | `npm run package` |

---

## 4. Project Structure

```
udemy-player/
├── backend/
│   ├── server.js               # API endpoints (/api/chat-lesson, /api/chat-chapter, /api/chat-course, /api/userdata/chat)
│   ├── progress_db.json        # User progress, notes, and chat history store
│   └── lib/
│       ├── subtitle.js         # Subtitle parsing & timestamp extraction
│       └── web-search.js       # Web search provider integration
├── frontend/
│   └── src/
│       ├── App.jsx             # Passes coursePath, onSeek, currentTime to NotesPanel
│       ├── components/
│       │   ├── NotesPanel.jsx  # Chat tab with scope selector (Lesson/Chapter/Course), persistence, and UI
│       │   ├── VideoPlayer.jsx # Video playback element responding to seek requests
│       │   └── markdown.jsx    # Markdown renderer with code blocks, copy button & timestamp seek badges
│       └── index.css           # Chat bubbles, scope badges, timestamp buttons, code blocks
└── docs/
    ├── spec_ai_chat.md         # Specification document (Phase 1)
    ├── plan_ai_chat.md         # Technical implementation plan (Phase 2)
    └── tasks_ai_chat.md        # Atomic task breakdown (Phase 3)
```

---

## 5. Architectural & API Specification

### 5.1 Chat Endpoints

#### 1. `POST /api/chat-lesson` (Updated)
- Accepts: `{ subtitlePath, messages, enableWebSearch, currentTime }`
- Grounding: Lesson subtitle content + current playback time marker.
- System instruction prompts model to cite timestamps `[MM:SS]` when referring to video moments.

#### 2. `POST /api/chat-chapter` (Existing)
- Accepts: `{ sectionPath, messages, langCode, enableWebSearch, lessons }`
- Grounding: Cached `section.summary.<lang>.txt` + concatenated lesson subtitles.

#### 3. `POST /api/chat-course` (New)
- Accepts: `{ coursePath, messages, enableWebSearch, sections }`
- Grounding: Assembles full syllabus hierarchy (sections + lesson titles/durations) + any available section summaries (`section.summary.*.txt`).
- System prompt instructs model to act as a curriculum advisor: guide student where concepts are taught, roadmap recommendations, and topic lookup.

### 5.2 Persistence in `progress_db.json`

#### 1. Data Schema
```json
{
  "chatHistory": {
    "<coursePath>": {
      "lesson:<lessonId>": [
        { "role": "user", "content": "What is state?", "timestamp": 1727100000 },
        { "role": "assistant", "content": "At [03:20]...", "timestamp": 1727100005, "sources": [] }
      ],
      "chapter:<sectionTitle>": [...],
      "course": [...]
    }
  }
}
```

#### 2. Persistence Endpoints
- `GET /api/userdata/chat?coursePath=...&scopeKey=...`: Fetch saved chat history.
- `POST /api/userdata/chat`: `{ coursePath, scopeKey, messages }` — Saves chat history.
- `DELETE /api/userdata/chat`: `{ coursePath, scopeKey }` — Clears chat history for current scope.

### 5.3 Interactive Timestamps & Video Seeking
- Assistant is prompted to include timestamps in square brackets: `[MM:SS]` or `[HH:MM:SS]`.
- Frontend `markdown.jsx` parses `\[(\d{1,2}:\d{2}(?::\d{2})?)\]` into clickable `<button className="chat-timestamp-badge">⏱️ MM:SS</button>`.
- Clicking invokes `onSeek(seconds)` prop passed from `App.jsx` to `NotesPanel.jsx`.

### 5.4 Rich Code Block Rendering
- Code blocks (```` ```lang ... ``` ````) are parsed and rendered with:
  - Header showing the language (e.g. `javascript`, `python`, `bash`)
  - "Copy" button with transient "Copied!" feedback
  - Monospace font and dark code background with syntax spacing

---

## 6. Code Style & Example Snippet

```jsx
// Frontend: Parsing code blocks and timestamps in chat messages
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="chat-code-block">
      <div className="chat-code-header">
        <span>{language || 'code'}</span>
        <button onClick={handleCopy} className="chat-code-copy-btn">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}
```

---

## 7. Testing Strategy

| Level | Concern | Method |
|---|---|---|
| **API Validation** | Path traversal, missing parameters, error status codes | Direct test calls to `/api/chat-course`, `/api/userdata/chat` |
| **Persistence** | Reloading page preserves conversation history per scope | Verify `progress_db.json` writes and UI rehydration |
| **Seeking** | Clicking timestamp badge moves video playback position | Click `[02:15]` badge and verify player's `currentTime` changes |
| **Scope Switch** | Switching between Lesson, Chapter, and Course isolates chat history | Verify each scope retains its own message thread |
| **Lint & Build** | Frontend and Backend lint and packaging pass | `npm run lint --prefix frontend` && `npm run build --prefix frontend` |

---

## 8. Boundaries

### Always Do
- Validate all incoming file/dir paths using `validateSubtitlePath`.
- Isolate chat history by scope key so Lesson, Chapter, and Course discussions don't bleed into each other.
- Allow user to clear chat history with "New Chat".
- Keep UI responsive and non-blocking during network calls.

### Ask First
- Adding external heavy npm libraries (maintain lightweight zero-dependency regex parsers).
- Changing DB structure for non-chat keys.

### Never Do
- Block video playback when AI is generating.
- Leak API keys or write unauthorized files outside the DB file.

---

## 9. Success Criteria

- [ ] Chat tab in `NotesPanel.jsx` has a Scope Selector: `Lesson`, `Chapter`, and `Course`.
- [ ] Each scope loads and persists its conversation history from/to `progress_db.json`.
- [ ] "New Chat" button clears the active scope's conversation both in UI and on disk.
- [ ] AI responses in all scopes render markdown with code blocks (and 1-click Copy button).
- [ ] Timestamps formatted like `[02:45]` render as clickable badges that seek the video.
- [ ] Course scope accurately answers questions about what sections/lessons cover specific topics.
- [ ] `npm run lint --prefix frontend` and `npm run build --prefix frontend` pass with 0 errors.
