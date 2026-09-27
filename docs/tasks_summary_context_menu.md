# Tasks: System Context Menu for Text Selection in Summary Tab

- [x] Task 1: Add context-menu handler to Electron main window
  - Acceptance: `electron/main.js` handles `mainWindow.webContents.on('context-menu')`, displaying native context menu for text selection (Copy, Select All, Look Up, Search with Google) and editable fields (Undo, Redo, Cut, Copy, Paste, Select All).
  - Verify: Syntax and lint checks pass; right-click on selected text displays menu.
  - Files: `electron/main.js`

- [x] Task 2: Verify Frontend Text Selection & Menu Propagation in Summary Tab
  - Acceptance: Summary tab allows seamless text selection and event bubbling for context menu.
  - Verify: `npm run lint --prefix frontend` and `npm run build --prefix frontend`.
  - Files: `frontend/src/components/NotesPanel.jsx`, `frontend/src/index.css` (if needed)

- [x] Task 3: Verification & Sanity Checks
  - Acceptance: Frontend builds cleanly, electron runs cleanly without errors.
  - Verify: Run build and lint scripts.
