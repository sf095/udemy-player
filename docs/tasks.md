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
  - Backend runs successfully on port 3003.
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
  - Frontend launches successfully on port 3002.
  - Custom dark theme is applied with CSS variables.
  - Main responsive dashboard grid is visible (header, sidebar, stage, notes).
- **Verify**: Run `npm run dev` from root, open browser on `http://localhost:3002`.

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

94: ### [x] Task 9: Implement Progress Logging, Auto-Completion, and Polish
95: - **Description**: Track active play positions, auto-complete when reaching 90%, add transition animations, and finalize application style.
96: - **Files**:
97:   - `frontend/src/App.jsx`
98:   - `frontend/src/components/VideoPlayer.jsx`
99: - **Acceptance Criteria**:
100:   - Progress updates sent to backend periodically.
101:   - Reaching 90% automatically checks the completion box and syncs to backend.
102:   - Smooth loading states, transitions, hover animations, and dark design accents.
103: - **Verify**: Let a video run until 90% watched, ensure checkbox triggers and progress increments.
104: 
105: ### [x] Task 10: Upgrade Course Scanner for Multiple Subtitles
106: - **Description**: Modify `backend/scanner.js` to search for all files ending in `.srt` or `.vtt`, detect their language code (e.g. `.vi.` vs default English), and return them in a `subtitles` dictionary.
107: - **Files**:
108:   - `backend/scanner.js`
109: - **Acceptance Criteria**:
110:   - Returns structured `subtitles` field containing mappings like `{ en: '...', vi: '...' }` in course content API.
111: - **Verify**: Manually add a dummy `.vi.srt` or `.vi.vtt` file next to a video and hit `/api/course-content` to check if it returns `subtitles: { en: "...", vi: "..." }`.
112: 
113: ### [x] Task 11: Implement Gemini API Key Settings & Subtitle Translation API
114: - **Description**: Add endpoints for updating and fetching app settings in the backend (Gemini API Key). Create `POST /api/translate-subtitle` endpoint to read an English subtitle file, query Gemini 1.5 Flash to translate it into Vietnamese while preserving VTT/SRT timestamps, and save the result as a `.vi.vtt` file next to the video.
115: - **Files**:
116:   - `backend/server.js`
117: - **Acceptance Criteria**:
118:   - `/api/userdata` contains `settings.geminiApiKey`.
119:   - `POST /api/userdata/settings` saves the API key.
120:   - `POST /api/translate-subtitle` calls Gemini API using the API key, receives the translation, sanitizes markdown, converts from SRT to VTT if necessary, and writes the file.
121: - **Verify**: Use postman or curl to save the API key and trigger a translation, verifying a new `.vi.vtt` file is generated.
122: 
123: ### [x] Task 12: Build Frontend Settings Panel for API Key Management
124: - **Description**: Create a Settings button and modal in the React frontend where the user can enter and save their Gemini API key.
125: - **Files**:
126:   - `frontend/src/App.jsx`
127:   - `frontend/src/components/SettingsModal.jsx` (new component)
128: - **Acceptance Criteria**:
129:   - Settings button opens the SettingsModal.
130:   - Saving settings posts the API key to the backend, updates local app state.
131: - **Verify**: Inspect settings modal, enter key, save, reload page, ensure settings show the saved API key.
132: 
133: ### [x] Task 13: Integrate Multi-Track Subtitles & Translate Action in Player
134: - **Description**: Update the frontend VideoPlayer to support multiple subtitle tracks. Render track options ("English", "Vietnamese" if existing). If Vietnamese is missing, show "Translate to Vietnamese" in the selector. Render a loader when translation is in progress.
135: - **Files**:
136:   - `frontend/src/components/VideoPlayer.jsx`
137:   - `frontend/src/components/Sidebar.jsx`
138:   - `frontend/src/App.jsx`
139: - **Acceptance Criteria**:
140:   - Switching to Vietnamese loads the translated track.
141:   - Clicking "Translate" triggers the translation API, updates the course content, and switches to the newly generated subtitle track once done.
142: - **Verify**: Play a video with English subtitle, click "Translate to Vietnamese", wait a few seconds, verify Vietnamese subtitles appear on screen.

### [x] Task 14: Implement Native Folder Selector
- **Description**: Add native folder selector capability to the local player. Create a backend API endpoint `/api/browse-folder` that spawns a native directory chooser dialog (using `osascript` on macOS, PowerShell on Windows) and returns the chosen absolute path. Add a "Browse" button in the frontend `CourseSelector` that triggers this API, showing a loading indicator and auto-scanning the selected folder.
- **Files**:
  - `backend/server.js`
  - `frontend/src/components/CourseSelector.jsx`
  - `frontend/src/App.jsx`
- **Acceptance Criteria**:
  - Clicking "Browse" opens Finder's directory picker modal on macOS.
  - Selecting a directory returns the correct absolute path to the frontend.
  - Cancelling the picker does not crash the server or hang the frontend.
  - The frontend updates the input field and triggers a course scan upon directory selection.
- **Verify**: Start the app in dev mode, click the new "Browse" button in the course selector, select a course directory, and confirm the course loads and plays successfully. Cancel the dialog once to verify it fails/cancels gracefully.
143: 
