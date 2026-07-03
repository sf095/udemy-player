# Implementation Plan: Anthropic & Custom Compatible AI Integration

## 1. Major Components & Dependencies
- **Database (JSON)**: `backend/progress_db.json` will store updated settings (`aiProvider`, `geminiApiKey`, `anthropicApiKey`, `anthropicModel`, `anthropicBaseUrl`).
- **Express Backend**: `backend/server.js` will handle API routes:
  - `/api/userdata/settings` to save settings.
  - `/api/translate-subtitle`, `/api/summarize-lesson`, and `/api/chat-lesson` to inspect `aiProvider` and call the correct model.
- **Frontend App**: `frontend/src/App.jsx` will load and manage state for settings.
- **Settings Modal**: `frontend/src/components/SettingsModal.jsx` will provide inputs for configuring Anthropic alongside Gemini.
- **Notes & Chat Panel**: `frontend/src/components/NotesPanel.jsx` will render dynamic warnings/spinners based on the active provider.

## 2. Implementation Order
1. **Backend Database & API Setup**:
   - Update `readDb()` initialization in `backend/server.js` to support new settings fields with fallback values for backward compatibility.
   - Implement `callAnthropic()` API caller in `backend/server.js` using Node's native `fetch` module.
   - Update API routes in `backend/server.js` to read settings and delegate to the active provider (Gemini or Anthropic).
2. **Frontend Settings Modal UI**:
   - Refactor `frontend/src/components/SettingsModal.jsx` to show a provider selection dropdown and conditionally display configuration fields.
3. **Frontend Main Integration**:
   - Modify `frontend/src/App.jsx` to load new setting fields and compute `hasApiKey` dynamically based on the selected provider.
   - Pass `aiProvider` and `hasApiKey` props to `NotesPanel`.
4. **Frontend UI Polish**:
   - Update `frontend/src/components/NotesPanel.jsx` to show provider-specific or provider-agnostic instructions/alerts.

## 3. Risks & Mitigations
- **API Payloads**: Difference between Gemini (`contents` array with `parts`) and Anthropic (`messages` array and `system` parameter) could cause malformed requests.
  *Mitigation*: Implement clean translation interfaces that isolate provider-specific payload formatting.
- **Backward Compatibility**: Existing database files `progress_db.json` don't have new fields.
  *Mitigation*: Default to `aiProvider: 'gemini'` and fill missing fields with defaults on read.
- **Custom URL Endpoints**: Users typing wrong URLs (e.g. trailing slashes, missing paths).
  *Mitigation*: Normalize base URLs on the backend, strip trailing slashes, and append `/v1/messages`.

## 4. Verification Checkpoints
- **Checkpoint 1 (Backend)**: Verify that mock requests to `/api/translate-subtitle`, `/api/summarize-lesson`, and `/api/chat-lesson` generate correct payloads and target the proper endpoint based on database setting modification.
- **Checkpoint 2 (Settings Modal)**: Open Settings Modal in the browser, change provider, fill in credentials, save, and verify `progress_db.json` is updated correctly.
- **Checkpoint 3 (Complete Flow)**: Verify translation, summarization, and chat using both Gemini (existing) and Anthropic (new).
