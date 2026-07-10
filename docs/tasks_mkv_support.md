# Tasks: MKV File Support

## Task List

- [x] **Task 1: Update scanner and implement Matroska duration parsing**
  - **Acceptance**: `.mkv` files are recognized as lessons of type `video`, and their durations are extracted using `ffprobe`.
  - **Verify**: Run a scratch script in the node environment to scan a mock directory with `.mkv` and print JSON output showing video lessons and durations.
  - **Files**:
    - [backend/scanner.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/scanner.js)

- [x] **Task 2: Implement on-the-fly codec-aware remuxing & caching**
  - **Acceptance**: A helper function `ensureMp4Cached` hashes the `.mkv` path, checks the temp directory, queries codecs via `ffprobe`, remuxes (instant `-c copy`) or transcodes (`-c:v libx264`), writes to a `.tmp` file, and atomic-renames it to `.mp4` upon success.
  - **Verify**: Call the function directly on a mock `.mkv` in a scratch script, confirming the output file is created, playable, and Subsequent calls return immediately.
  - **Files**:
    - [backend/server.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/server.js)

- [x] **Task 3: Update streaming endpoint**
  - **Acceptance**: The `/api/stream` endpoint intercepts requests for `.mkv` files, runs `ensureMp4Cached`, and streams the cached `.mp4` with standard range-seek support.
  - **Verify**: Play a mock course with `.mkv` files, perform seeks, and monitor network requests to confirm 206 Partial Content headers are served.
  - **Files**:
    - [backend/server.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/server.js)
