# Tasks: Re-Translate Subtitle

> **Dependency order:** Tasks 1–4 must be done sequentially (each builds on the previous). Task 5 can be done in parallel with tasks 3–4.

---

- [ ] **Task 1: Add right-click context menu state + handler on language buttons**
  - **Acceptance:**
    - Right-clicking any language button in the subtitle overlay opens a context menu at the cursor position
    - The context menu shows "Re-translate to [LanguageName]" where LanguageName is the full name of the right-clicked language (e.g., "Vietnamese" not "VI")
    - Clicking outside the menu or pressing Escape closes it
    - The menu position is clamped to viewport edges (doesn't render off-screen)
    - Right-clicking a different language button moves the menu to the new position
    - Left-clicking a language button still works normally (selects the language)
    - Context menu does NOT appear when right-clicking while a translation is already in progress (`translating === true`)
  - **Verify:**
    - Run `npm run dev`, open a course with at least 2 subtitle languages
    - Right-click each language button → menu appears with correct language name
    - Click outside → menu closes
    - Press Escape → menu closes
    - Right-click near screen edge → menu stays within viewport
    - Start a translation → right-click a lang button → menu does NOT appear
  - **Files:** `frontend/src/components/VideoPlayer.jsx`

- [ ] **Task 2: Render context menu JSX**
  - **Acceptance:**
    - Context menu renders as a positioned `<div>` with glassmorphism styling matching the existing overlay chips
    - Menu contains a single clickable item: "Re-translate to [LanguageName]"
    - Menu item has hover state (background highlight)
    - Clicking the menu item closes the context menu and opens the confirmation dialog (sets `confirmRetranslate` state)
    - Menu item shows "↻ Re-translate to [LanguageName]" to visually distinguish from a destructive action
  - **Verify:**
    - Visual check: context menu appears with glassmorphism backdrop-blur background
    - Hover over the menu item → background changes
    - Click the item → menu closes, confirmation dialog appears (Task 3)
  - **Files:** `frontend/src/components/VideoPlayer.jsx`

- [ ] **Task 3: Add confirmation dialog**
  - **Acceptance:**
    - A centered modal overlay appears with backdrop blur when `confirmRetranslate` is set
    - Dialog shows warning text: "This will overwrite the existing [LanguageName] translation. Continue?"
    - Two buttons: "Cancel" (secondary/outline style) and "Confirm" (primary/filled style)
    - Cancel → clears `confirmRetranslate`, no API call made
    - Confirm → calls `handleRetranslate()`, button shows loading/spinner state while in progress
    - Confirmation dialog closes automatically when re-translation completes (success or error)
    - Pressing Escape closes the confirmation dialog (does not trigger re-translation)
    - Clicking the overlay backdrop (outside the dialog card) also closes it
  - **Verify:**
    - Right-click lang button → "Re-translate" → confirmation dialog appears
    - Click Cancel → dialog closes, file on disk unchanged
    - Click overlay backdrop → dialog closes
    - Press Escape → dialog closes
    - Click Confirm → button shows "Translating..." disabled state → dialog closes on completion → subtitle reloads
  - **Files:** `frontend/src/components/VideoPlayer.jsx`

- [ ] **Task 4: Implement handleRetranslate function**
  - **Acceptance:**
    - Calls `POST /api/translate-subtitle` with `subtitlePath` set to the **currently active language's** subtitle path (not the right-clicked language's path) and `targetLang` set to the right-clicked language
    - Reuses existing `translating` and `translationError` state (no new loading/error state)
    - On success: calls `onSubtitlesUpdated()` to refresh the course content and reload the subtitle track. Does NOT switch `activeLang`
    - On error: sets `translationError` (displayed via existing error toast)
    - Clears `confirmRetranslate` state in finally block
    - Clears `contextMenu` state in finally block (belt-and-suspenders)
    - Cannot start if `translating` is already true (guard in Task 1)
  - **Verify:**
    - Set active lang to English, right-click VI → "Re-translate" → Confirm → translation runs, VI.vtt is overwritten, subtitle track reloads, active lang stays on English
    - Remove API key from settings → re-translate → error toast appears with "API Key is missing" message
    - Manually check that `handleStartTranslation` (first-time translate dropdown) is unchanged and still works
  - **Files:** `frontend/src/components/VideoPlayer.jsx`

- [ ] **Task 5: Add CSS styles**
  - **Acceptance:**
    - `.context-menu` — absolutely positioned, `background: var(--overlay-chip-bg)`, `backdrop-filter: blur(10px)`, `border: 1px solid var(--overlay-chip-border)`, `border-radius: 12px`, `padding: 6px`, `z-index: 10`, `min-width: 180px`, `box-shadow` for depth
    - `.context-menu-item` — full-width button, left-aligned text, `padding: 6px 12px`, `border-radius: 8px`, `font-size: 0.8rem`, `font-weight: 500`, hover state with `background: var(--bg-hover)`, disabled state with `opacity: 0.5; cursor: not-allowed`
    - `.confirm-overlay` — fixed fullscreen, `background: rgba(11, 15, 25, 0.7)`, `backdrop-filter: blur(4px)`, `z-index: 20`, flexbox centered
    - `.confirm-dialog` — centered card, `background: var(--bg-card)`, `border: 1px solid var(--border-color)`, `border-radius: 16px`, `padding: 24px`, `max-width: 400px`, `box-shadow`
    - `.confirm-dialog p` — warning text, `font-size: 0.9rem`, `color: var(--text-primary)`, `margin-bottom: 20px`
    - `.confirm-dialog-buttons` — flexbox row, `gap: 12px`, `justify-content: flex-end`
    - `.confirm-btn-cancel` — secondary style matching existing buttons
    - `.confirm-btn-confirm` — primary style matching `.video-overlay-btn.active`, with disabled state for loading
    - All styles work correctly in both dark and light themes (use CSS variables)
  - **Verify:**
    - Toggle between dark and light themes → context menu and confirmation dialog look correct in both
    - Context menu renders at correct position, no visual glitches
    - Confirmation dialog is centered, backdrop covers full viewport
    - Buttons have correct hover and active states
  - **Files:** `frontend/src/index.css`

---

## Integration Sanity Check

After all tasks complete, verify the full flow end-to-end:

1. Fresh first-time translate still works: pick untranslated language from dropdown → runs → auto-selects
2. Re-translate works: right-click existing lang → context menu → confirm → overwrites → track reloads
3. Re-translate to a different language from current active: translate VI from Japanese source (not English) works
4. Concurrent guard: re-translate is blocked while another translation is running
5. Error handling: bad API key → error toast; network failure → error toast
6. No visual regressions: existing subtitle controls, 2nd sub selector, size selector all unchanged
