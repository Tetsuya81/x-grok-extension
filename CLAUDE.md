# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome extension that adds a Grok icon to X.com (Twitter) posts. When clicked, it copies the post URL to clipboard and navigates to the Grok page (https://x.com/i/grok).

## Development Commands

### Testing the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select this directory
4. After making changes, click the refresh icon on the extension card
5. Test on https://x.com

### Debugging
- View extension console: Chrome DevTools → Sources → Content Scripts → content.js
- Check for errors: chrome://extensions/ → Details → Errors
- Console logs appear in the web page console when visiting x.com

## Architecture

### Core Components
- **content.js**: Main functionality - injects Grok icons into X.com DOM
  - Uses MutationObserver to detect new posts dynamically
  - Handles clipboard operations with fallback methods
  - Manages visual feedback (icon color changes)
  
- **manifest.json**: Chrome extension configuration (Manifest V3)
  - Permissions: clipboardWrite, activeTab
  - Content script runs on x.com and twitter.com domains

### Key Implementation Details

**Post Detection**: 
```javascript
document.querySelectorAll('[data-testid="tweet"]')
```

**URL Extraction**:
- Primary: Find `a[href*="/status/"]` within post element
- Fallback: Use current page URL if on individual post page

**Icon Injection**:
- Adds 24x24px "G" icon to top-right of each post
- Uses absolute positioning relative to post container
- Includes hover effects and click feedback

## Important Considerations

### DOM Dependencies
- Extension relies on X.com's DOM structure (`data-testid="tweet"`)
- Changes to X.com's markup may break functionality

### Browser Compatibility
- Uses Clipboard API with execCommand fallback
- Requires HTTPS for clipboard access
- Opens new tab for Grok navigation

### Performance
- MutationObserver processes DOM changes with 100ms delay
- Marks processed posts with `grok-processed` class to avoid duplicates

## Common Tasks

### Add New Features
1. Update manifest.json if new permissions needed
2. Modify content.js for functionality
3. Update styles.css for visual changes

### Fix Icon Not Appearing
- Check if X.com changed their DOM structure
- Verify content script is loading (check DevTools sources)
- Ensure extension has proper permissions

### Update Icon Design
- Modify styles in both content.js (inline) and styles.css
- Note: content.js overrides some CSS properties programmatically

## Code Style Guidelines

- **No Emojis**: Do not use emojis in code, comments, or any project documentation