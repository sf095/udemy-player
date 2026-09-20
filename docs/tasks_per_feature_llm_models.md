# Tasks: Per-Feature LLM Provider & Model Configuration

- [x] Task 1: Backend Settings Schema & Feature Resolution in `getAiConfig`
  - Acceptance: `DEFAULT_SETTINGS` includes default `featureModels` with keys `timeline`, `subtitleTranslation`, `lessonSummary`, `chapterSummary`, `lessonChat`, `chapterChat`. `getAiConfig(db, overrideApiKey, featureKey)` correctly resolves the effective provider and model for each feature, with proper fallback to the global provider and provider's default model when feature values are empty or 'inherit'.
  - Verify: Run test cases in `backend/scratch/verify_feature_models.js`.
  - Files: `backend/server.js`

- [x] Task 2: Route & AI Function Updates in Backend
  - Acceptance: All 6 backend AI entry points (`/api/translate-subtitle`, `/api/summarize-lesson`, `/api/summarize-section`, `/api/chat-chapter`, `/api/chat-lesson`, and `generateChaptersFromSubtitlesFile`) pass their respective `featureKey` to `getAiConfig`. The settings endpoint `POST /api/userdata/settings` accepts, validates, and persists `featureModels`.
  - Verify: Automated test in `backend/scratch/verify_feature_models.js` confirming correct resolution and DB persistence.
  - Files: `backend/server.js`, `backend/scratch/verify_feature_models.js`

- [x] Task 3: Update `App.jsx` Default Settings
  - Acceptance: `DEFAULT_SETTINGS` in `frontend/src/App.jsx` defines `featureModels` with initial empty overrides, preserving backward compatibility.
  - Verify: `npm run build --prefix frontend`.
  - Files: `frontend/src/App.jsx`

- [x] Task 4: Implement Per-Feature Model Assignment in `SettingsModal.jsx`
  - Acceptance: `SettingsModal.jsx` includes a clean "Per-Feature AI Model Configuration" section. For each of the 6 features, users can select a Provider (`Inherit Global`, `Google Gemini`, `Anthropic Claude`, `OpenAI / Compatible`) and enter a custom Model Name (with placeholder showing the active default model). Submitting the form persists `featureModels`.
  - Verify: Build frontend with `npm run build --prefix frontend`.
  - Files: `frontend/src/components/SettingsModal.jsx`

- [x] Task 5: End-to-End Build and Packaging Verification
  - Acceptance: Verification test script runs with 0 errors. Vite build succeeds. Electron packaging succeeds (`npm run package`).
  - Verify: Run `node backend/scratch/verify_feature_models.js` and `npm run package`.
  - Files: `backend/scratch/verify_feature_models.js`
