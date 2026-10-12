# Tasks: Reset Course Progress

- [x] Task 1: Implement Backend Reset Endpoint & Safeguards
  - Acceptance:
    - Add `POST /api/userdata/course-progress/reset` to `backend/server.js`.
    - Resets `db.courseStates[coursePath].progress` to `{}`.
    - Resets `db.courseStates[coursePath].lastLessonId` to `null`.
    - Clears matching entries from legacy `db.progress` so `readDb()` does not re-populate wiped progress.
    - Preserves all notes (`courseStates[coursePath].notes`) and chat history.
    - Writes changes to `progress_db.json` and returns updated effective user data.
  - Verify: Standalone test script runs against temporary db and validates progress is empty, notes remain intact, and legacy migration doesn't resurrect data.
  - Files: `backend/server.js`

- [x] Task 2: Reset Active Course Progress in Database
  - Acceptance:
    - Clear progress for the current active course in `backend/progress_db.json` so the user can start over immediately as requested.
    - Notes and settings in `progress_db.json` remain untouched.
  - Verify: Inspect `backend/progress_db.json` to confirm progress is empty and notes/settings are intact.
  - Files: `backend/progress_db.json`

- [x] Task 3: Add Reset Progress Control to App Header
  - Acceptance:
    - In `frontend/src/App.jsx`, add a "Reset Course Progress" button (`RotateCcw` icon) next to `.course-progress-container`.
    - Prompt user with confirmation dialog before resetting.
    - On confirmation, invoke `/api/userdata/course-progress/reset`.
    - Immediately update local `progress` state to `{}`.
    - Rewind `activeLesson` to the first lesson in the first section.
    - Rewind video playback to time 0.
  - Verify: Button renders correctly with tooltip and confirmation dialog appears on click.
  - Files: `frontend/src/App.jsx`

- [x] Task 4: Add Reset Progress Action to Course Manager Modal
  - Acceptance:
    - In `frontend/src/components/CourseManagerModal.jsx`, add a `RotateCcw` button in each course row's action group.
    - Prompt user with confirmation dialog displaying the course name.
    - Pass `onResetProgress` from `App.jsx`.
    - If resetting the current active course, update active playback and state in `App.jsx`.
  - Verify: Button renders for all courses in history list and triggers reset action with confirmation.
  - Files: `frontend/src/components/CourseManagerModal.jsx`, `frontend/src/App.jsx`

- [x] Task 5: Build, Lint & End-to-End Verification
  - Acceptance:
    - Run `npm run lint --prefix frontend` (passes with 0 errors).
    - Run `npm run build --prefix frontend` (builds successfully with 0 errors).
    - Verify that restarting the player shows 0% completed and lesson 1 ready to play.
  - Verify: Terminal execution of lint and build scripts.
  - Files: `backend/server.js`, `frontend/src/App.jsx`, `frontend/src/components/CourseManagerModal.jsx`
