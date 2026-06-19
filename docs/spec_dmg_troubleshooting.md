# Spec: macOS DMG Troubleshooting Guide in README

## Objective
Update the project's README.md to document the necessary macOS gatekeeper/quarantine bypass commands for users who download the compiled `.dmg` from GitHub Releases. This ensures a seamless first-launch experience for macOS users without requiring paid Apple Developer certificates.

## Tech Stack
- Document Format: Markdown
- Application Target: Udemy Offline Player (macOS Electron App)

## Commands
- Review Changes: `git diff README.md`

## Project Structure
- `README.md` (root directory)
- `docs/spec_dmg_troubleshooting.md` (this spec)

## Code Style
Markdown style guidelines:
- Clear headings and sub-headings.
- Clear code blocks for terminal commands with instructions to copy-paste.
- Backslashes escaping spaces in shell paths to make them directly executable.

## Testing Strategy
- Manual proofreading of `README.md`.
- Verify the markdown renders correctly in a markdown viewer.

## Boundaries
- Always: Use the correct product name `Udemy Offline Player.app`.
- Always: Explain what these commands do (recursively removing quarantine attributes and self-signing the application bundle) so that users feel safe running them.
- Ask first: If we want to change other sections of README.md.
- Never: Remove existing setup instructions or other unrelated documentation.

## Success Criteria
- [x] README.md contains a clear, dedicated troubleshooting section for macOS users running the `.dmg` release.
- [x] The section provides the exact commands:
  ```bash
  xattr -cr /Applications/Udemy\ Offline\ Player.app
  codesign --force --deep --sign - /Applications/Udemy\ Offline\ Player.app
  ```
- [x] The explanation covers why these commands are needed (macOS Gatekeeper block for unsigned/internet-downloaded apps).

## Open Questions
- None.
