# Plan: AI Chat Web Search Integration

## Architecture & Data Flow

```
User enters message in Chat Tab
              │
              ▼
Is [🌐 Web Search] toggle ON?
       │               │
      NO              YES
       │               │
       │         ┌─────┴────────────────────────┐
       │         │                              │
       │    Provider: Gemini         Provider: OpenAI / Claude
       │         │                              │
       │    Add tools:                    Execute search helper
       │    [{ googleSearch: {} }]        (backend/lib/web-search.js)
       │    to Gemini payload                   │
       │         │                        Inject top web snippets
       │         │                        into system prompt
       │         │                              │
       └─────────┼──────────────────────────────┘
                 │
                 ▼
       Invoke AI Provider API
                 │
                 ▼
       Extract Reply Text & Citations (URLs, titles)
                 │
                 ▼
       Return JSON to Frontend:
       { success: true, reply, sources: [{ title, url }] }
                 │
                 ▼
       Render Message Bubble + Clickable Source Links
```

## Implementation Phases

### Phase 1: Backend Web Search Helper
- Create `backend/lib/web-search.js` to perform zero-dependency web search via DuckDuckGo.
- Returns clean list of `{ title, snippet, url }`.

### Phase 2: Backend AI Dispatcher Updates
- Update `callGemini` in `backend/server.js`:
  - Pass `tools: [{ googleSearch: {} }]` when web search is enabled.
  - Return structured result: `{ text, sources: [...] }` by parsing `candidate.groundingMetadata.groundingChunks`.
- Update `callAiProvider` and `/api/chat-lesson`:
  - Accept `enableWebSearch: boolean`.
  - For Gemini: pass `tools: [{ googleSearch: {} }]`.
  - For OpenAI/Claude: fetch web search results for the user query, append to system instruction, and return sources.
  - Graceful error recovery: if web search network call fails, log warning and proceed with transcript only.

### Phase 3: Frontend Chat UI Enhancements
- In `frontend/src/components/NotesPanel.jsx`:
  - Add state `webSearchEnabled` (default `false`).
  - Add a toggle button in the chat sub-header next to "New Chat" and "Grounded in Transcript":
    `[🌐 Web Search]` with active styling when ON.
  - Pass `enableWebSearch` in the `/api/chat-lesson` request.
  - When storing assistant response, store `sources: data.sources || []`.
  - Render a "Sources" accordion or chip list below the assistant message with `Globe` / `ExternalLink` icons.
- In `frontend/src/index.css`:
  - Add styling for the web search toggle button (distinct badge/glow when active) and source citation chips.

### Phase 4: Verification & Build
- Verify syntax and linting.
- Verify test search queries with Web Search ON and OFF.
- Test frontend build (`npm run build --prefix frontend`).
