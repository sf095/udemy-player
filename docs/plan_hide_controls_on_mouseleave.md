# Plan: Hide Video Controls on Mouse Leave

## Implementation Strategy
We will implement the immediate hiding of video player controls when the mouse leaves the video player container by adding a `mouseleave` event listener to the video container element. This listener will be added and cleaned up inside the existing auto-hide control `useEffect` hook.

### Step 1: Modify VideoPlayer.jsx
Update the `useEffect` hook that manages `showControls` based on `isPlaying`:
- Define a `handleMouseLeave` event handler.
- In `handleMouseLeave`:
  - Set `showControls(false)` immediately.
  - Clear the inactivity timeout (`timeoutId`) to avoid delayed state overrides.
- Register `mouseleave` on the `container` element alongside the existing `mousemove` and `touchstart` listeners.
- Remove `mouseleave` listener in the cleanup function.

### Step 2: Verification
- Verify the build compiles without issues.
- Validate manually that:
  - While playing, moving the mouse pointer outside the video player container hides the controls immediately.
  - While playing, keeping the mouse still inside the container hides the controls after 2.5 seconds.
  - While paused, controls remain visible even when the mouse pointer leaves.
