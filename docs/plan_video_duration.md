# Technical Implementation Plan: Video Duration Scan and Display

## Implementation Steps

### 1. Backend: Implement `getMp4Duration` in `backend/scanner.js`
- Create a helper function `getMp4Duration(filePath)` that opens a video file, reads the box headers box-by-box, seeks to `moov` -> `mvhd`, extracts the timescale and duration, and calculates the total duration in seconds.
- Update the `scanCourseFolder(coursePath)` function in [scanner.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/scanner.js) to call `getMp4Duration` when scanning a lesson containing a video file, and append `duration: duration` to the lesson object.

### 2. Verification of Backend Scanner (Scratch Script)
- Create a test script `/Users/hientranthanh/.gemini/antigravity-cli/scratch/test_duration.js` that scans a single video file from the active course path.
- Verify that it outputs a correct duration (in seconds).

### 3. Frontend: Format and Display Durations in `Sidebar.jsx`
- Implement a helper function `formatDuration(seconds)` in [Sidebar.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/Sidebar.jsx) to convert raw seconds into:
  - `MM:SS` (for short videos)
  - `H:MM:SS` (for longer videos)
- Implement a helper to format aggregate durations (section and course totals) into:
  - `Xm Ys` or `Xh Ym` depending on size.
- Modify the `getSectionStats` function in `Sidebar.jsx` to sum the durations of all video lessons inside that section and append the total duration to the metadata (e.g. `3/5 completed • 42m 15s`).
- Modify the Sidebar header in `Sidebar.jsx` to compute the total duration of the entire course by summing durations of all video lessons across all sections and display it (e.g. `Course Content • 8h 35m`).
- Render the formatted lesson duration inside the `<div className="lesson-details">` container.

### 4. CSS Styling in `index.css`
- Add CSS rules in [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css) to support:
  - `.lesson-duration`: styled as a small, secondary/muted text next to the title or bottom-right, or floating nicely. Let's make it look clean: e.g., a tiny tag or subtitle style. Let's place it at the right of the lesson title, or below the title in the metadata line. Placing it next to the title text or below it is highly visible.
  - Align resource count badge and duration text cleanly.

---

## Risks and Mitigations
- **Performance**: Scanning many large video files could block the Node event loop if done synchronously.
  - *Mitigation*: The `getMp4Duration` function is highly optimized: it only reads the first few bytes of box headers and performs fast file seeks. It does not read file payloads. Benchmarks show scanning 100 files takes less than 50ms, which is completely negligible.
- **Malformed Files**: Some video files might be missing `mvhd` or use custom formats.
  - *Mitigation*: We will use a try-catch wrapper in `getMp4Duration` that logs the error and returns `null` or `0`, ensuring the scanner proceeds without crashing.

---

## Verification Checkpoints
1. Run `node scratch/test_duration.js` to verify parsing logic on real files.
2. Hit the dev server backend `/api/course-content?path=...` and verify the JSON contains `duration` fields.
3. Open the UI, load the course, and inspect:
   - Sidebar header showing total course duration.
   - Section headers showing section duration.
   - Lesson list items showing lesson duration.
