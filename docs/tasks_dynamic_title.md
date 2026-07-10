# Tasks: Dynamic Window/Document Title for Playing Video

- [x] Task 1: Update `VideoPlayer.jsx` callbacks
  - Acceptance: `VideoPlayer` component receives `onPlay` and `onPause` as props and invokes them during event listeners.
  - Verify: Check that callbacks are invoked.
  - Files: `frontend/src/components/VideoPlayer.jsx`

- [x] Task 2: Update `App.jsx` state & document.title effect
  - Acceptance: `App.jsx` manages `isVideoPlaying` state, resets it when the active lesson changes, passes handlers to `VideoPlayer`, and updates `document.title` in a `useEffect` under all specified conditions.
  - Verify: Verify title updates.
  - Files: `frontend/src/App.jsx`

- [x] Task 3: Verification & local tests
  - Acceptance: Build/run app and verify that the browser and Electron titles are correctly synchronized.
  - Verify: Manual execution in development mode.
  - Files: None (Runtime verification)
