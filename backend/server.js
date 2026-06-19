const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { scanCourseFolder } = require('./scanner');

const app = express();
const PORT = process.env.PORT || 3003;
const DB_FILE = path.join(__dirname, 'progress_db.json');

app.use(cors());
app.use(express.json());

// Helper to load/save JSON database file
function readDb() {
  const defaultPath = '/Users/hientranthanh/Downloads/udemy_courses/downloads/Pianoforall - Incredible New Way To Learn Piano & Keyboard';
  if (!fs.existsSync(DB_FILE)) {
    return {
      activeCoursePath: defaultPath,
      history: [defaultPath],
      progress: {}, // lessonId -> { completed: boolean, watchTime: number, duration: number }
      notes: {},     // lessonId -> Array of { id, timestamp, text, createdAt }
      settings: { geminiApiKey: '' }
    };
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.settings) {
      parsed.settings = { geminiApiKey: '' };
    }
    return parsed;
  } catch (e) {
    console.error('Error reading database file, returning fallback state', e);
    return {
      activeCoursePath: defaultPath,
      history: [defaultPath],
      progress: {},
      notes: {},
      settings: { geminiApiKey: '' }
    };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing database file', e);
  }
}

// Convert SubRip (.srt) to WebVTT (.vtt) in-memory
function srtToVtt(srtContent) {
  // Strip BOM (Byte Order Mark) if present at the start of the file
  const cleanContent = srtContent.replace(/^\uFEFF/, '');
  let vtt = 'WEBVTT\n\n';
  vtt += cleanContent
    .replace(/\r\n/g, '\n')
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  return vtt;
}

