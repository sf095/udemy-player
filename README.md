<h1 align="center">🎓 Udemy Offline Player</h1>

<p align="center">
  <strong>Your Premium Local Learning Portal — Stream, Study & Master Any Course Offline</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Price-Super%20Cheap-brightgreen?style=for-the-badge&logo=cashapp&logoColor=white" alt="Super Cheap" />
  <img src="https://img.shields.io/badge/Updates-Lifetime%20Free-blue?style=for-the-badge&logo=infinity&logoColor=white" alt="Lifetime Updates" />
  <img src="https://img.shields.io/badge/Courses-10%2C000%2B%20Available-orange?style=for-the-badge&logo=udemy&logoColor=white" alt="10,000+ Courses" />
  <img src="https://img.shields.io/badge/AI%20Powered-Gemini-purple?style=for-the-badge&logo=google&logoColor=white" alt="AI Powered" />
</p>

<p align="center">
  <img src="screenshot.png" alt="Udemy Offline Player Screenshot" width="800px" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" />
</p>

---

## 🔥 Buy Premium Udemy Courses — Unbelievably Cheap!

> **Why pay $50–$200 per course when you can get them for a fraction of the price?**

We provide **thousands of top-rated Udemy courses** at the **lowest prices you'll find anywhere**. Every purchase includes:

| ✅ What You Get | 💡 Details |
|---|---|
| 💰 **Rock-Bottom Prices** | Courses starting from just **$3–$5** — up to **95% off** retail |
| ♾️ **Lifetime Updates** | Course gets updated by the instructor? **You get every update FREE, forever** |
| 📥 **Full Offline Access** | Download once, learn anywhere — no internet required |
| 🎬 **Complete Content** | All videos, subtitles, resources, and attachments included |
| 🤖 **AI-Powered Player** | Built-in AI translation, summarization & chat assistant |
| ⚡ **Instant Delivery** | Get your course files within minutes of purchase |
| 🛡️ **100% Safe** | Clean files, no malware, no nonsense |

### 📲 Ready to Order? Contact Us Now!

<p align="center">
  <a href="https://t.me/">
    <img src="telegram.jpg" alt="Telegram Contact — Scan to Order" width="280px" style="border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.4);" />
  </a>
</p>

<p align="center">
  👆 <strong>Scan the QR code</strong> or message us on <strong>Telegram</strong> to browse our catalog & place an order!<br/>
  🎁 <em>First-time buyers get a special discount — ask about our bundle deals!</em>
</p>

---

## ✨ Key Features

1. **Intelligent Course Scanner**: Scans directory folders and sections (e.g. `01 - Party Time...`, `02 - Blues...`) to build a structured navigation menu. Groups video files, SRT subtitle files, and resource materials (PDFs, HTML sheets) sharing the same leading number suffix (e.g. `03 - Getting to know the keyboard`) into single, coherent Lesson objects.
2. **Coordinated Tab View**: If a lesson has both a video and a document resource (like sheet music PDFs in section 1 of *Pianoforall*), the player stage reveals a tab system: **Video Lesson** and **Companion Resources**, allowing seamless side-by-side study.
3. **Custom HTML5 Video Stage**:
   - Converts standard `.srt` subtitle files to WebVTT (`.vtt`) on-the-fly.
   - Built-in adjustable playback rate options (`1x`, `1.25x`, `1.5x`, `1.75x`, `2x`).
   - Browser hotkeys: `Space` (play/pause), `ArrowLeft`/`ArrowRight` (skip back/forward 5 seconds), `ArrowUp`/`ArrowDown` (volume), and `F` (fullscreen toggle).
 4. **Interactive Notes Timeline**: Pauses the video automatically when you start typing a note. Note entries are logged with click-to-seek timestamp badges; clicking a note badge seeks the video player to that exact second.
5. **Auto-Completion & Auto-Save**: Auto-completes a video lesson when watch progress reaches `90%`. Periodically saves current playback timestamps every 5 seconds to local storage so you can resume precisely where you paused.
6. **AI Subtitle Translation**: Automatically translates English subtitle tracks into Vietnamese (or other selected languages) using the Gemini API, saving `.vi.vtt` (or target lang code) files next to the videos.
7. **Offline AI Summarization**: Generates structured, bulleted summaries of video lessons based on the active subtitle track. Caches them next to subtitles as `.summary.[lang].txt` files to enable instant, offline reloading without invoking the API again.
8. **Transcript-Grounded AI Chat**: Features a conversational chat sidebar where you can ask quick questions about the lesson, using the subtitle transcript text as the grounding context.
9. **API Resilience Failover**: Implements automatic fallback from `gemini-2.5-flash` to `gemini-1.5-flash` via the `v1beta` API to ensure high availability and self-healing against transient Google API outages or rate limits.
10. **Premium Dark Theme Layout**: Responsive design crafted with custom Vanilla CSS variables, visual hierarchy grid panels, and glassmorphism styling.

---

## 💎 Why Choose Us Over Buying Directly?

<table>
<tr>
<th></th>
<th>🏪 Buy from Udemy</th>
<th>🚀 Buy from Us</th>
</tr>
<tr>
<td><strong>Price</strong></td>
<td>$50 – $200 per course</td>
<td>✅ <strong>$3 – $5 per course</strong></td>
</tr>
<tr>
<td><strong>Updates</strong></td>
<td>Only while subscribed</td>
<td>✅ <strong>Lifetime FREE updates</strong></td>
</tr>
<tr>
<td><strong>Offline Access</strong></td>
<td>Limited mobile only</td>
<td>✅ <strong>Full desktop + mobile offline</strong></td>
</tr>
<tr>
<td><strong>AI Features</strong></td>
<td>❌ None</td>
<td>✅ <strong>Translation, Summary, Chat</strong></td>
</tr>
<tr>
<td><strong>Subtitles</strong></td>
<td>English only for most</td>
<td>✅ <strong>Auto-translate to any language</strong></td>
</tr>
<tr>
<td><strong>Notes & Progress</strong></td>
<td>Basic bookmarks</td>
<td>✅ <strong>Timestamped notes + auto-save</strong></td>
</tr>
</table>

