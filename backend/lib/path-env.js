// macOS GUI apps (including Electron) don't inherit the shell's PATH,
// so common binary locations need to be injected manually.
// This is critical for ffmpeg, ffprobe, and other CLI tools the app shells out to.
//
// When the app is packaged, ffmpeg-path.js provides bundled static binaries.
// This module is the last-resort fallback: if neither the bundled binary nor
// a local dev binary is found, ffmpeg-path.js returns the bare command name,
// and this PATH augmentation ensures the system-installed binary is reachable.
if (process.platform === 'darwin' || process.platform === 'linux') {
  const extraPaths = ['/usr/local/bin', '/opt/homebrew/bin', '/opt/local/bin'];
  const current = (process.env.PATH || '').split(':').filter(Boolean);
  process.env.PATH = [...new Set([...current, ...extraPaths])].join(':');
}
