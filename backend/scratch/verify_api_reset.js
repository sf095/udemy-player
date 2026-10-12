const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

// Create isolated test db
const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reset-test-'));
const testDbFile = path.join(testDir, 'progress_db.json');
process.env.USER_DATA_PATH = testDir;

const courseA = '/path/to/courseA';
const courseB = '/path/to/courseB';

const seedDb = {
  activeCoursePath: courseA,
  history: [courseA, courseB],
  progress: {
    '01/01': { completed: true, watchTime: 120, duration: 120 }
  },
  notes: {
    '01/01': [{ id: 'n1', text: 'Legacy note' }]
  },
  courseStates: {
    [courseA]: {
      lastLessonId: '01/02',
      lastActiveTab: 'video',
      lastActiveAt: Date.now(),
      progress: {
        '01/01': { completed: true, watchTime: 100, duration: 100 },
        '01/02': { completed: true, watchTime: 50, duration: 200 }
      },
      notes: {
        '01/01': [{ id: 'nA', text: 'Course A note' }]
      }
    },
    [courseB]: {
      lastLessonId: '02/01',
      lastActiveTab: 'video',
      lastActiveAt: Date.now(),
      progress: {
        '02/01': { completed: true, watchTime: 300, duration: 300 }
      },
      notes: {
        '02/01': [{ id: 'nB', text: 'Course B note' }]
      }
    }
  },
  settings: {}
};

fs.writeFileSync(testDbFile, JSON.stringify(seedDb, null, 2));

// Load server helpers / route
// We simulate the exact server endpoint logic
function readDb() {
  return JSON.parse(fs.readFileSync(testDbFile, 'utf8'));
}
function writeDb(data) {
  fs.writeFileSync(testDbFile, JSON.stringify(data, null, 2));
}
function getEffectiveUserData(db, targetCoursePath = null) {
  const activeCourse = targetCoursePath || db.activeCoursePath;
  const courseState = (activeCourse && db.courseStates && db.courseStates[activeCourse]) || null;
  const courseProgress = courseState?.progress || {};
  const courseNotes = courseState?.notes || (activeCourse ? {} : (db.notes || {}));
  return {
    ...db,
    progress: courseProgress,
    notes: courseNotes,
    activeCourseState: courseState
  };
}

const app = express();
app.use(express.json());

app.post('/api/userdata/course-progress/reset', (req, res) => {
  const { coursePath: reqCoursePath } = req.body || {};
  const db = readDb();
  const coursePath = reqCoursePath || db.activeCoursePath;

  if (!coursePath) {
    return res.status(400).json({ success: false, error: 'coursePath is required' });
  }

  if (!db.courseStates) {
    db.courseStates = {};
  }
  if (!db.courseStates[coursePath]) {
    db.courseStates[coursePath] = {
      lastLessonId: null,
      lastActiveTab: 'video',
      lastActiveAt: Date.now(),
      progress: {},
      notes: {}
    };
  } else {
    db.courseStates[coursePath].progress = {};
    db.courseStates[coursePath].lastLessonId = null;
    db.courseStates[coursePath].lastActiveAt = Date.now();
  }

  if (db.progress && typeof db.progress === 'object') {
    if (coursePath === db.activeCoursePath) {
      db.progress = {};
    }
  }

  writeDb(db);
  res.json({ success: true, courseState: db.courseStates[coursePath], ...getEffectiveUserData(db, coursePath) });
});

const server = app.listen(0, async () => {
  const port = server.address().port;
  console.log(`Test server running on port ${port}`);

  try {
    // 1. Reset courseA (active course)
    const resA = await fetch(`http://127.0.0.1:${port}/api/userdata/course-progress/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coursePath: courseA })
    });
    const dataA = await resA.json();

    assert.strictEqual(dataA.success, true);
    assert.deepStrictEqual(dataA.progress, {});
    assert.strictEqual(dataA.courseState.lastLessonId, null);
    assert.strictEqual(dataA.courseState.notes['01/01'][0].text, 'Course A note');

    // Verify DB file
    const dbAfterA = readDb();
    assert.deepStrictEqual(dbAfterA.courseStates[courseA].progress, {});
    assert.strictEqual(dbAfterA.courseStates[courseA].lastLessonId, null);
    assert.strictEqual(dbAfterA.courseStates[courseA].notes['01/01'][0].text, 'Course A note');
    assert.deepStrictEqual(dbAfterA.progress, {});
    // Course B untouched
    assert.strictEqual(dbAfterA.courseStates[courseB].progress['02/01'].completed, true);
    console.log('PASS: Course A reset via HTTP');

    // 2. Reset courseB (inactive course)
    const resB = await fetch(`http://127.0.0.1:${port}/api/userdata/course-progress/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coursePath: courseB })
    });
    const dataB = await resB.json();

    assert.strictEqual(dataB.success, true);
    assert.deepStrictEqual(dataB.progress, {});
    assert.strictEqual(dataB.courseState.lastLessonId, null);
    assert.strictEqual(dataB.courseState.notes['02/01'][0].text, 'Course B note');

    const dbAfterB = readDb();
    assert.deepStrictEqual(dbAfterB.courseStates[courseB].progress, {});
    assert.strictEqual(dbAfterB.courseStates[courseB].lastLessonId, null);
    assert.strictEqual(dbAfterB.courseStates[courseB].notes['02/01'][0].text, 'Course B note');
    console.log('PASS: Course B reset via HTTP');

    console.log('ALL HTTP INTEGRATION TESTS PASSED!');
  } finally {
    server.close();
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});
