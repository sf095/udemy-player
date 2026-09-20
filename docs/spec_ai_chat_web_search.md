# Spec: AI Chat Web Search Integration

## Objective
Give the AI Chat assistant in the Udemy Offline Player the ability to search the internet for real-time information, modern API documentation, code examples, and troubleshooting tips when requested by the learner.

While the course player is primarily offline-first and grounded in video subtitles, students frequently encounter topics where web search is essential (e.g. library updates, deprecated methods since the video was recorded, syntax changes, or additional real-world context).

## User Decisions & Assumptions
1. **Activation Method**: Explicit `[🌐 Web Search]` toggle button in the Chat UI.
   - Default is **OFF** (purely offline, answering strictly from the lesson's transcript without external latency or network requests).
   - When switched **ON**, queries search the internet and augment the transcript context with live web results.
2. **Provider Scope**:
   - **Google Gemini**: Uses native Gemini Google Search Grounding (`tools: [{ googleSearch: {} }]`), returning search queries and grounded citations (`groundingMetadata.groundingChunks`).
   - **OpenAI & Anthropic Claude**: Uses zero-config DuckDuckGo web search via a dedicated backend helper (`backend/lib/web-search.js`), injecting top web search results and snippets into the prompt context.
3. **Citations & Sources**:
   - Responses generated with web search include a list of verified source URLs (`{ title, url }`).
   - The UI displays clickable source links under the assistant's message bubble.
   - Clicking links opens them safely in the user's default external browser (handled by Electron's `setWindowOpenHandler` / `shell.openExternal`).
4. **Offline Resilience**:
   - If the user turns Web Search ON while offline or if search fails, the backend gracefully falls back to answering from transcript only with an informative note, rather than failing the chat request.

## Tech Stack
- **Backend**: Node.js, Express (`backend/server.js`)
- **Web Search Engine**:
  - Google Gemini API: Native `googleSearch` grounding tool (via `v1beta` endpoint)
  - OpenAI / Anthropic: `backend/lib/web-search.js` (native Node.js `fetch` against DuckDuckGo web results)
- **Frontend**: React (Vite-based), Lucide Icons (`Globe`, `ExternalLink`, etc.), CSS variables

## Commands
- **Dev**: `npm run dev`
- **Backend Dev**: `npm run dev --prefix backend`
- **Frontend Dev**: `npm run dev --prefix frontend`
- **Frontend Build**: `npm run build --prefix frontend`
- **Desktop Dev**: `npm run dev:desktop`

## Project Structure
1. `backend/lib/web-search.js` (NEW):
   - Standalone search helper to fetch web results and snippets from DuckDuckGo without external dependencies.
2. `backend/server.js`:
   - Update `callGemini`: Support optional `tools` parameter (e.g. `[{ googleSearch: {} }]`) and extract `groundingMetadata.groundingChunks`.
   - Update `callAiProvider`: Pass through web search grounding options for Gemini, and inject search results for OpenAI and Anthropic.
   - Update `/api/chat-lesson`: Accept `enableWebSearch: boolean` from request body. Return `{ success: true, reply, sources: [{ title, url }] }`.
3. `frontend/src/components/NotesPanel.jsx`:
   - State `webSearchEnabled` (boolean, default `false`).
   - Toggle button in Chat sub-header: `[🌐 Web Search: ON/OFF]`.
   - Send `enableWebSearch` with `/api/chat-lesson` POST request.
   - Store `sources` in chat message objects: `{ role: 'assistant', content, sources: [...] }`.
   - Render source citation chips with link icons beneath assistant message bubbles.
4. `frontend/src/index.css`:
   - Styles for web search toggle button (active/inactive states), sources container, and clickable citation pills.

## Code Style
- Surgical additions adhering to existing patterns in `backend/server.js` and `frontend/src/components/NotesPanel.jsx`.
- Use existing color variables (`var(--primary)`, `var(--bg-hover)`, `var(--border-color)`, `var(--text-secondary)`, `var(--accent-green)`).
- Zero new third-party npm dependencies.

## Testing Strategy
1. **Gemini Web Search Verification**:
   - Ask a question requiring recent or external information (e.g. "What is the latest LTS version of Node.js?") with Web Search ON using Gemini.
   - Verify reply contains current info and `sources` contains valid links.
2. **OpenAI / Claude Web Search Verification**:
   - Ask question with Web Search ON using OpenAI or Claude.
   - Verify `backend/lib/web-search.js` retrieves results and model synthesizes answer with sources.
3. **Offline / Web Search OFF Verification**:
   - Ask question with Web Search OFF.
   - Verify request completes without touching web search, answering purely from transcript.
4. **Link Safety Verification**:
   - Click a citation link in the chat tab.
   - Confirm it opens externally in default browser without breaking Electron app window.

## Boundaries
- **Always**:
  - Keep lesson transcript attached as primary context.
  - Default Web Search toggle to OFF to keep the offline player fast and private.
  - Sanitize and format external URLs before displaying.
- **Ask First**:
  - Requiring paid search API keys (e.g. Google Custom Search JSON API, Bing Search API).
- **Never**:
  - Introduce new heavy dependencies for web scraping.
  - Fail the entire chat request if web search network request fails; degrade gracefully to transcript-only.

## Success Criteria
- [ ] Spec approved by user.
- [ ] Backend endpoint `/api/chat-lesson` supports `enableWebSearch` parameter.
- [ ] Gemini uses native Google Search Grounding when `enableWebSearch` is true.
- [ ] OpenAI and Anthropic use `backend/lib/web-search.js` when `enableWebSearch` is true.
- [ ] UI provides an intuitive toggle button `[🌐 Web Search]` in the Chat tab.
- [ ] Assistant responses include clickable source citations when web search was utilized.
- [ ] When Web Search is OFF, chat remains 100% transcript-grounded and offline-ready.
