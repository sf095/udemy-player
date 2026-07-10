# Tasks: Video Duration Scan and Display

- [x] **Task 1: Implement & Verify `getMp4Duration` in a Scratch Script**
  - **Acceptance**: The script correctly parses the `mvhd` atom of an MP4/M4V file and prints the correct duration in seconds.
  - **Verify**: Run `node scratch/test_duration.js` and verify it prints a valid duration for a real course video (e.g. `Lesson 01 - Introduction.m4v`).
  - **Files**: `/Users/hientranthanh/.gemini/antigravity-cli/scratch/test_duration.js`

- [x] **Task 2: Integrate `getMp4Duration` into the Backend Scanner**
  - **Acceptance**: The backend scanner calls `getMp4Duration` for all scanned videos, and the `/api/course-content` API returns `duration` (seconds) inside each lesson object.
  - **Verify**: Query the course scanner API or view output and confirm the presence of the `duration` key in lesson JSON payloads.
  - **Files**: [scanner.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/scanner.js)

- [x] **Task 3: Implement Duration Rendering in the Sidebar**
  - **Acceptance**:
    - Sidebar displays individual lesson durations next to lesson titles (e.g., `05:12`).
    - Section headers show section-wide total duration (e.g., `45m 12s`).
    - Sidebar header shows overall course total duration (e.g., `8h 35m`).
  - **Verify**: Start the app, load a course, and confirm that the duration text is rendered for lessons, sections, and the course header.
  - **Files**: [Sidebar.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/Sidebar.jsx)

- [x] **Task 4: Style the Durations and Badges in CSS**
  - **Acceptance**: The duration text matches the premium visual aesthetics of the app: readable but subtle (e.g. using muted text color and clean layout alignment), and scales nicely when names wrap.
  - **Verify**: Check layout on different screen widths and under both dark and light modes.
  - **Files**: [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css)
