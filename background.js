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
      console.log("Background service received message:", message);
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
          console.log("Sending timer state:", timerState);
          sendResponse(timerState);
          break;

        default:
          console.log("Unknown message action:", message.action);
          sendResponse({ error: "Unknown action" });
      }
    } catch (error) {
      console.error("Error handling message:", error);
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
      console.log(
        "Global timer initialized at:",
        new Date(this.globalTimerStartTime)
      );
    } else {
      console.log(
        "Global timer already exists:",
        new Date(this.globalTimerStartTime)
      );
    }
  }

  async clearGlobalTimer() {
    this.globalTimerStartTime = null;
    await chrome.storage.local.remove(["globalTimerStartTime"]);
    console.log("Global timer cleared");
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

    console.log("Storage result:", result);
    console.log("Background timer state:", {
      isActive: this.isWorkingMode,
      startTime: this.globalTimerStartTime,
      timerDuration: result.timerDuration || 45,
      currentTime: Date.now(),
    });

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

    // Create repeating alarm every hour (60 minutes)
    await chrome.alarms.create(this.reminderAlarmName, {
      delayInMinutes: 45,
      periodInMinutes: 45,
    });

    console.log("Working mode reminders set up for every 45 minutes");
  }

  async clearWorkingModeReminders() {
    await chrome.alarms.clear(this.reminderAlarmName);
    console.log("Working mode reminders cleared");
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

    console.log("Gentle reminder notification shown");

    // Send message to all tabs to show toast notification
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { action: "showToast" }).catch(() => {
          // Tab might not have content script, ignore error
        });
      });
    });

    // Also open a new tab with the toast if no tabs are open
    const newTabUrl = chrome.runtime.getURL("newtab.html") + "?showToast=true";
    await chrome.tabs.create({ url: newTabUrl, active: true });

    // Auto-clear notification after 10 seconds
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 10000);

    // Timer automatically continues due to periodInMinutes in alarm
    console.log("Timer will auto-restart in 45 minutes");
  }

  async onStartup() {
    console.log("Extension started");
    await this.loadSettings();

    // Ensure timer is always active
    if (!this.isWorkingMode) {
      await chrome.storage.local.set({ isWorkingMode: true });
      this.isWorkingMode = true;
      await this.initializeGlobalTimer();
      await this.setupWorkingModeReminders();
    }
  }

  async onInstalled(details) {
    console.log("Extension installed/updated:", details.reason);

    // Auto-enable working mode and start timer
    await chrome.storage.local.set({
      isWorkingMode: true,
      shortcuts: [],
      timerDuration: 45, // 45 minutes
    });

    // Initialize timer on fresh install
    if (details.reason === "install") {
      await chrome.storage.local.remove(["globalTimerStartTime"]);
      await this.initializeGlobalTimer();
      await this.setupWorkingModeReminders();

      chrome.notifications.create("welcome", {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "🎉 Welcome to Productivity Assistant!",
        message:
          "Your 45-minute health reminder timer is now active. You'll get gentle reminders to move!",
        priority: 1,
      });
    } else if (details.reason === "update") {
      // Ensure timer is running after update
      await this.initializeGlobalTimer();
      await this.setupWorkingModeReminders();
    }
  }

  async loadSettings() {
    const result = await chrome.storage.local.get([
      "isWorkingMode",
      "globalTimerStartTime",
    ]);
    this.isWorkingMode = result.isWorkingMode || false;
    this.globalTimerStartTime = result.globalTimerStartTime || null;
    this.reminderInterval = 45; // Always 45 minutes (as requested)

    // If working mode was active, restart reminders and timer
    if (this.isWorkingMode) {
      await this.setupWorkingModeReminders();
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
console.log("Initializing background service...");
const backgroundService = new BackgroundService();
console.log("Background service initialized:", backgroundService);

// Periodic cleanup to maintain performance
chrome.alarms.create("cleanup", { periodInMinutes: 1440 }); // Daily cleanup
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanup") {
    backgroundService.cleanupAlarms();
  }
});
