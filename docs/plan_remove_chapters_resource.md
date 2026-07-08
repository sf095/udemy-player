# Plan: Remove chapters.json from Companion Resources

This document outlines the step-by-step implementation plan for removing `chapters.json` files from companion resources list.

## 1. Components and Dependencies
- **Component**: `backend/scanner.js` (specifically the file filtering condition in `scanCourseFolder`).
- **Dependencies**: None. The changes are completely self-contained within the backend scanner module.

## 2. Implementation Order
1. **Modify Backend Scanner**: Update `backend/scanner.js` to filter out files ending with `.chapters.json` from the scanned companion resources.
2. **Verification & Testing**: Start the application and test manually.

## 3. Risks & Mitigations
- **Risk**: Over-filtering files that the user actually wanted to see.
- **Mitigation**: Only filter files where the name ends with `.chapters.json` (case-insensitive). Regular `.json` files (like quizzes or other resources) should not be filtered unless they match the specific `.chapters.json` suffix.
- **Risk**: Timeline chapters feature breaking.
- **Mitigation**: The timeline/chapters logic retrieves chapters via `/api/chapters` which resolves files on disk using the video file prefix and does not depend on the companion `resources` scanned list. We will manually verify the timeline works correctly.

## 4. Parallel vs. Sequential Work
- The task is very small and sequential, requiring changes in only one file (`backend/scanner.js`).

## 5. Verification Checkpoints
- **Checkpoint 1 (Code Change)**: Ensure `backend/scanner.js` includes the check `!file.name.toLowerCase().endsWith('.chapters.json')`.
- **Checkpoint 2 (Local Run)**: Start the server and verify no console errors are thrown during startup/scan.
- **Checkpoint 3 (UI Check)**: Verify that no `.chapters.json` files appear in the sidebar badge count or resources viewer.
- **Checkpoint 4 (Timeline Check)**: Verify that chapters still load properly on the video timeline.
