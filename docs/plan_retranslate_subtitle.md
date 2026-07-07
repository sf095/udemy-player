# Plan: Re-Translate Subtitle

## Architecture Decision: No Backend Changes

The existing `POST /api/translate-subtitle` endpoint already uses `fs.writeFileSync` (server.js:754), which overwrites existing files. Since we always use the currently active language as the source and the target is a different language, the endpoint works identically for both first-time and re-translation. **No backend changes are needed.**

## Component Breakdown

### 1. Context Menu Component (inline in VideoPlayer.jsx)

A positioned popup that appears on right-click of a language button.

**State needed:**
- `contextMenu` — `{ lang, x, y } | null` — which language was right-clicked + screen position
- `confirmRetranslate` — `{ lang, langName } | null` — pending confirmation

**Behavior:**
- Right-click on any lang button → set `contextMenu` with that lang + mouse coordinates
- Click "Re-translate to [LanguageName]" → close context menu, open confirmation dialog
- Click outside / Escape → close context menu
- Context menu renders absolutely positioned near the button

**DOM structure:**
```
button.video-overlay-btn (existing — add onContextMenu handler)
  └── contextMenu && contextMenu.lang === lang →
      div.context-menu (portal or absolute, at {x, y})
        button "Re-translate to Vietnamese"
```

### 2. Confirmation Dialog (inline in VideoPlayer.jsx)

A centered modal overlay with warning text and Cancel/Confirm buttons.

**DOM structure:**
```
confirmRetranslate && →
  div.confirm-overlay (backdrop)
    div.confirm-dialog
      p "This will overwrite the existing [LanguageName] translation. Continue?"
      div (button row)
        button "Cancel"
        button "Confirm" (primary, shows loading state if translating)
```

### 3. Re-translate Handler (new function in VideoPlayer.jsx)

```js
const handleRetranslate = async (targetLangCode) => {
  const sourcePath = subtitles?.[activeLang];
  if (!sourcePath) return;

  setTranslating(true);
  setTranslationError(null);

  try {
    const response = await fetch('/api/translate-subtitle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtitlePath: sourcePath, targetLang: targetLangCode })
    });
    const data = await response.json();
    if (data.success) {
      if (onSubtitlesUpdated) await onSubtitlesUpdated();
      // Do NOT change activeLang — user may be watching in a different language
    } else {
      setTranslationError(data.error || 'Failed to re-translate subtitles.');
    }
  } catch (err) {
    console.error('Re-translation error', err);
    setTranslationError('Network error during re-translation.');
  } finally {
    setTranslating(false);
  }
};
```

Note: Unlike `handleStartTranslation` (which calls `setActiveLang(targetLangCode)`), the re-translate handler does NOT switch the active language — the user right-clicked VI but may currently be watching in JA.

## Implementation Order

All changes are in `VideoPlayer.jsx` and `index.css`. They are tightly coupled — implement together.

### Step 1: Add context menu state + handlers (`VideoPlayer.jsx`)
- Add `useState` for `contextMenu` and `confirmRetranslate`
- Add `useEffect` for click-outside and Escape-key dismissal of context menu
- Add `handleRetranslate` function (similar to `handleStartTranslation` but doesn't switch activeLang)
- Add `onContextMenu` handler on each language button in the overlay

### Step 2: Render context menu + confirmation dialog JSX (`VideoPlayer.jsx`)
- Conditional render of context menu `<div>` when `contextMenu` is set
- Conditional render of confirmation overlay when `confirmRetranslate` is set
- Wire up button clicks

### Step 3: Add CSS (`index.css`)
- `.context-menu` — positioned popup, matching the overlay's glassmorphism style
- `.context-menu-item` — button inside context menu
- `.confirm-overlay` — fullscreen backdrop
- `.confirm-dialog` — centered card with warning text + buttons

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Context menu renders off-screen near edge | Clamp x/y to viewport bounds in the positioning logic |
| User starts a new translation while one is already running | The existing `translating` state disables the Translate dropdown; extend this guard to the context menu item (disable + show "Translating..." text) |
| Context menu click-outside listener leaks | Use `useEffect` cleanup to remove the event listener |
| Re-translate on a language that is the current activeLang (e.g., re-translate VI while watching VI) — track reload needed | After re-translate + `onSubtitlesUpdated`, the active track should refresh automatically via the `<track>` element re-mount (it's keyed on `activeLang`) |

## Verification Checkpoints

1. **Context menu appears:** Right-click a language button → context menu pops up at cursor position with correct language name
2. **Context menu dismisses:** Click outside / press Escape → context menu closes
3. **Confirmation dialog:** Click "Re-translate to X" → confirmation dialog appears with correct warning
4. **Cancel flow:** Click "Cancel" → dialog closes, no API call made, file unchanged
5. **Confirm flow:** Click "Confirm" → translation runs (spinner/disabled state visible) → success toast → subtitle reloaded
6. **Error handling:** Remove API key → re-translate → error toast appears
7. **First-time translate unchanged:** The "Translate to..." dropdown still works identically

## Files Changed

| File | Lines | Change |
|---|---|---|
| `frontend/src/components/VideoPlayer.jsx` | ~60 added | Context menu state, handlers, JSX, confirmation dialog JSX |
| `frontend/src/index.css` | ~60 added | Context menu styles, confirmation dialog styles |
| **Total** | ~120 lines | 2 files |
