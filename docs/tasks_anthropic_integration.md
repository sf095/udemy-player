# Tasks: Anthropic & Custom Compatible AI Integration

- [x] Task 1: Database Settings and Schema Migration
  - Acceptance: `readDb` outputs default Settings structure containing `aiProvider`, `geminiApiKey`, `anthropicApiKey`, `anthropicModel`, and `anthropicBaseUrl` when fields are missing or not set.
  - Verify: Run/examine `readDb` or start server and verify database updates.
  - Files: `backend/server.js`

- [x] Task 2: Implement Anthropic API Client and Route Integrations
  - Acceptance: `/api/translate-subtitle`, `/api/summarize-lesson`, and `/api/chat-lesson` route handler calls `callAnthropic()` with the correct payload structure and headers when `aiProvider === 'anthropic'`.
  - Verify: Perform a mock API request or print payloads on the console to check that Anthropic's Headers (`x-api-key`, `anthropic-version`) and Request structure are generated properly.
  - Files: `backend/server.js`

- [x] Task 3: Refactor Settings Modal UI
  - Acceptance: Settings modal includes a Provider Selection dropdown. Conditionally displays Gemini key input OR Anthropic inputs (API Key, Model Name, and Custom Base URL) depending on selection. Saves all parameters correctly back to the database.
  - Verify: Open Settings modal, toggle dropdown, fill in mock values, save, and check that `progress_db.json` has the correct settings values.
  - Files: `frontend/src/components/SettingsModal.jsx`

- [x] Task 4: Frontend settings loading and props propagation
  - Acceptance: `App.jsx` correctly loads the settings, computes `hasApiKey` dynamically depending on the selected provider, and passes `aiProvider` and `hasApiKey` to `NotesPanel`.
  - Verify: Verify that AI feature access behaves correctly based on setting status.
  - Files: `frontend/src/App.jsx`

- [x] Task 5: Dynamic Provider Instructions in Notes Panel
  - Acceptance: Warnings like "Gemini API Key Missing" and "Gemini is compiling your offline summary" dynamically use the active provider's name (e.g. "Anthropic" or "Gemini") based on `aiProvider` state.
  - Verify: Switch provider in Settings, verify that Notes panel text updates correctly.
  - Files: `frontend/src/components/NotesPanel.jsx`

- [x] Task 6: Resiliency Fix (Unusable Body / Double Read)
  - Acceptance: Resolved the issue where calling `response.text()` after `response.json()` throws a "Body has already been read" error if the response object structure is parsed but fails to match the expected format.
  - Verify: Read response body as text exactly once, then try parsing as JSON.
  - Files: `backend/server.js`
