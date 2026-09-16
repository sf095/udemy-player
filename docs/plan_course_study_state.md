# Implementation Plan: Preserve Study State Across Courses

## Architecture & Major Components
1. **Backend Persistence Layer (`backend/server.js`)**:
   - Update `DEFAULT_DB` to include `courseStates: {}`.
   - Update `readDb()` to ensure `courseStates` is present and defaults to an object.
   - Helper function `getEffectiveProgress(db, coursePath)` to merge course-scoped progress with fallback to global `db.progress`.
   - Update `GET /api/userdata` to return `courseStates` and effective `progress`.
   - Update `POST /api/userdata/progress` to accept optional `coursePath`, saving to `db.courseStates[coursePath].progress[lessonId]` while keeping `db.progress[lessonId]` in sync for legacy compatibility.
   - Add `POST /api/userdata/course-state` endpoint to update `{ coursePath, lastLessonId, lastActiveTab, watchTime, lastActiveAt }`.
   - Handle path modification/deletion in `PUT /api/userdata/course` and `DELETE /api/userdata/course` to rename or delete the corresponding `courseStates[coursePath]` key.

2. **Frontend State & Progress Synchronization (`frontend/src/App.jsx`)**:
   - Track `courseStates` state in React.
   - Add a flush mechanism: `flushCurrentPlaybackProgress()` which synchronously or immediately saves the current `currentTime`, `duration`, `activeLesson.id`, and `activeTab` to the backend *before* changing `coursePath`.
   - Update `handleSelectLesson` to also record the active lesson in `courseStates` via `POST /api/userdata/course-state`.
   - Update `handleSelectPath` and `fetchUserData`:
     - Flush previous course progress before switching.
     - When course content is loaded (`fetchCourseContent`), check if the course has a saved `lastLessonId` in `courseStates[coursePath]`.
     - If found, locate that lesson in `sections` and restore it as `activeLesson`.
     - If not found (first time opening), find the first incomplete lesson in `sections` (or `sections[0].lessons[0]`) and auto-select it.
     - Restore `activeTab` (`'video'` or `'doc'`) if saved in `courseStates[coursePath]`.
     - Reset `isVideoPlaying` to `false` so the restored video is ready and paused at `watchTime`.
     - Show friendly toast notification (e.g. `Resumed: Lesson Title`).

---

## Implementation Order
1. **Step 1: Backend Storage & Endpoints (`backend/server.js`)**
   - Extend `DEFAULT_DB` with `courseStates: {}`.
   - Support `courseStates` in `readDb()`, `GET /api/userdata`, `POST /api/userdata/progress`, `PUT /api/userdata/course`, `DELETE /api/userdata/course`.
   - Add `POST /api/userdata/course-state`.
   - *Verification*: Test API endpoints with curl or unit check.

2. **Step 2: Frontend Flush & Pre-switch Hook (`frontend/src/App.jsx`)**
   - Implement `flushPlaybackState()` that flushes pending throttle and saves current `watchTime` & `activeLesson`.
   - Integrate with `beforeunload` window event and course switching triggers (`handleSelectPath`, `CourseManagerModal`).
   - *Verification*: Confirm `watchTime` is persisted immediately when navigating or switching courses.

3. **Step 3: Frontend Study State Restoration (`frontend/src/App.jsx`)**
   - On initial load or course switch, inspect `courseStates[coursePath]`.
   - If `lastLessonId` exists and matches a lesson in `sections`, restore `activeLesson` and `activeTab`.
   - If no `lastLessonId`, select the first incomplete lesson (or lesson 0).
   - *Verification*: Switch back and forth between two courses and verify seamless resume.

4. **Step 4: End-to-End Verification & Edge Cases**
   - Test course deletion / renaming from history in CourseManagerModal.
   - Test switching courses while video is actively playing.
   - Test backward compatibility with existing `progress_db.json`.

---

## Risks & Mitigation Strategies
- **Risk**: Video playback time is updated in memory (`currentTime`) but not saved to the server before the component unmounts on course switch.
  - **Mitigation**: Create an explicit `flushPlaybackState()` function that sends a synchronous or high-priority POST fetch before changing `activeCoursePath`.
- **Risk**: A saved `lastLessonId` in `courseStates` no longer exists (e.g. files were moved or renamed).
  - **Mitigation**: Verify that `lastLessonId` exists in the scanned `sections`. If not found, gracefully fall back to the first incomplete lesson or the first lesson of the course.
- **Risk**: Multiple rapid course switches causing race conditions in `fetchCourseContent`.
  - **Mitigation**: Keep an active request ID / cancellation guard so only the latest selected course's content sets `sections` and restores state.

---

## Verification Checkpoints
- [x] Checkpoint 1: Backend passes data contract validation (`readDb()` backward compatibility and `/api/userdata/course-state`).
- [x] Checkpoint 2: Frontend accurately flushes current playback before course switch.
- [x] Checkpoint 3: Switching from Course A to Course B and back to Course A restores Lesson, playback time, and active tab without manual clicks.
- [x] Checkpoint 4: Build passes (`npm run build --prefix frontend`) and linter passes (`npm run lint --prefix frontend`).
