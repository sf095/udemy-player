# Implementation Plan: OpenAI & Custom Compatible AI Integration

## 1. Major Components & Dependencies
- **Database (JSON)**: `backend/progress_db.json` will store updated settings (`aiProvider`, `openaiApiKey`, `openaiModel`, `openaiBaseUrl`).
- **Express Backend**: `backend/server.js` will handle API routes:
  - `getAiConfig(db, overrideApiKey)` to extract OpenAI configuration.
  - `callOpenAI(apiKey, baseUrl, model, payloadBody, maxTokens)` helper function to send requests via Node's native `fetch`.
  - `callAiProvider(config, prompt, options)` dispatcher to delegate requests when `config.provider === 'openai'`.
  - `/api/userdata/settings` to save OpenAI settings.
- **Frontend App**: `frontend/src/App.jsx` will load and manage state for OpenAI settings.
- **Settings Modal**: `frontend/src/components/SettingsModal.jsx` will provide inputs for configuring OpenAI alongside Gemini and Anthropic.
- **Notes & Summary Panels**: `frontend/src/components/NotesPanel.jsx` and `frontend/src/components/ChapterSummaryModal.jsx` will render dynamic labels ("OpenAI") based on the active provider.

## 2. Implementation Order
1. **Backend Schema & API Client**:
   - Update `DEFAULT_SETTINGS` in `backend/server.js` to include `openaiApiKey`, `openaiModel`, `openaiBaseUrl`.
   - Implement `callOpenAI()` in `backend/server.js` using native `fetch`.
   - Update `getAiConfig()` and `callAiProvider()` in `backend/server.js`.
   - Update `/api/userdata/settings` POST endpoint.
2. **Frontend Settings Modal UI**:
   - Add `openai` option to `SettingsModal.jsx`.
   - Render inputs for `openaiApiKey`, `openaiModel`, and `openaiBaseUrl` when `aiProvider === 'openai'`.
3. **Frontend Main Integration**:
   - Update `App.jsx` `DEFAULT_SETTINGS` and `hasApiKey` memoized calculation.
   - Update `NotesPanel.jsx` and `ChapterSummaryModal.jsx` provider name logic.
4. **Verification**:
   - Create verification script `backend/scratch/verify_openai.js` to verify settings read/write, URL formatting, request headers, payload structure, and fallback parsing.

## 3. Risks & Mitigations
- **Base URL Variations**: User input could be `https://api.openai.com`, `https://api.openai.com/v1`, `http://localhost:11434/v1`, etc.
  *Mitigation*: Normalize base URLs on the backend, strip trailing slashes, and append `/chat/completions` or `/v1/chat/completions` accordingly.
- **Payload Differences**: OpenAI uses `messages: [{ role: 'system' | 'user' | 'assistant', content }]` structure.
  *Mitigation*: Structure system instructions into system role message or prepend as needed.
- **Response Format Fallbacks**: Compatible proxy servers may return different JSON structures.
  *Mitigation*: Read text body once, check standard `choices[0].message.content`, and fallback to string content if non-standard.

## 4. Verification Checkpoints
- **Checkpoint 1 (Backend)**: Verify settings persistence and `callOpenAI` request formatting via `verify_openai.js`.
- **Checkpoint 2 (Frontend Modal)**: Open Settings Modal in browser, select OpenAI, save settings, verify `progress_db.json`.
- **Checkpoint 3 (Full End-to-End)**: Test lesson translation/summarization/chat using OpenAI provider.
