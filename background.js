// Background service worker for productivity extension
// Optimized for performance with minimal resource usage

class BackgroundService {
  constructor() {
    this.reminderAlarmName = "workingModeReminder";
    this.isWorkingMode = false;
    this.reminderInterval = 45; // Set to 45 minutes as requested
    this.globalTimerStartTime = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSettings();
  }

  setupEventListeners() {
    // Handle messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep the message channel open for async responses
    });

    // Handle alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    // Handle extension startup
    chrome.runtime.onStartup.addListener(() => {
      this.onStartup();
    });

    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      this.onInstalled(details);
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case "toggleWorkingMode":
          await this.toggleWorkingMode(message.isActive);
          sendResponse({ success: true });
          break;

        case "setupReminders":
          await this.setupWorkingModeReminders();
          sendResponse({ success: true });
          break;

        case "clearReminders":
          await this.clearWorkingModeReminders();
          sendResponse({ success: true });
          break;

        case "getGlobalTimerState":
          const timerState = await this.getGlobalTimerState();
          sendResponse(timerState);
          break;

        default:
          sendResponse({ error: "Unknown action" });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }

  async toggleWorkingMode(isActive) {
    this.isWorkingMode = isActive;
    await chrome.storage.local.set({ isWorkingMode: isActive });

    if (isActive) {
      await this.setupWorkingModeReminders();
      await this.initializeGlobalTimer();
    } else {
      await this.clearWorkingModeReminders();
      await this.clearGlobalTimer();
    }
  }

  async initializeGlobalTimer() {
    // Only create a new timer if one doesn't exist
    if (!this.globalTimerStartTime) {
      this.globalTimerStartTime = Date.now();
      await chrome.storage.local.set({
        globalTimerStartTime: this.globalTimerStartTime,
        timerDuration: 45, // 45 minutes
      });
    }
  }

  async clearGlobalTimer() {
    this.globalTimerStartTime = null;
    await chrome.storage.local.remove(["globalTimerStartTime"]);
  }

  async getGlobalTimerState() {
    // Ensure we have the latest state from storage
    const result = await chrome.storage.local.get([
      "isWorkingMode",
      "globalTimerStartTime",
      "timerDuration",
    ]);

    this.isWorkingMode = result.isWorkingMode || false;
    this.globalTimerStartTime = result.globalTimerStartTime || null;

    return {
      isActive: this.isWorkingMode,
      startTime: this.globalTimerStartTime,
      timerDuration: result.timerDuration || 45,
      currentTime: Date.now(),
    };
  }

  async setupWorkingModeReminders() {
    // Clear any existing alarms first
    await chrome.alarms.clear(this.reminderAlarmName);

    // Create explicit alarm for 45 minutes from now
    // We do NOT use periodInMinutes to avoid drift. We manually reschedule in the alarm handler.
    await chrome.alarms.create(this.reminderAlarmName, {
      delayInMinutes: 45,
    });
  }

  async clearWorkingModeReminders() {
    await chrome.alarms.clear(this.reminderAlarmName);
  }

  async handleAlarm(alarm) {
    if (alarm.name === this.reminderAlarmName) {
      await this.showWorkingModeReminder();
    }
  }

  async showWorkingModeReminder() {
    // Check if working mode is still active
    const result = await chrome.storage.local.get(["isWorkingMode"]);
    if (!result.isWorkingMode) {
      await this.clearWorkingModeReminders();
      return;
    }

    // STRICT SYNC: Reset the timer immediately to now
    this.globalTimerStartTime = Date.now();

    // Save to storage (triggers UI update in newtab.js via onChanged event)
    await chrome.storage.local.set({
      globalTimerStartTime: this.globalTimerStartTime,
    });

    // Schedule NEXT alarm explicitly for 45 minutes from NOW
    // This ensures pending alarms from sleep mode don't stack up or fire weirdly
    await chrome.alarms.clear(this.reminderAlarmName);
    await chrome.alarms.create(this.reminderAlarmName, {
      delayInMinutes: 45,
    });

    // Create gentle notification
    const notificationId = `reminder-${Date.now()}`;

    chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "⏰ Time to Move!",
      message:
        "You've been sitting for 45 minutes. Take a moment to stretch and move around.",
      priority: 1,
      requireInteraction: false,
    });

    // Smart Tab Handling:
    // 1. Send toast to ANY tab that will accept it (newtab pages)
    // 2. Only open a NEW tab if we didn't find any existing extension tabs

    const extensionNewTabUrl = chrome.runtime.getURL("newtab.html");
    const tabs = await chrome.tabs.query({});
    let extensionTabFound = false;

    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, { action: "showToast" }).catch(() => {});

      // Check if this is one of our newtab pages
      if (
        tab.url &&
        (tab.url === extensionNewTabUrl ||
          tab.url.startsWith(extensionNewTabUrl))
      ) {
        extensionTabFound = true;
      }
    }

    // Only open a new tab if we didn't find one
    if (!extensionTabFound) {
      await chrome.tabs.create({
        url: extensionNewTabUrl + "?showToast=true",
        active: true,
      });
    }

    // Auto-clear notification after 10 seconds
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 10000);
  }

  async onStartup() {
    // Load user's saved preferences without forcing timer on
    await this.loadSettings();
  }

  async onInstalled(details) {
    // Only set defaults on fresh install
    if (details.reason === "install") {
      // Set initial defaults for new installation
      await chrome.storage.local.set({
        isWorkingMode: true,
        shortcuts: [],
        timerDuration: 45, // 45 minutes
      });

      await chrome.storage.local.remove(["globalTimerStartTime"]);
      await this.initializeGlobalTimer();
      await this.setupWorkingModeReminders();

      chrome.notifications.create("welcome", {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "🎉 Welcome to StandUp.exe!",
        message:
          "Your 45-minute health reminder timer is now active. You can disable it anytime from the extension popup.",
        priority: 1,
      });
    } else if (details.reason === "update") {
      // On update, respect existing user settings - just load them
      await this.loadSettings();
    }
  }

  async loadSettings() {
    const result = await chrome.storage.local.get([
      "isWorkingMode",
      "globalTimerStartTime",
    ]);

    // Properly handle the state: undefined means first run (default to true)
    // false means user explicitly disabled it (respect that)
    // true means enabled
    if (result.isWorkingMode === undefined) {
      // First run - default to enabled
      this.isWorkingMode = true;
      await chrome.storage.local.set({ isWorkingMode: true });
    } else {
      // Respect saved user preference
      this.isWorkingMode = result.isWorkingMode;
    }

    this.globalTimerStartTime = result.globalTimerStartTime || null;
    this.reminderInterval = 45; // Always 45 minutes

    // If working mode is active, ensure alarms and timer are running
    if (this.isWorkingMode) {
      const alarm = await chrome.alarms.get(this.reminderAlarmName);
      if (!alarm) {
        await this.setupWorkingModeReminders();
      }

      if (!this.globalTimerStartTime) {
        await this.initializeGlobalTimer();
      }
    }
  }

  // Performance optimization: Clean up unused alarms
  async cleanupAlarms() {
    const alarms = await chrome.alarms.getAll();
    const now = Date.now();

    // Remove alarms that might be stuck or orphaned
    for (const alarm of alarms) {
      if (
        alarm.name.startsWith("old_") ||
        (alarm.scheduledTime && alarm.scheduledTime < now - 86400000)
      ) {
        // 24 hours old
        await chrome.alarms.clear(alarm.name);
      }
    }
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();

// Periodic cleanup to maintain performance
chrome.alarms.create("cleanup", { periodInMinutes: 1440 }); // Daily cleanup
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanup") {
    backgroundService.cleanupAlarms();
  }
});
