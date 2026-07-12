# Spec: Reorder Right Sidebar Tabs

## Objective
Reorder the tabs in the right sidebar (`NotesPanel`) of the player dashboard to be in the following sequence: "Summary", "AI Chat", and "Notes". Additionally, update the default active tab to "Summary" (the first tab in the new order) to align with standard tab-rendering logic.

## Tech Stack
- **Frontend**: React (Vite)
- **Styling**: Vanilla CSS, Lucide icons

## Commands
- **Dev mode**: `npm run dev` (runs both backend and frontend concurrently)
- **Build frontend**: `npm run build --prefix frontend`
- **Lint frontend**: `npm run lint --prefix frontend`

## Project Structure
- `frontend/src/components/NotesPanel.jsx` → Contains the component rendering the tab headers and panels for Notes, Summary, and AI Chat.

## Code Style
- Keep HTML rendering semantic and matching the existing inline styles of `NotesPanel.jsx`.
- Use React state hook (`useState`) to track active tab, initialized to the default value `'summary'`.

## Testing Strategy
1. **Manual Visual Check**:
   - Verify tabs are ordered horizontally from left to right as: Summary, AI Chat, Notes.
   - Verify the "Summary" tab is active by default when the page/panel loads.
   - Verify styling (active state highlights, border color) is intact for each tab.
2. **Interactive Check**:
   - Click "AI Chat" tab -> verify tab content changes to the Chat view and the chat input field is automatically focused.
   - Click "Notes" tab -> verify tab content changes to the Notes view, showing the list of notes and the add note field.
   - Click "Summary" tab -> verify tab content changes back to the Summary view.
3. **Build and Lint Validation**:
   - Run `npm run build --prefix frontend` and `npm run lint --prefix frontend` to ensure no build/linting errors.

## Success Criteria
- [ ] Tab buttons in the right sidebar are reordered to: Summary, AI Chat, Notes.
- [ ] The default active tab on load is updated to "Summary" (`'summary'`).
- [ ] Clicking any tab correctly switches the content panel and triggers active styles.
- [ ] Clicking the "AI Chat" tab auto-focuses the chat input field (maintaining existing behavior).

## Boundaries
- **Always**: Keep standard inline styles and CSS variables as implemented in the original file.
- **Never**: Add new dependencies or change component state management structure (stay local to `NotesPanel.jsx`).

## Open Questions
1. Should "Summary" remain the default tab, or should it fall back to "Notes" if no subtitle data is present to generate a summary? (For this spec, we default to "Summary", but if there's no subtitle, the summary tab content may show a notice).
