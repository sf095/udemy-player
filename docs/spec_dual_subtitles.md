# Spec: Dual Subtitles Support

## Objective
Enable users to display two subtitles simultaneously during video playback (e.g., English and Vietnamese). This helps users learning a language or technical course to follow the original instruction (English) while having the translation (Vietnamese) directly below it for reference.

### User Stories / Acceptance Criteria
- As a user, when playing a video, I want to be able to select both a **primary subtitle** language and a **secondary subtitle** language.
- As a user, I want the secondary subtitle to be rendered directly below the primary subtitle.
- As a user, I want the secondary subtitle to have a different styling (smaller, distinct color like yellow) so it is clearly distinguished from the primary subtitle.
- As a user, I want the dual subtitles to work in both normal window mode and native browser fullscreen mode.
- As a user, I want my choice of secondary subtitle language to persist when I navigate between lessons and reload the application.
- As a user, I want to be able to turn off the secondary subtitle by selecting "None".

## Tech Stack
- **Frontend:** React 19.2, Vite 8.0
- **Styling:** CSS variables and custom `video::cue` styling rules in `index.css`
- **APIs:** HTML5 `<video>` and WebVTT standard (`Blob` and Object URLs)

## Commands
- **Install dependencies:** `npm run install:all`
- **Start dev server (Backend + Frontend):** `npm run dev`
- **Lint check:** `npm run lint --prefix frontend`
- **Build production bundle:** `npm run build --prefix frontend`

## Project Structure
The implementation will modify:
- `frontend/src/components/VideoPlayer.jsx`: Main video playback and controls container.
- `frontend/src/App.jsx`: Main application wrapper that holds user preferences (such as selected languages) and coordinates state.
- `frontend/src/index.css`: Global styles, adding selectors for styling the secondary subtitles.

## Code Style
We will implement parsing and merging logic in clean, modular JavaScript functions inside `VideoPlayer.jsx` (or a helper file). 

Example snippet of VTT parser:
```javascript
function parseVttCues(vttText) {
  const cues = [];
  const normalized = vttText.replace(/\r\n/g, '\n').replace(/\uFEFF/g, '');
  const blocks = normalized.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    
    // Find line with timecode (e.g., 00:01:23.450 --> 00:01:25.120)
    const timeIndex = lines.findIndex(line => line.includes('-->'));
    if (timeIndex === -1) continue;

    const timeStr = lines[timeIndex];
    const [startStr, endStr] = timeStr.split('-->').map(s => s.trim());
    
    const start = parseTimestamp(startStr);
    const end = parseTimestamp(endStr);
    
    // Get text lines after the timestamp line
    const textLines = lines.slice(timeIndex + 1);
    const text = textLines.join('\n');

    cues.push({ start, end, text });
  }
  return cues;
}
```

## Testing Strategy
Since there is no automated test runner configured in the frontend project, we will rely on rigorous manual testing and verification checkpoints:
1. **Verification of subtitle parsing:** Check that WebVTT files are successfully parsed and times are converted to seconds.
2. **Verification of merge algorithm:** Verify edge cases like identical timings (common in translated tracks), partial overlaps, and non-overlapping segments.
3. **Visual layout verification:** Check normal mode and native fullscreen mode.
4. **Local persistence verification:** Inspect `localStorage` after selecting primary/secondary languages and reloading page.

## Boundaries
- **Always:** Use native `<track>` elements and Blob URLs to ensure compatibility with standard fullscreen modes.
- **Ask first:** Modifying backend API routes (none planned).
- **Never:** Include large external libraries for subtitle parsing. Never compromise the layout and positioning of native controls.

## Success Criteria
- [ ] Subtitle controls display a "Secondary" select dropdown when multiple subtitle tracks exist.
- [ ] Selecting a secondary language correctly displays both primary (white) and secondary (yellow) text lines stacked vertically.
- [ ] Text styling is distinct (primary at `1em` in white, secondary at `0.85em` in `#ffd200` yellow).
- [ ] Subtitles display correctly when toggling fullscreen.
- [ ] The secondary language selection is persisted in `localStorage` under `udemy-player-secondary-lang` and applies automatically on reload.
- [ ] No Javascript errors are thrown in the console when loading or switching tracks.

## Open Questions
- None. Requirements are clear.
