# Plan: Active Lesson Playback Visibility

## 1. Component Changes and Dependencies

### A. Sidebar Component (`frontend/src/components/Sidebar.jsx`)
- **State & Auto-expansion**:
  - Add a `useEffect` that listens to `activeLesson` and `sections`.
  - When `activeLesson` changes, find the section/chapter that contains it and set `expandedSections[secId] = true` to expand it automatically.
- **Section Headers (Triggers)**:
  - Add a helper boolean `containsActiveLesson` for each section/chapter row in the render loop.
  - If `containsActiveLesson` is true, add a `has-active` class to the `.section-accordion`.
  - If the section is collapsed (`!isExpanded`) and contains the active lesson, show the "Now Playing: [Lesson Title]" status text in `.section-meta` instead of the completion stats.
  - If the section is collapsed and contains the active lesson, add a `.contains-active-collapsed` visual layout treatment (e.g. active colors, pulsing icon).

### B. App Component / Layout (`frontend/src/App.jsx`)
- **Stage Title Header**:
  - Inside the `stage-panel` container, when `activeLesson` is present, render a premium top-bar header.
  - The header should display:
    - The Section title (e.g., `Section 3: Getting Started`)
    - An arrow or breadcrumb separator (`>`)
    - The Lesson title (e.g., `12. Creating React Components`)
    - A badge indicating the lesson type (e.g., `Video` or `Document`)
  - The title banner should be styled beautifully and stick to the top of the stage viewport.
  - Ensure the video player and document viewer correctly fit below this new header without overlapping or causing layouts to break.

### C. Design and Style Sheet (`frontend/src/index.css`)
- **Collapsed Highlight Styles**:
  - Style `.section-accordion.has-active` to have a slightly highlighted border or left-accent border.
  - If it contains the active lesson and is collapsed, style it with a subtle pulse, gradient highlight, or primary border to visually stand out.
  - Style `.section-meta.playing` with primary accent colors and clean layout.
- **Stage Header Styling**:
  - Create rules for `.stage-header-banner` with premium backdrop blur (`backdrop-filter: blur(12px)`), subtle borders, modern font sizes, layout spacing, and flex alignment.
  - Ensure it supports both light-theme and dark-theme variables.

## 2. Implementation Order
1. **CSS Variables & Custom Styles**: Add stylesheet rules first to facilitate immediate visual testing.
2. **Sidebar Logic**: Add auto-expansion and collapsed visual headers in `Sidebar.jsx`.
3. **Stage Title Header**: Add the top-bar header in `App.jsx` and structure the stage panel elements.
4. **Validation & Polish**: Test navigation via keyboard shortcuts, autoplay, sidebar collapses, and verify theme colors in both dark and light modes.

## 3. Risks & Mitigations
- **Risk**: Automatic expansion of chapters might irritate users who prefer sections closed.
  - *Mitigation*: We only auto-expand a section *on active lesson change* (e.g. autoplay, or next/prev navigation). If the user manually collapses the chapter containing the currently playing lesson, we respect their action and do not re-expand it instantly. We also show the collapsed Playing banner so they retain visibility.
- **Risk**: Layout shifting or double scrollbars in the main stage due to the new header.
  - *Mitigation*: Ensure the stage main content uses a flex layout with `flex-direction: column` and `flex: 1`, allowing the header to stay at a fixed size while the viewport scrollable content fills the remaining height.
