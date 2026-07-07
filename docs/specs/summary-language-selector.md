# Spec: Summary Tab Language Selector

## Objective

Allow users to choose which language the AI summary is generated in, independent of the active subtitle track. Currently the summary language is locked to the subtitle language — a user watching with English subtitles cannot get a Vietnamese summary.

**User story**: As a learner watching a course with English subtitles, I want to generate a summary in Vietnamese (my native language) so I can review key concepts more effectively.

## Tech Stack

- Frontend: React (JSX), no new dependencies
- Backend: Express.js (Node) — no changes needed
- Styles: Plain CSS (matching existing `.video-overlay-select` pattern)

## Commands

```
Dev:    cd frontend && npm run dev
Build:  cd frontend && npm run build
Test:   n/a (no test framework configured)
Lint:   cd frontend && npm run lint
```

## Project Structure

```
frontend/src/components/NotesPanel.jsx  → Add language selector UI in Summary tab
frontend/src/App.jsx                     → Pass summaryLang/setSummaryLang to NotesPanel
frontend/src/index.css                   → Minimal new styles if needed
backend/server.js                        → No changes (already supports any langCode)
```

## Code Style

Follow existing patterns in `NotesPanel.jsx`:
- Use inline `style` objects for styling (matches the rest of the component)
- Use lucide-react icons where appropriate
- State via `useState`, persisted with `localStorage`

Example of existing language selector pattern (from VideoPlayer):

```jsx
<select
  className="video-overlay-select"
  value={activeLang}
  onChange={(e) => setActiveLang(e.target.value)}
>
  {Object.entries(langs).map(([code, label]) => (
    <option key={code} value={code}>{label}</option>
  ))}
</select>
```

## Testing Strategy

- Manual testing: Select a different summary language, generate summary, verify output language
- Cache check: Switch back to a previously-generated language, verify cached summary loads
- Persistence: Refresh the page, verify the selected language is retained

## Boundaries

- **Always do**: Match existing UI patterns (inline styles, existing CSS classes), persist user preference
- **Ask first**: Adding new npm dependencies, changing the backend API
- **Never do**: Remove the existing auto-language behavior without a fallback

## Success Criteria

- [ ] A language selector dropdown appears in the Summary tab
- [ ] Users can pick any supported language (vi, en, ja, zh, es, fr, de, ko, ru, ar, pt, id, it)
- [ ] The selected language is independent of the active subtitle language
- [ ] Changing the summary language auto-loads a cached summary if one exists
- [ ] The "Generate Summary" button uses the selected language, not the subtitle language
- [ ] The selection persists across page reloads (localStorage)
- [ ] The UI looks consistent with existing selectors (e.g., `.video-overlay-select` style)

## Open Questions

- Should there be a default summary language (e.g., match subtitle language, or user's last choice)?
  → Proposal: Default to the last-used language from localStorage; if none, fall back to `activeLang`
