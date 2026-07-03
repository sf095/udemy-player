# Tasks: Autoplay Next Video Feature

Here is the task breakdown for the implementation of the Autoplay Next Video feature.

---

### [x] Task 1: Backend Settings Persistence
- **Description**: Add support for `autoplayNext` field to backend DB and settings endpoint.
- **Acceptance**:
  - `DEFAULT_SETTINGS` includes `autoplayNext: false`.
  - `/api/userdata/settings` accepts `autoplayNext` and writes it to `progress_db.json`.
- **Verify**: Inspect `progress_db.json` when settings are updated to confirm `autoplayNext` is saved.
- **Files**:
  - [backend/server.js](file:///Users/hientranthanh/downloads/sources/udemy-player/backend/server.js)

---

### [x] Task 2: Settings Modal UI Integration
- **Description**: Add a styled checkbox/toggle for Autoplay Next Video in the Settings Modal.
- **Acceptance**:
  - The modal has an "Autoplay Next Video" toggle switch/checkbox with secondary explanation.
  - Toggling it updates the form state and submits the value to `onSave`.
- **Verify**: Open Settings in UI, toggle Autoplay, save, and confirm changes persist.
- **Files**:
  - [frontend/src/components/SettingsModal.jsx](file:///Users/hientranthanh/downloads/sources/udemy-player/frontend/src/components/SettingsModal.jsx)

---

### [x] Task 3: Lift Autoplay State & Navigation Logic in App.jsx
- **Description**: Update frontend settings initialization, handle on-the-fly autoplay toggling, compute next lesson existence, and feed props to VideoPlayer.
- **Acceptance**:
  - `DEFAULT_SETTINGS` in `App.jsx` includes `autoplayNext: false`.
  - Added `handleToggleAutoplay` to flip `settings.autoplayNext` and save to backend.
  - Added logic to compute `hasNextLesson` (returns `true` if current active lesson is not the last one in the course).
  - Pass `autoplayEnabled={settings.autoplayNext}`, `onToggleAutoplay={handleToggleAutoplay}`, `hasNextLesson={hasNextLesson}`, and `onPlayNextLesson={goToNextLesson}` to `<VideoPlayer />`.
- **Verify**: Check that props are passed correctly and state updates without error.
- **Files**:
  - [frontend/src/App.jsx](file:///Users/hientranthanh/downloads/sources/udemy-player/frontend/src/App.jsx)

---

### [x] Task 4: VideoPlayer UI Controls & Countdown Overlay
- **Description**: Add the Autoplay toggle button to the top-right overlay controls and implement the 5-second countdown transition overlay.
- **Acceptance**:
  - Render an Autoplay toggle next to the playback speed controls (e.g. `[Autoplay: ON/OFF]` button or a switch).
  - Bind `ended` listener to the video element.
  - When `ended` is triggered:
    - If `autoplayEnabled && hasNextLesson` is true, show overlay "Up Next: [Next Lesson Title]" and count down from 5s.
    - Buttons "Play Now" (immediate transition) and "Cancel" (dismiss overlay).
    - At 0s, trigger `onPlayNextLesson()`.
- **Verify**: Play a video to the end. Observe the countdown overlay, click Cancel to stay, or click Play Now to transition immediately, and let it run to 0 to auto-transition.
- **Files**:
  - [frontend/src/components/VideoPlayer.jsx](file:///Users/hientranthanh/downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx)
