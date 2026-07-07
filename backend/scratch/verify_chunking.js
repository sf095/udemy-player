const fs = require('fs');
const path = require('path');

// Copied parseSubtitleCues from backend/server.js for unit testing
function parseSubtitleCues(content) {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\uFEFF/g, '');
  const lines = normalized.split('\n');
  const cues = [];
  let currentCue = [];

  for (const line of lines) {
    if (line.trim() === '') {
      if (currentCue.length > 0) {
        const cueStr = currentCue.join('\n');
        if (cueStr.includes('-->')) {
          cues.push(cueStr);
        }
        currentCue = [];
      }
    } else {
      currentCue.push(line);
    }
  }

  if (currentCue.length > 0) {
    const cueStr = currentCue.join('\n');
    if (cueStr.includes('-->')) {
      cues.push(cueStr);
    }
  }

  return cues;
}

// -------------------------------------------------------------
// Test Case 1: SRT Parsing
// -------------------------------------------------------------
const mockSrtContent = `1
00:00:01,000 --> 00:00:04,000
Hello World

2
00:00:04,500 --> 00:00:07,000
This is a test of the translation chunking feature.
Multiple lines here.

3
00:00:07,100 --> 00:00:10,000
Goodbye!`;

const srtCues = parseSubtitleCues(mockSrtContent);
console.log('SRT Cues Count:', srtCues.length);
if (srtCues.length !== 3) {
  console.error('FAIL: Expected 3 SRT cues, got', srtCues.length);
  process.exit(1);
}
if (!srtCues[0].includes('Hello World') || !srtCues[1].includes('This is a test') || !srtCues[2].includes('Goodbye!')) {
  console.error('FAIL: SRT cue contents incorrect');
  process.exit(1);
}
console.log('PASS: SRT parsing test');

// -------------------------------------------------------------
// Test Case 2: WebVTT Parsing with header/metadata blocks
// -------------------------------------------------------------
const mockVttContent = `WEBVTT
Kind: captions
Language: en
NOTE: This is a comment block that should be discarded.

1
00:00:01.000 --> 00:00:04.000
Hello VTT World

2
00:00:04.500 --> 00:00:07.000
VTT lines.

3
00:00:07.100 --> 00:00:10.000
VTT Goodbye!`;

const vttCues = parseSubtitleCues(mockVttContent);
console.log('VTT Cues Count:', vttCues.length);
if (vttCues.length !== 3) {
  console.error('FAIL: Expected 3 VTT cues, got', vttCues.length);
  process.exit(1);
}
if (vttCues[0].includes('WEBVTT') || vttCues[0].includes('NOTE:')) {
  console.error('FAIL: Header or Comment block included in VTT cues');
  process.exit(1);
}
if (!vttCues[0].includes('Hello VTT World') || !vttCues[2].includes('VTT Goodbye!')) {
  console.error('FAIL: VTT cue contents incorrect');
  process.exit(1);
}
console.log('PASS: WebVTT parsing test');

// -------------------------------------------------------------
// Test Case 3: Chunking logic verification
// -------------------------------------------------------------
// Generate 250 dummy cues
const dummyCues = [];
for (let i = 1; i <= 250; i++) {
  dummyCues.push(`${i}\n00:00:${String(i).padStart(2, '0')}.000 --> 00:00:${String(i + 1).padStart(2, '0')}.000\nSubtitle cue content ${i}`);
}

const chunkSize = 100;
const chunks = [];
for (let i = 0; i < dummyCues.length; i += chunkSize) {
  chunks.push(dummyCues.slice(i, i + chunkSize));
}

console.log('Chunks Count:', chunks.length);
if (chunks.length !== 3) {
  console.error('FAIL: Expected 3 chunks for 250 cues with chunk size 100, got', chunks.length);
  process.exit(1);
}
if (chunks[0].length !== 100 || chunks[1].length !== 100 || chunks[2].length !== 50) {
  console.error('FAIL: Chunk sizes incorrect');
  process.exit(1);
}
console.log('PASS: Chunking logic test');

// Simulate chunking and stitching
const processedChunks = chunks.map((chunk, index) => {
  // Mock translate operation
  console.log(`Translating chunk ${index + 1}/${chunks.length} containing ${chunk.length} cues...`);
  return chunk.map(cue => {
    // Just append " [Translated]" to the text line of each cue
    const lines = cue.split('\n');
    lines[2] = lines[2] + ' [Translated]';
    return lines.join('\n');
  }).join('\n\n');
});

const mergedContent = 'WEBVTT\n\n' + processedChunks.join('\n\n');
const verifiedCues = parseSubtitleCues(mergedContent);
if (verifiedCues.length !== 250) {
  console.error('FAIL: Stitched cues count mismatch, got', verifiedCues.length);
  process.exit(1);
}
if (!verifiedCues[249].includes('Subtitle cue content 250 [Translated]')) {
  console.error('FAIL: Stitch content verification failed');
  process.exit(1);
}
console.log('PASS: End-to-end chunk simulation test');
console.log('ALL TESTS PASSED SUCCESSFULLY!');
