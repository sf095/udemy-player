const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

// Test DB path in temp directory
const testDbPath = path.join(os.tmpdir(), `test_progress_db_${Date.now()}.json`);
process.env.USER_DATA_PATH = path.dirname(testDbPath);

console.log('--- Testing Course Progress Reset Logic ---');

const activeCourse = '/path/to/active/course';
const secondCourse = '/path/to/second/course';

const initialDb = {
  activeCoursePath: activeCourse,
  history: [activeCourse, secondCourse],
  progress: {
    '01/01': { completed: true, watchTime: 120, duration: 120 }
  },
  notes: {
    '01/01': [{ id: 'n1', text: 'Legacy note' }]
  },
  courseStates: {
    [activeCourse]: {
      lastLessonId: '01/02',
      lastActiveTab: 'video',
      lastActiveAt: Date.now(),
      progress: {
        '01/01': { completed: true, watchTime: 100, duration: 100 },
        '01/02': { completed: false, watchTime: 50, duration: 200 }
      },
      notes: {
        '01/01': [{ id: 'n_active', text: 'Important note' }]
      }
    },
    [secondCourse]: {
      lastLessonId: '02/01',
      lastActiveTab: 'summary',
      lastActiveAt: Date.now(),
      progress: {
        '02/01': { completed: true, watchTime: 300, duration: 300 }
      },
      notes: {
        '02/01': [{ id: 'n_second', text: 'Second course note' }]
      }
    }
  },
  settings: {}
};

fs.writeFileSync(testDbPath, JSON.stringify(initialDb, null, 2));

// Test 1: Reset active course progress
console.log('Test 1: Reset active course progress...');
const db1 = JSON.parse(fs.readFileSync(testDbPath, 'utf8'));
const targetCourse1 = activeCourse;

// Simulate reset endpoint logic
if (db1.courseStates && db1.courseStates[targetCourse1]) {
  db1.courseStates[targetCourse1].progress = {};
  db1.courseStates[targetCourse1].lastLessonId = null;
}
if (db1.progress && typeof db1.progress === 'object') {
  if (targetCourse1 === db1.activeCoursePath) {
    db1.progress = {};
  }
}
fs.writeFileSync(testDbPath, JSON.stringify(db1, null, 2));

const verifiedDb1 = JSON.parse(fs.readFileSync(testDbPath, 'utf8'));
assert.deepStrictEqual(verifiedDb1.courseStates[activeCourse].progress, {}, 'Progress should be empty');
assert.strictEqual(verifiedDb1.courseStates[activeCourse].lastLessonId, null, 'lastLessonId should be null');
assert.strictEqual(verifiedDb1.courseStates[activeCourse].notes['01/01'][0].text, 'Important note', 'Notes must be preserved');
assert.deepStrictEqual(verifiedDb1.progress, {}, 'Legacy db.progress should be cleared to prevent resurrection');
// Second course should be untouched
assert.strictEqual(verifiedDb1.courseStates[secondCourse].progress['02/01'].completed, true, 'Second course progress intact');
assert.strictEqual(verifiedDb1.courseStates[secondCourse].notes['02/01'][0].text, 'Second course note', 'Second course notes intact');
console.log('PASS: Test 1 (Active course reset)');

// Test 2: Reset second course
console.log('Test 2: Reset second course...');
const db2 = JSON.parse(fs.readFileSync(testDbPath, 'utf8'));
const targetCourse2 = secondCourse;
if (db2.courseStates && db2.courseStates[targetCourse2]) {
  db2.courseStates[targetCourse2].progress = {};
  db2.courseStates[targetCourse2].lastLessonId = null;
}
fs.writeFileSync(testDbPath, JSON.stringify(db2, null, 2));

const verifiedDb2 = JSON.parse(fs.readFileSync(testDbPath, 'utf8'));
assert.deepStrictEqual(verifiedDb2.courseStates[secondCourse].progress, {}, 'Second course progress should be empty');
assert.strictEqual(verifiedDb2.courseStates[secondCourse].lastLessonId, null, 'Second course lastLessonId should be null');
assert.strictEqual(verifiedDb2.courseStates[secondCourse].notes['02/01'][0].text, 'Second course note', 'Second course notes intact');
console.log('PASS: Test 2 (Second course reset)');

// Clean up temp test DB
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

console.log('ALL TESTS PASSED!');
