# Spec: Remove Public Site

## Objective
Remove the legacy `public-site/` folder (landing page, static HTML/CSS/image files) and its deployment workflow from the repository. Relocate `screenshot.png` to `docs/screenshot.png` so `README.md` retains its screenshot image.

## Tech Stack
- Git / File System
- GitHub Actions workflow (`.github/workflows/deploy-pages.yml`)
- Markdown (`README.md`)

## Commands
- Verify Git Status: `git status`
- Run Dev App: `npm run dev`

## Project Structure
- `public-site/` → **Remove completely** (contains landing page HTML/CSS/assets)
- `docs/screenshot.png` → **Relocated from `public-site/screenshot.png`**
- `.github/workflows/deploy-pages.yml` → **Remove completely** (GitHub Pages deployment workflow)
- `README.md` → Update screenshot image path to `./docs/screenshot.png`

## Code Style
- Clean file deletion and minimal Markdown diffs matching existing formatting in `README.md`.

## Testing Strategy
- **Manual Verification**:
  1. Confirm `public-site/` directory is deleted.
  2. Confirm `docs/screenshot.png` exists and opens correctly.
  3. Confirm `.github/workflows/deploy-pages.yml` is deleted.
  4. Confirm `README.md` image link points to `./docs/screenshot.png`.
  5. Confirm `npm run dev` and `npm run package` still work cleanly.

## Boundaries
- **Always**: Keep `docs/` technical specifications and player frontend intact.
- **Never**: Touch `frontend/`, `backend/`, or `electron/` app logic.

## Success Criteria
- [x] Confirmed strategy: Relocate `screenshot.png` to `docs/screenshot.png`.
- [x] Directory `public-site/` and all its files are removed from the codebase.
- [x] `docs/screenshot.png` exists.
- [x] `.github/workflows/deploy-pages.yml` is removed.
- [x] `README.md` references `./docs/screenshot.png`.
- [x] Project builds and runs without errors.

## Open Questions / Assumptions
- All questions resolved.
