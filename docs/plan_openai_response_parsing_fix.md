# Plan: OpenAI Response Parsing & Chapter Summarization Fix

## Overview
This plan defines the step-by-step implementation for resolving the `'OpenAI API returned HTTP 200 but the response content could not be parsed'` error during chapter/lesson summarization with OpenAI models.

## Components & Dependencies
1. **Verification Test Suite** (`backend/scratch/verify_openai.js`):
   - Establishes test fixtures and assertions for content parsing edge cases:
     - Standard string content
     - Multi-part array content (`[{ type: 'text', text: '...' }]`)
     - Model refusals (`choice.message.refusal`)
     - Output token exhaustion (`finish_reason: 'length'` with empty/null content)
     - Empty response with other finish reasons
     - Fallback properties for non-standard providers
2. **Backend Server Integration** (`backend/server.js`):
   - `callOpenAI`: Implement robust response parsing according to test specifications.
   - `/api/summarize-section`: Set `maxTokens: 16384` when calling `callAiProvider`.
   - `/api/summarize-lesson`: Set `maxTokens: 8192` when calling `callAiProvider`.

## Implementation Order
1. **Phase 2 (Current)**: Plan review and human validation.
2. **Phase 3 (Tasks)**: Break down the plan into discrete tasks with verifiable acceptance criteria.
3. **Phase 4 (Execute)**:
   - Step 1: Update unit tests in `backend/scratch/verify_openai.js` (TDD red/green baseline).
   - Step 2: Implement robust parsing logic and diagnostic logging in `backend/server.js` (`callOpenAI`).
   - Step 3: Configure appropriate `maxTokens` in `/api/summarize-section` and `/api/summarize-lesson`.
   - Step 4: Run verification tests and verify regression-free state across all scratch verifiers.

## Risks & Mitigations
- **Risk**: Some third-party OpenAI-compatible providers may format array blocks differently or omit `finish_reason`.
  - **Mitigation**: Handle both string and array content defensively; check for nested `text` or `value` properties; treat null/empty strings with clear contextual messages including the full choice object in logs.
- **Risk**: 16,384 tokens for section summaries might be rejected by very old custom endpoints limited to 4,096 tokens.
  - **Mitigation**: OpenAI's native endpoints and modern compatible APIs support 16k–128k output tokens. The existing 400 error fallback handles parameter negotiation.

## Verification Checkpoints
- Checkpoint 1: `node backend/scratch/verify_openai.js` passes all tests.
- Checkpoint 2: `node backend/scratch/verify_feature_models.js` passes.
- Checkpoint 3: Existing unit tests run cleanly without regressions.
