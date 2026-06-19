# Plan: Dynamic Subtitle Sizing

## Implementation Strategy
We will implement the dynamic subtitle sizing by binding the WebVTT `video::cue` size to a CSS variable `--subtitle-size`. This variable will be set inline on the player's wrapper element and controlled via a dropdown in the subtitles overlay.

### Step 1: Update CSS Stylesheet
Add CSS rules to `frontend/src/index.css` targeting `video::cue`.
- Bind `font-size` to `var(--subtitle-size, 100%) !important`.
- Enhance the default cue style (premium dark translucent background, subtle text shadow, sans-serif font matching the theme).

### Step 2: Implement State and UI in VideoPlayer
Modify `frontend/src/components/VideoPlayer.jsx`:
- Create `subtitleSize` state initializing from `localStorage` with a default of `100%`.
- Persist value to `localStorage` in a `useEffect`.
- Pass `--subtitle-size` CSS variable via inline styles on the `.video-container` container div.
- Render a sizing dropdown next to the language buttons in the subtitle overlay.

### Step 3: Verify & Test
- Run build and development server to ensure no compiler/bundler errors.
- Test changing subtitle sizes to confirm immediate re-rendering.
- Verify persistence of settings by refreshing the page.
