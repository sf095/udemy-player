# Spec: Preserve Study State Across Courses

## Objective
When a user switches between courses (via the course dropdown selector, the native folder browser, or the Course Manager modal), the player must preserve and restore the user's study state for each course instead of resetting to a blank stage.

Currently:
1. Switching to a course unsets the active lesson (`setActiveLesson(null)`), leaving the player at a blank "Ready to Learn?" screen.
2. The user has to manually expand chapters, remember which lesson they were studying, and click it.
3. If the user was watching a video, the current playback time is only flushed every 5 seconds; switching courses abruptly can lose the last few seconds of watch time.
4. If two different courses share identical chapter names and lesson numbers (e.g. `01 - Introduction/01`), their completion and watch progress may collide in the flat `progress` database.

With this feature:
- Every course maintains its own study state (`courseStates[coursePath]`):
  - `lastLessonId`: ID of the last active lesson studied in this course.
  - `lastActiveTab`: Active view mode (`'video'` or `'doc'`).
  - `lastActiveAt`: Timestamp of last study session.
  - `progress`: Scoped progress dictionary (`lessonId -> { completed, watchTime, duration }`), falling back to global legacy progress so existing user data is seamlessly preserved.
- When switching away from a course or unmounting, the current video playback position is immediately flushed and saved to disk.
- When loading or switching to a course, the player automatically restores and loads the course's last active lesson at the exact saved watch timestamp (or smart-selects the first incomplete lesson / first lesson if the course has never been opened before).
- The "Course Content" sidebar automatically expands the section and highlights the active lesson.

---

## Tech Stack
- Frontend: React 19 (Vite SPA)
- Backend: Node.js / Express
- Data Store: Local JSON file (`backend/progress_db.json`)
- Icons: Lucide React

---

## Commands
- Dev Backend: `npm run backend` (or `npm run dev --prefix backend`)
- Dev Frontend: `npm run dev --prefix frontend`
- Full Dev Environment: `npm run dev`
- Build Frontend: `npm run build --prefix frontend`
- Lint Frontend: `npm run lint --prefix frontend`
- Desktop App: `npm run dev:desktop`

---

## Project Structure
- `backend/server.js` — Handles `/api/userdata`, `/api/userdata/course`, `/api/userdata/progress`, `/api/userdata/course-state`, and backward-compatible persistence.
- `backend/progress_db.json` — Persistent storage for courses, course-scoped progress, notes, and study states.
- `backend/scanner.js` — Scans course folders and produces sections/lessons.
- `frontend/src/App.jsx` — Manages course loading, active lesson selection, throttled & immediate progress flushing, course switching state restoration.
- `frontend/src/components/CourseSelector.jsx` — Dropdown & folder picker for switching courses.
- `frontend/src/components/CourseManagerModal.jsx` — Modal for managing & selecting courses from history.
- `frontend/src/components/Sidebar.jsx` — Course content accordion displaying sections and lessons.
- `docs/spec_course_study_state.md` — This specification.

---

## Data Model & API Contracts

### Database Schema (`progress_db.json`)
```json
{
  "activeCoursePath": "/path/to/active/course",
  "history": [ "/path/to/active/course", "/path/to/other/course" ],
  "progress": {
    "01 - Intro/01": { "completed": true, "watchTime": 120, "duration": 300 }
  },
  "notes": { ... },
  "settings": { ... },
  "courseStates": {
    "/path/to/active/course": {
      "lastLessonId": "01 - Intro/01",
      "lastActiveTab": "video",
      "lastActiveAt": 1726480000000,
      "progress": {
        "01 - Intro/01": { "completed": true, "watchTime": 120, "duration": 300 }
      }
    }
  }
}
```

### Endpoints
1. `GET /api/userdata`
   - Returns `{ activeCoursePath, history, progress, notes, settings, courseStates }`.
   - Merges course-scoped progress for `activeCoursePath` over legacy global `progress` so callers always receive the effective progress map.

