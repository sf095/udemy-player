# Spec: Reset Course Progress

## Objective
Enable users to clear the saved progress of a course so they can restart the course from the beginning.

Key user requirements:
1. Provide an in-app "Reset Progress" feature with a confirmation dialog so users cannot accidentally wipe their progress.
2. The reset action must:
   - Reset lesson completion statuses to uncompleted (`completed: false`).
   - Reset lesson watch times to `0` (`watchTime: 0`).
   - Rewind active lesson bookmark to the beginning (Lesson 1).
   - **Preserve** all user notes and AI chat history for the course.
3. Accessible from two convenient locations:
   - Directly in the header bar next to the course progress indicator for the current course.
   - In the Course Manager modal list alongside "Edit Path" and "Remove from History" for any course in history.
4. Clean up existing progress for the user's active course immediately upon implementation.

---

## Tech Stack
- **Frontend:** React 19 (Vite SPA), Lucide Icons
- **Backend:** Node.js / Express 4
- **Runtime:** Electron 42 / Web browser
- **Data Store:** Local JSON file (`progress_db.json`)

---

## Commands
- **Dev Backend:** `npm run backend`
- **Dev Frontend:** `npm run dev --prefix frontend`
- **Dev Desktop App:** `npm run dev:desktop`
- **Build Frontend:** `npm run build --prefix frontend`
- **Lint Frontend:** `npm run lint --prefix frontend`

---

## Project Structure
- `backend/server.js` — Implement `POST /api/userdata/course-progress/reset`. Clears `courseStates[coursePath].progress`, resets `lastLessonId`, cleans up any matching keys in legacy global `db.progress` so legacy auto-migration cannot restore cleared progress.
- `frontend/src/App.jsx` —
  - Add a "Reset Course Progress" button (`RotateCcw` icon) next to `.course-progress-container` in the header.
  - Implement confirmation prompt.
  - On confirm, trigger API reset, reset in-memory `progress` state to `{}` (or effective course progress), and set the active lesson back to the first available lesson.
  - Pass `handleResetCourseProgress` callback to `CourseManagerModal`.
- `frontend/src/components/CourseManagerModal.jsx` —
  - Add a "Reset Progress" button (`RotateCcw` icon) for each course row.
  - Display confirmation modal/prompt before executing.
- `backend/progress_db.json` — Target database file where active course progress will be cleared.
- `docs/spec_reset_course_progress.md` — This specification document.

---

## Architecture & Data Flow

### 1. Backend Endpoint: `POST /api/userdata/course-progress/reset`
- **Request payload:**
  ```json
  {
    "coursePath": "/path/to/course" // Optional; defaults to db.activeCoursePath if omitted
  }
  ```
- **Handler behavior:**
  1. Resolve `coursePath = req.body.coursePath || db.activeCoursePath`. If missing, return 400.
  2. In `db.courseStates[coursePath]`:
     - Empty `progress = {}`.
     - Reset `lastLessonId = null`.
     - Reset `watchTime = 0`.
     - Preserve `notes = { ... }`.
  3. Legacy fallback guard:
     - Scan `db.progress` (the legacy flat object). If keys match lessons in this course or if this course is `activeCoursePath`, remove matching keys from `db.progress` so `readDb()` migration cannot resurrect wiped progress.
  4. Persist database with `writeDb(db)`.
  5. Return updated user data via `getEffectiveUserData(db, coursePath)` with `{ success: true, ... }`.

### 2. Frontend Header Progress Reset
- In `frontend/src/App.jsx`, adjacent to `.course-progress-container`:
  - Render a button with `RotateCcw` icon, styled consistently with header toggle buttons.
  - Tooltip: `"Reset Course Progress"`.
  - When clicked:
    - Open confirmation dialog: `"Are you sure you want to reset your progress for this course? All completed lessons and watch times will be reset to 0, and you will start from the beginning. Your notes and chat history will be kept."`
    - On confirmation:
      - Call `POST /api/userdata/course-progress/reset`.
      - Reset `progress` state to `{}`.
      - Rewind video / active lesson to the first lesson of the first section: `setActiveLesson(sections[0]?.lessons[0] || null)`.
      - Reset player `currentTime` to 0.

