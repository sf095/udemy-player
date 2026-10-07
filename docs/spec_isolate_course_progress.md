# Spec: Course-Scoped Progress and Notes Isolation

## Objective
Prevent cross-course data pollution where two courses sharing the same section folder name and lesson prefix (e.g. `01 - Introduction/01`) share or overwrite each other's video watch time, completion status, and notes.

Every course must have strictly isolated study progress and notes tied exclusively to that course path.

---

## Tech Stack
- **Frontend:** React 19 (Vite SPA)
- **Backend:** Node.js / Express 4
- **Runtime / Desktop:** Electron 42
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
- `backend/server.js` — Handles `/api/userdata`, `/api/userdata/course`, `/api/userdata/progress`, `/api/userdata/course-state`, and `/api/userdata/notes`.
- `backend/scanner.js` — Scans course folders and produces sections and lessons with unique `lessonId` relative to the course directory.
- `backend/progress_db.json` — Persistent local database storage.
- `frontend/src/App.jsx` — Manages course state, lesson selection, throttled and immediate progress saves.
- `frontend/src/components/Sidebar.jsx` — Renders course sections, lessons, completion badges, and progress bars.
- `frontend/src/components/NotesPanel.jsx` — Displays and adds notes for the active lesson.
- `docs/spec_isolate_course_progress.md` — This specification document.

---

## Root Cause Analysis
1. **Lesson ID Generation:** In `backend/scanner.js`, `lessonId` is generated as `${secDir}/${prefix}` (e.g. `01 - Introduction/01`). This ID is relative to the course directory.
2. **Global Fallback Pollution:** In `backend/server.js`:
   - `POST /api/userdata/progress` and `POST /api/userdata/course-state` write to `db.courseStates[coursePath].progress[lessonId]` AND simultaneously write to global `db.progress[lessonId]`.
   - `getEffectiveUserData` and `GET /api/course-content` compute `effectiveProgress` by spreading global `db.progress` underneath `courseState.progress` (`{ ...(db.progress || {}), ...(courseState?.progress || {}) }`).
   - Consequently, when Course B is opened, any lesson with an ID that was previously watched in Course A inherits Course A's watch time, duration, and completion status.
   - When the user clicks or resumes the lesson in Course B, `App.jsx` initializes `currentTime` to Course A's watch time and automatically persists it to Course B's `courseStates`, permanently corrupting Course B's progress.
3. **Notes Collision:** In `backend/server.js`, `db.notes` is a flat object `db.notes[lessonId]`. Notes added for `01 - Introduction/01` in Course A leak directly into Course B.

---

## Proposed Solution & Architecture

### 1. Backend Progress Isolation (`server.js`)
- **Strict Course Scoping:**
  - For any course `coursePath`, its progress dictionary is stored exclusively at `db.courseStates[coursePath].progress`.
  - In `getEffectiveUserData(db, targetCoursePath)` and `GET /api/course-content`:
    - Only return the active course's progress: `db.courseStates[coursePath]?.progress || {}`.
    - Do NOT merge global `db.progress` across courses.
- **Stop Global Progress Writes:**
  - In `POST /api/userdata/progress` and `POST /api/userdata/course-state`, only write to `db.courseStates[coursePath].progress[lessonId]`. Stop mutating `db.progress[lessonId]`.
- **One-Time Legacy Migration:**
  - For existing databases where progress was previously stored in `db.progress` before `courseStates` existed:
    - If `db.activeCoursePath` exists and `db.courseStates[db.activeCoursePath].progress` is empty/missing, copy `db.progress` into `db.courseStates[db.activeCoursePath].progress` once.
    - Keep `db.progress` frozen or cleared so it never leaks into new or other existing courses.

### 2. Notes Scoping Per Course (`server.js` & `frontend`)
- **Store Notes Per Course:**
  - Store notes inside `db.courseStates[coursePath].notes[lessonId]` (or `db.courseNotes[coursePath][lessonId]`), ensuring notes in Course A never appear in Course B.
  - Endpoints `/api/userdata/notes` (POST/DELETE) accept `coursePath` (defaulting to `db.activeCoursePath`).
  - Provide backward-compatible fallback for existing notes on the active course.

### 3. Frontend Progress Isolation (`App.jsx`)
- When switching courses (`handleSelectPath` or `fetchCourseContent`):
  - Reset `progress` state to the newly loaded course's progress (`data.progress || {}`) to avoid stale in-memory progress from the previous course leaking before the network response arrives.
  - Ensure `flushCurrentPlayback()` saves strictly with the current `coursePath`.

---

## Code Style
- Clean, minimal modifications directly addressing the root cause.
- Preserve backward compatibility for single-course users and existing databases.
- Example pattern for course progress retrieval:
```javascript
function getEffectiveUserData(db, targetCoursePath = null) {
  const activeCourse = targetCoursePath || db.activeCoursePath;
  const courseState = (activeCourse && db.courseStates && db.courseStates[activeCourse]) || null;
  const courseProgress = courseState?.progress || {};
  return {
    ...db,
    progress: courseProgress,
    activeCourseState: courseState
  };
}
```

---

## Testing Strategy
- **Manual Verification Script:** Create a standalone verification script in `backend/scratch/` that:
  1. Initializes a mock DB with Course 1 and Course 2.
  2. Saves watch progress (e.g. 120s, completed: true) for `01 - Introduction/01` in Course 1.
  3. Queries course content / progress for Course 2 (which also has `01 - Introduction/01`).
  4. Verifies Course 2's progress for `01 - Introduction/01` is empty (0s, completed: false).
  5. Adds a note to `01 - Introduction/01` in Course 1 and verifies it does NOT appear in Course 2.
- **Frontend Verification:** Build frontend (`npm run build --prefix frontend`) and ensure no regressions in lint or build.

---

## Boundaries
- **Always do:**
  - Protect existing user study data in `progress_db.json`.
  - Maintain the existing API response contracts so frontend components continue to receive `{ progress, courseStates, ... }`.
  - Clean up any temporary scratch files after verification.
- **Ask first:**
  - Destructive schema migrations that purge existing legacy progress without backup.
- **Never do:**
  - Overwrite or delete user data in `~/Library/Application Support/udemy-player-root/progress_db.json`.

---

## Success Criteria
- [ ] Watching a lesson (e.g. `01 - Introduction/01`) in Course A does NOT affect the watch time or completion status of `01 - Introduction/01` in Course B.
- [ ] Switching to Course B loads only Course B's progress. Course B starts at 0s (or its own saved timestamp), not Course A's timestamp.
- [ ] Notes added to a lesson in Course A do NOT appear on lessons in Course B.
- [ ] Existing progress for the current course remains intact after migration.
- [ ] Frontend builds cleanly with zero errors.

---

## Open Questions for Human Review
1. **Should notes be scoped strictly per-course as well?** (Recommended: Yes, notes are almost always course-specific).
2. **For legacy progress already in `db.progress`:** Should we migrate it into the currently active course, or clean up colliding keys? (Recommended: Safely migrate legacy entries into whichever course they belong to if unambiguous, and stop global fallback).
