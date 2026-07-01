# Spec: Resizable Sidebar and Notes Panel

## Objective
Enable users to adjust the widths of the left Sidebar (course content) and the right Notes Panel (lecture notes) via drag-and-drop handles. The user's custom dimensions must persist across reloads and adapt cleanly when panels are toggled/collapsed.

## Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS, leveraging CSS variables (`--sidebar-width`, `--notes-width`) and direct inline style injections on the main layout component.

## Commands
- **Dev mode**: `npm run dev` (run from the root)
- **Build frontend**: `npm run build --prefix frontend`
- **Lint frontend**: `npm run lint --prefix frontend`

## Project Structure
- `frontend/src/App.jsx` → Coordinates layout grid, contains layout state and mouse/pointer drag handlers.
- `frontend/src/components/Sidebar.jsx` → Left sidebar containing chapter and lecture lists.
- `frontend/src/components/NotesPanel.jsx` → Right sidebar containing timestamped user notes.
- `frontend/src/index.css` → Global style definitions for panels, grid columns, and drag handles.

## Code Style
We will implement resizing using pure React pointer event listeners to manage mouse and touch interactions.
- Avoid using external library dependencies (like `react-resizable-box`).
- Store the current width variables in React state in `App.jsx`.
- Dynamically bind those width variables to CSS custom variables on the `.dashboard-content` container inline style.
- Use native `pointerdown`, `pointermove`, and `pointerup` events to handle drag behavior smoothly across desktop and touch screens.

## Testing Strategy
Since there is no pre-existing automated testing framework, we will perform comprehensive manual testing:
1. Verify smooth resizing of the left sidebar between its minimum and maximum boundaries.
2. Verify smooth resizing of the right notes panel between its minimum and maximum boundaries.
3. Verify that double-clicking on a resize handle resets the panel back to its default width.
4. Verify that collapsing/expanding panels functions correctly and hides the resize handle.
5. Verify that custom widths are saved in `localStorage` and persist after app reloads.
6. Verify that resizing works properly when the video player is playing, without stuttering or mouse capture loss.

## Success Criteria
- [ ] Users can drag the right border of the left Sidebar to resize its width.
- [ ] Users can drag the left border of the right Notes Panel to resize its width.
- [ ] Drag handles are styled visually with clean, subtle hover styles (e.g. glowing lines or colored borders) consistent with the dark theme.
- [ ] Boundaries are enforced:
  - Left Sidebar: Min 200px, Max 500px (defaults to 320px).
  - Right Notes Panel: Min 260px, Max 600px (defaults to 360px).
- [ ] Custom widths persist using `localStorage` under keys `udemy-player:sidebar-width` and `udemy-player:notes-width`.
- [ ] Resizing does not cause layout jumping or break responsive behavior in the video stage.
- [ ] Double-clicking a handle resets the panel to its default width.

## Boundaries
- **Always**: Enforce strict minimum and maximum width boundary constraints so panels don't break the layout or collapse to unusable sizes.
- **Never**: Add heavy external dependencies for panel resizing.
- **Ask First**: Adding keyboard accessibility controls to adjust panel sizes (e.g., using arrows).

## Open Questions
1. Should we add a keyboard shortcut or access keys to change panel sizes?
2. Are the min/max limits acceptable, or should they scale as percentages of the window width?
