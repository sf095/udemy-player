# Spec: OpenAI Response Content Parsing & Chapter Summarization Fix

## Objective
Fix the error `'OpenAI API returned HTTP 200 but the response content could not be parsed'` when summarizing chapters or lessons using OpenAI (or OpenAI-compatible providers). 

Ensure robust extraction of assistant responses across different OpenAI model families (standard models, reasoning models like `gpt-5-mini`, `o1`, `o3-mini`, and compatible providers like DeepSeek/OpenRouter), provide actionable error messages when token limits or refusals occur, and allocate adequate completion tokens for chapter summarization.

## Tech Stack
- **Backend**: Node.js, Express, native `fetch` (zero additional dependencies)
- **Frontend**: React (Vite-based), Vanilla CSS
- **Testing**: Node.js assertion-based test runner (`backend/scratch/verify_openai.js`)

## Commands
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Test**: `node backend/scratch/verify_openai.js`

## Project Structure
- `docs/spec_openai_response_parsing_fix.md`: Specification document (this file).
- `backend/server.js`:
  - `callOpenAI`: Enhance response parser to handle string content, array content parts, refusal messages, and token exhaustion (`finish_reason: 'length'`).
  - `/api/summarize-section`: Pass `maxTokens: 16384` in `options` to allow sufficient budget for reasoning models synthesizing entire chapters.
  - `/api/summarize-lesson`: Pass `maxTokens: 8192` in `options` to prevent truncation.
- `backend/scratch/verify_openai.js`:
  - Add test suites covering content extraction edge cases (empty string + length finish_reason, refusals, array content blocks, compatible reasoning fields).

## Code Style
- Native `fetch` with `AbortController` and 120s timeout.
- Clean vanilla JavaScript matching existing `server.js` conventions.
- Explicit and descriptive error messages distinguishing network errors, HTTP errors, token exhaustion, safety refusals, and unparseable payloads.

## Testing Strategy
- Unit test runner: `node backend/scratch/verify_openai.js`
- Test cases:
  1. Standard response: `choices[0].message.content` string.
  2. Multi-part array response: `choices[0].message.content` array of text blocks.
  3. Token limit exhaustion: `finish_reason === 'length'` with empty/null content throws informative token-limit error.
  4. Model refusal: `choice.message.refusal` throws refusal explanation.
  5. Fallback properties (`content`, `text`, non-standard compatible fields).
  6. Verify `/api/summarize-section` and `/api/summarize-lesson` pass appropriate `maxTokens`.

## Boundaries
- **Always**:
  - Maintain backward compatibility with existing providers (Gemini, Anthropic, custom OpenAI endpoints).
  - Provide human-readable, actionable error messages instead of generic parsing failures.
  - Keep `backend/server.js` zero-dependency.
  - Run verification tests before completing tasks.
- **Ask First**:
  - Changing database schema or API request contracts.
  - Adding external dependencies.
- **Never**:
  - Silently return empty string as a valid summary.
  - Break existing Gemini or Anthropic handlers.

## Success Criteria
- [ ] Chapter summarization with reasoning models (e.g. `gpt-5-mini`) succeeds without throwing `'OpenAI API returned HTTP 200 but the response content could not be parsed'`.
- [ ] If a model runs out of tokens (`finish_reason: 'length'`) before generating output, an actionable error is returned explaining that the token limit was exceeded.
- [ ] If a model returns a refusal (`choice.message.refusal`), the refusal text is reported clearly.
- [ ] Multi-part array content payloads are parsed seamlessly.
- [ ] `/api/summarize-section` allocates `maxTokens: 16384` and `/api/summarize-lesson` allocates `maxTokens: 8192`.
- [ ] All verification tests in `backend/scratch/verify_openai.js` pass.

## Open Questions & Assumptions
- **Assumption 1**: The user is using OpenAI with model `gpt-5-mini` (or an o-series reasoning model), which uses completion tokens for internal reasoning before producing visible content.
- **Assumption 2**: Chapter summaries aggregate transcripts across multiple lessons, requiring a higher `max_completion_tokens` allocation (16,384 tokens) to prevent `finish_reason: 'length'` during reasoning.
- **Question for User**: Would you also like an option in Settings to configure reasoning effort (`low`, `medium`, `high`) for OpenAI reasoning models, or should `maxTokens: 16384` with automatic detection be sufficient?
