# Tasks: Preserve Study State Across Courses

- [x] Task 1: Extend Backend User Data Model for Course States
  - Acceptance:
    - `DEFAULT_DB` includes `courseStates: {}`.
    - `readDb()` ensures `courseStates` exists and safely handles legacy databases.
    - `GET /api/userdata` returns `courseStates` and merges course-scoped progress with fallback to global progress.
    - `DELETE /api/userdata/course` removes course from `courseStates`.
    - `PUT /api/userdata/course` migrates the course key in `courseStates` if renamed.
  - Verify: Run a node script or curl command against `backend/server.js` validating schema and endpoints.
  - Files: `backend/server.js`

- [x] Task 2: Implement `/api/userdata/course-state` and Scoped Progress in Backend
  - Acceptance:
    - `POST /api/userdata/course-state` accepts `{ coursePath, lastLessonId, lastActiveTab, watchTime, lastActiveAt }` and writes to `db.courseStates[coursePath]`.
    - `POST /api/userdata/progress` accepts optional `coursePath`, updates `db.courseStates[coursePath].progress[lessonId]` and mirrors to `db.progress[lessonId]`.
  - Verify: POST to `/api/userdata/course-state` and `/api/userdata/progress` and verify `backend/progress_db.json` structure.
  - Files: `backend/server.js`

- [x] Task 3: Implement Playback Progress Flush Mechanism in Frontend
  - Acceptance:
    - `flushPlaybackState()` immediately sends current playback `currentTime` and `activeLesson` before switching courses or on window unmount (`beforeunload`).
    - Cancels any pending 5-second progress throttle and updates local progress state.
  - Verify: Manually trigger switch while playing and verify `watchTime` matches the moment of switch in `progress_db.json`.
  - Files: `frontend/src/App.jsx`

- [x] Task 4: Implement Study State Restoration on Course Switch and Initial Load
  - Acceptance:
    - When a course is selected or loaded, check `courseStates[coursePath]`.
    - If `lastLessonId` exists in scanned sections, set it as `activeLesson` and restore `lastActiveTab`.
    - If not found or brand new course, automatically select the first incomplete lesson (or lesson 1).
    - Auto-expand containing chapter in sidebar and set player `initialTime`.
    - Display brief toast notification indicating resumed lesson.
  - Verify: Switch between multiple courses in the UI and confirm the exact lesson, timestamp, and tab restore automatically.
  - Files: `frontend/src/App.jsx`

- [x] Task 5: Build, Lint, and End-to-End Verification
  - Acceptance:
    - `npm run lint --prefix frontend` passes with 0 errors.
    - `npm run build --prefix frontend` succeeds without errors.
    - Switching courses via dropdown and CourseManagerModal maintains isolated study states across all courses.
  - Verify: Run `npm run lint --prefix frontend` and `npm run build --prefix frontend`.
  - Files: `frontend/src/App.jsx`, `backend/server.js`
