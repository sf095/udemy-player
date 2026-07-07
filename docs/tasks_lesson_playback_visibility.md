# Tasks: Active Lesson Playback Visibility

- [x] Task 1: Add Styling to `index.css`
  - Acceptance: Custom styles for active/playing indicator on sections (collapsed highlights) and the new stage top-bar header are created. Use beautiful backdrop blur, theme variables, and subtle animation keyframes.
  - Verify: Build succeeds without CSS parsing errors.
  - Files: `frontend/src/index.css`

- [x] Task 2: Implement Sidebar Auto-Expansion & Collapsed Highlight logic
  - Acceptance:
    - Automatically expand the accordion section when a lesson within it becomes active.
    - If the user manually collapses a section containing the active lesson, highlight the section trigger/header with a primary border/background.
    - Replace the collapsed section subtext with "Now Playing: [Active Lesson Title]" using primary colors and a small play icon or styling.
  - Verify: Play lesson, manually collapse section, confirm highlight and "Now Playing" title appears. Navigate to next chapter, verify it auto-expands.
  - Files: `frontend/src/components/Sidebar.jsx`

- [x] Task 3: Implement Stage Title Header Banner
  - Acceptance:
    - App displays a top-bar banner inside the center stage when a lesson is active.
    - Display breadcrumb format: `[Section Title] > [Lesson Title]`.
    - Include a modern lesson type pill badge (e.g. `Video`, `Document`, `Quiz`).
    - Keep layout responsive and clean without double scrollbars.
  - Verify: Toggle sidebar collapse, resize sidebar/notes panels, change lessons, and inspect design alignment.
  - Files: `frontend/src/App.jsx`

- [x] Task 4: Verify Both Themes and Build Production Bundle
  - Acceptance:
    - Both light theme and dark theme show proper contrasting colors for the new indicators and headers.
    - The production bundle compiles successfully.
  - Verify: Run `npm run build` in `frontend/` directory.
  - Files: `frontend/src/index.css`, `frontend/src/App.jsx`, `frontend/src/components/Sidebar.jsx`
