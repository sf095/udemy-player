# Spec: Fix Progress Indicator for Auto-Generated Summaries

## Objective
Ensure that the loading/progress indicator is visible in the Summary tab when a lesson is loaded/played and the summary is being auto-generated in the background. Currently, when the "Automatically Create Summary" setting is enabled, the cache check function initiates auto-generation asynchronously without awaiting it, causing the loading state to immediately reset to `false` and displaying a "No Summary Generated" state while generation is active.

### User Stories
1. **Visibility of Progress**: As a student, when I load a lesson and the system auto-generates a summary, I want to see a clear loading progress indicator in the Summary tab so that I know the system is actively working on it.
2. **Seamless Transition**: Once the auto-generation finishes, the loading state should resolve and display the generated summary without intermediate empty states.

## Tech Stack
- **Frontend**: React 19, Vite, Lucide Icons, Vanilla CSS
- **Backend/Desktop**: Node.js, Express, Local JSON DB

## Commands
- **Dev (Concurrent)**: `npm run dev`
- **Frontend Dev**: `npm run dev --prefix frontend`
- **Backend Dev**: `npm run dev --prefix backend`
- **Production Build (Frontend)**: `npm run build --prefix frontend`

## Project Structure
- `frontend/src/components/NotesPanel.jsx` — Component housing the Summary tab and managing the check/generation loading states.

## Code Style
- **React**: Functional component, hooks (`useCallback`, `useEffect`).
- **Async/Await**: Ensure all background promises are properly awaited if their loading state is bound to the parent scope's loading state.

## Testing Strategy
- **Manual Verification**:
  1. Open Application Settings and ensure "Automatically Create Summary" is enabled, and a valid AI API Key is configured.
  2. Select a lesson that has no generated summary yet.
  3. Open the "Summary" tab in the right sidebar.
  4. Verify that the loading spinner ("Analyzing Transcript... Gemini/Anthropic is compiling your offline summary") is visible.
  5. Verify that the loading spinner remains visible until the summary generation completes.
  6. Verify that once complete, the summary text is displayed, and the spinner disappears.
  7. Verify that selecting a lesson with an already cached summary loads the summary instantly without starting auto-generation.

## Boundaries
- **Always**: Maintain existing checkCacheOnly optimization to avoid double-generating summaries that are already cached.
- **Never**: Discard errors occurring during background generation. Any generation error must be stored in `summaryError` and shown in the UI.

## Success Criteria
- [ ] In `frontend/src/components/NotesPanel.jsx`, update the `checkSummaryCache` function to `await` the execution of `generateSummaryRef.current(...)` when auto-generating a summary.
- [ ] Verify the auto-generation behavior correctly displays the spinner without any regression to manual generation or cache clearing.
