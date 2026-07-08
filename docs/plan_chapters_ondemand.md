# Plan: On-Demand Chapters Generation with Language Selection

This document outlines the technical implementation steps for the on-demand chapters generation, language selection, and chapter regeneration.

## 1. Backend Changes (`backend/server.js`)

### Step 1.1: Modify `GET /api/chapters`
- Remove the automatic call to `generateChaptersFromSubtitlesFile` when cached chapters do not exist.
- Instead, return `{ success: true, chapters: [], cached: false, exists: false }`.

```javascript
// GET Chapters
app.get('/api/chapters', async (req, res) => {
  ...
  // Check if cached chapters exist
  if (fs.existsSync(chaptersPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));
      return res.json({ success: true, chapters: data, cached: true, exists: true });
    } catch (err) {
      console.error('Failed to parse cached chapters JSON:', err);
    }
  }

  // Do NOT generate chapters automatically. Just return exists: false
  return res.json({ success: true, chapters: [], cached: false, exists: false });
});
```

### Step 1.2: Modify `POST /api/chapters/regenerate`
- Extract `language` from `req.body`.
- Pass `language` to `generateChaptersFromSubtitlesFile`.

```javascript
app.post('/api/chapters/regenerate', async (req, res) => {
  const { videoPath, subtitlePath, language } = req.body;
  ...
  try {
    const chapters = await generateChaptersFromSubtitlesFile(subtitlePath, chaptersPath, language);
    res.json({ success: true, chapters });
  } catch (err) { ... }
});
```

### Step 1.3: Update `generateChaptersFromSubtitlesFile`
- Accept a third parameter `language`.
- Update the prompt to ask Gemini to output chapter titles in the selected language.

```javascript
async function generateChaptersFromSubtitlesFile(subtitlePath, chaptersPath, language) {
  ...
  const targetLanguage = language || 'English';
  const prompt = `Analyze the following video transcript to divide the video into logical chapters/topics (usually 3 to 8 chapters depending on video length and density of content).
For each chapter, provide the starting timestamp in seconds (integer) and a brief, descriptive title (maximum 40 characters) written in ${targetLanguage}.
The first chapter MUST start at 0 seconds.
...
`;
}
```

---

## 2. Frontend Changes (`frontend/src/components/VideoPlayer.jsx`)

### Step 2.1: Add State for Chosen Chapter Language
- Add `selectedChapterLang` state. Default to `localStorage.getItem('udemy-player-chapter-lang') || 'English'`.
- Save value to `localStorage` when selected/changed/generated.

### Step 2.2: Update Initial Fetch logic
- On load/mount, fetch from `/api/chapters`.
- If `data.success` is true, set `chapters` to `data.chapters` (which is `[]` if not generated yet).

### Step 2.3: Update `handleGenerateChapters`
- Change `handleGenerateChapters` to pass `selectedChapterLang` as `language` in the JSON POST request body.
- On success, set `chapters`.

### Step 2.4: Render Language Selector in Controls Bar
- Under custom controls bar, replace:
  `(!chapters || chapters.length === 0) && subtitleSrc && ( ... )`
- With a dropdown (`<select>` populated with English and `CURATED_LANGUAGES`) and a "✨ Generate" button.

### Step 2.5: Render Re-generation Section in Chapters Panel
- Inside `<div className="video-chapters-panel ...">`, right under `<div className="video-chapters-header">`, add a sub-header or action section.
- This section will display:
  - Label: "Re-generate in:"
  - `<select>` dropdown for language selection.
  - "✨ Re-generate" button.
- Make sure to style it to look native and clean.

---

## 3. CSS Changes (`frontend/src/index.css`)
- If needed, add styles for `.video-chapters-actions` and ensure selectors match the dark glassmorphic design of the course player controls.
