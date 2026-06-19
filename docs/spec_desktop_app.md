# Spec: Desktop App Packaging (Electron)

## Objective
Package the Udemy Offline Player web application into a desktop application for macOS and Windows. The app must run offline, manage the Express backend server dynamically in the background, and store user progress persistently inside the OS's application data directories.

## Tech Stack
- **Framework**: Electron (v33+)
- **Build Tool**: `electron-builder`
- **Frontend**: Vite, React (19.2+)
- **Backend**: Express (4.19+)
- **Coordination**: `concurrently` (dev only)

## Commands
- **Install dependencies (including Electron & Builder)**:
  ```bash
  npm run install:all
  npm install electron electron-builder --save-dev
  ```
- **Run in Development Mode**:
  ```bash
  npm run dev:desktop
  ```
- **Build and package for the current platform**:
  ```bash
  npm run package
  ```

## Project Structure
```
udemy-player/
├── docs/
│   └── spec_desktop_app.md  # This specification
├── electron/
│   ├── main.js              # Electron Main Process (lifecycle, Express server manager, IPC)
│   └── preload.js           # Preload script exposing folder browsing API to frontend
├── frontend/
│   ├── dist/                # Static built frontend files (Vite build output)
│   └── ...
├── backend/
│   └── ...
├── package.json             # Root package.json (modified with Electron dev and packaging scripts)
└── electron-builder.yml     # Configuration for electron-builder (packager)
```

## Code Style & Integration Conventions
- **Dynamic Port Selection**:
  The backend server will start on a dynamic port (or a fallback check starting from `3003`). The chosen port is passed to the Electron preload/renderer script so that the frontend knows how to communicate with the backend.
- **Database Location Resolution**:
  Instead of writing to `backend/progress_db.json` (which is read-only when bundled in an Electron `.asar` file), the database must resolve to the user data directory:
  ```javascript
  const { app } = require('electron');
  const path = require('path');
  const DB_FILE = app 
    ? path.join(app.getPath('userData'), 'progress_db.json')
    : path.join(__dirname, 'progress_db.json');
  ```
- **Process Cleanup**:
  When Electron receives the `window-all-closed` or `will-quit` events, it must gracefully kill the spawned Express server sub-process or module.

## Testing Strategy
- **Manual Verification**:
  1. Launch the application in dev mode via `npm run dev:desktop`.
  2. Verify that the window loads and scans directories correctly.
  3. Ensure note entry works, saving to the local user-data folder.
  4. Run `npm run package` to create the production app bundle.
  5. Install and launch the bundled app to verify video streaming, SRT-to-VTT subtitle conversions, and page layout rendering under production conditions.

## Boundaries
- **Always**: Gracefully shut down the background Express server when the Electron window closes.
- **Always**: Resolve local user-data paths for reading/writing `progress_db.json` so data survives app updates.
- **Ask First**: Adding heavy node dependencies inside the Electron process.
- **Never**: Hardcode static ports for the production server in the frontend; always load ports dynamically via IPC initialization.

## Success Criteria
- [ ] Running `npm run dev:desktop` starts Vite dev server, runs the Express backend, and spawns the Electron shell wrapper.
- [ ] Running `npm run package` successfully builds the frontend and packages the entire app into a ready-to-install bundle (`.dmg`/`.app` on macOS, `.exe` on Windows).
- [ ] On startup, the app relocates `progress_db.json` to the correct OS User Data folder, preserving persistence.
- [ ] The app manages the local server port dynamically, avoiding "port in use" issues.
- [ ] The native OS dialog is used for selecting folders if the user prefers, returning the absolute folder paths.

## Open Questions
- **Native OS Folder Picker Integration**: Should we override the current `POST /api/browse-folder` endpoint directly in the backend, or should we pass directory paths via Electron IPC? (IPC is cleaner and recommended).
