const path = require('path');

/**
 * Shared binary-layout constants used by both the download script and the
 * runtime resolver so the directory structure stays in one place.
 *
 * bin/
 *   darwin/
 *     x64/
 *       ffmpeg
 *       ffprobe
 *     arm64/
 *       ffmpeg
 *       ffprobe
 *   win32/
 *     x64/
 *       ffmpeg.exe
 *       ffprobe.exe
 */

// Project root (where this file lives)
const ROOT = __dirname;

/** Absolute path to the top-level bin/ directory. */
const BIN_ROOT = path.join(ROOT, 'bin');

/**
 * Return the platform-arch subdirectory inside bin/.
 * @param {string} platform - process.platform value (e.g. 'darwin', 'win32')
 * @param {string} arch     - process.arch value     (e.g. 'x64', 'arm64')
 * @returns {string} absolute path to bin/{platform}/{arch}/
 */
function binaryTargetDir(platform, arch) {
  return path.join(BIN_ROOT, platform, arch);
}

module.exports = { ROOT, BIN_ROOT, binaryTargetDir };
