const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { scanCourseFolder } = require('./scanner');

const app = express();
const PORT = process.env.PORT || 3003;
const DB_FILE = process.env.USER_DATA_PATH
  ? path.join(process.env.USER_DATA_PATH, 'progress_db.json')
  : path.join(__dirname, 'progress_db.json');

const DEFAULT_SETTINGS = {
  aiProvider: 'gemini',
  geminiApiKey: '',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-5-sonnet-latest',
  anthropicBaseUrl: 'https://api.anthropic.com',
  autoplayNext: false
};

const DEFAULT_DB = {
  activeCoursePath: '',
  history: [],
  progress: {}, // lessonId -> { completed: boolean, watchTime: number, duration: number }
  notes: {},     // lessonId -> Array of { id, timestamp, text, createdAt }
  settings: { ...DEFAULT_SETTINGS }
};

app.use(cors());
app.use(express.json());

// Helper to load/save JSON database file
function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    return structuredClone(DEFAULT_DB);
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed.settings) {
      parsed.settings = {};
    }
    // Merge defaults to backfill any missing settings fields
    parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };

    // Ensure activeCoursePath exists on disk
    if (parsed.activeCoursePath && !fs.existsSync(parsed.activeCoursePath)) {
      parsed.activeCoursePath = '';
    }
    // Filter history to paths that actually exist on disk
    if (parsed.history && Array.isArray(parsed.history)) {
      parsed.history = parsed.history.filter(h => fs.existsSync(h));
    } else {
      parsed.history = [];
    }
    return parsed;
  } catch (e) {
    console.error('Error reading database file, returning fallback state', e);
    return structuredClone(DEFAULT_DB);
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing database file', e);
  }
}

// Resilient API Caller that falls back from Gemini 2.5 Flash to Gemini 1.5 Flash on transient errors
async function callGeminiWithFallback(apiKey, payloadBody, isV1Beta = false) {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    const apiVersion = isV1Beta ? 'v1beta' : 'v1';
    const currentUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

    console.log(`Attempting Gemini API call with model ${model} via ${apiVersion}...`);
    try {
      const response = await fetch(currentUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadBody)
      });

      let responseText = '';
      try {
        responseText = await response.text();
      } catch (readErr) {
        console.warn(`Failed to read response body for model ${model}:`, readErr);
      }

      if (response.ok) {
        try {
          const responseData = JSON.parse(responseText);
          const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return text;
          }
        } catch (jsonErr) {
          console.warn(`Failed to parse Gemini response as JSON:`, jsonErr);
        }
      }

      console.warn(`Gemini call with model ${model} failed (HTTP ${response.status}):`, responseText);
      lastError = new Error(`Gemini API error: ${response.statusText} (${responseText})`);
    } catch (e) {
      console.warn(`Network error with model ${model}:`, e);
      lastError = e;
    }
  }

  throw lastError || new Error('All Gemini model attempts failed.');
}

// Resolve AI provider configuration from database + optional API key override
function getAiConfig(db, overrideApiKey) {
  const provider = db.settings?.aiProvider || 'gemini';
  const providerName = provider === 'anthropic' ? 'Anthropic' : 'Gemini';
  const apiKey = provider === 'anthropic'
    ? db.settings?.anthropicApiKey || ''
    : overrideApiKey || db.settings?.geminiApiKey || '';
  const model = provider === 'anthropic'
    ? db.settings?.anthropicModel || 'claude-3-5-sonnet-latest'
    : null;
  const baseUrl = provider === 'anthropic'
    ? db.settings?.anthropicBaseUrl || 'https://api.anthropic.com'
    : null;
  return { provider, providerName, apiKey, model, baseUrl };
}

// Unified AI provider dispatcher — translates a prompt + options into API calls
async function callAiProvider(config, prompt, options = {}) {
  const { provider, apiKey, model, baseUrl } = config;
  const { isChat = false, messages = [], systemInstruction, maxTokens = 4096 } = options;

  if (provider === 'anthropic') {
    const anthropicMessages = isChat
      ? messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      : [{ role: 'user', content: prompt }];
    const payload = { messages: anthropicMessages };
    if (systemInstruction) {
      payload.system = systemInstruction;
    }
    return await callAnthropic(apiKey, baseUrl, model, payload, maxTokens);
  }

  // Gemini path
  if (isChat) {
    const payload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    };
    return await callGeminiWithFallback(apiKey, payload, true);
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  return await callGeminiWithFallback(apiKey, payload, false);
}

