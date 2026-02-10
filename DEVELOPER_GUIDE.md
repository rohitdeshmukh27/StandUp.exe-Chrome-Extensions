# StandUp.exe - Developer Guide

## 📐 Architecture Overview

This is a **Manifest V3** Chrome extension with three main components:

```
┌─────────────────┐
│  background.js  │ ← Service Worker (persistent logic)
└────────┬────────┘
         │ Manages alarms, notifications, state
         │
    ┌────┴─────────────────┐
    │                      │
┌───▼────┐          ┌─────▼─────┐
│popup.js│          │ newtab.js │
│(Timer  │          │(Dashboard)│
│Control)│          │           │
└────────┘          └───────────┘
```

---

## 📂 File Structure

### **Core Files**

| File                | Purpose             | Key Responsibility                                       |
| ------------------- | ------------------- | -------------------------------------------------------- |
| `manifest.json`     | Extension config    | Permissions, background worker, new tab override         |
| `background.js`     | Service worker      | Timer logic, alarms, notifications, state management     |
| `popup.html/js/css` | Extension popup     | User controls for enabling/disabling 45-min timer        |
| `newtab.html/js`    | New tab page        | Dashboard with time, countdown, shortcuts, timer display |
| `newtab-styles.css` | Dashboard styles    | All visual styling for the dashboard                     |
| `quotes.json`       | Motivational quotes | Daily quotes shown on dashboard                          |

### **Supporting Files**

- `styles.css` - Old popup styles (replaced by `popup.css`)
- `background-old.js`, `background-new.js` - Backup versions
- `newtab-backup.js`, `newtab-simple.js` - Backup versions
- `icons/` - Extension icons (16, 48, 128px)

---

## 🔧 Component Breakdown

### 1. **background.js** - The Brain

**Class:** `BackgroundService`

**What it does:**

- Runs persistently in the background (service worker)
- Manages the 45-minute health reminder timer
- Creates Chrome alarms for scheduled notifications
- Stores timer state in `chrome.storage.local`
- Handles extension startup, updates, and installations

**Key Methods:**

```javascript
toggleWorkingMode(isActive); // Enable/disable timer
setupWorkingModeReminders(); // Create 45-min alarm
showWorkingModeReminder(); // Show notification + reset timer
initializeGlobalTimer(); // Start timer countdown
getGlobalTimerState(); // Return current timer state
loadSettings(); // Load saved user preferences
```

**Storage Keys:**

- `isWorkingMode` (boolean) - Timer enabled/disabled
- `globalTimerStartTime` (timestamp) - When current 45-min cycle started
- `timerDuration` (number) - Minutes per cycle (default: 45)
- `shortcuts` (array) - User's saved shortcuts

**Flow:**

```
1. User enables timer → toggleWorkingMode(true)
2. Creates alarm 45 min from now → setupWorkingModeReminders()
3. Alarm fires → showWorkingModeReminder()
4. Shows notification + opens new tab
5. Resets timer to now → globalTimerStartTime = Date.now()
6. Creates next alarm for 45 min later
```

---

### 2. **popup.js** - User Control Panel

**Class:** `TimerControlPopup`

**What it does:**

- Shows current timer status (Active/Disabled)
- Toggle switch to enable/disable the timer
- Communicates with background.js via `chrome.runtime.sendMessage()`
- Updates UI in real-time based on storage changes

**Key Methods:**

```javascript
loadTimerState(); // Read isWorkingMode from storage
toggleTimer(isEnabled); // Send toggle command to background
updateUI(isEnabled); // Update status indicator & text
```

**UI Elements:**

- Status dot (white glow = active, dimmed = disabled)
- Toggle switch (controls timer on/off)
- Status text showing current state
- Warning message when disabled

---

### 3. **newtab.js** - The Dashboard

**Classes:** `AnimatedNumber`, `ProductivityDashboard`

**What it does:**

- Replaces Chrome's default new tab page
- Shows live clock with animated digit transitions
- Displays countdown timer to next break
- Shows year progress (days remaining in 2026)
- Manages user shortcuts with import/export
- Displays motivational quotes
- Listens for timer state changes from storage

**Key Methods:**

```javascript
// ProductivityDashboard
initializeSimpleHealthReminder() // Setup timer display
updateDisplayFromGlobalTimer()   // Update countdown every second
setTimerEnabled(isEnabled)       // Show/hide disabled state
startTimeUpdate()                // Live clock updates
updateDaysRemaining()            // Calculate year progress
loadShortcuts()                  // Load saved shortcuts
showGentleToast()               // Show break reminder toast

// AnimatedNumber
setValue(value)                  // Set initial value
updateValue(newValue)            // Animate to new value
animateDigit(old, new)          // Roll digit animation
```

**Timer Display Logic:**

```javascript
// Every second:
1. Get globalTimerStartTime from storage
2. Calculate: elapsed = now - startTime
3. Calculate: remaining = 45min - elapsed
4. Display: MM:SS countdown

// When disabled:
1. Add 'timer-disabled' class to widget
2. Blur widget content (CSS filter)
3. Show "DISABLED" text in red
4. Show warning message
```

**Storage Listeners:**

