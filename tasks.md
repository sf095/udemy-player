# Tasks: Udemy Offline Player

## Task List

### [x] Task 1: Initialize Workspace & Backend Core
- **Description**: Set up the project directory structure, create root and backend packages, and configure the Express server boilerplate with CORS and basic routing.
- **Files**:
  - `package.json` (Root)
  - `backend/package.json`
  - `backend/server.js`
- **Acceptance Criteria**:
  - Root package lists start scripts (runs frontend and backend).
  - Backend runs successfully on port 3001.
  - Server returns a standard `/api/health` check response.
- **Verify**: Run `node backend/server.js` and verify it starts and responds to HTTP requests.

### [x] Task 2: Implement Course Directory Scanner & Lesson Parser
- **Description**: Add directory scanning utilities in the backend. Scan directory recursively, sort sections, and group lesson files (videos, SRTs, PDFs, HTML) by numerical prefixes into single "Lesson" models.
- **Files**:
  - `backend/scanner.js`
  - `backend/server.js`
- **Acceptance Criteria**:
  - Successfully handles folders with number prefixes.
  - Returns grouped lessons: `video`, `srt`, `pdf`, `html` paths are associated correctly.
  - API endpoint `/api/course-content?path=...` returns the grouped JSON payload.
- **Verify**: Curl `/api/course-content?path=/Users/hientranthanh/Downloads/udemy_courses/downloads/Pianoforall - Incredible New Way To Learn Piano & Keyboard` and inspect output structures.

### [x] Task 3: Implement Video Streaming (Range Requests) & Subtitle Converter
- **Description**: Write range-based video streaming logic to support seekable videos. Implement an on-the-fly SRT-to-WebVTT parser to serve captions to the browser.
- **Files**:
  - `backend/server.js`
- **Acceptance Criteria**:
  - `/api/stream?path=...` supports HTTP status 206 and Range headers.
  - `/api/subtitle?path=...` converts `.srt` files to `.vtt` on-the-fly and returns `text/vtt` header.
- **Verify**: Check video streaming response headers (e.g. `Accept-Ranges: bytes`, `Content-Range`) and request SRT files via the `/api/subtitle` endpoint to confirm it contains `WEBVTT` format.

### [x] Task 4: User Data & Progress API Persistence
- **Description**: Design endpoints to read and write user watch progress, completed state, and notes. Store details in a local JSON database.
- **Files**:
  - `backend/userdata.js`
  - `backend/server.js`
- **Acceptance Criteria**:
  - Read/write operations persist to `backend/progress_db.json`.
  - `/api/userdata` returns notes, completion logs, and active course logs.
  - `/api/userdata` accepts updates for completed status, watch positions, and new notes.
- **Verify**: Save a mock note/progress state via POST and verify it is preserved in `progress_db.json`.

### [x] Task 5: Initialize Vite & React Frontend Shell
- **Description**: Set up the Vite React boilerplate in the `frontend/` directory, set up CSS variables, theme styling, and standard grid layout.
- **Files**:
  - `frontend/` directory structure
  - `frontend/vite.config.js`
  - `frontend/src/index.css`
  - `frontend/src/App.jsx`
- **Acceptance Criteria**:
  - Frontend launches successfully on port 3000.
  - Custom dark theme is applied with CSS variables.
  - Main responsive dashboard grid is visible (header, sidebar, stage, notes).
- **Verify**: Run `npm run dev` from root, open browser on `http://localhost:3000`.

### [x] Task 6: Implement Course Selector & Sidebar Accordion
- **Description**: Build UI components to choose course folders and browse course folders, listing chapters and lessons in an interactive tree menu.
- **Files**:
  - `frontend/src/components/CourseSelector.jsx`
  - `frontend/src/components/Sidebar.jsx`
- **Acceptance Criteria**:
  - Course folder input auto-populates reference course and fetches contents.
  - Sidebar correctly groups folders by chapters/sections.
  - Individual lessons show appropriate type icons (Video, PDF, Checkpoint) and completion checkboxes.
- **Verify**: Load reference course path in the browser, verify sidebar matches files listed in terminal.

### [x] Task 7: Implement Media Stages (Video, PDF, HTML)
- **Description**: Build players for the different course lesson contents.
- **Files**:
  - `frontend/src/components/VideoPlayer.jsx`
  - `frontend/src/components/DocViewer.jsx`
- **Acceptance Criteria**:
  - Clicking a lesson loads it into the Stage.
  - Videos stream smoothly with subtitles overlay.
  - PDF resources are shown inside an embed element or secondary tab.
  - HTML lessons load inside a styled container.
- **Verify**: Click a video and ensure it plays; check subtitles dropdown; open a PDF and verify it is rendered.

### [x] Task 8: Implement Notes & Interactive Timeline
- **Description**: Build the Notes panel where students take and view timestamped annotations.
- **Files**:
  - `frontend/src/components/NotesPanel.jsx`
- **Acceptance Criteria**:
  - Adding a note pauses video, reads current timestamp, saves to API, and resumes.
  - Notes lists are displayed under the active lesson sorted by timestamp.
  - Clicking a note's timestamp jumps the video player to that exact second.
- **Verify**: Add a note at 0:10, play video, click the note's `0:10` chip, and confirm the player seeks to 10 seconds.

### [x] Task 9: Implement Progress Logging, Auto-Completion, and Polish
- **Description**: Track active play positions, auto-complete when reaching 90%, add transition animations, and finalize application style.
- **Files**:
  - `frontend/src/App.jsx`
  - `frontend/src/components/VideoPlayer.jsx`
- **Acceptance Criteria**:
  - Progress updates sent to backend periodically.
  - Reaching 90% automatically checks the completion box and syncs to backend.
  - Smooth loading states, transitions, hover animations, and dark design accents.
- **Verify**: Let a video run until 90% watched, ensure checkbox triggers and progress increments.
