# Technical Implementation Plan: Video Summarization and AI Chat

This document details the step-by-step technical plan for adding the video summarization and AI chat capabilities to the Udemy Offline Player.

## 1. Major Components & Dependencies

### Backend APIs (`backend/server.js`)
We will add three endpoints:
1. `POST /api/summarize-lesson`:
   - Checks if a summary is already cached on disk next to the subtitle file (`[base].summary.[lang].txt`).
   - If cached: Reads and returns it immediately.
   - If not: Reads the subtitle file, constructs a summarization prompt, calls the Gemini API, saves the response to disk, and returns the summary.
2. `POST /api/clear-summary`:
   - Deletes the cached summary file to allow regeneration.
3. `POST /api/chat-lesson`:
   - Takes a list of chat messages and the subtitle path.
   - Reads the subtitle file to serve as grounding context.
   - Feeds context + messages to the Gemini API and returns the response.

### Frontend Component Refactoring (`frontend/src/components/NotesPanel.jsx`)
We will rename/refactor `NotesPanel.jsx` to act as a multi-tab sidebar panel (`NotesPanel` or a wrapper that manages `Notes`, `Summary`, and `Chat` states).
- **Tab State**: `activeRightTab` ('notes', 'summary', 'chat').
- **Summary Component View**:
  - Displays loading states, markdown text rendering, "Generate" / "Regenerate" buttons.
- **Chat Component View**:
  - Displays message bubbles (User/AI).
  - Scrollable feed.
  - Input field for user queries.
  - Keeps message history state in React.

### Frontend App Integration (`frontend/src/App.jsx`)
- Pass the current active lesson subtitle paths (which includes the current selected subtitle track language) to the right-side panel.

### Styles (`frontend/src/index.css`)
- Styled tab buttons.
- Message bubbles (sleek dark colors, left/right alignments).
- Summary display styling.

---

## 2. Implementation Order

1. **Phase A: Backend Endpoints**
   - Implement the file reading and caching logic.
   - Write standard REST calls to Gemini generateContent.
   - Manually test endpoints using simple fetch requests.
2. **Phase B: CSS Additions**
   - Define styles for tabs, bubbles, and prompt panels.
3. **Phase C: UI Refactoring**
   - Refactor `NotesPanel` to support the tab system.
   - Build `SummaryTab` and `ChatTab` inline subcomponents or helper functions.
4. **Phase D: App Integration**
   - Connect active video subtitle track state from player to the panel.
   - Wire everything together and verify.

---

## 3. Risks & Mitigations
- **Risk: Large Subtitle File Context Size**
  - *Mitigation*: Udemy lessons are typically shorter than 30 minutes, so subtitle transcripts are small (well within Gemini's 1M token limit). If needed, strip VTT/SRT timing tokens to save space.
- **Risk: API Failures / Bad Keys**
  - *Mitigation*: Handle status codes cleanly, notify user in UI, display links to Settings.

---

## 4. Verification Checkpoints

- **Checkpoint 1 (Backend)**: Verify curl requests return the expected output and cache summary files properly.
- **Checkpoint 2 (UI tabs)**: Verify tabs transition without layout jumps.
- **Checkpoint 3 (Summarize)**: Verify generation creates the files and re-rendering loads instantly.
- **Checkpoint 4 (Chat)**: Verify conversational questions about the transcript are answered accurately.
