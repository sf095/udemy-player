# Plan: U-Fetch Website URL Integration (https://www.ufetch.app/)

## Implementation Overview
Integrate `https://www.ufetch.app/` into two strategic locations in the app:
1. **Header Navigation Pill**: An always-visible, attractive gradient badge in the top-right header action bar.
2. **Welcome Screen Card**: A sleek promo card on the empty welcome state (`!coursePath`).

---

## 1. Components & Dependencies
- `frontend/src/App.jsx`:
  - Import `ExternalLink` icon (and optionally `Sparkles`) from `lucide-react`.
  - Add the header pill `<a href="https://www.ufetch.app/" target="_blank" ... className="ufetch-header-pill">` inside `.header-actions-right`.
  - Add the promo card inside the `!coursePath` empty state block in the stage panel.
- `frontend/src/index.css`:
  - Add CSS classes for `.ufetch-header-pill`, hover/active states, and light-theme overrides.
  - Add CSS classes for `.ufetch-welcome-card`, its badges, glowing border, and CTA button.

---

## 2. Implementation Order
1. **CSS Styles (`frontend/src/index.css`)**:
   - Define styles for the header pill: subtle gradient background, border glow, text styling, and hover/active animations.
   - Define styles for the welcome promo card: glassmorphism backdrop, badge, typography, button with pulse/glow.
   - Provide light theme variants ensuring optimal contrast and readability.
2. **JSX Integration in `frontend/src/App.jsx`**:
   - In `header-actions-right`: Add the `ufetch-header-pill`.
   - In the `!coursePath` empty state: Render the `ufetch-welcome-card`.
3. **Build & Quality Check**:
   - Run `npm run build --prefix frontend`.
   - Verify zero errors, proper responsiveness, and clean theme switching.

---

## 3. Risks & Mitigations
- **Risk**: Header crowding on smaller screen sizes.
  - **Mitigation**: Add a media query / responsive rule in CSS so text hides on very narrow screens (leaving the icon), or maintains a compact flex footprint without shrinking other controls.
- **Risk**: Light theme contrast issues.
  - **Mitigation**: Specifically test and style `.light-theme .ufetch-header-pill` and `.light-theme .ufetch-welcome-card` with dark-text/solid-border definitions.
- **Risk**: Electron window navigation hijacking.
  - **Mitigation**: `target="_blank"` with `rel="noopener noreferrer"`. Electron's `setWindowOpenHandler` in `electron/main.js` already explicitly verifies `isExternalUrl(url)` and uses `shell.openExternal(url)`.

---

## 4. Verification Checkpoints
- **Checkpoint 1**: Vite production build (`npm run build --prefix frontend`) passes.
- **Checkpoint 2**: Header pill is visible, attractive, and fits cleanly alongside other header action buttons.
- **Checkpoint 3**: Welcome promo card is displayed when no course is active and looks polished.
- **Checkpoint 4**: External browser opens to `https://www.ufetch.app/` when clicked.
