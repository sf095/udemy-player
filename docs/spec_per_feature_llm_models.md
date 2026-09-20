# Spec: Per-Feature LLM Provider and Model Configuration

## Objective
Currently, `udemy-player` uses a single global AI Provider (`aiProvider`: Gemini, Anthropic, or OpenAI) and a single global model per provider (`geminiModel`, `anthropicModel`, `openaiModel`) across all AI capabilities.

The objective is to allow users to assign a specific AI Provider and LLM Model to each individual feature that uses AI, with an intuitive "Use Global Provider" option as default. For instance, a user can configure:
- Video Timeline Chapters using Gemini (`gemini-2.5-flash`) for speed & cost efficiency.
- Lesson AI Chat using Anthropic Claude (`claude-3-5-sonnet-latest`) for advanced reasoning.
- Subtitle Translation using OpenAI (`gpt-4o-mini`) or a custom compatible endpoint.

### The 6 AI Features in udemy-player:
1. **Timeline Generation** (`timeline`): Generates video chapter markers and timestamps from subtitles (`/api/generate-timeline`).
2. **Subtitle Translation** (`subtitleTranslation`): Translates subtitle cues chunk-by-chunk into target languages (`/api/translate-subtitle`).
3. **Lesson Summary** (`lessonSummary`): Summarizes a single video lesson into structured Markdown (`/api/summarize-lesson`).
4. **Chapter / Section Summary** (`chapterSummary`): Aggregates all lesson subtitles in a section to produce an executive overview and detailed study guide (`/api/summarize-section`).
5. **Lesson AI Chat** (`lessonChat`): Interactive Q&A with the student based on the current lesson transcript (`/api/chat-lesson`).
6. **Chapter AI Chat** (`chapterChat`): Interactive Q&A with the student synthesized across all lessons in the current chapter (`/api/chat-chapter`).

---

## Tech Stack
- **Backend**: Node.js, Express, native `fetch` (no external AI SDKs).
- **Frontend**: React 19 (Vite-based), Vanilla CSS variables, Lucide icons.
- **Persistence**: Local JSON database (`progress_db.json`).

---

## Commands
- **Dev**: `npm run dev`
- **Frontend Build**: `npm run build --prefix frontend`
- **Package**: `npm run package`
- **Verification Script**: `node backend/scratch/verify_feature_models.js`

---

## Project Structure
Files to modify or create:
1. `docs/spec_per_feature_llm_models.md`: Specification document (this file).
2. `docs/plan_per_feature_llm_models.md`: Implementation plan.
3. `docs/tasks_per_feature_llm_models.md`: Implementation task breakdown.
4. `backend/server.js`:
   - Extend `DEFAULT_SETTINGS` with `featureModels` dictionary.
   - Update `getAiConfig(db, overrideApiKey, featureKey)`:
     - If `featureKey` is supplied and `db.settings?.featureModels?.[featureKey]` has a custom `provider` (e.g. `'gemini'`, `'anthropic'`, `'openai'`), use that provider and its associated credentials (`apiKey`, `baseUrl`). If `provider` is empty or `'inherit'`, fallback to the global `aiProvider`.
     - If `featureKey` has a non-empty `model` string, use it. Otherwise, fallback to the resolved provider's default model (`geminiModel`, `anthropicModel`, or `openaiModel`).
   - Pass `featureKey` in all 6 backend endpoints / functions:
     - `/api/translate-subtitle` -> `subtitleTranslation`
     - `/api/summarize-lesson` -> `lessonSummary`
     - `/api/summarize-section` -> `chapterSummary`
     - `/api/chat-chapter` -> `chapterChat`
     - `/api/chat-lesson` -> `lessonChat`
     - `generateChaptersFromSubtitlesFile` -> `timeline`
   - Update `POST /api/userdata/settings` to accept, sanitize, and persist `featureModels`.
5. `frontend/src/App.jsx`:
   - Update `DEFAULT_SETTINGS` to include `featureModels`.
6. `frontend/src/components/SettingsModal.jsx`:
   - Update `DEFAULT_SETTINGS` and component state.
   - Add a collapsible or dedicated **"Per-Feature AI Model Configuration"** card/section in the Settings modal.
   - For each of the 6 features, render:
     - A provider selector: `Inherit Global (Current: <ProviderName>)`, `Google Gemini`, `Anthropic Claude`, `OpenAI / Compatible`.
     - A model input field with placeholder displaying the resolved default model for the selected provider.
   - Collect and send `featureModels` in `handleSubmit`.
7. `backend/scratch/verify_feature_models.js`:
   - Test suite verifying:
     - Global fallback when `featureModels` is empty.
     - Model override resolution when provider is inherited.
     - Provider and model override resolution.
     - Endpoint parameter handling.
     - Settings persistence via API.

---

