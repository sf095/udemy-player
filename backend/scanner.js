const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

/**
 * Extract duration (in seconds) from an MP4/M4V file by parsing the mvhd box header
 */
function getMp4Duration(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const stat = fs.fstatSync(fd);
    let offset = 0;
    const buf = Buffer.alloc(16);

    while (offset < stat.size) {
      const bytesRead = fs.readSync(fd, buf, 0, 8, offset);
      if (bytesRead < 8) break;

      const size = buf.readUInt32BE(0);
      const type = buf.toString('ascii', 4, 8);

      // A valid MP4 box header is always at least 8 bytes.
      // Sizes 2–7 indicate a corrupt or non-MP4 file.
      if (size > 0 && size < 8) break;

      let headerSize = 8;
      let actualSize = size;
      if (size === 1) {
        fs.readSync(fd, buf, 0, 8, offset + 8);
        const high = buf.readUInt32BE(0);
        const low = buf.readUInt32BE(4);
        actualSize = high * 0x100000000 + low;
        headerSize = 16;
      } else if (size === 0) {
        actualSize = stat.size - offset;
      }

      if (type === 'moov') {
        offset += headerSize;
      } else if (type === 'mvhd') {
        const mvhdBuf = Buffer.alloc(32);
        fs.readSync(fd, mvhdBuf, 0, 32, offset + headerSize);
        const version = mvhdBuf.readUInt8(0);
        let timescale = 0;
        let duration = 0;

        if (version === 1) {
          timescale = mvhdBuf.readUInt32BE(20);
          const durHigh = mvhdBuf.readUInt32BE(24);
          const durLow = mvhdBuf.readUInt32BE(28);
          duration = durHigh * 0x100000000 + durLow;
        } else {
          timescale = mvhdBuf.readUInt32BE(12);
          duration = mvhdBuf.readUInt32BE(16);
        }

        if (timescale > 0) {
          return Math.round(duration / timescale);
        }
        break;
      } else {
        const advance = actualSize > 0 ? actualSize : 8;
        offset += advance;
      }
    }
  } catch (err) {
    console.error(`Error reading MP4 duration for ${filePath}:`, err);
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch (e) {}
    }
  }
  return null;
}

/**
 * Extract duration (in seconds) from an MKV file using ffprobe
 */
function getMkvDuration(filePath) {
  try {
    const output = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ], { encoding: 'utf8' }).trim();
    if (!output) {
      console.error(`ffprobe returned empty output for ${filePath}`);
      return null;
    }
    const duration = parseFloat(output);
    if (!isNaN(duration)) {
      return Math.round(duration);
    }
  } catch (err) {
    console.error(`Error reading MKV duration via ffprobe for ${filePath}:`, err);
  }
  return null;
}

/**
 * Get video duration based on file extension
 */
function getVideoDuration(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp4' || ext === '.m4v') {
    return getMp4Duration(filePath);
  }
  if (ext === '.mkv') {
    return getMkvDuration(filePath);
  }
  return null;
}


/**
 * Clean up lesson filenames to make user-friendly titles
 */
function cleanTitle(filename, prefix) {
  let title = path.basename(filename, path.extname(filename));
  
  if (prefix !== 'un-numbered') {
    const rx = new RegExp(`^${prefix}\\s*-\\s*`);
    title = title.replace(rx, '');
    title = title.replace(/^\d+\s*/, ''); // fallback
  }
  
  // Remove subtitle locales (e.g. .en, .en_US, .vi, .ja)
  title = title.replace(/\.[a-z]{2}(?:_[a-z]{2,4})?$/i, '');
  
  // Clean up punctuation/separators
  title = title.replace(/[-_]+/g, ' ').trim();
  return title;
}

/**
 * Clean up chapter/section folder names to make titles
 */
function cleanSectionTitle(secDir) {
  let title = secDir;
  title = title.replace(/^\d+\s*[-_.]\s*/, '');
  return title.trim();
}

/**
 * Identify subtitle language based on file naming patterns
 */
function getSubtitleLanguage(filename) {
  const name = filename.toLowerCase();
  // Match patterns like .en.srt, _vi.vtt, -es.srt, .zh_CN.srt
  const match = name.match(/[._-]([a-z]{2}(?:_[a-z]{2,4})?)\.(?:srt|vtt)$/i);
  if (match) {
    const lang = match[1].toLowerCase();
    if (lang.startsWith('en')) return 'en';
    return lang;
  }
  return 'en';
}

/**
 * Recursively scans the course root folder to build sections and grouped lessons
 */
