# Spec: Gemini Model 'gemini-3.8-flash' Support

## Objective
Support the Google Gemini model `'gemini-3.8-flash'` for all AI-powered features in `udemy-player` (subtitle translation, lesson summarization, chapter summarization, timeline generation, and AI chat).

Currently, Anthropic and OpenAI support custom model configuration via Settings (`anthropicModel`, `openaiModel`), while Gemini hardcodes `['gemini-2.5-flash', 'gemini-1.5-flash']` and lacks a model configuration field in `SettingsModal.jsx` and `DEFAULT_SETTINGS`.

This feature will:
1. Allow `gemini-3.8-flash` to be used as the primary Gemini model.
2. Provide configurable `geminiModel` support across backend and frontend (defaulting to `gemini-3.8-flash`), maintaining resilience by falling back to `gemini-2.5-flash` and `gemini-1.5-flash` if errors occur.

## Tech Stack
- **Backend**: Node.js, Express, native `fetch` (no external Google Gemini SDK, matching existing architecture).
- **Frontend**: React (Vite-based), Vanilla CSS, Lucide icons.

## Commands
- **Backend Dev**: `npm run backend` or `npm run dev` from root
- **Frontend Dev**: `npm run frontend`
- **Build Frontend**: `npm run build --prefix frontend`
- **Run Verification**: `node backend/scratch/verify_gemini_model.js`

## Project Structure
Files to touch:
1. `docs/spec_gemini_model_support.md`: This specification document.
2. `backend/server.js`:
   - Add `geminiModel: 'gemini-3.8-flash'` to `DEFAULT_SETTINGS`.
   - Update `getAiConfig(db, overrideApiKey)` to resolve `geminiModel` (default: `'gemini-3.8-flash'`).
   - Update `callGeminiWithFallback(apiKey, payloadBody, isV1Beta, targetModel)` to prioritize `targetModel` followed by fallback models `['gemini-2.5-flash', 'gemini-1.5-flash']`.
   - Update `callAiProvider` to pass configured `model` to `callGeminiWithFallback`.
   - Update `POST /api/userdata/settings` to accept and persist `geminiModel`.
3. `frontend/src/App.jsx`:
   - Add `geminiModel: 'gemini-3.8-flash'` to `DEFAULT_SETTINGS`.
4. `frontend/src/components/SettingsModal.jsx`:
   - Add `geminiModel: 'gemini-3.8-flash'` to `DEFAULT_SETTINGS` and local state.
   - Add a "Model Name" input field in the Gemini settings section (matching the UI pattern used by OpenAI and Anthropic).
   - Pass `geminiModel` in `handleSubmit`.
5. `backend/scratch/verify_gemini_model.js`:
   - Unit verification script to test setting persistence, model resolution, and fallback ordering.

## Code Style
- Follow existing patterns in `backend/server.js` and `SettingsModal.jsx`.
- Consistent styling for input fields:
```jsx
<div style={{ marginBottom: '16px' }}>
  <label htmlFor="gemini-model" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
    Model Name
  </label>
  <input
    id="gemini-model"
    type="text"
    placeholder="gemini-3.8-flash"
    value={geminiModel}
    onChange={(e) => setGeminiModel(e.target.value)}
    style={{
      width: '100%',
      background: 'var(--bg-input)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      padding: '10px 12px',
      color: 'var(--text-primary)',
      fontSize: '0.9rem',
      outline: 'none',
      transition: 'var(--transition-fast)'
    }}
  />
</div>
```

## Testing Strategy
1. Automated unit test script `backend/scratch/verify_gemini_model.js`:
   - Verify `DEFAULT_SETTINGS` includes `geminiModel: 'gemini-3.8-flash'`.
   - Verify `getAiConfig` extracts configured `geminiModel` or defaults to `'gemini-3.8-flash'`.
   - Verify fallback model array construction: `[targetModel, 'gemini-2.5-flash', 'gemini-1.5-flash']` deduplicating entries if `targetModel` is already in the fallback list.
   - Verify settings persistence in mock DB.
2. Build verification:
   - Run `npm run build --prefix frontend` to confirm no React/Vite compilation errors.

## Boundaries
- **Always**:
  - Maintain fallback capability to `gemini-2.5-flash` and `gemini-1.5-flash` to prevent service disruption if `gemini-3.8-flash` encounters transient rate limits or quota errors.
  - Sanitize and trim user model inputs.
  - Keep native `fetch` without adding SDK dependencies.
- **Ask First**:
  - Changing API endpoint versions (e.g., forcing all calls to `v1beta` vs keeping `v1`/`v1beta` dynamic).
- **Never**:
  - Break existing Gemini, OpenAI, or Anthropic settings for users.
  - Expose API keys in logs or responses.

## Success Criteria
- [x] `DEFAULT_SETTINGS` in backend and frontend defines `geminiModel: 'gemini-3.8-flash'`.
- [x] Users can view and customize the Gemini model in `SettingsModal.jsx`.
- [x] `POST /api/userdata/settings` saves and loads `geminiModel`.
- [x] Gemini API calls use `'gemini-3.8-flash'` as primary model, with graceful fallback to `gemini-2.5-flash` and `gemini-1.5-flash`.
- [x] Verification script in `backend/scratch/verify_gemini_model.js` passes 100%.
- [x] Frontend builds cleanly with `npm run build --prefix frontend`.

## Open Questions / Tradeoffs
1. **Configurable Model Field vs. Hardcoded Fallback**:
   - *Option A (Recommended)*: Add `geminiModel` setting in UI (default: `gemini-3.8-flash`) + fallback chain. This matches how Anthropic (`anthropicModel`) and OpenAI (`openaiModel`) work.
   - *Option B (Minimal)*: Only update the hardcoded array in `backend/server.js` `callGeminiWithFallback` from `['gemini-2.5-flash', 'gemini-1.5-flash']` to `['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash']`. No UI settings changes.
2. **API Version Compatibility**:
   - `gemini-3.8-flash` may require the `v1beta` endpoint in Google's Generative Language API. Currently non-chat calls use `v1` while chat calls use `v1beta`. Should all `gemini-3.8-flash` calls use `v1beta` or keep the current conditional logic (`v1beta` if chat or if `v1` returns 404)?
