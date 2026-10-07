# Tasks: Course Progress and Notes Isolation

- [x] Task 1: Update Backend Progress & Course State Endpoints
  - Acceptance:
    - `getEffectiveUserData(db, targetCoursePath)` resolves `progress` strictly from `courseState.progress || {}`.
    - `GET /api/course-content` returns `progress` strictly from `courseState.progress || {}`.
    - `POST /api/userdata/progress` saves progress strictly to `db.courseStates[coursePath].progress[lessonId]` without writing to global `db.progress`.
    - `POST /api/userdata/course-state` saves watch time strictly to `state.progress[lastLessonId]` without writing to global `db.progress`.
  - Verify: Run isolated Node script testing progress creation and checking that `db.progress` is not modified and Course B gets empty progress.
  - Files: `backend/server.js`

- [x] Task 2: Implement Scoped Notes & Safe Legacy Data Migration in Backend
  - Acceptance:
    - `readDb()` migrates legacy `db.progress` and `db.notes` into `db.courseStates[activeCoursePath]` if that course has no existing state.
    - `POST /api/userdata/notes` and `DELETE /api/userdata/notes` accept `coursePath` and store notes per course in `db.courseStates[coursePath].notes[lessonId]`.
    - `getEffectiveUserData(db, targetCoursePath)` returns `notes` scoped to the target course.
  - Verify: Run Node test script verifying notes added to Course A for lesson `01/01` do not appear when querying Course B.
  - Files: `backend/server.js`

- [x] Task 3: Update Frontend Notes and Course Switching Hooks
  - Acceptance:
    - In `frontend/src/App.jsx`, `handleAddNote`, `handleEditNote`, and `handleDeleteNote` include `coursePath` in request bodies.
    - When switching courses in `handleSelectPath` and `fetchCourseContent`, `notes` state is synchronized with `data.notes || {}`.
  - Verify: Run frontend linter and verify proper prop/state wiring.
  - Files: `frontend/src/App.jsx`

- [x] Task 4: End-to-End Verification and Frontend Build
  - Acceptance:
    - Automated test script in `backend/scratch/verify_course_isolation.js` passes all assertions (isolated progress, isolated notes, legacy migration).
    - `npm run lint --prefix frontend` passes with zero errors.
    - `npm run build --prefix frontend` succeeds with zero errors.
  - Verify: Execute tests and build commands in terminal.
  - Files: `backend/server.js`, `frontend/src/App.jsx`
