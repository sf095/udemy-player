# Spec: Prevent Escape Key from Exiting Theater Mode

## Objective
Update the keyboard shortcut handling so that when the app is in Theater Mode, pressing `Escape` (`Esc`) will **not** exit Theater Mode.

### Background & Context
Currently in `frontend/src/App.jsx` (line 946), the `Escape` key handler has an `else if (theaterMode) setTheaterMode(false);` branch:
```javascript
{ key: 'Escape', action: () => {
  if (showShortcutsModal) setShowShortcutsModal(false);
  else if (showSettingsModal) setShowSettingsModal(false);
  else if (showCourseManager) setShowCourseManager(false);
  else if (showChapterSummaryModal) setShowChapterSummaryModal(false);
  else if (theaterMode) setTheaterMode(false);
}}
```
When no modal is open and the player is in Theater Mode, pressing `Escape` exits Theater Mode. This conflicts with common user behavior (such as pressing `Escape` out of habit, trying to dismiss video controls/overlays, closing context menus, or expecting `Escape` to only exit Fullscreen rather than Theater Mode). In standard web video platforms (e.g. YouTube), `Escape` exits Fullscreen, but never Theater Mode.

### User Stories & Acceptance Criteria
- **User Story 1:** As a student watching a lesson in Theater Mode, when I press `Escape` and no modal is open, the app should remain in Theater Mode.
- **User Story 2:** As a student in Theater Mode with an open modal (Shortcuts, Settings, Course Manager, or Chapter Summary), when I press `Escape`, only the active modal should close; Theater Mode should remain active.
- **User Story 3:** As a student, I can continue to toggle/exit Theater Mode intentionally using the `t` key shortcut or clicking the Theater Mode toggle buttons (on the video overlay or the stage header bar).

---

## Tech Stack
- **Frontend Framework:** React 19.2, Vite 8.0
- **State Management:** React hooks in `frontend/src/App.jsx`
- **Keyboard Shortcuts:** Custom hook `useKeyboardShortcuts` in `frontend/src/hooks/useKeyboardShortcuts.js`

---

## Commands
- **Dev Server:** `npm run dev`
- **Frontend Dev:** `npm run dev --prefix frontend`
- **Frontend Build:** `npm run build --prefix frontend`
- **Frontend Lint:** `npm run lint --prefix frontend`

---

## Project Structure
- `frontend/src/App.jsx` — Central shortcut registration; contains the `Escape` shortcut definition.
- `frontend/src/components/KeyboardShortcutsModal.jsx` — Reference cheat sheet (already documents `Esc` as "Close modal" and `T` as "Toggle theater mode").
- `docs/spec_theater_mode_esc.md` — This specification document.

---

## Code Style
Functional React with surgical modifications.

```javascript
// Before
{ key: 'Escape', action: () => {
  if (showShortcutsModal) setShowShortcutsModal(false);
  else if (showSettingsModal) setShowSettingsModal(false);
  else if (showCourseManager) setShowCourseManager(false);
  else if (showChapterSummaryModal) setShowChapterSummaryModal(false);
  else if (theaterMode) setTheaterMode(false);
}}

// After
{ key: 'Escape', action: () => {
  if (showShortcutsModal) setShowShortcutsModal(false);
  else if (showSettingsModal) setShowSettingsModal(false);
  else if (showCourseManager) setShowCourseManager(false);
  else if (showChapterSummaryModal) setShowChapterSummaryModal(false);
}, when: () => showShortcutsModal || showSettingsModal || showCourseManager || showChapterSummaryModal }
```

By providing the `when` guard condition:
1. When any modal is open, `Escape` will close the modal.
2. When no modal is open, `Escape` is not captured/prevented by `App.jsx`, allowing native browser behaviors (such as exiting fullscreen or closing sub-component popups) without touching `theaterMode`.

---

## Testing Strategy
1. **Manual Verification:**
   - Enter Theater Mode (`t` or button).
   - Press `Escape` -> Verify Theater Mode does **not** exit.
   - Open Keyboard Shortcuts modal (`?`) while in Theater Mode -> Press `Escape` -> Verify modal closes and Theater Mode remains active.
   - Open Settings modal (`,`) while in Theater Mode -> Press `Escape` -> Verify modal closes and Theater Mode remains active.
   - Press `t` -> Verify Theater Mode exits.
   - Re-enter Theater Mode, enter Fullscreen (`f`), press `Escape` -> Verify Fullscreen exits while Theater Mode remains active.
2. **Build Verification:**
   - Run `npm run build --prefix frontend` to ensure zero compilation errors.

---

## Boundaries
- **Always:**
  - Preserve `Escape` closing for all modals (`showShortcutsModal`, `showSettingsModal`, `showCourseManager`, `showChapterSummaryModal`).
  - Preserve `t` / `T` shortcut for toggling Theater Mode.
  - Preserve click handlers for Theater Mode buttons.
- **Ask first:**
  - Modifying any other shortcut key bindings.
- **Never:**
  - Introduce side-effects or break other modal closing interactions.

---

## Success Criteria
- [ ] Pressing `Escape` while in Theater Mode does not exit Theater Mode.
- [ ] Pressing `Escape` while a modal is open in Theater Mode closes the modal and preserves Theater Mode.
- [ ] Theater Mode can still be toggled and exited via `t` key shortcut and UI buttons.
- [ ] `npm run build --prefix frontend` succeeds with exit code 0.

---

## Assumptions & Open Questions
### Assumptions
1. The user request *"if the app is in theater mode, press shortcut esc will not exit the theater mode. update this"* is a requirement to remove the Escape-to-exit-theater-mode behavior (aligning with players like YouTube).
2. Escape should continue to dismiss open modals (Shortcuts, Settings, Course Manager, Chapter Summary).
3. When no modal is open, Escape should neither exit theater mode nor prevent default/propagation so native browser escape behaviors (like exiting fullscreen) work properly.

### Open Questions
- None identified; requirement directly matches removing `else if (theaterMode) setTheaterMode(false);` and optionally guarding the shortcut.
