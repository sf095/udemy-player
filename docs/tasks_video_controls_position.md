# Tasks: Video Player Controls Placement (Floating vs. Below Video)

## Plan Summary
1. **Backend & Persistence (Task 1):** Extend `DEFAULT_SETTINGS` in `backend/server.js` with `controlsPosition` (`'floating'` | `'bottom'`), sanitize in `/api/userdata/settings`.
2. **Settings UI & App Integration (Task 2):** Add `controlsPosition` field in `SettingsModal.jsx` (Playback section) and wire through `App.jsx` with instant `localStorage` synchronization.
3. **Player Component & CSS Styling (Task 3):** Implement docked vs floating layout in `VideoPlayer.jsx` and `index.css`:
   - Dedicated video stage (`flex: 1`) and docked bottom bar (`position: relative`).
   - Quick toggle button in control bar.
   - Automatically fall back to floating overlay when in fullscreen.
   - Suppress subtitle `translateY(-80px)` shift when docked.
4. **Verification & Build (Task 4):** Verify build with `npm run build --prefix frontend`, and validate all user flows.

---

## Tasks

- [x] Task 1: Backend Settings Persistence for `controlsPosition`
  - Acceptance: `controlsPosition` supported in `DEFAULT_SETTINGS` and `/api/userdata/settings`, sanitized to `'floating'` or `'bottom'`.
  - Verify: Run scratch test script verifying `progress_db.json` reads and writes `controlsPosition`.
  - Files: `backend/server.js`

- [x] Task 2: Settings Modal UI and App State Management
  - Acceptance: `SettingsModal.jsx` provides a selection for controls placement under Playback settings. `App.jsx` passes state to `VideoPlayer` and persists changes.
  - Verify: Changing setting in modal reflects in state and backend API.
  - Files: `frontend/src/components/SettingsModal.jsx`, `frontend/src/App.jsx`

- [x] Task 3: VideoPlayer Docked Layout & CSS Styling
  - Acceptance:
    - In "Below video" mode: controls bar is docked below video without overlapping video content.
    - Subtitles remain at bottom without 80px shift in docked mode.
    - Top overlay chips float and auto-hide as agreed.
    - Fullscreen automatically uses floating overlay mode, restoring docked upon exit.
    - Quick-toggle button in the player control bar toggles layout instantly.
  - Verify: Build succeeds; manual inspection of layout and responsiveness.
  - Files: `frontend/src/components/VideoPlayer.jsx`, `frontend/src/index.css`

- [x] Task 4: End-to-End Build and Verification Check
  - Acceptance: `npm run build --prefix frontend` finishes with 0 errors and all acceptance criteria met.
  - Verify: Run `npm run build --prefix frontend`.
  - Files: None (verification step)
