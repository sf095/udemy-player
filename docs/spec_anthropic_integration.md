# Spec: Anthropic & Custom Compatible AI Provider Integration

## Objective
Support Anthropic Claude and compatible API endpoints (such as OpenRouter, local/proxy LLM servers) as an alternative to Google Gemini for subtitle translation, lesson summarization, and AI chat. Success looks like:
1. Users can choose between "Google Gemini" and "Anthropic Claude / Compatible" in settings.
2. If Anthropic is selected, they can provide an Anthropic API Key, specify a model name (default: `claude-3-5-sonnet-latest`), and set an optional Custom Base URL (default: `https://api.anthropic.com`).
3. Subtitle translation, summarization, and chat routes on the backend dynamically check the active provider and send the requests to the correct API endpoint with the proper request payload and headers.
4. UI alerts, labels, and placeholders dynamically adapt to the selected provider or use provider-agnostic terminology.

## Tech Stack
- **Backend**: Node.js, Express (fetching Anthropic API using native `fetch` client to minimize external dependencies).
- **Frontend**: React (Vite-based), Vanilla CSS, Lucide icons.

## Commands
- Run backend & frontend: `npm run dev`
- Build frontend: `npm run build`
- Run linting (if any): `npm run lint`

## Project Structure
We will modify the following files:
1. `backend/server.js`:
   - Extend `db.settings` structure to include `aiProvider`, `anthropicApiKey`, `anthropicModel`, and `anthropicBaseUrl`.
   - Update settings save endpoint (`/api/userdata/settings`) to accept and store the new configurations.
   - Implement `callAnthropicWithFallback` (or standard `callAnthropic`) to query the Anthropic Messages API.
   - Update translation, summarization, and chat API routes to inspect the active provider, query the appropriate provider API, and format responses correctly.
2. `frontend/src/App.jsx`:
   - Update state initializing/loading to support new settings structure.
   - Adjust `hasApiKey` logic to check for the active provider's API key.
3. `frontend/src/components/SettingsModal.jsx`:
   - Replace the single Gemini API key field with:
     - Provider Selection dropdown (Gemini vs Anthropic/Compatible).
     - Provider-specific settings inputs (conditional rendering).
4. `frontend/src/components/NotesPanel.jsx`:
   - Make status messages (like API key missing warnings or spinner states) generic or dynamic depending on which provider is configured.

## Code Style
- Keep existing code style: Clean JavaScript ES modules on frontend, CommonJS/ES modules on backend.
- Inline styles or scoped variables in React components.
- Do not add new external NPM packages for Anthropic unless absolutely necessary; use standard `fetch`.

## Testing Strategy
- **Manual Verification**:
  1. Test saving settings for both Gemini and Anthropic.
  2. Toggle provider to Gemini, verify translation/summarization/chat route works using Gemini.
  3. Toggle provider to Anthropic, enter an Anthropic key (or mock it/simulate in local sandbox/inspect request payload), verify request formats and response parsers.
  4. Test custom base URL configuration by setting a dummy local endpoint and inspecting outgoing requests.

## Boundaries
- **Always**:
  - Store keys locally inside the user database (`progress_db.json`).
  - Fall back to standard Gemini settings if `aiProvider` is undefined (ensure backward compatibility).
  - Use the configured custom model name and base URL.
- **Ask First**:
  - Adding third-party NPM libraries for Anthropic.
- **Never**:
  - Send API keys to external loggers or hardcode them in any code files.
  - Fail or crash if the custom URL is misconfigured (catch and return clear client-facing error message).

## Success Criteria
- [ ] Settings modal has an AI Provider selection dropdown.
- [ ] If Gemini is selected, Gemini key is shown and used.
- [ ] If Anthropic is selected, Anthropic API Key, Model, and Custom Base URL fields are shown and saved properly in `progress_db.json`.
- [ ] Subtitle translation, lesson summarization, and AI chat use the selected AI provider.
- [ ] The backend formats requests according to Anthropic's Messages API (including headers: `x-api-key`, `anthropic-version: 2023-06-01`, and payload format: `system`, `messages`, `model`, `max_tokens`).
- [ ] Notes panel displays dynamic helper messages (e.g. "AI API Key Missing") based on the current configuration.

## Open Questions
None. The design parameters have been resolved via interactive query:
- Dropdown selector for active provider.
- Support custom base URL.
- Default model name is customizable in Settings input.
