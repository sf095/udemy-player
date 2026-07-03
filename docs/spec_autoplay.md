# Spec: Autoplay Next Video Feature

## Objective
To enhance the learning experience by automatically playing the next video/lesson in the course when the current video finishes. This is a common and standard feature in modern e-learning platforms (like Udemy, YouTube, Netflix).

### User Stories
1. **Seamless Progression**: As a student, I want the player to automatically play the next video in the section/course when the current video finishes, so that I can study hands-free.
2. **Autoplay Control**: As a student, I want to easily toggle this feature ON or OFF from both the video player itself and the application settings.
3. **Graceful Transition (Countdown)**: As a student, when a video ends, I want a brief visual countdown (e.g., 5 seconds) showing the next lesson title and giving me the option to either "Play Now" (skip countdown) or "Cancel" (stay on the finished lesson).
4. **State Persistence**: As a student, I want my autoplay preference to be remembered when I close and reopen the application.

## Tech Stack
- **Frontend**: React 19, Vite, Lucide Icons, Vanilla CSS
- **Backend/Desktop**: Node.js, Express, Local JSON DB (`progress_db.json`)

## Commands
- **Dev (Concurrent)**: `npm run dev`
- **Frontend Dev**: `npm run dev --prefix frontend`
- **Backend Dev**: `npm run dev --prefix backend`
- **Production Build (Frontend)**: `npm run build --prefix frontend`

## Project Structure
- `frontend/src/App.jsx` — Core application logic, next/prev lesson handlers, and application settings state.
- `frontend/src/components/VideoPlayer.jsx` — Handles HTML5 video playback, progress, ending event, and the autoplay overlay toggle.
- `frontend/src/components/SettingsModal.jsx` — Allows toggling autoplay persistence inside the application settings.
- `backend/server.js` — Handles loading and saving settings to local database JSON file (`progress_db.json`).

## Code Style
- **React**: Functional components with hooks.
- **Styling**: Inline styles for layout positioning, aligned with current React code, and CSS variables from `index.css` for consistent colors.
- **State Management**: Lift settings and autoplay state to `App.jsx` for synchronization between `VideoPlayer` and `SettingsModal`.
- **Snippet example**:
```jsx
// Toggle state in settings
const handleToggleAutoplay = async () => {
  const updatedSettings = { ...settings, autoplayNext: !settings.autoplayNext };
  await handleSaveSettings(updatedSettings);
};
```

## Testing Strategy
- **Manual Verification**:
  1. Toggle autoplay ON in settings, verify it saves in backend `progress_db.json`.
  2. Toggle autoplay OFF in settings, verify it saves in backend `progress_db.json`.
  3. Play a video till the end (or seek close to the end), let it finish, and verify the countdown overlay appears showing the next lesson name.
  4. Test clicking "Cancel" in the countdown: it should close the countdown and keep the current video page without transitioning.
  5. Test clicking "Play Now" in the countdown: it should immediately load and play the next lesson.
  6. Let the countdown run to 0: it should automatically load and play the next lesson.
  7. Toggle autoplay OFF on the player overlay, let the video finish: the countdown should NOT appear, and it should not transition.

## Boundaries
- **Always**: Follow existing UI design (dark/light themes, sleek glassmorphism panels, circular pills for overlays).
- **Ask first**: N/A (Self-contained change within frontend components and server settings endpoints).
- **Never**: Break video loading or cause infinite loop redirects when reaching the last video.

## Success Criteria
- [x] Autoplay toggle present in `SettingsModal.jsx` and `VideoPlayer.jsx` (synced).
- [x] Setting is saved and persisted to backend `progress_db.json` under `settings.autoplayNext`.
- [x] At the end of a video (video `ended` event), if `settings.autoplayNext` is true, a 5-second countdown overlay displays over the video:
  - Shows "Up Next: [Next Lesson Title]".
  - Displays a circular/linear progress bar or text counting down from 5 to 0.
  - Buttons: "Play Now" and "Cancel".
- [x] When the countdown finishes or "Play Now" is clicked, the app loads and plays the next lesson.
- [x] When "Cancel" is clicked, the overlay is dismissed, and no transition occurs.
- [x] If the current lesson is the last lesson in the course, the countdown does not show, and no transition occurs.

## Open Questions
1. **Should the countdown delay be customizable?**
   *Recommendation*: Keep it fixed at 5 seconds for simplicity and consistency, but allow the user to immediately skip it via "Play Now".
2. **What if the next lesson is not a video? (e.g. PDF document)**
   *Recommendation*: Automatically transition to it, but since it is a document, we just load it without autoplay (it will show the document viewer).
