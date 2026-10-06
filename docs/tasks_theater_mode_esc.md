# Tasks: Prevent Escape Key from Exiting Theater Mode

- [x] Task 1: Update Escape keyboard shortcut in `frontend/src/App.jsx`
  - Acceptance: `else if (theaterMode) setTheaterMode(false);` is removed; a `when` guard is added checking `showShortcutsModal || showSettingsModal || showCourseManager || showChapterSummaryModal`.
  - Verify: Pressing `Escape` while in Theater Mode does not change `theaterMode` state.
  - Files: `frontend/src/App.jsx`

- [x] Task 2: Build verification and validation
  - Acceptance: `npm run build --prefix frontend` succeeds with exit code 0; all acceptance criteria from the spec are satisfied.
  - Verify: Build output passes without errors.
  - Files: `frontend/dist/`
