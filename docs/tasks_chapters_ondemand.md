# Tasks: On-Demand Chapters Generation with Language Selection

## Task 1: Backend Refactor
Refactor backend to prevent auto-generation on load and support language parameters.

- [x] **Task 1.1: GET /api/chapters endpoint**
  - **Description**: Disable auto-generation in `GET /api/chapters`. Only read existing `.chapters.json` and return `exists: false` if not found.
  - **Acceptance**: Requesting chapters for a video that does not have chapters cache should return `{ success: true, chapters: [], cached: false, exists: false }` immediately without calling Gemini or writing any files.
  - **Verify**: Curl GET `/api/chapters?videoPath=...` for a new video. Check response structure.
  - **Files**: [server.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/server.js)

- [x] **Task 1.2: POST /api/chapters/regenerate and prompt update**
  - **Description**: Extract `language` from `req.body` and pass it to `generateChaptersFromSubtitlesFile`. Update Gemini prompt to generate chapters in the selected language.
  - **Acceptance**: API receives language (e.g. "Vietnamese") and generates chapter titles in that language.
  - **Verify**: Curl POST `/api/chapters/regenerate` with `{"videoPath": "...", "subtitlePath": "...", "language": "Vietnamese"}` and verify returned chapters are in Vietnamese.
  - **Files**: [server.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/server.js)

## Task 2: Frontend Refactor
Update VideoPlayer to support on-demand generation, language selection, and regeneration.

- [x] **Task 2.1: Add state and fetch hook updates**
  - **Description**: Implement `selectedChapterLang` state initialized from `localStorage`. Do not automatically prompt or trigger generation on load if chapters are missing.
  - **Acceptance**: Component mounts without console/API errors, loading empty chapters list.
  - **Verify**: Inspect component state in React DevTools or check console logs.
  - **Files**: [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx)

- [x] **Task 2.2: Add on-demand generation controls to player bar**
  - **Description**: Render a language selector select-box and a "✨ Generate" button in the bottom control bar when chapters are empty and subtitle is available.
  - **Acceptance**: Controls are styled correctly, aligned, and clicking "Generate" calls the backend API with the chosen language.
  - **Verify**: Open a lesson with subtitles but no chapters, see the controls, choose a language, and generate.
  - **Files**: [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx)

- [x] **Task 2.3: Add regeneration controls to Chapters sidebar panel**
  - **Description**: Render a language selector select-box and a "✨ Re-generate" button in the Chapters panel header or as an action bar right below the header.
  - **Acceptance**: Action bar is visible when chapters exist. Clicking it triggers regeneration in the selected language and updates the timeline and list.
  - **Verify**: Open the Chapters sidebar panel, select a different language, click "Re-generate", check that the chapters are re-generated and updated in the UI.
  - **Files**: [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx)

- [x] **Task 2.4: Styling and polish**
  - **Description**: Add CSS styles if necessary to make the selectors and buttons look premium and match the player's dark glassmorphism.
  - **Acceptance**: Beautiful layout with smooth hover transitions, clear spacing, and responsive design.
  - **Verify**: Visual check of the control bar and the sidebar action bar.
  - **Files**: [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css)
