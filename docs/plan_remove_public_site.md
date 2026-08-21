# Plan: Remove Public Site

We will relocate `public-site/screenshot.png` to `docs/screenshot.png`, update the screenshot link in `README.md`, remove the `public-site/` folder, and delete `.github/workflows/deploy-pages.yml`.

## Step 1: Relocate Screenshot Asset
- Copy `public-site/screenshot.png` to `docs/screenshot.png`.
- Update line 6 of `README.md` to reference `./docs/screenshot.png` instead of `./public-site/screenshot.png`.

## Step 2: Remove Public Site Folder & Files
- Delete `public-site/` directory and all contained files (`index.html`, `index.css`, `privacy.html`, `terms.html`, `screenshot.png`, `telegram.jpg`).

## Step 3: Remove Deployment Workflow
- Delete `.github/workflows/deploy-pages.yml`.

## Step 4: Verification
- Verify `docs/screenshot.png` exists and `README.md` renders image correctly.
- Verify `public-site` and `deploy-pages.yml` no longer exist in git index or filesystem.
- Run `npm run dev` / verify project health.
