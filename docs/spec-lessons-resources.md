# Spec: Lessons with Multiple Assets and Documents

## Objective
Update the offline player to support lessons containing multiple assets (PDFs, HTML files, `.url` shortcuts, `.docx`, `.pptx`, `.zip`, etc.), whether they have an associated video file or not. Ensure the course menu (sidebar) is clean (showing one list item per lesson prefix) and that all resources are accessible and interactable in the main viewport.

## Assumptions
1. **Prefix Grouping**: All files in a section folder starting with the same numerical prefix (e.g. `02 - ...`) belong to the same lesson.
2. **Resource Definition**: Any file with a prefix that is not a video (`.mp4`) or subtitle (`.srt`, `.vtt`) is a companion resource.
3. **URL Shortcuts**: `.url` files contain target web links (under the `URL=` property) that should be parsed on the backend.
4. **File Types Handling**: 
   - `.pdf` and `.html` files can be rendered inline using the existing `DocViewer`.
   - `.url` links open in the external default browser.
   - Other binary files (`.docx`, `.pptx`, `.zip`, etc.) trigger a browser download.

## Tech Stack
- Electron & Node.js (Express Backend)
- React (Vite-based frontend)
- TailwindCSS/Vanilla CSS, Lucide React

## Commands
- Build: `npm run package`
- Test: (Manual verification against the user's local course folder)
- Dev (Web only): `npm run dev`
- Dev (Desktop App): `npm run dev:desktop`

## Project Structure
- `backend/scanner.js` - Scans directory, groups files by prefix, and parses resources (including reading `.url` files).
- `backend/server.js` - Serves static resources and provides file MIME types.
- `frontend/src/App.jsx` - Manages active lesson tabs and viewport layouts.
- `frontend/src/components/Sidebar.jsx` - Renders the clean navigation list of lessons.
- `frontend/src/components/DocViewer.jsx` - Renders document previews.

## Code Style
Keep consistent with the current dark theme, ES6 JavaScript, and React functional components.

## Testing Strategy
- Run the Express backend and Vite frontend to test course load.
- Point the player to `/Users/hientranthanh/Downloads/sources/my-udemy/downloads/Claude AI The AI Assistant You’ll Actually Use`.
- Manually verify sections containing multiple assets (e.g., Section 2, Prefix `02` which contains 1 video, 1 PDF, and 4 URL shortcuts) and sections with no video (e.g., Section 1, Prefix `03`/`04`).

## Boundaries
- **Always do**: Preserve subtitle matching.
- **Ask first**: Large database schema changes (not applicable here).
- **Never do**: Delete or skip files in section folders without parsing them as assets.

## Success Criteria
- [ ] Backend scanner parses all files in a prefix group, populating a `resources` list.
- [ ] `.url` files are parsed to extract the destination URL.
- [ ] Lessons with no videos but having resources are listed in the sidebar and are clickable.
- [ ] If a lesson has both a video and resources:
  - Tabs "Video Lesson" and "Resources" are shown.
- [ ] If a lesson has only resources (no video):
  - No "Video Lesson" tab is shown; the main stage renders the resource list directly.
- [ ] The "Resources" view displays all resources cleanly with appropriate file type icons.
- [ ] Clicking a PDF/HTML resource opens it in the inline preview pane.
- [ ] Clicking a URL resource redirects/opens in an external browser.
- [ ] Clicking a binary resource (e.g. PPTX, DOCX, ZIP) downloads the file.

## Open Questions
None. UI preferences and file action behaviors have been agreed upon with the user.
