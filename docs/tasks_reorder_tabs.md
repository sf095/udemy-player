# Tasks: Reorder Right Sidebar Tabs

- [x] Task 1: Update activeTab state initialization in NotesPanel.jsx
  - Acceptance: The `activeTab` React state is initialized to `'summary'` instead of `'notes'`.
  - Verify: Look at line 69 in `NotesPanel.jsx` to ensure it is initialized to `'summary'`.
  - Files: [NotesPanel.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/NotesPanel.jsx)

- [x] Task 2: Reorder tab buttons in NotesPanel.jsx markup
  - Acceptance: In the JSX render structure within the `.panel-tabs` container, the buttons are rendered in the order: Summary (`activeTab === 'summary'`), AI Chat (`activeTab === 'chat'`), Notes (`activeTab === 'notes'`).
  - Verify: Inspect rendering layout of buttons in `NotesPanel.jsx` (lines 336-403).
  - Files: [NotesPanel.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/NotesPanel.jsx)

- [x] Task 3: Build, Lint, and Manual Verification
  - Acceptance:
    - Run linting check with no errors: `npm run lint --prefix frontend`
    - Run build compilation successfully: `npm run build --prefix frontend`
    - Verify that Summary is active by default, and tabs can be clicked to switch views correctly.
  - Verify: Execute commands in the terminal and verify the UI behavior.
  - Files: [NotesPanel.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/NotesPanel.jsx)
