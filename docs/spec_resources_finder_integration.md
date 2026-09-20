# Spec: Local File Explorer / Finder Integration for Resources

## 1. Objective

Currently, when a user clicks on non-previewable resources (e.g., `.zip` code archives, `.py`/`.js` code files, datasets, `.docx`, `.xlsx`) in the Companion Resources tab, the application serves the file through an Express download endpoint (`/api/resource?path=...`) which triggers a browser download. Because Udemy Offline Player is a local offline desktop application reading directly from the user's local filesystem, downloading causes unnecessary file duplication in `~/Downloads`, wastes disk space, and feels unnatural for a desktop app.

**Decision:**
- **Zero Downloads**: Completely remove file downloads from the Resources tab. No browser downloads will be initiated.
- **Reveal in Finder / File Explorer**: Provide instant one-click access to locate and highlight the file on disk using the operating system's native file manager (macOS Finder, Windows File Explorer, Linux file manager).
- **Open File directly**: Allow opening the resource in its default system application (e.g., VS Code, Word, Archive Utility).
- **Local File Card**: Replace the old empty "Look for your download..." stage message with an informative File Viewer card displaying file details and action buttons.
- **In-App Previews Retained**: Keep instant in-app previewing for PDFs, HTML, and Quizzes, enhanced with a "Show in Finder" toolbar action.

---

## 2. Tech Stack & Executable Commands

### Tech Stack
- **Desktop Shell**: Electron (`v42.x`), Node.js `shell.showItemInFolder`, `shell.openPath`
- **Backend**: Express (`v4.19.x`) with Node.js `child_process.execFile` fallback for web mode
- **Frontend**: React (`v19.x`), Vite (`v8.x`), Lucide React icons (`v1.21.x`)
- **OS Compatibility**: macOS (Finder), Windows (File Explorer), Linux (Default File Manager)

### Commands
- **Run Electron Desktop App (Dev)**:
  ```bash
  npm run dev:desktop
  ```
- **Run Web Dev Mode (Browser)**:
  ```bash
  npm run dev
  ```
- **Lint Frontend**:
  ```bash
  npm run lint --prefix frontend
  ```
- **Build Frontend**:
  ```bash
  npm run build --prefix frontend
  ```

---

## 3. Project Structure

```
udemy-player/
├── electron/
│   ├── main.js             # Electron main process (IPC handlers: shell:showItemInFolder, shell:openPath)
│   └── preload.js          # ContextBridge exposures (window.electronAPI.revealInFinder, openPath)
├── backend/
│   └── server.js           # Express API endpoints (/api/reveal-resource, /api/open-resource fallback)
├── frontend/
│   └── src/
│       ├── utils/
│       │   └── fileActions.js    # Shared utility for opening/revealing files with Electron & API fallback
│       ├── App.jsx               # Stage area Local File Card for non-previewable resources
│       └── components/
│           ├── ResourceList.jsx  # List items with "Show in Folder" button, removing download logic
│           └── DocViewer.jsx     # Header bar with "Show in Folder" action for previewable docs
└── docs/
    └── spec_resources_finder_integration.md  # Living specification and plan
```

---

## 4. Boundaries

- **Always**:
  - Verify that the target file exists before attempting to reveal or open it.
  - Sanitize and safely handle file paths to avoid command injection.
  - Support both Electron IPC and Express backend fallback (for browser testing).
  - Retain in-app preview for PDFs, HTML, and Quizzes.
- **Ask First**:
  - Any change to how resources are scanned or stored in the database.
- **Never**:
  - Trigger any browser file download from the resources tab.
  - Execute arbitrary shell strings without argument quoting/sanitization.
  - Break video playback or lesson progress tracking.

---

## 5. Implementation Plan (Phase 2)

### Component Architecture
1. **OS Bridge (`electron/main.js` & `electron/preload.js`)**:
   - Register `ipcMain.handle('shell:showItemInFolder')` using `shell.showItemInFolder(fullPath)`.
   - Register `ipcMain.handle('shell:openPath')` using `shell.openPath(fullPath)`.
   - Expose both via `window.electronAPI` in `preload.js`.

