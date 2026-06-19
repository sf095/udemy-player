3: ## Objective
4: Build a local web-based player for offline-downloaded Udemy courses. Users can point the application to their course folders, browse course sections, play video lessons with subtitles, view HTML/PDF content, record timestamped notes, track progress (manually or automatically at 90% watch progress), and auto-translate English subtitles to Vietnamese using the Gemini 1.5 Flash API.
5: 
6: ## Assumptions & Architecture
7: 1. **Security Context**: Browsers restrict direct access to local files (e.g. streaming `.mp4` or loading local directories). To bypass this, we will run a light Node.js/Express server on `localhost` that scans directories, serves media files via standard streaming, and reads/writes a local `progress_db.json` database.
8: 2. **Local Course Structure**:
9:    - Root folder contains section/chapter directories (e.g., `01 - Section Name`, `02 - Section Name`).
10:    - Section folders contain:
11:      - Video files (`.mp4`)
12:      - Subtitle files (`.srt` or `.vtt`, including locale-specific files like `.vi.vtt`)
13:      - PDF/HTML resource files (`.pdf`, `.html`)
14: 3. **Data Persistence**:
15:    - A single `userdata.json` file in the backend to store:
16:      - Configured course roots (history of folders).
17:      - Completed lessons status.
18:      - Video progress (current timestamp).
19:      - Notes (associated with a specific course, lesson, and timestamp).
20:      - Settings (e.g., Gemini API Key for translations).
21: 
22: ## Tech Stack
23: - **Backend**: Node.js, Express, `cors`, standard node libraries (`fs`, `path`), `@google/genai` or manual HTTP requests to the Gemini API.
24: - **Frontend**: Vite, React, Vanilla CSS.
25: - **Styling**: Modern, premium Vanilla CSS with CSS custom properties (variables), smooth animations, glassmorphism, responsive grid layouts, and a sleek dark theme.
26: - **Icons**: Lucide Icons (or pure CSS/SVG equivalents for visual styling).
27: 
28: ## Commands
29: - **Install Dependencies**: `npm install`
30: - **Run Application in Dev**: `npm run dev` (starts Express API server on port 3001 and Vite Dev Server on port 3000 using `concurrently`)
31: - **Build**: `npm run build`
32: 
33: ## Project Structure
34: ```
35: udemy-player/
36: ├── backend/
37: │   ├── server.js          # Express app
38: │   ├── progress_db.json   # Local database (gitignored)
39: │   └── package.json       # Backend dependencies
40: ├── src/                   # React frontend (Vite configuration at root)
41: │   ├── components/        # Player, Sidebar, Notes, CourseSelector, SettingsModal
42: │   ├── styles/            # CSS files (index.css, theme.css, etc.)
43: │   ├── App.jsx            # Main app page
44: │   └── main.jsx           # React entry point
45: ├── package.json           # Root package.json to coordinate frontend & backend
46: ├── vite.config.js         # Vite configuration
47: └── spec.md                # This specification
48: ```
49: 
50: ## API Endpoints (Express Backend)
51: 1. **`GET /api/courses`**: List available courses based on a scan of configured parent directories or the current workspace.
52: 2. **`GET /api/course-content?path=<path>`**: Parse a given course directory path, returning grouped lesson files with an array/dictionary of available subtitle tracks (e.g., `{ en: '...', vi: '...' }`).
53: 3. **`GET /api/stream?path=<path>`**: Stream the `.mp4` video with support for range requests (critical for seeking in browser video players).
54: 4. **`GET /api/subtitle?path=<path>`**: Serve subtitles, converting `.srt` to WebVTT on the fly.
55: 5. **`GET /api/userdata`**: Fetch student notes, completed lessons, settings (including Gemini API Key), and video progress.
56: 6. **`POST /api/userdata`**: Update notes, completion flags, and watch times.
57: 7. **`POST /api/userdata/settings`**: Save application settings (Gemini API Key).
58: 8. **`POST /api/translate-subtitle`**: Read an English subtitle file, translate it to Vietnamese using Gemini 1.5 Flash, and save it as a local `.vi.vtt` file next to the video.
59: 
60: ## Code Style & UX Choices
61: - **UI Theme**: Dark-mode primary UI (deep blues/grays, electric indigo accents) with high visual hierarchy.
62: - **Grid Layout**: Three-column dashboard when playing:
63:   - Left: Course sections & lessons sidebar (collapsible).
64:   - Center: Main content area (video player / PDF viewer / HTML frame).
65:   - Right: Timestamped notes panel (notes dynamically link to video times).
66: - **Subtitle Selection**: Subtitle track selector inside the player overlay or video controls supporting "English", "Vietnamese" (if generated), and "Translate to Vietnamese" triggers.
67: - **Smooth Interaction**: Transition animations for opening folders, adding notes, and marking completion. Live translation progress feedback.
68: 
69: ## Testing Strategy
70: - Manual verification of video rendering, streaming range headers, and directory scanning.
71: - Basic Jest or Vitest suite for scanning parser, SRT-to-VTT conversion logic, and translation prompt integration.
72: 
73: ## Success Criteria
74: - [ ] Scanning a course folder lists all chapters and files correctly, identifying all available languages for subtitle tracks.
75: - [ ] Users can stream video lessons smoothly with subtitle overlays (`.srt` parsed to `.vtt`).
76: - [ ] Lessons can be completed manually or automatically when the player reaches 90% of the video duration.
77: - [ ] Users can enter and save their Gemini API key in a Settings panel.
78: - [ ] If a Vietnamese subtitle is missing, a "Translate to Vietnamese" button is displayed.
79: - [ ] Clicking "Translate to Vietnamese" generates a valid `.vi.vtt` subtitle file via Gemini 1.5 Flash, saving it next to the video file, and immediately switches the active subtitle track to Vietnamese.
80: - [ ] Users can add, edit, delete, and jump-to notes that correspond to video timestamps.
81: - [ ] Seamless integration of companion PDF sheets and HTML checkpoints within the UI.
82: 
83: ## Boundaries
84: - **Always**: Support browser-native video playback features. Save notes immediately when created/edited.
85: - **Ask First**: Integrating third-party cloud storage or syncing.
86: - **Never**: Store absolute local video content inside the Git repository. Store unencrypted Gemini API keys in Git (they must reside in the local `progress_db.json` which is gitignored).
