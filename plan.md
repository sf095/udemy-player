# Implementation Plan: Udemy Offline Player

This plan breaks down the development of the Udemy Offline Player into logical, verifiable phases.

## Phase 1: Backend Setup & API Design
1. **Initialize Project**:
   - Create root `package.json` for script coordination.
   - Create `backend/` directory and initialize node server with Express, CORS, and nodemon.
2. **Implement Core Parsers**:
   - **Course Directory Scanner**: Scan a path recursively to list sections (folders starting with numbers, e.g., `01 - ...`) and parse files within sections. Group matching prefixes (e.g., `03 - Getting to know the keyboard.mp4` and `.srt` and `.pdf` files) into unified "Lesson" objects.
   - **Subtitle Converter**: SRT to WebVTT converter utility to translate subtitles on the fly.
3. **Implement Key Routes**:
   - `/api/courses`: Return history of course roots.
   - `/api/course-content?path=...`: Return JSON structure of chapters, lessons, resources.
   - `/api/stream?path=...`: Video stream endpoint handling Range headers (`Range: bytes=...`) for seekable HTML5 video.
   - `/api/subtitle?path=...`: Serve WebVTT content converted from SRT.
   - `/api/resource?path=...`: Serve HTML and PDF documents safely.
   - `/api/userdata` (GET/POST): Persist completion, watch logs, and timestamped notes in a local `userdata.json` file.

## Phase 2: Frontend Setup & Shell
1. **Initialize Vite**:
   - Run Vite React boilerplate at root or in `frontend/`. Let's run Vite React at root or in a subfolder and proxy `/api` calls. Putting the Vite app at root or in a sibling `frontend/` folder are both valid. Let's place it in `frontend/` for a clean boundary.
2. **Theme and Layout Base**:
   - Configure custom Vanilla CSS variables for a premium dark interface (deep dark background, translucent glass sidebars, glowing blue accents, clean Outfit/Inter typography).
   - Set up the main dashboard grid: Top Navbar, Left Sidebar (collapsible), Center Stage (content), Right Panel (Notes - collapsible).

## Phase 3: Core Client Components
1. **Course Selector**:
   - Input to paste directory paths and browse previously loaded courses.
2. **Accordion Sidebar**:
   - Renders sections/chapters. Expand/collapse states.
   - Lesson items showing completion checkbox, lesson type icon (video, pdf, html), title, and progress line.
3. **Primary Content Stage**:
   - **Video Player**: HTML5 `<video>` with standard/custom overlays, playback speed settings (0.5x to 3x), subtitle selector, and automatically syncing to current watch progress.
   - **HTML Viewer**: Sandboxed iframe with custom style injection if needed.
   - **PDF Viewer**: Embed PDF files using standard `<embed>` or custom preview overlay.
4. **Notes Sidebar**:
   - Lists timestamped notes for the active lesson.
   - Clicking a note timestamp sets the video player's current time to that note's timestamp.
   - Create/Edit/Delete actions. Pauses video on typing, resumes on submit.

## Phase 4: Auto-Save, Auto-Complete, Polish
1. **Watch Progress API Sync**:
   - Track video `timeupdate` and save progress to backend throttling updates to every 5-10 seconds.
   - Auto-mark completed when progress reaches 90% (`currentTime / duration >= 0.90`).
2. **Micro-animations & Aesthetics**:
   - Hover effects on cards, sidebar folders, completion checkboxes.
   - Progress bar fill animations.
   - Fade transitions between lessons.

---

## Technical Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| **Browser Video Seeks Fail** | Standard Node servers don't support streaming ranges out of the box, leading to broken video seeking. We will implement full `Range` header support in the Express stream endpoint. |
| **Subtitle Format Incompatibility** | Browsers only support WebVTT (`.vtt`) for captions. Udemy courses are downloaded with SubRip (`.srt`). The backend will intercept requests for `.srt` and convert them to `.vtt` format in-memory using regex replacement of timestamps. |
| **Large PDF/HTML Local Access** | Direct absolute local URLs are blocked by Chrome. The backend will expose a safe `/api/resource` router to serve those assets with appropriate MIME types. |

## Verification Checkpoints

### Checkpoint A: Backend & Scanner (End of Phase 1)
- Verify `course-content` returns structured sections and lessons.
- Verify range-based video streaming is functional in Chrome (test seek functionality).
- Verify SRT to WebVTT conversion works by making a curl call to the subtitle endpoint.

### Checkpoint B: Layout & Video Player (End of Phase 3)
- Verify the Vite dashboard renders and communicates with the backend.
- Verify the video player plays, seeks, and loads WebVTT subtitles correctly.
- Verify Notes panel lists notes, and clicking a timestamp seeks the player.

### Checkpoint C: Final Verification (End of Phase 4)
- Verify overall progress calculation.
- Test 90% auto-complete logic.
- Verify notes are persistent across server restarts.
