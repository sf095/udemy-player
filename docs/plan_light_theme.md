# Plan: Premium Light Theme Implementation

## Components & Dependencies
1. **`index.css`**: The design system base. Defines all dark/light semantic variables and replaces hardcoded color functions with CSS variables.
2. **`App.jsx`**: The core component that controls the state of the theme and handles rendering the toggle button in the header.
3. **`localStorage`**: To store theme preferences.

## Implementation Steps
### Step 1: CSS Variables Modernization
Update `index.css` to:
- Convert hardcoded colors (like `rgba(13, 17, 28, 0.7)` for the header, `rgba(255, 255, 255, 0.05)` for hover effects, etc.) into CSS custom properties.
- Add `.light-theme` overrides for these variables.
- Add smooth transitions on `background-color`, `color`, and `border-color` for the body, header, sidebar, notes panel, and stage.

### Step 2: React State & Persistence
In `App.jsx`:
- Initialize theme state from `localStorage` (defaulting to `'dark'`).
- Apply the theme class (e.g. `'light-theme'`) to a top-level wrapper or `document.body`.
- Sync changes to `localStorage` key `udemy-player-theme`.

### Step 3: Toggle Button UI Integration
In `App.jsx`:
- Import `Sun` and `Moon` icons from `lucide-react`.
- Add a theme toggle button to the top-right header, positioned before the Settings button.
- Implement hover states and tooltips for the toggle button.

## Risk & Mitigation Strategy
- **Contrast Check**: A light theme can sometimes suffer from text/icon readability issues. We will carefully select slate/gray shades (e.g. `#0f172a`, `#475569`, `#64748b`) to ensure AA contrast.
- **Modal Overlays**: If modals render in portalled nodes, they might not inherit the `.light-theme` variables if applied to `.app-container`.
  - *Mitigation*: We will apply the `.light-theme` class directly to `document.body` or `document.documentElement` to guarantee all modal portals inherit the styles properly.
- **Scrollbars**: Scrollbars should adapt to the light theme so they don't appear white-on-white.
  - *Mitigation*: Transition scrollbar thumb colors based on theme-specific variables.

## Verification Checkpoints
1. **CSS Loading**: Verify that changing the class on the `<body>` element immediately changes colors.
2. **Toggle Click**: Verify that clicking the toggle transitions the class and updates the toggle icon.
3. **State Persistence**: Verify that refreshing the page retains the active theme.
