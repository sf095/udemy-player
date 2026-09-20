# Spec: Video Without Subtitles Indicator

## Objective
When playing a video lesson that does not have subtitle files available (`subtitles` object is empty or undefined), the application currently displays a faint, ambiguous "None" label in the top-left video overlay chip. The objective is to provide a clear, intuitive visual indication (using an accessible icon such as `CaptionsOff` from `lucide-react` with descriptive text/tooltip) so users immediately know no subtitles are available for the video, maintaining UI consistency with the player design system.

## Tech Stack
- Frontend: React 19, Vite, Lucide React (`lucide-react`)
- Styling: Plain CSS with CSS custom properties (`index.css`)
- Desktop/Backend: Electron, Node.js, Express (existing)

## Commands
- **Build**: `npm run build --prefix frontend`
- **Lint**: `npm run lint --prefix frontend`
- **Dev**: `npm run dev`
- **Dev Desktop**: `npm run dev:desktop`

## Project Structure
- `frontend/src/components/VideoPlayer.jsx`: Video playback component and top overlay subtitle chips.
- `frontend/src/components/Sidebar.jsx`: Lesson navigation list and lesson badges (optional extension).
- `frontend/src/index.css`: Styling for player overlays, chips, and badges.
- `docs/spec_no_subtitles_indicator.md`: This specification file.

## Code Style
Match existing functional React component patterns and CSS variable usage:
```jsx
import { CaptionsOff } from 'lucide-react';

{/* When no subtitles are available */}
{availableLangs.length === 0 && (
  <div className="no-subtitles-indicator" title="No subtitles available for this video">
    <CaptionsOff size={14} className="no-subtitles-icon" />
    <span>No subtitles</span>
  </div>
)}
```

```css
.no-subtitles-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  padding: 2px 6px;
  user-select: none;
}
.no-subtitles-icon {
  opacity: 0.8;
  flex-shrink: 0;
}
```

## Testing Strategy
- **Framework / Validation**: Vite build check (`npm run build --prefix frontend`).
- **Test Scenarios**:
  1. **Video with subtitles**: Verify language toggle buttons (`EN`, `VI`, etc.), translation dropdown, 2nd subtitle selector, and font size selector appear as normal. No "No subtitles" indicator appears.
  2. **Video without subtitles**: Verify the indicator appears in the top-left overlay chip with the `CaptionsOff` icon and descriptive tooltip. Verify the awkward "None" text is eliminated.
  3. **Overlay hide/show transitions**: Verify the indicator fades out smoothly along with the rest of the player overlay when the user is inactive or mouse leaves, and reappears on interaction.
  4. **Theater Mode & Fullscreen**: Verify display in normal, theater, and fullscreen modes without visual clipping or alignment shifts.

## Boundaries
- **Always**:
  - Use existing theme variables (`var(--text-muted)`, `var(--overlay-chip-bg)`, etc.).
  - Ensure zero regressions to subtitle loading, playback, or multi-language switching for videos with subtitles.
  - Run `npm run build --prefix frontend` to verify build success before finalizing.
- **Ask first**:
  - Modifying backend scanner logic for subtitle detection.
  - Adding badges to the sidebar lesson list if it clutters the lesson rows.
- **Never**:
  - Add external dependencies for icons or tooltips when `lucide-react` and standard browser titles are already in use.
  - Alter unrelated video controls or player state logic.

## Implementation Plan
1. **Styling Update**: Define `.no-subtitles-indicator` and `.no-subtitles-icon` classes in `frontend/src/index.css` following existing typography, spacing, and CSS custom property conventions.
2. **Component Update**: Import `CaptionsOff` from `lucide-react` in `frontend/src/components/VideoPlayer.jsx` and replace the plain "None" text with the new indicator container, icon, text, and descriptive tooltip.
3. **Verification**: Run `npm run build --prefix frontend` to ensure compilation passes without errors or warnings, and verify rendering.

## Tasks
- [x] Task 1: Add CSS styling for no subtitles indicator in `frontend/src/index.css`
  - Acceptance: `.no-subtitles-indicator` and `.no-subtitles-icon` are defined with proper flex alignment, font sizing, and theme colors.
  - Verify: CSS syntax is valid and classes are ready for use.
  - Files: `frontend/src/index.css`
- [x] Task 2: Update `VideoPlayer.jsx` to render `CaptionsOff` icon and "No subtitles" indicator
  - Acceptance: `CaptionsOff` is imported and used in place of the bare "None" label when `availableLangs.length === 0`.
  - Verify: Build check with `npm run build --prefix frontend`.
  - Files: `frontend/src/components/VideoPlayer.jsx`
- [x] Task 3: Build verification and quality check
  - Acceptance: Zero build errors in Vite.
  - Verify: `npm run build --prefix frontend`.
  - Files: None

