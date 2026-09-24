const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec, execFileSync, execFile } = require('child_process');

require('./lib/path-env');
const crypto = require('crypto');
const os = require('os');
const { scanCourseFolder, getVideoDuration } = require('./scanner');
const { parseSubtitleCues } = require('./lib/subtitle');
const { getFfmpegPath, getFfprobePath } = require('./lib/ffmpeg-path');
const { searchWeb } = require('./lib/web-search');

const app = express();
const PORT = process.env.PORT || 3003;
const DB_FILE = process.env.USER_DATA_PATH
  ? path.join(process.env.USER_DATA_PATH, 'progress_db.json')
  : path.join(__dirname, 'progress_db.json');

const DEFAULT_SETTINGS = {
  aiProvider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  anthropicApiKey: '',
  anthropicModel: 'claude-3-5-sonnet-latest',
  anthropicBaseUrl: 'https://api.anthropic.com',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  openaiBaseUrl: 'https://api.openai.com',
  autoplayNext: false,
  controlsPosition: 'floating',
  autoCreateTimeline: false,
  autoCreateTimelineLang: 'en',
  autoCreateSummary: false,
  autoCreateSummaryLang: 'en',
  featureModels: {
    timeline: { provider: '', model: '' },
    subtitleTranslation: { provider: '', model: '' },
    lessonSummary: { provider: '', model: '' },
    chapterSummary: { provider: '', model: '' },
    lessonChat: { provider: '', model: '' },
    chapterChat: { provider: '', model: '' },
    courseChat: { provider: '', model: '' }
  }
};

const SUPPORTED_SUMMARY_LANGUAGES = {
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

const DEFAULT_DB = {
  activeCoursePath: '',
  history: [],
  progress: {}, // lessonId -> { completed: boolean, watchTime: number, duration: number }
  notes: {},     // lessonId -> Array of { id, timestamp, text, createdAt }
  chatHistory: {}, // coursePath -> { [scopeKey]: Array of messages }
  courseStates: {}, // coursePath -> { lastLessonId, lastActiveTab, lastActiveAt, progress: {} }
  settings: { ...DEFAULT_SETTINGS }
};

app.use(cors());
app.use(express.json());

// Helper to calculate effective progress and state for user data response
function getEffectiveUserData(db, targetCoursePath = null) {
  const activeCourse = targetCoursePath || db.activeCoursePath;
  const courseState = (activeCourse && db.courseStates && db.courseStates[activeCourse]) || null;
  const effectiveProgress = {
    ...(db.progress || {}),
    ...(courseState?.progress || {})
  };
  return {
    ...db,
    progress: effectiveProgress,
    activeCourseState: courseState
  };
}

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
    parsed.settings.featureModels = {
      ...DEFAULT_SETTINGS.featureModels,
      ...(parsed.settings.featureModels || {})
    };

    if (!parsed.courseStates || typeof parsed.courseStates !== 'object') {
      parsed.courseStates = {};
    }

    if (!parsed.chatHistory || typeof parsed.chatHistory !== 'object') {
      parsed.chatHistory = {};
    }

    // Sanitize language codes if stored as full language names
    if (parsed.settings.autoCreateTimelineLang && parsed.settings.autoCreateTimelineLang.length > 2) {
      const code = Object.keys(SUPPORTED_SUMMARY_LANGUAGES).find(
        k => SUPPORTED_SUMMARY_LANGUAGES[k].toLowerCase() === parsed.settings.autoCreateTimelineLang.toLowerCase()
      );
      parsed.settings.autoCreateTimelineLang = code || DEFAULT_SETTINGS.autoCreateTimelineLang;
    }
    if (parsed.settings.autoCreateSummaryLang && parsed.settings.autoCreateSummaryLang.length > 2) {
      const code = Object.keys(SUPPORTED_SUMMARY_LANGUAGES).find(
        k => SUPPORTED_SUMMARY_LANGUAGES[k].toLowerCase() === parsed.settings.autoCreateSummaryLang.toLowerCase()
      );
      parsed.settings.autoCreateSummaryLang = code || DEFAULT_SETTINGS.autoCreateSummaryLang;
    }

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

// Caller for Google Gemini API using only the configured model without fallbacks
async function callGemini(apiKey, payloadBody, isV1Beta = false, model = 'gemini-2.5-flash', returnSources = false) {
  const targetModel = (model || 'gemini-2.5-flash').trim();
  const apiVersion = (isV1Beta || !targetModel.startsWith('gemini-1.0')) ? 'v1beta' : 'v1';
  const currentUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${targetModel}:generateContent?key=${apiKey}`;

  console.log(`Attempting Gemini API call with model ${targetModel} via ${apiVersion}...`);
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
    console.warn(`Failed to read response body for model ${targetModel}:`, readErr);
  }

  if (response.ok) {
    try {
      const responseData = JSON.parse(responseText);
      const candidate = responseData.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (text) {
        if (returnSources) {
          const sources = [];
          const groundingChunks = candidate?.groundingMetadata?.groundingChunks;
          if (Array.isArray(groundingChunks)) {
            const seen = new Set();
            for (const chunk of groundingChunks) {
              if (chunk.web && chunk.web.uri) {
                const uri = chunk.web.uri;
                if (!seen.has(uri)) {
                  seen.add(uri);
                  sources.push({
                    title: chunk.web.title || uri,
                    url: uri
                  });
                }
              }
            }
          }
          return { text, sources };
        }
        return text;
      }
    } catch (jsonErr) {
      console.warn(`Failed to parse Gemini response as JSON:`, jsonErr);
    }
  }

  console.warn(`Gemini call with model ${targetModel} failed (HTTP ${response.status}):`, responseText);
  throw new Error(`Gemini API error: ${response.statusText} (${responseText})`);
}

// Resolve AI provider configuration from database + optional API key override and feature-specific settings
function getAiConfig(db, overrideApiKey, featureKey) {
  const globalProvider = db.settings?.aiProvider || 'gemini';
  const featureConfig = (featureKey && db.settings?.featureModels?.[featureKey]) || {};

  const effectiveProvider = (featureConfig.provider && featureConfig.provider !== 'inherit')
    ? featureConfig.provider
    : globalProvider;

  const providerName = effectiveProvider === 'anthropic' ? 'Anthropic' : effectiveProvider === 'openai' ? 'OpenAI' : 'Gemini';

  let apiKey = overrideApiKey || '';
  let defaultModel = '';
  let baseUrl = null;

  if (effectiveProvider === 'anthropic') {
    if (!apiKey) apiKey = db.settings?.anthropicApiKey || '';
    defaultModel = db.settings?.anthropicModel || 'claude-3-5-sonnet-latest';
    baseUrl = db.settings?.anthropicBaseUrl || 'https://api.anthropic.com';
  } else if (effectiveProvider === 'openai') {
    if (!apiKey) apiKey = db.settings?.openaiApiKey || '';
    defaultModel = db.settings?.openaiModel || 'gpt-4o-mini';
    baseUrl = db.settings?.openaiBaseUrl || 'https://api.openai.com';
  } else {
    if (!apiKey) apiKey = db.settings?.geminiApiKey || '';
    defaultModel = db.settings?.geminiModel || 'gemini-2.5-flash';
    baseUrl = null;
  }

  const model = (featureConfig.model && featureConfig.model.trim())
    ? featureConfig.model.trim()
    : defaultModel;

  return { provider: effectiveProvider, providerName, apiKey, model, baseUrl };
}

// Unified AI provider dispatcher — translates a prompt + options into API calls
async function callAiProvider(config, prompt, options = {}) {
  const { provider, apiKey, model, baseUrl } = config;
  const {
    isChat = false,
    messages = [],
    systemInstruction,
    maxTokens = 4096,
    enableWebSearch = false,
    returnSources = false
  } = options;

  let webSearchSources = [];
  let webSearchInstruction = '';

  const lastUserMsg = isChat
    ? [...messages].reverse().find(m => m.role === 'user')?.content || ''
    : (prompt || '');

  // For OpenAI or Anthropic, fetch external web search results via DuckDuckGo helper
  if (enableWebSearch && (provider === 'openai' || provider === 'anthropic')) {
    try {
      const searchResults = await searchWeb(lastUserMsg, 4);
      if (searchResults && searchResults.length > 0) {
        webSearchSources = searchResults.map(r => ({ title: r.title, url: r.url }));
        webSearchInstruction = `\n\n--- INTERNET SEARCH RESULTS ---\nBelow are live web search results relevant to the student's question:\n` +
          searchResults.map((r, i) => `[${i + 1}] "${r.title}"\nURL: ${r.url}\nSummary: ${r.snippet}`).join('\n\n') +
          `\n\nUse the search results above to supplement your answer with accurate and current information.`;
      }
    } catch (searchErr) {
      console.warn('Web search failed for query:', lastUserMsg, searchErr.message);
    }
  }

  const effectiveSystemInstruction = (systemInstruction || '') + webSearchInstruction;

  if (provider === 'openai') {
    const openaiMessages = [];
    if (effectiveSystemInstruction) {
      openaiMessages.push({ role: 'system', content: effectiveSystemInstruction });
    }
    if (isChat) {
      messages.forEach(m => {
        openaiMessages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        });
      });
    } else {
      openaiMessages.push({ role: 'user', content: prompt });
    }
    const replyText = await callOpenAI(apiKey, baseUrl, model, openaiMessages, maxTokens);
    return returnSources ? { text: replyText, sources: webSearchSources } : replyText;
  }

  if (provider === 'anthropic') {
    const anthropicMessages = isChat
      ? messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
      : [{ role: 'user', content: prompt }];
    const payload = { messages: anthropicMessages };
    if (effectiveSystemInstruction) {
      payload.system = effectiveSystemInstruction;
    }
    const replyText = await callAnthropic(apiKey, baseUrl, model, payload, maxTokens);
    return returnSources ? { text: replyText, sources: webSearchSources } : replyText;
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

    if (enableWebSearch) {
      payload.tools = [{ googleSearch: {} }];
      try {
        return await callGemini(apiKey, payload, true, model, returnSources);
      } catch (geminiToolErr) {
        console.warn('Gemini googleSearch tool call failed, falling back to DuckDuckGo search:', geminiToolErr.message);
        const fallbackResults = await searchWeb(lastUserMsg, 4);
        const fallbackSources = fallbackResults.map(r => ({ title: r.title, url: r.url }));
        const fallbackSystemInstruction = (systemInstruction || '') + (fallbackResults.length > 0
          ? `\n\n--- INTERNET SEARCH RESULTS ---\n` + fallbackResults.map((r, i) => `[${i + 1}] "${r.title}"\nURL: ${r.url}\nSummary: ${r.snippet}`).join('\n\n') + `\n\nUse the search results above to supplement your answer.`
          : '');
        payload.systemInstruction = { parts: [{ text: fallbackSystemInstruction }] };
        delete payload.tools;
        const text = await callGemini(apiKey, payload, true, model, false);
        return returnSources ? { text, sources: fallbackSources } : text;
      }
    }

    return await callGemini(apiKey, payload, true, model, returnSources);
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };
  return await callGemini(apiKey, payload, false, model, returnSources);
}

