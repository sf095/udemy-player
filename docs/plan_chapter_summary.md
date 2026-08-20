# Technical Implementation Plan: Chapter Content Summarization

This document details the step-by-step technical plan for adding Chapter (Section) Content Summarization based on subtitles to the Udemy Offline Player.

## 1. Major Components & Dependencies

### Backend APIs (`backend/server.js`)
We will add two endpoints:
1. `POST /api/summarize-section`:
   - Accepts `sectionPath`, `langCode`, and optional `checkCacheOnly`.
   - Validates `sectionPath` within active course path.
   - Checks if `section.summary.[langCode].txt` already exists in `sectionPath`.
   - If cached: Reads and returns content immediately.
   - If not cached (and `checkCacheOnly` is false):
     - Uses `scanner.js` / directory scan to discover all lessons and their subtitle files in `sectionPath`.
     - Parses and aggregates subtitle transcripts from all lessons in that section, formatted with lesson title headers.
     - Truncates aggregated text if exceeding 400,000 characters.
     - Calls `callAiProvider` (Gemini or Anthropic) with a prompt instructing it to create a structured Markdown summary of the entire chapter in the requested target language.
     - Saves summary to `[sectionPath]/section.summary.[langCode].txt` and returns it.
2. `POST /api/clear-section-summary`:
   - Deletes `[sectionPath]/section.summary.[langCode].txt` to allow manual summary regeneration.

### Frontend Components
1. `frontend/src/components/ChapterSummaryModal.jsx` (New):
   - Modal component displaying:
     - Section Title
     - Summary target language selector (with all supported languages)
     - Rendered Markdown summary text (`renderMarkdown`)
     - Offline cache status badge ("Saved to Disk")
     - "Regenerate Summary" button
     - Loading spinner / error states
2. `frontend/src/components/Sidebar.jsx`:
   - Add a "Chapter Summary" button (`<FileText size={14} />`) to each section header trigger.
   - Triggers `onOpenSectionSummary(section)` callback.
3. `frontend/src/App.jsx`:
   - Manage state for `activeSectionSummary` (section object) and `showChapterSummaryModal` (boolean).
   - Render `<ChapterSummaryModal>` when opened.

---

## 2. Implementation Order

1. **Phase A: Backend Implementation**
   - Implement `POST /api/summarize-section` and `POST /api/clear-section-summary` in `backend/server.js`.
   - Add helper logic to gather subtitles for all lessons in a section directory.
2. **Phase B: Frontend Modal Component**
   - Create `frontend/src/components/ChapterSummaryModal.jsx`.
   - Implement language selector, Markdown renderer, fetch logic, caching checks, and error boundaries.
3. **Phase C: Sidebar Integration**
   - Update `frontend/src/components/Sidebar.jsx` to include the Chapter Summary icon/button in each section accordion header.
4. **Phase D: App Integration & Verification**
   - Wire `ChapterSummaryModal` into `frontend/src/App.jsx`.
   - Run linter and end-to-end manual checks.

---

## 3. Risks & Mitigations

- **Risk: Combined Subtitle Transcript Size Exceeding Token Limits**
  - *Mitigation*: Multi-lesson transcripts can be large. We strip subtitle timestamp metadata (converting to pure text) and cap total character length at 400,000 characters (~100,000 tokens), safe for both Gemini Flash and Claude 3.5 Sonnet.
- **Risk: Lessons Missing Subtitles**
  - *Mitigation*: Backend scans for any available subtitle track (`.srt`/`.vtt`) in the lesson, falling back to English or any available language if the exact `langCode` file isn't present for a specific lesson. If no lessons have subtitles, return a clear error.
- **Risk: Accidental Navigation / Click Conflict on Sidebar Header**
  - *Mitigation*: Call `e.stopPropagation()` on the Chapter Summary button click in `Sidebar.jsx` so clicking it does not toggle section collapse/expand.

---

## 4. Verification Checkpoints

- **Checkpoint 1 (Backend Endpoint)**: Test `/api/summarize-section` via POST fetch/curl to confirm subtitle aggregation and file creation (`section.summary.en.txt`).
- **Checkpoint 2 (Modal & Markdown)**: Confirm modal opens cleanly, displays formatted summary, and allows language switching.
- **Checkpoint 3 (Caching & Clear Cache)**: Re-opening modal loads from disk instantly (`cached: true`). "Regenerate" clears cache file and creates a new one.
- **Checkpoint 4 (Linter)**: Run `npm run lint --prefix frontend` to ensure zero syntax/lint issues.
