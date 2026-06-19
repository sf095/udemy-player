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
  
  // Remove subtitle locales
  title = title.replace(/\.en_US$/, '');
  title = title.replace(/\.en$/, '');
  
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
      let srtFile = null;
      let pdfFile = null;
      let htmlFile = null;

      for (const file of files) {
        if (file.ext === '.mp4') {
          videoFile = file;
        } else if (file.ext === '.srt' || file.ext === '.vtt') {
          // If there are multiple srt files, pick the first
          if (!srtFile) srtFile = file;
        } else if (file.ext === '.pdf') {
          pdfFile = file;
        } else if (file.ext === '.html' || file.ext === '.htm') {
          htmlFile = file;
        }
      }

      // Ignore groups that do not contain valid media or documents
      if (!videoFile && !pdfFile && !htmlFile) {
        continue;
      }

      let title = '';
      if (videoFile) {
        title = cleanTitle(videoFile.name, prefix);
      } else if (htmlFile) {
        title = cleanTitle(htmlFile.name, prefix);
      } else if (pdfFile) {
        title = cleanTitle(pdfFile.name, prefix);
      }

      // Unique ID for progress tracking
      const lessonId = `${secDir}/${prefix}`;

      lessons.push({
        id: lessonId,
        index: prefix === 'un-numbered' ? null : parseInt(prefix, 10),
        title: title || 'Untitled Lesson',
        video: videoFile ? videoFile.fullPath : null,
        subtitle: srtFile ? srtFile.fullPath : null,
        pdf: pdfFile ? pdfFile.fullPath : null,
        html: htmlFile ? htmlFile.fullPath : null,
        type: videoFile ? 'video' : (htmlFile ? 'html' : 'pdf')
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
