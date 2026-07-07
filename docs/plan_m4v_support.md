# Plan: M4V File Support

## Major Components and Dependencies
1. **Directory Scanner (`backend/scanner.js`)**: Must identify files with `.m4v` extension as valid video files when scanning course content.
2. **Streaming Server (`backend/server.js`)**: Must stream `.m4v` video files via `/api/stream` endpoint with support for byte range requests.

## Implementation Order
1. Modify `backend/scanner.js` to treat `.m4v` files as video files (same logic as `.mp4`).
2. Verify if `backend/server.js` needs any Content-Type adjustments for `.m4v`. (Serving as `video/mp4` works well for DRM-free files, but we will make it explicit or dynamically mapped).
3. Test using a mockup or actual directory structure with `.m4v` files.

## Risks and Mitigation
- **Risk**: Player fails to play `.m4v` due to strict browser MIME check.
- **Mitigation**: Map `.m4v` extension to `video/mp4` or `video/x-m4v`. Standard browsers support playing `.m4v` files with `video/mp4`.
- **Risk**: Subtitle pairing might fail if it relies on exact string match with `.mp4`.
- **Mitigation**: The scanner groups files by their numerical prefix (e.g. `01 - ...`), so as long as the `.m4v` file is grouped, subtitles will pair automatically. We will verify this.

## Verification Checkpoints
- **Checkpoint 1**: Scanner returns correct course JSON metadata where `.m4v` files are marked as `type: "video"`.
- **Checkpoint 2**: Video Player streams and seeks a `.m4v` file successfully.
