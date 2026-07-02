# Plan: External Link Handling in Default Browser

## 1. Components and Dependencies
- **Component**: `electron/main.js` (Electron Main Process)
  - Intercepts all window opening requests (`setWindowOpenHandler`) and navigations (`will-navigate`, `will-frame-navigate`) on the `BrowserWindow`'s webContents.
  - Resolves and checks if URLs are external.
  - Launches external URLs in the default system browser via Electron's `shell` module.

## 2. Implementation Order
1. **Define URL Verification Helper**: Write a helper function `isExternalUrl(url)` that validates if a URL uses the `http:` or `https:` protocol and points to a hostname other than `localhost` or `127.0.0.1`.
2. **Register IPC/Navigation Handlers**: Inside `startApp()` in `electron/main.js` (after `mainWindow` creation), attach handlers for:
   - `mainWindow.webContents.setWindowOpenHandler`
   - `mainWindow.webContents.on('will-navigate', ...)`
   - `mainWindow.webContents.on('will-frame-navigate', ...)`
3. **Verify locally**: Start dev mode and run through the testing checklist.

## 3. Risks & Mitigations
- **Risk**: Intercepting and redirecting local API and asset requests (e.g. `/api/resource`, `http://localhost:3002/`).
  - *Mitigation*: Strictly check the URL host. If it's `localhost` or `127.0.0.1`, let Electron handle it normally.
- **Risk**: Passing invalid or dangerous URL protocols (like `file:`, `javascript:`, `data:`) to `shell.openExternal`, which could be a security risk.
  - *Mitigation*: Only call `shell.openExternal` if the protocol is exactly `http:` or `https:`.

## 4. Verification Checkpoints
- **Checkpoint 1**: Dev Server starts up successfully.
- **Checkpoint 2**: Clicking a external URL resource from the sidebar opens it in Chrome/Safari/Firefox (host browser).
- **Checkpoint 3**: Clicking an external link inside an HTML lesson opens it in the host browser.
- **Checkpoint 4**: Clicking an external link inside a PDF lesson opens it in the host browser.
- **Checkpoint 5**: Local file previewing and file downloading continue to work normally within the app.
