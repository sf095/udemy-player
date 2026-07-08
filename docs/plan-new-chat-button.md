# Technical Plan: New Chat Button in AI Chat

This document outlines the implementation plan for adding the "New Chat" button to the AI Chat tab in the Udemy Offline Player.

## 1. Components and Dependencies
- **Target File**: `frontend/src/components/NotesPanel.jsx`
- **Dependencies**: 
  - `chatMessages`, `chatInput`, `chatError` state values inside `NotesPanel.jsx`.
  - `chatInputRef` reference to focus the input field.
  - Lucide icons (`Trash2` or `Plus`) which are already imported in the component.

## 2. Implementation Order
1. **Define Handler**: Create the `handleNewChat` handler in `NotesPanel.jsx` that:
   - Resets `chatMessages` to `[]`.
   - Resets `chatInput` to `''`.
   - Resets `chatError` to `null`.
   - Calls `.focus()` on `chatInputRef.current` to refocus the input field.
2. **Add UI elements**:
   - Insert a sub-header bar at the top of the chat area (above the Chat Log feed) using flexbox.
   - Display a status indicator: "Grounded in Transcript" on the left.
   - Display the "New Chat" button on the right, styled to match the summary tab's "Regenerate" button (with hover opacity change, transition, and pointer cursor).
3. **Refocus handling**:
   - Ensure the input is refocused cleanly after state update.

## 3. Risks & Mitigations
- **Risk**: Clicking "New Chat" while a request is in-flight (`chatLoading` is true) could lead to race conditions or unexpected state if the response returns after clearing.
  - *Mitigation*: Disable the "New Chat" button or prevent its execution if `chatLoading` is true, or abort/discard any in-flight response when starting a new chat. We will disable the button when `chatLoading` is true.

## 4. Verification Checkpoints
- **Checkpoint 1 (State & Refocus)**: Click "New Chat" and verify that React states are reset to their initial values and focus returns to the input box.
- **Checkpoint 2 (UI & Hover)**: Verify that the sub-header bar is visible in the active Chat tab, and that hover styles and transition effects function as expected.
- **Checkpoint 3 (Safety)**: Verify the button is disabled when `chatLoading` is true (while the AI is generating a reply).
