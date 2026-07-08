# Task List: New Chat Button in AI Chat

This document lists the specific tasks to be completed in Gated Workflow Phase 4 (Implement) for adding the "New Chat" button to the AI Chat tab.

- [x] **Task 1: Define clearing handler**
  - **Acceptance**: A `handleNewChat` function is added to `NotesPanel.jsx`. It clears `chatMessages`, `chatInput`, and `chatError` state, and focuses `chatInputRef.current`.
  - **Verify**: Inspect code structure in `NotesPanel.jsx`.
  - **Files**: `frontend/src/components/NotesPanel.jsx`

- [x] **Task 2: Add sub-header bar and New Chat button to Chat tab UI**
  - **Acceptance**: A sub-header bar is displayed at the top of the AI Chat tab. On the left it shows "Grounded in Transcript" with a checkmark. On the right, it displays a "New Chat" button with a Lucide icon. The button is disabled when `chatLoading` is true. Hover states are styled using transitions.
  - **Verify**: Start the dev server (`npm run dev`) and manually test the button by sending questions, clicking the button, checking if states clear, and confirming that the input gets focused.
  - **Files**: `frontend/src/components/NotesPanel.jsx`
