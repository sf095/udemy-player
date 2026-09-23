# Spec: Mark Video as No Subtitle When Subtitle File is Zero Bytes

## Objective
When a video lesson has a subtitle file (`.srt` or `.vtt`) that is zero bytes in size (e.g., from an interrupted download, empty dummy file, or corrupted extraction), the course scanner currently still associates this file with the lesson. As a consequence, the application assumes a subtitle track exists, displays the language button (e.g., `EN`), hides the "No subtitles" indicator, and triggers downstream failures when attempting to render subtitles, auto-generate timeline chapters, or summarize with AI.

The objective is to ensure that any subtitle file with a file size of zero bytes (`0` bytes) is discarded/ignored during course scanning. If a video lesson has only zero-byte subtitle file(s), it must be marked as having no subtitles (`subtitles: {}`, `subtitle: null`), so the frontend accurately displays the "No subtitles" indicator (`CaptionsOff` icon) and downstream features correctly treat the lesson as having no subtitles.

## Assumptions
1. **Scope of "Zero Bytes"**: A subtitle file is considered zero bytes if its file size on disk is exactly `0` bytes (`fs.statSync(file).size === 0`).
2. **File Preservation**: The scanner must ignore zero-byte subtitle files in memory without deleting or modifying files on the user's filesystem.
3. **Multi-Subtitle Handling**: If a lesson has multiple subtitle tracks (e.g., `en.srt` is 0 bytes, but `vi.srt` is 1,200 bytes), the zero-byte track is ignored while the valid track is retained. If all tracks are 0 bytes, `subtitles` is empty (`{}`) and `subtitle` is `null`.
4. **UI Integration**: `VideoPlayer.jsx` already possesses the `no-subtitles-indicator` (`CaptionsOff` icon and "No subtitles" chip) when `availableLangs.length === 0`. Excluding 0-byte subtitles from the backend scanner automatically activates this existing indicator.

## Tech Stack
- Backend: Node.js (CommonJS), Express, `fs` / `path` modules
- Frontend: React 19, Vite, Lucide React
- Verification: Node.js automated test script (`backend/scratch/verify_zero_byte_subtitles.js`)

## Commands
- **Run Verification Tests**: `node backend/scratch/verify_zero_byte_subtitles.js`
- **Build Frontend**: `npm run build --prefix frontend`
- **Lint Frontend**: `npm run lint --prefix frontend`
- **Dev Backend**: `npm run backend`
- **Dev App**: `npm run dev`

## Project Structure
- `backend/scanner.js`: Folder scanner and lesson aggregator; checks file size and filters out 0-byte `.srt` / `.vtt` files.
- `backend/server.js`: API server; `/api/subtitle` endpoint includes defensive check returning 404 if a 0-byte file is requested.
- `frontend/src/components/VideoPlayer.jsx`: Defensive filtering for `availableLangs` to ensure null or empty subtitle entries are ignored.
- `backend/scratch/verify_zero_byte_subtitles.js`: Standalone test suite verifying scanner and endpoint behavior with 0-byte subtitle files.
- `docs/spec_zero_byte_subtitles.md`: This specification document.

## Code Style
Match existing CommonJS pattern in `backend/scanner.js`:
```javascript
// In backend/scanner.js during file iteration:
const stat = fs.statSync(fullFilePath);
if (stat.isDirectory()) continue;

groups[prefix].push({
  name: file,
  ext: path.extname(file).toLowerCase(),
  fullPath: fullFilePath,
  size: stat.size
});

// During subtitle processing:
} else if (file.ext === '.srt' || file.ext === '.vtt') {
  // Ignore zero-byte subtitle files so video is marked as having no subtitles
  if (file.size === 0) {
    continue;
  }
  const lang = getSubtitleLanguage(file.name);
  if (!subtitles[lang]) {
    subtitles[lang] = file.fullPath;
  }
}
```

## Testing Strategy
1. **Automated Verification Script (`backend/scratch/verify_zero_byte_subtitles.js`)**:
   - Create a temporary course structure with various fixture scenarios:
     - **Case 1 (Zero-byte subtitle only)**: Video file with a 0-byte `.srt` file. Verify `lesson.subtitles` is `{}` and `lesson.subtitle` is `null`.
     - **Case 2 (Valid subtitle only)**: Video file with a non-empty `.srt` file (>0 bytes). Verify `lesson.subtitles` has `en` and `lesson.subtitle` is populated.
     - **Case 3 (Mixed subtitles)**: Video file with a 0-byte `en.srt` and a non-empty `vi.srt`. Verify `en` is excluded, `vi` is retained, and `lesson.subtitle` points to `vi`.
     - **Case 4 (Duplicate with zero-byte first)**: Video with a 0-byte `en.srt` and a valid `en.vtt`. Verify the valid `en.vtt` is selected.
     - **Case 5 (`/api/subtitle` defense)**: Requesting a 0-byte subtitle path yields a 404 status.
2. **Frontend Build Verification**:
   - Run `npm run build --prefix frontend` to confirm zero compilation errors.

## Boundaries
- **Always**:
  - Safely obtain file size (`stat.size`) without breaking on file stat errors.
  - Keep existing subtitle discovery intact for all non-empty `.srt` and `.vtt` files.
  - Ensure zero regressions to video playback, timeline generation, or AI features for lessons with valid subtitles.
- **Ask first**:
  - Modifying or deleting any file on disk.
  - Altering handling for other zero-byte files (e.g. videos or PDFs).
- **Never**:
  - Silently swallow genuine non-empty subtitles.
  - Add external dependencies when Node's native `fs.statSync` suffices.

## Success Criteria
- [ ] Any `.srt` or `.vtt` file with `size === 0` is omitted from `subtitles` dictionary in `scanCourseFolder()`.
- [ ] If all subtitles for a lesson are 0 bytes, `lesson.subtitles` is `{}` and `lesson.subtitle` is `null`.
- [ ] In the frontend player, a video with 0-byte subtitles renders the `CaptionsOff` "No subtitles" indicator.
- [ ] The automated test script `backend/scratch/verify_zero_byte_subtitles.js` passes 100%.
- [ ] `npm run build --prefix frontend` succeeds without errors.

## Open Questions
1. **Whitespace-only Subtitles**: Should subtitle files that are greater than 0 bytes but contain only whitespace or zero subtitle cues also be treated as no subtitle during scan?
   - *Recommendation*: Keep scanner check strictly at `size === 0` to preserve scanning speed (does not require reading file contents into memory for hundreds of lessons). Downstream cue parsers already handle empty cue files safely.
2. **User File Modification**: Should 0-byte subtitle files be deleted or renamed?
   - *Recommendation*: No. Files on the user's disk must never be altered or deleted by the scanner.
