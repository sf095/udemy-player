# Plan: Mark Video as No Subtitle When Subtitle File is Zero Bytes

## Major Components and Dependencies
1. **Course Scanner (`backend/scanner.js`)**:
   - Reads file stats (`fs.statSync`) and stores file size on grouped file records.
   - In the subtitle processing loop (`.srt`, `.vtt`), ignores files where `file.size === 0`.
   - Result: Lessons with only 0-byte subtitle file(s) produce `subtitles: {}` and `subtitle: null`.
2. **API Server (`backend/server.js`)**:
   - `/api/subtitle` provides a defensive check: if `fs.statSync(subtitlePath).size === 0`, responds with 404.
3. **Frontend Player (`frontend/src/components/VideoPlayer.jsx`)**:
   - Defensive filtering in `availableLangs` and language-sync effect to ignore any falsy subtitle paths (`Object.keys(subtitles || {}).filter(lang => Boolean(subtitles[lang]))`).
4. **Automated Verification Suite (`backend/scratch/verify_zero_byte_subtitles.js`)**:
   - Regression and unit verification using temporary course fixtures.

## Implementation Order
1. **Step 1: Automated Verification Test Setup**:
   - Write test script `backend/scratch/verify_zero_byte_subtitles.js` reproducing current behavior (failing before fix, passing after fix).
2. **Step 2: Scanner Updates (`backend/scanner.js`)**:
   - Store `size` during `fs.statSync`.
   - Skip 0-byte subtitle files when populating `subtitles[lang]`.
3. **Step 3: Server Defensive Check (`backend/server.js`)**:
   - Add size verification to `/api/subtitle`.
4. **Step 4: Frontend Defensive Check (`frontend/src/components/VideoPlayer.jsx`)**:
   - Filter `availableLangs` on truthy values.
5. **Step 5: Full Verification & Build**:
   - Execute test suite and verify 100% pass rate.
   - Run `npm run build --prefix frontend`.

## Risks and Mitigation
- **Risk**: `fs.statSync` throws if a file is deleted or has permission issues between `readdirSync` and `statSync`.
  - **Mitigation**: Wrap stat check in a safe helper or try/catch.
- **Risk**: A lesson with both a 0-byte `en.srt` and a non-empty `en.vtt` could accidentally skip the valid file if duplicate prevention runs before size check.
  - **Mitigation**: Filter out `file.size === 0` before checking `!subtitles[lang]`, so the scanner evaluates subsequent files for the same language.

## Verification Checkpoints
- **Checkpoint 1**: `node backend/scratch/verify_zero_byte_subtitles.js` passes all 5 test scenarios.
- **Checkpoint 2**: `npm run build --prefix frontend` succeeds without compilation errors or warnings.
