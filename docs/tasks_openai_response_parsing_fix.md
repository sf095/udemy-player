# Tasks: OpenAI Response Parsing & Chapter Summarization Fix

- [x] Task 1: Update Verification Tests in `backend/scratch/verify_openai.js`
  - Acceptance: Test cases added verifying that OpenAI response parsing handles:
    1. Standard string content.
    2. Multi-part array content (`[{ type: 'text', text: '...' }]`).
    3. Model refusals (`choice.message.refusal`) throwing specific refusal error.
    4. Token limit exhaustion (`finish_reason: 'length'` with empty/null content) throwing actionable token-limit error.
    5. Direct fallback properties (`content`, `text`).
    6. `summarize-section` and `summarize-lesson` pass appropriate `maxTokens` (16384 and 8192).
  - Verify: Run `node backend/scratch/verify_openai.js`
  - Files: `backend/scratch/verify_openai.js`

- [x] Task 2: Implement Robust Response Parsing in `backend/server.js`
  - Acceptance: In `callOpenAI`, parse `choice.message.refusal`, handle `content` strings and arrays, detect `finish_reason === 'length'` when content is empty/null, and log detailed diagnostic choice information on unparseable responses.
  - Verify: Run `node backend/scratch/verify_openai.js`
  - Files: `backend/server.js`

- [x] Task 3: Configure Token Budgets for Summarization Endpoints in `backend/server.js`
  - Acceptance: `/api/summarize-section` passes `maxTokens: 16384` to `callAiProvider`. `/api/summarize-lesson` passes `maxTokens: 8192` to `callAiProvider`.
  - Verify: Run `node backend/scratch/verify_openai.js` and `node backend/scratch/verify_feature_models.js`
  - Files: `backend/server.js`

- [x] Task 4: Regression Testing
  - Acceptance: All verification scripts in `backend/scratch/` pass with zero failures.
  - Verify: Run `node backend/scratch/verify_openai.js`, `node backend/scratch/verify_feature_models.js`, and `node backend/scratch/verify_gemini_model.js`.
  - Files: None (verification step)
