# Tasks: OpenAI & Custom Compatible AI Integration

- [x] Task 1: Backend Database Settings and Schema Migration
  - Acceptance: `readDb()` outputs default Settings structure containing `openaiApiKey`, `openaiModel`, and `openaiBaseUrl` when fields are missing. `POST /api/userdata/settings` saves and returns all three OpenAI setting fields.
  - Verify: Run node verification script or check DB read/write.
  - Files: `backend/server.js`

- [x] Task 2: Implement `callOpenAI` API Client & Dispatcher Integration
  - Acceptance: `getAiConfig` handles `provider === 'openai'`. `callOpenAI()` correctly formats system and user messages, sets `Authorization: Bearer <apiKey>` headers, sends requests to normalized `/v1/chat/completions` endpoint, and extracts completion content safely. `callAiProvider()` routes `openai` calls to `callOpenAI()`.
  - Verify: Test `callAiProvider` with OpenAI config and inspect request payload & response extraction.
  - Files: `backend/server.js`

- [x] Task 3: Refactor Settings Modal UI for OpenAI
  - Acceptance: Settings modal provider dropdown includes `<option value="openai">OpenAI / Compatible</option>`. Displays OpenAI API key, model name (default: `gpt-4o-mini`), and custom base URL (default: `https://api.openai.com`) inputs conditionally when `openai` is selected. Saves parameters back to backend database.
  - Verify: Render Settings modal in app, select OpenAI, modify fields, submit form, check saved values.
  - Files: `frontend/src/components/SettingsModal.jsx`

- [x] Task 4: Frontend Settings Loading & `hasApiKey` Resolution
  - Acceptance: `App.jsx` `DEFAULT_SETTINGS` includes OpenAI settings. `hasApiKey` evaluates `!!settings.openaiApiKey` when `settings.aiProvider === 'openai'`.
  - Verify: Verify UI feature availability when OpenAI key is set vs missing.
  - Files: `frontend/src/App.jsx`

- [x] Task 5: Dynamic Provider Name Labels in UI Components
  - Acceptance: `providerName` returns `"OpenAI"` when `aiProvider === 'openai'` in both `NotesPanel.jsx` and `ChapterSummaryModal.jsx`.
  - Verify: Inspect status text, empty state messages, and header labels when OpenAI is active.
  - Files: `frontend/src/components/NotesPanel.jsx`, `frontend/src/components/ChapterSummaryModal.jsx`

- [x] Task 6: End-to-End Verification Test Script
  - Acceptance: `backend/scratch/verify_openai.js` verifies DB settings save, URL normalization, request payload generation, response extraction, and provider dispatch.
  - Verify: Run `node backend/scratch/verify_openai.js` with 0 failures.
  - Files: `backend/scratch/verify_openai.js`
