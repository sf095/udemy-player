# Technical Implementation Plan: YouTube-like Timeline & Chapters

This document outlines the step-by-step technical plan to implement segmented timeline/progress bar and AI-generated chapters.

## 1. Major Components & Dependencies

```mermaid
graph TD
    A[VideoPlayer.jsx Custom Controls] --> B[Segmented Progress Bar]
    A --> C[Fullscreen Toggle Container]
    A --> D[Hover Tooltip Component]
    B --> E[Backend API: GET /api/chapters]
    E --> F[Gemini/Anthropic AI chapters generator]
    E --> G[Local JSON caching: [video].chapters.json]
```

### Dependencies
- No new external packages. We will utilize:
  - React 19 hooks (`useState`, `useEffect`, `useRef`, `useMemo`).
  - Lucide icons (already installed).
  - Existing Express server and AI integration (`callAiProvider`).

## 2. Implementation Order

1. **Backend Chapter Sourcing API (`server.js`)**:
   - Implement `GET /api/chapters`.
   - Implement parsing logic for subtitle files (.vtt / .srt) to build text transcripts with timestamps.
   - Implement AI prompt for structural chapter extraction with Gemini fallback.
   - Implement file-system caching (`[video_name].chapters.json`).
   - Implement `POST /api/chapters/regenerate` to allow re-triggering AI chapter generation.

2. **Frontend Custom Control Bar (`VideoPlayer.jsx`)**:
   - Remove `controls` attribute from `<video>` element.
   - Implement local playback state variables: `isPlaying`, `localCurrentTime`, `localDuration`, `volume`, `isMuted`.
   - Mount custom control bar at the bottom, which toggles visibility alongside top panels based on mouse inactivity.
   - Implement Play/Pause buttons, Volume hover slider, Time display, Fullscreen container-level toggle.

3. **Frontend Timeline Segments (`VideoPlayer.jsx`)**:
   - Fetch chapters on load or video change.
   - Calculate segments based on chapter timestamps.
   - Draw split progress bar tracks with 2px transparent gaps.
   - Write coordinate calculations for seeking/dragging (scrubbing) the timeline.

4. **Hover Tooltip (`VideoPlayer.jsx`)**:
   - Attach mouse-move listener on timeline container.
   - Compute hovered time and corresponding chapter title.
   - Show custom tooltip absolute-positioned above the cursor.

5. **Keyboard Shortcuts integration (`App.jsx`)**:
   - Update hotkey `F` to trigger container fullscreen.

## 3. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Native player fullscreen hides custom overlays and subtitles | Request fullscreen on `.video-container` (parent div) instead of `<video>` element. This keeps React DOM controls and overlays visible. |
| Subtitle file is too large for Gemini API prompt | Clean and compress the transcript to a simple `[MM:SS] Text` list. For standard course lessons (<30 mins), it easily fits in the context window. |
| AI API key is missing or fails | Catch errors gracefully, return an empty array `[]` (falls back to a solid progress bar). |
| Timeline drag/seek is jittery | Use local state for `scrubbingTime` during drag, only update `video.currentTime` in real-time or mouse-up, and handle document-level mouseup events. |

## 4. Verification Checkpoints

- **Checkpoint 1 (Backend)**: Verify curl `/api/chapters?videoPath=...` returns correct cached JSON, or generates it via Gemini if subtitles exist.
- **Checkpoint 2 (Controls UI)**: Verify play/pause, volume slider, time text, and container fullscreen work correctly with native controls disabled.
- **Checkpoint 3 (Timeline Segments)**: Verify progress bar splits visually into chapters with gaps.
- **Checkpoint 4 (Scrubbing & Tooltip)**: Verify drag-to-seek operates smoothly and hover tooltip shows accurate timestamps & titles.
