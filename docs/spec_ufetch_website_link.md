# Spec: U-Fetch Website URL Integration (https://www.ufetch.app/)

## Objective
Integrate the official website URL (`https://www.ufetch.app/`) into the Udemy Offline Player application in an attractive, prominent, and seamless way so that users can easily discover, visit, and download courses from U-Fetch. All external links open directly in the user's default browser.

---

## Tech Stack
- **Frontend**: React 19, Vite 8, Lucide React icons
- **Desktop Wrapper**: Electron v42.4.1 (with `shell.openExternal` handling external links)
- **Styling**: Vanilla CSS with CSS custom properties supporting dark and light themes

---

## Commands
- **Install dependencies**: `npm install`
- **Run dev server**: `npm run dev` (or `npm run dev:desktop` for Electron desktop mode)
- **Build frontend**: `npm run build --prefix frontend`
- **Run linter**: `npm run lint --prefix frontend`

---

## Project Structure
- `frontend/src/App.jsx` — Main application layout; hosts the Header bar and Welcome/Empty state stage.
- `frontend/src/index.css` — Theme variables, layout, header styling, and responsive badge styles.
- `docs/spec_ufetch_website_link.md` — This specification document.
- `docs/plan_ufetch_website_link.md` — Implementation plan (Phase 2).
- `docs/tasks_ufetch_website_link.md` — Task checklist (Phase 3).

---

## UI / UX Design & Placements

### 1. App Header (Always Visible)
- **Location**: In `header-actions-right` (before the sidebar collapse toggle and theme button).
- **Label**: `⚡ ufetch.app` with an external link indicator `↗` (`ExternalLink` icon).
- **Styling**:
  - Pill button with modern electric blue / indigo gradient background:
    `background: linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(99, 102, 241, 0.22) 100%)`
  - Border: `1px solid rgba(99, 102, 241, 0.4)`
  - Text & Icon Color: `#38bdf8` to `#818cf8` gradient or crisp `#60a5fa`
  - Hover state: Slight lift (`transform: translateY(-1px)`), glow shadow (`box-shadow: 0 0 12px rgba(99, 102, 241, 0.35)`), brighter border.
  - Light theme adaptation: High-contrast indigo/blue styling with crisp visibility on light background.
  - Tooltip: `"Download & archive premium online courses at ufetch.app"`.

### 2. Welcome / Empty State Screen (When No Course is Loaded)
- **Location**: Center stage panel when `!coursePath`.
- **Styling**:
  - A modern glassmorphism promo card placed right below the initial course folder description.
  - Highlights:
    - Glowing badge: `"⚡ OFFICIAL COURSE SOURCE"`
    - Heading: `"Need online courses to learn offline?"`
    - Subtitle: `"Download premium courses on-demand with instant delivery at only $2 on U-Fetch."`
    - Action Button: Gradient CTA button `"Visit ufetch.app ↗"` with hover glow that opens `https://www.ufetch.app/`.

### 3. External Link Behavior
- Rendered with `<a href="https://www.ufetch.app/" target="_blank" rel="noopener noreferrer">`.
- Handled seamlessly by Electron's `setWindowOpenHandler` to open in the system default browser.

---

## Code Style
React functional component syntax adhering to the existing codebase patterns.
Example snippet:
```jsx
<a
  href="https://www.ufetch.app/"
  target="_blank"
  rel="noopener noreferrer"
  className="ufetch-header-pill"
  title="Download & archive premium courses at ufetch.app"
>
  <span className="ufetch-pill-icon">⚡</span>
  <span className="ufetch-pill-text">ufetch.app</span>
  <ExternalLink size={13} className="ufetch-pill-ext" />
</a>
```

---

## Testing Strategy
- **Build verification**: `npm run build --prefix frontend` succeeds with zero errors.
- **Manual verification**:
  1. Verify the header pill is clearly visible and aligned on all screens.
  2. Verify hover animations and tooltips.
  3. Verify theme switching (dark and light themes both have attractive contrast).
  4. Verify the welcome screen card renders gracefully without breaking the layout.
  5. Verify clicking opens `https://www.ufetch.app/` externally in the browser.

---

## Boundaries
- **Always**: Open external URL in default system browser.
- **Always**: Ensure full compatibility with both Dark and Light themes.
- **Always**: Keep styles responsive so they don't break the layout on smaller windows.
- **Never**: Hardcode styles that break in light theme.
- **Never**: Displace existing header controls (course loader, theme switch, settings, progress bar).

---

## Success Criteria
- [ ] Prominent and attractive `⚡ ufetch.app ↗` pill button in the app header.
- [ ] Modern, attractive promo card on the welcome screen.
- [ ] Opens `https://www.ufetch.app/` in external browser.
- [ ] Full dark and light theme support.
- [ ] Clean Vite build (`npm run build --prefix frontend`).
