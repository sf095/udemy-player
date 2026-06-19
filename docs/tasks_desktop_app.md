# Tasks: Desktop App Packaging (Electron)

- [x] **Task 1: Resolve Dynamic Backend URL in Frontend**
  - **Acceptance**: `VideoPlayer.jsx` does not hardcode port `3003`. It dynamically constructs the video stream and subtitle sources using `window.location.origin` (or falls back to `http://localhost:3003` when running Vite dev on port 3002).
  - **Verify**: Inspect `frontend/src/components/VideoPlayer.jsx` lines 82-84.
  - **Files**: `frontend/src/components/VideoPlayer.jsx`

- [x] **Task 2: Update Backend for Production Serving & Database Relocation**
  - **Acceptance**: `backend/server.js` respects `process.env.USER_DATA_PATH` for resolving `progress_db.json`. It also serves static files from `../frontend/dist` in production mode.
  - **Verify**: Check `backend/server.js` database path resolution and static routes.
  - **Files**: `backend/server.js`

- [x] **Task 3: Install Electron and electron-builder DevDependencies**
  - **Acceptance**: Root dependencies include `electron` and `electron-builder`.
  - **Verify**: Run install and inspect `package.json`.
  - **Files**: `package.json`

- [x] **Task 4: Add Electron Main and Preload Scripts**
  - **Acceptance**: Create `electron/main.js` and `electron/preload.js`. The main process dynamically selects a free port, configures environment variables, loads the Express server, and renders the native window.
  - **Verify**: Inspect `electron/main.js` and `electron/preload.js`.
  - **Files**: `electron/main.js`, `electron/preload.js`

- [x] **Task 5: Add electron-builder Configuration & Root scripts**
  - **Acceptance**: `electron-builder.yml` is created and configured for macOS/Windows builds. Root `package.json` has `dev:desktop` and `package` scripts.
  - **Verify**: Inspect root `package.json` and `electron-builder.yml`.
  - **Files**: `package.json`, `electron-builder.yml`

- [x] **Task 6: Local Desktop Execution & Packaging Test**
  - **Acceptance**: App builds static assets, packages successfully, installs and runs locally, streaming video lessons and loading native folder selection correctly.
  - **Verify**: Run `npm run dev:desktop` and `npm run package`. Verify the packaged app runs on the local platform.
  - **Files**: None
