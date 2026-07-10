# Spec: MKV File Support

## Objective
Enable support for scanning and playing `.mkv` (Matroska) video files in the Udemy Offline Player. Since Chromium/Electron does not natively support the `.mkv` container, the application will detect `.mkv` files, dynamically remux or transcode them using the local `ffmpeg` installation to a temporary `.mp4` file in the OS temp directory, and stream the resulting `.mp4` with full seek/range request capabilities.

## Assumptions & Architecture
1. **Local FFmpeg & FFprobe Availability**: We assume `ffmpeg` and `ffprobe` are installed on the host system and available in the system PATH. This has been verified on the target system.
2. **Codec-Aware Remuxing vs Transcoding**:
   - If the `.mkv` file contains H.264 video and AAC/MP3 audio streams (standard for Udemy downloads), we perform a fast container remux (`-c copy`), which takes less than 1 second.
   - If the video uses an incompatible codec (e.g., HEVC/H.265), we perform full transcoding to H.264/AAC to ensure compatibility with Chromium.
3. **Caching Strategy**:
   - Remuxed/transcoded files are stored in the operating system's temp directory (`os.tmpdir()`) under a unique filename format (e.g., `udemy-player-[md5-hash-of-path].mp4`).
   - If the temp file already exists and its creation timestamp is newer than the source `.mkv` modification time, we skip remuxing and serve it immediately.
4. **Synchronous Scanning**:
   - The scanner in `backend/scanner.js` will extract video durations for `.mkv` files using `ffprobe` synchronously during the scanning phase (since the scanner runs synchronously).

## Tech Stack
- **Backend**: Node.js, Express, `child_process` (`execSync`, `spawn`), `os`
- **Video Processing**: FFmpeg (v8.1.1+) & FFprobe (v8.1.1+)
- **Frontend**: React / HTML5 Video Element (no changes required to the player itself)

## Commands
- Start development (both backend and frontend): `npm run dev`
- Run scanner verification manually: `node backend/scanner.js` (we can create a scratch test script to verify scanning)

## Project Structure
- `backend/scanner.js` -> Updated to scan for `.mkv` files and extract their duration using `ffprobe`.
- `backend/server.js` -> Updated to check for `.mkv` files in `/api/stream`, remux/transcode them to the temp directory on-the-fly, and stream the resulting `.mp4`.
- `docs/spec_mkv_support.md` -> This specification.
- `docs/plan_mkv_support.md` -> The implementation plan.
- `docs/tasks_mkv_support.md` -> The task list.

## Code Style
Match existing JavaScript / Node.js style in the backend:
```javascript
const { execSync } = require('child_process');
const crypto = require('crypto');
const os = require('os');
```

## Testing Strategy
Since the project lacks automated test suites, testing will be done manually:
1. **Scanning Verification**: Check that directories containing `.mkv` files are scanned correctly, lessons are created as video files, and duration is successfully retrieved using `ffprobe`.
2. **Streaming Verification**: Verify playing a `.mkv` file in the frontend, checking that:
   - Play/pause/seeking work smoothly.
   - The video plays with audio.
   - Subtitles are successfully aligned.
   - The file is cached in the OS temp directory and subsequent plays load instantly.

## Boundaries
- **Always**: Keep clean title formatting and subtitle mappings working.
- **Ask first**: Running long transcodes in the foreground (we will add a loader state or let standard fetch wait, remuxing is near-instant anyway).
- **Never**: Edit `.mkv` source files or delete user-downloaded courses.

## Success Criteria
- [ ] The folder scanner successfully identifies `.mkv` files as video lessons.
- [ ] Scanned `.mkv` lessons have correct durations displayed in the sidebar.
- [ ] Clicking a `.mkv` lesson plays it natively in the frontend player.
- [ ] Seeking and playback speed controls work perfectly for `.mkv` lessons.
- [ ] Temp files are cleaned up or stored in a way that doesn't leak memory indefinitely.

## Open Questions / Assumptions
- **Assumption 1**: The user's files are mostly DRM-free and can be parsed by FFmpeg.
- **Assumption 2**: Performance of `execSync` during scanning is acceptable for the user. We will only call `ffprobe` for `.mkv` files, keeping `.mp4` and `.m4v` scans near-instant.
