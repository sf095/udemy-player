# Implementation Plan: Dual Subtitles Support

## Phase 1: CSS and Variables Setup
Add subtitle class styles to `frontend/src/index.css` to allow styling of dual subtitles. We will use standard WebVTT class styling.

- Target file: `frontend/src/index.css`
- Changes:
  - Add `video::cue(.secondary)` selector to style the secondary track.
  - Make the secondary track text smaller (`font-size: 0.85em`) and colored in high-contrast yellow (e.g. `#ffe066`).

## Phase 2: App Level State Management
Add state for the secondary subtitle language and sync it with `localStorage`.

- Target file: `frontend/src/App.jsx`
- Changes:
  - Initialize `secondaryLang` from `localStorage` (defaulting to `""` / `none`).
  - Add a `useEffect` to save `secondaryLang` to `localStorage`.
  - Pass `secondaryLang` and `setSecondaryLang` to the `VideoPlayer` component.
  - Add logic to ensure that if `activeLang` (primary) becomes equal to `secondaryLang`, `secondaryLang` is reset to `""` to prevent displaying duplicate subtitles.

## Phase 3: Parsing and Merging Helpers
Write functions in `VideoPlayer.jsx` to parse, merge, and serialize WebVTT files.

- Target file: `frontend/src/components/VideoPlayer.jsx`
- Logic to implement:
  - `parseTimestamp(str)`: Converts `HH:MM:SS.mmm` or `MM:SS.mmm` to seconds.
  - `formatTimestamp(seconds)`: Converts seconds back to VTT format `HH:MM:SS.mmm`.
  - `parseVttCues(text)`: Parses WebVTT into cue objects `{ start, end, text }`.
  - `mergeVttCues(cuesA, cuesB)`:
    - Iterates over primary cues `cuesA`.
    - For each primary cue, finds overlapping secondary cues in `cuesB`.
    - Combines text: `${primaryText}\n<c.secondary>${secondaryText}</c>`.
    - Appends any secondary cues from `cuesB` that do not overlap with any primary cues as independent cues wrapped in `<c.secondary>... </c>`.
  - `generateVtt(cues)`: Converts cue objects back to a WebVTT file string.

## Phase 4: Fetch and Merge Lifecycle
Manage the subtitle loading and merging in `VideoPlayer.jsx`.

- Target file: `frontend/src/components/VideoPlayer.jsx`
- Changes:
  - State: `mergedSubtitleUrl` (tracks the current active Blob URL).
  - Effect: Triggered when `videoPath`, `activeLang`, or `secondaryLang` change:
    - If `activeLang` is selected and `secondaryLang` is active:
      - Fetch primary VTT and secondary VTT from backend `/api/subtitle`.
      - Parse, merge, and compile.
      - Create Blob URL and set as `mergedSubtitleUrl`.
      - Return a cleanup function that revokes the Blob URL.
    - If only `activeLang` is active (or fetch fails):
      - Use the backend direct URL: `${backendOrigin}/api/subtitle?path=${encodeURIComponent(subtitles[activeLang])}`.
      - Revoke any existing Blob URL.

## Phase 5: UI Controls
Add the secondary subtitle selector dropdown to the control panel.

- Target file: `frontend/src/components/VideoPlayer.jsx`
- Changes:
  - Render a "2nd Sub:" section in the overlay panel next to the primary subtitle list.
  - Select options: "None" + all available languages (excluding the currently active primary language).
  - Update `secondaryLang` on change.

## Verification Checkpoints
1. **Initial Compilation:** Build the frontend (`npm run build`) to ensure no syntax errors.
2. **Single Track Test:** Choose a primary subtitle language with secondary set to "None". Verify subtitles look exactly as before.
3. **Dual Track Test:** Choose Vietnamese as secondary and English as primary. Verify they show up stacked.
4. **Fullscreen Test:** Go fullscreen using the shortcut key 'F' and verify subtitles continue to display dual tracks.
5. **Persistence Test:** Refresh the page and verify secondary subtitle setting is loaded from `localStorage`.
