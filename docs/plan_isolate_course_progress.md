# Implementation Plan: Course Progress Isolation

## Architecture & Major Components

### 1. Backend Isolation Layer (`backend/server.js`)
- **Strict Course-Scoped Progress in `getEffectiveUserData`**:
  - Remove fallback to global `db.progress`.
  - For the target/active course, resolve progress exclusively from `db.courseStates[activeCourse]?.progress || {}`.
  - Ensure `/api/userdata`, `/api/course-content`, and `/api/userdata/course` return only the active course's progress.
- **Stop Global Progress Writes in `/api/userdata/progress`**:
  - Update `POST /api/userdata/progress` so it writes exclusively to `db.courseStates[coursePath].progress[lessonId]`.
  - Do NOT write to global `db.progress[lessonId]`.
- **Stop Global Progress Writes in `/api/userdata/course-state`**:
  - Update `POST /api/userdata/course-state` so playback watchTime writes exclusively to `state.progress[lastLessonId]`.
  - Do NOT write to global `db.progress[lastLessonId]`.
- **Course Scoping for Notes (`/api/userdata/notes`)**:
  - In `POST /api/userdata/notes` and `DELETE /api/userdata/notes`, associate notes with `coursePath` (defaulting to `db.activeCoursePath`).
  - Store notes inside `db.courseStates[coursePath].notes[lessonId]`.
  - Return the active course's notes in `getEffectiveUserData`.
- **Safe Legacy Migration in `readDb()`**:
  - When `readDb()` parses `progress_db.json`:
    - If `activeCoursePath` exists, and `db.courseStates[activeCoursePath]` has an empty `progress` object, but `db.progress` contains existing records: copy `db.progress` into `db.courseStates[activeCoursePath].progress` once.
    - If legacy `db.notes` has records and `db.courseStates[activeCoursePath]` has empty notes: copy `db.notes` into `db.courseStates[activeCoursePath].notes` once.
    - This ensures existing users never lose their current progress or notes, while preventing those records from leaking into any other courses.

### 2. Frontend State Synchronization (`frontend/src/App.jsx`)
- **Clean Course Transition**:
  - When switching courses (`handleSelectPath`), immediately update local `progress` and `notes` from the API response (`data.progress || {}`, `data.notes || {}`).
  - In `fetchCourseContent`, synchronize `setNotes(data.notes || {})` if provided.
  - In `handleAddNote`, `handleEditNote`, and `handleDeleteNote`, include `coursePath` in the request payload.

---

## Implementation Order
1. **Phase 2 Plan & Phase 3 Tasks** (Documentation in `docs/`).
2. **Backend Progress Isolation** (`backend/server.js`):
   - Modify `getEffectiveUserData`, `/api/course-content`, `/api/userdata/progress`, `/api/userdata/course-state`.
   - Implement legacy migration helper in `readDb()`.
   - Update notes endpoints and `getEffectiveUserData`.
3. **Frontend Course Switching & Notes Scoping** (`frontend/src/App.jsx`):
   - Pass `coursePath` to notes endpoints.
   - Synchronize notes on course switch.
4. **Verification**:
   - Write and run verification script in `backend/scratch/verify_course_isolation.js`.
   - Run frontend linter and production build.
   - Remove scratch verification script.

---

## Risks & Mitigation Strategies
- **Risk:** Existing single-course users who only have data in legacy `db.progress` or `db.notes` might see empty progress on first launch.
  - **Mitigation:** In `readDb()`, implement an idempotent one-time migration: if `activeCoursePath` exists and its `courseStates[activeCoursePath].progress` is empty while `db.progress` is non-empty, backfill `courseStates[activeCoursePath].progress` from `db.progress`.
- **Risk:** Rapid course switching where video player flushes playback after the new course has already loaded.
  - **Mitigation:** `flushCurrentPlayback` already takes the currently active course path, ensuring that any final flush writes strictly to the course being exited, never to the newly opened course.

---

## Verification Checkpoints
- [ ] Checkpoint 1: Automated script verifies Course A and Course B with the exact same `lessonId` retain completely separate `watchTime`, `duration`, and `completed` flags.
- [ ] Checkpoint 2: Notes created in Course A do not appear in Course B for the same `lessonId`.
- [ ] Checkpoint 3: Legacy migration correctly preserves active course progress without polluting secondary courses.
- [ ] Checkpoint 4: `npm run lint --prefix frontend` and `npm run build --prefix frontend` pass with zero errors.
