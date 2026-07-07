# Spec: Hide Video Controls on Mouse Leave

## Objective
Automatically hide the video player controls and overlays immediately when the mouse pointer leaves the video player's container element, instead of waiting for the default 2.5-second inactivity timeout.

## Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (specifically the existing `.controls-hidden` rules)

## Proposed Changes
1. **Event Listeners in VideoPlayer.jsx**:
   Add a `mouseleave` event listener to the video container within the auto-hide controls `useEffect` inside [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx).
2. **Immediate Hiding**:
   When `mouseleave` fires, set `showControls(false)` immediately and clear any active inactivity timeouts to prevent conflicting delayed state changes.
3. **Paused State Preservation**:
   Keep controls visible when the video is paused, matching current UX expectations.

## Commands
- **Dev**: `npm run dev`
- **Lint**: `npm run lint --prefix frontend`
- **Build**: `npm run build --prefix frontend`

## Project Structure
- `frontend/src/components/VideoPlayer.jsx` -> Main video player component
- `frontend/src/index.css` -> Styles for the control overlays

## Code Style
- React functional component hooks pattern.
- Clean and consistent event handler registration and cleanup inside `useEffect`.

## Testing Strategy
- Manual interaction testing to verify:
  - Moving the mouse inside the container shows controls immediately.
  - Leaving the mouse inside the container hides controls after 2.5 seconds.
  - Moving the mouse outside the container hides controls immediately.
  - Pausing the video keeps controls visible regardless of mouse position.

## Success Criteria
- [ ] Controls hide immediately (< 100ms) when the mouse cursor leaves the `.video-container` element during playback.
- [ ] Moving the mouse back inside the container immediately restores controls.
- [ ] If the video is paused, controls remain visible even if the mouse cursor leaves the player area.
- [ ] No React state leaks or console errors are introduced.

## Boundaries
- **Always**: Ensure proper event listener cleanup on component unmount or state updates.
- **Never**: Hide controls when the video is paused.
- **Ask First**: Adding transition animations for controls (using existing CSS transitions is preferred).
