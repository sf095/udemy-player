# Implementation Plan: System Context Menu for Text Selection in Summary Tab

## Overview
Implement the native OS context menu in Electron for text selections (allowing users to copy, look up, and search selected text in the Summary tab) and editable form fields (cut, copy, paste, select all).

## Proposed Changes

### 1. Electron Main Process (`electron/main.js`)
- Import `Menu` and `MenuItem` from `'electron'`.
- In `startApp()`, attach a `'context-menu'` event listener to `mainWindow.webContents`.
- When `params.selectionText` is non-empty:
  - Construct a native `Menu` with items:
    - `Copy` (`role: 'copy'`)
    - `Select All` (`role: 'selectAll'`)
    - (Darwin/macOS) Separator + `Look Up "<preview>"` calling `mainWindow.webContents.showDefinitionForSelection()`
    - (Darwin/macOS) `Search with Google` opening `shell.openExternal(...)`
  - Call `menu.popup({ window: mainWindow, x: params.x, y: params.y })`.
- When `params.isEditable` is true:
  - Construct native `Menu` with Undo, Redo, Separator, Cut, Copy, Paste, Separator, Select All.
  - Call `menu.popup({ window: mainWindow, x: params.x, y: params.y })`.

### 2. Frontend Check (`frontend/src/components/NotesPanel.jsx` & CSS)
- Verify Summary tab container and markdown rendering do not prevent context menu propagation or disable text selection.
- Ensure `user-select: text` is active on `.summary-content` / markdown body (default is enabled).

## Verification Plan
1. **Automated**:
   - `npm run lint --prefix frontend`
   - `npm run build --prefix frontend`
2. **Manual**:
   - Run desktop app, select text in Summary tab, right-click, verify native system context menu displays with Copy, Select All, Look Up, Search with Google.
