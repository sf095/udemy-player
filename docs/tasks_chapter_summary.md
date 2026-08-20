# Task List: Chapter Content Summarization

Here is the discrete task list for implementing Chapter Content Summarization.

## Tasks

- [x] **Task 1: Backend Chapter Summarization Endpoints**
  - **Description**: Add `/api/summarize-section` and `/api/clear-section-summary` endpoints to `backend/server.js`.
  - **Acceptance**:
    - `/api/summarize-section` aggregates subtitles from all lessons in the requested section folder.
    - Saves generated summary to `${sectionPath}/section.summary.${langCode}.txt`.
    - Returns cached summary when `checkCacheOnly` is true or file exists.
    - `/api/clear-section-summary` unlinks the cache file.
  - **Verify**: Made API requests and confirmed file creation on disk.
  - **Files**: `backend/server.js`

- [x] **Task 2: Create ChapterSummaryModal Component**
  - **Description**: Create `frontend/src/components/ChapterSummaryModal.jsx` for viewing, summarizing, language selection, and regenerating chapter summaries.
  - **Acceptance**:
    - Modal opens with title of selected section/chapter.
    - Allows selecting target summary language.
    - Renders Markdown response with offline badge and regenerate button.
    - Shows clear error message if API key is missing or no subtitles exist.
  - **Verify**: Component created, lint verified cleanly, supports all states.
  - **Files**: `frontend/src/components/ChapterSummaryModal.jsx`

- [x] **Task 3: Add Chapter Summary Trigger to Sidebar**
  - **Description**: Add a Chapter Summary action button (`<Sparkles size={14} />`) to section headers in `frontend/src/components/Sidebar.jsx`.
  - **Acceptance**:
    - Each section header displays a button to open section summary.
    - Clicking the button stops event propagation (doesn't collapse/expand section).
  - **Verify**: Hovering and clicking section header summary icon opens modal.
  - **Files**: `frontend/src/components/Sidebar.jsx`

- [x] **Task 4: Wire Modal State into App.jsx & Final Verification**
  - **Description**: Connect `ChapterSummaryModal` state in `frontend/src/App.jsx` and run linter/verification checks.
  - **Acceptance**:
    - Full flow works end-to-end.
    - Linter checks pass cleanly.
  - **Verify**: Verified component imports, event wiring, state management, and Esc key dismissal.
  - **Files**: `frontend/src/App.jsx`
