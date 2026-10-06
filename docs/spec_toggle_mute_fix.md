# Spec: Fix Mute Toggle (Shortcut M and Sound Icon)

## Objective
Fix the issue where pressing keyboard shortcut `M` (or `m`) and tapping/clicking the sound icon fails to toggle mute. Currently, attempting to mute the player immediately flips the state back to unmuted within milliseconds, preventing the player from ever remaining muted.

### User Stories & Acceptance Criteria
- **User Story 1:** As a student watching a lecture, when I click or tap the sound icon button in the player control bar, the video audio should mute immediately, the icon should switch to `<VolumeX />`, the tooltip should read "Unmute (m)", and a toast `🔇 Muted` should display.
- **User Story 2:** As a student, when I click or tap the sound icon button while muted, the video audio should unmute, restoring the previous volume level (or 100% if volume was 0%), the icon should display the appropriate volume state icon (`<Volume1 />`, `<Volume2 />`, or boosted amber icon), the tooltip should read "Mute (m)", and a toast with the active volume percentage should display.
- **User Story 3:** As a student, when I press `m` or `M` (with or without CapsLock) while video playback is active, the mute state should toggle reliably between muted and unmuted with the corresponding audio and visual feedback.
- **User Story 4:** As a student, when audio boost is active (> 100%), muting should completely silence the Web Audio API booster output (`GainNode`), and unmuting should cleanly restore the boosted amplification level.
- **User Story 5:** The mute state should persist across lessons and page reloads via `localStorage` (`udemy-player-muted`).

---

## Tech Stack
- **Frontend Framework:** React 19.2, Vite 8.0
- **Audio Processing:** Web Audio API (`AudioContext`, `GainNode`, `DynamicsCompressorNode` in `audioBooster.js`), HTML5 `<video>`
- **Icons:** `lucide-react` (`VolumeX`, `Volume1`, `Volume2`)
- **State Management:** React hooks in `App.jsx`, passed down to `VideoPlayer.jsx`
- **Shortcuts:** Custom hook in `frontend/src/hooks/useKeyboardShortcuts.js`

---

## Commands
- **Dev Server:** `npm run dev`
- **Frontend Dev:** `npm run dev --prefix frontend`
- **Frontend Build:** `npm run build --prefix frontend`
- **Frontend Lint:** `npm run lint --prefix frontend`
- **Package App:** `npm run package`

---

## Project Structure
- `frontend/src/App.jsx` — Owns `isMuted`, `volume`, `handleToggleMute`, and global shortcut registration.
- `frontend/src/components/VideoPlayer.jsx` — HTML5 `<video>` element, custom volume control group, audio booster sync, and video event listeners.
- `frontend/src/utils/audioBooster.js` — Web Audio API booster manager.
- `frontend/src/hooks/useKeyboardShortcuts.js` — Global window keydown listener with modifier and key matching.

---

## Root Cause Analysis
1. **Feedback Loop in Video Event Listener:**
   - In `frontend/src/components/VideoPlayer.jsx` (lines 972-976, 983), a `volumechange` listener on the `<video>` element checks:
     ```javascript
     const handleVolumeChange = () => {
       if (video.muted !== isMuted && onToggleMute) {
         onToggleMute();
       }
     };
     ```
   - When `onToggleMute` in `App.jsx` sets `isMuted` to `true`, `VideoPlayer` sets `video.muted = true`.
   - Mutating `video.muted` dispatches a native DOM `'volumechange'` event.
   - The effect registering this listener lacked `isMuted` in its dependency array, closing over the initial `isMuted = false`.
   - Consequently, `handleVolumeChange` evaluated `video.muted (true) !== isMuted (false)` as `true`, immediately calling `onToggleMute()` again and resetting `isMuted` back to `false`.
   - Because the `<video>` element has `controls={false}` and is entirely driven by custom React controls, listening to `volumechange` to invoke `onToggleMute` was both redundant and defective.

2. **Web Audio Booster Gain Disconnect:**
   - When the audio booster is attached to the video, `audioBooster.setBoost(volume > 1 ? volume : 1)` was called without considering `isMuted`.
   - To guarantee silence in all browser engines when muted, the booster gain must be set to `0` when `isMuted` is true, and restored to `volume > 1 ? volume : 1` when unmuted.

3. **CapsLock Sensitivity in Shortcuts:**
   - In `useKeyboardShortcuts.js`, single-character keys were matched via strict `e.key === key`. If CapsLock is active, `e.key` is `'M'`, which failed to match `key: 'm'`.

---

## Code Style
Functional React components with hooks. Surgical changes matching existing patterns.

```javascript
// Sync volume state and AudioBooster with the video element
useEffect(() => {
  const video = playerRef.current;
  if (video) {
    audioBooster.attach(video);
    video.volume = Math.min(1, Math.max(0, volume));
    video.muted = isMuted;
    audioBooster.setBoost(isMuted ? 0 : (volume > 1 ? volume : 1));
  }
}, [videoPath, volume, isMuted, playerRef]);
```

---

## Testing Strategy
1. **Manual Verification in Video Player:**
   - Load any video lesson.
   - Tap/click the sound icon button: Verify audio is muted, icon changes to `VolumeX`, title changes to "Unmute (m)", and toast `🔇 Muted` displays.
   - Tap/click the sound icon button again: Verify audio resumes, icon changes to volume level icon, and toast with percentage displays.
   - Press `m` key: Verify mute toggles cleanly.
   - Turn CapsLock ON and press `m`: Verify mute toggles cleanly.
   - Increase volume past 100% (boosted, e.g. 200%): Press `m` or click icon to mute -> verify complete silence. Press `m` or click icon to unmute -> verify audio resumes at 200% boost.
   - Reload page / navigate between lessons: Verify mute state is remembered.
2. **Automated Verification:**
   - Run `npm run build --prefix frontend` to ensure clean build.

---

## Boundaries
- **Always:**
  - Keep `video.volume` within legal DOM range `[0, 1]`.
  - Maintain Web Audio soft limiter and restore boost level when unmuting.
  - Keep user mute preference synchronized in `localStorage`.
- **Ask first:**
  - Any modifications to database schema or backend APIs.
- **Never:**
  - Re-introduce feedback loops between React state and DOM event listeners.
  - Break volume slider dragging, magnetic snapping, or volume shortcut adjustment.

---

## Success Criteria
- [ ] Clicking or tapping the sound icon reliably toggles mute state between muted and unmuted without reverting.
- [ ] Keyboard shortcut `m` and `M` (including with CapsLock enabled) reliably toggles mute.
- [ ] Web Audio booster is silenced (`gain = 0`) when muted and restored when unmuted.
- [ ] Toast notifications and icon visuals accurately reflect the muted/unmuted state.
- [ ] Frontend builds cleanly with `npm run build --prefix frontend`.

---

## Assumptions & Open Questions
### Assumptions
1. Muting should mute both standard audio (0%-100%) and boosted Web Audio (> 100%).
2. When unmuting from a non-zero volume, the player should return to that previous volume.
3. If unmuted while volume was at 0%, restoring volume to 100% (1.0) provides the most intuitive user experience (matching standard video players like YouTube).

### Open Questions
- None. Requirements are clear and the root cause has been precisely pinpointed.
