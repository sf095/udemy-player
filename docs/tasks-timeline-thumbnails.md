# Tasks: Timeline Hover Video Thumbnails

- [x] Task 1: Create thumbnail styles in CSS
  - Acceptance: Sizing classes `.timeline-tooltip-thumbnail-wrapper` and `.timeline-tooltip-thumbnail` are defined in CSS. Sizing is set to 160px width and 90px height, with center alignment, rounded corners (4px), black background, and a border matching the dark theme.
  - Verify: Verify that rules are written in CSS.
  - Files: [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css)

- [x] Task 2: Modify tooltip rendering in VideoPlayer.jsx to be persistently mounted
  - Acceptance: The `.timeline-tooltip` container is rendered persistently in the JSX (not conditionally using `{hoverInfo && ...}`), and its visibility, opacity, and positioning are controlled dynamically using CSS inline styles.
  - Verify: Hovering on the timeline still displays the correct chapter title and timestamp tooltip.
  - Files: [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx)

- [x] Task 3: Add thumbnail video element and seeking logic in VideoPlayer.jsx
  - Acceptance:
    - Add a `<video>` element with `ref={thumbnailVideoRef}` inside the tooltip thumbnail wrapper, configured with the current `videoSrc`, `muted`, `playsInline`, and `preload="auto"`.
    - Implement a `useEffect` hook that listens to `hoverInfo?.time` and updates `thumbnailVideoRef.current.currentTime` with a 50ms debounce.
  - Verify: Hovering over different locations of the progress bar displays the video thumbnail for that timestamp.
  - Files: [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx)

- [x] Task 4: End-to-end verification and testing
  - Acceptance: Hover previews update smoothly without console errors or UI lag. Previews work correctly when switching lessons or course videos.
  - Verify: Run the dev environment and manually verify the timeline preview feature.
  - Files: [VideoPlayer.jsx](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/components/VideoPlayer.jsx), [index.css](file:///Users/hientranthanh/Downloads/sources/udemy-player/frontend/src/index.css)
