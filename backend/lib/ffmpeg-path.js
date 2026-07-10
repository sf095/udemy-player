const path = require('path');
const fs = require('fs');
const { binaryTargetDir } = require('../../bin-paths');

/**
 * Static binary resolution for ffmpeg and ffprobe.
 *
 * Resolution order (first match wins):
 *   1. Bundled binary in packaged Electron app  (process.resourcesPath/bin/)
 *   2. Local dev binary in project root          (bin/{platform}/{arch}/)
 *   3. System PATH fallback                      (bare command name)
 *
 * This module works alongside path-env.js:
 *   - path-env.js augments process.env.PATH so system-installed binaries
 *     (Homebrew, MacPorts) are findable in macOS GUI / Electron contexts.
 *   - ffmpeg-path.js adds two higher-priority tiers above the system PATH:
 *     bundled binaries for packaged apps and local dev binaries for development.
 *   - When ffmpeg-path.js falls back to the bare command name, path-env.js
 *     ensures the system PATH includes common install locations.
 */

// Cached resolved paths — computed once at first call, then reused.
let cachedFfmpeg = null;
let cachedFfprobe = null;

/**
 * Return the absolute path to the named binary, or throw if not found.
 *
 * @param {'ffmpeg' | 'ffprobe'} name
 * @returns {string} absolute path to the binary executable
 * @throws {Error} if the binary cannot be located
 */
function getBinaryPath(name) {
  const isWin = process.platform === 'win32';
  const exeName = isWin ? `${name}.exe` : name;

  // ── Tier 1: Packaged Electron app ──────────────────────────────────
  // electron/main.js sets PACKAGED=true when app.isPackaged is true.
  // process.resourcesPath is only available in Electron's main process.
  if (process.env.PACKAGED === 'true' && process.resourcesPath) {
    const packagedPath = path.join(process.resourcesPath, 'bin', exeName);
    if (fs.existsSync(packagedPath)) {
      return packagedPath;
    }
  }

  // ── Tier 2: Local dev binary in project root ───────────────────────
  const devPath = path.join(binaryTargetDir(process.platform, process.arch), exeName);
  if (fs.existsSync(devPath)) {
    return devPath;
  }

  // ── Tier 3: System PATH fallback ───────────────────────────────────
  // On macOS/Linux, path-env.js has already injected common binary paths
  // into process.env.PATH when running under Electron.
  // Try a quick which/where check to verify the command is reachable.
  try {
    const { execFileSync: efs } = require('child_process');
    if (isWin) {
      efs('where', [name], { stdio: 'ignore' });
    } else {
      efs('which', [name], { stdio: 'ignore' });
    }
    return name;
  } catch (_) {
    // Not on PATH — provide a clear error.
  }

  throw new Error(
    `${name} not found.\n` +
    `  • Run "npm run download-binaries" to download a static build, or\n` +
    `  • Install ${name} system-wide (e.g. "brew install ${name}" on macOS).`
  );
}

module.exports = {
  getFfmpegPath: () => {
    if (!cachedFfmpeg) cachedFfmpeg = getBinaryPath('ffmpeg');
    return cachedFfmpeg;
  },
  getFfprobePath: () => {
    if (!cachedFfprobe) cachedFfprobe = getBinaryPath('ffprobe');
    return cachedFfprobe;
  },
};
