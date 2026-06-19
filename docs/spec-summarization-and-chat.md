# Spec: Video Summarization and AI Chat

## Objective
Add video summarization and AI chat capabilities to the Udemy Offline Player.
1. **Video Summarization**: Summarize video lessons based on the subtitle track of the currently selected language. Cache the summary as a file next to the subtitles so that subsequent requests for the same lesson and language load from disk directly instead of invoking the Gemini API again.
2. **AI Chat**: Provide a chat interface where users can ask questions about the current lesson. The backend will read the current subtitle file, feed it as context to the Gemini API, and return the answer.

## Tech Stack
- **Backend**: Node.js, Express, manual API requests to Gemini API (using the existing `geminiApiKey` saved in the database settings).
- **Frontend**: React (Vite-based), Vanilla CSS, Lucide icons.

## Commands
- Run backend & frontend: `npm run dev`
- Build frontend: `npm run build`

## Project Structure
We will modify the following files:
1. `backend/server.js`: Add API endpoints for summarization (`/api/summarize`) and chat (`/api/chat`).
2. `frontend/src/App.jsx`: Update state to coordinate active tab in right panel and pass appropriate props.
3. `frontend/src/components/NotesPanel.jsx` (or a unified right panel): Refactor to support tabs: "Notes", "Summary", and "AI Chat".
4. `frontend/src/index.css`: Add styles for tabs, summary viewer, and chat messages.

## Code Style
- Use standard JavaScript and React state variables.
- Maintain CSS styling conventions (dark-mode theme with glassmorphism, rounded corners, custom scrollbars, and indigo/purple accents).
- Handle edge cases, e.g. when API keys are missing, when subtitle files are missing, or when API calls fail.

## Testing Strategy
- Manual testing of caching logic by verifying that the first request writes a `.summary.[lang].txt` file and the second request returns it instantly without contacting Gemini API.
- Verify translation of summaries to the appropriate language based on the active subtitle track.
- Verify that sending chat messages correctly extracts information from the subtitle file.

## Boundaries
- **Always**:
  - Read from disk if a summary file already exists.
  - Disable summarization/chat if no subtitles are available, notifying the user.
  - Require the Gemini API key to be set in Settings.
- **Ask First**:
  - Changing local course folder formats or editing unrelated components.
- **Never**:
  - Commit API keys to Git (they reside in the user database file `progress_db.json`).
  - Request Gemini API without verifying subtitle existence.

## Success Criteria
- [ ] Users can open the "Summary" tab in the right panel and see a "Generate Summary" button if no summary is cached on disk.
- [ ] Generating a summary reads the active subtitle file, requests Gemini API, and writes a `.summary.[lang].txt` file next to the subtitle file on disk.
- [ ] If a summary file is present, loading the lesson's "Summary" tab instantly displays the summary from disk.
- [ ] The "AI Chat" tab displays an interactive chat interface.
- [ ] Sending a message in AI Chat contextually uses the subtitle file content to answer the user's question, displaying both user messages and AI answers sequentially.
- [ ] When switching between lessons, the chat history resets, and the summary tab checks for that specific lesson's summary on disk.
- [ ] If no Gemini API Key is configured, both panels show a warning linking to Settings.

## Open Questions
1. Should the summary formatting support basic markdown styling (headers, bold, lists) in the UI? (Yes, we can write a simple, clean, custom inline renderer or render it using styled sections).
2. Should we support clearing the summary from disk/regenerating it? (Yes, a "Regenerate" button would be highly useful in case of API failures or subtitle changes).
