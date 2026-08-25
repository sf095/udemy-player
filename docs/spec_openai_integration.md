# Spec: OpenAI & Compatible AI Provider Integration

## Objective
Add **OpenAI** and **OpenAI-compatible** API endpoints (such as OpenRouter, DeepSeek, Ollama, LM Studio, vLLM, Groq, Together AI, etc.) as a supported Active AI Provider option alongside Google Gemini and Anthropic Claude for subtitle translation, lesson summarization, chapter summarization, timeline generation, and AI chat in `udemy-player`.

Success looks like:
1. Users can choose "OpenAI / Compatible" from the "Active AI Provider" dropdown in Settings.
2. When selected, users can provide an OpenAI API Key, specify a model name (default: `gpt-4o-mini`), and set a Custom Base URL (default: `https://api.openai.com`).
3. Subtitle translation, summarization, timeline, and AI chat routes on the backend dynamically check the active provider and send OpenAI formatted requests (`/v1/chat/completions`) using native `fetch`.
4. UI components (`NotesPanel`, `ChapterSummaryModal`, `SettingsModal`, `App`) display dynamic labels ("OpenAI") and handle API key validation correctly for OpenAI.

## Tech Stack
- **Backend**: Node.js, Express, native `fetch` (zero additional NPM dependencies).
- **Frontend**: React (Vite-based), Vanilla CSS, Lucide icons.

## Commands
- **Dev**: `npm run dev` (run from root or backend/frontend workspaces)
- **Build**: `npm run build` (build frontend bundle)
- **Test / Verify**: Run `node backend/scratch/verify_openai.js` or backend API tests.

## Project Structure
Files to touch:
1. `docs/spec_openai_integration.md`: Spec document (this file).
2. `backend/server.js`:
   - Update `DEFAULT_SETTINGS` to include `openaiApiKey`, `openaiModel`, `openaiBaseUrl`.
   - Update `getAiConfig(db, overrideApiKey)` to resolve OpenAI config.
   - Add `callOpenAI` function to query OpenAI Chat Completions API.
   - Update `callAiProvider` dispatcher to handle `provider === 'openai'`.
   - Update settings endpoint (`POST /api/userdata/settings`) to accept and store OpenAI configuration.
3. `frontend/src/App.jsx`:
   - Update `DEFAULT_SETTINGS` and `hasApiKey` memoized calculation.
4. `frontend/src/components/SettingsModal.jsx`:
   - Update `DEFAULT_SETTINGS` and component state.
   - Add "OpenAI / Compatible" option to the provider select input.
   - Render conditional fields for OpenAI API Key, Model, and Base URL.
5. `frontend/src/components/NotesPanel.jsx` & `frontend/src/components/ChapterSummaryModal.jsx`:
   - Update `providerName` helper to return `"OpenAI"` when `aiProvider === 'openai'`.

## Code Style
- Native `fetch` with `AbortController` and 120s timeout.
- Authorization header: `Authorization: Bearer <apiKey>` (send if key is provided).
- Flexible base URL handling:
  - Default: `https://api.openai.com` -> appends `/v1/chat/completions`.
  - If user inputs `https://api.openai.com/v1` or custom URL ending with `/v1`, append `/chat/completions`.
  - Strips trailing slashes before appending endpoints.
- Response payload parsing:
  - Standard OpenAI: `responseData.choices?.[0]?.message?.content`
  - Fallback string checks for compatible servers.

## Testing Strategy
- Create a test script in `backend/scratch/verify_openai.js` to test:
  1. Setting storage via DB read/write.
  2. Mocking or making a request to OpenAI / OpenAI-compatible endpoint.
- Manual verification:
  1. Open Settings modal, select "OpenAI / Compatible", enter API Key and model.
  2. Save settings and confirm persisted values in `backend/progress_db.json`.
  3. Trigger translation/summarization/chat and verify successful response extraction.

## Boundaries
- **Always**:
  - Securely store API key in local `progress_db.json`.
  - Normalize base URLs (handling trailing slashes and optional `/v1` prefix).
  - Return clear, user-friendly error messages if the request fails or key is missing.
- **Ask First**:
  - Introducing third-party SDK dependencies like the `openai` NPM package.
- **Never**:
  - Expose API keys in console logs or git commits.
  - Break existing Gemini or Anthropic provider functionality.

## Success Criteria
- [ ] "OpenAI / Compatible" is selectable in Settings modal.
- [ ] OpenAI API Key, Model (default: `gpt-4o-mini`), and Base URL (default: `https://api.openai.com`) can be saved and loaded.
- [ ] Backend routes (`/api/translate-subtitle`, `/api/summarize-lesson`, `/api/generate-timeline`, `/api/chat`, `/api/summarize-chapter`) work when OpenAI is the active provider.
- [ ] Base URL normalizer supports standard `https://api.openai.com`, `https://api.openai.com/v1`, and custom local/proxy endpoints.
- [ ] `hasApiKey` and `providerName` in frontend components handle `openai` correctly.

## Open Questions
1. Is `gpt-4o-mini` acceptable as the default model name? (Recommended: Yes, fast and cost-effective).
2. Is `https://api.openai.com` acceptable as default base URL? (Recommended: Yes, with auto-normalization for `/v1`).
