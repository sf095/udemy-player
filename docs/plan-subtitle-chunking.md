# Plan: Subtitle Translation Chunking

This plan outlines the technical approach to implement subtitle chunking in `/api/translate-subtitle` to support translating long subtitle files.

## Technical Approach

### 1. Subtitle Parser & Chunker
We will implement a helper function `parseSubtitleCues` in `backend/server.js` that:
- Normalizes all line endings to `\n` and removes any BOM characters.
- Groups lines into blocks separated by blank lines.
- Filters out non-cue blocks (e.g., metadata headers, comments) by ensuring each block contains a timecode arrow `-->`.

### 2. Chunk-by-Chunk AI Translation
Inside the `app.post('/api/translate-subtitle')` handler:
- We will parse the full subtitle content into cues.
- We will group the cues into chunks of 100 cues each.
- We will loop through the chunks sequentially to translate them.
- For each chunk:
  - We will format the prompt, asking the AI provider to translate ONLY the cues in the given chunk and preserve indices/timecodes.
  - We will call `callAiProvider`.
  - We will clean the output of any markdown wrappers (` ``` ` or ` ```vtt `).
- We will join the translated chunks with `\n\n`.
- Finally, we will prepend `WEBVTT\n\n` to the joined content, ensuring the output is a valid WebVTT file.
- If the output content or any block has SRT format (commas instead of periods in timecodes), the existing `srtToVtt` helper will convert it.

### 3. Error Handling and Resilience
- If any chunk fails to translate after retrying (e.g., due to rate limits or API errors), we will immediately abort and return a clear error response indicating which chunk failed.
- We will introduce a small delay (e.g., 500ms) between sequential chunk translation requests to avoid hitting rate limits or concurrent request limits of API providers.

## Implementation Order
1. **Define/verify helpers**: Write `parseSubtitleCues` in `backend/server.js`.
2. **Refactor endpoint**: Modify `/api/translate-subtitle` inside `backend/server.js` to parse cues, chunk them, and call the AI provider sequentially.
3. **Verify locally**: Test using a scratch Node script on a large dummy subtitle file.

## Risks & Mitigations
- **Rate Limiting / Quota Limits**: Free API keys might have RPM (Requests Per Minute) limits.
  - *Mitigation*: Process chunks sequentially and add a delay of 500ms between calls.
- **Incomplete / Malformed AI outputs**: The AI might return empty text or corrupt a cue.
  - *Mitigation*: We will validate that the AI output is not empty. If it is empty or malformed, we can raise an error or fall back.
- **Lost Cues mapping**: AI might merge or omit a cue.
  - *Mitigation*: By keeping the chunk size small (100 cues/blocks), the AI is highly accurate. We will also write robust instructions in the prompt.

## Verification Checkpoint
- Verify that a 500+ line subtitle file translates successfully without timing out or returning errors.
- Verify that the resulting translated subtitle has the exact same number of cues/timecodes.
