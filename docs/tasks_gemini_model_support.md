# Tasks: Gemini Model 'gemini-3.8-flash' Support

- [x] Task 1: Backend Settings Schema & Defaults Migration
  - Acceptance: `DEFAULT_SETTINGS` in `backend/server.js` includes `geminiModel: 'gemini-3.8-flash'`. `POST /api/userdata/settings` accepts, sanitizes, and stores `geminiModel`. `readDb()` merges `geminiModel` default for existing configs.
  - Verify: Inspect `readDb()` behavior and settings persistence.
  - Files: `backend/server.js`

- [x] Task 2: Gemini API Caller & Dispatcher Integration
  - Acceptance: `getAiConfig(db, overrideApiKey)` extracts `model` for Gemini (default: `'gemini-3.8-flash'`). `callGeminiWithFallback(apiKey, payloadBody, isV1Beta, targetModel)` constructs deduplicated model list prioritizing `targetModel` before `['gemini-2.5-flash', 'gemini-1.5-flash']`. `callAiProvider()` routes `config.model` to `callGeminiWithFallback()`.
  - Verify: Unit test script verifies model resolution and candidate ordering.
  - Files: `backend/server.js`

- [x] Task 3: Automated Backend Verification Script
  - Acceptance: `backend/scratch/verify_gemini_model.js` tests DB settings persistence, `getAiConfig` model resolution with/without overrides, model candidate fallback array deduplication, and endpoint URL generation.
  - Verify: Run `node backend/scratch/verify_gemini_model.js` with code 0 and all tests passing.
  - Files: `backend/scratch/verify_gemini_model.js`

- [x] Task 4: Frontend Settings State & Modal UI
  - Acceptance: `frontend/src/App.jsx` defines `geminiModel: 'gemini-3.8-flash'` in `DEFAULT_SETTINGS`. `frontend/src/components/SettingsModal.jsx` manages `geminiModel` state, renders "Model Name" input field when `aiProvider === 'gemini'`, and saves trimmed `geminiModel`.
  - Verify: Run `npm run build --prefix frontend` cleanly.
  - Files: `frontend/src/App.jsx`, `frontend/src/components/SettingsModal.jsx`

- [x] Task 5: End-to-End Build & Validation Gate
  - Acceptance: All verification assertions pass, and the frontend builds cleanly without lint or bundling errors.
  - Verify: Run `node backend/scratch/verify_gemini_model.js && npm run build --prefix frontend`.
  - Files: `docs/tasks_gemini_model_support.md`
