# Plan: Display Full Lesson Titles and Resource Indicators in Sidebar

## 1. Major Components and Dependencies
- **Sidebar CSS (`frontend/src/index.css`)**: Modify `.lesson-title-text` to remove truncation properties (`white-space: nowrap; text-overflow: ellipsis; overflow: hidden;`) and ensure wrapping (`white-space: normal; word-break: break-word;`). Ensure proper flex layout alignment so icons and checkboxes remain aligned nicely (e.g. `align-items: flex-start` if titles wrap, or keeping it clean).
- **Sidebar Component (`frontend/src/components/Sidebar.jsx`)**:
  - Implement a helper to count or detect resources:
    ```javascript
    const getLessonResourcesCount = (lesson) => {
      if (lesson.resources) return lesson.resources.length;
      let count = 0;
      if (lesson.pdf) count++;
      if (lesson.html) count++;
      return count;
    };
    ```
  - Import the `Paperclip` icon (or other suitable icon) from `lucide-react`.
  - Render a small resource indicator badge next to the lesson title text when the resource count is greater than 0.
  - Style the badge/indicator using existing design tokens.

## 2. Implementation Order
1. **CSS Modifications**: Update styling in `index.css` to allow text wrapping for `.lesson-title-text`. Also adjust `.lesson-item` to align child items (checkbox, type icon, details) to `flex-start` (with top-padding adjustment) so they look great when text wraps.
2. **React Sidebar Update**: Add resource-detection logic and render the resource indicator badge next to the title in `Sidebar.jsx`.
3. **Refining Layout & Styling**: Add CSS classes for the resource indicator/badge (e.g. `.resource-indicator-badge`) in `index.css` to make it look premium and fit the dark/light themes.

## 3. Risks & Mitigations
- **Risk**: Vertical alignment of icons and checkboxes looks bad when lesson titles wrap to 2 or 3 lines.
  - **Mitigation**: Adjust `.lesson-item` to use `align-items: flex-start` and add a slight top margin or padding to the checkbox/icon so they align perfectly with the first line of the title text.
- **Risk**: Too many badges cluttering the list.
  - **Mitigation**: Keep the badge/indicator small, subtle, and clean. Use standard colors (like `--primary` or `--text-muted`) so it fits seamlessly into the background.

## 4. Verification Checkpoints
- Run Vite dev server and load a course with multiple resources.
- Verify lesson list items containing long titles wrap and display completely.
- Verify that a badge displaying the resource count or resource icon is present on the right of the title (or inline next to the text).
- Toggle light/dark mode to verify readability.
