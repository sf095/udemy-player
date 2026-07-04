# Spec: Quiz Player Integration

## Objective
Support offline course quizzes in the Udemy Offline Player. Currently, quizzes stored as JSON files with names ending in `[quiz].json` are not recognized as first-class lessons or parsed for rendering in the player. By scanning and displaying these quiz files as interactive, rich quizzes, users can test their understanding of the course material directly in the player application, submit their answers, view immediate feedback with explanations, track their progress, and mark quiz lessons as completed.

## Tech Stack
- **Frontend**: Vite, React 18, Lucide React (icons)
- **Backend**: Node.js/Express (API proxy and file scanner)

## Commands
- **Dev Server**: `npm run dev` (starts frontend on `http://localhost:3002` and backend on `http://localhost:3003`)
- **Build**: `npm run build`

## Project Structure
- `backend/scanner.js` - Scans course folders to group and categorize lessons and resources.
- `frontend/src/App.jsx` - Main player layout and state orchestration.
- `frontend/src/components/Sidebar.jsx` - Course sidebar listing sections and lessons.
- `frontend/src/components/QuizViewer.jsx` - (New Component) Renders interactive questions, options, check button, and feedback.
- `docs/spec_quiz.md` - (This document) Living specification for the Quiz Player feature.
- `docs/plan_quiz.md` - Technical implementation plan for the quiz feature.
- `docs/tasks_quiz.md` - Structured tasks list for implementation.

## Code Style
Standard ES6+ React 18 functional components with inline styles using the CSS custom variables defined in `index.css`.
```jsx
// New QuizViewer Component Signature
import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function QuizViewer({ path, onComplete, isCompleted }) {
  // state for questions, selected answers, score, and showing results
}
```

## Testing Strategy
- **Manual Verification**: 
  1. Open a course containing a quiz file (e.g. `Product Management 101 Nền Tảng Cơ Bản Cho Quản Lý Sản Phẩm/02 - Vai trò và kĩ năng của Product Manager/10 - Quiz về vai trò và kĩ năng của Product Manager [quiz].json`).
  2. Confirm the quiz is listed in the sidebar with a quiz/clipboard icon instead of the generic document icon.
  3. Clicking the quiz lesson in the sidebar opens the interactive Quiz UI in the main viewer panel.
  4. Select an answer option. Check that single-choice questions use radio buttons and multiple-choice questions use checkboxes.
  5. Click "Submit" / "Check Answer" and verify that correct choices are styled green, incorrect choices are styled red, and the explanation feedback text is visible.
  6. Verify that once completed/passed, the progress status is saved successfully (indicated by checked status in sidebar and API calls).
  7. Verify that clicking "Retry Quiz" resets the selections and allows the user to re-attempt the quiz.

## Boundaries
- **Always**: Parse the quiz JSON file contents safely, supporting HTML markup in questions, options, and feedbacks.
- **Always**: Integrate quiz completion with the existing `/api/userdata/progress` endpoint.
- **Never**: Hardcode specific quiz IDs or paths; the component must dynamically fetch and render any quiz JSON format supplied by the backend scanner.
- **Ask First**: Adding external libraries for quiz styling, charts, or animations.

## Success Criteria
- [ ] The course folder scanner (`backend/scanner.js`) recognizes files ending with `[quiz].json` (case-insensitive) as quiz lessons, assigning `lessonType = 'quiz'` and setting the `quiz` path property.
- [ ] If a folder contains only a `[quiz].json` file (and no video), the group is correctly scanned and treated as a `quiz` lesson rather than ignored or resolved as a generic resource.
- [ ] The left sidebar (`Sidebar.jsx` and `App.jsx` sidebar rendering) displays a specialized quiz/clipboard icon (e.g. `HelpCircle` or `ClipboardList`) for `quiz` type lessons.
- [ ] Active quiz lessons render the new `QuizViewer` component inside the main viewport instead of the `DocViewer` or video player.
- [ ] `QuizViewer` fetches quiz data from `/api/resource?path=<path>` on mount/path change.
- [ ] The quiz supports multiple-choice questions with a single correct response (Radio buttons) or multiple correct responses (Checkboxes), using `correct_response` to determine choice type and correctness.
- [ ] HTML tags (like `<p>`) in the question prompt, answers, and feedbacks are safely rendered.
- [ ] Tapping the "Check Answer" button evaluates selected choices against `correct_response`, shows correct/incorrect highlights, and displays individual option feedbacks.
- [ ] Marking the quiz as completed triggers the progress update request to the backend.

## Open Questions
1. How do we map `correct_response`? (e.g., `["d"]` maps to the 4th option / index 3, `["a", "b"]` maps to indices 0 and 1. We map `"a"` to index 0, `"b"` to index 1, etc.)
2. Should we automatically mark the quiz as completed once the user submits answers, or should we only complete it if they answer correctly (pass the quiz)? (Recommended: Mark as completed upon clicking the "Mark Completed" button or answering correctly, with a visual indicator.)
