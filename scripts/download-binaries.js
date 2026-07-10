const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { execFileSync } = require('child_process');
const { BIN_ROOT, binaryTargetDir } = require('../bin-paths');

/**
 * Platform-specific static ffmpeg / ffprobe binaries downloaded from the
 * npm registry (@ffmpeg-installer / @ffprobe-installer scoped packages).
 *
 * Version notes:
 *   - ffmpeg darwin/arm64 uses 4.1.5 (the latest arm64 build published
 *     to @ffmpeg-installer/darwin-arm64 at time of writing). Other
 *     platforms use 4.1.0 — the newer build was never back-ported.
 *   - ffprobe darwin/arm64 uses 5.0.1 for the same reason; darwin/x64
 *     and win32/x64 use 5.1.0.
 *
 * SHA256 integrity hashes are optional but strongly recommended. To
 * compute a hash for a new binary version:
 *   1. Set its sha256 to null (skip verification).
 *   2. Run `npm run download-binaries` once — the script will log the
 *      actual hash so you can paste it into the config below.
 *   3. Re-run to confirm the hash matches.
 */

const BINARIES = [
  {
    name: 'ffmpeg',
    platform: 'win32',
    arch: 'x64',
    url: 'https://registry.npmjs.org/@ffmpeg-installer/win32-x64/-/win32-x64-4.1.0.tgz',
    binaryFile: 'ffmpeg.exe',
    // sha256: null,  // TODO: populate after first download
  },
  {
    name: 'ffmpeg',
    platform: 'darwin',
    arch: 'x64',
    url: 'https://registry.npmjs.org/@ffmpeg-installer/darwin-x64/-/darwin-x64-4.1.0.tgz',
    binaryFile: 'ffmpeg',
    // sha256: null,
  },
  {
    name: 'ffmpeg',
    platform: 'darwin',
    arch: 'arm64',
    url: 'https://registry.npmjs.org/@ffmpeg-installer/darwin-arm64/-/darwin-arm64-4.1.5.tgz',
    binaryFile: 'ffmpeg',
    // sha256: null,
  },
  {
    name: 'ffprobe',
    platform: 'win32',
    arch: 'x64',
    url: 'https://registry.npmjs.org/@ffprobe-installer/win32-x64/-/win32-x64-5.1.0.tgz',
    binaryFile: 'ffprobe.exe',
    // sha256: null,
  },
  {
    name: 'ffprobe',
    platform: 'darwin',
    arch: 'x64',
    url: 'https://registry.npmjs.org/@ffprobe-installer/darwin-x64/-/darwin-x64-5.1.0.tgz',
    binaryFile: 'ffprobe',
    // sha256: null,
  },
  {
    name: 'ffprobe',
    platform: 'darwin',
    arch: 'arm64',
    url: 'https://registry.npmjs.org/@ffprobe-installer/darwin-arm64/-/darwin-arm64-5.0.1.tgz',
    binaryFile: 'ffprobe',
    // sha256: null,
  },
];

const tempDir = path.join(BIN_ROOT, '..', 'bin-temp');

// ── helpers ──────────────────────────────────────────────────────────

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

/** Download a file over HTTPS. */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      // Follow redirects (3xx)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlinkSync(destPath);
        downloadFile(response.headers.location, destPath).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// ── main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting FFmpeg & FFprobe binary download setup...');

  // Ensure base bin and temp directories exist
  if (!fs.existsSync(BIN_ROOT)) {
    fs.mkdirSync(BIN_ROOT, { recursive: true });
  }
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  for (const binary of BINARIES) {
    const targetDir = binaryTargetDir(binary.platform, binary.arch);
    const targetPath = path.join(targetDir, binary.binaryFile);

    // Skip if binary already exists, has non-zero size, and (if hash is set) matches
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) {
      if (binary.sha256) {
        const existingHash = sha256File(targetPath);
        if (existingHash === binary.sha256) {
          console.log(`[SKIPPED] ${binary.name} for ${binary.platform}/${binary.arch} (already present, hash matches).`);
          continue;
        }
        console.log(`[STALE] ${binary.name} for ${binary.platform}/${binary.arch} (hash mismatch, re-downloading).`);
      } else {
        console.log(`[SKIPPED] ${binary.name} for ${binary.platform}/${binary.arch} already exists.`);
        continue;
      }
    }

    console.log(`\n[DOWNLOADING] ${binary.name} for ${binary.platform}/${binary.arch}...`);
    console.log(`URL: ${binary.url}`);

    const archiveName = `${binary.name}-${binary.platform}-${binary.arch}.tgz`;
    const archivePath = path.join(tempDir, archiveName);
    const extractDir = path.join(tempDir, `${binary.name}-${binary.platform}-${binary.arch}-extracted`);
    fs.mkdirSync(extractDir, { recursive: true });

    try {
      // 1. Download tarball
      await downloadFile(binary.url, archivePath);
      console.log(`[DOWNLOADED] Saved to ${archivePath}`);

      // 2. Verify archive integrity (if a hash is configured)
      if (binary.sha256) {
        const archiveHash = sha256File(archivePath);
        if (archiveHash !== binary.sha256) {
          throw new Error(
            `SHA256 mismatch for ${binary.name} ${binary.platform}/${binary.arch}:\n` +
            `  expected: ${binary.sha256}\n` +
            `  actual:   ${archiveHash}`
          );
        }
        console.log(`[INTEGRITY] SHA256 verified.`);
      } else {
        const archiveHash = sha256File(archivePath);
        console.log(`[INTEGRITY] No expected hash configured. Actual SHA256: ${archiveHash}`);
        console.log(`[INTEGRITY] Add this hash to scripts/download-binaries.js to enable verification.`);
      }

      // 3. Extract tarball using native tar (execFileSync avoids shell interpolation)
      console.log(`[EXTRACTING] Extracting tarball...`);
      execFileSync('tar', ['-xzf', archivePath, '-C', extractDir]);

      // 4. Move binary to final path
      const extractedBinaryPath = path.join(extractDir, 'package', binary.binaryFile);
      if (!fs.existsSync(extractedBinaryPath)) {
        throw new Error(`Could not find extracted binary at ${extractedBinaryPath}`);
      }

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.renameSync(extractedBinaryPath, targetPath);
      console.log(`[SUCCESS] Installed: ${targetPath}`);

      // 5. Verify binary integrity (if a hash is configured)
      if (binary.sha256) {
        const binaryHash = sha256File(targetPath);
        if (binaryHash !== binary.sha256) {
          console.warn(`[WARNING] Extracted binary hash (${binaryHash}) differs from archive hash.`);
        }
      }

      // 6. Set execution permissions for non-Windows platforms
      if (binary.platform !== 'win32') {
        fs.chmodSync(targetPath, 0o755);
        console.log(`[PERMISSIONS] Set execution permission (chmod 755) for ${targetPath}`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to set up ${binary.name} for ${binary.platform}/${binary.arch}:`, error.message);
      // Let the error bubble to main()'s catch so --postinstall can suppress it
      throw error;
    }
  }

  // Clean up temp directory
  console.log('\nCleaning up temporary files...');
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('All static binaries are successfully configured!');
}

const isPostinstall = process.argv.includes('--postinstall');

main().catch((err) => {
  console.error('Fatal error during setup:', err);
  if (isPostinstall) {
    console.log('\nBinary download is optional — continuing without static ffmpeg/ffprobe.');
    console.log('Run "npm run download-binaries" to retry, or install them system-wide.');
  }
  process.exit(isPostinstall ? 0 : 1);
});
