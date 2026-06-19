# Spec: Udemy Offline Player

## Objective
Build a local web-based player for offline-downloaded Udemy courses. Users can point the application to their course folders, browse course sections, play video lessons with subtitles, view HTML/PDF content, record timestamped notes, and track progress (manually or automatically at 90% watch progress).

## Assumptions & Architecture
1. **Security Context**: Browsers restrict direct access to local files (e.g. streaming `.mp4` or loading local directories). To bypass this, we will run a light Node.js/Express server on `localhost` that scans directories, serves media files via standard streaming, and reads/writes a local `progress_db.json` database.
2. **Local Course Structure**:
   - Root folder contains section/chapter directories (e.g., `01 - Section Name`, `02 - Section Name`).
   - Section folders contain:
     - Video files (`.mp4`)
     - Subtitle files (`.srt` or `.vtt`)
     - PDF/HTML resource files (`.pdf`, `.html`)
3. **Data Persistence**:
   - A single `userdata.json` file in the backend to store:
     - Configured course roots (history of folders).
     - Completed lessons status.
     - Video progress (current timestamp).
     - Notes (associated with a specific course, lesson, and timestamp).

## Tech Stack
- **Backend**: Node.js, Express, `cors`, standard node libraries (`fs`, `path`).
- **Frontend**: Vite, React, Vanilla CSS.
- **Styling**: Modern, premium Vanilla CSS with CSS custom properties (variables), smooth animations, glassmorphism, responsive grid layouts, and a sleek dark theme.
- **Icons**: Lucide Icons (or pure CSS/SVG equivalents for visual styling).

## Commands
- **Install Dependencies**: `npm install`
- **Run Application in Dev**: `npm run dev` (starts Express API server on port 3001 and Vite Dev Server on port 3000 using `concurrently`)
- **Build**: `npm run build`

## Project Structure
```
udemy-player/
├── backend/
│   ├── server.js          # Express app
│   ├── progress_db.json   # Local database (gitignored)
│   └── package.json       # Backend dependencies
├── src/                   # React frontend (Vite configuration at root)
│   ├── components/        # Player, Sidebar, Notes, CourseSelector
│   ├── styles/            # CSS files (index.css, theme.css, etc.)
│   ├── App.jsx            # Main app page
│   └── main.jsx           # React entry point
├── package.json           # Root package.json to coordinate frontend & backend
├── vite.config.js         # Vite configuration
└── spec.md                # This specification
```

## API Endpoints (Express Backend)
1. **`GET /api/courses`**: List available courses based on a scan of configured parent directories or the current workspace.
2. **`GET /api/course-content?path=<path>`**: Parse a given course directory path, sorting subdirectories as sections and grouping lesson files (videos, SRTs, PDFs, HTML checkpoints).
3. **`GET /api/stream?path=<path>`**: Stream the `.mp4` video with support for range requests (critical for seeking in browser video players).
4. **`GET /api/subtitle?path=<path>`**: Serve subtitles, converting `.srt` to WebVTT on the fly so the `<video>` element can read it natively.
5. **`GET /api/userdata`**: Fetch student notes, completed lessons, and video progress.
6. **`POST /api/userdata`**: Update notes, completion flags, and watch times.

## Code Style & UX Choices
- **UI Theme**: Dark-mode primary UI (deep blues/grays, electric indigo accents) with high visual hierarchy.
- **Grid Layout**: Three-column dashboard when playing:
  - Left: Course sections & lessons sidebar (collapsible).
  - Center: Main content area (video player / PDF viewer / HTML frame).
  - Right: Timestamped notes panel (notes dynamically link to video times).
- **Smooth Interaction**: Transition animations for opening folders, adding notes, and marking completion.

## Testing Strategy
- Manual verification of video rendering, streaming range headers, and directory scanning.
- Basic Jest or Vitest suite for scanning parser and SRT-to-VTT conversion logic.

## Success Criteria
- [ ] Scanning a course folder lists all chapters and files correctly.
- [ ] Users can stream video lessons smoothly with subtitle overlays (`.srt` parsed to `.vtt`).
- [ ] Lessons can be completed manually or automatically when the player reaches 90% of the video duration.
- [ ] Users can add, edit, delete, and jump-to notes that correspond to video timestamps.
- [ ] Seamless integration of companion PDF sheets and HTML checkpoints within the UI.

## Boundaries
- **Always**: Support browser-native video playback features. Save notes immediately when created/edited.
- **Ask First**: Integrating third-party cloud storage or syncing.
- **Never**: Store absolute local video content inside the Git repository.
