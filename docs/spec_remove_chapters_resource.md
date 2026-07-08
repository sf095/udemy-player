# Spec: Remove chapters.json from Companion Resources

## Objective
When the Udemy Player scans course folders, it treats any file that is not a video or a subtitle as a companion resource. Because the player dynamically generates and saves chapter files using the pattern `[video_name].chapters.json` in the course folders, these cached JSON files are incorrectly listed as companion resources (appearing in the sidebar resource badges and the companion resources viewer tabs). This spec outlines the removal of files matching `*.chapters.json` from the companion resources scanner.

## Tech Stack
- **Backend**: Node.js, Express, native file system (`fs`)
- **Frontend**: React (Vite), Vanilla CSS, Lucide icons

## Commands
- Dev (both backend and frontend concurrently): `npm run dev`
- Run Backend: `npm run dev --prefix backend`
- Run Frontend: `npm run dev --prefix frontend`
- Lint frontend: `npm run lint --prefix frontend`

## Project Structure
- `backend/scanner.js` - Contains the directory scanner function `scanCourseFolder`
- `backend/server.js` - Express API server serving resources and handling chapters
- `frontend/src/` - React frontend application

## Code Style
- Use ESM in frontend (`import/export`) and CommonJS in backend (`require/module.exports`).
- Follow standard JavaScript conventions with proper spacing, semicolons, and descriptive variable names.
- Example:
  ```javascript
  // backend/scanner.js pattern check
  if (file.name.toLowerCase().endsWith('.chapters.json')) {
    // skip chapters file
  }
  ```

## Testing Strategy
- **Manual Verification**: 
  1. Verify directory scanning excludes `[video_name].chapters.json` files.
  2. Verify that existing chapters files are not shown in the companion resources sidebar badge.
  3. Verify that chapters files do not appear in the "Companion Resources" list/tab.
  4. Verify that chapters still load correctly on the timeline.

## Boundaries
- **Always**: Ensure files ending in `.chapters.json` are completely filtered out in `backend/scanner.js`.
- **Never**: Break timeline/chapters functionality, which relies on locating the cached `[video_name].chapters.json` files in the backend server.
- **Ask first**: If any other `.json` files are in use that shouldn't be filtered out.

## Success Criteria
- [x] Any file with name ending with `.chapters.json` (case-insensitive) is NOT included in the `resources` array of a scanned lesson in `backend/scanner.js`.
- [x] The companion resource count badge in the sidebar does not include chapters files.
- [x] The "Companion Resources" tab does not show chapters files.
- [x] Timeline chapters function as expected, loading from/saving to `[video_name].chapters.json` cache behind the scenes.

## Open Questions
- None.
