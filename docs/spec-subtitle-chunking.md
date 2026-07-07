# Spec: Robust Subtitle Translation with Chunking

## Objective
When translating large subtitle files (SRT or WebVTT) via the Gemini/Anthropic API, the request can fail due to model output token limits, request timeouts, or quality degradation (where the model skips or truncates text).
This specification details how the backend will split subtitles into smaller, manageable chunks, translate each chunk sequentially, and merge them back together to guarantee robust and high-quality translations for long video lessons.

## Tech Stack
- Backend: Node.js, Express (built-in `fetch` for AI calls).
- AI Providers: Google Gemini (default), Anthropic.

## Commands
- Dev Server: `npm run dev` (from root, starts frontend on port 5173, backend on 3003)
- Backend Dev: `npm run dev --prefix backend`

## Project Structure
- `backend/server.js` - Contains the `/api/translate-subtitle` endpoint where the chunking and translation logic will be implemented.
- `docs/spec-subtitle-chunking.md` - This specification file.

## Code Style
### Chunking Logic (Backend Node.js/JavaScript):
```javascript
// Parse subtitle content into cues/blocks separated by blank lines
const parseSubtitleCues = (content) => {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const cues = [];
  let currentCue = [];

  for (const line of lines) {
    if (line.trim() === '') {
      if (currentCue.length > 0) {
        cues.push(currentCue.join('\n'));
        currentCue = [];
      }
    } else {
      // Skip WEBVTT header if it's at the very beginning
      if (line.trim() === 'WEBVTT' && cues.length === 0 && currentCue.length === 0) {
        continue;
      }
      currentCue.push(line);
    }
  }
  if (currentCue.length > 0) {
    cues.push(currentCue.join('\n'));
  }
  return cues;
};
```

## Testing Strategy
We will create a test subtitle file in `backend/` or `scratch/` with 250+ subtitle cues (representing a ~30-40 min video).
We will test translating it using a scratch Node script that simulates the `/api/translate-subtitle` logic.
- **Verification Checks**:
  1. Count of cues in original vs. translated file must match.
  2. Final translation file must start with `WEBVTT` and have correct timecodes.
  3. No empty translations or missing line numbers.
  4. Test with both Gemini and Anthropic API configurations if keys are provided.

## Boundaries
- **Always do**: Clean up any markdown wrapping (` ``` ` or ` ```vtt `) returned by the LLM on each chunk.
- **Always do**: Preserve the exact timecodes (e.g. `00:01:23,450 --> 00:01:25,120`) and formatting.
- **Ask first**: If we need to change the chunk size dynamically (default to 100 cues/blocks per chunk).
- **Never do**: Add third-party subtitle parsing packages to `package.json`.

## Success Criteria
- [ ] Subtitles are split into chunks of maximum 100 cues each.
- [ ] Chunks are translated sequentially using the configured AI provider.
- [ ] In case of any chunk translation failure, the process logs the error and returns a clean, detailed API error response to the client.
- [ ] The translated chunks are merged, properly formatted as WebVTT, and saved with the appropriate `.vtt` extension next to the video.
- [ ] Subtitle file structure remains completely intact (indices, timecodes, text lines mapping are preserved 1:1).

## Open Questions
1. Should we support concurrent chunk translation, or is sequential translation preferred? (Recommended: Sequential, to avoid API rate limits/throttling on free API keys).
2. What is the optimal chunk size? (Recommended: 100 cues/blocks, which is ~300 lines of text, or roughly 1000-1500 tokens).
