<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Chrome Extension Development Instructions

This is a Chrome Extension project built with Manifest V3 for optimal performance and modern standards.

## Project Structure

- `manifest.json`: Extension configuration with permissions for storage, notifications, alarms, and activeTab
- `popup.html/js/css`: Main user interface with time display, shortcuts, and working mode
- `background.js`: Service worker handling notifications, alarms, and persistent state

## Performance Guidelines

- Use efficient time updates with `requestAnimationFrame` for smooth millisecond display
- Minimize background script resource usage
- Implement proper cleanup for intervals and event listeners
- Use Chrome storage API for persistent data
- Optimize notification management to prevent spam

## Code Style

- Use modern ES6+ JavaScript features
- Implement class-based architecture for better organization
- Follow Chrome Extension best practices for Manifest V3
- Use async/await for asynchronous operations
- Implement proper error handling for Chrome APIs

## Features to Maintain

- Real-time clock with milliseconds precision
- Customizable shortcuts with emoji icons
- Working mode with hourly health reminders
- Persistent state across browser sessions
- Clean, modern UI with responsive design

## Chrome APIs Used

- `chrome.storage.local`: User preferences and shortcuts
- `chrome.alarms`: Scheduled reminder system
- `chrome.notifications`: Working mode health reminders
- `chrome.tabs`: Opening shortcuts in new tabs
- `chrome.runtime`: Message passing between components

When making changes, ensure compatibility with Chrome 88+ and maintain the performance optimizations already in place.
