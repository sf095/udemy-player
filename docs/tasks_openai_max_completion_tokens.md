# Tasks: OpenAI `max_completion_tokens` Support

- [x] Task 1: Update Verification Tests in `backend/scratch/verify_openai.js`
  - Acceptance: Test cases added verifying that OpenAI payloads use `max_completion_tokens: maxTokens` by default, and that fallback logic detects when `max_completion_tokens` is unsupported and retries with `max_tokens`.
  - Verify: Run `node backend/scratch/verify_openai.js`
  - Files: `backend/scratch/verify_openai.js`

- [x] Task 2: Update `callOpenAI` in `backend/server.js`
  - Acceptance: `callOpenAI` uses `max_completion_tokens` in its request body. If the response returns HTTP 400 with an unsupported parameter error referencing `max_completion_tokens`, it automatically retries with `max_tokens`.
  - Verify: Run `node backend/scratch/verify_openai.js` and verify all tests pass without errors.
  - Files: `backend/server.js`

- [x] Task 3: Regression Testing
  - Acceptance: All existing tests in `backend/scratch/` (`verify_openai.js`, `verify_feature_models.js`, etc.) pass with 0 failures.
  - Verify: Run test scripts with `node`.
  - Files: `backend/scratch/verify_openai.js`, `backend/scratch/verify_feature_models.js`
