# Tasks: Mark Video as No Subtitle When Subtitle File is Zero Bytes

- [x] Task 1: Create automated test script `backend/scratch/verify_zero_byte_subtitles.js`
  - **Acceptance**: Script establishes mock fixtures for all 5 test scenarios (0-byte subtitle only, valid subtitle only, mixed subtitles, duplicate with 0-byte first, and endpoint defense).
  - **Verify**: `node backend/scratch/verify_zero_byte_subtitles.js`
  - **Files**: `backend/scratch/verify_zero_byte_subtitles.js`

- [x] Task 2: Update `backend/scanner.js` to ignore 0-byte subtitle files
  - **Acceptance**: Scanner stores `size` on grouped files and skips subtitle files where `file.size === 0`. If all subtitles for a lesson are 0 bytes, `subtitles` is `{}` and `subtitle` is `null`.
  - **Verify**: `node backend/scratch/verify_zero_byte_subtitles.js`
  - **Files**: `backend/scanner.js`

- [x] Task 3: Add defensive 0-byte check to `/api/subtitle` in `backend/server.js`
  - **Acceptance**: Endpoint checks `stat.size === 0` and returns 404 with descriptive error message if requested for a 0-byte file.
  - **Verify**: `node backend/scratch/verify_zero_byte_subtitles.js`
  - **Files**: `backend/server.js`

- [x] Task 4: Add defensive truthy filtering to `VideoPlayer.jsx`
  - **Acceptance**: `availableLangs` and active language synchronization filter out nullish/empty subtitle paths so that `availableLangs.length === 0` renders the `CaptionsOff` indicator whenever subtitles are empty.
  - **Verify**: `npm run build --prefix frontend`
  - **Files**: `frontend/src/components/VideoPlayer.jsx`

- [x] Task 5: Run full test and build verification
  - **Acceptance**: All verification tests pass and frontend build succeeds with zero errors.
  - **Verify**: `node backend/scratch/verify_zero_byte_subtitles.js` && `npm run build --prefix frontend`
  - **Files**: none
