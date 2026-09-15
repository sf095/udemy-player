# Plan: Remove Gemini Fallback & Use Only User-Specified Model

## 1. Components and Architecture
- **Backend ([backend/server.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/server.js))**:
  - Replace `callGeminiWithFallback` with `callGemini(apiKey, payloadBody, isV1Beta = false, model = 'gemini-3.8-flash')`.
  - Perform a single HTTP POST request to `https://generativelanguage.googleapis.com/${apiVersion}/models/${targetModel}:generateContent?key=${apiKey}`.
  - If the call fails (non-200 or fetch error), throw the error immediately without trying other models.
  - Update `callAiProvider` call sites (chat and non-chat) from `callGeminiWithFallback(...)` to `callGemini(...)`.
- **Frontend UI ([frontend/src/components/SettingsModal.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/SettingsModal.jsx))**:
  - Update description under "Model Name" to remove fallback references.
- **Verification ([backend/scratch/verify_gemini_model.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/scratch/verify_gemini_model.js))**:
  - Update unit assertions to verify single-model resolution and error throwing without fallback arrays.

## 2. Implementation Order
1. **Verification Test Update**: Update `backend/scratch/verify_gemini_model.js` to reflect strict single-model logic and lack of fallback.
2. **Backend Server Update**: Refactor `backend/server.js` to replace `callGeminiWithFallback` with single-call `callGemini`.
3. **Frontend Settings Update**: Update helper text in `frontend/src/components/SettingsModal.jsx`.
4. **Verification & Build**: Execute `node backend/scratch/verify_gemini_model.js` and `npm run build --prefix frontend`.

## 3. Risks & Mitigations
- **Risk**: User enters a model name that doesn't exist or has typo.
  - *Mitigation*: The API error is explicitly surfaced (e.g. `Gemini API error: Not Found (...)`), giving the user immediate clarity on why it failed rather than silently switching to a different model.
- **Risk**: Older 1.0/1.5 models vs newer 2.x/3.x models endpoint version mismatch.
  - *Mitigation*: Retain `v1beta` endpoint resolution which supports all models.

## 4. Checkpoints
- [ ] Verification script passes.
- [ ] Frontend build succeeds.
- [ ] Server syntax check passes.
