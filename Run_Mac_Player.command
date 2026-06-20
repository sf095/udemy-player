#!/bin/bash
# Get the directory of the active script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

clear
echo "============================================="
echo "🎓 Udemy Offline Player — macOS Startup Helper"
echo "============================================="
echo ""

# Check for the app in the script folder or Applications directory
if [ -d "$DIR/Udemy Offline Player.app" ]; then
  TARGET_APP="$DIR/Udemy Offline Player.app"
elif [ -d "/Applications/Udemy Offline Player.app" ]; then
  TARGET_APP="/Applications/Udemy Offline Player.app"
else
  TARGET_APP=""
fi

if [ -n "$TARGET_APP" ]; then
  echo "🔒 Bypassing Gatekeeper security warning..."
  # Remove quarantine attribute recursively
  xattr -cr "$TARGET_APP"
  
  # Attempt to self-sign the application (silencing warnings if codesign fails/isn't installed)
  codesign --force --deep --sign - "$TARGET_APP" 2>/dev/null
  
  echo "🚀 Launching Udemy Offline Player..."
  open "$TARGET_APP"
  echo "Done! You can close this window."
else
  echo "❌ Error: Could not find 'Udemy Offline Player.app'."
  echo "Please make sure 'Udemy Offline Player.app' is in the same folder as this script,"
  echo "or has been dragged into your /Applications folder."
  echo ""
  echo "Press any key to exit..."
  read -n 1
fi
