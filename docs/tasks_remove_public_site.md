# Tasks: Remove Public Site

- [x] **Task 1: Relocate screenshot asset and update README.md**
  - **Acceptance**: `public-site/screenshot.png` is copied to `docs/screenshot.png`. `README.md` image tag updated to point to `./docs/screenshot.png`.
  - **Verify**: `docs/screenshot.png` exists and `README.md` points to `./docs/screenshot.png`.
  - **Files**: `docs/screenshot.png`, `README.md`

- [x] **Task 2: Delete public-site directory and GitHub Pages workflow**
  - **Acceptance**: `public-site/` folder and `.github/workflows/deploy-pages.yml` file are completely deleted from filesystem and git index.
  - **Verify**: `ls public-site` and `ls .github/workflows/deploy-pages.yml` return non-zero exit code / file not found.
  - **Files**: `public-site/*`, `.github/workflows/deploy-pages.yml`

- [x] **Task 3: Verify codebase cleanliness and git status**
  - **Acceptance**: No broken references to `public-site` remain. Git status shows clean removal of `public-site/` and `.github/workflows/deploy-pages.yml`.
  - **Verify**: Run `git status` and search codebase for any lingering `public-site` references.
  - **Files**: Entire codebase
