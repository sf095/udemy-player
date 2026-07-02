# Tasks: External Link Handling in Default Browser

- [x] Task 1: Add Electron `shell` import and URL checking helper
  - **Description**: Add `shell` to Electron destructuring import in `electron/main.js`. Implement a helper function `isExternalUrl(url)` that identifies external links.
  - **Acceptance**:
    - `isExternalUrl("http://localhost:3002")` returns `false`
    - `isExternalUrl("http://127.0.0.1:3003/api/resource")` returns `false`
    - `isExternalUrl("https://google.com")` returns `true`
    - `isExternalUrl("javascript:void(0)")` returns `false`
  - **Verify**: Inspect code structure and ensure correct CommonJS syntax.
  - **Files**: `electron/main.js`

- [x] Task 2: Implement Electron window open and navigation interceptors
  - **Description**: Attach `setWindowOpenHandler`, `will-navigate`, and `will-frame-navigate` events to `mainWindow.webContents` after browser window initialization.
  - **Acceptance**:
    - Clicking/tapping a URL resource in the sidebar opens in the default web browser.
    - Clicking/tapping a link in an HTML lesson opens in the default web browser.
    - Clicking/tapping a link in a PDF lesson opens in the default web browser.
    - Downloading resources and playing videos internally work normally.
  - **Verify**: Start the desktop app using `npm run dev:desktop`, view lessons/resources, click external links, and check the default browser.
  - **Files**: `electron/main.js`