// Caller for Anthropic API or Anthropic-compatible custom endpoints
async function callAnthropic(apiKey, baseUrl, model, payloadBody, maxTokens = 4096) {
  const cleanBaseUrl = (baseUrl || 'https://api.anthropic.com').replace(/\/$/, '');
  const url = `${cleanBaseUrl}/v1/messages`;

  console.log(`Attempting Anthropic API call with model ${model} via ${url}...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        ...(payloadBody.system ? { system: payloadBody.system } : {}),
        messages: payloadBody.messages
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    let responseText = '';
    try {
      responseText = await response.text();
    } catch (readErr) {
      console.warn('Failed to read response body:', readErr);
    }

    if (response.ok) {
      try {
        const responseData = JSON.parse(responseText);

        // Handle array content blocks (standard Anthropic format)
        if (Array.isArray(responseData.content)) {
          // 1. Collect standard text blocks
          const textBlocks = responseData.content.filter(block => block?.type === 'text' && typeof block?.text === 'string');
          if (textBlocks.length > 0) {
            return textBlocks.map(block => block.text).join('\n');
          }
          // 2. Collect thinking blocks (DeepSeek, some compatible providers)
          const thinkingBlocks = responseData.content.filter(block => block?.type === 'thinking' && typeof block?.thinking === 'string');
          if (thinkingBlocks.length > 0) {
            return thinkingBlocks.map(block => block.thinking).join('\n');
          }
          // 3. Fallback: any block with a .text property
          const anyText = responseData.content.find(block => typeof block?.text === 'string');
          if (anyText) {
            return anyText.text;
          }
          // 4. Last-resort fallback: any block with any string property that looks like content
          const anyContent = responseData.content.find(block => {
            if (!block || typeof block !== 'object') return false;
            return Object.values(block).some(v => typeof v === 'string' && v.length > 0);
          });
          if (anyContent) {
            const contentValue = Object.values(anyContent).find(v => typeof v === 'string' && v.length > 0);
            console.warn(`Extracted content from non-standard block type "${anyContent.type}":`, contentValue?.substring(0, 100));
            return contentValue;
          }
        }

        // Handle string content (some compatible APIs)
        if (typeof responseData.content === 'string') {
          return responseData.content;
        }

        // Handle direct text/response field (non-standard compatible endpoints)
        if (typeof responseData.text === 'string') {
          return responseData.text;
        }
        if (typeof responseData.response === 'string') {
          return responseData.response;
        }

        // If we got a 200 but couldn't extract any content, log the full structure for debugging
        console.warn('Anthropic response HTTP 200 but no extractable content found. Response keys:', Object.keys(responseData));
        console.warn('Content structure:', JSON.stringify(responseData.content).substring(0, 500));
        throw new Error('Anthropic API returned HTTP 200 but the response content could not be parsed. The provider may use a non-standard response format.');
      } catch (jsonErr) {
        // If we already threw our own structured error, re-throw it
        if (jsonErr.message && jsonErr.message.includes('response content could not be parsed')) {
          throw jsonErr;
        }
        console.warn('Failed to parse Anthropic response as JSON:', jsonErr);
      }
    }

    const statusInfo = response.statusText || 'Unknown error';
    const bodyPreview = responseText ? ` (${responseText.substring(0, 500)})` : '';
    console.warn(`Anthropic call with model ${model} failed (HTTP ${response.status}):`, responseText);
    throw new Error(`Anthropic API error: HTTP ${response.status} - ${statusInfo}${bodyPreview}`);
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      console.warn(`Anthropic call with model ${model} timed out after 120s`);
      throw new Error('Anthropic API request timed out. Please try again.');
    }
    console.warn(`Error connecting to Anthropic with model ${model}:`, e);
    throw e;
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
  if (!coursePath) {
    return res.json({ success: false, error: 'No course folder selected.' });
  }
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

// 4. Serve resources (PDF, HTML pages, and downloadable companion files)
app.get('/api/resource', (req, res) => {
  const resourcePath = req.query.path;
  if (!resourcePath) {
    return res.status(400).send('Path parameter is required');
  }

  if (!fs.existsSync(resourcePath)) {
    return res.status(404).send('Resource file not found');
  }

  const ext = path.extname(resourcePath).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.zip': 'application/zip',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);

  // Force download for binary document formats, archives, etc.
  const previewTypes = ['application/pdf', 'text/html', 'text/plain', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'];
  if (!previewTypes.includes(contentType)) {
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(path.basename(resourcePath))}"`);
  }

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

