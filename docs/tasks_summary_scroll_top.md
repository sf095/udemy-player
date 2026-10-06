# Tasks: Fix Summary Auto-Scrolling to End (Ensure Scroll to Top)

- [x] Task 1: Guard chat auto-scroll & reset summary scroll to top in NotesPanel
  - Acceptance: In `frontend/src/components/NotesPanel.jsx`, `chatEndRef.current.scrollIntoView()` is only executed when `activeTab === 'chat'`. When `summary` generation or cache load completes (or when viewing summary), `summaryContentRef.current.scrollTop` is reset to 0.
  - Verify: `npm run lint --prefix frontend` passes; manual test that background chat fetching does not scroll summary down.
  - Files: `frontend/src/components/NotesPanel.jsx`

- [x] Task 2: Reset summary scroll to top in ChapterSummaryModal
  - Acceptance: In `frontend/src/components/ChapterSummaryModal.jsx`, add `summaryScrollRef` to the scrollable summary body and reset `summaryScrollRef.current.scrollTop = 0` when summary generation or cache load finishes or modal opens.
  - Verify: `npm run lint --prefix frontend` passes; chapter summary modal displays content from top.
  - Files: `frontend/src/components/ChapterSummaryModal.jsx`

- [x] Task 3: Verification & Sanity Checks
  - Acceptance: Frontend builds cleanly, linter passes with 0 warnings, in-summary search (`Cmd/Ctrl+F`) active match scrolling and AI chat auto-scrolling remain fully functional.
  - Verify: `npm run lint --prefix frontend` and `npm run build --prefix frontend`.
  - Files: `docs/tasks_summary_scroll_top.md`
