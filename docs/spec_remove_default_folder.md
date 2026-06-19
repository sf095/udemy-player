# Spec: Remove Default Course Folder on Startup

## Objective
Provide a clean initial state for new users when opening the app for the first time. Instead of failing with a "Folder not found" error because of a hardcoded path (`Pianoforall...`), the application should show a premium and friendly initialization screen instructing the user to select their course folder. If the previously selected/saved folder does not exist on disk (e.g. moved or deleted), the app should also gracefully prompt the user to select a folder rather than showing a breaking error message.

## Tech Stack
- **Backend**: Node.js, Express, native file system (`fs`)
- **Frontend**: React (Vite), Tailwind-free Vanilla CSS, Lucide icons

## Proposed Changes
1. **Remove Hardcoded Path in Backend**:
   - Change the default course path value in `backend/server.js` from the hardcoded `/Users/hientranthanh/...` path to an empty string `''`.
   - Update `readDb()` to check if the stored `activeCoursePath` actually exists on disk. If not, reset it to `''`. This ensures users who don't have the original course folder won't see a "directory does not exist" error.
   - Filter `history` to exclude directories that no longer exist.
2. **API Endpoint Graceful Fallback**:
   - Update the `/api/course-content` endpoint to return success with empty/graceful values or a clear message if path is not specified.
3. **Frontend Welcome & Selection Guidance UI**:
   - Render a welcome state in the sidebar and stage panel when no course path is loaded, guiding the user to select/browse a folder.
   - Guard `fetchCourseContent` from running scan on empty strings.

## Success Criteria
- [ ] On first startup, the app loads successfully without "directory does not exist" or "folder not found" errors.
- [ ] The stage panel displays a premium "Welcome to Udemy Offline Player!" instruction box when no course folder is loaded.
- [ ] The sidebar shows a clean placeholder ("No course folder selected or folder is empty") instead of empty space.
- [ ] If a user enters or selects a course path that does not exist, the app shows an informative error, but if the path is reset or empty, it reverts to the welcome state.
- [ ] The history list in `CourseSelector` only displays folders that exist on disk.

## Boundaries
- **Always**: Ensure file existence checks use synchronous/non-blocking calls where appropriate, or handle exceptions cleanly.
- **Never**: Hardcode specific local paths of the developer's environment in backend logic as fallbacks.
- **Ask First**: Modifying existing database layout if it affects progress or notes tables.
