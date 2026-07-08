# Spec: YouTube-like Timeline with Chapters

## Objective
Enhance the course video player by replacing the browser's default video controls with a custom HTML5 control bar that features a segmented timeline (progress bar) like YouTube.
The timeline will:
- Support visual segment breaks based on video chapters.
- Display a preview tooltip on hover showing the hovered timestamp and the chapter title.
- Allow smooth seeking and scrubbing (dragging) to update playback position.
- Source chapters from a local `[video_name].chapters.json` file.
- Automatically generate chapters from available subtitles (WebVTT/SRT) using the configured Gemini/Anthropic AI API and cache them locally if they don't exist yet.
- Gracefully fall back to a standard continuous progress bar if no chapters are available or if AI generation is disabled/unconfigured.
- Implement standard custom playback controls (Play/Pause, Mute/Volume slider, Fullscreen) with container-level fullscreen toggling to preserve overlays, subtitles, and custom controls.

## Tech Stack
- **Frontend**: React 19, Vite, Vanilla CSS, Lucide icons (`Play`, `Pause`, `Volume2`, `Volume1`, `VolumeX`, `Maximize2`, `Minimize2`).
- **Backend**: Node.js, Express, Gemini/Anthropic API integration (existing `callAiProvider`).

## Commands
- **Dev (Both Frontend & Backend)**: `npm run dev`
- **Lint**: `npm run lint --prefix frontend`
- **Build (Production)**: `npm run build --prefix frontend`

## Project Structure
We will modify the following existing files:
- [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx): Disable native video controls, implement the custom control bar (Timeline, Play/Pause, Mute/Volume slider, time display, container-level fullscreen button), hover tooltip, and fetch chapters from backend.
- [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css): Add custom controls styles (glassmorphism, timeline segments, slider thumb, hover state, transition animations).
- [server.js](file:///Users/hientranthanh/Downloads/sources/udemy-player/backend/server.js): Add `/api/chapters` GET and POST endpoints. The GET endpoint parses the subtitle file, requests chapter extraction from the AI provider if cached chapters JSON does not exist, writes the cached file, and returns the chapters array.
- [App.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/App.jsx): Update fullscreen keyboard shortcut `F` to target the video container rather than the video element directly.

And create/use chapters JSON format:
- `[video_name].chapters.json`

## Code Style
Custom timeline track segments will be rendered dynamically in JSX using flex widths based on each chapter's duration ratio:
```jsx
// Simplified JSX for segmented timeline
<div className="custom-timeline-container" onMouseMove={handleMouseMove} onClick={handleTimelineSeek}>
  {chapters.map((chapter, idx) => {
    const startRatio = chapter.time / duration;
    const endRatio = (idx === chapters.length - 1 ? duration : chapters[idx + 1].time) / duration;
    const segmentWidth = (endRatio - startRatio) * 100;
    
    return (
      <div 
        key={idx} 
        className="timeline-segment" 
        style={{ width: `${segmentWidth}%` }}
      >
        <div className="timeline-segment-rail" />
        <div className="timeline-segment-fill" style={{ width: `${getSegmentFillRatio(chapter, idx) * 100}%` }} />
      </div>
    );
  })}
</div>
```

## Testing Strategy
- **Manual Verification**:
  1. Open a lesson with English subtitles.
  2. Confirm the timeline automatically scans/generates chapters (a visual loader or progress bar indicators appear, split into segments).
  3. Hover over different parts of the progress bar to verify the correct timestamp and chapter title are displayed in the tooltip.
  4. Click and drag the progress bar to seek and scrub.
  5. Toggle fullscreen and verify the custom controls, subtitles, and overlays stay visible and scale correctly.
  6. Verify manual API generation/re-generation is correct and `.chapters.json` is generated on disk.

## Boundaries
- **Always do**: Preserve existing subtitle parsing, translation, and dual subtitle merging behavior.
- **Ask first**: None (standard feature enhancement).
- **Never do**: Introduce extra external video player dependencies (like Video.js or Plyr) as we want a lightweight, integrated HTML5 React player.

## Success Criteria
- Native controls are replaced by custom controls.
- The timeline is segmented by chapters.
- Hovering shows the chapter name + timestamp in a floating tooltip.
- Clicking or dragging seeks the video player.
- Chapters are automatically generated via the Gemini API when a subtitle file is loaded (if not cached), and saved to `[video_name].chapters.json`.
- Fullscreen works on the container level, meaning custom controls and dual subtitles are visible.

## Open Questions
- Should we allow users to manually edit chapter names or add/remove chapter markers directly from the video player interface? (Recommended: No, AI generation + local JSON file modification is sufficient for the first version).
