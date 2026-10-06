# Implementation Plan: Fix Mute Toggle (Shortcut M & Sound Icon)

## Overview
This plan addresses the bug where pressing `M` or clicking the sound icon fails to mute the player due to an event feedback loop and missing booster mute coordination.

## Proposed Changes

### Component 1: `frontend/src/components/VideoPlayer.jsx`
1. **Remove Defective `volumechange` Event Listener:**
   - Remove `handleVolumeChange` and `video.addEventListener('volumechange', handleVolumeChange)`.
   - React completely controls the audio state via props `volume`, `isMuted`, `onVolumeChange`, `onToggleMute`. Custom controls are used (`controls={false}`).
2. **Synchronize Web Audio Booster with Mute State:**
   - In the volume synchronization `useEffect` (around line 485), update `audioBooster.setBoost`:
     ```javascript
     audioBooster.setBoost(isMuted ? 0 : (volume > 1 ? volume : 1));
     ```
   - This guarantees that both the native `<video>` element (`video.muted = isMuted`) and the Web Audio API booster (`gainNode.gain = 0`) are completely silenced when muted.

### Component 2: `frontend/src/App.jsx`
1. **Unmute Zero Volume Guard:**
   - In `handleToggleMute`:
     - If the player is currently muted and is unmuting, but `volume === 0`: automatically restore volume to `1.0` (100%) so unmuting actually produces sound, matching expected media player behavior.

### Component 3: `frontend/src/hooks/useKeyboardShortcuts.js`
1. **Case-Insensitive Single-Character Key Matching:**
   - Update key matching to allow single-character letters to match regardless of CapsLock when `shift` is not required:
     ```javascript
     const keyMatches = (key.length === 1 && e.key.length === 1 && !needShift)
       ? e.key.toLowerCase() === key.toLowerCase()
       : e.key === key;
     ```

## Verification Checkpoints
1. **Checkpoint 1:** Run `npm run build --prefix frontend` to ensure syntax and build pass.
2. **Checkpoint 2:** Verify click on sound icon: switches between muted (`VolumeX`) and unmuted (`Volume1`/`Volume2`/boosted).
3. **Checkpoint 3:** Verify pressing `m` and `M` (with CapsLock): toggles mute consistently.
4. **Checkpoint 4:** Verify audio boost (> 100%): sound is completely muted when mute is toggled ON, and properly restored when toggled OFF.
