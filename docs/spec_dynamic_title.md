# Spec: Dynamic Window/Document Title for Playing Video

## Objective
Update the window/document title dynamically in the Udemy Offline Player application. When a lesson (video, PDF, HTML, or Quiz) is selected or playing, the document title (and consequently, the Electron window title) should automatically update to show the currently playing/active lesson title, its status (playing/paused), and the app name. When no lesson is active, it should revert to the default title.

### User Stories / Acceptance Criteria
- **No Active Lesson:** The title must be `Udemy Offline Player - Custom Learning Portal`.
- **Active Video Lesson (Playing):** The title must be `▶ [Lesson Title] - Udemy Offline Player`.
- **Active Video Lesson (Paused):** The title must be `⏸ [Lesson Title] - Udemy Offline Player`.
- **Active Non-Video Lesson (PDF/HTML/Quiz):** The title must show the lesson type suffix, e.g., `[Lesson Title] (PDF) - Udemy Offline Player` or `[Lesson Title] (Quiz) - Udemy Offline Player`.

## Tech Stack
- Frontend: React (v19.2.6), Vite (v8.0.12)
- Electron: v42.4.1
- Backend: Node.js/Express

## Commands
- Install dependencies: `npm run install:all`
- Run web dev server: `npm run dev`
- Run Electron desktop dev server: `npm run dev:desktop`
- Build frontend: `npm run build --prefix frontend`
- Package desktop app: `npm run package`

## Project Structure
- `frontend/src/App.jsx` -> Main entry point and layout shell, manages the state of the active lesson and overall UI layout.
- `frontend/src/components/VideoPlayer.jsx` -> Audio/video player component, manages HTML5 `<video>` state and custom controls.
- `electron/main.js` -> Electron main process; creates the browser window.

## Code Style
We will use modern React functional components with standard hooks (`useState`, `useEffect`).
Example:
```jsx
useEffect(() => {
  if (!activeLesson) {
    document.title = 'Udemy Offline Player - Custom Learning Portal';
    return;
  }
  const statusPrefix = isVideoPlaying ? '▶ ' : '⏸ ';
  document.title = `${statusPrefix}${activeLesson.title} - Udemy Offline Player`;
}, [activeLesson, isVideoPlaying]);
```

## Testing Strategy
Manual verification of the browser title and Electron window title under the following conditions:
1. App is loaded without a course (empty state).
2. A course is loaded but no lesson is playing.
3. A video lesson is played, paused, and resumed.
4. A PDF document resource is selected.
5. An HTML document resource is selected.
6. A Quiz is selected.
7. The course is closed or changed.

## Boundaries
- **Always:** Use React effects to update the DOM's `document.title` to ensure synchronization.
- **Ask first:** Modifying IPC channels or exposing play state to Electron main process if document title synchronisation is sufficient. (Document title sync is sufficient since Electron handles it automatically).
- **Never:** Directly mutate `document.title` inside event handlers without React state/lifecycle hooks.

## Success Criteria
- [ ] Document title is `Udemy Offline Player - Custom Learning Portal` when no course or lesson is active.
- [ ] Document title changes to `▶ [Lesson Title] - Udemy Offline Player` when a video is actively playing.
- [ ] Document title changes to `⏸ [Lesson Title] - Udemy Offline Player` when a video is paused.
- [ ] Document title changes to `[Lesson Title] (PDF) - Udemy Offline Player` (or other suffix) when a PDF, HTML, or Quiz lesson/resource is active.
- [ ] Electron window title automatically mirrors the document title.

## Open Questions
- None. The client selected the option to update the window/document title dynamically.
