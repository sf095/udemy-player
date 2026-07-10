# Plan: MKV File Support

This plan outlines the technical steps to implement `.mkv` support in the Udemy Offline Player.

## Major Components and Dependencies
1. **Directory Scanner (`backend/scanner.js`)**:
   - Treat `.mkv` as a valid video file extension.
   - Implement `getMkvDuration` helper using `ffprobe` synchronously via `execSync` to extract video durations of Matroska files.
2. **Streaming Server (`backend/server.js`)**:
   - Implement `ensureMp4Cached(mkvPath)` helper:
     - MD5 hash of absolute path to avoid collision.
     - Output to OS temp directory (`os.tmpdir()`).
     - Optimize: Remux (`-c copy`) if video stream is already H.264; transcode (`-c:v libx264`) only if codec is incompatible.
   - Intercept `/api/stream` requests for `.mkv` paths:
     - Run `ensureMp4Cached(videoPath)`.
     - Use the cached `.mp4` file path for the standard seek-enabled stream.

## Implementation Order
1. **Develop duration extraction & scanner updates**:
   - Add `.mkv` to list of video extensions in `backend/scanner.js`.
   - Implement and test `getMkvDuration` using `ffprobe`.
2. **Develop transcoding/remuxing caching logic**:
   - Write `ensureMp4Cached` helper in `backend/server.js`.
   - Update `/api/stream` endpoint.
3. **Verify and test**:
   - Run manual tests with a mock course directory structure and mock `.mkv` files.

## Risks and Mitigation
- **Risk**: `ffprobe` / `ffmpeg` commands blocking the single-threaded Node.js event loop on long transcoding.
  - *Mitigation*: Udemy downloads are almost exclusively H.264 video, making remuxing near-instant (<1 second). For other codecs, standard synchronous `execSync` execution will block, but this is a local single-user app where a short pause during transcoding initiation is acceptable. We can log progress and print warnings to terminal.
- **Risk**: Incomplete transcodes served to the client.
  - *Mitigation*: Transcode to a temporary file (`.tmp`) first and rename/move it to `.mp4` only upon successful completion. This guarantees that if a process is interrupted, the client won't try to stream a corrupted, half-written file.
- **Risk**: Temp directory filling up.
  - *Mitigation*: We rely on the OS automatic cleanup of the temp folder. Since these are course files, they will stay cached while active, and the OS will clear them during normal reboot/maintenance.

## Verification Checkpoints
- **Checkpoint 1**: Running the scanner on a directory containing `.mkv` returns the correct chapters/lessons list, with `.mkv` recognized as video lessons and showing correct durations.
- **Checkpoint 2**: Requesting `/api/stream` with a `.mkv` path correctly remuxes the file, caches it, and streams it as an `.mp4` supporting HTTP range requests.
