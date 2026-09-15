# Tasks: Remove Gemini Fallback & Use Only User-Specified Model

- [x] Task 1: Update verification test script
  - Acceptance: `backend/scratch/verify_gemini_model.js` tests single model resolution and fails if fallback candidate lists or fallback retries are present.
  - Verify: Run `node backend/scratch/verify_gemini_model.js`.
  - Files: `backend/scratch/verify_gemini_model.js`

- [x] Task 2: Refactor backend Gemini calling logic to remove fallback
  - Acceptance: `backend/server.js` defines `callGemini(apiKey, payloadBody, isV1Beta = false, model = 'gemini-3.8-flash')`, removes `callGeminiWithFallback` and `fallbackModels`, calls only the specified model, and throws errors immediately.
  - Verify: Syntax check with `node -c backend/server.js` and verify all call sites in `callAiProvider`.
  - Files: `backend/server.js`

- [x] Task 3: Update frontend SettingsModal helper text
  - Acceptance: `frontend/src/components/SettingsModal.jsx` helper text no longer mentions fallback models.
  - Verify: Review component code and check for clean build with `npm run build --prefix frontend`.
  - Files: `frontend/src/components/SettingsModal.jsx`

- [x] Task 4: Run end-to-end verification and build
  - Acceptance: Verification tests in `backend/scratch/verify_gemini_model.js` pass 100%, frontend compiles cleanly with 0 errors.
  - Verify: `node backend/scratch/verify_gemini_model.js` and `npm run build --prefix frontend`.
  - Files: N/A (execution verification)
