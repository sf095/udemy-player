# Spec: Chapter Content Summarization (Based on Subtitles)

## Objective
Provide users with the ability to generate and view a comprehensive, structured summary of an entire course section (chapter) based on the combined subtitle transcripts of all lessons within that section.

### User Story
As a student taking a course, I want to summarize an entire chapter (section) at once, so I can review the core themes, key topics, and key takeaways covered across all lessons in that section without reading/watching each lesson individually.

---

## Technical Stack
- **Backend**: Express.js (Node.js) running locally at `http://127.0.0.1:3003`
- **Frontend**: React 19, Vite, Lucide-React icons
- **AI Integrations**: Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`) & Anthropic API (`claude-3-5-sonnet-latest` or compatible custom endpoints) via existing unified `callAiProvider`.

---

## Commands
- **Dev**: `npm run dev` (starts backend on port 3003 and frontend Vite dev server concurrently)
- **Frontend Build**: `npm run build --prefix frontend`
- **Frontend Lint**: `npm run lint --prefix frontend`
- **Desktop Pack**: `npm run package`

---

## Project Structure
- `backend/server.js`: API routes (`/api/summarize-section`, `/api/clear-section-summary`) and section transcript aggregation logic.
- `backend/scanner.js`: Existing course scanning helper (`scanCourseFolder`).
- `frontend/src/components/Sidebar.jsx`: UI trigger for chapter summary on each section accordion header.
- `frontend/src/components/ChapterSummaryModal.jsx` (New): Modal component displaying the chapter summary, language selector, loading state, and offline status.
- `frontend/src/App.jsx`: Global modal state management and handlers.

---

## Backend API Contract

### 1. `POST /api/summarize-section`
Summarizes an entire course section by aggregating subtitle transcripts across all lessons in that section.

**Request Body:**
```json
{
  "sectionPath": "/path/to/course/01 - Introduction",
  "langCode": "en",
  "checkCacheOnly": false
}
```

**Behavior:**
1. Validates `sectionPath` within active course path.
2. Checks for cached summary file at `${sectionPath}/section.summary.${langCode}.txt`.
3. If `checkCacheOnly` is true: returns cached summary or `summary: null`.
4. If not cached:
   - Scans all subtitle files in `sectionPath` for lessons (matching `langCode` or fallback).
   - Extracts and concatenates clean transcript text with lesson title headers (e.g., `--- Lesson: Introduction --- \n ...`).
   - Truncates concatenated transcript to max 400,000 characters if needed.
   - Invokes `callAiProvider` with prompt requesting a structured Markdown chapter summary in target language.
   - Writes result to `${sectionPath}/section.summary.${langCode}.txt`.
   - Returns `{ success: true, summary: "...", cached: false }`.

### 2. `POST /api/clear-section-summary`
Removes the cached chapter summary file from disk to allow regeneration.

**Request Body:**
```json
{
  "sectionPath": "/path/to/course/01 - Introduction",
  "langCode": "en"
}
```

---

## Code Style & Formatting
- **Backend**: CommonJS (`require`), clean error handling with HTTP status codes and JSON response `{ success, error }`.
- **Frontend**: Functional React components with hooks, inline styles / CSS variables (`var(--primary)`, `var(--bg-hover)`), Lucide icons.

```jsx
// Example React Modal pattern
export default function ChapterSummaryModal({ isOpen, onClose, section, summaryLang }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        ...
      </div>
    </div>
  );
}
```

---

## Testing Strategy
- Manual end-to-end verification via Vite dev server & Express backend.
- Verify cache creation on disk (`section.summary.en.txt`).
- Verify cache hit behavior (`cached: true`).
- Verify fallback behavior when no subtitles exist in a section.
- Run `npm run lint --prefix frontend` to ensure lint compliance.

---

## Boundaries
- **Always do:** Validate paths against `activeCoursePath` to prevent path traversal; return detailed user-friendly error messages if API keys are missing; cache summaries to disk.
- **Ask first:** Modifying core DB structure or changing default AI model configs.
- **Never do:** Modify video/audio binary files on disk; block main looper threads; swallow AI provider errors silently.

---

## Success Criteria
- [ ] Backend route `/api/summarize-section` aggregates lesson subtitles and generates a structured Markdown summary.
- [ ] Section summary is saved locally to disk and reused when opening the modal.
- [ ] Clear cache / regenerate functionality works seamlessly.
- [ ] UI button integrated into Sidebar section headers with a dedicated clean Modal viewer.
- [ ] Multi-language support aligns with `SUPPORTED_SUMMARY_LANGUAGES`.
- [ ] Frontend lints cleanly without errors.

---

## Open Questions & Assumptions
1. **Assumption:** Chapter refers to a Course Section (folder containing video lessons).
2. **UI Approach:** A dedicated "Chapter Summary" icon/button in the Sidebar section header that opens a `ChapterSummaryModal`.
3. **Language Selection:** Language selection defaults to `activeLang` or settings default, with dropdown choice in the modal.
