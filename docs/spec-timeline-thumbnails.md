# Spec: Timeline Hover Video Thumbnails

## Objective
Enhance the custom video player's timeline (progress bar) hover tooltip by adding a live video preview thumbnail. When a user hovers over the progress bar, they should see a small thumbnail showing the frame of the video at that timestamp, alongside the chapter title and time.

## Tech Stack
- **Frontend**: React 19, HTML5 Video & Canvas (if needed, but direct video seeking is preferred), Vanilla CSS.
- **Backend**: Existing Node.js & Express server (serves `/api/stream` with support for HTTP Byte-Range requests).

## Commands
- **Dev**: `npm run dev`
- **Lint**: `npm run lint --prefix frontend`
- **Build**: `npm run build --prefix frontend`

## Project Structure
We will modify the following files:
- [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx): Add a thumbnail `<video>` element inside the hover tooltip. Wire up hover event listening to update the thumbnail video's playback time using a debounce/throttle mechanism.
- [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css): Add styles for the thumbnail wrapper and thumbnail video (sizing, borders, transitions, positioning).

## Code Style
The preview thumbnail will be added to the `.timeline-tooltip` element.
We will use a `useRef` to target the thumbnail video element and update its `currentTime` dynamically to prevent full component renders. A simple debounce timeout will prevent overloading the browser decoder during rapid mouse movements.

Example:
```jsx
// Tooltip with video preview
{hoverInfo && (
  <div 
    className="timeline-tooltip"
    style={{ left: `${hoverInfo.left}px` }}
  >
    <div className="timeline-tooltip-thumbnail-wrapper">
      <video
        ref={thumbnailVideoRef}
        src={videoSrc}
        className="timeline-tooltip-thumbnail"
        muted
        playsInline
        preload="auto"
      />
    </div>
    <span className="timeline-tooltip-chapter">{hoverInfo.chapterTitle}</span>
    <span className="timeline-tooltip-time">{formatTime(hoverInfo.time)}</span>
  </div>
)}
```

## Testing Strategy
- **Manual Verification**:
  1. Hover on the timeline and verify that a small video preview box is shown above the hovered position.
  2. Move the mouse across the timeline; verify the preview frame updates smoothly with minimal lag.
  3. Verify that when mouse leaves the timeline, the preview disappears.
  4. Test with different videos to ensure the preview source changes accordingly.
  5. Check console for any errors related to DOMException (e.g. interrupting seeks or media issues).

## Boundaries
- **Always do**: Keep the preview muted.
- **Ask first**: Adding any external client-side packages for canvas/decoding.
- **Never do**: Generate thumbnails on the backend (doing it on the frontend is faster, lighter, and zero-storage).

## Success Criteria
- Hovering over the timeline displays a 160x90px preview thumbnail.
- The thumbnail dynamically updates its frame to match the hovered time position.
- Rapid hovering/scrubbing is debounced/throttled to keep playback smooth and prevent crashes.
- The preview matches the dark-themed UI and scales correctly inside the tooltip.

## Open Questions
- **Q**: Should we display a loading spinner inside the thumbnail frame if the seek takes more than a few milliseconds?
  - *Recommendation*: Not necessary for local streams as local seeking is typically sub-10ms, but a black background with a subtle placeholder color is sufficient.
