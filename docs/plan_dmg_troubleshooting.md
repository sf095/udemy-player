# Plan: macOS DMG Troubleshooting Guide in README

## Implementation Plan

### 1. Identify Target Section
We will add a new subsection `### 4. Running the Desktop App (macOS DMG)` under the `## Setup & Running` section in [README.md](file:///Users/hientranthanh/downloads/sources/udemy-player/README.md).

### 2. Implementation Order
1. Draft the markdown content for the troubleshooting section.
2. Use a code edit tool to insert the section after step `### 3. Open in Browser`.
3. Verify formatting and links.

### 3. Risks & Mitigations
- **Risk**: Backslash syntax in paths might be confusing for users copy-pasting.
- **Mitigation**: Add a code comment explaining that the backslash escapes the space in the path, and make the command copy-paste friendly.

### 4. Parallel/Sequential Tasks
- Sequential: We will write the plan, write the tasks, and then edit the file.

### 5. Verification Checkpoint
- Perform `git diff README.md` to verify the edit is correct and has not modified any other sections.
