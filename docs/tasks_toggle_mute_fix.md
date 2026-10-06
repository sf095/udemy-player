# Tasks: Fix Mute Toggle (Shortcut M & Sound Icon)

- [x] Task 1: Remove feedback loop and sync booster mute in `VideoPlayer.jsx`
  - Acceptance: `handleVolumeChange` listener removed; `audioBooster.setBoost` sets gain to 0 when `isMuted` is true.
  - Verify: Build passes; tapping sound icon toggles between muted and unmuted without reverting.
  - Files: `frontend/src/components/VideoPlayer.jsx`

- [x] Task 2: Case-insensitive shortcut matching in `useKeyboardShortcuts.js`
  - Acceptance: Pressing `m` or `M` with or without CapsLock toggles mute.
  - Verify: Key matching logic test; build passes.
  - Files: `frontend/src/hooks/useKeyboardShortcuts.js`

- [x] Task 3: Handle unmuting when volume is 0 in `App.jsx`
  - Acceptance: If `volume === 0` and user unmutes, volume resets to 100% (1.0).
  - Verify: Muting at 0% and unmuting restores volume to 100%.
  - Files: `frontend/src/App.jsx`

- [x] Task 4: End-to-end verification and build
  - Acceptance: Frontend builds cleanly; all success criteria verified.
  - Verify: `npm run build --prefix frontend` succeeds with exit code 0.
  - Files: `frontend/dist/`
