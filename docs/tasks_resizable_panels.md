# Tasks: Resizable Sidebar and Notes Panel

- [x] **Task 1: Add resizer handle styles to index.css**
  - **Acceptance**: CSS includes style rules for `.resize-handle`, `.resize-handle:hover`, `.left-handle`, `.right-handle`, and sets `position: relative` on `.sidebar-panel` and `.notes-panel`.
  - **Verify**: View and inspect `frontend/src/index.css`.
  - **Files**: `frontend/src/index.css`

- [x] **Task 2: Implement state, local storage persistence, and drag handlers in App.jsx**
  - **Acceptance**: 
    - `sidebarWidth` and `notesWidth` are initialized from `localStorage` or defaults.
    - Pointer handlers perform calculation, boundary checking, and center stage safeguard (min 400px).
    - Double-click resets width to default.
    - Inline styling injected to `.dashboard-content` container using `--sidebar-width` and `--notes-width`.
  - **Verify**: Inspect `App.jsx` and console log width calculations.
  - **Files**: `frontend/src/App.jsx`

- [x] **Task 3: Integrate resize handles into Sidebar and NotesPanel components**
  - **Acceptance**: 
    - `Sidebar.jsx` accepts `onResizeStart` and `onResizeReset` props and renders `<div className="resize-handle right-handle" ... />`.
    - `NotesPanel.jsx` accepts `onResizeStart` and `onResizeReset` props and renders `<div className="resize-handle left-handle" ... />`.
  - **Verify**: Inspect `Sidebar.jsx` and `NotesPanel.jsx` to verify prop passing and DOM structure.
  - **Files**: `frontend/src/components/Sidebar.jsx`, `frontend/src/components/NotesPanel.jsx`

- [x] **Task 4: Manual validation of resizing, persistence, and limits**
  - **Acceptance**: Resizing sidebars is smooth, boundaries are respected, local storage persistence works upon reloading, double-click resets work, and stage safeguard prevents collapsing below 400px.
  - **Verify**: Build and run locally, perform user tests.
  - **Files**: None
