# Tasks: Display Full Lesson Titles and Resource Indicators in Sidebar

- [x] Task 1: Update CSS styling to allow wrapping of lesson titles and align list item contents
  - Acceptance: `.lesson-title-text` allows word wrapping (no ellipses/truncation), and the list items (checkboxes, type icons, text) remain properly aligned when wrapped.
  - Verify: Check `.lesson-title-text` CSS properties.
  - Files: [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css)

- [x] Task 2: Implement resource count detection and badge rendering in `Sidebar.jsx`
  - Acceptance: `Sidebar.jsx` computes the resource count for each lesson and displays a clean visual indicator (badge/icon) next to the lesson title when resources are present.
  - Verify: Look for Lucide icon (e.g. `Paperclip`) or custom indicator next to the lesson title text in the DOM.
  - Files: [Sidebar.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/Sidebar.jsx)

- [x] Task 3: Style the resource indicator badge for dark and light themes
  - Acceptance: The resource indicator/badge has custom classes with appropriate background, text, border colors, and hover styles matching both dark and light modes.
  - Verify: Toggle theme in application and view the sidebar.
  - Files: [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css)
