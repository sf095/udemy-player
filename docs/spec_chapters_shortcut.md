# Spec: Chapters Panel Keyboard Shortcut

## Objective
Enable a keyboard shortcut (specifically the `C` key) to open and close (toggle) the AI Chapters list panel in the video player, improving usability and keyboard-only control. This shortcut should also be documented in the Keyboard Shortcuts sheet/modal.

## Tech Stack
- **Frontend**: React (Vite), Vanilla CSS, Lucide icons

## Commands
- Dev: `npm run dev`
- Lint: `npm run lint --prefix frontend`

## Project Structure
- `frontend/src/components/VideoPlayer.jsx` - Renders the video stage and chapters list panel.
- `frontend/src/components/KeyboardShortcutsModal.jsx` - Renders the helper modal listing keyboard shortcuts.

## Code Style
- Import and use the existing centralized `useKeyboardShortcuts` hook in `VideoPlayer.jsx`.
- Example:
  ```javascript
  import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
  
  // inside VideoPlayer component:
  useKeyboardShortcuts([
    {
      key: 'c',
      action: () => {
        if (chapters && chapters.length > 0) {
          setShowChaptersList(s => !s);
        }
      },
      when: () => !!videoPath && chapters && chapters.length > 0
    }
  ]);
  ```

## Testing Strategy
- **Manual Verification**:
  1. Open a video lesson that has generated timeline chapters.
  2. Press the `c` key (without shift/ctrl modifiers) and verify the chapters panel opens or closes.
  3. Verify that pressing `c` does not toggle the panel if focus is inside the notes input field or chat text fields.
  4. Press `?` (Shift + `?`) to open the Keyboard Shortcuts help sheet and verify the `C` shortcut is listed under "UI Panels".

## Boundaries
- **Always**: Ensure standard input/textarea controls suppress the shortcut action.
- **Never**: Break video player focus or introduce state conflicts.

## Success Criteria
- [x] Pressing `c` (or `C`) toggles the visibility of the chapters sidebar panel in `VideoPlayer.jsx`.
- [x] The shortcut is inactive when chapters are empty/loading or no video is active.
- [x] Keyboard Shortcuts modal documents `C` under the "UI Panels" section.
- [x] Typings in chat inputs, notes inputs, or other form controls do not toggle the chapters panel.

## Open Questions
- None.
