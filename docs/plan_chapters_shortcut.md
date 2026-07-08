# Plan: Chapters Panel Keyboard Shortcut

This document outlines the step-by-step implementation plan for adding the `C` keyboard shortcut to toggle the chapters list panel.

## 1. Components and Dependencies
- **Component 1**: `frontend/src/components/VideoPlayer.jsx`
  - Needs to import `useKeyboardShortcuts` hook and define the `C` key shortcut action to toggle `showChaptersList`.
- **Component 2**: `frontend/src/components/KeyboardShortcutsModal.jsx`
  - Needs to list `C` under the "UI Panels" section.
- **Component 3**: `README.md`
  - Needs to list the `C` key in the list of UI Panel shortcuts.

## 2. Implementation Order
1. **Update VideoPlayer**: Integrate `useKeyboardShortcuts` in `VideoPlayer.jsx`.
2. **Update Help Modal**: Update `KeyboardShortcutsModal.jsx` to document the shortcut.
3. **Update README**: Add the `C` hotkey reference to `README.md`.
4. **Verification**: Manually test the shortcut in various application states.

## 3. Risks & Mitigations
- **Risk**: Typing `c` or `C` in search, notes, or chat fields toggling the panel.
- **Mitigation**: The centralized `useKeyboardShortcuts` hook filters out inputs/textareas automatically. We will explicitly test typing in notes and chat.
- **Risk**: Event bubbling/conflict with other page elements.
- **Mitigation**: The hook listens to window keydown with capture `true` and calls `preventDefault()`/`stopPropagation()`. Since `C` is not a default browser behavior, this is safe.

## 4. Parallel vs. Sequential Work
- The changes are small and will be executed sequentially.

## 5. Verification Checkpoints
- **Checkpoint 1 (Code Review)**: Verify hooks registration syntax.
- **Checkpoint 2 (Manual Testing - Toggle)**: Press `c` and confirm the chapters sidebar opens and closes smoothly.
- **Checkpoint 3 (Manual Testing - Guard)**: Confirm typing in text boxes does not trigger the shortcut.
- **Checkpoint 4 (UI Check)**: Verify the help modal lists the new shortcut.
