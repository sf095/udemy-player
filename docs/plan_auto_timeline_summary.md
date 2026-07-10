# Technical Implementation Plan: Automatically Create Timeline and Summary Settings

This document outlines the implementation plan for adding settings to automatically generate video timeline chapters and lesson summaries when a video/lesson is loaded.

## 1. Major Components and Dependencies
1. **Backend Database Config**: `backend/server.js` holds the settings structure and API endpoint to save them to `progress_db.json`.
2. **Frontend App Context**: `frontend/src/App.jsx` handles state for settings and determines if the active provider has an API key.
3. **Settings Modal UI**: `frontend/src/components/SettingsModal.jsx` exposes checkboxes and language dropdowns for the new settings.
4. **Timeline/Chapter Component**: `frontend/src/components/VideoPlayer.jsx` determines if chapters need to be auto-generated when a video is loaded using the user-specified language.
5. **Summary Component**: `frontend/src/components/NotesPanel.jsx` determines if a summary needs to be auto-generated when a lesson is loaded using the user-specified language.

## 2. Implementation Order
1. **Backend update**: Update `DEFAULT_SETTINGS` (add `autoCreateTimelineLang` and `autoCreateSummaryLang`) and `/api/userdata/settings` in `backend/server.js`.
2. **Frontend App context update**: Update `DEFAULT_SETTINGS` in `frontend/src/App.jsx` and pass new settings/prop down to child components.
3. **Settings UI update**: Add UI toggles and dropdown selectors for both settings in `frontend/src/components/SettingsModal.jsx`.
4. **Timeline auto-creation implementation**: Update `frontend/src/components/VideoPlayer.jsx` to receive `autoCreateTimelineLang` and trigger chapter generation using it.
5. **Summary auto-creation implementation**: Update `frontend/src/components/NotesPanel.jsx` to receive `autoCreateSummaryLang` and trigger summary generation using it.

## 3. Risks & Mitigations
- **Risk**: API Rate limit or quota exhaustion if a user opens many videos in rapid succession.
  - *Mitigation*: The auto-generation only triggers if a subtitle track exists, and if chapters/summary do not already exist on disk (cached) in the target language. Since it checks the cache first, returning a cached result is instantaneous and uses no API quota.
- **Risk**: Infinite loops of API generation requests on error.
  - *Mitigation*: We ensure that the auto-triggering logic only fires if `loadingChapters`/`summaryLoading` is false and `hasApiKey` is true. If a request fails, we store the error state so it doesn't try to auto-trigger again for the current lesson load.
- **Risk**: API key is not configured, resulting in repeated failed calls.
  - *Mitigation*: We perform a client-side check on the API key presence (`hasApiKey`) before firing the request.

## 4. Parallelism vs. Sequentiality
- Backend changes must be implemented first, followed by `App.jsx`, so that settings data structure matches.
- SettingsModal UI, VideoPlayer auto-timeline, and NotesPanel auto-summary are independent of each other and can be worked on concurrently or sequentially.

## 5. Verification Checkpoints
- **Checkpoint 1 (Settings Integration)**: Verify settings save successfully to `progress_db.json` with the new fields `autoCreateTimeline`, `autoCreateTimelineLang`, `autoCreateSummary`, and `autoCreateSummaryLang` when toggled and languages are selected.
- **Checkpoint 2 (Timeline Auto-creation)**: With `autoCreateTimeline: true`, load a lesson with subtitles but without chapters. Verify that chapters are generated automatically in the selected language.
- **Checkpoint 3 (Summary Auto-creation)**: With `autoCreateSummary: true`, load a lesson with subtitles but without a summary. Verify that summary is generated automatically in the selected language.
- **Checkpoint 4 (Disable check)**: With both disabled, verify that no auto-creation triggers, but manual generation still works.
- **Checkpoint 5 (API Key absent check)**: Clear the API key, enable both settings, load a lesson, and confirm no network requests to generate chapters/summaries are made.
