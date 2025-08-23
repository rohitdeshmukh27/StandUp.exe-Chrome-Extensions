// Background service worker for productivity extension
// Health reminder timer synchronized across all tabs

class BackgroundService {
  constructor() {
    this.healthTimerAlarm = "healthReminderTimer";
    this.healthTimerState = {
      isActive: false,
      startTime: null,
      isOnBreak: false,
      breakStartTime: null,
      sittingDuration: 45 * 60 * 1000, // 45 minutes
      breakDuration: 2 * 60 * 1000,    // 2 minutes
      restartDelay: 5 * 60 * 1000      // 5 minutes
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadHealthTimerState();
    this.startHealthTimerSync();
  }

  setupEventListeners() {
    // Handle messages from new tab pages
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
    switch (message.action) {
      case "getHealthTimerState":
        // Send current timer state to requesting tab
        sendResponse(await this.getHealthTimerState());
        break;

      case "startBreak":
        await this.startBreak();
        // Notify all tabs about break start
        this.broadcastToAllTabs({ action: "breakStarted" });
        break;

      case "skipBreak":
        await this.skipBreak();
        // Notify all tabs about break skip
        this.broadcastToAllTabs({ action: "breakSkipped" });
        break;

      case "requestSync":
        // Send current state to requesting tab
        sendResponse(await this.getHealthTimerState());
        break;
        await this.clearWorkingModeReminders();
        break;

      default:
        console.log("Unknown message action:", message.action);
    }
  }

  async toggleWorkingMode(isActive) {
    this.isWorkingMode = isActive;
    await chrome.storage.local.set({ isWorkingMode: isActive });

    if (isActive) {
      await this.setupWorkingModeReminders();
    } else {
      await this.clearWorkingModeReminders();
    }
  }

  async setupWorkingModeReminders() {
    // Clear any existing alarms first
    await chrome.alarms.clear(this.reminderAlarmName);

    // Get reminder interval from storage
    const result = await chrome.storage.local.get(["reminderInterval"]);
    this.reminderInterval = result.reminderInterval || 60;

    // Create repeating alarm for every hour (or custom interval)
    await chrome.alarms.create(this.reminderAlarmName, {
      delayInMinutes: this.reminderInterval,
      periodInMinutes: this.reminderInterval,
    });

    console.log(
      `Working mode reminders set up for every ${this.reminderInterval} minutes`
    );
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

    // Create notification
    const notificationId = `reminder-${Date.now()}`;

    await chrome.notifications.create(notificationId, {
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "💧 Time for a Break!",
      message:
        "Drink some water and take a short walk. Your productivity matters!",
      buttons: [{ title: "Done ✅" }, { title: "Remind in 10 min ⏰" }],
      requireInteraction: true,
      priority: 2,
    });

    // Handle notification clicks
    chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
      if (notifId === notificationId) {
        if (buttonIndex === 0) {
          // User clicked "Done"
          chrome.notifications.clear(notificationId);
        } else if (buttonIndex === 1) {
          // User clicked "Remind in 10 min"
          chrome.notifications.clear(notificationId);
          chrome.alarms.create("snoozeReminder", { delayInMinutes: 10 });
        }
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
      reminderInterval: 60,
      shortcuts: [],
    });

    // Show welcome notification
    if (details.reason === "install") {
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
      "reminderInterval",
    ]);
    this.isWorkingMode = result.isWorkingMode || false;
    this.reminderInterval = result.reminderInterval || 60;

    // If working mode was active, restart reminders
    if (this.isWorkingMode) {
      await this.setupWorkingModeReminders();
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
