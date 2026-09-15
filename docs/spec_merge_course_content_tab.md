# Spec: Merge Course Content into Right Sidebar Tab

## Objective
Merge the "Course Content" curriculum view (sections, lectures, completion checkmarks, chapter summaries) into the right sidebar as a tab alongside "Summary", "AI Chat", and "Notes". Remove the dedicated left sidebar to establish a clean 2-column layout (Stage/Video on the left/center, Tabbed Panel on the right) similar to modern Udemy and video learning platforms.

## Assumptions
1. The left sidebar is removed completely, transforming the workspace into a 2-column layout: Stage (left/center) and Right Panel.
2. The tab order in the right panel will be:
   1. **Course Content** (`<ListOrdered />` or `<Menu />` / `<BookOpen />`)
   2. **Summary** (`<FileText />`)
   3. **AI Chat** (`<MessageSquare />`)
   4. **Notes** (`<BookOpen />` or `<Edit3 />`)
3. The right panel is available whenever a course is loaded (including before a lesson is clicked, and during PDF/HTML/Quiz lessons so users can browse and navigate lessons at all times).
4. The default active tab on load or when selecting a course is "Course Content".
5. For non-video lessons (PDF, Quiz, HTML) or when no lesson is active, the "Summary" and "AI Chat" tabs display informative states indicating they operate on video lessons with subtitles.
6. Keyboard shortcuts: Both `B` (previously toggle left sidebar) and `N` (previously toggle notes) will toggle the right panel.
7. Top header: The left `<button className="btn-toggle">` in the brand section is removed or relocated, and a unified toggle button for the right panel is provided in the header actions.
8. Video overlay: The controls inside `VideoPlayer.jsx` are streamlined so that the sidebar/panel toggle button toggles the unified right panel.
9. Resizing: The right panel remains resizable using the left-edge drag handle, persisting width in localStorage (`udemy-player:right-panel-width` or keeping backwards compatibility).

## Tech Stack
- **Frontend**: React 18, Vite
- **Icons**: Lucide React (`ListOrdered`, `FileText`, `MessageSquare`, `BookOpen`, `Sparkles`, etc.)
- **Styling**: Vanilla CSS with CSS custom properties (`var(--...)`)

## Commands
- **Dev**: `npm run dev` (starts concurrently backend on :4000 and frontend on :5173)
- **Frontend Dev**: `npm run dev --prefix frontend`
- **Frontend Build**: `npm run build --prefix frontend`
- **Frontend Lint**: `npm run lint --prefix frontend`

## Project Structure
- `frontend/src/App.jsx` → Main layout container, state for active tab, right panel collapsed state, width resizing, keyboard shortcuts, header controls.
- `frontend/src/components/RightPanel.jsx` (or consolidated `NotesPanel.jsx`) → Tabbed container hosting Course Content, Summary, AI Chat, and Notes tabs.
- `frontend/src/components/Sidebar.jsx` (or `CourseContentTab.jsx`) → Content component rendering sections, lessons, checkmarks, duration, and chapter summary modal trigger.
- `frontend/src/components/VideoPlayer.jsx` → Video player controls with unified overlay button to toggle right panel.
- `frontend/src/components/KeyboardShortcutsModal.jsx` → Updated shortcut documentation for `B` and `N`.
- `frontend/src/index.css` → Grid styling updated to 2-column layout (`1fr var(--right-panel-width)`).

## Code Style
```jsx
// Example tab button rendering in right panel:
<button
  className={`panel-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
  onClick={() => setActiveTab('content')}
  style={{
    flex: 1,
    padding: '12px 4px',
    border: 'none',
    borderBottom: activeTab === 'content' ? '2px solid var(--primary)' : '2px solid transparent',
    background: 'transparent',
    color: activeTab === 'content' ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontWeight: activeTab === 'content' ? 600 : 500,
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'var(--transition-fast)'
  }}
>
  <ListOrdered size={14} /> Content
</button>
```

## Testing Strategy
1. **Layout & Visual Verification**:
   - Verify layout is 2 columns: Stage (left) and Right Panel.
   - Verify left sidebar is gone; Stage occupies full width up to the right panel.
   - Verify tabs are ordered horizontally: Content, Summary, AI Chat, Notes.
   - Verify right panel has resize handle on its left border.
2. **Interaction Verification**:
   - On initial course load, "Content" tab is active and shows section accordions, lessons, completion badges, and chapter summary buttons.
   - Clicking a lesson loads and plays that lesson; active lesson highlighting works.
   - Clicking completion checkmark toggles lesson completion without interrupting playback.
   - Clicking "Summary", "AI Chat", and "Notes" tabs displays their respective tools.
   - Toggle right panel via header button, video player overlay button, and keyboard shortcuts (`B` and `N`).
   - Entering theater mode collapses the panel or expands the video as expected.
3. **Build & Lint Verification**:
   - Run `npm run lint --prefix frontend` (no errors).
   - Run `npm run build --prefix frontend` (clean build without warnings/errors).

## Boundaries
- **Always**:
  - Keep all existing features: video playback, companion resources (PDF, HTML, Quiz), note taking, AI summary, AI chat, chapter summaries, completion toggles, keyboard shortcuts.
  - Maintain CSS variable naming and theme support (both Dark and Light themes).
  - Run lint and build checks before concluding.
- **Ask first**:
  - Adding new dependencies or changing backend API endpoints.
- **Never**:
  - Remove user progress, note storage, or subtitle caching logic.
  - Break responsive resizing or touch unrelated backend files.

## Success Criteria
- [x] Left sidebar is completely removed from dashboard layout.
- [x] Dashboard uses 2-column layout (`1fr var(--panel-width)`).
- [x] Right panel has 4 tabs: "Content", "Summary", "AI Chat", "Notes".
- [x] Tab "Content" renders full curriculum tree (sections, lessons, stats, duration, chapter summary trigger).
- [x] Clicking lessons in "Content" tab selects and plays them correctly.
- [x] Right panel is accessible even when no lesson is active, or when viewing PDF/Quiz/HTML lessons.
- [x] Shortcuts `B` and `N` both toggle the right panel.
- [x] Top header has a single clean right panel toggle button.
- [x] Resizing panel horizontally works smoothly and preserves width in `localStorage`.
- [x] `npm run build --prefix frontend` passes with 0 errors.
