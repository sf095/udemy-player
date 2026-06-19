# Tasks: Dynamic Subtitle Sizing

- [x] **Task 1: Add video::cue styling to index.css**
  - **Acceptance**: CSS includes `video::cue` styling that overrides the default background, text color, font-family, text-shadow, and binds `font-size` to CSS variable `--subtitle-size`.
  - **Verify**: Inspect `frontend/src/index.css`.
  - **Files**: `frontend/src/index.css`

- [x] **Task 2: Implement state & storage in VideoPlayer.jsx**
  - **Acceptance**: Add `subtitleSize` state loaded from/saved to `localStorage` (default `100%`). Pass `--subtitle-size` inline style to the video container wrapper.
  - **Verify**: Verify state logic and CSS variable binding.
  - **Files**: `frontend/src/components/VideoPlayer.jsx`

- [x] **Task 3: Add subtitle size control UI**
  - **Acceptance**: Add a select dropdown to the overlay menu with size options: 80% (Small), 100% (Medium), 130% (Large), 160% (Extra Large).
  - **Verify**: Visual check of the overlay layout and dropdown behavior.
  - **Files**: `frontend/src/components/VideoPlayer.jsx`

- [x] **Task 4: Manual validation of dynamic resizing**
  - **Acceptance**: Changing the subtitle size works in real-time, persists after page reload, and looks premium.
  - **Verify**: Perform manual run check.
  - **Files**: None
