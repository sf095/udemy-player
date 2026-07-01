# Tasks: Premium Light Theme Implementation

- [x] **Task 1: Add light theme variables and transitions to `index.css`**
  - **Acceptance**:
    - CSS custom properties are mapped for all color, border, and shadow tokens.
    - Class `.light-theme` is added with overrides for light mode variables.
    - Hardcoded colors (such as `rgba(255, 255, 255, 0.05)` or `rgba(13, 17, 28, 0.7)`) are replaced with their variable equivalents (e.g. `var(--bg-hover)`, `var(--bg-header)`).
    - `transition` styles are added on body and main layout containers for smooth transition effects.
  - **Verify**: Check `frontend/src/index.css` rules.
  - **Files**: `frontend/src/index.css`

- [x] **Task 2: Integrate theme state, body class toggle, and persistence in `App.jsx`**
  - **Acceptance**:
    - Read/write active theme state from `localStorage` under `udemy-player-theme` (default to `'dark'`).
    - Toggle `light-theme` class on `document.body` or `document.documentElement` dynamically based on state.
  - **Verify**: Inspect `document.body` class list and `localStorage` in browser devtools.
  - **Files**: `frontend/src/App.jsx`

- [x] **Task 3: Add Sun/Moon toggle button UI to `App.jsx`**
  - **Acceptance**:
    - Render a sleek theme toggle button in the header right panel (next to Settings).
    - Toggle button imports and renders `Sun` icon when in dark mode (switches to light) and `Moon` icon when in light mode (switches to dark).
    - Button uses standard glassmorphic header styles and hover properties.
  - **Verify**: Verify the button functions and triggers state switch.
  - **Files**: `frontend/src/App.jsx`

- [ ] **Task 4: Manual validation and visual polishing**
  - **Acceptance**:
    - Validate that sidebar, stage panels, notes panel, settings modal, shortcuts modal, and progress bar are perfectly readable with proper contrast and aesthetic design in both dark and light modes.
    - Check that subtitle overlay styling is unaffected and maintains proper visibility on videos.
  - **Verify**: Run the application and test manually.
  - **Files**: None
