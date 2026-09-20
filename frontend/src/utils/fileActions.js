/**
 * Utility functions for interacting with local filesystem resources in Electron and Web modes.
 */

export function getFileManagerName() {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (ua.includes('Mac') || navigator.platform?.includes('Mac')) {
      return 'Finder';
    }
    if (ua.includes('Win') || navigator.platform?.includes('Win')) {
      return 'File Explorer';
    }
  }
  return 'Folder';
}

/**
 * Reveals a local file in the system file manager (Finder / File Explorer).
 * @param {string} filePath - Absolute path to the file on disk.
 */
export async function revealResourceInFolder(filePath) {
  if (!filePath) return { success: false, error: 'No path specified' };

  try {
    if (window.electronAPI?.revealInFinder) {
      return await window.electronAPI.revealInFinder(filePath);
    }

    // Fallback to backend server if running in standard web browser
    const res = await fetch('/api/reveal-resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('Failed to reveal file in folder:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Opens a local file using the operating system default application.
 * @param {string} filePath - Absolute path to the file on disk.
 */
export async function openResourceFile(filePath) {
  if (!filePath) return { success: false, error: 'No path specified' };

  try {
    if (window.electronAPI?.openPath) {
      return await window.electronAPI.openPath(filePath);
    }

    // Fallback to backend server if running in standard web browser
    const res = await fetch('/api/open-resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('Failed to open file:', err);
    return { success: false, error: err.message };
  }
}
