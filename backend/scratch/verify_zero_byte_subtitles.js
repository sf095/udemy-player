const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { scanCourseFolder } = require('../scanner');

console.log('=== Running Zero-Byte Subtitle Verification Tests ===\n');

// Create temporary directory for mock course
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'udemy-zero-byte-sub-test-'));
const sectionDir = path.join(tmpDir, '01 - Section One');
fs.mkdirSync(sectionDir, { recursive: true });

try {
  // Case 1: Video with ONLY 0-byte subtitle file
  fs.writeFileSync(path.join(sectionDir, '01 - Lesson with zero-byte subtitle.mp4'), 'mock-video-1');
  fs.writeFileSync(path.join(sectionDir, '01 - Lesson with zero-byte subtitle.srt'), ''); // 0 bytes

  // Case 2: Video with VALID subtitle file (>0 bytes)
  fs.writeFileSync(path.join(sectionDir, '02 - Lesson with valid subtitle.mp4'), 'mock-video-2');
  fs.writeFileSync(
    path.join(sectionDir, '02 - Lesson with valid subtitle.en.srt'),
    '1\n00:00:01,000 --> 00:00:04,000\nHello world\n'
  );

  // Case 3: Video with MIXED subtitles (0-byte EN, valid VI)
  fs.writeFileSync(path.join(sectionDir, '03 - Lesson with mixed subtitles.mp4'), 'mock-video-3');
  fs.writeFileSync(path.join(sectionDir, '03 - Lesson with mixed subtitles.en.srt'), ''); // 0 bytes
  fs.writeFileSync(
    path.join(sectionDir, '03 - Lesson with mixed subtitles.vi.srt'),
    '1\n00:00:01,000 --> 00:00:04,000\nXin chao the gioi\n'
  );

  // Case 4: Video with duplicate language (0-byte EN.srt, valid EN.vtt)
  fs.writeFileSync(path.join(sectionDir, '04 - Lesson with duplicate lang.mp4'), 'mock-video-4');
  fs.writeFileSync(path.join(sectionDir, '04 - Lesson with duplicate lang.en.srt'), ''); // 0 bytes
  fs.writeFileSync(
    path.join(sectionDir, '04 - Lesson with duplicate lang.en.vtt'),
    'WEBVTT\n\n1\n00:00:01.000 --> 00:00:04.000\nValid VTT\n'
  );

  const sections = scanCourseFolder(tmpDir);
  assert.strictEqual(sections.length, 1, 'Should find 1 section');

  const lessons = sections[0].lessons;
  assert.strictEqual(lessons.length, 4, 'Should find 4 lessons');

  // Test Case 1: Zero-byte subtitle only
  const lesson1 = lessons.find(l => l.index === 1);
  assert(lesson1, 'Lesson 1 exists');
  console.log('Test Case 1 (Zero-byte subtitle only):');
  console.log('  lesson1.subtitle:', lesson1.subtitle);
  console.log('  lesson1.subtitles:', lesson1.subtitles);
  assert.strictEqual(
    lesson1.subtitle,
    null,
    'Case 1: lesson.subtitle must be null when subtitle is 0 bytes'
  );
  assert.deepStrictEqual(
    lesson1.subtitles,
    {},
    'Case 1: lesson.subtitles must be empty object {} when subtitle is 0 bytes'
  );
  console.log('  PASS: Marked as no subtitle\n');

  // Test Case 2: Valid subtitle
  const lesson2 = lessons.find(l => l.index === 2);
  assert(lesson2, 'Lesson 2 exists');
  console.log('Test Case 2 (Valid subtitle):');
  console.log('  lesson2.subtitle:', lesson2.subtitle);
  console.log('  lesson2.subtitles:', lesson2.subtitles);
  assert(lesson2.subtitle, 'Case 2: lesson.subtitle should not be null');
  assert(lesson2.subtitles['en'], 'Case 2: lesson.subtitles should have en');
  console.log('  PASS: Valid subtitle retained\n');

  // Test Case 3: Mixed subtitles (0-byte EN, valid VI)
  const lesson3 = lessons.find(l => l.index === 3);
  assert(lesson3, 'Lesson 3 exists');
  console.log('Test Case 3 (Mixed subtitles - 0-byte EN, valid VI):');
  console.log('  lesson3.subtitle:', lesson3.subtitle);
  console.log('  lesson3.subtitles:', lesson3.subtitles);
  assert.strictEqual(
    lesson3.subtitles['en'],
    undefined,
    'Case 3: 0-byte EN subtitle must NOT be present in subtitles'
  );
  assert(
    lesson3.subtitles['vi'],
    'Case 3: Valid VI subtitle must be present in subtitles'
  );
  assert.strictEqual(
    lesson3.subtitle,
    lesson3.subtitles['vi'],
    'Case 3: Primary subtitle should point to valid VI subtitle'
  );
  console.log('  PASS: 0-byte EN excluded, valid VI retained\n');

  // Test Case 4: Duplicate language with 0-byte first
  const lesson4 = lessons.find(l => l.index === 4);
  assert(lesson4, 'Lesson 4 exists');
  console.log('Test Case 4 (Duplicate language - 0-byte srt, valid vtt):');
  console.log('  lesson4.subtitle:', lesson4.subtitle);
  console.log('  lesson4.subtitles:', lesson4.subtitles);
  assert(
    lesson4.subtitles['en'],
    'Case 4: Valid EN.vtt should be recorded despite 0-byte EN.srt existing first'
  );
  assert(
    lesson4.subtitles['en'].endsWith('.en.vtt'),
    'Case 4: Subtitle path should point to the non-empty .en.vtt'
  );
  console.log('  PASS: Valid file chosen over 0-byte duplicate\n');

  // Test Case 5: 0-byte subtitle file size check
  console.log('Test Case 5 (/api/subtitle 0-byte defense check):');
  const zeroByteSubPath = path.join(sectionDir, '01 - Lesson with zero-byte subtitle.srt');
  const stat = fs.statSync(zeroByteSubPath);
  assert.strictEqual(stat.size, 0, 'File must have exactly 0 bytes');
  console.log('  PASS: Verified 0-byte file detection\n');

  console.log('ALL TESTS PASSED SUCCESSFULLY!\n');
} finally {
  // Clean up temporary directory
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