// -- API ROUTES --

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// 1. Get Course Structure
app.get('/api/course-content', (req, res) => {
  const coursePath = req.query.path || readDb().activeCoursePath;
  try {
    const content = scanCourseFolder(coursePath);
    res.json({ success: true, coursePath, sections: content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Stream video file (supports HTTP Byte-Range requests)
app.get('/api/stream', (req, res) => {
  const videoPath = req.query.path;
  if (!videoPath) {
    return res.status(400).send('Path parameter is required');
  }

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video file not found');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    
    if (start >= fileSize || end >= fileSize || start > end) {
      return res.status(416).send('Requested range not satisfiable\n' + start + '-' + end + ' of ' + fileSize);
    }
    
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    
    res.writeHead(206, head);
    
    file.on('error', (err) => {
      console.error('Video stream chunk read error:', err);
      if (!res.headersSent) {
        res.status(500).send('Stream error');
      }
    });

    res.on('close', () => {
      file.destroy();
    });

    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    const file = fs.createReadStream(videoPath);
    
    file.on('error', (err) => {
      console.error('Video stream read error:', err);
      if (!res.headersSent) {
        res.status(500).send('Stream error');
      }
    });

    res.on('close', () => {
      file.destroy();
    });

    file.pipe(res);
  }
});

// 3. Serve subtitles (translates SRT to WebVTT on the fly)
app.get('/api/subtitle', (req, res) => {
  const subtitlePath = req.query.path;
  if (!subtitlePath) {
    return res.status(400).send('Path parameter is required');
  }

  if (!fs.existsSync(subtitlePath)) {
    return res.status(404).send('Subtitle file not found');
  }

  fs.readFile(subtitlePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading subtitle file');
    }
    const vttData = srtToVtt(data);
    res.setHeader('Content-Type', 'text/vtt');
    res.send(vttData);
  });
});

// 4. Serve resources (PDF and HTML pages)
app.get('/api/resource', (req, res) => {
  const resourcePath = req.query.path;
  if (!resourcePath) {
    return res.status(400).send('Path parameter is required');
  }

  if (!fs.existsSync(resourcePath)) {
    return res.status(404).send('Resource file not found');
  }

  const ext = path.extname(resourcePath).toLowerCase();
  let contentType = 'application/octet-stream';
  if (ext === '.pdf') {
    contentType = 'application/pdf';
  } else if (ext === '.html' || ext === '.htm') {
    contentType = 'text/html';
  }

  res.setHeader('Content-Type', contentType);
  fs.createReadStream(resourcePath).pipe(res);
});

// 5. Get all User Data (Active course, history, notes, completed states)
app.get('/api/userdata', (req, res) => {
  res.json(readDb());
});

// 6. Update Active Course Path
app.post('/api/userdata/course', (req, res) => {
  const { path: coursePath } = req.body;
  if (!coursePath) {
    return res.status(400).json({ error: 'Course path is required' });
  }

  if (!fs.existsSync(coursePath)) {
    return res.status(400).json({ error: 'Folder does not exist on disk' });
  }

  const db = readDb();
  db.activeCoursePath = coursePath;
  if (!db.history.includes(coursePath)) {
    db.history.push(coursePath);
  }
  writeDb(db);
  res.json(db);
});

// 7. Update progress completion and watchTime
app.post('/api/userdata/progress', (req, res) => {
  const { lessonId, completed, watchTime, duration } = req.body;
  if (!lessonId) {
    return res.status(400).json({ error: 'lessonId is required' });
  }

  const db = readDb();
  const currentProgress = db.progress[lessonId] || { completed: false, watchTime: 0, duration: 0 };
  
  db.progress[lessonId] = {
    completed: typeof completed !== 'undefined' ? completed : currentProgress.completed,
    watchTime: typeof watchTime !== 'undefined' ? watchTime : currentProgress.watchTime,
    duration: typeof duration !== 'undefined' ? duration : currentProgress.duration
  };

  writeDb(db);
  res.json(db);
});

// 8. Add or Update a Note
app.post('/api/userdata/notes', (req, res) => {
  const { lessonId, noteId, timestamp, text } = req.body;
  if (!lessonId || typeof timestamp === 'undefined' || !text) {
    return res.status(400).json({ error: 'lessonId, timestamp, and text are required' });
  }

  const db = readDb();
  if (!db.notes[lessonId]) {
    db.notes[lessonId] = [];
  }

  if (noteId) {
    // Edit existing note
    const note = db.notes[lessonId].find(n => n.id === noteId);
    if (note) {
      note.text = text;
      note.timestamp = timestamp;
    }
  } else {
    // Create new note
    const newNote = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp,
      text,
      createdAt: new Date().toISOString()
    };
    db.notes[lessonId].push(newNote);
  }

  // Sort notes by timestamp
  db.notes[lessonId].sort((a, b) => a.timestamp - b.timestamp);

  writeDb(db);
  res.json(db);
});

// 9. Delete a Note
app.delete('/api/userdata/notes', (req, res) => {
  const { lessonId, noteId } = req.body;
  if (!lessonId || !noteId) {
    return res.status(400).json({ error: 'lessonId and noteId are required' });
  }

  const db = readDb();
  if (db.notes[lessonId]) {
    db.notes[lessonId] = db.notes[lessonId].filter(n => n.id !== noteId);
  }

  writeDb(db);
  res.json(db);
});

// 10. Update Settings
app.post('/api/userdata/settings', (req, res) => {
  const { geminiApiKey } = req.body;
  const db = readDb();
  if (!db.settings) {
    db.settings = {};
  }
  db.settings.geminiApiKey = geminiApiKey || '';
  writeDb(db);
  res.json(db);
});

// 11. Translate Subtitle from English to Vietnamese (or custom targetLang)
app.post('/api/translate-subtitle', async (req, res) => {
  const { subtitlePath, apiKey, targetLang } = req.body;
  if (!subtitlePath) {
    return res.status(400).json({ error: 'subtitlePath is required' });
  }

  const db = readDb();
  const effectiveApiKey = apiKey || (db.settings && db.settings.geminiApiKey);

  if (!effectiveApiKey) {
    return res.status(400).json({ error: 'Gemini API Key is missing. Please set it in Settings.' });
  }

  if (!fs.existsSync(subtitlePath)) {
    return res.status(404).json({ error: `Subtitle file not found: ${subtitlePath}` });
  }

  const SUPPORTED_LANGUAGES = {
    vi: 'Vietnamese',
    ja: 'Japanese',
    zh: 'Chinese',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    ko: 'Korean',
    ru: 'Russian',
    ar: 'Arabic',
    pt: 'Portuguese',
    en: 'English'
  };

  const targetLangCode = (targetLang || 'vi').toLowerCase();
  const targetLanguageName = SUPPORTED_LANGUAGES[targetLangCode] || targetLangCode.toUpperCase();

  try {
    const subtitleContent = fs.readFileSync(subtitlePath, 'utf8');

    const prompt = `Translate the following English subtitle file to ${targetLanguageName}. 
You must preserve all timecodes, formatting, line numbers, and subtitle syntax exactly. 
Do not translate or modify timecodes or line numbers (e.g. 00:01:23,450 --> 00:01:25,120).
Ensure the ${targetLanguageName} translation is natural, fits the context, and uses appropriate terminology.
Do not add any explanations, markdown code blocks, or introductory text. Return ONLY the translated subtitle file contents.

[Subtitle File Content]:
${subtitleContent}`;

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key=${effectiveApiKey}`;
    
    console.log(`Calling Gemini API for translation to ${targetLanguageName}...`);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API call failed:', errorText);
      return res.status(response.status).json({ error: `Gemini API error: ${response.statusText}`, details: errorText });
    }

    const responseData = await response.json();
    let translatedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!translatedText) {
      console.error('Empty response from Gemini API:', responseData);
      return res.status(500).json({ error: 'No translation text returned from Gemini API' });
    }

    // Clean up markdown block if the model returned it
    translatedText = translatedText.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');

    // Convert SRT to WebVTT format in-memory if needed
    if (!translatedText.trim().startsWith('WEBVTT')) {
      translatedText = srtToVtt(translatedText);
    }

    // Save translated file as .[targetLang].vtt
    const dir = path.dirname(subtitlePath);
    const ext = path.extname(subtitlePath);
    let base = path.basename(subtitlePath, ext);
    
    // Strip language suffixes if present in source (e.g. .en, .en_US, .vi)
    base = base.replace(/\.[a-z]{2}(?:_[a-z]{2,4})?$/i, '');

    const outPath = path.join(dir, `${base}.${targetLangCode}.vtt`);
    fs.writeFileSync(outPath, translatedText, 'utf8');

    res.json({ success: true, path: outPath });
  } catch (error) {
    console.error('Subtitle translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 12. Native Folder Dialog Browser
app.post('/api/browse-folder', (req, res) => {
  if (process.platform === 'darwin') {
    const cmd = `osascript -e 'POSIX path of (choose folder with prompt "Select Udemy course folder:")'`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        if (err.message.includes('-128') || err.message.includes('User canceled')) {
          return res.json({ cancelled: true });
        }
        console.error('macOS Folder Selector error:', err);
        return res.status(500).json({ error: err.message });
      }
      const selectedPath = stdout.trim();
      res.json({ selectedPath });
    });
  } else if (process.platform === 'win32') {
    const cmd = `powershell -Command "& { Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; if ($f.ShowDialog() -eq 'OK') { $f.SelectedPath } }"`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error('Windows Folder Selector error:', err);
        return res.status(500).json({ error: err.message });
      }
      const selectedPath = stdout.trim();
      if (!selectedPath) {
        return res.json({ cancelled: true });
      }
      res.json({ selectedPath });
    });
  } else {
    res.status(500).json({ error: 'Native folder browser is only supported on macOS and Windows.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
