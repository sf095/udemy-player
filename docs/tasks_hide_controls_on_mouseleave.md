# Tasks: Hide Video Controls on Mouse Leave

- [x] **Task 1: Add mouseleave listener to VideoPlayer.jsx**
  - **Acceptance**: Register `mouseleave` listener on the video container when playing, which sets `showControls(false)` immediately and clears the active inactivity timeout. Clean it up on unmount or when `isPlaying` updates.
  - **Verify**: Review the code edits in `VideoPlayer.jsx` to ensure correctness and event listener lifecycle safety.
  - **Files**: `frontend/src/components/VideoPlayer.jsx`

- [x] **Task 2: Build and Lint verification**
  - **Acceptance**: The project builds and lints cleanly with no React/Vite errors or warnings related to the changes.
  - **Verify**: Run `npm run lint` and `npm run build` in the frontend directory.
  - **Files**: None
