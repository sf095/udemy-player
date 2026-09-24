# Spec: Video Player Controls Placement (Floating vs. Below Video)

## Objective
Provide an option allowing users to choose the placement of the video playback controls:
1. **Floating on video (Overlay - default):** Controls (timeline scrubber, play/pause, volume, time, chapters, fullscreen) float over the bottom portion of the video with background blur and automatically hide after 2.5 seconds of inactivity.
2. **Below the video (Docked):** The video controls bar is docked directly below the video viewport in a dedicated bar. In this docked mode, the video frame adjusts cleanly so controls and subtitles never obscure any video content, and controls remain visible during playback.

The setting will be configurable in the **Settings Modal** (under Playback settings) and can also be toggled directly via a quick control button in the player bar for instant switching. The preference persists across sessions and app restarts.

---

## Tech Stack
- **Frontend:** React 19, Vite 8, Vanilla CSS (CSS custom properties)
- **Desktop/Runtime:** Electron 42 (Chromium)
- **Backend / Storage:** Node.js Express server (`/api/userdata/settings`), `progress_db.json`, browser `localStorage` as instant fallback

---

## Commands
- **Install dependencies:** `npm run install:all`
- **Development (Backend + Frontend):** `npm run dev`
- **Frontend Dev Server:** `npm run frontend`
- **Build Frontend:** `npm run build --prefix frontend`
- **Run Desktop App:** `npm run dev:desktop`
- **Lint:** `npm run lint --prefix frontend`

---

## Project Structure
- `frontend/src/components/VideoPlayer.jsx` -> Controls layout rendering, conditional container classes (`controls-floating` vs `controls-docked`), quick toggle button, and layout-aware auto-hide / subtitle adjustment logic.
- `frontend/src/components/SettingsModal.jsx` -> Settings UI toggle/select under Playback section (`controlsPosition`: `'floating'` | `'bottom'`).
- `frontend/src/App.jsx` -> Passes `controlsPosition` setting prop to `VideoPlayer` and handles persistence updates.
- `frontend/src/index.css` -> CSS styling for docked layout: flex column arrangement, dedicated bottom docked control bar, disabling subtitle offset when docked.
- `backend/server.js` -> Schema and persistence update for `controlsPosition` in `DEFAULT_SETTINGS` and `/api/userdata/settings`.

---

## Architecture & Layout Modes

### 1. Floating Mode (`controlsPosition = 'floating'`) [Current Default]
```
+-------------------------------------------------------+
|  [Subtitles: EN...]               [Speed: 1x] [Mode]   | <- Floating Top Overlays
|                                                       |
|                     <video>                           |
|                                                       |
|                                                       |
|  +-------------------------------------------------+  |
|  | [=========== Timeline Scrubber ===============] |  | <- Floating Overlay Bar
|  | [Play] [Vol] 00:15 / 12:40   [Chapters] [Dock] [F] |  |    (hides on idle)
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
```

### 2. Docked Below Video Mode (`controlsPosition = 'bottom'`)
```
+-------------------------------------------------------+
|  [Subtitles: EN...]               [Speed: 1x] [Mode]   | <- Top Overlays (auto-hide)
|                                                       |
|                     <video>                           | <- Takes flex: 1
|                                                       |
+-------------------------------------------------------+
|  [=========== Full Timeline Scrubber ===============]  | <- Docked Bottom Bar
|  [Play] [Vol] 00:15 / 12:40   [Chapters] [Float] [F]  |    (permanently visible,
+-------------------------------------------------------+     never overlaps video)
```

### Subtitle Handling Difference:
- In **Floating mode**: Visible controls shift subtitles up (`translateY(-80px)`) to avoid overlapping the floating bar.
- In **Docked mode**: Subtitles remain naturally at the bottom edge of the video (`translateY(0)`), since the controls bar lives outside the video canvas.

### Fullscreen Mode Handling:
- In native fullscreen mode, the player automatically switches to floating overlay mode with auto-hiding controls to maximize video viewing area and ensure a cinematic experience.
- When exiting fullscreen, the player seamlessly restores the user's selected mode ("below the video" or "floating").

---

## Code Style
- React 19 functional components with explicit props and hooks.
- Semantic CSS classes: `.video-container--docked`, `.video-control-bar--docked`.
- Minimal state additions, backward-compatible default fallback (`'floating'`).
- Match existing project patterns in `SettingsModal.jsx` and `VideoPlayer.jsx`.

---

## Testing Strategy
1. **Unit / Build Verification:**
   - Run `npm run build --prefix frontend` ensuring 0 build errors.
2. **Manual Functional Testing:**
   - **Mode switching:** Switch between "Floating" and "Below video" in SettingsModal -> UI updates immediately.
   - **Quick toggle:** Click the layout icon button in the player control bar -> toggles smoothly between floating overlay and docked bottom bar.
   - **Playback & Subtitles:** Ensure subtitles display cleanly without being pushed up unnecessarily in docked mode.
   - **Auto-hide behavior:** In floating mode, controls hide after 2.5s idle. In docked mode, the bottom bar stays visible and accessible while top overlay chips auto-hide.
   - **Fullscreen:** Test fullscreen toggle in docked mode -> verifies it temporarily switches to floating overlay to maximize screen real estate, then returns to docked on exit.
   - **Persistence:** Refresh page and restart app -> user's preferred layout persists.

---

## Boundaries
- **Always do:**
  - Maintain aspect ratio of the video (`object-fit: contain`).
  - Keep timeline scrubbing, volume controls, chapter navigation, and keyboard shortcuts 100% functional in both modes.
  - Follow Rule 2 & 3: surgical edits, minimal code.
- **Never do:**
  - Break existing video playback or audio boosting pipeline.
  - Change default behavior for existing users who prefer the default floating layout.

---

## Success Criteria
- [ ] Users can select controls placement in SettingsModal ("Floating on video" vs "Below video").
- [ ] Users can quickly toggle between floating and docked modes directly from the video player control bar.
- [ ] In "Floating on video" mode, controls overlay the video with 2.5s auto-hide and subtitle offset as they do currently.
- [ ] In "Below video" mode, the video container displays a dedicated controls bar below the video frame, without obstructing the video content.
- [ ] In "Below video" mode, top overlay chips continue floating at the top and auto-hide on idle.
- [ ] Entering Fullscreen temporarily switches to floating overlay mode to maximize video viewing area, and restores docked mode upon exit.
- [ ] Subtitle track styling properly adjusts between modes so subtitles are never misplaced.
- [ ] Preference is saved in backend `progress_db.json` and restored on startup.
- [ ] Build succeeds with 0 errors via `npm run build --prefix frontend`.

---

## Resolved Decisions
1. **Top Overlays:** Keep top overlay chips (subtitles, speed, autoplay) floating on top of the video with auto-hide.
2. **Fullscreen Behavior:** Automatically switch to floating overlay in fullscreen to maximize video viewing area, then restore docked mode upon exiting fullscreen.
