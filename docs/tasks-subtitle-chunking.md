# Tasks: Subtitle Translation Chunking

This document outlines the step-by-step tasks required to implement and verify subtitle translation chunking.

- [x] **Task 1: Add `parseSubtitleCues` helper function**
  - **Description**: Add `parseSubtitleCues(content)` helper function in `backend/server.js` to parse subtitle text into an array of individual cues, filtering out metadata/headers/comments.
  - **Acceptance**:
    - Lines are normalized to `\n`.
    - Grouped cue strings must contain `-->`.
    - Initial `WEBVTT` headers, comments, and other non-cue lines are excluded.
  - **Verify**: Call it with sample SRT/VTT strings in a node shell or script and check array length/cues.
  - **Files**:
    - [backend/server.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/server.js)

- [x] **Task 2: Refactor `/api/translate-subtitle` route**
  - **Description**: Update the endpoint to use chunking. Cues will be grouped into chunks of maximum 100 cues. We will loop through the chunks sequentially (adding a 500ms sleep delay between calls) and call `callAiProvider` on each chunk. Clean each chunk's response and merge them with `\n\n`, prepending `WEBVTT\n\n` to the final output.
  - **Acceptance**:
    - Subtitle files are parsed into cues and chunked by 100 cues.
    - Translation calls are sequential with a 500ms delay to avoid rate limiting.
    - If a chunk fails, the API returns a 500 error indicating which chunk failed.
    - Final output starts with `WEBVTT\n\n` and is saved next to the video as `[base].[targetLang].vtt`.
  - **Verify**: Trigger `/api/translate-subtitle` endpoint via client or cURL and check output.
  - **Files**:
    - [backend/server.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/server.js)

- [x] **Task 3: Create verification scratch script**
  - **Description**: Create a scratch script `backend/scratch/verify_chunking.js` to test chunking and translation logic with a mock AI response or real API key (if configured in `progress_db.json`).
  - **Acceptance**:
    - Generates a dummy subtitle file with 250+ cues.
    - Chunks it into 3 parts (100, 100, 50).
    - Runs the translation (mocked or real) and merges it.
    - Asserts that all 250+ cues are preserved and formatted as valid VTT.
  - **Verify**: Run `node backend/scratch/verify_chunking.js` and see success/failure logs.
  - **Files**:
    - `backend/scratch/verify_chunking.js` (created under scratch folder)
