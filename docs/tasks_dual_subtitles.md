# Task List: Dual Subtitles Support

- [x] Task 1: Add styling for secondary subtitles in CSS
  - Acceptance: WebVTT styling rule `video::cue(.secondary)` is added.
  - Verify: Check `frontend/src/index.css` compiles successfully.
  - Files: `frontend/src/index.css`

- [x] Task 2: Implement App-level state for secondary subtitles
  - Acceptance: `secondaryLang` state is managed, synchronized with `localStorage`, validated against `activeLang` conflicts, and passed down.
  - Verify: Check that state initializes correctly on reload.
  - Files: `frontend/src/App.jsx`

- [x] Task 3: Implement WebVTT parsing, merging, and formatting helpers
  - Acceptance: WebVTT parsing, timecode formatting, and cue merging helpers are implemented inside `VideoPlayer.jsx`.
  - Verify: Check functions parse and merge timestamps correctly without errors.
  - Files: `frontend/src/components/VideoPlayer.jsx`

- [x] Task 4: Set up dual subtitle loading lifecycle and Blob URL creation
  - Acceptance: Trigger parallel fetching, merging, and Blob URL generation when two subtitles are active, with clean Blob URL resource cleanup.
  - Verify: Check that `track` element `src` is updated with a valid `blob:` URL when dual subtitles are active, and direct URL when single.
  - Files: `frontend/src/components/VideoPlayer.jsx`

- [x] Task 5: Integrate UI controls in VideoPlayer panel
  - Acceptance: "2nd Sub" selector is added to the overlays, showing available secondary options.
  - Verify: Change selection and check visual output of subtitles on screen.
  - Files: `frontend/src/components/VideoPlayer.jsx`
