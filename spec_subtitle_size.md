# Spec: Dynamic Subtitle Size Adjustment

## Objective
Introduce a setting to dynamically adjust the font size of subtitles/captions during video playback. The selection should update in real-time and persist across different lectures and application reloads.

## Tech Stack
- **Frontend**: React (Vite), HTML5 `<track>` element
- **Styling**: Vanilla CSS, leveraging CSS custom variables and `video::cue` pseudo-element.

## Proposed Changes
1. **CSS Variable Integration**:
   Define a custom property `--subtitle-size` on the video container or `:root` (defaulting to `100%`) and style the `video::cue` selector with `font-size: var(--subtitle-size, 100%) !important;`.
2. **UI Controls**:
   Add a dropdown selector or button group in the subtitle overlay on the video player (next to the EN/VI selectors) or within the `VideoPlayer` component overlay.
3. **Persisted State**:
   Save the chosen size setting (e.g. `75%`, `100%`, `130%`, `160%`, `200%`) to `localStorage` so it persists for the user.

## CSS Implementation Example
```css
/* Styling WebVTT cues globally */
video::cue {
  font-size: var(--subtitle-size, 100%) !important;
  background: rgba(15, 23, 42, 0.85) !important;
  color: #ffffff !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8) !important;
  font-family: var(--font-sans) !important;
}
```

## Success Criteria
- [ ] Users can see a size selector control next to the subtitle language selector.
- [ ] Users can select between at least 4 sizes (e.g. Small: 80%, Medium: 100%, Large: 130%, Extra Large: 160%).
- [ ] Choosing a size dynamically updates the size of the subtitles rendered in the video in real-time.
- [ ] The subtitle size selection is saved in `localStorage` and restored automatically when loading a new video or refreshing the app.
- [ ] The styling integrates beautifully with the existing glassmorphism aesthetic of the video overlay.

## Boundaries
- **Always**: Use native HTML5 `<track>` styling cues via CSS variables to ensure high performance and native accessibility controls.
- **Never**: Hardcode absolute font sizes in pixels that do not scale with the video player size.
- **Ask First**: Adding advanced layout or position adjustments for subtitles.
