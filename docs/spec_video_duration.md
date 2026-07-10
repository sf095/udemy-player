# Spec: Video Duration Scan and Display

## Objective
Implement a feature that scans the duration of video lessons on the backend and displays both the individual video lengths and the aggregated course/section durations in the sidebar. This helps users understand the time commitment of each lesson and section, and track their overall progress more precisely.

## Assumptions
1. **No External Dependencies for Scanning**: The backend will extract duration directly from `.mp4` and `.m4v` files by parsing the binary headers (the `mvhd` atom in the `moov` container), avoiding external dependencies like `ffprobe` or `ffmpeg` which might not be installed on user systems.
2. **Metadata Fallback/Caching**: Since scanning files takes a small amount of file system time, we can scan them on-the-fly during course scanning. As parsing the `mvhd` box only requires reading a few bytes and doing simple seeks, it is extremely fast and will not cause noticeable lag.
3. **Formatted UI Display**: 
   - Individual lesson items will display their duration (e.g., `05:12` or `1:20:15`) next to the lesson title or subtitle in a muted color.
   - Section headers will display the total duration of the section (e.g., `12m 45s` or `2h 15m`).
   - The main sidebar header will show the total duration of the entire course.
4. **Non-video Lessons**: Quizzes, PDFs, and HTML lessons will not have a video duration, and their duration will be ignored or displayed as N/A (or not displayed).

## Tech Stack
- React (Vite-based frontend)
- Node.js / Express (Backend)
- Vanilla CSS / Lucide React

## Commands
- Dev (Concurrently starts frontend and backend): `npm run dev`
- Build (Production): `npm run build`
- Install: `npm run install:all`

## Project Structure
- [scanner.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/scanner.js) - Extends the course scanner to extract video durations.
- [Sidebar.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/Sidebar.jsx) - Displays lesson durations, section totals, and overall course total.
- [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css) - Contains styles for duration badges and text in the sidebar.

## Code Style
- Clean, modular ES6 JavaScript for backend box parsing.
- React components using functional styles and semantic HTML.
- Proper time formatting helper (e.g. mapping raw seconds to readable strings).

Example of pure JS MP4/M4V duration extractor:
```javascript
const fs = require('fs');

function getMp4Duration(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const stat = fs.fstatSync(fd);
    let offset = 0;
    const buf = Buffer.alloc(16);

    while (offset < stat.size) {
      const bytesRead = fs.readSync(fd, buf, 0, 8, offset);
      if (bytesRead < 8) break;

      const size = buf.readUInt32BE(0);
      const type = buf.toString('ascii', 4, 8);

      let headerSize = 8;
      let actualSize = size;
      if (size === 1) {
        fs.readSync(fd, buf, 0, 8, offset + 8);
        const high = buf.readUInt32BE(0);
        const low = buf.readUInt32BE(4);
        actualSize = high * 0x100000000 + low;
        headerSize = 16;
      } else if (size === 0) {
        actualSize = stat.size - offset;
      }

      if (type === 'moov') {
        offset += headerSize;
      } else if (type === 'mvhd') {
        const mvhdBuf = Buffer.alloc(32);
        fs.readSync(fd, mvhdBuf, 0, 32, offset + headerSize);
        const version = mvhdBuf.readUInt8(0);
        let timescale = 0;
        let duration = 0;

        if (version === 1) {
          timescale = mvhdBuf.readUInt32BE(20);
          const durHigh = mvhdBuf.readUInt32BE(24);
          const durLow = mvhdBuf.readUInt32BE(28);
          duration = durHigh * 0x100000000 + durLow;
        } else {
          timescale = mvhdBuf.readUInt32BE(12);
          duration = mvhdBuf.readUInt32BE(16);
        }

        if (timescale > 0) {
          return Math.round(duration / timescale);
        }
        break;
      } else {
        offset += actualSize;
      }
    }
  } catch (err) {
    console.error(`Error reading MP4 duration for ${filePath}:`, err);
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch (e) {}
    }
  }
  return null;
}
```

## Testing Strategy
1. **Unit Testing**: Run the `getMp4Duration` parser on some sample `.m4v` / `.mp4` files from the user's active course and print the output.
2. **API Verification**: Call the `/api/course-content` API and verify that each lesson with a video contains a `duration` field (in seconds).
3. **UI Verification**:
   - Check that individual lesson items display their formatted duration next to or below their title.
   - Check that section stats show the total section duration (e.g., `3/4 completed • 45m 12s`).
   - Check that the course header shows the total course duration (e.g., `Course Content (8h 45m)`.
   - Ensure styling is clean and follows premium aesthetics.

## Boundaries
- **Always do**: Handle cases where file reads fail gracefully, falling back to a null or 0 duration.
- **Ask first**: Installing massive binary npm packages for media scanning.
- **Never do**: Read the entire video file into memory (which would crash node on large files).

## Success Criteria
- [ ] Backend scans and extracts video duration successfully in pure JS from MP4/M4V files.
- [ ] API `/api/course-content` returns `duration` field (seconds) for video lessons.
- [ ] Sidebar displays formatted video duration next to lesson titles.
- [ ] Section summaries in the sidebar show the aggregate duration of all videos in the section.
- [ ] Sidebar header displays the total aggregate duration of all videos in the course.

## Open Questions
- None.
