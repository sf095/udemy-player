# Implementation Plan: OpenAI `max_completion_tokens` Support

## 1. Major Components & Dependencies
- **Express Backend (`backend/server.js`)**:
  - `callOpenAI(apiKey, baseUrl, model, messages, maxTokens = 4096)`:
    - Primary payload will send `max_completion_tokens: maxTokens`.
    - If the request fails with HTTP 400 and the error indicates `max_completion_tokens` is unsupported or unrecognized (as can occur on older custom OpenAI-compatible proxies), retry once with legacy `max_tokens: maxTokens`.
- **Verification Script (`backend/scratch/verify_openai.js`)**:
  - Add unit tests verifying `max_completion_tokens` payload construction.
  - Add test verifying the error detection & fallback behavior for legacy endpoints.

## 2. Implementation Order
1. **Test-Driven Verification**:
   - Update `backend/scratch/verify_openai.js` with tests for:
     a) Primary payload using `max_completion_tokens`.
     b) Fallback to `max_tokens` when response indicates `max_completion_tokens` is unsupported.
2. **Backend Update**:
   - Update `callOpenAI` in `backend/server.js` to send `max_completion_tokens`.
   - Implement retry fallback when an endpoint returns 400 with an unsupported parameter error for `max_completion_tokens`.
3. **Verification**:
   - Run `node backend/scratch/verify_openai.js` to confirm all tests pass.

## 3. Risks & Mitigations
- **Risk**: Legacy local models or custom OpenAI-compatible gateways that do not support `max_completion_tokens`.
  - *Mitigation*: Inspect the 400 error body; if it mentions `max_completion_tokens` as unsupported or unrecognized, automatically retry once with `max_tokens`.
- **Risk**: Sending both `max_tokens` and `max_completion_tokens` together.
  - *Mitigation*: Strictly send only one parameter at a time.
- **Risk**: Accidentally changing Anthropic or Gemini payload formatting.
  - *Mitigation*: Touch only `callOpenAI` in `backend/server.js`.

## 4. Verification Checkpoints
- **Checkpoint 1**: Verify `backend/scratch/verify_openai.js` passes.
- **Checkpoint 2**: Confirm `callOpenAI` code does not mutate any Anthropic/Gemini logic.
