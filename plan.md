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

72: ### Checkpoint C: Final Verification (End of Phase 4)
73: - Verify overall progress calculation.
74: - Test 90% auto-complete logic.
75: - Verify notes are persistent across server restarts.
76: 
77: ## Phase 5: Subtitle Auto-Translation (Gemini 1.5 Flash)
78: 1. **Scanner Upgrade**:
79:    - Modify `backend/scanner.js` to scan for all subtitle tracks (English, Vietnamese, etc.) and output them as a `subtitles` dictionary.
80: 2. **API Key Settings Endpoint**:
81:    - Create endpoints to load and save `geminiApiKey` in `progress_db.json`.
82: 3. **Translation Endpoint**:
83:    - Create `POST /api/translate-subtitle` to translate an English subtitle file to Vietnamese using Gemini 1.5 Flash (via direct HTTPS request, no extra npm dependencies). Save the output as a `.vi.vtt` file next to the video.
84: 4. **Settings Panel**:
85:    - Add a Settings button/modal in the frontend where the user can enter their Gemini API Key.
86: 5. **Player Multi-Track Support & Translate Action**:
87:    - Update `VideoPlayer.jsx` to render multiple subtitle tracks if available.
88:    - If Vietnamese subtitle is missing, render a button "Translate to Vietnamese" in the speed/subtitle overlay.
89:    - Integrate smooth loading feedback (spinner) while the transcription/translation request is in progress.
90: 
91: ## Technical Risks & Mitigations (Updated)
92: 
93: | Risk | Mitigation |
94: | --- | --- |
95: | **Browser Video Seeks Fail** | Standard Node servers don't support streaming ranges out of the box, leading to broken video seeking. We will implement full `Range` header support in the Express stream endpoint. |
96: | **Subtitle Format Incompatibility** | Browsers only support WebVTT (`.vtt`) for captions. Udemy courses are downloaded with SubRip (`.srt`). The backend will intercept requests for `.srt` and convert them to `.vtt` format in-memory using regex replacement of timestamps. |
97: | **Large PDF/HTML Local Access** | Direct absolute local URLs are blocked by Chrome. The backend will expose a safe `/api/resource` router to serve those assets with appropriate MIME types. |
98: | **API Translation Limits & Timeouts** | Large files might time out or exceed token limits. We will use the lightweight `gemini-1.5-flash` model which supports up to 1M tokens context and responds in a few seconds. We will also sanitize formatting artifacts from output. |
99: 
100: ## Verification Checkpoints (Updated)
101: 
102: ### Checkpoint D: Auto-Translation Verification (End of Phase 5)
103: - Verify settings endpoint saves the Gemini API Key correctly.
104: - Verify scan results return a list of subtitles for a lesson.
105: - Verify calling `/api/translate-subtitle` saves a valid `.vi.vtt` file containing converted Vietnamese translations.
106: - Verify the frontend player offers the track switcher and toggles languages properly.
107: 
