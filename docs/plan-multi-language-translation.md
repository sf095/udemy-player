# Implementation Plan: Multi-Language Subtitle Translation

This plan outlines the steps required to implement dynamic multi-language subtitle scanning, backend custom-target translations via Gemini, and interactive multi-track switching in the video player frontend.

## 1. Major Components & Dependencies
- **Subtitle Language Parser (`backend/scanner.js`)**:
  - Regex pattern to identify language extensions (e.g., `.vi.srt`, `.ja.vtt`, `_es.srt`).
  - General helper to clean out language suffix from lesson titles.
- **Translation API Router (`backend/server.js`)**:
  - Extend `/api/translate-subtitle` to accept `targetLang`.
  - Add language code-to-name mapping dictionary for Gemini prompt construction.
- **VTT File Writer (`backend/server.js`)**:
  - Save output with the custom target language code suffix.
- **Track Badges and Translator Dropdown (`frontend/src/components/VideoPlayer.jsx`)**:
  - Dynamically render uppercase badges for all keys present in the `subtitles` dictionary.
  - Dropdown containing all curated target languages that *do not* yet have subtitles for the current lesson.
  - Integration with the translation spinner and state updates.

## 2. Implementation Order
1. **Backend - Scanner Upgrade**:
   - Update `getSubtitleLanguage(filename)` to extract 2-letter codes.
   - Update `cleanTitle(filename)` to remove the extracted code from titles.
2. **Backend - Translation Router**:
   - Update `/api/translate-subtitle` to map language codes to language names (e.g., `ja` -> `Japanese`).
   - Construct the Gemini API prompt dynamically using the target language name.
   - Write the translated output into `[basename].[targetLang].vtt`.
3. **Frontend - Video Player Controls**:
   - Curate a list of translation target languages.
   - Dynamically render badge list for existing tracks.
   - Add translation selection dropdown and initiate API call.

## 3. Risks & Mitigations
- **Unsupported/Weird Filenames**:
  - *Risk*: A file named `lesson.12.srt` might be mistakenly parsed as language code `12`.
  - *Mitigation*: Restrict language regex parsing to valid 2-letter alphabetic codes (e.g. `\.[a-z]{2}\.`) or match against a whitelist of valid ISO language codes.
- **Gemini API Translation Halts/Errors**:
  - *Risk*: Translation fails due to API limits or malformed subtitle files.
  - *Mitigation*: Show clear error feedback in the player UI if translation fails, allowing retry without breaking player layout.

## 4. Parallel vs. Sequential Work
- The scanner and server changes can be implemented together in the backend.
- The frontend depends on the backend scanner and API changes. Thus, frontend updates must follow backend completion.

## 5. Verification Checkpoints
### Checkpoint 1: Backend Scanner & API Custom Targets
- Mock subtitle files: `lesson.ja.srt` and `lesson.es.vtt` next to a video.
- Run scan and check if `/api/course-content` responds with `subtitles: { en: "...", ja: "...", es: "..." }`.
- Send a `POST` request to `/api/translate-subtitle` with `{ subtitlePath: "...", targetLang: "ja" }` and verify `lesson.ja.vtt` is created.

### Checkpoint 2: Frontend Integration
- Run `npm run dev` and check that the Video Player displays `EN`, `JA`, and `ES` as selectable tracks.
- Check that clicking a track switches the active captions.
- Select a new language (e.g., French `FR`) from the translation dropdown, run translation, and verify it successfully updates the available badges and selects the new language.
