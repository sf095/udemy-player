# Spec: Keep Player Controls Visible When Hovering

## Objective
Prevent the video player controls from automatically hiding while the user's mouse/pointer is hovering over any part of the player controls (e.g., bottom control bar, timeline scrubber, top overlay chips, or chapters panel).
Controls remain visible indefinitely as long as the pointer stays over the controls, and resume the 2.5s inactivity hide timer once the pointer moves off the controls onto the video playback area.

## Tech Stack
- Frontend: React 19, Vite 8, Vanilla CSS
- Desktop/Runtime: Electron 42 (Chromium)

## Commands
- Dev (Backend + Frontend): `npm run dev`
- Dev (Desktop): `npm run dev:desktop`
- Frontend Dev Server: `npm run frontend`
- Build Frontend: `npm run build --prefix frontend`
- Lint: `npm run lint --prefix frontend`

## Project Structure
- `frontend/src/components/VideoPlayer.jsx` -> Main video player component containing the auto-hide `useEffect` timer and control elements.
- `frontend/src/index.css` -> Styles for the control bar, overlays, and hiding behavior (`.controls-hidden`).

## Code Style
Adhere to React functional component hooks pattern in `VideoPlayer.jsx`:
- Controls hover detection via `e.target?.closest?.(CONTROLS_SELECTOR)` and `:hover` query selector.
- Immediate listener cleanup on unmount or state change.

## Testing Strategy
1. **Manual Interaction Verification**:
   - Play video -> move cursor over `.video-control-bar` (e.g., hover over play button or volume slider) and keep still for > 5 seconds -> Controls remain visible.
   - Move cursor from control bar onto the middle of the video screen and keep still for > 2.5 seconds -> Controls hide after 2.5 seconds.
   - Move cursor over `.video-overlays-container` (top controls) and keep still for > 5 seconds -> Controls remain visible.
   - Move cursor completely out of `.video-container` -> Controls hide immediately (existing mouseleave behavior).
   - Pause video -> Controls remain visible regardless of cursor position.
2. **Build Verification**:
   - Run `npm run build --prefix frontend` to ensure zero compilation or bundling errors.

## Boundaries
- **Always do:**
  - Clear any pending timeouts cleanly when hovering over controls or unmounting.
  - Preserve immediate hiding when leaving the container (`mouseleave`).
  - Keep controls visible when paused (`!isPlaying`).
  - Follow Rule 2 & 3: surgical edits, minimal code.
- **Ask first:**
  - Changing timeout durations (currently 2500ms) or adding new UI elements.
- **Never do:**
  - Alter backend or Electron main processes for this frontend interaction logic.
  - Break keyboard shortcut or scrubbing interactions.

## Success Criteria
- [x] Controls do NOT auto-hide after 2.5 seconds if the cursor is resting over `.video-control-bar` or `.video-overlays-container` or `.video-chapters-panel`.
- [x] When the cursor moves off the controls onto the video playback area, controls hide after 2.5 seconds of inactivity.
- [x] When the cursor leaves `.video-container` entirely, controls hide immediately.
- [x] When video is paused, controls remain visible at all times.
- [x] Build succeeds cleanly with `npm run build --prefix frontend`.
