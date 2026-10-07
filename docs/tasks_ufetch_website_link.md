# Tasks: U-Fetch Website URL Integration (https://www.ufetch.app/)

- [x] Task 1: Add CSS styling for U-Fetch header pill and welcome promo card in `frontend/src/index.css`
  - Acceptance: CSS rules for `.ufetch-header-pill`, `.ufetch-welcome-card`, badges, CTA buttons, hover states, and `.light-theme` overrides are defined.
  - Verify: CSS syntax is valid and variables align with existing design system.
  - Files: `frontend/src/index.css`

- [x] Task 2: Implement U-Fetch header pill in `frontend/src/App.jsx`
  - Acceptance: The `⚡ ufetch.app ↗` pill link is rendered in `.header-actions-right` with appropriate icons, tooltips, and attributes (`target="_blank"`).
  - Verify: `npm run build --prefix frontend` succeeds without JSX errors.
  - Files: `frontend/src/App.jsx`

- [x] Task 3: Implement U-Fetch promo card on the welcome screen in `frontend/src/App.jsx`
  - Acceptance: When no course is loaded (`!coursePath`), an attractive promo card is displayed highlighting U-Fetch and linking to `https://www.ufetch.app/`.
  - Verify: `npm run build --prefix frontend` passes.
  - Files: `frontend/src/App.jsx`

- [x] Task 4: End-to-end verification and testing
  - Acceptance: All links open `https://www.ufetch.app/`, header remains responsive, both light and dark themes render cleanly, and production build completes with 0 errors.
  - Verify: Run `npm run build --prefix frontend` and review DOM/styles.
  - Files: `frontend/src/App.jsx`, `frontend/src/index.css`
