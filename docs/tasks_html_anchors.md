# Tasks: HTML Lesson Anchor Link Handling

- [x] Task 1: Update `DocViewer.jsx` iframe source path and sandbox attributes
  - Acceptance: The iframe source uses relative proxy URL `/api/resource...` and contains `allow-popups` and `allow-popups-to-escape-sandbox` sandbox flags.
  - Verify: Load the app, inspect the DocViewer iframe HTML element in developer tools, check source and sandbox values.
  - Files: `frontend/src/components/DocViewer.jsx`

- [x] Task 2: Implement iframe document load event and click delegation
  - Acceptance: An `onLoad` handler is attached to the iframe that adds a click event listener to the iframe's content document to intercept external/non-hash link clicks and open them in a new tab.
  - Verify: Verify that clicking an external link (`http://...` or `https://...`) inside the HTML page opens a new browser tab/window, and clicking internal hash anchors behaves as expected.
  - Files: `frontend/src/components/DocViewer.jsx`
