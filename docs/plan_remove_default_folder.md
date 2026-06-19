# Plan: Remove Default Course Folder on Startup

We will update both the backend database access functions and the frontend components to handle a blank or missing course directory path gracefully.

## Step 1: Backend Updates (`backend/server.js`)
- Modify `readDb()`:
  - Replace the default path string with `''`.
  - Check if the loaded `activeCoursePath` exists on disk via `fs.existsSync()`. If it does not exist, set it to `''`.
  - Filter `history` elements so they only contain directories that currently exist on disk.
- Modify `/api/course-content` API:
  - Return `{ success: false, error: 'No course folder selected.' }` early if `coursePath` is falsy, instead of letting `scanCourseFolder` fail.

## Step 2: Frontend Updates (`frontend/src/App.jsx` and components)
- Modify `App.jsx`:
  - Guard `fetchCourseContent` to exit early when `path` is empty or null, clearing any sections/errors.
  - In the stage rendering block, check if `coursePath` is empty. If it is, display a welcoming, descriptive "Welcome to Udemy Offline Player! Please select a course directory..." message instead of the generic "Ready to Learn?" or an error.
- Modify `Sidebar.jsx`:
  - Handle the case where `sections` array is empty by displaying a friendly message ("No course folder selected or folder is empty").

## Step 3: Verification
- Verify the build and run local check.
- Remove/rename any existing local DB `progress_db.json` temporarily to simulate first-time load, then confirm the user is greeted with the welcome screen.
- Verify selecting a folder loads course content correctly.
