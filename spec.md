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
30: - **Run Application in Dev**: `npm run dev` (starts Express API server on port 3003 and Vite Dev Server on port 3002 using `concurrently`)
31: - **Build**: `npm run build`
32: 
33: ## Project Structure
34: ```
35: udemy-player/
36: ├── backend/
37: │   ├── server.js          # Express app
38: │   ├── progress_db.json   # Local database (gitignored)
39: │   └── package.json       # Backend dependencies
## Objective
Build a local web-based player for offline-downloaded Udemy courses. Users can point the application to their course folders, browse course sections, play video lessons with subtitles, view HTML/PDF content, record timestamped notes, track progress (manually or automatically at 90% watch progress), and auto-translate English subtitles to Vietnamese using the Gemini 1.5 Flash API.

## Assumptions & Architecture
1. **Security Context**: Browsers restrict direct access to local files (e.g. streaming `.mp4` or loading local directories). To bypass this, we will run a light Node.js/Express server on `localhost` that scans directories, serves media files via standard streaming, and reads/writes a local `progress_db.json` database.
2. **Local Course Structure**:
   - Root folder contains section/chapter directories (e.g., `01 - Section Name`, `02 - Section Name`).
   - Section folders contain:
     - Video files (`.mp4`)
     - Subtitle files (`.srt` or `.vtt`, including locale-specific files like `.vi.vtt`)
     - PDF/HTML resource files (`.pdf`, `.html`)
3. **Data Persistence**:
   - A single `userdata.json` file in the backend to store:
     - Configured course roots (history of folders).
     - Completed lessons status.
     - Video progress (current timestamp).
     - Notes (associated with a specific course, lesson, and timestamp).
     - Settings (e.g., Gemini API Key for translations).

## Tech Stack
- **Backend**: Node.js, Express, `cors`, standard node libraries (`fs`, `path`), `@google/genai` or manual HTTP requests to the Gemini API.
- **Frontend**: Vite, React, Vanilla CSS.
- **Styling**: Modern, premium Vanilla CSS with CSS custom properties (variables), smooth animations, glassmorphism, responsive grid layouts, and a sleek dark theme.
- **Icons**: Lucide Icons (or pure CSS/SVG equivalents for visual styling).

## Commands
- **Install Dependencies**: `npm install`
- **Run Application in Dev**: `npm run dev` (starts Express API server on port 3003 and Vite Dev Server on port 3002 using `concurrently`)
- **Build**: `npm run build`

## Project Structure
```
udemy-player/
├── backend/
│   ├── server.js          # Express app
│   ├── progress_db.json   # Local database (gitignored)
│   └── package.json       # Backend dependencies
├── src/                   # React frontend (Vite configuration at root)
│   ├── components/        # Player, Sidebar, Notes, CourseSelector, SettingsModal
│   ├── styles/            # CSS files (index.css, theme.css, etc.)
│   ├── App.jsx            # Main app page
│   └── main.jsx           # React entry point
├── package.json           # Root package.json to coordinate frontend & backend
├── vite.config.js         # Vite configuration
└── spec.md                # This specification
```

## API Endpoints (Express Backend)
1. **`GET /api/courses`**: List available courses based on a scan of configured parent directories or the current workspace.
2. **`GET /api/course-content?path=<path>`**: Parse a given course directory path, returning grouped lesson files with an array/dictionary of available subtitle tracks (e.g., `{ en: '...', vi: '...' }`).
3. **`GET /api/stream?path=<path>`**: Stream the `.mp4` video with support for range requests (critical for seeking in browser video players).
4. **`GET /api/subtitle?path=<path>`**: Serve subtitles, converting `.srt` to WebVTT on the fly.
5. **`GET /api/userdata`**: Fetch student notes, completed lessons, settings (including Gemini API Key), and video progress.
6. **`POST /api/userdata`**: Update notes, completion flags, and watch times.
7. **`POST /api/userdata/settings`**: Save application settings (Gemini API Key).
8. **`POST /api/translate-subtitle`**: Read an English subtitle file, translate it to Vietnamese using Gemini 1.5 Flash, and save it as a local `.vi.vtt` file next to the video.
9. **`POST /api/browse-folder`**: Open a native system folder browser dialog (using `osascript` on macOS, PowerShell on Windows) and return the chosen directory path.

## Code Style & UX Choices
- **UI Theme**: Dark-mode primary UI (deep blues/grays, electric indigo accents) with high visual hierarchy.
- **Grid Layout**: Three-column dashboard when playing:
  - Left: Course sections & lessons sidebar (collapsible).
  - Center: Main content area (video player / PDF viewer / HTML frame).
  - Right: Timestamped notes panel (notes dynamically link to video times).
- **Subtitle Selection**: Subtitle track selector inside the player overlay or video controls supporting "English", "Vietnamese" (if generated), and "Translate to Vietnamese" triggers.
- **Smooth Interaction**: Transition animations for opening folders, adding notes, and marking completion. Live translation progress feedback.

## Testing Strategy
- Manual verification of video rendering, streaming range headers, and directory scanning.
- Basic Jest or Vitest suite for scanning parser, SRT-to-VTT conversion logic, and translation prompt integration.

## Success Criteria
- [ ] Scanning a course folder lists all chapters and files correctly, identifying all available languages for subtitle tracks.
- [ ] Users can stream video lessons smoothly with subtitle overlays (`.srt` parsed to `.vtt`).
- [ ] Lessons can be completed manually or automatically when the player reaches 90% of the video duration.
- [ ] Users can enter and save their Gemini API key in a Settings panel.
- [ ] If a Vietnamese subtitle is missing, a "Translate to Vietnamese" button is displayed.
- [ ] Clicking "Translate to Vietnamese" generates a valid `.vi.vtt` subtitle file via Gemini 1.5 Flash, saving it next to the video file, and immediately switches the active subtitle track to Vietnamese.
- [ ] Users can add, edit, delete, and jump-to notes that correspond to video timestamps.
- [ ] Seamless integration of companion PDF sheets and HTML checkpoints within the UI.
- [ ] Users can click a "Browse" button next to the course path input to open their OS's native folder dialog, select a course directory, and trigger the course scanning automatically.

## Boundaries
- **Always**: Support browser-native video playback features. Save notes immediately when created/edited.
- **Ask First**: Integrating third-party cloud storage or syncing.
- **Never**: Store absolute local video content inside the Git repository. Store unencrypted Gemini API keys in Git (they must reside in the local `progress_db.json` which is gitignored).
