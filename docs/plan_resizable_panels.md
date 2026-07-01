# Plan: Resizable Sidebar and Notes Panel

## Implementation Strategy
We will implement panel resizing by introducing custom drag handles inside the left `Sidebar` and the right `NotesPanel`. We will manage the width state at the top level in `App.jsx`, binding them dynamically to CSS variables, and updating them using pointer events for smooth dragging.

### Step 1: Update Styling in index.css
- Add relative positioning to `.sidebar-panel` and `.notes-panel` to correctly position absolute drag handles.
- Define a `.resize-handle` styling class. It should have a width of `6px` but a visual guide that glows when hovered.
- Use `cursor: col-resize` on the handles.
- Add CSS variable bindings in `index.css` so that the custom widths of columns are read directly from inline styles applied to `.dashboard-content`.

### Step 2: Implement Drag Logic and Width State in App.jsx
- Add `sidebarWidth` and `notesWidth` states in `App.jsx`, initialized from `localStorage` (defaulting to `320px` and `360px` respectively).
- Create pointer-down handlers `handleSidebarResizeStart` and `handleNotesResizeStart` that:
  - Register temporary global `pointermove` and `pointerup` listeners on the `document`.
  - Calculate panel widths based on `clientX` relative to viewport edges.
  - Enforce bounds (Sidebar: 200px-500px, Notes: 260px-600px).
  - Enforce a minimum center stage width safeguard of `400px`.
  - Disable text selection and change the global cursor to `col-resize` while dragging is active.
- Create double-click handlers on handles that reset the widths back to their defaults (`320px` and `360px`).
- Apply the widths inline to `.dashboard-content` container using CSS custom variables `--sidebar-width` and `--notes-width`.

### Step 3: Integrate Resize Handles into Components
- In `Sidebar.jsx`, add a vertical handle on the right border:
  - `<div className="resize-handle right-handle" onPointerDown={onResizeStart} onDoubleClick={onReset} />`
- In `NotesPanel.jsx`, add a vertical handle on the left border:
  - `<div className="resize-handle left-handle" onPointerDown={onResizeStart} onDoubleClick={onReset} />`
- Pass the necessary resize callbacks (`onResizeStart` and `onReset`) from `App.jsx` to these components.

### Step 4: Verify and Test
- Run development server to verify code compiles correctly.
- Test left sidebar resizing to confirm boundaries (200px-500px) and persistence.
- Test right notes panel resizing to confirm boundaries (260px-600px) and persistence.
- Test the viewport safeguard constraint (ensuring center stage never collapses below 400px).
- Verify double-click reset behavior.
