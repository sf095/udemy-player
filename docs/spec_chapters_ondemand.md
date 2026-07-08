# Spec: On-Demand Chapters Generation with Language Selection

## Objective
Enable users to generate and re-generate video playback timeline chapters on-demand rather than automatically on page load. Allow users to choose their desired language (e.g. English, Vietnamese, Japanese, etc.) for chapter titles before generating and re-generating chapters.

### User Stories
- **On-Demand Generation**: As a user, when I load a video that does not have chapters generated yet, the timeline shows as a single segment (no automatic AI API requests). A clean button "✨ Generate Chapters" is presented.
- **Language Selection (Initial)**: As a user, before I generate chapters, I can select a target language from a dropdown. Clicking "Generate" will create chapters with titles in that language.
- **Re-generation**: As a user, when chapters already exist, I can open the Chapters Panel and see a "Re-generate Chapters" interface where I can select a language and trigger a fresh scan that overwrites the existing chapters.

## Tech Stack
- **Frontend**: React 19, Vite, Lucide React, CSS
- **Backend**: Node.js, Express, Gemini API (via custom integration in `server.js`)
- **Desktop/Shell**: Electron

## Commands
- Dev (both frontend and backend): `npm run dev`
- Run Backend only: `npm run backend`
- Run Frontend only: `npm run frontend`
- Package app: `npm run package`

## Project Structure
- `backend/server.js`: Handles API requests and Gemini-based chapter generation.
- `frontend/src/components/VideoPlayer.jsx`: Main video player component containing the timeline, control bar, and chapters panel.
- `frontend/src/index.css`: Styles for player controls, loaders, and panels.

## Code Style
Keep consistent with the current ES6/React code style in `VideoPlayer.jsx` and `server.js`.
Example style for fetch request:
```javascript
const response = await fetch(`${backendOrigin}/api/chapters/regenerate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ videoPath, subtitlePath, language })
});
```

## Testing Strategy
- **Manual verification**: Verify that loading a video without `.chapters.json` does not automatically hit the Gemini API.
- **Verification of generation**: Select a language, click generate, verify the timeline splits into segments and the chapters are correctly loaded in the selected language.
- **Verification of regeneration**: Open the chapters list panel, choose a different language, click "Re-generate", and verify the chapters update to the new language and the cached file on disk is updated.

## Boundaries
- **Always do**: Cache generated chapters on disk next to the video file to avoid unnecessary API requests. Verify subtitle existence before allowing generation.
- **Ask first**: Adding new npm dependencies.
- **Never do**: Auto-generate chapters in the `GET /api/chapters` endpoint when they do not exist.

## Success Criteria
- [ ] `GET /api/chapters` does not call Gemini or create files. It returns `{ success: true, chapters: [], cached: false, exists: false }` if chapters are missing.
- [ ] If chapters do not exist, the timeline doesn't show segments, and a language selector plus "✨ Generate" button are shown in the control bar.
- [ ] Language options include "English" plus the `CURATED_LANGUAGES` (Vietnamese, Japanese, Chinese, Spanish, French, German, Korean, Russian, Arabic, Portuguese).
- [ ] Clicking "Generate" calls the backend and generates chapters in the chosen language.
- [ ] If chapters exist, they are displayed as segments on the timeline. A "Re-generate" section with a language dropdown is shown at the top of the Chapters List Sidebar Panel.
- [ ] Clicking "Re-generate" overwrites the cached file with new chapters generated in the newly selected language.

## Open Questions
- Should the chosen chapter language persist in `localStorage` so that subsequent chapters default to that language? (Suggested: Yes, store as `udemy-player-chapter-lang`).
