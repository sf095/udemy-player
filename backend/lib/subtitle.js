/**
 * Shared subtitle parsing utilities.
 *
 * Used by:
 *   - backend/server.js (translate-subtitle chunking)
 *   - backend/scratch/verify_chunking.js (verification script)
 */

/**
 * Parse subtitle content (SRT or WebVTT) into individual cue blocks.
 * Filters out metadata headers, comments, and other non-cue blocks by
 * requiring each block to contain a timecode arrow ("-->").
 *
 * @param {string} content - Raw subtitle file content (SRT or VTT)
 * @returns {string[]} Array of cue blocks, each as a multi-line string
 */
function parseSubtitleCues(content) {
  const normalized = content.replace(/\r\n/g, '\n').replace(/﻿/g, '');
  const lines = normalized.split('\n');
  const cues = [];
  let currentCue = [];

  for (const line of lines) {
    if (line.trim() === '') {
      if (currentCue.length > 0) {
        const cueStr = currentCue.join('\n');
        if (cueStr.includes('-->')) {
          cues.push(cueStr);
        }
        currentCue = [];
      }
    } else {
      currentCue.push(line);
    }
  }

  if (currentCue.length > 0) {
    const cueStr = currentCue.join('\n');
    if (cueStr.includes('-->')) {
      cues.push(cueStr);
    }
  }

  return cues;
}

module.exports = { parseSubtitleCues };
