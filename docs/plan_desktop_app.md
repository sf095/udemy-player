# Plan: Desktop App Packaging (Electron)

## Implementation Strategy
We will wrap the existing React + Express codebase in an Electron container. The frontend will be served directly by the Express backend in production to simplify routing, proxying, and CORS handling.

### Step 1: Frontend and Backend Adjustments
1. **Dynamic Backend URL**: Update `frontend/src/components/VideoPlayer.jsx` to resolve the backend URL dynamically using `window.location.origin` (falling back to `http://localhost:3003` in development port 3002).
2. **Persistent DB Path**: Modify `backend/server.js` to look for a `USER_DATA_PATH` environment variable. If present, it will write `progress_db.json` to that directory instead of `backend/`.
3. **Static File Serving**: Update `backend/server.js` to serve the static built frontend assets when run in production mode.

### Step 2: Configure Electron Processes
1. **Preload Script**: Create `electron/preload.js` to expose native window APIs if needed (e.g. system folder dialog triggers).
2. **Main Process**: Create `electron/main.js` which:
   - Uses `get-port` or a simple socket check to find a free port starting at 3003.
   - Sets `process.env.PORT` and `process.env.USER_DATA_PATH`.
   - Requires `backend/server.js` to start the Express server.
   - Spawns the Electron window and loads `http://localhost:<PORT>`.
   - Cleans up and kills the backend on exit.

### Step 3: Packaging Configuration
1. **Dependencies**: Install `electron` and `electron-builder` in root devDependencies.
2. **electron-builder.yml**: Define build packaging rules, icons, and target directories (including output `.dmg` and `.exe`).
3. **Scripts**: Add `dev:desktop` and `package` scripts to root `package.json`.

### Step 4: Verification
1. Run development shell to verify communication.
2. Run full packaging build and install locally to ensure offline operation and video streaming work.
