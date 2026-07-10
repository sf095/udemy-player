# Tasks: Automatically Create Timeline and Summary Settings

Here is the task breakdown to implement the toggles for automatically creating timeline chapters and lesson summaries.

- [x] **Task 1: Update Backend Settings Defaults & API**
  - **Acceptance**: `DEFAULT_SETTINGS` contains default values for `autoCreateTimelineLang` ('English') and `autoCreateSummaryLang` ('en'). POST handler persists these new fields.
  - **Verify**: Inspect `progress_db.json` after saving settings.
  - **Files**: `backend/server.js`

- [x] **Task 2: Update Frontend App Settings Defaults & Props Passing**
  - **Acceptance**: `DEFAULT_SETTINGS` in `App.jsx` matches backend. Propagates `autoCreateTimelineLang` to `<VideoPlayer />` and `autoCreateSummaryLang` to `<NotesPanel />`.
  - **Verify**: Confirm props are correctly passed in JSX.
  - **Files**: `frontend/src/App.jsx`

- [x] **Task 3: Add Checkboxes and Language Dropdowns to Settings Modal UI**
  - **Acceptance**: UI includes language selection dropdowns next to/below each toggle, populated with the supported languages. Dropdowns are disabled if the corresponding toggle is disabled. Dropdowns save their values correctly.
  - **Verify**: Toggle settings, select language, click Save, inspect `progress_db.json`.
  - **Files**: `frontend/src/components/SettingsModal.jsx`

- [x] **Task 4: Implement Auto-creation of Chapters with selected language in VideoPlayer**
  - **Acceptance**: Uses the configured `autoCreateTimelineLang` for background chapter generation.
  - **Verify**: Load a lesson without chapters, confirm chapters generated in target language.
  - **Files**: `frontend/src/components/VideoPlayer.jsx`

- [x] **Task 5: Implement Auto-creation of Summary with selected language in NotesPanel**
  - **Acceptance**: Uses the configured `autoCreateSummaryLang` for background summary generation.
  - **Verify**: Load a lesson without a summary, confirm summary generated in target language.
  - **Files**: `frontend/src/components/NotesPanel.jsx`
