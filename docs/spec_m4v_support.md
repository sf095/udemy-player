# Spec: M4V File Support

## Objective
Enable support for playing `.m4v` video files in the Udemy Player. This will allow users to scan course directories containing `.m4v` video files (e.g., photography masterclasses, tutorials) and watch/seek them natively.

## Tech Stack
- **Frontend**: React / HTML5 Video Element
- **Backend**: Node.js / Express
- **Platform**: Electron (Desktop) / Browser

## Commands
- Start development (both backend and frontend): `npm run dev`
- Start backend: `npm run backend`
- Start frontend: `npm run frontend`

## Project Structure
- `backend/scanner.js` -> Scans the directory for course sections, lessons, and resources.
- `backend/server.js` -> Express backend serving the streamed video content and parsing range requests.
- `frontend/src/components/VideoPlayer.jsx` -> Core player component.

## Code Style
Match existing JS / Node.js style. For example, when checking file extensions:
```javascript
if (file.ext === '.mp4' || file.ext === '.m4v') {
  videoFile = file;
}
```

## Testing Strategy
Since the project lacks automated test suites, testing will be done manually:
1. Scanning verification: Confirm scanner properly identifies `.m4v` files as lessons of type `video`.
2. Streaming verification: Confirm standard range-based streaming handles `.m4v` files, including seeking.

## Boundaries
- **Always**: Keep clean title formatting and subtitle mappings working.
- **Ask first**: Integrating third-party transcoding libraries (e.g. FFmpeg) if DRM/playback issues occur.
- **Never**: Skip checks or remove supported formats (like `.mp4`).

## Success Criteria
- Courses containing `.m4v` files are parsed correctly.
- Lessons with `.m4v` files display in the sidebar as video lessons.
- Clicking a `.m4v` lesson plays the video with full controls (play, pause, seeking).
- Subtitles (SRT/WebVTT) are associated and loaded correctly for `.m4v` videos.

## Open Questions / Assumptions
- **Assumption 1**: The `.m4v` files are standard H.264/AAC videos without DRM.
- **Assumption 2**: Chrome/Safari/Electron HTML5 video engines natively play DRM-free `.m4v` files if served as `video/mp4` MIME type.
