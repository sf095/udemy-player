# Tasks: Remove Default Course Folder on Startup

- [x] **Task 1: Update backend/server.js `readDb()` and course-content endpoint**
  - **Acceptance**:
    - `readDb()` uses `''` as fallback `activeCoursePath` and `[]` as fallback `history`.
    - It validates that saved `activeCoursePath` exists on disk (if not, sets to `''`).
    - It filters `history` to keep only paths existing on disk.
    - `/api/course-content` checks for falsy path and returns success: false with appropriate message instead of crashing.
  - **Verify**: Call `/api/course-content` without path parameters or inspect db loading log.
  - **Files**: `backend/server.js`

- [x] **Task 2: Update App.jsx and Sidebar.jsx Frontend**
  - **Acceptance**:
    - `App.jsx` handles empty `coursePath` state and renders a beautiful initial welcome message inviting the user to select a course folder.
    - `Sidebar.jsx` displays a graceful empty state placeholder when `sections` is empty.
  - **Verify**: Empty state is visible on loading the page with an empty path configuration.
  - **Files**: `frontend/src/App.jsx`, `frontend/src/components/Sidebar.jsx`

- [x] **Task 3: Test and Validate startup state**
  - **Acceptance**:
    - App starts successfully with no console errors or folder-not-found exceptions.
    - Selecting a course directory via browser updates and persists path successfully.
  - **Verify**: Run the app locally and test course loading.
  - **Files**: None
