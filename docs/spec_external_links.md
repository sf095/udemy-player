# Spec: External Link Handling in Default Browser

## Objective
Ensure that clicking any external link/URL inside the Udemy Offline Player application (including inside HTML lesson documents, PDF files, and lesson resource links) opens the target URL in the user's default system browser (e.g., Chrome, Safari, Firefox), rather than inside the Electron desktop application window.

## Tech Stack
- **Electron**: v42.4.1 (Main process configuration)
- **Frontend**: Vite, React, HTML / CSS / JavaScript

## Commands
- **Install Dependencies**: `npm install`
- **Run in Development Mode (with Electron)**: `npm run dev:desktop`
- **Package App**: `npm run package`

## Project Structure
- `electron/main.js` - Electron Main Process (where window creation, navigation, and `setWindowOpenHandler` are managed)
- `frontend/src/components/DocViewer.jsx` - Component displaying HTML/PDF lesson content inside an iframe/embed.
- `frontend/src/components/ResourceList.jsx` - Component listing all lesson resources, including URL links.

## Code Style
JavaScript (ES6) for the Electron main process, standard Node.js/CommonJS require imports.

Example snippet for URL interception:
```javascript
const { shell } = require('electron');

function isExternalUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    return !isLocal;
  } catch (e) {
    return false;
  }
}

// In startApp after window creation:
mainWindow.webContents.setWindowOpenHandler(({ url }) => {
  if (isExternalUrl(url)) {
    shell.openExternal(url);
    return { action: 'deny' };
  }
  return { action: 'allow' };
});
```

## Testing Strategy
- **Manual Verification**:
  1. Start the desktop app in development mode using `npm run dev:desktop`.
  2. Open a course containing external links in HTML resources, PDF resources, or URL resources.
  3. Click/tap on an external link in:
     - An HTML preview document loaded in the document viewer iframe.
     - A PDF document rendered in the document viewer embed.
     - A URL-type link in the Lesson Resources sidebar panel.
  4. Confirm that the default system browser opens the external link.
  5. Confirm that internal navigations and API resource requests (such as downloading helper files or playing local videos) continue to work properly and are not blocked.

## Boundaries
- **Always**: Intercept external `http` and `https` protocols and delegate them to `shell.openExternal(url)`.
- **Always**: Allow local origin urls (localhost, 127.0.0.1) to be handled internally.
- **Never**: Hardcode specific external domains to exclude/include unless requested.
- **Never**: Disable iframe sandboxing inside `DocViewer.jsx` to achieve navigation.

## Success Criteria
- [ ] Clicking external URLs in the Lesson Resources list triggers opening in the user's default system browser.
- [ ] Clicking external links inside HTML lessons rendered in the `DocViewer` iframe triggers opening in the user's default system browser.
- [ ] Clicking external links inside PDF lessons rendered in the `DocViewer` PDF viewer triggers opening in the user's default system browser.
- [ ] Local URLs (e.g. downloading files or reading local API endpoints) are not intercepted by the external link opener.

## Open Questions
None. The solution uses standard Electron `webContents` events and handlers.
