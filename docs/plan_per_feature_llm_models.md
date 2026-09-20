# Implementation Plan: Per-Feature LLM Provider & Model Configuration

## 1. Major Components & Dependencies
- **Database (JSON)**: `backend/progress_db.json` stores settings including a new `featureModels` dictionary:
  - Keys: `timeline`, `subtitleTranslation`, `lessonSummary`, `chapterSummary`, `lessonChat`, `chapterChat`
  - Values: `{ provider: '' | 'gemini' | 'anthropic' | 'openai', model: string }`
- **Express Backend (`backend/server.js`)**:
  - `DEFAULT_SETTINGS` updated with default `featureModels` mapping.
  - `getAiConfig(db, overrideApiKey, featureKey)`:
    - Extracts `featureModels[featureKey]` if provided.
    - Resolves effective provider (`inherit` / `""` defaults to global `aiProvider`).
    - Resolves effective API key, default model, and base URL for that provider.
    - Resolves effective model (custom model if provided and non-empty, otherwise provider's default model).
  - Updates to all 6 AI invocation points:
    1. `/api/translate-subtitle`: calls `getAiConfig(db, apiKey, 'subtitleTranslation')`.
    2. `/api/summarize-lesson`: calls `getAiConfig(db, null, 'lessonSummary')`.
    3. `/api/summarize-section`: calls `getAiConfig(db, null, 'chapterSummary')`.
    4. `/api/chat-chapter`: calls `getAiConfig(db, null, 'chapterChat')`.
    5. `/api/chat-lesson`: calls `getAiConfig(db, null, 'lessonChat')`.
    6. `generateChaptersFromSubtitlesFile`: calls `getAiConfig(db, null, 'timeline')`.
  - `/api/userdata/settings`: Accepts `featureModels`, sanitizes strings/objects, and persists to DB.
- **Frontend App (`frontend/src/App.jsx`)**:
  - Updates `DEFAULT_SETTINGS` with `featureModels`.
- **Settings Modal (`frontend/src/components/SettingsModal.jsx`)**:
  - Updates `DEFAULT_SETTINGS` with `featureModels`.
  - State management for `featureModels`.
  - UI section **"Feature Model Assignment"** (with expandable/collapsible or cleanly grouped cards):
    - Table / list of all 6 features:
      - Feature Name & Description
      - Provider dropdown: `Inherit Global (<GlobalProvider>)`, `Google Gemini`, `Anthropic Claude`, `OpenAI / Compatible`
      - Model Name input with dynamic placeholder reflecting the effective default model for the chosen provider.
  - Submits `featureModels` to `/api/userdata/settings`.

---

## 2. Implementation Order
1. **Backend Integration**:
   - Update `DEFAULT_SETTINGS` in `backend/server.js`.
   - Update `getAiConfig` to accept `featureKey` and resolve per-feature provider and model.
   - Update all 6 endpoint call sites to pass their `featureKey`.
   - Update `POST /api/userdata/settings` to sanitize and save `featureModels`.
2. **Backend Verification Script**:
   - Create `backend/scratch/verify_feature_models.js` to systematically verify:
     - Fallback resolution when `featureModels` is empty or unset.
     - Model override resolution when provider is inherited.
     - Cross-provider override (e.g. chat uses Anthropic while global is Gemini).
     - Save and load round-trip through `/api/userdata/settings`.
3. **Frontend Integration**:
   - Update `DEFAULT_SETTINGS` in `frontend/src/App.jsx`.
   - Update `SettingsModal.jsx`:
     - Add `featureModels` state initialization and change handlers.
     - Render the **Feature Model Assignment** section with responsive styling, provider selects, and model inputs.
     - Hook into form submission.
4. **Build & Package Verification**:
   - Run `npm run build --prefix frontend`.
   - Run `npm run package`.

---

## 3. Risks & Mitigations
- **Risk: Missing API Key for Overridden Provider**:
  If a user sets a feature to use Anthropic but has only entered a Gemini API Key, the request would fail.
  *Mitigation*: `getAiConfig` clearly returns `${config.providerName} API Key is missing. Please configure it in Settings.` which endpoints already catch and return as HTTP 400 with a clear error message. In the UI, show a visual warning or hint if a chosen feature provider doesn't have an API key entered yet.
- **Risk: Backward Compatibility with Existing `progress_db.json`**:
  Existing databases do not have `featureModels`.
  *Mitigation*: Default to `{}` if `featureModels` is missing. Every feature checks `featureModels?.[featureKey]`, and gracefully falls back to the global provider and provider's default model if missing, blank, or `'inherit'`.
- **Risk: Cluttered Settings Modal UI**:
  Adding 6 features with dropdowns and inputs could make the modal very long.
  *Mitigation*: Group them logically into a neat sub-section or collapsible accordion with compact input rows (Feature label, Provider select, Model input), maintaining clean alignment and consistent styling.

---

## 4. Verification Checkpoints
- **Checkpoint 1 (Automated Backend)**: `node backend/scratch/verify_feature_models.js` passes 100% of test cases.
- **Checkpoint 2 (Frontend Compilation)**: `npm run build --prefix frontend` succeeds without any syntax or bundling errors.
- **Checkpoint 3 (Packaging)**: `npm run package` completes with exit code 0.
