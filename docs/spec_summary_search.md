# Spec: Search in Summary Tab with Shortcut (Cmd+F / Ctrl+F)

## Objective
Allow users to easily search and find text within the **Summary** tab of the Udemy Offline Player using the standard keyboard shortcut `Cmd + F` (macOS) or `Ctrl + F` (Windows/Linux). 

When the Summary tab is active and contains a summary:
1. Pressing `Cmd + F` / `Ctrl + F` intercepts the browser's default find dialog, opening and focusing an in-panel search bar at the top of the summary text.
2. Typing a search query highlights all case-insensitive occurrences in the rendered markdown summary.
3. A match counter shows current match and total matches (e.g., `1 / 4` or `0 / 0`).
4. Users can cycle through matches using `Enter` (next match), `Shift + Enter` (previous match), or up/down chevron buttons.
5. The active match is highlighted in a distinct accent color and smoothly scrolled into view.
6. Pressing `Escape` or clicking the `X` button closes the search bar and clears all highlights.
7. The shortcut only activates when the Summary tab is already active.

## Tech Stack
- **Frontend**: React 19 (Vite), Lucide-react icons, Vanilla CSS
- **App Wrapper**: Electron / Modern Web Browser

## Commands
- Dev Server: `npm run dev` (or `npm run dev --prefix frontend`)
- Build: `npm run build --prefix frontend`
- Lint: `npm run lint --prefix frontend`

## Project Structure
- `frontend/src/components/NotesPanel.jsx` — Summary tab view, search bar UI, search query state, match navigation, keyboard listeners.
- `frontend/src/components/markdown.jsx` — Enhanced markdown renderer to support keyword highlighting with active match tracking.
- `frontend/src/components/KeyboardShortcutsModal.jsx` — Documents `Cmd/Ctrl + F` under the UI Panels / Summary shortcuts list.
- `frontend/src/index.css` — Styling for the summary search bar, input, match count badge, navigation buttons, and `<mark>` highlight elements.

## Code Style
- Use standard React hooks (`useState`, `useRef`, `useEffect`, `useCallback`).
- Surgical changes: retain existing markdown parsing logic (bold, code blocks, timestamp buttons).
- Example shortcut listener:
```jsx
useEffect(() => {
  if (activeTab !== 'summary' || !summary) return;

  const handleKeyDown = (e) => {
    const isCmdOrCtrl = e.metaKey || e.ctrlKey;
    if (isCmdOrCtrl && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      setShowSearch(true);
      requestAnimationFrame(() => searchInputRef.current?.select());
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [activeTab, summary]);
```

## Testing Strategy
- **Manual Verification**:
  1. Navigate to a lesson with a generated summary.
  2. With the Summary tab active, press `Cmd + F` (Mac) or `Ctrl + F` (Windows):
     - Default browser find is prevented.
     - Summary search bar opens with the search input focused and text selected.
  3. Type a keyword that appears multiple times in the summary:
     - Match counter displays `1 / X`.
     - All matches are highlighted with `.summary-search-match`.
     - Active match has `.summary-search-match-active` and is scrolled into view.
  4. Press `Enter` or click the Next button: advances to match 2, scrolls into view.
  5. Press `Shift + Enter` or click Previous button: moves back to previous match.
  6. Press `Escape` or click the `X` button: search bar closes and highlights are cleared.
  7. Switch to Content, Chat, or Notes tab: verify `Cmd + F` / `Ctrl + F` does not open summary search.
  8. Press `?` to open Keyboard Shortcuts sheet: verify `Cmd/Ctrl + F` is listed.
- **Automated Verification**:
  - `npm run lint --prefix frontend` passes with 0 errors.
  - `npm run build --prefix frontend` builds successfully without warnings.

## Boundaries
- **Always**: Call `e.preventDefault()` on `Cmd + F` / `Ctrl + F` when in the Summary tab to prevent browser find.
- **Always**: Keep shortcut strictly scoped to when `activeTab === 'summary'`.
- **Always**: Preserve existing markdown styling, bold text, inline code, and clickable timestamp badges.
- **Never**: Modify summary caching, database persistence, or AI generation logic.

## Success Criteria
- [ ] `Cmd + F` (macOS) / `Ctrl + F` (Windows/Linux) opens and focuses summary search when the Summary tab is active.
- [ ] Shortcut does not activate when on Content, Chat, or Notes tabs.
- [ ] Search query highlights all case-insensitive matching terms in the summary text.
- [ ] Match count (`X / Y` or `0 / 0`) is shown clearly.
- [ ] `Enter` / `Shift + Enter` and prev/next buttons navigate between matches with smooth scrolling.
- [ ] `Escape` and `X` button close the search bar and remove highlights.
- [ ] Keyboard Shortcuts modal documents `Cmd/Ctrl + F`.
- [ ] All linters and build checks pass cleanly.
