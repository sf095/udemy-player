# Tasks: Chapters Panel Keyboard Shortcut

This document lists the specific tasks required to complete this change.

- [x] Task 1: Implement keyboard shortcut in VideoPlayer
  - Acceptance: `VideoPlayer.jsx` imports `useKeyboardShortcuts` and registers the `c` key to toggle `showChaptersList` when chapters exist.
  - Verify: Verify code changes in `VideoPlayer.jsx`.
  - Files: [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx)

- [x] Task 2: Document shortcut in KeyboardShortcutsModal
  - Acceptance: `KeyboardShortcutsModal.jsx` lists the `C` shortcut in the UI Panels group.
  - Verify: Verify code changes in `KeyboardShortcutsModal.jsx`.
  - Files: [KeyboardShortcutsModal.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/KeyboardShortcutsModal.jsx)

- [x] Task 3: Document shortcut in README.md
  - Acceptance: `README.md` has the `C` key documented in the panel shortcuts.
  - Verify: Verify code changes in `README.md`.
  - Files: [README.md](file:///Users/hientranthanh/Downloads/sources/udemy-player/README.md)

- [x] Task 4: Manually verify the shortcut
  - Acceptance: Start the app, press `c` to verify toggling behavior of the chapters list, verify typing works without triggering the shortcut, and check the help modal.
  - Verify: Run `npm run dev` and test in the browser.
  - Files: None.
