# Implementation Plan: Fix Progress Indicator for Auto-Generated Summaries

## Overview
This plan outlines the steps to resolve the premature dismissal of the summary loading state when a summary is being auto-generated.

## Implementation Details

### Step 1: Update NotesPanel.jsx
- Locate `checkSummaryCache` in `frontend/src/components/NotesPanel.jsx`.
- Change the call to `generateSummaryRef.current(autoCreateSummaryLang)` to be awaited:
  ```javascript
  } else if (autoCreateSummary && hasApiKey) {
    await generateSummaryRef.current(autoCreateSummaryLang);
  }
  ```

### Step 2: Verification
- Verify that when a video lesson is loaded/played and `autoCreateSummary` is enabled, the loading spinner is shown continuously on the Summary tab until the summary is fully generated and saved.

## Tasks

- [x] **Task 1: Update checkSummaryCache in NotesPanel.jsx**
  - **Description**: Add `await` to `generateSummaryRef.current(autoCreateSummaryLang)` call inside `checkSummaryCache`.
  - **Acceptance**: The asynchronous generator call is awaited, preventing the `finally` block of `checkSummaryCache` from setting `summaryLoading` to `false` prematurely.
  - **Verify**: Inspect code to ensure syntax is correct and async-await is properly structured.
  - **Files**: `frontend/src/components/NotesPanel.jsx`

- [x] **Task 2: Verify application behavior**
  - **Description**: Run the app locally and verify the fix works as expected.
  - **Acceptance**: 
    - The loading spinner is visible when a summary is automatically generated.
    - When generation succeeds, the summary is displayed.
    - If generation fails, the error message is shown.
  - **Verify**: Manual testing using the dev environment.
  - **Files**: None
