# Spec: Active Lesson Playback Visibility

## Objective
Enhance the visibility of the currently playing lesson in the offline player, specifically addressing the issue where a user doesn't know which lesson is playing when its containing chapter (section) is closed or when auto-advancing to a new chapter.

### User Stories / Acceptance Criteria
1. **Auto-Expand on Active Lesson Change**: When the active lesson changes (e.g. via autoplay next, keyboard shortcuts, or other manual trigger), the sidebar section containing the new active lesson must automatically expand.
2. **Collapsed Section Highlight**: If a section containing the active lesson is collapsed (either manually by the user or initially), the section accordion header (trigger) must be visually highlighted.
3. **Collapsed Playing Subtext**: When a section containing the active lesson is collapsed, its metadata text (which normally shows "X/Y completed") must display a "Now Playing: [Lesson Title]" status indicator.
4. **Stage Title Header**: A clean, premium header banner must be added at the top of the main stage viewport when a lesson is active, showing the current Section Title and the current Lesson Title (e.g., `Section 3: Getting Started > Lesson 12: Creating React Components`). This ensures the user always knows what is playing, even if the sidebar is collapsed entirely.

## Tech Stack
- Frontend: React (Vite-based SPA)
- Styling: Vanilla CSS (custom properties, responsive variables)
- Icons: Lucide React

## Commands
- Build: `npm run build` (within frontend)
- Dev: `npm run dev` (within frontend)
- Lint: `npm run lint` (within frontend)

## Project Structure
- `frontend/src/App.jsx` - Main app wrapper and layout
- `frontend/src/components/Sidebar.jsx` - Sidebar rendering accordion of sections and lessons
- `frontend/src/index.css` - Custom CSS variables and UI styles

## Code Style
- Use standard functional React components with hooks.
- Follow ES6+ syntax and standard React/JSX practices.
- Styles should use existing CSS variables (e.g., `var(--primary)`, `var(--text-secondary)`, `var(--bg-hover)`) and responsive variables.

## Testing Strategy
- Manual verification of:
  - Autoplay transition to a lesson in a different chapter correctly expands the new chapter in the sidebar.
  - Collapsing a chapter that has the active lesson highlights the chapter header and changes metadata to "Now Playing: [Title]".
  - The stage panel displays a beautiful title banner showing the current section and lesson titles.
  - Toggling sidebar collapse or resizing works correctly with the new stage layout.

## Boundaries
- **Always**: Follow existing UI color palettes and variables.
- **Ask First**: Adding new library dependencies.
- **Never**: Hardcode files or break keyboard shortcut handlers.

## Success Criteria
- [x] Transitioning to the next/prev lesson or autoplaying a new lesson in a different chapter auto-expands the new chapter.
- [x] A collapsed chapter header containing the active lesson is visually highlighted (using accent/primary borders or backgrounds).
- [x] A collapsed chapter containing the active lesson shows "Playing: [Lesson Title]" in its subtext.
- [x] The stage panel displays the current section and lesson title in a premium banner on top of the viewport.
- [x] No regression on layout or sidebar resizing controls.
