# Tasks: YouTube-like Timeline & Chapters implementation

Below is the list of sequential, concrete tasks to implement this feature.

- [x] **Task 1: Backend Chapter APIs & AI Generator**
  - **Description**: Add endpoints to serve and generate chapters. If no cache exists, parse subtitles and query Gemini to create chapter JSON.
  - **Acceptance**:
    - `GET /api/chapters?videoPath=...&subtitlePath=...` returns chapters JSON.
    - If `[video_name].chapters.json` exists on disk, load and return it.
    - If not, and `subtitlePath` exists, call Gemini fallback to create chapters, write `[video_name].chapters.json`, and return it.
    - If no subtitles or generation fails, return `[]`.
    - `POST /api/chapters/regenerate` manually triggers a fresh AI scan and overwrites the cached file.
  - **Verify**: Run `curl "http://127.0.0.1:3003/api/chapters?videoPath=..."` and verify response structure.
  - **Files**: `backend/server.js`

- [x] **Task 2: Custom Controls Styles**
  - **Description**: Add CSS rules in `index.css` for custom timeline, glassmorphic player controls bar, tooltip, volume slider, and container fullscreen compatibility.
  - **Acceptance**:
    - `.video-control-bar` sits at the bottom, matching top overlays, glassmorphic, and respects `.controls-hidden`.
    - Segmented progress bar tracks show 2px gaps between segments.
    - Hovering timeline shows scrubber handle and transition styling.
    - Floating tooltip above timeline is styled nicely.
  - **Verify**: Visual check on render.
  - **Files**: `frontend/src/index.css`

- [x] **Task 3: Custom Playback Control Bar UI**
  - **Description**: Disable native video controls, implement play/pause button, volume mute button + volume slider, duration display, and container-level fullscreen button.
  - **Acceptance**:
    - Native `controls` attribute removed.
    - Controls bar fades out after 2.5s mouse inactivity when playing.
    - Play/Pause icon toggles state, volume slider controls sound, time display updates.
    - Fullscreen button triggers fullscreen on `.video-container` wrapper.
  - **Verify**: Click play/pause, adjust volume, toggle fullscreen, check overlay visibility in fullscreen.
  - **Files**: `frontend/src/components/VideoPlayer.jsx`

- [x] **Task 4: Chapter Timeline Segmentation & Tooltip Scrubbing**
  - **Description**: Fetch chapters from backend, render segmented timeline track, calculate correct time mapping on click/drag scrub, and show tooltip with chapter title and time on hover.
  - **Acceptance**:
    - Chapters are fetched on load/change of video.
    - Timeline shows segmented tracks.
    - Hovering timeline calculates precise time, matches chapter title, and positions tooltip.
    - Clicking/dragging timeline changes `video.currentTime` smoothly.
  - **Verify**: Hover timeline to see tooltip updates, click/drag to seek, verify chapter boundaries are visual.
  - **Files**: `frontend/src/components/VideoPlayer.jsx`

- [x] **Task 5: Keyboard Shortcut Alignment**
  - **Description**: Update fullscreen hotkey handler in `App.jsx` to toggle fullscreen on the video container container instead of `<video>`.
  - **Acceptance**:
    - Pressing `F` key triggers container-level fullscreen toggle.
  - **Verify**: Press `F` key, verify custom control bar and top overlays remain visible in fullscreen.
  - **Files**: `frontend/src/App.jsx`
