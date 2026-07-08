# Tasks: Remove chapters.json from Companion Resources

This document lists the specific tasks required to complete this change.

- [x] Task 1: Update companion resources filter in backend scanner
  - Acceptance: `backend/scanner.js` correctly filters out any scanned file ending in `.chapters.json` (case-insensitive) when identifying companion resources.
  - Verify: Look at the filter conditions in `backend/scanner.js`.
  - Files: [backend/scanner.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/scanner.js)

- [x] Task 2: Verify course player functionality manually
  - Acceptance: Start the course player, load a course containing `.chapters.json` files. Verify that the files do not appear as companion resources (no PDF/JSON/HTML tab or badge for them), and verify that timeline chapters are still loaded properly from the same `.chapters.json` cache.
  - Verify: Run `npm run dev` to start the app, load the course, check the UI and timeline.
  - Files: None.
