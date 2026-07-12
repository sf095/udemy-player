# Plan: Reorder Right Sidebar Tabs

## Implementation Strategy
We will modify the `NotesPanel.jsx` component to reorder the tabs from Notes, Summary, AI Chat to Summary, AI Chat, Notes. We will update the state initialization and the JSX rendering sequence of the tab headers.

### Step 1: Change Default Active Tab State
- Locate the `activeTab` declaration in `frontend/src/components/NotesPanel.jsx` (around line 69).
- Change `useState('notes')` to `useState('summary')` so that the Summary tab is active by default.

### Step 2: Reorder Tab Headers in JSX
- In `frontend/src/components/NotesPanel.jsx`, locate the `panel-tabs` container (lines 336-403).
- Reorder the `<button>` tags within this container:
  1. **Summary** tab button (previously the second button).
  2. **AI Chat** tab button (previously the third button).
  3. **Notes** tab button (previously the first button).
- Keep all styles, icons, classNames, onClick handlers, and label texts exactly the same.

### Step 3: Verify and Test
- Run `npm run dev` to start the local player.
- Confirm visually that the default active tab on load is **Summary** and that the tabs are ordered: "Summary", "AI Chat", "Notes".
- Switch between all three tabs ("Summary", "AI Chat", "Notes") to confirm they render the correct corresponding content panels.
- Verify that selecting "AI Chat" automatically focuses the chat input field.
- Verify frontend builds and lints successfully.