---

## 📁 Project Structure

```
udemy-player/
├── backend/
│   ├── server.js          # Express server with range-streaming, VTT conversion, & persistence APIs
│   ├── scanner.js         # File grouping and section sorting scanner
│   ├── progress_db.json   # Local user notes and completion database (JSON)
│   └── package.json       # Backend server dependencies
├── docs/                  # Technical specifications, implementation plans, and task lists
├── frontend/              # Vite React client
│   ├── src/
│   │   ├── components/
│   │   │   ├── CourseSelector.jsx # Course folder scanner input & history
│   │   │   ├── Sidebar.jsx        # Chapter accordion menu & completion logs
│   │   │   ├── VideoPlayer.jsx    # Media streaming stage with hotkeys & speeds
│   │   │   ├── DocViewer.jsx      # Local PDF embeds & HTML checkpoint iframes
│   │   │   └── NotesPanel.jsx     # Annotation manager with timestamp seeks
│   │   ├── App.jsx        # App logic controller
│   │   ├── main.jsx       # Client entry
│   │   └── index.css      # Dark-mode styling tokens and layout rules
│   ├── vite.config.js     # Dev server proxy configuration
│   └── package.json       # Client dependencies
├── package.json           # Root runner scripts (starts concurrently)
├── telegram.jpg           # Telegram contact image/QR code
└── README.md              # This setup guide
```

---

## 🚀 Setup & Running

### Prerequisites
* [Node.js](https://nodejs.org/) (v16+)

### 1. Install Dependencies
Install all root, client, and server dependencies in one go:
```bash
npm run install:all
```

### 2. Start the Development Stack
Start both the API backend (Express on port `3003`) and client frontend (Vite on port `3002`) concurrently:
```bash
npm run dev
```

### 3. Open in Browser
Visit **[http://localhost:3002](http://localhost:3002)** to browse and play your courses.

### 4. Running the Desktop App (macOS DMG)
If you build/package the desktop application using `npm run package` or download the compiled `.dmg` from GitHub, macOS Gatekeeper may block it on first launch with a warning that the app is "damaged" or "developer cannot be verified".

To bypass this restriction and run the app:
1. Drag **Udemy Offline Player.app** to your `/Applications` folder.
2. Open terminal and run:
   ```bash
   # Remove the quarantine attribute added by macOS for downloaded files
   xattr -cr /Applications/Udemy\ Offline\ Player.app
   
   # Self-sign the application to allow it to run locally
   codesign --force --deep --sign - /Applications/Udemy\ Offline\ Player.app
   ```
3. You can now launch the application normally from Applications or Launchpad.

---

## 🔌 API Endpoints

* **`GET /api/course-content?path=<absolute-path>`**: Scans the folder and returns grouped chapters and lesson resources.
* **`GET /api/stream?path=<video-file-path>`**: Streams local video assets supporting Byte-Range header requests (allows seeking).
* **`GET /api/subtitle?path=<subtitle-file-path>`**: Feeds SubRip (`.srt`) contents converted to WebVTT format on-the-fly.
* **`GET /api/resource?path=<document-file-path>`**: Serves PDFs and HTML checkpoints securely with appropriate MIME types.
* **`GET /api/userdata`**: Returns completion logs, note timelines, and active paths from `progress_db.json`.
* **`POST /api/userdata/course`**: Scans and adds new course path to recent history.
* **`POST /api/userdata/progress`**: Updates completion states and watch logs.
* **`POST /api/userdata/notes`**: Inserts or updates annotation notes.
* **`DELETE /api/userdata/notes`**: Removes note entries from a lesson timeline.
* **`POST /api/userdata/settings`**: Saves application settings (such as the Gemini API Key).
* **`POST /api/translate-subtitle`**: Translates English subtitles into a target language using Gemini, saving the `.vtt` file next to the media.
* **`POST /api/summarize-lesson`**: Generates (and caches to disk next to subtitles) or retrieves a cached lesson summary.
* **`POST /api/clear-summary`**: Clears the cached summary file from disk to force regeneration.
* **`POST /api/chat-lesson`**: Chat assistant grounded in the subtitles transcript.
* **`POST /api/browse-folder`**: Launches native OS folder dialog window.

---

<h2 align="center">🎯 Don't Miss Out!</h2>

<p align="center">
  <strong>Join thousands of happy learners who saved 95% on premium Udemy courses.</strong><br/>
  💬 Message us on <strong>Telegram</strong> today — tell us what you want to learn, and we'll get it for you!
</p>

<p align="center">
  <img src="https://img.shields.io/badge/💰_Cheap_Prices-brightgreen?style=for-the-badge" alt="Cheap Prices" />
  <img src="https://img.shields.io/badge/♾️_Lifetime_Updates-blue?style=for-the-badge" alt="Lifetime Updates" />
  <img src="https://img.shields.io/badge/⚡_Instant_Delivery-orange?style=for-the-badge" alt="Instant Delivery" />
</p>

<p align="center">
  <em>© 2026 Udemy Offline Player — Learn Smart, Pay Less ❤️</em>
</p>

