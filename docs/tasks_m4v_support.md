# Tasks: M4V File Support

- [x] Task 1: Update `backend/scanner.js` to recognize `.m4v` files
  - **Acceptance**: Scanner parses `.m4v` files as video lessons, maps subtitles, and cleans titles properly.
  - **Verify**: Call `scanCourseFolder` on a mock directory structure and verify output JSON.
  - **Files**: `backend/scanner.js`

- [x] Task 2: Verify and update `backend/server.js` streaming headers for `.m4v` files
  - **Acceptance**: The `/api/stream` endpoint serves `.m4v` files using standard range streaming and `video/mp4` content type.
  - **Verify**: Inspect server logs and stream headers.
  - **Files**: `backend/server.js`

- [x] Task 3: Perform end-to-end verification with a mock course structure
  - **Acceptance**: Mock course containing `.m4v` scans successfully, lessons render in frontend, and video streams/seeks.
  - **Verify**: Launch player in dev mode, load the mock directory, and test playback.
  - **Files**: none (temporary mockup files only)
