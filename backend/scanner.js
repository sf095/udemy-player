const fs = require('fs');
const path = require('path');

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
        if (file.ext === '.mp4') {
          videoFile = file;
        } else if (file.ext === '.srt' || file.ext === '.vtt') {
          const lang = getSubtitleLanguage(file.name);
          // Keep first file found per language (avoid duplicates if any)
          if (!subtitles[lang]) {
            subtitles[lang] = file.fullPath;
          }
        } else if (file.name.toLowerCase() !== '.ds_store') {
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
