# Plan: Quiz Player Integration

This plan outlines the design and implementation steps for integrating interactive quizzes into the Udemy Offline Player.

## Proposed Architecture

```mermaid
graph TD
    Scanner[backend/scanner.js] -->|Scans [quiz].json files| AppState[frontend/src/App.jsx]
    AppState -->|Renders | Sidebar[frontend/src/components/Sidebar.jsx]
    AppState -->|Renders if activeLesson.type === 'quiz'| QuizViewer[frontend/src/components/QuizViewer.jsx]
    QuizViewer -->|Fetches JSON data| API[/api/resource?path=... ]
    QuizViewer -->|Triggers completion| AppState
```

## Step 1: Scanner Modifications (`backend/scanner.js`)
- Update file loop to classify `.json` files containing `[quiz]` or `quiz` in the filename as `resourceType = 'quiz'`.
- If no video is present in a prefix group, check if a quiz resource exists.
- If a quiz resource exists, mark `lessonType = 'quiz'` and assign `quiz = firstQuiz.path`.
- Ensure quiz resources are included in the lesson object.

## Step 2: Sidebar UI Enhancements (`frontend/src/components/Sidebar.jsx`)
- Import `HelpCircle` from `lucide-react`.
- Update `getLessonIcon` to return `<HelpCircle size={14} style={{ color: 'var(--accent-amber)' }} />` when `type === 'quiz'`.

## Step 3: Main Layout Integration (`frontend/src/App.jsx`)
- Import `QuizViewer` component.
- In `handleSelectLesson`, auto-select tab or active display based on `lesson.type === 'quiz'`.
- In the main stage area, render `<QuizViewer>` when `activeLesson.type === 'quiz'`.
- Pass completion status and callback `onToggleComplete(activeLesson.id, true)` to the `QuizViewer`.

## Step 4: Create Quiz Viewer Component (`frontend/src/components/QuizViewer.jsx`)
- State management:
  - `quizData`: Object holding questions and details parsed from the JSON file.
  - `userAnswers`: Key-value pair mapping question index (or ID) to selected options.
  - `showResults`: Boolean indicating if the user has submitted/checked their answers.
  - `loading`: Boolean for the fetching state.
  - `error`: String for any network/file error.
- Render logic:
  - Render title and description.
  - Iterate through questions (`quizData.results`).
  - Render each question prompt using `dangerouslySetInnerHTML` to support embedded HTML tags (like `<p>`, `<strong>`, `<code>`).
  - For options (answers):
    - Identify if the question is single-choice or multiple-choice by checking `correct_response.length` (or `assessment_type === 'multiple-choice'` with single vs multiple responses).
    - Map option indexes `0, 1, 2...` to character codes `"a", "b", "c"...`.
    - Checkbox or Radio button input.
    - If `showResults` is true, style correct choices in green and incorrect choices in red. Display feedback text for selected/correct choices.
  - Render a "Submit Quiz" or "Check Answers" button.
  - Once submitted, show overall score. Render "Reset Quiz" / "Try Again" button.
  - Provide a "Mark Completed" button or automatically complete the lesson on passing/submitting.

## Verification Checkpoints
- Ensure a quiz JSON loads correctly without errors.
- Confirm selection behavior works for radio buttons and checkboxes.
- Ensure correct and incorrect options are highlighted exactly as expected, matching the characters in `correct_response`.
- Verify the completion state persists in the sidebar and database.