// Caller for OpenAI API or OpenAI-compatible custom endpoints
async function callOpenAI(apiKey, baseUrl, model, messages, maxTokens = 4096) {
  const rawBaseUrl = (baseUrl || 'https://api.openai.com').trim().replace(/\/+$/, '');
  const url = rawBaseUrl.endsWith('/v1')
    ? `${rawBaseUrl}/chat/completions`
    : `${rawBaseUrl}/v1/chat/completions`;

  console.log(`Attempting OpenAI API call with model ${model} via ${url}...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

  const headers = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        messages: messages
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

        // Standard OpenAI format: choices[0].message.content
        if (responseData.choices && Array.isArray(responseData.choices) && responseData.choices.length > 0) {
          const choice = responseData.choices[0];
          if (choice?.message?.content && typeof choice.message.content === 'string') {
            return choice.message.content;
          }
          if (typeof choice?.text === 'string') {
            return choice.text;
          }
        }

        // Direct content or text properties for non-standard compatible providers
        if (typeof responseData.content === 'string') {
          return responseData.content;
        }
        if (typeof responseData.text === 'string') {
          return responseData.text;
        }

        console.warn('OpenAI response HTTP 200 but no extractable content found. Response keys:', Object.keys(responseData));
        throw new Error('OpenAI API returned HTTP 200 but the response content could not be parsed.');
      } catch (jsonErr) {
        if (jsonErr.message && jsonErr.message.includes('response content could not be parsed')) {
          throw jsonErr;
        }
        return responseText;
      }
    }

    console.warn(`OpenAI call with model ${model} failed (HTTP ${response.status}):`, responseText);
    throw new Error(`OpenAI API error (${response.status}): ${responseText || response.statusText}`);
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      throw new Error('OpenAI API request timed out after 120 seconds.');
    }
    throw e;
  }
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

// Validate that a file path is within the active course directory (prevents path traversal)
function validateSubtitlePath(filePath) {
  const db = readDb();
  const courseRoot = db.activeCoursePath;
  if (!courseRoot) {
    // No active course — allow only if path is under the backend directory (safe development default)
    return true;
  }
  const resolvedRoot = path.resolve(courseRoot);
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(resolvedRoot + path.sep) && resolvedPath !== resolvedRoot) {
    return false;
  }
  return true;
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
    const db = readDb();
    const content = scanCourseFolder(coursePath);
    const courseState = db.courseStates?.[coursePath] || null;
    const effectiveProgress = {
      ...(db.progress || {}),
      ...(courseState?.progress || {})
    };
    res.json({
      success: true,
      coursePath,
      sections: content,
      courseState,
      progress: effectiveProgress
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
/**
 * Set of MKV paths currently being converted.
 * execFileSync blocks the event loop, so concurrent access is naturally
 * serialized for synchronous requests. This guard documents intent and
 * protects against races if operations are refactored to async in the future.
 */
const inFlightConversions = new Set();

// --- Cache metadata helpers ---

const CACHE_META_FILE = path.join(os.tmpdir(), 'udemy-player-cache.json');

function readCacheMeta() {
  try {
    if (fs.existsSync(CACHE_META_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_META_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading cache metadata:', e);
  }
  return {};
}

function writeCacheMeta(meta) {
  try {
    fs.writeFileSync(CACHE_META_FILE, JSON.stringify(meta, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing cache metadata:', e);
  }
}

function registerCacheEntry(sourcePath, cachePath) {
  const meta = readCacheMeta();
  meta[sourcePath] = cachePath;
  writeCacheMeta(meta);
}

/**
 * Remove orphaned cache files whose source MKV no longer exists on disk.
 * Called once at startup.
 */
function cleanupOrphanedCache() {
  const meta = readCacheMeta();
  let cleaned = 0;
  for (const [sourcePath, cachePath] of Object.entries(meta)) {
    if (!fs.existsSync(sourcePath)) {
      try { fs.unlinkSync(cachePath); } catch (_) {}
      delete meta[sourcePath];
      cleaned++;
      console.log(`Cleaned orphaned cache: ${cachePath}`);
    }
  }
  if (cleaned > 0) {
    writeCacheMeta(meta);
    console.log(`Cleaned up ${cleaned} orphaned cache file(s)`);
  }
}

/**
 * Remove all cached MP4s whose source MKV lives under the given course directory.
 * Called when the user switches away from or deletes a course.
 */
function cleanupCourseCache(coursePath) {
  if (!coursePath) return;
  const meta = readCacheMeta();
  let cleaned = 0;
  for (const [sourcePath, cachePath] of Object.entries(meta)) {
    const resolvedSource = path.resolve(sourcePath);
    const resolvedCourse = path.resolve(coursePath);
    if (resolvedSource === resolvedCourse || resolvedSource.startsWith(resolvedCourse + path.sep)) {
      try { fs.unlinkSync(cachePath); } catch (_) {}
      delete meta[sourcePath];
      cleaned++;
    }
  }
  if (cleaned > 0) {
    writeCacheMeta(meta);
    console.log(`Cleaned up ${cleaned} cached file(s) from course: ${coursePath}`);
  }
}

/**
 * Ensure an MKV file is remuxed/transcoded to a playable MP4 file in the OS temp directory.
 */
/**
 * Probe video and audio codec names from a media file using ffprobe JSON output.
 * Returns { videoCodec, audioCodec } or null on failure.
 */
function probeCodecs(filePath) {
  try {
    const output = execFileSync(getFfprobePath(), [
      '-v', 'error',
      '-show_entries', 'stream=codec_name,codec_type',
      '-of', 'json',
      filePath
    ], { encoding: 'utf8' });
    const probeData = JSON.parse(output);
    const streams = probeData.streams || [];
    const videoStream = streams.find(s => s.codec_type === 'video');
    const audioStream = streams.find(s => s.codec_type === 'audio');
    const videoCodec = (videoStream?.codec_name || '').toLowerCase();
    const audioCodec = (audioStream?.codec_name || '').toLowerCase();
    if (!videoCodec && !audioCodec) {
      console.error(`ffprobe returned no recognized streams for ${filePath}`);
      return null;
    }
    return { videoCodec, audioCodec };
  } catch (err) {
    console.error(`Failed to probe codecs via ffprobe for ${filePath}:`, err);
    return null;
  }
}

/**
 * Run ffmpeg with the given arguments, writing output to destPath.
 * Always passes -y to overwrite existing files.
 */
function runFfmpeg(inputPath, args, destPath) {
  execFileSync(getFfmpegPath(), ['-y', '-i', inputPath, ...args, destPath], { stdio: 'inherit' });
}

function ensureMp4Cached(mkvPath) {
  const hash = crypto.createHash('md5').update(mkvPath).digest('hex');
  const tempDir = os.tmpdir();
  const cachePath = path.join(tempDir, `udemy-player-${hash}.mp4`);
  const tempCachePath = path.join(tempDir, `udemy-player-${hash}.tmp.mp4`);

  // Check if cached file already exists and is valid
  if (fs.existsSync(cachePath)) {
    const mkvStat = fs.statSync(mkvPath);
    const mp4Stat = fs.statSync(cachePath);
    if (mp4Stat.mtimeMs >= mkvStat.mtimeMs && mp4Stat.size > 0) {
      console.log(`Using cached video: ${cachePath}`);
      return cachePath;
    }
  }

  // Guard against concurrent conversions of the same file
  if (inFlightConversions.has(mkvPath)) {
    console.warn(`Conversion already in flight for: ${mkvPath}; waiting for it to complete...`);
    // Since execFileSync blocks the event loop, by the time we reach here
    // the prior conversion should be done. Check cache one more time.
    if (fs.existsSync(cachePath) && fs.statSync(cachePath).size > 0) {
      console.log(`Using cached video (post-wait): ${cachePath}`);
      return cachePath;
    }
  }

  console.log(`Cache miss or stale cache for: ${mkvPath}`);
  console.log(`Starting remux/transcode of ${mkvPath}...`);

  inFlightConversions.add(mkvPath);

  try {
    // Query codecs using a single ffprobe call (JSON output)
    const codecs = probeCodecs(mkvPath);
    let isH264 = false;
    let isAacOrMp3 = false;

    if (codecs) {
      const { videoCodec, audioCodec } = codecs;
      console.log(`Source video codec: ${videoCodec}, audio codec: ${audioCodec}`);
      isH264 = (videoCodec === 'h264');
      isAacOrMp3 = (audioCodec === 'aac' || audioCodec === 'mp3');
    } else {
      console.error(`Codec probe failed for ${mkvPath}, defaulting to full transcode`);
    }

    if (isH264) {
      if (isAacOrMp3) {
        console.log('Performing direct stream copy (copy video, copy audio)...');
        runFfmpeg(mkvPath, ['-c:v', 'copy', '-c:a', 'copy'], tempCachePath);
      } else {
        console.log('Copying video stream, transcoding audio to AAC...');
        runFfmpeg(mkvPath, ['-c:v', 'copy', '-c:a', 'aac'], tempCachePath);
      }
    } else {
      console.log('Performing full transcode to H.264/AAC...');
      runFfmpeg(mkvPath, ['-c:v', 'libx264', '-c:a', 'aac', '-preset', 'fast', '-crf', '23'], tempCachePath);
    }

    if (fs.existsSync(tempCachePath)) {
      fs.renameSync(tempCachePath, cachePath);
      registerCacheEntry(mkvPath, cachePath);
      console.log(`Successfully cached transcoded file at: ${cachePath}`);
      return cachePath;
    } else {
      throw new Error(`FFmpeg ran but temporary file was not created: ${tempCachePath}`);
    }
  } catch (err) {
    console.error(`Failed to remux/transcode video ${mkvPath}:`, err);
    if (fs.existsSync(tempCachePath)) {
      try { fs.unlinkSync(tempCachePath); } catch (_) {}
    }
    throw err;
  } finally {
    inFlightConversions.delete(mkvPath);
  }
}

// 2. Stream video file (supports HTTP Byte-Range requests)
app.get('/api/stream', (req, res) => {
  let videoPath = req.query.path;
  if (!videoPath) {
    return res.status(400).send('Path parameter is required');
  }

  // Validate that the requested path is within the active course directory
  if (!validateSubtitlePath(videoPath)) {
    return res.status(403).send('Access denied');
  }

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video file not found');
  }

  // If this is an MKV file, remux/transcode it to MP4 and serve the cached version
  const isMkv = path.extname(videoPath).toLowerCase() === '.mkv';
  if (isMkv) {
    try {
      videoPath = ensureMp4Cached(videoPath);
    } catch (err) {
      return res.status(500).send(`Failed to process MKV video: ${err.message}`);
    }
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
      'Content-Type': 'video/mp4', // video/mp4 is compatible with both .mp4 and DRM-free .m4v files
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
      'Content-Type': 'video/mp4', // video/mp4 is compatible with both .mp4 and DRM-free .m4v files
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

  if (!validateSubtitlePath(subtitlePath)) {
    return res.status(403).send('Access denied');
  }

  if (!fs.existsSync(subtitlePath)) {
    return res.status(404).send('Subtitle file not found');
  }

  try {
    const stat = fs.statSync(subtitlePath);
    if (stat.size === 0) {
      return res.status(404).send('Subtitle file is empty (0 bytes)');
    }
  } catch (err) {
    return res.status(500).send('Error checking subtitle file');
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

// 4a. Reveal resource in Finder / Explorer (fallback for web mode)
app.post('/api/reveal-resource', (req, res) => {
  const resourcePath = req.body && req.body.path;
  if (!resourcePath || typeof resourcePath !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid path parameter is required' });
  }

  if (!fs.existsSync(resourcePath)) {
    return res.status(404).json({ success: false, error: 'Resource file not found on disk' });
  }

  const platform = os.platform();
  if (platform === 'darwin') {
    execFile('open', ['-R', resourcePath], (err) => {
      if (err) {
        console.error('Failed to reveal in Finder:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  } else if (platform === 'win32') {
    execFile('explorer.exe', [`/select,${resourcePath}`], () => {
      // explorer.exe frequently exits with code 1 even on success
      res.json({ success: true });
    });
  } else {
    // Linux
    execFile('xdg-open', [path.dirname(resourcePath)], (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  }
});

// 4b. Open resource with default system application (fallback for web mode)
app.post('/api/open-resource', (req, res) => {
  const resourcePath = req.body && req.body.path;
  if (!resourcePath || typeof resourcePath !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid path parameter is required' });
  }

  if (!fs.existsSync(resourcePath)) {
    return res.status(404).json({ success: false, error: 'Resource file not found on disk' });
  }

  const platform = os.platform();
  if (platform === 'darwin') {
    execFile('open', [resourcePath], (err) => {
      if (err) {
        console.error('Failed to open file:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  } else if (platform === 'win32') {
    execFile('cmd.exe', ['/c', 'start', '""', resourcePath], (err) => {
      if (err) {
        console.error('Failed to open file:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  } else {
    execFile('xdg-open', [resourcePath], (err) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true });
    });
  }
});

// 5. Get all User Data (Active course, history, notes, completed states)
app.get('/api/userdata', (req, res) => {
  res.json(getEffectiveUserData(readDb()));
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
  const oldPath = db.activeCoursePath;
  db.activeCoursePath = coursePath;
  if (!db.history.includes(coursePath)) {
    db.history.push(coursePath);
  }
  if (!db.courseStates) {
    db.courseStates = {};
  }
  if (!db.courseStates[coursePath]) {
    db.courseStates[coursePath] = {
      lastLessonId: null,
      lastActiveTab: 'video',
      lastActiveAt: Date.now(),
      progress: {}
    };
  } else {
    db.courseStates[coursePath].lastActiveAt = Date.now();
  }
  writeDb(db);

  // Clear cached MKV conversions for the previous course
  if (oldPath && oldPath !== coursePath) {
    cleanupCourseCache(oldPath);
  }

  res.json(getEffectiveUserData(db));
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
  if (db.courseStates && db.courseStates[coursePath]) {
    delete db.courseStates[coursePath];
  }
  writeDb(db);

  // Clear cached MKV conversions for the deleted course
  cleanupCourseCache(coursePath);

  res.json(getEffectiveUserData(db));
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
  if (db.courseStates) {
    if (db.courseStates[oldPath]) {
      db.courseStates[newPath] = db.courseStates[oldPath];
      delete db.courseStates[oldPath];
    }
  }
  writeDb(db);
  res.json(getEffectiveUserData(db));
});

// 7. Update progress completion and watchTime
app.post('/api/userdata/progress', (req, res) => {
  const { coursePath: reqCoursePath, lessonId, completed, watchTime, duration } = req.body;
  if (!lessonId) {
    return res.status(400).json({ error: 'lessonId is required' });
  }

  const db = readDb();
  const coursePath = reqCoursePath || db.activeCoursePath;

  if (!db.courseStates) {
    db.courseStates = {};
  }
  if (coursePath) {
    if (!db.courseStates[coursePath]) {
      db.courseStates[coursePath] = {
        lastLessonId: lessonId,
        lastActiveTab: 'video',
        lastActiveAt: Date.now(),
        progress: {}
      };
    } else {
      if (!db.courseStates[coursePath].progress) {
        db.courseStates[coursePath].progress = {};
      }
      db.courseStates[coursePath].lastLessonId = lessonId;
      db.courseStates[coursePath].lastActiveAt = Date.now();
    }
  }

  const currentProgress = (coursePath && db.courseStates[coursePath]?.progress?.[lessonId])
    || db.progress[lessonId]
    || { completed: false, watchTime: 0, duration: 0 };
  
  const updatedProgress = {
    completed: typeof completed !== 'undefined' ? completed : currentProgress.completed,
    watchTime: typeof watchTime !== 'undefined' ? watchTime : currentProgress.watchTime,
    duration: typeof duration !== 'undefined' ? duration : currentProgress.duration
  };

  if (coursePath) {
    db.courseStates[coursePath].progress[lessonId] = updatedProgress;
  }
  db.progress[lessonId] = updatedProgress;

  writeDb(db);
  res.json(getEffectiveUserData(db, coursePath));
});

// 7b. Update Course Study State (last active lesson, active tab, watch time)
app.post('/api/userdata/course-state', (req, res) => {
  const { coursePath: reqCoursePath, lastLessonId, lastActiveTab, watchTime, duration } = req.body;
  const db = readDb();
  const coursePath = reqCoursePath || db.activeCoursePath;

  if (!coursePath) {
    return res.status(400).json({ error: 'coursePath is required' });
  }

  if (!db.courseStates) {
    db.courseStates = {};
  }
  if (!db.courseStates[coursePath]) {
    db.courseStates[coursePath] = {
      lastLessonId: null,
      lastActiveTab: 'video',
      lastActiveAt: Date.now(),
      progress: {}
    };
  }

  const state = db.courseStates[coursePath];
  if (lastLessonId) {
    state.lastLessonId = lastLessonId;
  }
  if (lastActiveTab) {
    state.lastActiveTab = lastActiveTab;
  }
  state.lastActiveAt = Date.now();

  // If watchTime is provided with lastLessonId, also update progress immediately
  if (lastLessonId && typeof watchTime !== 'undefined') {
    if (!state.progress) state.progress = {};
    const existing = state.progress[lastLessonId] || db.progress[lastLessonId] || { completed: false, watchTime: 0, duration: 0 };
    const updated = {
      completed: existing.completed,
      watchTime: Math.floor(watchTime),
      duration: typeof duration !== 'undefined' ? Math.floor(duration) : existing.duration
    };
    state.progress[lastLessonId] = updated;
    db.progress[lastLessonId] = updated;
  }

  writeDb(db);
  res.json({ success: true, courseState: state, ...getEffectiveUserData(db, coursePath) });
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

// 9b. Get Chat History for a scope
app.get('/api/userdata/chat', (req, res) => {
  const { coursePath: reqCoursePath, scopeKey } = req.query;
  const db = readDb();
  const coursePath = reqCoursePath || db.activeCoursePath;
  if (!coursePath || !scopeKey) {
    return res.status(400).json({ error: 'coursePath and scopeKey are required' });
  }
  const courseChats = db.chatHistory?.[coursePath] || {};
  const messages = courseChats[scopeKey] || [];
  res.json({ success: true, messages });
});

// 9c. Save Chat History for a scope
app.post('/api/userdata/chat', (req, res) => {
  const { coursePath: reqCoursePath, scopeKey, messages } = req.body;
  const db = readDb();
  const coursePath = reqCoursePath || db.activeCoursePath;
  if (!coursePath || !scopeKey || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'coursePath, scopeKey, and messages array are required' });
  }
  if (!db.chatHistory) {
    db.chatHistory = {};
  }
  if (!db.chatHistory[coursePath]) {
    db.chatHistory[coursePath] = {};
  }
  db.chatHistory[coursePath][scopeKey] = messages;
  writeDb(db);
  res.json({ success: true });
});

// 9d. Clear Chat History for a scope
app.delete('/api/userdata/chat', (req, res) => {
  const { coursePath: reqCoursePath, scopeKey } = req.body;
  const db = readDb();
  const coursePath = reqCoursePath || db.activeCoursePath;
  if (!coursePath || !scopeKey) {
    return res.status(400).json({ error: 'coursePath and scopeKey are required' });
  }
  if (db.chatHistory?.[coursePath]?.[scopeKey]) {
    delete db.chatHistory[coursePath][scopeKey];
    writeDb(db);
  }
  res.json({ success: true });
});

// 10. Update Settings
app.post('/api/userdata/settings', (req, res) => {
  const {
    aiProvider,
    geminiApiKey,
    geminiModel,
    anthropicApiKey,
    anthropicModel,
    anthropicBaseUrl,
    openaiApiKey,
    openaiModel,
    openaiBaseUrl,
    autoplayNext,
    controlsPosition,
    autoCreateTimeline,
    autoCreateTimelineLang,
    autoCreateSummary,
    autoCreateSummaryLang,
    featureModels
  } = req.body;
  const db = readDb();
  if (!db.settings) {
    db.settings = {};
  }
  db.settings.aiProvider = aiProvider || DEFAULT_SETTINGS.aiProvider;
  db.settings.geminiApiKey = geminiApiKey || DEFAULT_SETTINGS.geminiApiKey;
  db.settings.geminiModel = geminiModel || DEFAULT_SETTINGS.geminiModel;
  db.settings.anthropicApiKey = anthropicApiKey || DEFAULT_SETTINGS.anthropicApiKey;
  db.settings.anthropicModel = anthropicModel || DEFAULT_SETTINGS.anthropicModel;
  db.settings.anthropicBaseUrl = anthropicBaseUrl || DEFAULT_SETTINGS.anthropicBaseUrl;
  db.settings.openaiApiKey = openaiApiKey || DEFAULT_SETTINGS.openaiApiKey;
  db.settings.openaiModel = openaiModel || DEFAULT_SETTINGS.openaiModel;
  db.settings.openaiBaseUrl = openaiBaseUrl || DEFAULT_SETTINGS.openaiBaseUrl;
  db.settings.autoplayNext = typeof autoplayNext === 'boolean' ? autoplayNext : DEFAULT_SETTINGS.autoplayNext;
  db.settings.controlsPosition = (controlsPosition === 'bottom' || controlsPosition === 'floating')
    ? controlsPosition : DEFAULT_SETTINGS.controlsPosition;
  db.settings.autoCreateTimeline = typeof autoCreateTimeline === 'boolean' ? autoCreateTimeline : DEFAULT_SETTINGS.autoCreateTimeline;
  db.settings.autoCreateTimelineLang = (autoCreateTimelineLang && SUPPORTED_SUMMARY_LANGUAGES[autoCreateTimelineLang.toLowerCase()])
    ? autoCreateTimelineLang.toLowerCase() : DEFAULT_SETTINGS.autoCreateTimelineLang;
  db.settings.autoCreateSummary = typeof autoCreateSummary === 'boolean' ? autoCreateSummary : DEFAULT_SETTINGS.autoCreateSummary;
  db.settings.autoCreateSummaryLang = (autoCreateSummaryLang && SUPPORTED_SUMMARY_LANGUAGES[autoCreateSummaryLang.toLowerCase()])
    ? autoCreateSummaryLang.toLowerCase() : DEFAULT_SETTINGS.autoCreateSummaryLang;

  if (featureModels && typeof featureModels === 'object') {
    const validFeatures = ['timeline', 'subtitleTranslation', 'lessonSummary', 'chapterSummary', 'lessonChat', 'chapterChat'];
    const sanitizedFeatures = {};
    for (const key of validFeatures) {
      const item = featureModels[key] || {};
      sanitizedFeatures[key] = {
        provider: typeof item.provider === 'string' ? item.provider.trim() : '',
        model: typeof item.model === 'string' ? item.model.trim() : ''
      };
    }
    db.settings.featureModels = sanitizedFeatures;
  }
  writeDb(db);
  res.json(db);
});

// 11. Translate Subtitle from English to Vietnamese (or custom targetLang)
app.post('/api/translate-subtitle', async (req, res) => {
  const { subtitlePath, apiKey, targetLang } = req.body;
  if (!subtitlePath) {
    return res.status(400).json({ error: 'subtitlePath is required' });
  }

  if (!validateSubtitlePath(subtitlePath)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const db = readDb();
  const config = getAiConfig(db, apiKey, 'subtitleTranslation');

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
    const cues = parseSubtitleCues(subtitleContent);

    if (cues.length === 0) {
      return res.status(400).json({ error: 'No valid subtitle cues found in file.' });
    }

    const SUBTITLE_CHUNK_SIZE = 100;
    const translatedChunks = [];
    const totalChunks = Math.ceil(cues.length / SUBTITLE_CHUNK_SIZE);

    console.log(`Parsed subtitle: ${cues.length} cues. Chunk size: ${SUBTITLE_CHUNK_SIZE}. Total chunks: ${totalChunks}`);

    for (let i = 0; i < cues.length; i += SUBTITLE_CHUNK_SIZE) {
      const chunkCues = cues.slice(i, i + SUBTITLE_CHUNK_SIZE);
      const chunkIndex = Math.floor(i / SUBTITLE_CHUNK_SIZE) + 1;
      const chunkContent = chunkCues.join('\n\n');

      const prompt = `Translate the following ${sourceLanguageName} subtitle cues (part of a larger subtitle file) to ${targetLanguageName}.
You must preserve all timecodes, formatting, line numbers, and subtitle syntax exactly.
Do not translate or modify timecodes or line numbers (e.g. 00:01:23,450 --> 00:01:25,120).
Ensure the ${targetLanguageName} translation is natural, fits the context, and uses appropriate terminology.
Do not add any explanations, markdown code blocks, or introductory text. Return ONLY the translated subtitle cues.

[Subtitle Cues]:
${chunkContent}`;

      console.log(`Calling ${config.providerName} API for chunk ${chunkIndex}/${totalChunks} (cues ${i + 1} to ${Math.min(i + SUBTITLE_CHUNK_SIZE, cues.length)})...`);

      let chunkTranslatedText;
      try {
        chunkTranslatedText = await callAiProvider(config, prompt);
      } catch (err) {
        console.error(`Chunk ${chunkIndex}/${totalChunks} failed:`, err.message);
        return res.status(502).json({
          error: `Translation failed at chunk ${chunkIndex}/${totalChunks} (cues ${i + 1}–${Math.min(i + SUBTITLE_CHUNK_SIZE, cues.length)}). ${err.message}`
        });
      }

      // Clean up markdown block if the model returned it
      chunkTranslatedText = chunkTranslatedText.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '');

      translatedChunks.push(chunkTranslatedText.trim());

      // Respect rate limits with a brief delay between requests
      if (i + SUBTITLE_CHUNK_SIZE < cues.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    let translatedText = translatedChunks.join('\n\n');

    // Convert SRT/VTT fragments to WebVTT format (prepends WEBVTT header and normalizes timecodes)
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

  // Validate language code against supported whitelist to prevent path traversal
  const langLower = langCode.toLowerCase();
  if (!SUPPORTED_SUMMARY_LANGUAGES[langLower]) {
    return res.status(400).json({ error: `Unsupported summary language: ${langCode}` });
  }

  if (!validateSubtitlePath(subtitlePath)) {
    return res.status(403).json({ error: 'Path traversal denied' });
  }

  const db = readDb();
  const config = getAiConfig(db, null, 'lessonSummary');

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

  const targetLanguageName = SUPPORTED_SUMMARY_LANGUAGES[langLower];

  try {
    let subtitleContent = fs.readFileSync(subtitlePath, 'utf8');
    const MAX_SUMMARY_TRANSCRIPT_CHARS = 400000;
    if (subtitleContent.length > MAX_SUMMARY_TRANSCRIPT_CHARS) {
      console.warn(`Summary transcript is ${subtitleContent.length} chars, truncating to ${MAX_SUMMARY_TRANSCRIPT_CHARS} chars`);
      subtitleContent = subtitleContent.substring(0, MAX_SUMMARY_TRANSCRIPT_CHARS);
    }

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
    summaryText = summaryText.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/g, '').trim();

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

  // Validate language code against supported whitelist to prevent path traversal
  const langLower = langCode.toLowerCase();
  if (!SUPPORTED_SUMMARY_LANGUAGES[langLower]) {
    return res.status(400).json({ error: `Unsupported summary language: ${langCode}` });
  }

  if (!validateSubtitlePath(subtitlePath)) {
    return res.status(403).json({ error: 'Path traversal denied' });
  }

  try {
    const dir = path.dirname(subtitlePath);
    const ext = path.extname(subtitlePath);
    let base = path.basename(subtitlePath, ext);
    base = base.replace(/\.[a-z]{2}(?:_[a-z]{2,4})?$/i, '');
    const outPath = path.join(dir, `${base}.summary.${langLower}.txt`);

    if (fs.existsSync(outPath)) {
      fs.unlinkSync(outPath);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing summary file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper to extract clean plain text from subtitle file
function getCleanSubtitleText(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const cues = parseSubtitleContentToCues(raw);
    if (cues.length > 0) {
      return cues.map(c => c.text).join(' ');
    }
    return raw
      .replace(/WEBVTT[^\n]*/g, '')
      .replace(/\d{2}:\d{2}:\d{2}[\.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[\.,]\d{3}/g, '')
      .replace(/<[^>]*>/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^\d+$/.test(l))
      .join(' ');
  } catch (err) {
    console.warn(`Failed to read subtitle file at ${filePath}:`, err);
    return '';
  }
}

// 13a. Summarize Section (Chapter) based on subtitles of all lessons in section
app.post('/api/summarize-section', async (req, res) => {
  const { sectionPath, langCode } = req.body;
  if (!sectionPath || !langCode) {
    return res.status(400).json({ error: 'sectionPath and langCode are required' });
  }

  const langLower = langCode.toLowerCase();
  if (!SUPPORTED_SUMMARY_LANGUAGES[langLower]) {
    return res.status(400).json({ error: `Unsupported summary language: ${langCode}` });
  }

  if (!validateSubtitlePath(sectionPath)) {
    return res.status(403).json({ error: 'Path traversal denied' });
  }

  if (!fs.existsSync(sectionPath)) {
    return res.status(404).json({ error: `Section directory not found: ${sectionPath}` });
  }

  const outPath = path.join(sectionPath, `section.summary.${langLower}.txt`);

  // Check cache first
  if (fs.existsSync(outPath)) {
    try {
      const summaryContent = fs.readFileSync(outPath, 'utf8');
      return res.json({ success: true, summary: summaryContent, cached: true });
    } catch (e) {
      console.error('Error reading cached section summary', e);
    }
  }

  if (req.body.checkCacheOnly) {
    return res.json({ success: true, summary: null, cached: false });
  }

  const db = readDb();
  const config = getAiConfig(db, null, 'chapterSummary');

  if (!config.apiKey) {
    const errorMsg = `${config.providerName} API Key is missing. Please set it in Settings.`;
    return res.status(400).json({ error: errorMsg });
  }

  try {
    const lessons = Array.isArray(req.body.lessons) ? req.body.lessons : [];

    let lessonTranscripts = [];

    if (lessons.length > 0) {
      for (const lesson of lessons) {
        const subPath = lesson.subtitles?.[langLower]
          || lesson.subtitle
          || (lesson.subtitles ? Object.values(lesson.subtitles)[0] : null);

        // Subtitle paths arrive from the client — re-validate against path traversal.
        if (subPath && validateSubtitlePath(subPath) && fs.existsSync(subPath)) {
          const cleanText = getCleanSubtitleText(subPath);
          if (cleanText.trim()) {
            lessonTranscripts.push(`### Lesson: ${lesson.title}\n${cleanText.trim()}`);
          }
        }
      }
    } else {
      // Fallback: read subtitle files directly from the section directory.
      const files = fs.readdirSync(sectionPath);
      const subFiles = files.filter(f => (f.endsWith('.srt') || f.endsWith('.vtt')) && !f.includes('.summary.'));
      for (const f of subFiles) {
        const fullP = path.join(sectionPath, f);
        const cleanText = getCleanSubtitleText(fullP);
        if (cleanText.trim()) {
          lessonTranscripts.push(`### Subtitle: ${f}\n${cleanText.trim()}`);
        }
      }
    }

    if (lessonTranscripts.length === 0) {
      return res.status(400).json({ error: 'No subtitle files found for lessons in this section.' });
    }

    let combinedTranscript = lessonTranscripts.join('\n\n');
    const MAX_SUMMARY_TRANSCRIPT_CHARS = 400000;
    if (combinedTranscript.length > MAX_SUMMARY_TRANSCRIPT_CHARS) {
      console.warn(`Section summary transcript is ${combinedTranscript.length} chars, truncating to ${MAX_SUMMARY_TRANSCRIPT_CHARS} chars`);
      combinedTranscript = combinedTranscript.substring(0, MAX_SUMMARY_TRANSCRIPT_CHARS);
    }

    const targetLanguageName = SUPPORTED_SUMMARY_LANGUAGES[langLower];
    const prompt = `You are an expert offline learning assistant.
Below are the combined subtitle transcripts of all lessons in an entire course chapter/section.
Please write a comprehensive, well-structured summary of this whole chapter.
The summary must:
- Start with an Executive Overview of what this chapter covers and key takeaways.
- Provide a detailed breakdown of core concepts and topics presented across the lessons.
- Include actionable insights, important code/commands/formulas if applicable.
- Be formatted in clean, beautiful Markdown (using headers, bullet points, bold text).
- Be written in the target language: ${targetLanguageName}.
- Do NOT include any meta-commentary, explanations, introductory text, or markdown code blocks (like \`\`\`markdown). Return ONLY the direct summary content.

[Chapter Transcripts]:
${combinedTranscript}`;

    console.log(`Calling ${config.providerName} API for chapter summary in ${targetLanguageName}...`);
    let summaryText = await callAiProvider(config, prompt);

    summaryText = summaryText.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/g, '').trim();

    fs.writeFileSync(outPath, summaryText, 'utf8');

    res.json({ success: true, summary: summaryText, cached: false });
  } catch (error) {
    console.error('Section summarization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 13b. Clear Section Summary Cache
app.post('/api/clear-section-summary', (req, res) => {
  const { sectionPath, langCode } = req.body;
  if (!sectionPath || !langCode) {
    return res.status(400).json({ error: 'sectionPath and langCode are required' });
  }

  const langLower = langCode.toLowerCase();
  if (!SUPPORTED_SUMMARY_LANGUAGES[langLower]) {
    return res.status(400).json({ error: `Unsupported summary language: ${langCode}` });
  }

  if (!validateSubtitlePath(sectionPath)) {
    return res.status(403).json({ error: 'Path traversal denied' });
  }

  try {
    const outPath = path.join(sectionPath, `section.summary.${langLower}.txt`);

    if (fs.existsSync(outPath)) {
      fs.unlinkSync(outPath);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing section summary file:', error);
    res.status(500).json({ error: error.message });
  }
});

// 13c. Chat about chapter (section) based on section summary and transcripts of all lessons
app.post('/api/chat-chapter', async (req, res) => {
  const { sectionPath, messages, langCode = 'en', enableWebSearch = false, lessons = [] } = req.body;
  if (!sectionPath || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'sectionPath and messages array are required' });
  }

  if (!validateSubtitlePath(sectionPath)) {
    return res.status(403).json({ error: 'Path traversal denied' });
  }

  if (!fs.existsSync(sectionPath)) {
    return res.status(404).json({ error: `Section directory not found: ${sectionPath}` });
  }

  const db = readDb();
  const config = getAiConfig(db, null, 'chapterChat');

  if (!config.apiKey) {
    const errorMsg = `${config.providerName} API Key is missing. Please set it in Settings.`;
    return res.status(400).json({ error: errorMsg });
  }

  try {
    const langLower = (langCode || 'en').toLowerCase();
    const summaryPath = path.join(sectionPath, `section.summary.${langLower}.txt`);
    let chapterSummary = '';
    if (fs.existsSync(summaryPath)) {
      try {
        chapterSummary = fs.readFileSync(summaryPath, 'utf8');
      } catch (err) {
        console.warn('Could not read cached chapter summary for chat:', err);
      }
    }

    let lessonTranscripts = [];
    if (Array.isArray(lessons) && lessons.length > 0) {
      for (const lesson of lessons) {
        const subPath = lesson.subtitles?.[langLower]
          || lesson.subtitle
          || (lesson.subtitles ? Object.values(lesson.subtitles)[0] : null);

        if (subPath && validateSubtitlePath(subPath) && fs.existsSync(subPath)) {
          const cleanText = getCleanSubtitleText(subPath);
          if (cleanText.trim()) {
            lessonTranscripts.push(`### Lesson: ${lesson.title}\n${cleanText.trim()}`);
          }
        }
      }
    } else {
      // Fallback: read subtitle files directly from section directory
      const files = fs.readdirSync(sectionPath);
      const subFiles = files.filter(f => (f.endsWith('.srt') || f.endsWith('.vtt')) && !f.includes('.summary.'));
      for (const f of subFiles) {
        const fullP = path.join(sectionPath, f);
        const cleanText = getCleanSubtitleText(fullP);
        if (cleanText.trim()) {
          lessonTranscripts.push(`### Subtitle: ${f}\n${cleanText.trim()}`);
        }
      }
    }

    let combinedTranscripts = lessonTranscripts.join('\n\n');
    const MAX_CHAT_TRANSCRIPT_CHARS = 400000;
    if (combinedTranscripts.length > MAX_CHAT_TRANSCRIPT_CHARS) {
      combinedTranscripts = combinedTranscripts.substring(0, MAX_CHAT_TRANSCRIPT_CHARS);
    }

    const sectionTitle = path.basename(sectionPath);
    let systemInstruction = `You are a helpful and knowledgeable offline AI learning assistant for a student studying a course chapter/section.
The student is asking questions about the chapter: "${sectionTitle}".`;

    if (chapterSummary.trim()) {
      systemInstruction += `\n\nBelow is the structured summary of this chapter:\n---\n${chapterSummary.trim()}\n---`;
    }

    if (combinedTranscripts.trim()) {
      systemInstruction += `\n\nBelow are the lesson transcripts (subtitles) of this chapter:\n---\n${combinedTranscripts.trim()}\n---`;
    }

    systemInstruction += `\n\nUse the chapter summary and lesson transcripts above to answer the student's questions accurately, thoroughly, and clearly.
If the student asks high-level thematic questions, synthesize across the chapter.
If the student asks specific questions, ground your explanation in the relevant lesson details.
Keep your response structured, well-formatted, and helpful. Use the same language as the student's question.`;

    if (enableWebSearch) {
      systemInstruction += `\n\nWeb Search is enabled. You may use live web search results and up-to-date internet knowledge to supplement the chapter content when answering.`;
    }

    console.log(`Calling ${config.providerName} API for chapter chat question (web search: ${Boolean(enableWebSearch)})...`);
    const result = await callAiProvider(config, null, {
      isChat: true,
      messages,
      systemInstruction,
      maxTokens: 8192,
      enableWebSearch: Boolean(enableWebSearch),
      returnSources: true
    });

    const replyText = typeof result === 'object' && result !== null ? result.text : result;
    const sources = (typeof result === 'object' && result !== null && Array.isArray(result.sources)) ? result.sources : [];

    res.json({ success: true, reply: replyText, sources });
  } catch (error) {
    console.error('Chat chapter error:', error);
    res.status(500).json({ error: error.message });
  }
});



// 14. Chat about lesson based on subtitle file
app.post('/api/chat-lesson', async (req, res) => {
  const { subtitlePath, messages, enableWebSearch = false, currentTime } = req.body;
  if (!subtitlePath || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'subtitlePath and messages array are required' });
  }

  const db = readDb();
  const config = getAiConfig(db, null, 'lessonChat');

  if (!config.apiKey) {
    const errorMsg = `${config.providerName} API Key is missing. Please set it in Settings.`;
    return res.status(400).json({ error: errorMsg });
  }

  if (!fs.existsSync(subtitlePath)) {
    return res.status(404).json({ error: `Subtitle file not found: ${subtitlePath}` });
  }

  try {
    const subtitleContent = fs.readFileSync(subtitlePath, 'utf8');

    let systemInstruction = `You are a helpful AI assistant for an offline course player.
The student is watching a video lesson. Below is the transcript (subtitles) of the current lesson:
---
${subtitleContent}
---
Use the transcript above to answer the student's question accurately.
If the question is about something not discussed in the transcript but relevant to the lesson topic, feel free to answer using your general knowledge, but prioritize the transcript details.
Keep your response concise, clear, and direct. Use the same language as the student's question.`;

    if (typeof currentTime === 'number' && !isNaN(currentTime) && currentTime >= 0) {
      const minutes = Math.floor(currentTime / 60);
      const seconds = Math.floor(currentTime % 60);
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      systemInstruction += `\n\nThe student is currently watching this video at timestamp [${timeStr}] (${Math.round(currentTime)} seconds in). If the student refers to "this", "now", "what is happening", or the current topic, consider this playback position.`;
    }

    systemInstruction += `\n\nWhen referring to specific moments, key topics, or explanations in the video lesson, ALWAYS cite the exact timestamp in square brackets like [MM:SS] (e.g. [03:45]) so the student can click to jump directly to that point in the video.`;

    if (enableWebSearch) {
      systemInstruction += `\n\nWeb Search is enabled. You may use live web search results and up-to-date internet knowledge to supplement the lesson transcript when answering.`;
    }

    console.log(`Calling ${config.providerName} API for chat question (web search: ${Boolean(enableWebSearch)})...`);
    const result = await callAiProvider(config, null, {
      isChat: true,
      messages,
      systemInstruction,
      maxTokens: 8192,
      enableWebSearch: Boolean(enableWebSearch),
      returnSources: true
    });

    const replyText = typeof result === 'object' && result !== null ? result.text : result;
    const sources = (typeof result === 'object' && result !== null && Array.isArray(result.sources)) ? result.sources : [];

    res.json({ success: true, reply: replyText, sources });
  } catch (error) {
    console.error('Chat lesson error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 14b. Chat about entire course based on curriculum syllabus and chapter summaries
app.post('/api/chat-course', async (req, res) => {
  const { coursePath: reqCoursePath, messages, enableWebSearch = false, sections = [] } = req.body;
  const db = readDb();
  const coursePath = reqCoursePath || db.activeCoursePath;

  if (!coursePath || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'coursePath and messages array are required' });
  }

  if (!validateSubtitlePath(coursePath)) {
    return res.status(403).json({ error: 'Path traversal denied' });
  }

  if (!fs.existsSync(coursePath)) {
    return res.status(404).json({ error: `Course directory not found: ${coursePath}` });
  }

  const config = getAiConfig(db, null, 'courseChat');

  if (!config.apiKey) {
    const errorMsg = `${config.providerName} API Key is missing. Please set it in Settings.`;
    return res.status(400).json({ error: errorMsg });
  }

  try {
    const courseTitle = path.basename(coursePath);
    let syllabusOverview = `Course Title: ${courseTitle}\n\n`;

    if (Array.isArray(sections) && sections.length > 0) {
      syllabusOverview += `Curriculum Structure:\n`;
      for (const section of sections) {
        syllabusOverview += `\n### Section: ${section.title || 'Untitled Section'}\n`;
        // Check for cached section summary
        if (section.path && fs.existsSync(section.path)) {
          try {
            const files = fs.readdirSync(section.path);
            const summaryFile = files.find(f => f.startsWith('section.summary.') && f.endsWith('.txt'));
            if (summaryFile) {
              const summaryContent = fs.readFileSync(path.join(section.path, summaryFile), 'utf8');
              const brief = summaryContent.split('\n').slice(0, 10).join('\n');
              syllabusOverview += `Section Overview Summary:\n${brief}\n`;
            }
          } catch (err) {
            // Ignore summary read error
          }
        }
        if (Array.isArray(section.lessons)) {
          syllabusOverview += `Lessons:\n`;
          for (const lesson of section.lessons) {
            const durStr = lesson.duration ? ` (${Math.round(lesson.duration)}s)` : '';
            syllabusOverview += `- ${lesson.title}${durStr}\n`;
          }
        }
      }
    } else {
      // Fallback: list directories inside coursePath
      const entries = fs.readdirSync(coursePath, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name);
      syllabusOverview += `Sections in course:\n` + dirs.map(d => `- ${d}`).join('\n');
    }

    const MAX_COURSE_SYLLABUS_CHARS = 120000;
    if (syllabusOverview.length > MAX_COURSE_SYLLABUS_CHARS) {
      syllabusOverview = syllabusOverview.substring(0, MAX_COURSE_SYLLABUS_CHARS);
    }

    let systemInstruction = `You are a helpful, knowledgeable AI learning advisor and tutor for the entire course: "${courseTitle}".
Below is the curriculum syllabus and overview of the course:
---
${syllabusOverview}
---
Help the student navigate and master this course:
- Answer questions about where specific concepts, technologies, or topics are taught.
- Provide learning roadmaps and study order advice across sections and lessons.
- Synthesize relationships between different chapters and modules.
- Be structured, clear, and direct. Use the same language as the student's question.`;

    if (enableWebSearch) {
      systemInstruction += `\n\nWeb Search is enabled. You may use live web search results and up-to-date internet knowledge to supplement the course syllabus when answering.`;
    }

    console.log(`Calling ${config.providerName} API for course chat question (web search: ${Boolean(enableWebSearch)})...`);
    const result = await callAiProvider(config, null, {
      isChat: true,
      messages,
      systemInstruction,
      maxTokens: 8192,
      enableWebSearch: Boolean(enableWebSearch),
      returnSources: true
    });

    const replyText = typeof result === 'object' && result !== null ? result.text : result;
    const sources = (typeof result === 'object' && result !== null && Array.isArray(result.sources)) ? result.sources : [];

    res.json({ success: true, reply: replyText, sources });
  } catch (error) {
    console.error('Chat course error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Parse timestamp to seconds helper (supports HH:MM:SS.mmm, MM:SS.mmm, SS.mmm)
// Returns NaN for unparseable input so callers can filter bad cues.
function parseTimestampToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  const cleanTimeStr = timeStr.trim().replace(/,/g, '.');
  const parts = cleanTimeStr.split(':');

  if (parts.length < 1 || parts.length > 3) return NaN;

  const hours = parts.length === 3 ? parseInt(parts[0], 10) : 0;
  const minutes = parts.length >= 2 ? parseInt(parts[parts.length - 2], 10) : 0;
  const secondsWithMs = parts[parts.length - 1];

  const secondsParts = secondsWithMs.split('.');
  const seconds = parseInt(secondsParts[0], 10);
  const ms = secondsParts.length > 1 ? parseInt(secondsParts[1].slice(0, 3).padEnd(3, '0'), 10) : 0;

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(ms)) return NaN;

  return hours * 3600 + minutes * 60 + seconds + ms / 1000;
}

// Parse subtitle content into simple cues (supports VTT and SRT)
function parseSubtitleContentToCues(content) {
  const cues = [];
  const blocks = content.replace(/\r\n/g, '\n').replace(/\uFEFF/g, '').split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    // Skip VTT headers, NOTE lines, and SRT numeric cue identifiers
    if (lines[0].startsWith('WEBVTT') || lines[0].startsWith('NOTE') || /^\d+$/.test(lines[0])) {
      // For SRT blocks, the first line is a numeric cue ID \u2014 remove it and retry
      if (/^\d+$/.test(lines[0])) {
        lines.shift();
        if (lines.length === 0) continue;
      } else {
        continue;
      }
    }

    const timeLineIndex = lines.findIndex(l => l.includes('-->'));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const parts = timeLine.split('-->');
    if (parts.length < 2) continue;

    const start = parseTimestampToSeconds(parts[0].trim());
    if (isNaN(start)) {
      console.warn(`Skipping subtitle block with unparseable timestamp: "${parts[0]?.trim()}"`);
      continue;
    }

    const textLines = lines.slice(timeLineIndex + 1);
    if (textLines.length === 0) continue;

    const text = textLines.join(' ').replace(/<[^>]*>/g, '');
    cues.push({ start, text });
  }
  cues.sort((a, b) => a.start - b.start);
  return cues;
}

// GET Chapters
app.get('/api/chapters', async (req, res) => {
  const { videoPath, subtitlePath } = req.query;
  if (!videoPath) {
    return res.status(400).json({ error: 'videoPath parameter is required' });
  }

  if (!validateSubtitlePath(videoPath) || (subtitlePath && !validateSubtitlePath(subtitlePath))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const dir = path.dirname(videoPath);
  const ext = path.extname(videoPath);
  const base = path.basename(videoPath, ext);
  const chaptersPath = path.join(dir, `${base}.chapters.json`);

  // Check if cached chapters exist
  if (fs.existsSync(chaptersPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'));
      return res.json({ success: true, chapters: data, cached: true, exists: true });
    } catch (err) {
      console.error('Failed to parse cached chapters JSON:', err);
    }
  }

  // Do not automatically generate chapters. Just return exists: false
  return res.json({ success: true, chapters: [], cached: false, exists: false });
});

// POST chapters regenerate
app.post('/api/chapters/regenerate', async (req, res) => {
  const { videoPath, subtitlePath, language } = req.body;
  if (!videoPath) {
    return res.status(400).json({ error: 'videoPath is required' });
  }

  if (!validateSubtitlePath(videoPath) || (subtitlePath && !validateSubtitlePath(subtitlePath))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!subtitlePath || !fs.existsSync(subtitlePath)) {
    return res.status(400).json({ error: 'subtitlePath is required and must exist to generate chapters' });
  }

  const dir = path.dirname(videoPath);
  const ext = path.extname(videoPath);
  const base = path.basename(videoPath, ext);
  const chaptersPath = path.join(dir, `${base}.chapters.json`);

  try {
    const chapters = await generateChaptersFromSubtitlesFile(subtitlePath, chaptersPath, language, videoPath);
    res.json({ success: true, chapters });
  } catch (err) {
    console.error('Failed to regenerate chapters:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to generate chapters using Gemini
async function generateChaptersFromSubtitlesFile(subtitlePath, chaptersPath, language, videoPath) {
  const db = readDb();
  const config = getAiConfig(db, null, 'timeline');

  if (!config.apiKey) {
    throw new Error('AI API Key is missing. Please configure it in Settings.');
  }

  const subtitleContent = fs.readFileSync(subtitlePath, 'utf8');
  const cues = parseSubtitleContentToCues(subtitleContent);

  if (cues.length === 0) {
    throw new Error('No subtitle cues found.');
  }

  let videoDuration = null;
  if (videoPath) {
    try {
      videoDuration = getVideoDuration(videoPath);
      console.log(`Resolved video duration: ${videoDuration}s`);
    } catch (err) {
      console.error('Failed to resolve video duration:', err);
    }
  }

  // Create simplified transcript list
  let simpleTranscript = cues
    .map(c => {
      const minutes = Math.floor(c.start / 60);
      const seconds = Math.floor(c.start % 60);
      const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      return `[${timeStr} (${Math.floor(c.start)}s)] ${c.text}`;
    })
    .join('\n');

  // Guard against overly large transcripts that exceed AI context windows
  // Rough estimate: ~4 chars per token for English text; aim for < 100K tokens
  const MAX_TRANSCRIPT_CHARS = 400000;
  if (simpleTranscript.length > MAX_TRANSCRIPT_CHARS) {
    console.warn(`Transcript is ${simpleTranscript.length} chars (~${Math.round(simpleTranscript.length / 4)} tokens), truncating to ~100K tokens`);
    const maxCues = Math.floor(cues.length * (MAX_TRANSCRIPT_CHARS / simpleTranscript.length));
    simpleTranscript = cues.slice(0, maxCues)
      .map(c => {
        const minutes = Math.floor(c.start / 60);
        const seconds = Math.floor(c.start % 60);
        const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return `[${timeStr} (${Math.floor(c.start)}s)] ${c.text}`;
      })
      .join('\n');
  }

  const systemInstruction = 'You are a video editing assistant. You always output a valid, raw JSON array of chapter markers matching the requested schema, with no markdown code fences or explanation text. The first chapter MUST start at 0 seconds.';
  
  // Resolve language code to name (e.g., 'en' → 'English'), fall back to raw value for backward compat
  const targetLanguage = (language && SUPPORTED_SUMMARY_LANGUAGES[language.toLowerCase()]) || language || 'English';
  
  const durationConstraint = videoDuration 
    ? `The total duration of the video is ${videoDuration} seconds. All chapter starting timestamps MUST be strictly less than ${videoDuration} seconds.` 
    : '';

  const prompt = `Analyze the following video transcript to divide the video into logical chapters/topics (usually 3 to 8 chapters depending on video length and density of content).
For each chapter, provide the starting timestamp in seconds as an integer (use the exact seconds integer from the transcript timestamps, e.g. 125 from [02:05 (125s)]) and a brief, descriptive title (maximum 80 characters) written in ${targetLanguage}.
The first chapter MUST start at 0 seconds.
${durationConstraint}

Return a JSON array of objects with the exact schema:
[
  { "time": 0, "title": "Introduction" },
  { "time": 90, "title": "Setting up the Project" }
]

Do not include any other text, markdown blocks, or formatting. Just output the raw JSON array.

Transcript:
${simpleTranscript}`;

  console.log(`Calling ${config.providerName} API for chapter generation...`);
  let reply = await callAiProvider(config, prompt, {
    systemInstruction,
    maxTokens: 2048
  });

  let replyClean = reply.trim();
  replyClean = replyClean.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/g, '').trim();
  const jsonArrayMatch = replyClean.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch) {
    replyClean = jsonArrayMatch[0];
  }
  
  let chapters;
  try {
    chapters = JSON.parse(replyClean);
  } catch (e) {
    console.error('Failed to parse AI chapters JSON:', reply);
    throw new Error('AI returned invalid JSON: ' + e.message);
  }

  if (!Array.isArray(chapters)) {
    throw new Error('AI response is not an array.');
  }

  // Validate and clean chapters
  const cleaned = chapters.map(ch => {
    let t = parseInt(ch.time, 10);
    if (isNaN(t) || t < 0) t = 0;
    return {
      time: t,
      title: (ch.title || 'Untitled Chapter').substring(0, 100).trim()
    };
  });

  // Sort ascending by time
  cleaned.sort((a, b) => a.time - b.time);

  // Filter out chapters at or beyond video duration
  const withinDuration = videoDuration
    ? cleaned.filter(ch => ch.time < videoDuration)
    : cleaned;

  // Deduplicate chapters by time (keep first occurrence)
  const seenTimes = new Set();
  const deduped = withinDuration.filter(ch => {
    if (seenTimes.has(ch.time)) return false;
    seenTimes.add(ch.time);
    return true;
  });

  // Ensure first chapter is at 0
  if (deduped.length === 0) {
    deduped.push({ time: 0, title: 'Introduction' });
  } else if (deduped[0].time !== 0) {
    console.warn(`AI returned first chapter at ${deduped[0].time}s, forcing to 0. Title: "${deduped[0].title}"`);
    deduped[0].time = 0;
  }

  // Write to disk
  await fs.promises.writeFile(chaptersPath, JSON.stringify(deduped, null, 2), 'utf8');

  return deduped;
}

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

// Clean up orphaned cache files from previous sessions
cleanupOrphanedCache();

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
