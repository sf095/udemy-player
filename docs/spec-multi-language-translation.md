# Spec: Multi-Language Subtitle Translation

## Objective
Support translating English subtitle files to multiple other languages (e.g., Vietnamese, Japanese, Chinese, Spanish, French, German, Korean, Russian, Arabic, Portuguese) using the Gemini API. Improve the system to:
1. Dynamically detect any existing language subtitle files (like `.ja.srt`, `.es.vtt`) in the course directory.
2. Allow the user to select from a curated list of target languages for translation.
3. Automatically call the Gemini API with the selected target language.
4. Save the translated subtitle file with the corresponding language code (e.g., `lesson.ja.vtt`).
5. Render clean 2-letter uppercase badges for all active subtitles and a dropdown for translation targets in the Video Player UI.

## Tech Stack
- Frontend: React (Vite), TailwindCSS-free custom styling.
- Backend: Node.js, Express.
- Translation: Google Gemini API (model `gemini-3.1-flash-lite` or custom configurable).

## Commands
- Dev Server: `npm run dev` (runs both frontend and backend concurrently via root folder)
- Frontend Dev: `npm run dev --prefix frontend`
- Backend Dev: `npm run dev --prefix backend`

## Project Structure
- `backend/scanner.js` - Modified to scan for arbitrary language codes in subtitle filenames and group them.
- `backend/server.js` - Updated `/api/translate-subtitle` endpoint to receive and process custom target language codes.
- `frontend/src/components/VideoPlayer.jsx` - Redesigned to show badges for loaded subtitles, a language selection dropdown, and translate trigger.

## Code Style
### Frontend React Style:
```jsx
// Clear inline styles using variables and explicit responsive units
<button
  style={{
    background: activeLang === lang ? 'var(--primary)' : 'transparent',
    color: activeLang === lang ? 'white' : 'var(--text-secondary)',
    border: 'none',
    borderRadius: '16px',
    padding: '4px 8px',
    fontSize: '0.7rem',
    fontWeight: 600,
    cursor: 'pointer'
  }}
>
  {lang.toUpperCase()}
</button>
```

### Backend Express Style:
```javascript
// Pure Node fetch calls without external translation dependencies
const prompt = `Translate the following English subtitle file to ${targetLanguageName}. 
You must preserve all timecodes, formatting, line numbers, and subtitle syntax exactly.`;
```

## Testing Strategy
- **Manual Verification**:
  1. Add a dummy test subtitle file (e.g. `01 - intro.es.srt`) to check if the scanner correctly lists `es` (Spanish).
  2. Load the course and verify the Video Player displays `ES` as an available track.
  3. Input Gemini API key in the App Settings.
  4. Select a language (e.g., Japanese) and click the translate button.
  5. Check if the backend saves the translated file (e.g., `01 - intro.ja.vtt`) next to the original video file.
  6. Confirm the video player displays `JA` and loads the newly translated Japanese subtitles properly.

## Boundaries
- **Always do**: Preserve existing user watch progress and notes settings when updating/writing files.
- **Ask first**: If we need to change the Gemini API endpoint or model.
- **Never do**: Add any external translation/parsing dependencies to `package.json`.

## Success Criteria
- [x] Subtitle scanner detects filenames with arbitrary 2-letter codes (e.g., `.ja.srt`, `.es.vtt`, `.vi.srt`) and populates them in the `subtitles` dictionary.
- [x] `POST /api/translate-subtitle` takes a `targetLang` parameter in the request body.
- [x] Gemini API prompt correctly inserts the full name of the target language.
- [x] Translated subtitles are written as `[basename].[targetLang].vtt` next to the source file.
- [x] Video Player UI displays uppercase badges (e.g., `EN`, `VI`, `JA`) for all scanned subtitles.
- [x] Video Player UI displays a clean dropdown listing curated languages that are *not* currently translated/available for the active lesson, along with a "Translate to..." action.
- [x] A smooth spinner overlay/text is shown during the active translation request.

## Open Questions
- **None**: All UI placement and supported languages options have been aligned with the user.
