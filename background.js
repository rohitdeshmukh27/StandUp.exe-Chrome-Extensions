// Background service worker for productivity extension
// Optimized for performance with minimal resource usage

class BackgroundService {
  constructor() {
    this.reminderAlarmName = "workingModeReminder";
    this.isWorkingMode = false;
    this.reminderInterval = 60; // Fixed to 60 minutes (1 hour)
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
    ]);

    this.isWorkingMode = result.isWorkingMode || false;
    this.globalTimerStartTime = result.globalTimerStartTime || null;

    console.log("Storage result:", result);
    console.log("Background timer state:", {
      isActive: this.isWorkingMode,
      startTime: this.globalTimerStartTime,
      currentTime: Date.now(),
    });

    return {
      isActive: this.isWorkingMode,
      startTime: this.globalTimerStartTime,
      currentTime: Date.now(),
    };
  }

  async setupWorkingModeReminders() {
    // Clear any existing alarms first
    await chrome.alarms.clear(this.reminderAlarmName);

    // Create repeating alarm every hour (60 minutes)
    await chrome.alarms.create(this.reminderAlarmName, {
      delayInMinutes: 60,
      periodInMinutes: 60,
    });

    console.log("Working mode reminders set up for every 60 minutes");
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

    // Create notification with sound
    const notificationId = `reminder-${Date.now()}`;

    await chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "🏃‍♂️ HEALTH REMINDER",
      message: "Time for a health break! Stand up, stretch, and move around.",
      buttons: [{ title: "Got it! ✅" }],
      requireInteraction: true,
      priority: 2,
    });

    // Handle notification clicks
    chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
      if (notifId === notificationId) {
        chrome.notifications.clear(notificationId);
      }
    });

    // Auto-clear notification after 30 seconds if no interaction
    setTimeout(() => {
      chrome.notifications.clear(notificationId);
    }, 30000);

    // Send message to popup if it's open
    try {
      chrome.runtime.sendMessage({ action: "reminderTriggered" });
    } catch (error) {
      // Popup might not be open, that's fine
    }
  }

  async onStartup() {
    console.log("Extension started");
    await this.loadSettings();
  }

  async onInstalled(details) {
    console.log("Extension installed/updated:", details.reason);

    // Set default settings
    await chrome.storage.local.set({
      isWorkingMode: false,
      shortcuts: [],
    });

    // Clear any old timer data on fresh install
    if (details.reason === "install") {
      await chrome.storage.local.remove(["globalTimerStartTime"]);

      chrome.notifications.create("welcome", {
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "🎉 Welcome to Productivity Assistant!",
        message:
          "Click the extension icon to start organizing your time and shortcuts.",
        priority: 1,
      });
    }
  }

  async loadSettings() {
    const result = await chrome.storage.local.get([
      "isWorkingMode",
      "globalTimerStartTime",
    ]);
    this.isWorkingMode = result.isWorkingMode || false;
    this.globalTimerStartTime = result.globalTimerStartTime || null;
    this.reminderInterval = 60; // Always 60 minutes (1 hour)

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
