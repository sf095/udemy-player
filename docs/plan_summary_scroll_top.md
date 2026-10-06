# Implementation Plan: Fix Summary Auto-Scrolling to End (Ensure Scroll to Top)

## Overview
Fix unintended scrolling to the bottom when generating or loading summaries in both Lesson Summary (`NotesPanel`) and Chapter Summary (`ChapterSummaryModal`), ensuring the scroll position always stays at the top (`scrollTop = 0`) upon completion.

## Proposed Changes

### 1. Right Sidebar Lesson Summary (`frontend/src/components/NotesPanel.jsx`)
- **Guard Chat Auto-Scroll Effect**:
  - Update `useEffect` watching `[chatMessages, chatLoading]` to strictly require `activeTab === 'chat'` before calling `chatEndRef.current.scrollIntoView({ behavior: 'smooth' })`.
  - Add `activeTab` to the dependency array.
  - This prevents background chat history loading (`/api/chat-history`) from triggering `scrollIntoView()` and inadvertently scrolling the sidebar or window when the user is viewing or generating a summary.
- **Scroll Summary Container to Top on Completion**:
  - Add a `useEffect` watching `[summary, summaryLoading, activeTab, activeLesson?.id]`.
  - When `activeTab === 'summary'`, `summary` is truthy, and `!summaryLoading`, set `summaryContentRef.current.scrollTop = 0` immediately and via `requestAnimationFrame` to ensure all newly rendered markdown content is displayed starting from the top.

### 2. Chapter Summary Modal (`frontend/src/components/ChapterSummaryModal.jsx`)
- **Attach Ref to Summary Scroll Container**:
  - Create a new ref: `summaryScrollRef = useRef(null)`.
  - Attach `ref={summaryScrollRef}` to the scrollable content container (`<div style={{ flex: 1, padding: '24px', overflowY: 'auto', ... }}>`).
- **Scroll Container to Top on Completion**:
  - Add a `useEffect` watching `[isOpen, summary, loading, activeTab, section?.id]`.
  - When `isOpen && activeTab === 'summary' && summary && !loading`, reset `summaryScrollRef.current.scrollTop = 0` immediately and inside `requestAnimationFrame`.

## Verification Plan
1. **Automated Verification**:
   - `npm run lint --prefix frontend` (pass with 0 errors).
   - `npm run build --prefix frontend` (pass cleanly).
2. **Manual Verification**:
   - Verify Lesson Summary:
     - Generate a new lesson summary and verify it renders at the very top.
     - Select a lesson with an existing summary; verify it opens at the top.
     - Switch between Content / Notes / Summary / Chat tabs; verify chat history loads do not scroll the summary down.
     - In AI Chat tab, verify chat continues to auto-scroll to the newest message.
     - In Summary tab, verify `Cmd/Ctrl + F` search navigation still scrolls active matches into view.
   - Verify Chapter Summary Modal:
     - Open Chapter Summary modal for a section; generate or load summary; verify it starts at the top.
     - Switch between Summary and Chat tabs inside the modal; verify Summary is at top and Chat is at bottom.
