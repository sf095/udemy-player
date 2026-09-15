# Implementation Plan: Gemini Model 'gemini-3.8-flash' Support

## 1. Major Components & Dependencies
- **Database & Settings**: `backend/progress_db.json` will store `geminiModel` under `settings`.
- **Express Backend**: `backend/server.js`:
  - `DEFAULT_SETTINGS.geminiModel = 'gemini-3.8-flash'`.
  - `getAiConfig(db, overrideApiKey)` extracts `model` for Gemini (default: `'gemini-3.8-flash'`).
  - `callGeminiWithFallback(apiKey, payloadBody, isV1Beta, targetModel)` prioritizes `targetModel` followed by `['gemini-2.5-flash', 'gemini-1.5-flash']` (deduplicated).
  - `callAiProvider(config, prompt, options)` passes `config.model` to `callGeminiWithFallback`.
  - `POST /api/userdata/settings` accepts and persists `geminiModel`.
- **Frontend App**: `frontend/src/App.jsx` updates `DEFAULT_SETTINGS` with `geminiModel: 'gemini-3.8-flash'`.
- **Settings Modal**: `frontend/src/components/SettingsModal.jsx`:
  - Adds `geminiModel` state and default.
  - Adds "Model Name" input field in the Gemini settings panel.
  - Submits trimmed `geminiModel` on save.
- **Verification Script**: `backend/scratch/verify_gemini_model.js` to test configuration resolution and model fallback array generation.

## 2. Implementation Order
1. **Backend Configuration & Dispatcher**:
   - Update `DEFAULT_SETTINGS` in `backend/server.js`.
   - Update `getAiConfig()` to return `model` for Gemini.
   - Update `callGeminiWithFallback()` to accept `targetModel`, construct deduplicated model list, and handle API version routing.
   - Update `callAiProvider()` to pass `config.model`.
   - Update `POST /api/userdata/settings` to store `geminiModel`.
2. **Backend Unit Verification Script**:
   - Create `backend/scratch/verify_gemini_model.js`.
   - Verify defaults, custom model resolution, and fallback ordering.
3. **Frontend Integration**:
   - Update `DEFAULT_SETTINGS` in `frontend/src/App.jsx`.
   - Update `DEFAULT_SETTINGS`, state, and UI input in `frontend/src/components/SettingsModal.jsx`.
4. **Build & Quality Gate Verification**:
   - Run `node backend/scratch/verify_gemini_model.js`.
   - Run `npm run build --prefix frontend`.

## 3. Risks & Mitigations
- **API Endpoint Compatibility (`v1` vs `v1beta`)**:
  - *Risk*: `gemini-3.8-flash` and other newer models may return 404 or unsupported errors on Google's `v1` endpoint.
  - *Mitigation*: For `v1beta`, use it for chat or if the model starts with `gemini-3` or `gemini-2.5`, or fallback to `v1beta` if `v1` fails.
- **Duplicate Entries in Fallback Array**:
  - *Risk*: If user sets `geminiModel` to `gemini-2.5-flash`, the fallback array would call `gemini-2.5-flash` twice.
  - *Mitigation*: Use `Array.from(new Set([targetModel, 'gemini-2.5-flash', 'gemini-1.5-flash'].filter(Boolean)))`.
- **Empty Model Input**:
  - *Risk*: User leaves model name blank in settings.
  - *Mitigation*: Fall back to `'gemini-3.8-flash'` if empty or whitespace.

## 4. Parallel vs. Sequential Execution
- Step 1 (Backend) and Step 2 (Verification script) are sequential.
- Step 3 (Frontend) follows Step 1 to match the backend settings schema.
- Step 4 (Build & verification) executes after Steps 1-3.

## 5. Verification Checkpoints
- **Checkpoint 1 (Backend & Fallback Logic)**: Run `node backend/scratch/verify_gemini_model.js` -> 100% assertions pass.
- **Checkpoint 2 (Frontend Build)**: Run `npm run build --prefix frontend` -> clean compilation, zero syntax/JSX errors.
