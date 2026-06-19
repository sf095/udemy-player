# Tasks: Multi-Language Subtitle Translation

- [x] **Task 1: Update Subtitle Language Parser in Backend Scanner**
  - **Acceptance**:
    - The scanner detects any subtitle files containing ISO-639 2-letter language codes (e.g. `.ja.srt`, `.es.vtt`, `_fr.vtt`, `.vi.srt`) and populates them into the `subtitles` object returned by the `/api/course-content` API.
    - `cleanTitle` properly removes any 2-letter language code suffix before formatting the title.
  - **Verify**: Run a scratch test script that executes `scanCourseFolder` on a mock directory structure with custom language subtitles and verify the output contains tracks like `ja`, `es`, `vi` and has correct clean titles.
  - **Files**:
    - [backend/scanner.js](file:///Users/hientranthanh/downloads/sources/udemy-player/backend/scanner.js)

- [x] **Task 2: Support Target Language parameter in backend Translate Subtitle endpoint**
  - **Acceptance**:
    - The `/api/translate-subtitle` API accepts `targetLang` in the request body.
    - It maps the `targetLang` code to a full language name (e.g., `ja` -> `Japanese`, `es` -> `Spanish`, `ko` -> `Korean`) to pass to the Gemini translation prompt.
    - It saves the translated subtitle file as `[basename].[targetLang].vtt`.
  - **Verify**: Send a `POST` request to `/api/translate-subtitle` using `curl` or a scratch node script, specifying `{ "subtitlePath": "...", "targetLang": "ja" }`. Verify the file `[basename].ja.vtt` is created.
  - **Files**:
    - [backend/server.js](file:///Users/hientranthanh/downloads/sources/udemy-player/backend/server.js)

- [x] **Task 3: Implement Dynamic Badges & Target Language Selection dropdown in Video Player**
  - **Acceptance**:
    - The video player displays a dynamic list of subtitle tracks available in the `subtitles` dictionary, showing uppercase 2-letter buttons (e.g., `EN`, `VI`, `JA`).
    - The player shows a dropdown of target languages (excluding already translated/available ones) that the user can choose to translate the subtitles into.
    - Clicking a language in the dropdown invokes the translation API with the selected `targetLang` and updates the list of subtitles once translation completes successfully.
  - **Verify**: Run `npm run dev`, select a course lesson, test selecting and displaying existing translations, and translate the subtitles to a new language.
  - **Files**:
    - [frontend/src/components/VideoPlayer.jsx](file:///Users/hientranthanh/downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx)
