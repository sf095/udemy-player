# Spec: System Context Menu for Text Selection in Summary Tab

## Objective
Allow users to open a normal system context menu when selecting text in the **Summary** tab (and throughout the application) in the Udemy Offline Player Electron desktop app.

When reading an AI-generated lesson summary in the Summary tab:
1. Selecting any text and right-clicking (or two-finger tap on macOS) opens the system native context menu.
2. The context menu contains standard system actions for the selected text:
   - **Copy** (`Cmd + C` on macOS / `Ctrl + C` on Windows/Linux)
   - **Select All** (`Cmd + A` / `Ctrl + A`)
   - **Look Up "<selection>"** (macOS dictionary / definition popup)
   - **Search with Google** (opens the user's default browser to search the selected text)
3. For editable inputs (e.g. Find in Summary search input, Notes textarea, Chat input), the context menu also natively supports Cut, Copy, Paste, Undo, Redo, and Select All.
4. When running in a standard web browser (Chrome/Safari), the browser's default system context menu is retained and uninhibited.

## Tech Stack
- **Desktop Runtime**: Electron 42 (Node.js runtime + Chromium)
- **APIs**: Electron `Menu`, `MenuItem`, `webContents.on('context-menu')`, `shell.openExternal`
- **Frontend**: React 19, CSS3

## Commands
- Build frontend: `npm run build --prefix frontend`
- Lint frontend: `npm run lint --prefix frontend`
- Dev Desktop: `npm run dev:desktop`
- Dev Web: `npm run dev`

## Project Structure
- `electron/main.js` — Register `context-menu` event listener on `mainWindow.webContents` to build and display the native OS context menu for text selections and editable fields.
- `frontend/src/components/NotesPanel.jsx` — Ensure the Summary container allows standard text selection and right-click propagation without any `preventDefault` or selection blocking.
- `frontend/src/index.css` — Verify no `user-select: none` applies to the summary content area.

## Code Style
- Surgical change to `electron/main.js`.
- Clean implementation using Electron's native `Menu` and `MenuItem` roles (`copy`, `selectAll`, `undo`, `redo`, `cut`, `paste`).
- Cross-platform support (`process.platform === 'darwin'` for macOS-specific Look Up).

Example snippet for `electron/main.js`:
```javascript
mainWindow.webContents.on('context-menu', (_event, params) => {
  const menu = new Menu();

  // If text is selected (e.g., in Summary tab or any content)
  if (params.selectionText && params.selectionText.trim().length > 0) {
    menu.append(new MenuItem({ role: 'copy', label: 'Copy' }));
    menu.append(new MenuItem({ role: 'selectAll', label: 'Select All' }));

    if (process.platform === 'darwin') {
      menu.append(new MenuItem({ type: 'separator' }));
      const trimmedText = params.selectionText.trim();
      const preview = trimmedText.length > 25 ? trimmedText.substring(0, 25) + '…' : trimmedText;
      menu.append(new MenuItem({
        label: `Look Up "${preview}"`,
        click: () => mainWindow.webContents.showDefinitionForSelection()
      }));
      menu.append(new MenuItem({
        label: 'Search with Google',
        click: () => {
          shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(trimmedText)}`);
        }
      }));
    }

    menu.popup({ window: mainWindow, x: params.x, y: params.y });
    return;
  }

  // If right-clicking inside an editable input/textarea
  if (params.isEditable) {
    menu.append(new MenuItem({ role: 'undo', label: 'Undo' }));
    menu.append(new MenuItem({ role: 'redo', label: 'Redo' }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ role: 'cut', label: 'Cut' }));
    menu.append(new MenuItem({ role: 'copy', label: 'Copy' }));
    menu.append(new MenuItem({ role: 'paste', label: 'Paste' }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ role: 'selectAll', label: 'Select All' }));
    menu.popup({ window: mainWindow, x: params.x, y: params.y });
    return;
  }
});
```

## Testing Strategy
1. **Manual Verification**:
   - Launch the desktop app with `npm run dev:desktop`.
   - Open a lesson that has a generated Summary.
   - Switch to the Summary tab.
   - Highlight/select any sentence or phrase in the summary text.
   - Right-click (or two-finger tap) on the selection.
   - Verify native system context menu pops up at the cursor location with "Copy", "Select All", "Look Up <text>", and "Search with Google".
   - Click "Copy" → paste into another app or input to verify clipboard contains copied text.
   - Click "Look Up" → verify native dictionary popover opens.
   - Click "Search with Google" → verify default browser opens search tab.
   - Test in Summary Search bar input: right-click and verify Undo, Redo, Cut, Copy, Paste, Select All are operational.
2. **Automated Verification**:
   - `npm run lint --prefix frontend` passes with 0 errors.
   - `npm run build --prefix frontend` builds successfully without warnings.

## Boundaries
- **Always**: Use native Electron `Menu` and `MenuItem` roles to ensure standard OS clipboard integration and shortcuts.
- **Always**: Respect platform conventions (e.g. `showDefinitionForSelection` on macOS).
- **Never**: Block or prevent default context menus in web browser mode.
- **Never**: Touch unrelated backend or player playback logic.

## Success Criteria
- [ ] Right-clicking selected text in the Summary tab opens the native system context menu.
- [ ] Context menu includes Copy, Select All, Look Up (on macOS), and Search with Google.
- [ ] Copying text copies the exact selected content to the system clipboard.
- [ ] Right-clicking inside editable input fields shows the standard editing context menu (Cut/Copy/Paste/Undo/Redo).
- [ ] All lint and build checks pass cleanly.

## Open Questions
- None. User confirmed preference for normal system context menu on right-click when text is selected.
