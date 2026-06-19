# Spec: HTML Lesson Anchor Link Handling

## Objective
Ensure that clicking anchor links (`<a>`) inside HTML lessons loaded in the offline player works correctly. Currently, clicking external links or internal links does nothing because the iframe is sandboxed without popup permissions, uses a cross-origin source URL directly targeting port 3003, and does not configure targets for external navigation. Clicking external links should open them in a new browser tab/window, while clicking internal page hashes (e.g., `#chapter1`) should scroll to the target inside the iframe.

## Tech Stack
- **Frontend**: Vite, React, iframe element
- **Backend**: Node.js/Express (API proxy)

## Commands
- **Dev Server**: `npm run dev` (runs both frontend on port 3002 and backend on port 3003)
- **Build**: `npm run build`

## Project Structure
- `frontend/src/components/DocViewer.jsx` - Renders the iframe containing the HTML content.
- `frontend/vite.config.js` - Proxies `/api` requests from port 3002 to port 3003.

## Code Style
React hook or inline handler styling, standard React 18 syntax.
```jsx
// Example of accessing same-origin iframe document to intercept clicks
const handleIframeLoad = (e) => {
  try {
    const doc = e.target.contentDocument || e.target.contentWindow.document;
    const links = doc.getElementsByTagName('a');
    for (let link of links) {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    }
  } catch (err) {
    console.error('Error modifying iframe anchors', err);
  }
};
```

## Testing Strategy
- Manual verification: Open a course lesson that is an HTML page with:
  1. An external link (e.g. `https://google.com`).
  2. An internal hash anchor (e.g. `<a href="#section">`).
- Confirm that clicking the external link successfully opens in a new tab/window.
- Confirm that clicking the internal hash anchor scrolls to the correct location within the iframe.

## Boundaries
- **Always**: Use the same-origin proxy path (`/api/resource...`) instead of hardcoding `http://localhost:3003` to allow DOM access.
- **Always**: Keep sandbox enabled on the iframe for security, but allow necessary capabilities.
- **Never**: Hardcode port 3003 in frontend components where proxying is available.
- **Ask First**: Adding external navigation packages or complex custom context menus inside the iframe.

## Success Criteria
- [ ] The `DocViewer.jsx` iframe uses a relative same-origin source URL `/api/resource...` to enable same-origin scripting access.
- [ ] The iframe's `sandbox` attribute includes `allow-popups` and `allow-popups-to-escape-sandbox` to permit opening new tabs.
- [ ] An `onLoad` handler on the iframe automatically inspects all anchor elements inside the loaded HTML document.
- [ ] Any anchor link that is external or does not start with `#` is modified to have `target="_blank"` and `rel="noopener noreferrer"`.
- [ ] Tapping external anchor links in an HTML lesson successfully opens the target link in a new browser tab/window.
- [ ] Tapping internal page hash links (e.g., `#heading`) correctly navigates/scrolls within the document frame.

## Open Questions
- None. The solution is straightforward and leverages standard browser sandboxing and DOM access policies.