// 6a. Delete Course Path from History
app.delete('/api/userdata/course', (req, res) => {
  const { path: coursePath } = req.body;
  if (!coursePath) {
    return res.status(400).json({ error: 'Course path is required' });
  }

  const db = readDb();
  db.history = db.history.filter(h => h !== coursePath);
  if (db.activeCoursePath === coursePath) {
    db.activeCoursePath = '';
  }
  writeDb(db);
  res.json(db);
});

// 6b. Modify Course Path in History
app.put('/api/userdata/course', (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) {
    return res.status(400).json({ error: 'Both oldPath and newPath are required' });
  }

  if (!fs.existsSync(newPath)) {
    return res.status(400).json({ error: 'New folder does not exist on disk' });
  }

  const db = readDb();
  db.history = db.history.map(h => h === oldPath ? newPath : h);
  // Ensure no duplicates
  db.history = [...new Set(db.history)];

  if (db.activeCoursePath === oldPath) {
    db.activeCoursePath = newPath;
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
  const { aiProvider, geminiApiKey, anthropicApiKey, anthropicModel, anthropicBaseUrl, autoplayNext } = req.body;
  const db = readDb();
  if (!db.settings) {
    db.settings = {};
  }
  db.settings.aiProvider = aiProvider || DEFAULT_SETTINGS.aiProvider;
  db.settings.geminiApiKey = geminiApiKey || DEFAULT_SETTINGS.geminiApiKey;
  db.settings.anthropicApiKey = anthropicApiKey || DEFAULT_SETTINGS.anthropicApiKey;
  db.settings.anthropicModel = anthropicModel || DEFAULT_SETTINGS.anthropicModel;
  db.settings.anthropicBaseUrl = anthropicBaseUrl || DEFAULT_SETTINGS.anthropicBaseUrl;
  db.settings.autoplayNext = typeof autoplayNext === 'boolean' ? autoplayNext : DEFAULT_SETTINGS.autoplayNext;
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
  const config = getAiConfig(db, apiKey);

  if (!config.apiKey) {
    const errorMsg = `${config.providerName} API Key is missing. Please set it in Settings.`;
    return res.status(400).json({ error: errorMsg });
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
    en: 'English',
    id: 'Indonesian',
    it: 'Italian'
  };

  const getLanguageName = (code) => {
    const cleanCode = (code || '').split(/[_-]/)[0].toLowerCase();
    return SUPPORTED_LANGUAGES[cleanCode] || cleanCode.toUpperCase();
  };

  const filename = path.basename(subtitlePath);
  const match = filename.toLowerCase().match(/[._-]([a-z]{2}(?:_[a-z]{2,4})?)\.(?:srt|vtt)$/i);
  const sourceLangCode = match ? match[1].toLowerCase() : 'en';

  const sourceLanguageName = getLanguageName(sourceLangCode);
  const targetLangCode = (targetLang || 'vi').toLowerCase();
  const targetLanguageName = getLanguageName(targetLangCode);

  try {
    const subtitleContent = fs.readFileSync(subtitlePath, 'utf8');

    const prompt = `Translate the following ${sourceLanguageName} subtitle file to ${targetLanguageName}.
You must preserve all timecodes, formatting, line numbers, and subtitle syntax exactly.
Do not translate or modify timecodes or line numbers (e.g. 00:01:23,450 --> 00:01:25,120).
Ensure the ${targetLanguageName} translation is natural, fits the context, and uses appropriate terminology.
Do not add any explanations, markdown code blocks, or introductory text. Return ONLY the translated subtitle file contents.

[Subtitle File Content]:
${subtitleContent}`;

    console.log(`Calling ${config.providerName} API for translation to ${targetLanguageName}...`);
    const translatedText = await callAiProvider(config, prompt);

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

// 12. Summarize Lesson based on subtitle file
app.post('/api/summarize-lesson', async (req, res) => {
  const { subtitlePath, langCode } = req.body;
  if (!subtitlePath || !langCode) {
    return res.status(400).json({ error: 'subtitlePath and langCode are required' });
  }

  const db = readDb();
  const config = getAiConfig(db);

  if (!config.apiKey) {
    const errorMsg = `${config.providerName} API Key is missing. Please set it in Settings.`;
    return res.status(400).json({ error: errorMsg });
  }

  if (!fs.existsSync(subtitlePath)) {
    return res.status(404).json({ error: `Subtitle file not found: ${subtitlePath}` });
  }

  // Determine summary file path next to subtitle path
  const dir = path.dirname(subtitlePath);
  const ext = path.extname(subtitlePath);
  let base = path.basename(subtitlePath, ext);

  // Strip language suffix if any (e.g. .en, .vi, .ja)
  base = base.replace(/\.[a-z]{2}(?:_[a-z]{2,4})?$/i, '');
  const outPath = path.join(dir, `${base}.summary.${langCode.toLowerCase()}.txt`);

  // Check cache first
  if (fs.existsSync(outPath)) {
    try {
      const summaryContent = fs.readFileSync(outPath, 'utf8');
      return res.json({ success: true, summary: summaryContent, cached: true });
    } catch (e) {
      console.error('Error reading cached summary', e);
    }
  }

  if (req.body.checkCacheOnly) {
    return res.json({ success: true, summary: null, cached: false });
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
  const targetLanguageName = SUPPORTED_LANGUAGES[langCode.toLowerCase()] || langCode.toUpperCase();

  try {
    const subtitleContent = fs.readFileSync(subtitlePath, 'utf8');

    const prompt = `You are an expert offline learning assistant.
Below is the subtitle transcript of a video lesson.
Please write a concise, structured summary of this lesson.
The summary must:
- Highlight the key concepts, main topics covered, and actionable takeaways.
- Be formatted in clean, beautiful Markdown (using headers, lists, bold text where appropriate).
- Be written in the target language: ${targetLanguageName}.
- Do NOT include any meta-commentary, explanations, introductory text, or markdown code blocks (like \`\`\`markdown). Return ONLY the direct summary content.

[Subtitle Transcript]:
${subtitleContent}`;

    console.log(`Calling ${config.providerName} API for summary in ${targetLanguageName}...`);
    let summaryText = await callAiProvider(config, prompt);

    // Clean up markdown block if the model returned it
    summaryText = summaryText.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');

    // Save summary file next to subtitle
    fs.writeFileSync(outPath, summaryText, 'utf8');

    res.json({ success: true, summary: summaryText, cached: false });
  } catch (error) {
    console.error('Lesson summarization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 13. Clear Summarize Cache
app.post('/api/clear-summary', (req, res) => {
  const { subtitlePath, langCode } = req.body;
  if (!subtitlePath || !langCode) {
    return res.status(400).json({ error: 'subtitlePath and langCode are required' });
  }

  try {
    const dir = path.dirname(subtitlePath);
    const ext = path.extname(subtitlePath);
    let base = path.basename(subtitlePath, ext);
    base = base.replace(/\.[a-z]{2}(?:_[a-z]{2,4})?$/i, '');
    const outPath = path.join(dir, `${base}.summary.${langCode.toLowerCase()}.txt`);

    if (fs.existsSync(outPath)) {
      fs.unlinkSync(outPath);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing summary file:', error);
    res.status(500).json({ error: error.message });
  }
});

// 14. Chat about lesson based on subtitle file
app.post('/api/chat-lesson', async (req, res) => {
  const { subtitlePath, messages } = req.body;
  if (!subtitlePath || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'subtitlePath and messages array are required' });
  }

  const db = readDb();
  const config = getAiConfig(db);

  if (!config.apiKey) {
    const errorMsg = `${config.providerName} API Key is missing. Please set it in Settings.`;
    return res.status(400).json({ error: errorMsg });
  }

  if (!fs.existsSync(subtitlePath)) {
    return res.status(404).json({ error: `Subtitle file not found: ${subtitlePath}` });
  }

  try {
    const subtitleContent = fs.readFileSync(subtitlePath, 'utf8');

    const systemInstruction = `You are a helpful AI assistant for an offline course player.
The student is watching a video lesson. Below is the transcript (subtitles) of the current lesson:
---
${subtitleContent}
---
Use the transcript above to answer the student's question accurately.
If the question is about something not discussed in the transcript but relevant to the lesson topic, feel free to answer using your general knowledge, but prioritize the transcript details.
Keep your response concise, clear, and direct. Use the same language as the student's question.`;

    console.log(`Calling ${config.providerName} API for chat question...`);
    let replyText = await callAiProvider(config, null, {
      isChat: true,
      messages,
      systemInstruction,
      maxTokens: 8192
    });

    res.json({ success: true, reply: replyText });
  } catch (error) {
    console.error('Chat lesson error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 15. Native Folder Dialog Browser
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

// Serve frontend static assets in production
if (process.env.NODE_ENV === 'production' || process.env.PACKAGED === 'true') {
  const frontendDist = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  
  // Fallback for SPA routing: serve index.html for all non-API paths
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    } else {
      next();
    }
  });
}

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