function scanCourseFolder(coursePath) {
  if (!fs.existsSync(coursePath)) {
    throw new Error(`Course directory does not exist: ${coursePath}`);
  }

  const items = fs.readdirSync(coursePath);
  const sections = [];

  // Filter and sort subdirectories (sections)
  const sectionDirs = items
    .filter(item => {
      const fullPath = path.join(coursePath, item);
      return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
    })
    .sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });

  for (const secDir of sectionDirs) {
    const secPath = path.join(coursePath, secDir);
    const secFiles = fs.readdirSync(secPath);
    
    // Group files by prefix (digits at start, e.g. "03 - ...")
    const groups = {};
    
    for (const file of secFiles) {
      if (file.startsWith('.')) continue;
      
      const fullFilePath = path.join(secPath, file);
      if (fs.statSync(fullFilePath).isDirectory()) continue;

      const match = file.match(/^(\d+)\b/);
      const prefix = match ? match[1] : 'un-numbered';
      
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push({
        name: file,
        ext: path.extname(file).toLowerCase(),
        fullPath: fullFilePath
      });
    }

    const lessons = [];
    
    // Sort prefixes numerically with 'un-numbered' at the end
    const prefixes = Object.keys(groups).sort((a, b) => {
      if (a === 'un-numbered') return 1;
      if (b === 'un-numbered') return -1;
      return parseInt(a, 10) - parseInt(b, 10);
    });

    for (const prefix of prefixes) {
      const files = groups[prefix];
      
      let videoFile = null;
      const subtitles = {};
      const resources = [];

      for (const file of files) {
        if (file.ext === '.mp4' || file.ext === '.m4v' || file.ext === '.mkv') {
          videoFile = file;
        } else if (file.ext === '.srt' || file.ext === '.vtt') {
          const lang = getSubtitleLanguage(file.name);
          // Keep first file found per language (avoid duplicates if any)
          if (!subtitles[lang]) {
            subtitles[lang] = file.fullPath;
          }
        } else if (!(file.ext === '.txt' && file.name.toLowerCase().includes('.summary.')) && file.name.toLowerCase() !== '.ds_store' && !file.name.toLowerCase().endsWith('.chapters.json')) {
          // Process as a lesson resource/document
          let resourceType = 'file';
          let resourcePath = file.fullPath;

          if (file.ext === '.pdf') {
            resourceType = 'pdf';
          } else if (file.ext === '.html' || file.ext === '.htm') {
            resourceType = 'html';
          } else if (file.ext === '.json' && (file.name.toLowerCase().includes('quiz') || file.name.toLowerCase().includes('[quiz]'))) {
            resourceType = 'quiz';
          } else if (file.ext === '.url') {
            resourceType = 'url';
            try {
              const content = fs.readFileSync(file.fullPath, 'utf8');
              const match = content.match(/^URL=(.+)$/m);
              if (match) {
                resourcePath = match[1].trim();
              }
            } catch (err) {
              console.error(`Failed to parse .url file at ${file.fullPath}:`, err);
            }
          }

          resources.push({
            name: file.name,
            title: cleanTitle(file.name, prefix),
            path: resourcePath,
            ext: file.ext,
            type: resourceType
          });
        }
      }

      // Ignore groups that do not contain valid video or resources
      if (!videoFile && resources.length === 0) {
        continue;
      }

      const firstPdf = resources.find(r => r.type === 'pdf');
      const firstHtml = resources.find(r => r.type === 'html');
      const firstQuiz = resources.find(r => r.type === 'quiz');

      let title = '';
      if (videoFile) {
        title = cleanTitle(videoFile.name, prefix);
      } else if (firstQuiz) {
        title = firstQuiz.title;
      } else if (firstHtml) {
        title = firstHtml.title;
      } else if (firstPdf) {
        title = firstPdf.title;
      } else if (resources.length > 0) {
        title = resources[0].title;
      }

      let lessonType = 'video';
      if (!videoFile) {
        if (firstQuiz) {
          lessonType = 'quiz';
        } else if (firstHtml) {
          lessonType = 'html';
        } else if (firstPdf) {
          lessonType = 'pdf';
        } else {
          lessonType = 'resource';
        }
      }

      // Unique ID for progress tracking
      const lessonId = `${secDir}/${prefix}`;

      lessons.push({
        id: lessonId,
        index: prefix === 'un-numbered' ? null : parseInt(prefix, 10),
        title: title || 'Untitled Lesson',
        video: videoFile ? videoFile.fullPath : null,
        duration: videoFile ? getVideoDuration(videoFile.fullPath) : null,
        subtitle: subtitles['en'] || Object.values(subtitles)[0] || null,
        subtitles: subtitles,
        pdf: firstPdf ? firstPdf.path : null,
        html: firstHtml ? firstHtml.path : null,
        quiz: firstQuiz ? firstQuiz.path : null,
        resources: resources,
        type: lessonType
      });
    }

    sections.push({
      id: secDir,
      title: cleanSectionTitle(secDir),
      lessons: lessons
    });
  }

  return sections;
}

module.exports = { scanCourseFolder };
