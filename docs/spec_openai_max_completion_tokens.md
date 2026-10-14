# Spec: OpenAI `max_completion_tokens` Support

## Objective
Support newer OpenAI models such as `gpt-5-nano`, `o1`, `o1-mini`, and `o3` in `udemy-player` by using `max_completion_tokens` instead of `max_tokens` in Chat Completions API requests, resolving HTTP 400 errors (`Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.`).

Ensure backward compatibility for legacy third-party OpenAI-compatible endpoints that might only recognize `max_tokens` by providing an automatic fallback.

## Tech Stack
- **Backend**: Node.js, Express, native `fetch` (zero additional dependencies).
- **Frontend**: React (Vite-based), Vanilla CSS.

## Commands
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Test**: `node backend/scratch/verify_openai.js`

## Project Structure
- `docs/spec_openai_max_completion_tokens.md`: Spec document (this file).
- `backend/server.js`:
  - `callOpenAI` updated to use `max_completion_tokens: maxTokens`.
  - Automatic fallback/retry with `max_tokens` if a custom endpoint returns HTTP 400 indicating `max_completion_tokens` is unsupported.
- `backend/scratch/verify_openai.js`:
  - Add test cases covering `max_completion_tokens` payload generation and legacy fallback behavior.

## Code Style
- Native `fetch` with `AbortController` and 120s timeout.
- Minimal and surgical changes matching existing codebase conventions.
- Never send both `max_tokens` and `max_completion_tokens` in the same payload (which causes OpenAI to throw HTTP 400).

## Testing Strategy
- Unit test in `backend/scratch/verify_openai.js`:
  1. Verify OpenAI request body generator uses `max_completion_tokens`.
  2. Verify legacy fallback logic triggers when `max_completion_tokens` is rejected.
- Run `node backend/scratch/verify_openai.js` to ensure zero regressions.

## Boundaries
- **Always**:
  - Use `max_completion_tokens` as primary parameter for OpenAI Chat Completions.
  - Fall back to `max_tokens` if a custom OpenAI-compatible server explicitly rejects `max_completion_tokens`.
  - Preserve `max_tokens` for Anthropic (`callAnthropic`), as Anthropic API mandates `max_tokens`.
  - Keep `server.js` dependency-free (standard `fetch`).
- **Ask First**:
  - Adding any new external packages or changing frontend API contracts.
- **Never**:
  - Send both `max_tokens` and `max_completion_tokens` together in the same request payload.
  - Alter Gemini or Anthropic payload formatting.

## Success Criteria
- [ ] Requests to OpenAI using `gpt-5-nano` (and other modern models) do not fail with `Unsupported parameter: 'max_tokens'`.
- [ ] Primary payload sends `max_completion_tokens: maxTokens`.
- [ ] Legacy custom endpoints that return 400 for `max_completion_tokens` fall back to `max_tokens`.
- [ ] Verification script `backend/scratch/verify_openai.js` passes.

## Open Questions
1. Should `max_completion_tokens` be the default for all OpenAI requests with a fallback to `max_tokens`?
   *(Recommendation: Yes. `max_completion_tokens` is the official standard for all current OpenAI models and modern compatible providers like Groq, vLLM, and OpenRouter. Automatic fallback on legacy servers ensures 100% backward compatibility without brittle model name regexes).*