2. **Server Fallback (`backend/server.js`)**:
   - `POST /api/reveal-resource`: Safely executes `open -R` on macOS, `explorer.exe /select,` on Windows.
   - `POST /api/open-resource`: Safely executes `open` on macOS, `start` on Windows.

3. **Frontend Client Bridge (`frontend/src/utils/fileActions.js`)**:
   - Exports `revealResourceInFolder(filePath)` and `openResourceFile(filePath)`.
   - Transparently uses `window.electronAPI` when inside Electron, falling back to `/api/reveal-resource` or `/api/open-resource` if running in a web browser.

4. **Resource List Refactor (`frontend/src/components/ResourceList.jsx`)**:
   - Remove all references to `/api/resource` download URLs.
   - Remove the `Download` icon.
   - Replace with a `FolderOpen` icon button for revealing the file in Finder/Explorer.
   - Clicking a non-previewable card selects it so its Local File Card is shown in the stage viewer.

5. **Stage Local File Card (`frontend/src/App.jsx`)**:
   - When a non-previewable resource is active, render a dedicated **Local File Card**:
     - Large file icon (Archive, Code, Sheet, or File).
     - Clean title, original filename, and file extension.
     - Full file path (with copy-path capability).
     - Prominent buttons:
       - **"Reveal in Finder" / "Show in Folder"** (Primary button with `FolderOpen` icon).
       - **"Open File"** (Secondary button with `ExternalLink` icon to launch default app).

6. **DocViewer Header Integration (`frontend/src/components/DocViewer.jsx`)**:
   - Add a "Show in Folder" button to the top toolbar of PDF/HTML previews for instant access to the source file.

---

## 6. Discrete Tasks (Phase 3)

- [x] **Task 1: Electron IPC Handlers & Preload Exposure**
  - Acceptance: `window.electronAPI.revealInFinder(path)` and `window.electronAPI.openPath(path)` invoke `shell.showItemInFolder` and `shell.openPath`.
  - Files: `electron/main.js`, `electron/preload.js`
  - Verify: Invoke IPC from devtools console to confirm Finder highlights local file.

- [x] **Task 2: Backend API Fallbacks for Web Mode**
  - Acceptance: `POST /api/reveal-resource` and `POST /api/open-resource` safely trigger OS commands with proper path verification.
  - Files: `backend/server.js`
  - Verify: `curl -X POST -H "Content-Type: application/json" -d '{"path":"/path/to/file"}' http://localhost:3003/api/reveal-resource` opens Finder.

- [x] **Task 3: Shared Frontend File Action Utility**
  - Acceptance: Unified utility functions handle Electron IPC with backend HTTP fallback and error handling.
  - Files: `frontend/src/utils/fileActions.js`
  - Verify: Calls succeed in both Electron and standalone browser modes.

- [x] **Task 4: Update ResourceList Component (Remove Downloads)**
  - Acceptance: Download links and icons are completely removed. Clicking folder icon or non-previewable card opens in Finder or selects the item.
  - Files: `frontend/src/components/ResourceList.jsx`
  - Verify: No downloads occur; clicking folder button triggers Finder reveal.

- [x] **Task 5: Implement Local File Card in Stage Viewer**
  - Acceptance: Non-previewable resources render an informative file viewer card with "Reveal in Finder" and "Open File" actions instead of the download message.
  - Files: `frontend/src/App.jsx`, `frontend/src/components/LocalResourceCard.jsx`
  - Verify: Selecting a `.zip` or code resource displays file card with functioning buttons.

- [x] **Task 6: Add "Show in Folder" to DocViewer Toolbar**
  - Acceptance: HTML and PDF viewers have a "Show in Folder" button in their control bar.
  - Files: `frontend/src/components/DocViewer.jsx`
  - Verify: Clicking button from PDF/HTML preview highlights the document in Finder.

---

## 7. Success Criteria

- [x] 0 download requests initiated from the Resources tab.
- [x] Clicking "Show in Folder" or `FolderOpen` highlights the file in macOS Finder or Windows Explorer.
- [x] Clicking "Open File" launches the file in its default system application.
- [x] Non-previewable resources display the Local File Card with metadata and action buttons.
- [x] In-app preview for PDFs, HTML, and Quizzes remains fully functional.
- [x] All frontend linting and build checks pass (`npm run build --prefix frontend`).