### 3. Course Manager Modal Progress Reset
- In `frontend/src/components/CourseManagerModal.jsx`:
  - In each course item's action button group (next to Edit Path and Remove from History):
    - Add a `RotateCcw` button with tooltip `"Reset Progress"`.
    - Clicking it triggers confirmation dialog with course name.
    - Calls `onResetProgress(path)`.
    - If the reset course is the currently active course, updates `App.jsx` state accordingly.

---

## Code Style
- Match existing codebase conventions: functional components with React hooks, vanilla inline styles/classes aligned with `index.css` CSS variables (`var(--bg-hover)`, `var(--primary)`, `var(--border-color)`), and `lucide-react` icons.
- Minimal, surgical modifications directly addressing the requirements.
- Example backend handler pattern:
```javascript
app.post('/api/userdata/course-progress/reset', (req, res) => {
  const { coursePath: reqCoursePath } = req.body || {};
  const db = readDb();
  const coursePath = reqCoursePath || db.activeCoursePath;
  if (!coursePath) {
    return res.status(400).json({ success: false, error: 'Course path is required' });
  }
  if (!db.courseStates) db.courseStates = {};
  if (!db.courseStates[coursePath]) {
    db.courseStates[coursePath] = {
      lastLessonId: null,
      lastActiveTab: 'video',
      lastActiveAt: Date.now(),
      progress: {},
      notes: {}
    };
  } else {
    db.courseStates[coursePath].progress = {};
    db.courseStates[coursePath].lastLessonId = null;
  }
  // Clear legacy progress entries belonging to this course to prevent re-migration
  if (db.progress && typeof db.progress === 'object') {
    // If active course, clear legacy progress to prevent resurrection
    if (coursePath === db.activeCoursePath) {
      db.progress = {};
    }
  }
  writeDb(db);
  res.json({ success: true, ...getEffectiveUserData(db, coursePath) });
});
```

---

## Testing Strategy
1. **Automated Verification Script (`backend/scratch/test-reset-progress.js`):**
   - Test `POST /api/userdata/course-progress/reset` with a temporary DB file.
   - Verify:
     - `progress` dictionary is emptied.
     - `lastLessonId` is cleared.
     - `notes` are completely preserved.
     - Legacy `db.progress` does not restore cleared lessons on subsequent `readDb()` calls.
2. **Frontend Build & Lint:**
   - Execute `npm run build --prefix frontend` to ensure no JSX/build regressions.
   - Execute `npm run lint --prefix frontend` to ensure no lint regressions.
3. **End-to-End Verification:**
   - Verify UI updates header progress bar to 0% and clears checkmarks in sidebar.
   - Verify active course in `progress_db.json` has its progress cleared as requested.

---

## Boundaries
- **Always:**
  - Require explicit user confirmation before clearing progress.
  - Preserve user notes and AI chat history untouched.
  - Update reactive frontend state immediately so no page reload is required.
- **Ask first:**
  - Any changes that alter how course content folders are scanned or how course notes are persisted.
- **Never:**
  - Delete or modify video files or folders on disk.
  - Delete user notes or chat logs when resetting progress.
  - Silently reset progress without user confirmation.

---

## Success Criteria
- [ ] Spec approved by the user.
- [ ] `POST /api/userdata/course-progress/reset` implemented and verified.
- [ ] Header progress bar features a "Reset Course Progress" button with confirmation modal.
- [ ] Course Manager modal displays a "Reset Progress" button for each course item.
- [ ] Resetting progress resets completion status and watch time, rewinds to Lesson 1, and preserves notes.
- [ ] The user's active course progress in `backend/progress_db.json` is reset.
- [ ] Frontend builds cleanly (`npm run build --prefix frontend`).

---

## Open Questions & Assumptions
- **Assumptions Made:**
  1. The user wants to reset progress for their active course immediately, while also having the feature available in the app moving forward.
  2. "Course progress" refers strictly to completed lesson checkmarks, lesson watch times, and the last watched position; notes and chat history must remain intact.
  3. Resetting rewinds the course to Lesson 1 so the user can start over smoothly.
