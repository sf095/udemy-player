# Spec: Display Full Lesson Titles and Resource Indicators in Sidebar

## Objective
Enable full visibility of lesson titles in the course content sidebar (disabling truncation/ellipsis) and add a visual indicator near the lesson's name for any lesson that contains companion resources (such as PDFs, HTML documents, quizzes, or URLs).

## Assumptions
1. **Full Lesson Name Display**: Instead of truncating the lesson name with an ellipsis (`text-overflow: ellipsis`) and forcing it onto a single line (`white-space: nowrap`), we will allow the title to wrap naturally over multiple lines or adjust styling so the full title is readable.
2. **Resource Detection**: A lesson is considered to have resources if it has items in its `resources` array (from the backend scanner) or has fallback files defined under `lesson.pdf` or `lesson.html`.
3. **Resource Indicator**: A clean, premium-looking badge or icon (e.g., a paperclip/file icon, potentially showing the count of resources) will be displayed next to the lesson title text to indicate companion assets are available.
4. **Theme Compatibility**: The indicators will support both light and dark themes using CSS variables for colors.

## Tech Stack
- React (Vite-based frontend)
- Vanilla CSS
- Lucide React (for icons)

## Commands
- Dev (Vite frontend): `npm run dev`
- Build (Production): `npm run build`

## Project Structure
- [Sidebar.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/Sidebar.jsx) - Main component rendering the course outline and lesson items.
- [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css) - Main styling file containing classes for lesson items and sidebar layout.

## Code Style
We will use React functional components with JSX, importing icons from `lucide-react`. Custom styles will reside in `index.css` using the existing design tokens/CSS variables (e.g., `--text-secondary`, `--primary`, `--transition-fast`).

Example implementation style:
```jsx
import { Paperclip } from 'lucide-react';

// Check if lesson has resources
const resourceCount = getLessonResourcesCount(lesson);
```

And in `index.css`:
```css
.lesson-title-text {
  font-size: 0.85rem;
  font-weight: 400;
  line-height: 1.3;
  word-break: break-word; /* Allow wrapping */
  /* Remove white-space: nowrap and text-overflow: ellipsis */
}
```

## Testing Strategy
1. Load a course in the player.
2. Verify that long lesson titles wrap correctly to show their full text.
3. Verify that lessons with resources display the resource indicator badge near their titles.
4. Verify that lessons with no resources do not display the badge.
5. Check visual consistency in both Dark and Light themes.

## Boundaries
- **Always do**: Make sure click handlers (like selecting a lesson or toggling complete) still work perfectly and click targets are large enough.
- **Ask first**: Adding new CSS frameworks (not needed here).
- **Never do**: Break existing layout structure or cause horizontal scrollbars in the sidebar.

## Success Criteria
- [ ] Sidebar displays full lesson titles by allowing them to wrap, rather than truncating with `...`.
- [ ] Sidebar aligns checkboxes, lesson type icons, titles, and resource indicators cleanly when titles span multiple lines.
- [ ] A visually pleasing indicator (e.g., a paperclip icon or a resource-count badge) is displayed next to the lesson name if the lesson has companion resources.
- [ ] The indicator is styled appropriately and behaves correctly in both light and dark themes.

## Open Questions
- None.
