# Tasks: Quiz Player Integration

- [x] Task 1: Scanner Support for Quiz Files
  - **Description**: Modify `backend/scanner.js` to identify quiz files ending in `[quiz].json` (case-insensitive) as quiz resources/lessons.
  - **Acceptance**: Lessons containing `[quiz].json` are categorized as `type: 'quiz'` with the correct `quiz` path in scanned course payloads.
  - **Verify**: Inspect scanner output response payload for `Product Management 101` course.
  - **Files**: `backend/scanner.js`

- [x] Task 2: Sidebar Icon for Quizzes
  - **Description**: Add `HelpCircle` icon from `lucide-react` to `frontend/src/components/Sidebar.jsx` and display it next to quiz lessons.
  - **Acceptance**: Quiz lessons show the orange/amber help circle icon.
  - **Verify**: Sidebar updates visually with the new icon.
  - **Files**: `frontend/src/components/Sidebar.jsx`

- [x] Task 3: Interactive Quiz Viewer Component
  - **Description**: Implement `frontend/src/components/QuizViewer.jsx` to load the JSON quiz from `/api/resource`, allow users to select responses, validate selections against correct options, and render HTML strings safely.
  - **Acceptance**: Renders interactive quiz with support for single/multiple responses, handles option correctness styling (green/red), displays feedback text, and calculates final score.
  - **Verify**: Component mounts, loads JSON, responds to user input, and evaluates answers correctly.
  - **Files**: `frontend/src/components/QuizViewer.jsx`

- [x] Task 4: Main Layout Integration and Completion State
  - **Description**: Integrate `QuizViewer` into the central stage of `frontend/src/App.jsx`. Coordinate selection, completion state triggers, and styling wrapper.
  - **Acceptance**: Selecting a quiz lesson displays the QuizViewer in the center panel, completing/passing the quiz propagates completion back to sidebar and user progress database.
  - **Verify**: Selecting a quiz shows the quiz interface, submitting/completing marks the sidebar item checked and hits the backend `/api/userdata/progress` endpoint.
  - **Files**: `frontend/src/App.jsx`