## Data Model & Resolution Rules
### Schema in `progress_db.json` (`settings`):
```json
{
  "settings": {
    "aiProvider": "gemini",
    "geminiApiKey": "...",
    "geminiModel": "gemini-2.5-flash",
    "anthropicApiKey": "...",
    "anthropicModel": "claude-3-5-sonnet-latest",
    "anthropicBaseUrl": "https://api.anthropic.com",
    "openaiApiKey": "...",
    "openaiModel": "gpt-4o-mini",
    "openaiBaseUrl": "https://api.openai.com",
    "featureModels": {
      "timeline": { "provider": "", "model": "" },
      "subtitleTranslation": { "provider": "", "model": "" },
      "lessonSummary": { "provider": "", "model": "" },
      "chapterSummary": { "provider": "", "model": "" },
      "lessonChat": { "provider": "anthropic", "model": "claude-3-5-sonnet-latest" },
      "chapterChat": { "provider": "anthropic", "model": "claude-3-5-sonnet-latest" }
    }
  }
}
```

### Resolution Algorithm (`getAiConfig`):
```javascript
function getAiConfig(db, overrideApiKey, featureKey) {
  const globalProvider = db.settings?.aiProvider || 'gemini';
  const featureEntry = (featureKey && db.settings?.featureModels?.[featureKey]) || {};
  
  // 1. Resolve effective provider
  const effectiveProvider = (featureEntry.provider && featureEntry.provider !== 'inherit')
    ? featureEntry.provider
    : globalProvider;

  const providerName = effectiveProvider === 'anthropic'
    ? 'Anthropic'
    : effectiveProvider === 'openai'
    ? 'OpenAI'
    : 'Gemini';

  // 2. Resolve API key & baseUrl based on effectiveProvider
  let apiKey = overrideApiKey || '';
  let defaultModel = '';
  let baseUrl = null;

  if (effectiveProvider === 'anthropic') {
    if (!apiKey) apiKey = db.settings?.anthropicApiKey || '';
    defaultModel = db.settings?.anthropicModel || 'claude-3-5-sonnet-latest';
    baseUrl = db.settings?.anthropicBaseUrl || 'https://api.anthropic.com';
  } else if (effectiveProvider === 'openai') {
    if (!apiKey) apiKey = db.settings?.openaiApiKey || '';
    defaultModel = db.settings?.openaiModel || 'gpt-4o-mini';
    baseUrl = db.settings?.openaiBaseUrl || 'https://api.openai.com';
  } else {
    if (!apiKey) apiKey = db.settings?.geminiApiKey || '';
    defaultModel = db.settings?.geminiModel || 'gemini-2.5-flash';
    baseUrl = null;
  }

  // 3. Resolve effective model (feature override > provider default)
  const model = (featureEntry.model && featureEntry.model.trim())
    ? featureEntry.model.trim()
    : defaultModel;

  return { provider: effectiveProvider, providerName, apiKey, model, baseUrl };
}
```

---

## Testing Strategy
1. **Automated Verification Script** (`backend/scratch/verify_feature_models.js`):
   - Check `getAiConfig` with no `featureKey` -> returns global provider and global model.
   - Check `getAiConfig` with `timeline` (empty override) -> returns global provider and global model.
   - Check `getAiConfig` with `timeline` (model override only) -> returns global provider and overridden model.
   - Check `getAiConfig` with `lessonChat` (provider override to `anthropic` and model override) -> returns Anthropic provider, Anthropic API key/URL, and custom model.
   - Check `POST /api/userdata/settings` -> saves and loads `featureModels` correctly.
2. **Frontend Build**:
   - Run `npm run build --prefix frontend` to ensure zero compilation or JSX errors.
3. **Packaging**:
   - Run `npm run package` to verify electron packaging builds cleanly.

---

## Boundaries
- **Always**:
  - Keep 100% backward compatibility for databases without `featureModels`.
  - Fallback cleanly to global provider/model when feature-specific values are empty, whitespace, or set to 'inherit'.
  - Provide clear UI indicators of what model/provider is currently active or inherited.
  - Return clear, helpful error messages if a feature-configured provider is missing its required API key.
- **Ask First**:
  - Adding external dependencies.
- **Never**:
  - Break existing user workflows where one provider/model is used for everything.
  - Require users to re-enter API keys per feature.

---

## Success Criteria
- [ ] Users can configure both Provider (Inherit Global / Gemini / OpenAI / Anthropic) and Model Name for each of the 6 AI features:
  1. Timeline Generation (`timeline`)
  2. Subtitle Translation (`subtitleTranslation`)
  3. Lesson Summary (`lessonSummary`)
  4. Chapter Summary (`chapterSummary`)
  5. Lesson Chat (`lessonChat`)
  6. Chapter Chat (`chapterChat`)
- [ ] Leaving a feature's model blank falls back to the default model of the selected (or inherited) provider.
- [ ] Backend routes (`/api/translate-subtitle`, `/api/summarize-lesson`, `/api/summarize-section`, `/api/chat-lesson`, `/api/chat-chapter`, `/api/generate-timeline`) correctly pass their `featureKey` and use the resolved provider + model.
- [ ] Settings modal allows editing and saving these assignments cleanly in `progress_db.json`.
- [ ] Automated verification script passes and packaging succeeds.