```javascript
chrome.storage.onChanged.addListener((changes) => {
  if (changes.isWorkingMode) {
    // User toggled timer in popup
    → Update dashboard instantly
  }
  if (changes.globalTimerStartTime) {
    // Timer reset (break time)
    → Update countdown display
  }
})
```

---

## 🔄 Data Flow

### Timer Enable/Disable Flow:

```
USER ACTION (popup)
    ↓
popup.js: toggleTimer(true)
    ↓
chrome.runtime.sendMessage({ action: "toggleWorkingMode", isActive: true })
    ↓
background.js: toggleWorkingMode(true)
    ↓
chrome.storage.local.set({ isWorkingMode: true })
    ↓
chrome.storage.onChanged event fires
    ↓
newtab.js: Detects change → setTimerEnabled(true) → Remove blur effect
```

### 45-Minute Timer Flow:

```
0:00 - Timer starts
    ↓
background.js: initializeGlobalTimer()
    → globalTimerStartTime = Date.now()
    → chrome.alarms.create({ delayInMinutes: 45 })
    ↓
newtab.js: Shows countdown "45:00" → "44:59" → ... → "00:01"
    ↓
45:00 - Alarm fires
    ↓
background.js: showWorkingModeReminder()
    → Shows notification
    → Opens new tab with toast
    → Resets: globalTimerStartTime = Date.now()
    → Creates next alarm (45 min from now)
    ↓
newtab.js: Countdown resets to "45:00"
```

---

## 💾 Storage Schema

```javascript
chrome.storage.local = {
  // Timer state
  isWorkingMode: boolean, // true = enabled, false = disabled
  globalTimerStartTime: number, // Unix timestamp in ms
  timerDuration: number, // Minutes (default: 45)

  // User data
  shortcuts: [
    {
      name: string, // "Gmail"
      url: string, // "https://gmail.com"
      icon: string, // "📧"
    },
  ],
};
```

---

## 🎨 CSS Architecture

### **newtab-styles.css**

- Dashboard layout (grid system)
- Widget styles (time, year progress, health reminder)
- Shortcuts grid
- Animated numbers (digit roll effect)
- Toast notifications
- Modal dialogs

**Key Classes:**

- `.health-reminder-widget` - Timer display widget
- `.health-reminder-widget.timer-disabled` - Disabled state (blur + opacity)
- `.timer-display` - Countdown text
- `.animated-number` - Digit roll animations
- `.shortcuts-grid-new` - Shortcuts layout

### **popup.css**

- Minimal dark black/white theme
- Toggle switch styling
- Status indicators
- Info sections

---

## 🔌 Chrome APIs Used

| API                            | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `chrome.storage.local`         | Store user preferences & timer state     |
| `chrome.alarms`                | Schedule 45-minute reminders             |
| `chrome.notifications`         | Show break reminder notifications        |
| `chrome.runtime.sendMessage()` | Communication between popup ↔ background |
| `chrome.storage.onChanged`     | Real-time updates across components      |
| `chrome.tabs`                  | Open new tabs for break reminders        |

---

## 🐛 Common Debugging

### **Timer not showing countdown:**

1. Check: `chrome.storage.local` → Is `isWorkingMode` true?
2. Check: `globalTimerStartTime` exists?
3. Check: Background service worker running? (chrome://extensions → Inspect)

### **Timer resets to enabled after restart:**

- Fixed in `background.js` → `loadSettings()` properly checks `undefined` vs `false`

### **Timer doesn't persist disabled state:**

- Check `onStartup()` isn't forcing `isWorkingMode = true`

### **Console logs:**

```javascript
// Background.js
console.log("Is working mode:", this.isWorkingMode);

// Newtab.js
console.log("Timer start time:", this.healthReminder.globalTimerStartTime);

// Popup.js
console.log(
  "Current state:",
  await chrome.storage.local.get(["isWorkingMode"]),
);
```

---

## 🚀 Development Tips

**To test changes:**

1. Make code changes
2. Go to `chrome://extensions/`
3. Click refresh icon on extension
4. Open new tab to see changes

**To debug background service:**

1. `chrome://extensions/`
2. Click "Inspect views: service worker"
3. View console logs

**To inspect storage:**

```javascript
// In any console:
chrome.storage.local.get(null, (data) => console.log(data));
```

**To manually trigger alarm:**

```javascript
// In background service worker console:
backgroundService.showWorkingModeReminder();
```

---

## 📝 Key Variables

### Background.js

```javascript
this.isWorkingMode; // Timer enabled?
this.globalTimerStartTime; // Current cycle start time
this.reminderAlarmName; // "workingModeReminder"
this.reminderInterval; // 45 minutes
```

### Newtab.js

```javascript
this.healthReminder.globalStartTime; // Synced from storage
this.animatedNumbers.reminderTimer; // Countdown animation controller
```

### Popup.js

```javascript
this.timerToggle; // Toggle switch element
this.statusIndicator; // Status dot (enabled/disabled)
```

---

## 🔐 Permissions Explained

```json
"permissions": [
  "storage",       // Save timer state & shortcuts
  "notifications", // Show break reminders
  "alarms",        // Schedule 45-min timers
  "activeTab"      // Open new tabs for breaks
]
```

---

**Need help?** Check the code comments or open an issue on GitHub!

**Creator:** rohitdeshmukh27
