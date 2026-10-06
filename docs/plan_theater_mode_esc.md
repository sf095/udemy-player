# Implementation Plan: Prevent Escape Key from Exiting Theater Mode

## Overview
This plan modifies the global `Escape` shortcut in `frontend/src/App.jsx` so that pressing `Escape` will no longer exit Theater Mode, while preserving its behavior for closing open modals.

## Proposed Changes

### `frontend/src/App.jsx`
1. **Update Escape Shortcut Definition:**
   - Remove `else if (theaterMode) setTheaterMode(false);` from the `Escape` action callback.
   - Add a `when` guard condition:
     ```javascript
     { key: 'Escape', action: () => {
       if (showShortcutsModal) setShowShortcutsModal(false);
       else if (showSettingsModal) setShowSettingsModal(false);
       else if (showCourseManager) setShowCourseManager(false);
       else if (showChapterSummaryModal) setShowChapterSummaryModal(false);
     }, when: () => showShortcutsModal || showSettingsModal || showCourseManager || showChapterSummaryModal }
     ```
   - **Rationale for `when` guard:**
     - When any modal is active, `when()` evaluates to `true`, and pressing `Escape` closes the modal while preserving `theaterMode`.
     - When no modal is active, `when()` evaluates to `false`. The shortcut hook skips this registration, meaning `e.preventDefault()` and `e.stopPropagation()` are not invoked. Native browser behaviors (like exiting fullscreen or bubbling `Escape` to local listeners) remain unobstructed.

## Risks & Mitigation
- **Risk:** Existing modal dismissals could be affected.
  - **Mitigation:** The guard strictly checks all four modal states (`showShortcutsModal`, `showSettingsModal`, `showCourseManager`, `showChapterSummaryModal`).
- **Risk:** Native fullscreen exit might conflict with `Escape`.
  - **Mitigation:** With the `when` guard, when no modal is open, `App.jsx` does not intercept `Escape`, allowing the browser to handle fullscreen exit naturally.

## Implementation Order
1. Update the `Escape` shortcut in `frontend/src/App.jsx`.
2. Run frontend build to verify syntax and bundling.
3. Verify test scenarios.

## Verification Checkpoints
1. **Checkpoint 1:** Run `npm run build --prefix frontend` — ensure clean build.
2. **Checkpoint 2:** Theater Mode Esc check — In theater mode with no modals open, press `Escape` -> Theater mode remains ON.
3. **Checkpoint 3:** Modal Esc check — In theater mode with a modal open (e.g. Settings `,` or Shortcuts `?`), press `Escape` -> Modal closes, Theater mode remains ON.
4. **Checkpoint 4:** Theater toggle check — Press `t` or click UI buttons -> Theater mode exits/toggles properly.
