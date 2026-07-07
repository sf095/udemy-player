# Spec: Re-Translate Subtitle

## Objective

Allow users to re-translate a subtitle into a language that already has an existing translation file. Currently, once a translated subtitle file exists on disk (e.g., `lecture.vi.vtt`), the language disappears from the "Translate to..." dropdown, making it impossible to regenerate the translation without manually deleting the file.

**User story:** As a student watching a Udemy course, I want to re-translate subtitles for a language I already translated before, so that I can get a better quality translation (e.g., after switching AI providers or correcting the source subtitles).

**Scenarios:**
- The AI translation on the first attempt was poor quality or had errors
- The user switched AI providers (Gemini → Anthropic) and wants a potentially different translation
- The source subtitle file (e.g., English) was updated or corrected

## Tech Stack

- **Backend:** Node.js + Express (existing), no new dependencies
- **Frontend:** React 18+ (existing), no new dependencies
- **AI Providers:** Gemini 2.5 Flash / 1.5 Flash (existing), Anthropic Claude (existing)

## Commands

```
Backend:     npm run backend          (from root: concurrently runs backend + frontend)
Frontend:    npm run frontend
Dev:         npm run dev
Package:     npm run package
Lint:        npx eslint frontend/src/ backend/
```

## Project Structure

```
backend/
  server.js                  → Add: POST /api/retranslate-subtitle endpoint (new route, same pattern as translate-subtitle)
  lib/subtitle.js            → No changes needed (parseSubtitleCues already reusable)

frontend/src/
  components/
    VideoPlayer.jsx          → Add: right-click context menu on language buttons with "Re-translate" option
                               Add: confirmation dialog state + UI
    App.jsx                  → Minor: may need to pass through re-translate completion handler
  App.css / index.css        → Add: context menu styles, confirmation dialog styles
```

## Code Style

Follow existing patterns in the codebase. Example — the existing translate flow in `VideoPlayer.jsx`:

```jsx
// Existing pattern for handleStartTranslation (VideoPlayer.jsx:242-271)
const handleStartTranslation = async (targetLangCode) => {
  const sourcePath = subtitles?.[activeLang];
  if (!sourcePath) return;

  setTranslating(true);
  setTranslationError(null);

  try {
    const response = await fetch('/api/translate-subtitle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtitlePath: sourcePath, targetLang: targetLangCode })
    });
    const data = await response.json();
    if (data.success) {
      if (onSubtitlesUpdated) await onSubtitlesUpdated();
      setActiveLang(targetLangCode);
    } else {
      setTranslationError(data.error || 'Failed to translate subtitles.');
    }
  } catch (err) {
    console.error('Translation error', err);
    setTranslationError('Network error during translation.');
  } finally {
    setTranslating(false);
  }
};
```

**Conventions to follow:**
- Use `useState` for local UI state (context menu open/close, confirmation dialog)
- Use `useRef` for DOM event cleanup (click-outside to close context menu)
- CSS classes prefixed generically: `context-menu-*`, `confirm-dialog-*`
- Backend routes follow pattern: `POST /api/<action>` with JSON body, return `{ success: true/false, error?: string }`
- Error states shown via existing `translationError` + toast pattern

## Testing Strategy

- **Manual verification** (primary): This is a desktop app; manually test by:
  1. Open a course with English subtitles
  2. Translate to Vietnamese (creates `.vi.vtt`)
  3. Right-click the "VI" language button → click "Re-translate"
  4. Confirm the dialog appears with the correct warning text
  5. Confirm → verify translation runs and `.vi.vtt` is overwritten
  6. Cancel → verify no API call was made, file unchanged
  7. Verify context menu closes when clicking outside
- **Edge cases to test:**
  - Re-translate while another translation is already in progress (should be blocked or queued)
  - Re-translate with no API key configured (should show error)
  - Right-click on the currently active language vs. a non-active language

## Boundaries

- **Always do:**
  - Reuse existing `parseSubtitleCues` from `backend/lib/subtitle.js`
  - Reuse existing chunking logic (100 cues/chunk, 500ms delay)
  - Reuse existing AI provider dispatch (`callAiProvider`)
  - Keep the same output file naming convention (`<base>.<langCode>.vtt`)
  - Follow existing error handling patterns (show `translationError` toast)

- **Ask first:**
  - Adding new npm dependencies
  - Changing the chunk size or AI prompt
  - Modifying the output file naming convention

- **Never do:**
  - Delete the existing file before the new translation succeeds
  - Block the video player during translation
  - Change the behavior of first-time translation (only add re-translate)

## Success Criteria

1. **Right-click context menu** appears on existing language buttons in the subtitle overlay, showing a "Re-translate to [LanguageName]" option
2. **Confirmation dialog** appears before overwriting, showing: "This will overwrite the existing [LanguageName] translation. Continue?" with Cancel/Confirm buttons
3. **Re-translation uses the currently active language as the source** (not necessarily the language being right-clicked)
4. **On confirm**, the existing translation flow runs (chunking → AI → write .vtt), overwriting the existing file
5. **On success**, the subtitle track reloads with the new translation automatically (via `onSubtitlesUpdated`)
6. **Context menu closes** when clicking outside or pressing Escape
7. **First-time translation flow is unchanged** — this feature only adds re-translation for already-existing languages

## Open Questions

- None — all clarified with user:
  - UI: right-click context menu on existing language buttons
  - Confirmation: Yes, dialog before overwrite
  - Source language: always use the currently active subtitle language
