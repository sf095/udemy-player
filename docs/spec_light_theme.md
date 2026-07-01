# Spec: Premium Light Theme Integration

## Objective
Introduce a high-quality light theme to the Udemy Offline Player. Users should be able to toggle between Dark (default) and Light themes seamlessly, with the selection persisting across page reloads. The design must look extremely premium, ensuring high contrast, clean typography, soft shadows, and proper UI panel borders.

## Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS (custom properties/variables)
- **Icons**: Lucide React (`Sun`, `Moon`)

## Proposed Changes
1. **CSS Custom Properties Mapping**:
   Abstract hardcoded dark background and border values into CSS variables under `:root`.
   Define light theme overrides under the class `.light-theme`.
   
   *Dark Theme variables (under `:root`):*
   ```css
   :root {
     --bg-main: #0b0f19;
     --bg-card: rgba(17, 24, 39, 0.7);
     --bg-sidebar: rgba(13, 17, 28, 0.85);
     --bg-input: #1e293b;
     --border-color: rgba(255, 255, 255, 0.08);
     --text-primary: #f8fafc;
     --text-secondary: #94a3b8;
     --text-muted: #64748b;
     
     /* Component backgrounds using transparency (Dark Theme) */
     --bg-hover: rgba(255, 255, 255, 0.05);
     --bg-hover-subtle: rgba(255, 255, 255, 0.02);
     --bg-hover-active: rgba(255, 255, 255, 0.1);
     --bg-header: rgba(13, 17, 28, 0.7);
     --bg-stage-tabs: rgba(13, 17, 28, 0.6);
     --bg-note-item: rgba(255, 255, 255, 0.03);
     --bg-notes-form: rgba(0, 0, 0, 0.2);
     --bg-notes-tabs: rgba(0, 0, 0, 0.15);
     --bg-modal-overlay: rgba(7, 10, 18, 0.8);
     --bg-stage-panel: rgba(15, 23, 42, 0.3);
     --scrollbar-thumb: rgba(255, 255, 255, 0.12);
     --scrollbar-thumb-hover: rgba(255, 255, 255, 0.25);
   }
   ```

   *Light Theme variables (under `.light-theme`):*
   ```css
   .light-theme {
     --bg-main: #f1f5f9;
     --bg-card: rgba(255, 255, 255, 0.85);
     --bg-sidebar: rgba(255, 255, 255, 0.9);
     --bg-input: #e2e8f0;
     
     --border-color: rgba(15, 23, 42, 0.08);
     --border-active: rgba(99, 102, 241, 0.5);
     
     --text-primary: #0f172a;
     --text-secondary: #475569;
     --text-muted: #64748b;
     
     /* Component backgrounds using transparency (Light Theme) */
     --bg-hover: rgba(0, 0, 0, 0.04);
     --bg-hover-subtle: rgba(0, 0, 0, 0.015);
     --bg-hover-active: rgba(0, 0, 0, 0.08);
     --bg-header: rgba(255, 255, 255, 0.8);
     --bg-stage-tabs: rgba(241, 245, 249, 0.85);
     --bg-note-item: rgba(0, 0, 0, 0.02);
     --bg-notes-form: rgba(248, 250, 252, 0.85);
     --bg-notes-tabs: rgba(241, 245, 249, 0.8);
     --bg-modal-overlay: rgba(15, 23, 42, 0.4);
     --bg-stage-panel: rgba(241, 245, 249, 0.5);
     --scrollbar-thumb: rgba(0, 0, 0, 0.15);
     --scrollbar-thumb-hover: rgba(0, 0, 0, 0.3);
     
     /* Shadows */
     --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
     --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
     --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
     --shadow-glow: 0 0 15px rgba(99, 102, 241, 0.15);
   }
   ```

2. **React Theme Integration**:
   - Manage theme state (`'light'` or `'dark'`) in `App.jsx`.
   - Toggle the `.light-theme` class on the `.app-container` element based on state.
   - Sync choice to `localStorage` key `udemy-player-theme`.
   
3. **UI Theme Toggle Control**:
   - Add a sleek button next to the Settings button in the header:
     - Shows `Sun` icon when in dark mode (suggesting switching to light).
     - Shows `Moon` icon when in light mode (suggesting switching to dark).
     - Standard header button aesthetics (blur backdrop, transition effects, hover state).

## Success Criteria
- [ ] Theme toggle button is rendered in the top-right header next to the Settings gear.
- [ ] Clicking the toggle switches the visual style of the application instantly.
- [ ] Theme choice is stored in `localStorage` and persists upon page refresh.
- [ ] App is fully readable and visually cohesive in both dark and light modes.
- [ ] Shadows, borders, and form inputs look premium and match their respective themes.

## Boundaries
- **Always**: Use CSS variables for all design tokens (colors, borders, shadows, backgrounds) to avoid writing duplicate CSS blocks.
- **Never**: Hardcode background colors or text colors directly in JSX files unless they are absolutely context-agnostic (e.g. video black borders).
- **Ask First**: Adding auto-detection of operating system theme preference (media queries). We will default to Dark and let the user toggle.