2. `POST /api/userdata/progress`
   - Request Body: `{ coursePath?, lessonId, completed?, watchTime?, duration? }`.
   - Writes to `db.courseStates[coursePath].progress[lessonId]` AND synchronizes to `db.progress[lessonId]` for legacy compatibility.
   - Also updates `db.courseStates[coursePath].lastLessonId = lessonId`.

3. `POST /api/userdata/course-state`
   - Request Body: `{ coursePath, lastLessonId?, lastActiveTab?, lastActiveAt? }`.
   - Records current study state for the specified course.

4. `POST /api/userdata/course`
   - Accepts `{ path }`.
   - Returns updated user data including `courseStates`.

---

## Code Style
Standard React functional components with hooks (`useState`, `useEffect`, `useCallback`, `useRef`).
Backend uses clean async Express routes with synchronous file writes (`readDb`, `writeDb`).

Example snippet:
```javascript
// Saving study state per course
const saveCourseStudyState = async (coursePath, lessonId, activeTab, watchTime) => {
  if (!coursePath || !lessonId) return;
  try {
    await fetch('/api/userdata/course-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coursePath,
        lastLessonId: lessonId,
        lastActiveTab: activeTab,
        watchTime,
        lastActiveAt: Date.now()
      })
    });
  } catch (err) {
    console.error('Failed to save course study state:', err);
  }
};
```

---

## Testing Strategy
1. **Multi-course switching test**:
   - Open Course A, navigate to Lesson 3, play until 01:45.
   - Switch to Course B, navigate to Lesson 1, play until 00:30.
   - Switch back to Course A:
     - Verify Lesson 3 is immediately selected (not blank empty state).
     - Verify sidebar automatically expands Lesson 3's section.
     - Verify video player cue is at 01:45.
   - Switch back to Course B:
     - Verify Lesson 1 is immediately restored at 00:30.
2. **Immediate save on switch (flush test)**:
   - Play video in Course A, switch immediately within 2 seconds (before the 5s throttle timer).
   - Switch back and verify the playback time reflects the moment before the switch.
3. **First-time course open (smart default)**:
   - Add/open a new course with no saved history:
     - Verify it defaults to the first incomplete lesson or Lesson 1, rather than showing a blank placeholder.
4. **Active tab preservation**:
   - In Course A, switch to Companion Resources tab (doc/quiz).
   - Switch to Course B and back to Course A:
     - Verify Course A reopens in Companion Resources tab.
5. **Data backward compatibility**:
   - Ensure existing `progress_db.json` entries remain intact and load without error.

---

## Boundaries
- **Always**: Flush active video playback time to disk *before* switching course paths.
- **Always**: Preserve backward compatibility with existing `progress_db.json` data.
- **Always**: Keep video initially paused when auto-restoring a course on switch (prevent abrupt audio/video blasting).
- **Ask First**: Modifying existing `progress` / `notes` schema in ways that require a database migration or wipe.
- **Never**: Hardcode filesystem paths.
- **Never**: Break keyboard shortcut navigation or autoplay across lessons.

---

## Success Criteria
- [x] When switching between courses, the player immediately loads the last active lesson of the selected course.
- [x] Video resume position (`watchTime`) is accurately preserved and restored upon switching courses.
- [x] Active playback progress is synchronously or reliably flushed prior to course change (no progress lost to 5s debounce/throttle).
- [x] If a course is opened for the first time, it gracefully defaults to the first incomplete lesson (or lesson 1) instead of an empty screen.
- [x] Active tab (Video vs Companion Resources) is preserved per course.
- [x] In the sidebar, the section containing the restored lesson is automatically expanded and visible.
- [x] Existing `progress_db.json` progress and notes are fully preserved.

---

## Resolved Clarifications
1. **Course-scoped progress isolation**:
   - `courseStates[coursePath]` scopes progress per course while keeping fallback to legacy flat `progress` entries for full backward compatibility.
2. **Auto-select behavior for brand new courses**:
   - When opening a course with no prior study history, auto-select the first incomplete lesson (or Lesson 1) to start immediately.
3. **Active tab preservation**:
   - Remember whether the user was viewing Video or Companion Doc/Resource per course (`lastActiveTab`).
