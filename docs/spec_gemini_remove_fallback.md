# Spec: Remove Gemini Fallback & Use Only User-Specified Model

## Objective
Update the Gemini AI provider integration across `udemy-player` so that all Gemini API calls use **strictly and exclusively** the model name configured by the user (defaulting to `gemini-2.5-flash` if unspecified).

Remove all fallback mechanisms (previously falling back through candidate model lists). If the user-specified model fails (due to quota, invalid model name, rate limits, or network errors), the API call should immediately fail and bubble up the exact error response, mirroring the behavior of the OpenAI and Anthropic integrations.

## Tech Stack
- **Backend**: Node.js, Express, native `fetch` (no Google Gemini SDK dependency).
- **Frontend**: React (Vite-based), Vanilla CSS.
- **Verification**: Node.js assert-based verification script (`backend/scratch/verify_gemini_model.js`).

## Commands
- **Run Backend Verification**: `node backend/scratch/verify_gemini_model.js`
- **Build Frontend**: `npm run build --prefix frontend`
- **Run Backend Dev**: `npm run backend` (or `npm run dev`)
- **Run Frontend Dev**: `npm run frontend`

## Project Structure
Files to touch:
1. `docs/spec_gemini_remove_fallback.md`: This specification document.
2. `backend/server.js`:
   - Replace `callGeminiWithFallback` with `callGemini(apiKey, payloadBody, isV1Beta = false, model = 'gemini-2.5-flash')`.
   - Remove `fallbackModels` array, deduplication logic, and retry loop across multiple models.
   - Execute a single HTTP request to Google Generative Language API using the resolved user model.
   - In `callAiProvider`, update call sites to use `callGemini(...)`.
3. `frontend/src/components/SettingsModal.jsx`:
   - Update the description/helper text under the "Model Name" input field to remove mention of automatic fallback (`(with automatic fallback to gemini-2.5-flash and gemini-1.5-flash)`).
4. `backend/scratch/verify_gemini_model.js`:
   - Update tests to verify that `callGemini` targets only the specified model and that no fallback candidate array is generated.

## Code Style
- Follow existing async/await and native `fetch` style in [backend/server.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/server.js).
- Clear logging indicating the single model being invoked.
- Example snippet:
```javascript
async function callGemini(apiKey, payloadBody, isV1Beta = false, model = 'gemini-3.8-flash') {
  const targetModel = (model || 'gemini-3.8-flash').trim();
  const apiVersion = (isV1Beta || !targetModel.startsWith('gemini-1.0')) ? 'v1beta' : 'v1';
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${targetModel}:generateContent?key=${apiKey}`;

  console.log(`Attempting Gemini API call with model ${targetModel} via ${apiVersion}...`);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadBody)
  });
  // Parse response, return text or throw exact error immediately without retrying alternative models
}
```

## Testing Strategy
1. **Automated Unit Verification**:
   - `backend/scratch/verify_gemini_model.js`:
     - Test that default model is `gemini-3.8-flash`.
     - Test that user-configured model is strictly used without fallback list generation.
     - Test that errors on the specified model are thrown directly without trying other models.
     - Test settings persistence and retrieval.
2. **Frontend Build Verification**:
   - Run `npm run build --prefix frontend` to verify that React/Vite builds without syntax or bundling errors.

## Boundaries
- **Always**:
  - Use the exact model name string entered by the user (trimmed).
  - Use `DEFAULT_SETTINGS.geminiModel` (`gemini-3.8-flash`) if the user input is empty or null.
  - Return the actual API error message if the model call fails so the user knows exactly what went wrong (e.g. Model not found, 404, or Quota exceeded).
- **Ask First**:
  - Changing the default model name from `gemini-3.8-flash` to something else.
- **Never**:
  - Silently fallback to `gemini-2.5-flash` or `gemini-1.5-flash` on failure.
  - Introduce new external npm dependencies.
  - Log or expose the user's `geminiApiKey`.

## Success Criteria
- [x] No fallback model list exists in `backend/server.js`.
- [x] `callGemini` performs only a single API call for the requested model.
- [x] If that API call fails, the error is immediately logged and thrown.
- [x] Frontend helper text in `SettingsModal.jsx` accurately reflects that no fallback occurs.
- [x] Verification script in `backend/scratch/verify_gemini_model.js` passes 100%.
- [x] Frontend compiles cleanly (`npm run build --prefix frontend`).

## Open Questions / Clarifications
1. **API Endpoint Versioning**:
   Google's `v1beta` endpoint supports all current Gemini models (`gemini-3.8-flash`, `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-*`, experimental models, etc.), whereas `v1` rejects newer models. We plan to use `v1beta` for all models (or if `targetModel` is not strictly `gemini-1.0`), ensuring user-entered custom model names won't be rejected with 404 on `v1`.
2. **Transient Network Retries**:
   Confirming that "remove fallback" applies to fallback across different model names. Should transient network retries (e.g. 503 retry on the same model) also be omitted? (Assuming yes, single attempt, consistent with OpenAI/Anthropic callers).
