# Plan: Dynamic Window/Document Title for Playing Video

## Implementation Order
1. **Modify `VideoPlayer.jsx` Props & Callbacks:**
   - Add optional `onPlay` and `onPause` callbacks to `VideoPlayer` component props.
   - Trigger these callbacks in `handlePlay` and `handlePause` event handlers respectively.
   
2. **Modify `App.jsx` State & Effects:**
   - Define a new state variable: `const [isVideoPlaying, setIsVideoPlaying] = useState(false);`.
   - Reset `isVideoPlaying` to `false` when the active lesson changes.
   - Pass `onPlay={() => setIsVideoPlaying(true)}` and `onPause={() => setIsVideoPlaying(false)}` to the `<VideoPlayer />` instance.
   - Add a `useEffect` hooked to `activeLesson`, `activeTab`, and `isVideoPlaying` that updates `document.title` based on the specified formats:
     - Default: `Udemy Offline Player - Custom Learning Portal`
     - Video (Playing): `▶ [Lesson Title] - Udemy Offline Player`
     - Video (Paused): `⏸ [Lesson Title] - Udemy Offline Player`
     - PDF: `[Lesson Title] (PDF) - Udemy Offline Player`
     - HTML: `[Lesson Title] (HTML) - Udemy Offline Player`
     - Quiz: `[Lesson Title] (Quiz) - Udemy Offline Player`

3. **Verify locally:**
   - Test both in standard browser mode and desktop mode.

## Risks & Mitigations
- **Video player clean-up**: If a video player is unmounted, `isVideoPlaying` could stay `true` if not properly cleaned up.
  - *Mitigation:* Explicitly reset `isVideoPlaying` to `false` when `activeLesson` changes.
- **Title conflicts**: Ensure no other files or components modify `document.title`.
  - *Mitigation:* We scanned the codebase and confirmed only `index.html` defines the title statically, so no other components will conflict.

## Verification Checkpoints
- Checkpoint 1: Active lesson change correctly updates document title.
- Checkpoint 2: Play/pause on video updates document title prefix.
- Checkpoint 3: PDF / HTML / Quiz lessons show type suffixes.
