// New Tab Dashboard Script - Health-Focused Productivity Dashboard

// Animated Number Counter Class
class AnimatedNumber {
  constructor(element) {
    this.element = element;
    this.currentValue = "";
    this.previousDigits = [];
    this.digitElements = [];
  }

  createDigitStructure(value) {
    const valueStr = value.toString();
    this.element.innerHTML = "";
    this.digitElements = [];

    for (let i = 0; i < valueStr.length; i++) {
      const char = valueStr[i];

      if (/\d/.test(char)) {
        // Create animated digit
        const digitContainer = document.createElement("span");
        digitContainer.className = "number-digit";

        const digitColumn = document.createElement("div");
        digitColumn.className = "digit-column";

        // Create all digits 0-9 for rolling effect
        for (let digit = 0; digit <= 9; digit++) {
          const digitItem = document.createElement("span");
          digitItem.className = "digit-item";
          digitItem.textContent = digit;
          digitColumn.appendChild(digitItem);
        }

        digitContainer.appendChild(digitColumn);
        this.element.appendChild(digitContainer);
        this.digitElements.push({
          container: digitContainer,
          column: digitColumn,
          currentDigit: parseInt(char),
        });
      } else {
        // Create static character (colon, space, etc.)
        const staticChar = document.createElement("span");
        staticChar.className = "static-char";
        staticChar.textContent = char;
        this.element.appendChild(staticChar);
        this.digitElements.push(null);
      }
    }
  }

  updateValue(newValue) {
    const newValueStr = newValue.toString();

    // If structure needs to be recreated (different length)
    if (this.currentValue.length !== newValueStr.length) {
      this.createDigitStructure(newValueStr);
      this.currentValue = newValueStr;
      return;
    }

    // Animate individual digit changes
    for (let i = 0; i < newValueStr.length; i++) {
      const char = newValueStr[i];
      const digitElement = this.digitElements[i];

      if (digitElement && /\d/.test(char)) {
        const newDigit = parseInt(char);
        const oldDigit = digitElement.currentDigit;

        if (newDigit !== oldDigit) {
          this.animateDigit(digitElement, oldDigit, newDigit);
          digitElement.currentDigit = newDigit;
        }
      }
    }

    this.currentValue = newValueStr;
  }

  animateDigit(digitElement, oldDigit, newDigit) {
    const { column } = digitElement;

    // Determine if we should use fast scroll (9->0 transition)
    const shouldFastScroll = oldDigit === 9 && newDigit === 0;

    if (shouldFastScroll) {
      // Fast scroll through all digits for 9->0 transition
      column.classList.add("fast-scroll");

      // First scroll to 9 (if not already there)
      const transform9 = `translateY(-${9 * 1.2}em)`;
      column.style.transform = transform9;

      // Then quickly scroll to 0 via bottom
      setTimeout(() => {
        const transformBottom = `translateY(-${10 * 1.2}em)`;
        column.style.transform = transformBottom;

        setTimeout(() => {
          // Jump to top 0 without animation
          column.style.transition = "none";
          column.style.transform = "translateY(0)";

          // Re-enable animation
          setTimeout(() => {
            column.style.transition = "";
            column.classList.remove("fast-scroll");
          }, 50);
        }, 300);
      }, 100);
    } else {
      // Normal scroll animation
      column.classList.remove("fast-scroll");
      const transform = `translateY(-${newDigit * 1.2}em)`;
      column.style.transform = transform;
    }
  }

  setValue(value) {
    const valueStr = value.toString();
    if (this.currentValue === "") {
      // Initial setup
      this.createDigitStructure(valueStr);
      this.currentValue = valueStr;

      // Set initial positions without animation
      this.digitElements.forEach((digitElement, i) => {
        if (digitElement && /\d/.test(valueStr[i])) {
          const digit = parseInt(valueStr[i]);
          digitElement.column.style.transition = "none";
          digitElement.column.style.transform = `translateY(-${digit * 1.2}em)`;
          digitElement.currentDigit = digit;

          setTimeout(() => {
            digitElement.column.style.transition = "";
          }, 50);
        }
      });
    } else {
      this.updateValue(valueStr);
    }
  }
}

class ProductivityDashboard {
  constructor() {
    this.shortcuts = [];
    this.healthReminder = {
      // Will sync with global timer from background service
      globalStartTime: null,
      syncInterval: null,
      resyncInterval: null,
      retryAttempted: false,
      notificationTimer: null,
    };
    this.timeUpdateInterval = null;

    // Animated number instances
    this.animatedNumbers = {
      time: null,
      reminderTimer: null,
      daysRemaining: null,
      yearPercentage: null,
      breakCountdown: null,
    };
    this.quotes = [];

    this.init();
  }

  async init() {
    this.setupGreeting();
    this.setupEventListeners();
    this.initializeAnimatedNumbers();
    this.startTimeUpdate();
    this.updateDaysRemaining();
    this.loadShortcuts();
    this.initializeSimpleHealthReminder();
    this.checkBreakTrigger();
    await this.loadQuotes();

    // Clean up when page unloads
    window.addEventListener("beforeunload", () => {
      this.cleanup();
    });

    // Add debug info for shortcuts (only in console, no notifications)
    console.log("Dashboard initialized. Current shortcuts:", this.shortcuts);
  }

  cleanup() {
    if (this.healthReminder.syncInterval) {
      clearInterval(this.healthReminder.syncInterval);
      this.healthReminder.syncInterval = null;
    }
    if (this.healthReminder.resyncInterval) {
      clearInterval(this.healthReminder.resyncInterval);
      this.healthReminder.resyncInterval = null;
    }
    if (this.healthReminder.notificationTimer) {
      clearInterval(this.healthReminder.notificationTimer);
      this.healthReminder.notificationTimer = null;
    }
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  initializeAnimatedNumbers() {
    // Initialize animated numbers for all numeric displays
    const timeElement = document.getElementById("large-time");
    const reminderElement = document.getElementById("reminder-timer");
    const daysElement = document.getElementById("days-remaining");
    const percentageElement = document.getElementById("percentage-year");
    const breakCountdownElement = document.getElementById("break-countdown");

    if (timeElement) {
      timeElement.classList.add("animated-number");
      this.animatedNumbers.time = new AnimatedNumber(timeElement);
    }

    if (reminderElement) {
      reminderElement.classList.add("animated-number");
      this.animatedNumbers.reminderTimer = new AnimatedNumber(reminderElement);
    }

    if (daysElement) {
      daysElement.classList.add("animated-number");
      this.animatedNumbers.daysRemaining = new AnimatedNumber(daysElement);
    }

    if (percentageElement) {
      percentageElement.classList.add("animated-number");
      this.animatedNumbers.yearPercentage = new AnimatedNumber(
        percentageElement
      );
    }

    if (breakCountdownElement) {
      breakCountdownElement.classList.add("animated-number");
      this.animatedNumbers.breakCountdown = new AnimatedNumber(
        breakCountdownElement
      );
    }
  }

  setupGreeting() {
    const hour = new Date().getHours();
    const greetingEl = document.getElementById("greeting-text");
    const motivationEl = document.getElementById("motivation-text");

    let greeting, motivation;

    if (hour < 12) {
      greeting = "Good morning";
      motivation = "Start your day with focus and determination";
    } else if (hour < 17) {
      greeting = "Good afternoon";
      motivation = "Maintain momentum and stay productive";
    } else {
      greeting = "Good evening";
      motivation = "Finish strong and prepare for tomorrow";
    }

    greetingEl.textContent = greeting;
    motivationEl.textContent = motivation;
  }

  // Enhanced time update with animated numbers
  startTimeUpdate() {
    const updateTime = () => {
      const now = new Date();

      const timeStr = now.toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const dateStr = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Update time with animation
      if (this.animatedNumbers.time) {
        this.animatedNumbers.time.setValue(timeStr);
      } else {
        document.getElementById("large-time").textContent = timeStr;
      }

      document.getElementById("large-date").textContent = dateStr;

      // Update timezone info
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      document.getElementById("timezone").textContent = `${timezone} Time`;
    };

    updateTime();
    this.timeUpdateInterval = setInterval(updateTime, 1000);
  }

  // Global Health Reminder System - Synchronized across all tabs
  // =============================================================================
  // SIMPLIFIED HEALTH REMINDER SYSTEM
  // =============================================================================

  async initializeSimpleHealthReminder() {
    // Try to get timer state directly from storage first
    try {
      const result = await chrome.storage.local.get([
        "isWorkingMode",
        "globalTimerStartTime",
      ]);
      console.log("Direct storage result:", result);

      if (result.isWorkingMode && result.globalTimerStartTime) {
        this.healthReminder.globalStartTime = result.globalTimerStartTime;
        console.log(
          "Using existing timer from storage, start time:",
          new Date(result.globalTimerStartTime)
        );

        // Start the sync immediately
        this.startGlobalTimerSync();

        // Update display immediately
        this.updateDisplayFromGlobalTimer();
      } else {
        // No timer active, show default state
        this.setTimerDisplay("--:--", "#ffffff");
        this.setHealthTip(
          "Click here to start health reminders (45-minute intervals)"
        );
        console.log("No active timer found in storage");
      }
    } catch (error) {
      console.error("Failed to access storage:", error);
      this.setTimerDisplay("--:--", "#ffffff");
      this.setHealthTip("Storage access error");
    }

    console.log("Simple Health Reminder System initialized");
  }

  async syncWithGlobalTimer() {
    try {
      console.log("Sending message to background service...");
      const response = await chrome.runtime.sendMessage({
        action: "getGlobalTimerState",
      });

      console.log("Global timer sync response:", response);

      if (response && response.isActive && response.startTime) {
        this.healthReminder.globalStartTime = response.startTime;
        this.updateDisplayFromGlobalTimer();
        console.log("Synced with global timer successfully");
      } else if (response && !response.isActive) {
        // Working mode is not active
        this.setTimerDisplay("--:--", "#ffffff");
        this.setHealthTip(
          "Enable Working Mode in the extension popup to start health reminders"
        );
        console.log("Working mode is not active");
      } else if (response && response.error) {
        // Error response from background
        console.error("Background service error:", response.error);
        this.setTimerDisplay("--:--", "#ffffff");
        this.setHealthTip("Error: " + response.error);
      } else {
        // No valid response
        this.setTimerDisplay("45:00", "#ffffff");
        this.setHealthTip(
          "Click the extension icon to enable health reminders"
        );
        console.log("No valid timer response");
      }
    } catch (error) {
      console.error("Failed to sync with global timer:", error);
      // Show a fallback state instead of retrying indefinitely
      this.setTimerDisplay("--:--", "#ffffff");
      this.setHealthTip("Health reminder unavailable - check extension popup");

      // Only retry once after 2 seconds, then give up
      if (!this.healthReminder.retryAttempted) {
        this.healthReminder.retryAttempted = true;
        setTimeout(() => {
          console.log("Retrying global timer sync...");
          this.syncWithGlobalTimer();
        }, 2000);
      }
    }
  }

  startGlobalTimerSync() {
    // Update display every second
    this.healthReminder.syncInterval = setInterval(() => {
      this.updateDisplayFromGlobalTimer();
    }, 1000);

    // Re-sync with storage every 30 seconds to prevent drift
    this.healthReminder.resyncInterval = setInterval(async () => {
      try {
        const result = await chrome.storage.local.get([
          "isWorkingMode",
          "globalTimerStartTime",
        ]);
        if (result.isWorkingMode && result.globalTimerStartTime) {
          // Only update if the stored time is different (another tab started/stopped timer)
          if (
            this.healthReminder.globalStartTime !== result.globalTimerStartTime
          ) {
            console.log("Timer state changed in another tab, syncing...");
            this.healthReminder.globalStartTime = result.globalTimerStartTime;
          }
        } else if (result.isWorkingMode === false) {
          // Timer was stopped in another tab
          console.log("Timer stopped in another tab");
          this.healthReminder.globalStartTime = null;
          this.setTimerDisplay("--:--", "#ffffff");
          this.setHealthTip(
            "Click here to start health reminders (45-minute intervals)"
          );
        }
      } catch (error) {
        console.error("Re-sync error:", error);
      }
    }, 30000);
  }

  async updateDisplayFromGlobalTimer() {
    if (!this.healthReminder.globalStartTime) {
      // If no timer is active, show a default state and offer to start one
      this.setTimerDisplay("--:--", "#ffffff");
      this.setHealthTip(
        "Click here to start health reminders (45-minute intervals)"
      );
      console.log("No global timer start time available");
      return;
    }

    // Read timerDuration from storage to know if it's 45-min or 5-min timer
    const storageResult = await chrome.storage.local.get(["timerDuration"]);
    const timerDurationMinutes = storageResult.timerDuration || 45;
    const timerDurationMs = timerDurationMinutes * 60 * 1000;

    const now = Date.now();
    const startTime = this.healthReminder.globalStartTime;
    const elapsed = now - startTime;

    console.log("Timer calculation:", {
      now: new Date(now),
      startTime: new Date(startTime),
      elapsed: elapsed,
      elapsedMinutes: Math.floor(elapsed / 60000),
      timerDuration: timerDurationMinutes,
    });

    // Handle case where elapsed time is negative (clock issues)
    if (elapsed < 0) {
      console.warn("Timer elapsed time is negative, resetting");
      this.setTimerDisplay(`${timerDurationMinutes}:00`, "#ffffff");
      return;
    }

    // Calculate how many complete cycles have passed
    const completedCycles = Math.floor(elapsed / timerDurationMs);

    // Calculate time into current cycle
    const timeIntoCurrentCycle = elapsed - completedCycles * timerDurationMs;

    // Calculate time remaining until next cycle
    const remaining = timerDurationMs - timeIntoCurrentCycle;

    console.log("Detailed calculation:", {
      completedCycles,
      timeIntoCurrentCycle,
      timeIntoCurrentCycleMinutes: Math.floor(timeIntoCurrentCycle / 60000),
      remaining,
      remainingMinutes: Math.floor(remaining / 60000),
    });

    // Ensure remaining time is valid
    if (remaining <= 0 || remaining > timerDurationMs) {
      console.warn("Invalid remaining time calculated:", remaining);
      this.setTimerDisplay(`${timerDurationMinutes}:00`, "#ffffff");
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    // Update display
    this.setTimerDisplay(timeString, "#ffffff");
    this.setHealthTip(
      "Stay active! Regular movement boosts productivity and health"
    );

    console.log("Display updated:", timeString);
  }

  // Check if break needs to be shown (from URL params)
  checkBreakTrigger() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("showBreak") === "true") {
      this.showBreakModal();
      // Remove the param from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  showBreakModal() {
    const modal = document.getElementById("break-reminder-modal");
    if (modal) {
      modal.classList.remove("hidden");

      // Play alert sound
      try {
        const audio = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiN0fPOeSsFJHHDwcgELAAAVDVmKAoEAAAAcwBGVAAOAOAGcADwBQAA"
        );
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (e) {
        console.log("Could not play notification sound");
      }

      // Initialize break countdown (default 2:00)
      let secondsRemaining = 120;
      const countdownEl = document.getElementById("break-countdown");

      if (this.healthReminder.breakTimer) {
        clearInterval(this.healthReminder.breakTimer);
      }

      this.healthReminder.breakTimer = setInterval(() => {
        secondsRemaining--;
        const mins = Math.floor(secondsRemaining / 60);
        const secs = secondsRemaining % 60;
        const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

        if (this.animatedNumbers.breakCountdown) {
          this.animatedNumbers.breakCountdown.setValue(timeStr);
        } else if (countdownEl) {
          countdownEl.textContent = timeStr;
        }

        if (secondsRemaining <= 0) {
          clearInterval(this.healthReminder.breakTimer);
        }
      }, 1000);
    }
  }

  startBreakPhase() {
    // Already started in showBreakModal, adding visual indicators
    const modal = document.querySelector(".break-modal");
    if (modal) {
      modal.classList.add("break-active");
    }
    // Show the "I'm Back" button section
    const restActions = document.getElementById("rest-actions");
    if (restActions) {
      restActions.style.display = "flex";
    }
  }

  skipBreakPhase() {
    const modal = document.getElementById("break-reminder-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
    if (this.healthReminder.breakTimer) {
      clearInterval(this.healthReminder.breakTimer);
    }
    // Restart the timer for the next 45-minute cycle
    this.restartTimer();
  }

  async take5MinBreak() {
    const modal = document.getElementById("break-reminder-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
    if (this.healthReminder.breakTimer) {
      clearInterval(this.healthReminder.breakTimer);
    }

    try {
      // Send message to background to set 5-minute timer
      await chrome.runtime.sendMessage({ action: "set5MinTimer" });

      console.log("5-minute timer requested from background service");

      // Re-sync display after background confirms
      const result = await chrome.storage.local.get([
        "globalTimerStartTime",
        "timerDuration",
      ]);

      if (result.globalTimerStartTime) {
        this.healthReminder.globalStartTime = result.globalTimerStartTime;
        this.updateDisplayFromGlobalTimer();
      }

      this.setHealthTip(
        "Taking a quick 5-minute break! Timer will remind you again soon."
      );
    } catch (error) {
      console.error("Failed to set 5-min break timer:", error);
      this.setHealthTip("Error setting break timer. Please try again.");
    }
  }

  returnFromRest() {
    // Close the break modal and hide rest actions
    const modal = document.getElementById("break-reminder-modal");
    if (modal) {
      modal.classList.add("hidden");
      modal.querySelector(".break-modal")?.classList.remove("break-active");
    }

    const restActions = document.getElementById("rest-actions");
    if (restActions) {
      restActions.style.display = "none";
    }

    if (this.healthReminder.breakTimer) {
      clearInterval(this.healthReminder.breakTimer);
    }

    // Restart the timer for the next 45-minute cycle
    this.restartTimer();
  }

  async restartTimer() {
    try {
      // Send message to background to restart the Chrome Alarm
      await chrome.runtime.sendMessage({ action: "restartTimer" });

      console.log("Timer restart requested from background service");

      // Re-sync display after background confirms
      const result = await chrome.storage.local.get([
        "globalTimerStartTime",
        "timerDuration",
      ]);

      if (result.globalTimerStartTime) {
        this.healthReminder.globalStartTime = result.globalTimerStartTime;
        this.updateDisplayFromGlobalTimer();
      }

      // Ensure sync intervals are running
      if (!this.healthReminder.syncInterval) {
        this.startGlobalTimerSync();
      }

      this.setHealthTip("Timer restarted! Next break in 45 minutes.");
    } catch (error) {
      console.error("Failed to restart timer:", error);
      this.setHealthTip("Error restarting timer. Please try again.");
    }
  }

  // Add method to manually start timer
  async startHealthTimer() {
    const now = Date.now();

    // Round to the nearest hour boundary for cleaner sync across tabs
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0); // Set to start of current hour
    const startTime = currentHour.getTime();

    this.healthReminder.globalStartTime = startTime;

    try {
      await chrome.storage.local.set({
        isWorkingMode: true,
        globalTimerStartTime: startTime,
      });
      console.log("Health timer started manually at:", new Date(startTime));
      console.log("Timer will trigger every hour on the hour");

      // Update display immediately
      this.updateDisplayFromGlobalTimer();

      // Start sycn intervals
      this.startGlobalTimerSync();

      // Start hourly notifications
      this.scheduleHourlyNotifications();

      this.setHealthTip(
        "Health reminders active! You'll get notified every 45 minutes."
      );
    } catch (error) {
      console.error("Failed to start timer:", error);
    }
  }

  async loadQuotes() {
    try {
      const response = await fetch(chrome.runtime.getURL("quotes.json"));
      const data = await response.json();
      this.quotes = data.quotes;
      this.displayRandomQuote();
    } catch (error) {
      console.error("Failed to load quotes:", error);
      this.quotes = ["Small steps lead to big results."];
      this.displayRandomQuote();
    }
  }

  displayRandomQuote() {
    const quoteEl = document.getElementById("daily-quote-text");
    if (quoteEl && this.quotes.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.quotes.length);
      const quote = this.quotes[randomIndex];

      // Animation class refresh
      quoteEl.classList.remove("fade-in");
      void quoteEl.offsetWidth; // Trigger reflow
      quoteEl.classList.add("fade-in");

      quoteEl.textContent = `"${quote}"`;
    }
  }

  scheduleHourlyNotifications() {
    // Clear any existing notification timer
    if (this.healthReminder.notificationTimer) {
      clearInterval(this.healthReminder.notificationTimer);
    }

    // Set up hourly notifications
    this.healthReminder.notificationTimer = setInterval(() => {
      this.showHealthNotification();
    }, 45 * 60 * 1000); // 45 minutes

    console.log("Hourly notifications scheduled");
  }

  showHealthNotification() {
    // Browser notification
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        const notification = new Notification("🏃‍♂️ HEALTH REMINDER", {
          body: "Time for a health break! Stand up, stretch, and move around.",
          icon: "icons/icon48.png",
          tag: "health-reminder",
          requireInteraction: false,
        });

        // Play a simple beep sound
        try {
          const audio = new Audio(
            "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiN0fPOeSsFJHHDwcgELAAAVDVmKAoEAAAAcwBGVAAOAOAGcADwBQAA"
          );
          audio.volume = 0.5;
          audio.play().catch(() => {});
        } catch (e) {
          console.log("Could not play notification sound");
        }

        setTimeout(() => notification.close(), 10000);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }

  setTimerDisplay(timeString, color) {
    const timerElement = document.getElementById("reminder-timer");
    if (timerElement) {
      if (this.animatedNumbers.reminderTimer) {
        this.animatedNumbers.reminderTimer.setValue(timeString);
      } else {
        timerElement.textContent = timeString;
      }
      timerElement.style.color = color;
    }
  }

  setHealthTip(tipText) {
    const tipElement = document.getElementById("health-tip-text");
    if (tipElement) {
      tipElement.textContent = tipText;
    }
  }

  // =============================================================================
  // END OF HEALTH REMINDER SECTION
  // =============================================================================

  updateDaysRemaining() {
    const now = new Date();
    const endOfYear = new Date(2026, 11, 31, 23, 59, 59, 999); // December 31, 2026
    const startOfYear = new Date(2026, 0, 1); // January 1, 2026

    const totalDays = Math.ceil(
      (endOfYear - startOfYear) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.ceil((endOfYear - now) / (1000 * 60 * 60 * 24));
    const daysPassed = totalDays - daysRemaining;
    const percentageCompleted = Math.round((daysPassed / totalDays) * 100);

    // Update with animation
    if (this.animatedNumbers.daysRemaining) {
      this.animatedNumbers.daysRemaining.setValue(daysRemaining);
    } else {
      document.getElementById("days-remaining").textContent = daysRemaining;
    }

    if (this.animatedNumbers.yearPercentage) {
      this.animatedNumbers.yearPercentage.setValue(
        `${percentageCompleted}% completed`
      );
    } else {
      document.getElementById(
        "percentage-year"
      ).textContent = `${percentageCompleted}% completed`;
    }
  }

  setupEventListeners() {
    // Shortcut management
    document
      .getElementById("edit-shortcuts")
      .addEventListener("click", () => this.showAddShortcutModal());
    document
      .getElementById("export-shortcuts")
      .addEventListener("click", () => this.exportShortcuts());
    document
      .getElementById("import-shortcuts")
      .addEventListener("click", () => this.importShortcuts());
    document
      .getElementById("save-shortcut-large")
      .addEventListener("click", () => this.saveNewShortcut());
    document
      .getElementById("cancel-shortcut-large")
      .addEventListener("click", () => this.hideAddShortcutModal());

    // Health reminder click to start timer
    const healthTip = document.getElementById("health-tip-text");
    if (healthTip) {
      healthTip.addEventListener("click", () => {
        if (!this.healthReminder.globalStartTime) {
          this.startHealthTimer();
        }
      });
      healthTip.style.cursor = "pointer";
    }

    // New quote refresh button
    const refreshQuoteBtn = document.getElementById("refresh-quote-btn");
    if (refreshQuoteBtn) {
      refreshQuoteBtn.addEventListener("click", () =>
        this.displayRandomQuote()
      );
    }

    // Health reminder modal controls
    document
      .getElementById("start-break")
      .addEventListener("click", () => this.startBreakPhase());
    document
      .getElementById("skip-break")
      .addEventListener("click", () => this.skipBreakPhase());

    // 5-minute break option
    const take5MinBtn = document.getElementById("take-5min-break");
    if (take5MinBtn) {
      take5MinBtn.addEventListener("click", () => this.take5MinBreak());
    }

    // "I'm Back" button for rest state
    document
      .getElementById("im-back-btn")
      .addEventListener("click", () => this.returnFromRest());

    // Add keyboard shortcuts for quick access
    document.addEventListener("keydown", (e) => {
      // Ctrl+Shift+S to add shortcut
      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        this.showAddShortcutModal();
      }
      // Escape to close modal
      if (e.key === "Escape") {
        this.hideAddShortcutModal();
      }
      // Ctrl+Shift+E to export shortcuts
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        this.exportShortcuts();
      }
      // Ctrl+Shift+I to import shortcuts
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        this.importShortcuts();
      }
      // Ctrl+Shift+D to debug storage
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        this.debugStorageStatus();
      }
      // Ctrl+Shift+F to force save
      if (e.ctrlKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        this.forceSave();
      }
    });
  }

  exportShortcuts() {
    const data = {
      shortcuts: this.shortcuts,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productivity-shortcuts-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showNotification("Shortcuts exported successfully!", "success");
  }

  importShortcuts() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.shortcuts && Array.isArray(data.shortcuts)) {
          const importedCount = data.shortcuts.length;

          // Ask user if they want to replace or merge
          const replace = confirm(
            `Import ${importedCount} shortcuts?\n\nClick OK to REPLACE current shortcuts\nClick Cancel to MERGE with existing shortcuts`
          );

          if (replace) {
            this.shortcuts = data.shortcuts;
          } else {
            // Merge shortcuts, avoiding duplicates by URL
            const existingUrls = new Set(this.shortcuts.map((s) => s.url));
            const newShortcuts = data.shortcuts.filter(
              (s) => !existingUrls.has(s.url)
            );
            this.shortcuts.push(...newShortcuts);
          }

          await this.saveShortcuts();
          this.renderCustomShortcuts();
          this.showNotification(
            `${importedCount} shortcuts imported successfully!`,
            "success"
          );
        } else {
          throw new Error("Invalid file format");
        }
      } catch (error) {
        console.error("Import failed:", error);
        this.showNotification(
          "Failed to import shortcuts. Please check the file format.",
          "error"
        );
      }
    });

    input.click();
  }

  // Cleanup when tab is closed
  destroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    if (this.healthReminder.sittingTimer) {
      clearInterval(this.healthReminder.sittingTimer);
    }
    if (this.healthReminder.breakTimer) {
      clearInterval(this.healthReminder.breakTimer);
    }
    if (this.healthReminder.syncInterval) {
      clearInterval(this.healthReminder.syncInterval);
    }
  }

  showAddShortcutModal() {
    document.getElementById("shortcut-modal-large").classList.remove("hidden");
  }

  hideAddShortcutModal() {
    document.getElementById("shortcut-modal-large").classList.add("hidden");
    // Clear form
    document.getElementById("shortcut-name-large").value = "";
    document.getElementById("shortcut-url-large").value = "";
  }

  async saveNewShortcut() {
    const name = document.getElementById("shortcut-name-large").value.trim();
    const url = document.getElementById("shortcut-url-large").value.trim();

    if (!name || !url) {
      alert("Please fill in both name and URL");
      return;
    }

    try {
      new URL(url);
    } catch {
      alert("Please enter a valid URL");
      return;
    }

    // Show loading state
    const saveBtn = document.getElementById("save-shortcut-large");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "SAVING...";
    saveBtn.disabled = true;

    try {
      // Fetch favicon from website's page source
      const faviconUrl = await this.fetchFaviconFromPageSource(url);
      const shortcut = { name, url, faviconUrl, id: Date.now() };
      this.shortcuts.push(shortcut);

      await this.saveShortcuts();
      this.renderCustomShortcuts();
      this.hideAddShortcutModal();

      // Only show notification when user manually adds a shortcut
      this.showNotification("Shortcut added successfully!", "success");
    } catch (error) {
      console.warn("Failed to fetch favicon:", error);
      // Fallback: save without custom favicon
      const shortcut = { name, url, id: Date.now() };
      this.shortcuts.push(shortcut);
      await this.saveShortcuts();
      this.renderCustomShortcuts();
      this.hideAddShortcutModal();

      // Only show notification when user manually adds a shortcut
      this.showNotification("Shortcut added successfully!", "success");
    } finally {
      // Restore button state
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }

  async fetchFaviconFromPageSource(url) {
    try {
      // Create a CORS-friendly proxy URL or use fetch with mode
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const faviconUrl = this.extractFaviconFromHTML(html, url);

      if (faviconUrl) {
        // Verify the favicon URL is accessible
        await this.verifyFaviconUrl(faviconUrl);
        return faviconUrl;
      }

      throw new Error("No favicon found in page source");
    } catch (error) {
      console.warn(
        "Direct favicon fetch failed, using fallback method:",
        error
      );
      // Fallback to common favicon locations
      return this.tryCommonFaviconLocations(url);
    }
  }

  extractFaviconFromHTML(html, baseUrl) {
    try {
      // Create a temporary DOM parser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Priority order for favicon selection
      const selectors = [
        'link[rel*="icon"][sizes*="32x32"]',
        'link[rel*="icon"][sizes*="64x64"]',
        'link[rel*="icon"][sizes*="96x96"]',
        'link[rel="apple-touch-icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="icon"]',
      ];

      for (const selector of selectors) {
        const link = doc.querySelector(selector);
        if (link && link.href) {
          return new URL(link.href, baseUrl).href;
        }
      }

      // Check for PNG/JPG favicons
      const genericIcon = doc.querySelector('link[rel*="icon"]');
      if (genericIcon && genericIcon.href) {
        return new URL(genericIcon.href, baseUrl).href;
      }

      return null;
    } catch (error) {
      console.warn("Failed to parse HTML for favicon:", error);
      return null;
    }
  }

  async tryCommonFaviconLocations(url) {
    const domain = new URL(url);
    const commonPaths = [
      "/favicon.ico",
      "/favicon.png",
      "/apple-touch-icon.png",
      "/apple-touch-icon-precomposed.png",
      "/favicon-32x32.png",
      "/favicon-16x16.png",
    ];

    for (const path of commonPaths) {
      try {
        const faviconUrl = `${domain.protocol}//${domain.host}${path}`;
        await this.verifyFaviconUrl(faviconUrl);
        return faviconUrl;
      } catch {
        continue;
      }
    }

    throw new Error("No accessible favicon found");
  }

  async verifyFaviconUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error("Favicon not accessible"));
      img.src = url;
    });
  }

  async loadShortcuts() {
    this.updateShortcutsStatus("saving"); // Show loading state
    try {
      // First try Chrome storage
      const result = await chrome.storage.local.get(["shortcuts"]);
      this.shortcuts = result.shortcuts || [];

      // If no shortcuts in Chrome storage, try localStorage as fallback
      if (this.shortcuts.length === 0) {
        const localStorageShortcuts = localStorage.getItem(
          "productivity-shortcuts"
        );
        if (localStorageShortcuts) {
          this.shortcuts = JSON.parse(localStorageShortcuts);
          // Migrate to Chrome storage silently
          await this.saveShortcuts();
        }
      }

      this.updateShortcutsStatus("loaded");
      console.log(
        "Shortcuts loaded successfully:",
        this.shortcuts.length,
        "shortcuts"
      );
    } catch (error) {
      console.warn(
        "Failed to load from Chrome storage, using localStorage:",
        error
      );
      // Fallback to localStorage if Chrome storage fails
      const localStorageShortcuts = localStorage.getItem(
        "productivity-shortcuts"
      );
      this.shortcuts = localStorageShortcuts
        ? JSON.parse(localStorageShortcuts)
        : [];
      this.updateShortcutsStatus("error");
    }

    this.renderCustomShortcuts();
  }

  async saveShortcuts() {
    this.updateShortcutsStatus("saving");
    try {
      // Save to Chrome storage silently
      await chrome.storage.local.set({ shortcuts: this.shortcuts });
      // Also save to localStorage as backup
      localStorage.setItem(
        "productivity-shortcuts",
        JSON.stringify(this.shortcuts)
      );
      this.updateShortcutsStatus("loaded");
      console.log(
        "Shortcuts saved silently:",
        this.shortcuts.length,
        "shortcuts"
      );
    } catch (error) {
      console.warn(
        "Failed to save to Chrome storage, using localStorage:",
        error
      );
      // Fallback to localStorage only
      localStorage.setItem(
        "productivity-shortcuts",
        JSON.stringify(this.shortcuts)
      );
      this.updateShortcutsStatus("error");
    }
  }

  updateShortcutsStatus(status) {
    const statusIndicator = document.getElementById("shortcuts-status");
    if (statusIndicator) {
      // Only show status indicator for saving or error states
      if (status === "loaded") {
        statusIndicator.style.display = "none";
        return;
      }

      statusIndicator.style.display = "block";
      statusIndicator.className = `status-indicator ${status}`;

      const titles = {
        saving: "Saving shortcuts...",
        error: "Error saving shortcuts (using local backup)",
      };

      statusIndicator.title = titles[status] || "Unknown status";

      // Hide saving indicator after a short delay
      if (status === "saving") {
        setTimeout(() => {
          statusIndicator.style.display = "none";
        }, 1000);
      }
    }
  }

  renderCustomShortcuts() {
    const container = document.getElementById("shortcuts-container");

    // Clear all existing shortcuts
    container.innerHTML = "";

    // Add debug info
    console.log("Rendering shortcuts:", this.shortcuts);

    // Update shortcuts count in header if needed
    const header = document.querySelector(
      ".shortcuts-widget-new .widget-header h2"
    );
    if (header) {
      header.textContent = `SHORTCUTS (${this.shortcuts.length})`;
    }

    // Add custom shortcuts
    this.shortcuts.forEach((shortcut) => {
      const card = document.createElement("a");
      card.className = "shortcut-card-new custom-shortcut-new";
      card.href = shortcut.url;
      card.draggable = true;
      // Removed target="_blank" so links open in same tab

      // Drag and Drop event listeners
      card.addEventListener("dragstart", (e) =>
        this.handleDragStart(e, shortcut)
      );
      card.addEventListener("dragover", (e) => this.handleDragOver(e));
      card.addEventListener("dragenter", (e) => this.handleDragEnter(e));
      card.addEventListener("dragleave", (e) => this.handleDragLeave(e));
      card.addEventListener("drop", (e) => this.handleDrop(e, shortcut));
      card.addEventListener("dragend", (e) => this.handleDragEnd(e));

      const domain = new URL(shortcut.url).hostname;

      // Create favicon with enhanced handling
      const favicon = document.createElement("img");
      favicon.className = "shortcut-favicon";
      favicon.alt = shortcut.name;

      // Set up error handling before setting src
      favicon.onerror = () => {
        // Try alternative favicon services as fallbacks
        const fallbackUrls = [
          `https://icons.duckduckgo.com/ip3/${domain}.ico`,
          `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
          `https://${domain}/favicon.ico`,
        ];

        let fallbackIndex = 0;
        const tryFallback = () => {
          if (fallbackIndex < fallbackUrls.length) {
            favicon.src = fallbackUrls[fallbackIndex];
            fallbackIndex++;
          } else {
            // All fallbacks failed, show a default icon
            favicon.style.display = "none";
            const fallbackIcon = document.createElement("div");
            fallbackIcon.className = "shortcut-favicon";
            fallbackIcon.innerHTML = "🌐";
            fallbackIcon.style.display = "flex";
            fallbackIcon.style.alignItems = "center";
            fallbackIcon.style.justifyContent = "center";
            fallbackIcon.style.fontSize = "20px";
            favicon.parentNode.replaceChild(fallbackIcon, favicon);
          }
        };
        favicon.onerror = tryFallback;
        tryFallback();
      };

      // Use stored favicon URL first, then fallback to external services
      if (shortcut.faviconUrl) {
        favicon.src = shortcut.faviconUrl;
      } else {
        // Use high-resolution favicon as fallback
        favicon.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      }

      const label = document.createElement("span");
      label.className = "shortcut-label";
      label.textContent = shortcut.name;

      card.appendChild(favicon);
      card.appendChild(label);

      // Add right-click context menu
      card.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.showContextMenu(e, shortcut);
      });

      container.appendChild(card);
    });

    // Show empty state if no shortcuts
    if (this.shortcuts.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-shortcuts-state";
      emptyState.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #666; font-size: 14px;">
          <div style="font-size: 24px; margin-bottom: 10px;">📌</div>
          <div style="margin-bottom: 8px;">No shortcuts yet</div>
          <div style="font-size: 12px; opacity: 0.7;">Press Ctrl+Shift+S or click + ADD to create your first shortcut</div>
        </div>
      `;
      container.appendChild(emptyState);
    }
  }

  async deleteShortcut(id) {
    if (confirm("Delete this shortcut?")) {
      this.shortcuts = this.shortcuts.filter((s) => s.id !== id);
      await this.saveShortcuts();
      this.renderCustomShortcuts();
      // Only show delete notification briefly
      this.showNotification("Shortcut removed", "info");
    }
  }

  showContextMenu(event, shortcut) {
    const contextMenu = document.getElementById("shortcut-context-menu");

    // Hide any existing context menu first
    this.hideContextMenu();

    // Show the menu first so we can measure it
    contextMenu.classList.remove("hidden");

    // Get menu dimensions
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;

    // Get viewport dimensions
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Calculate position
    let left = event.pageX;
    let top = event.pageY;

    // Boundary check for horizontal
    if (left + menuWidth > windowWidth) {
      left = windowWidth - menuWidth - 10; // 10px padding from edge
    }

    // Boundary check for vertical
    if (top + menuHeight > windowHeight) {
      top = windowHeight - menuHeight - 10; // 10px padding from edge
    }

    // Adjust for scroll position if necessary (though position is fixed)
    // Since it's position: fixed, we use clientX/Y instead of pageX/Y
    left = event.clientX;
    top = event.clientY;

    // Recalculate with client coords for fixed positioning
    if (left + menuWidth > windowWidth) {
      left = windowWidth - menuWidth - 10;
    }
    if (top + menuHeight > windowHeight) {
      top = windowHeight - menuHeight - 10;
    }

    contextMenu.style.left = `${left}px`;
    contextMenu.style.top = `${top}px`;

    // Store the current shortcut reference
    this.currentContextShortcut = shortcut;

    // Add event listeners for menu items
    this.setupContextMenuListeners();

    // Hide menu when clicking outside
    const hideMenu = (e) => {
      if (!contextMenu.contains(e.target)) {
        this.hideContextMenu();
        document.removeEventListener("click", hideMenu);
      }
    };

    // Add listener with a small delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener("click", hideMenu);
    }, 10);
  }

  setupContextMenuListeners() {
    // Remove existing listeners to prevent duplicates
    const renameBtn = document.getElementById("rename-shortcut");
    const editUrlBtn = document.getElementById("edit-url-shortcut");
    const deleteBtn = document.getElementById("delete-shortcut");

    // Clone nodes to remove event listeners
    const newRenameBtn = renameBtn.cloneNode(true);
    const newEditUrlBtn = editUrlBtn.cloneNode(true);
    const newDeleteBtn = deleteBtn.cloneNode(true);

    renameBtn.parentNode.replaceChild(newRenameBtn, renameBtn);
    editUrlBtn.parentNode.replaceChild(newEditUrlBtn, editUrlBtn);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

    // Add new listeners
    newRenameBtn.addEventListener("click", () => {
      this.hideContextMenu();
      this.showEditModal("name");
    });

    newEditUrlBtn.addEventListener("click", () => {
      this.hideContextMenu();
      this.showEditModal("url");
    });

    newDeleteBtn.addEventListener("click", () => {
      this.hideContextMenu();
      this.deleteShortcut(this.currentContextShortcut.id);
    });
  }

  hideContextMenu() {
    const contextMenu = document.getElementById("shortcut-context-menu");
    contextMenu.classList.add("hidden");
  }

  showEditModal(mode) {
    const modal = document.getElementById("edit-shortcut-modal");
    const titleElement = document.getElementById("edit-modal-title");
    const nameInput = document.getElementById("edit-shortcut-name");
    const urlInput = document.getElementById("edit-shortcut-url");

    // Set modal title and populate fields
    if (mode === "name") {
      titleElement.textContent = "Rename Shortcut";
      nameInput.value = this.currentContextShortcut.name;
      urlInput.value = this.currentContextShortcut.url;
      // Focus on name input
      setTimeout(() => nameInput.focus(), 100);
    } else if (mode === "url") {
      titleElement.textContent = "Edit URL";
      nameInput.value = this.currentContextShortcut.name;
      urlInput.value = this.currentContextShortcut.url;
      // Focus on URL input
      setTimeout(() => urlInput.focus(), 100);
    }

    modal.classList.remove("hidden");
    this.setupEditModalListeners();
  }

  setupEditModalListeners() {
    const saveBtn = document.getElementById("save-edited-shortcut");
    const cancelBtn = document.getElementById("cancel-edit-shortcut");
    const modal = document.getElementById("edit-shortcut-modal");

    // Remove existing listeners
    const newSaveBtn = saveBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Add new listeners
    newSaveBtn.addEventListener("click", () => this.saveEditedShortcut());
    newCancelBtn.addEventListener("click", () => this.hideEditModal());

    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        this.hideEditModal();
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);
  }

  async saveEditedShortcut() {
    const nameInput = document.getElementById("edit-shortcut-name");
    const urlInput = document.getElementById("edit-shortcut-url");

    const newName = nameInput.value.trim();
    const newUrl = urlInput.value.trim();

    // Validation
    if (!newName) {
      this.showNotification("Please enter a name", "error");
      nameInput.focus();
      return;
    }

    if (!newUrl) {
      this.showNotification("Please enter a URL", "error");
      urlInput.focus();
      return;
    }

    try {
      new URL(newUrl); // Validate URL format
    } catch {
      this.showNotification("Please enter a valid URL", "error");
      urlInput.focus();
      return;
    }

    // Update the shortcut
    const shortcutIndex = this.shortcuts.findIndex(
      (s) => s.id === this.currentContextShortcut.id
    );
    if (shortcutIndex !== -1) {
      const oldUrl = this.shortcuts[shortcutIndex].url;
      this.shortcuts[shortcutIndex].name = newName;
      this.shortcuts[shortcutIndex].url = newUrl;

      // If URL changed, try to fetch new favicon
      if (oldUrl !== newUrl) {
        try {
          const newFavicon = await this.fetchFaviconFromPageSource(newUrl);
          if (newFavicon) {
            this.shortcuts[shortcutIndex].faviconUrl = newFavicon;
          }
        } catch (error) {
          console.warn("Failed to auto-update favicon on edit:", error);
        }
      }

      await this.saveShortcuts();
      this.renderCustomShortcuts();
      this.hideEditModal();
      this.showNotification("Shortcut updated successfully", "success");
    }
  }

  hideEditModal() {
    const modal = document.getElementById("edit-shortcut-modal");
    modal.classList.add("hidden");
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "success"
          ? "#4CAF50"
          : type === "error"
          ? "#f44336"
          : "#2196F3"
      };
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Drag and Drop Handlers
  handleDragStart(e, shortcut) {
    this.draggedShortcut = shortcut;
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", shortcut.id);

    // Create a ghost image if needed, but the default is usually fine
    console.log("Drag started for shortcut:", shortcut.name);
  }

  handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault(); // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = "move";
    return false;
  }

  handleDragEnter(e) {
    e.currentTarget.classList.add("drag-over");
  }

  handleDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  async handleDrop(e, targetShortcut) {
    if (e.stopPropagation) {
      e.stopPropagation(); // Stops some browsers from redirecting.
    }

    if (this.draggedShortcut && this.draggedShortcut.id !== targetShortcut.id) {
      console.log(
        `Dropping ${this.draggedShortcut.name} onto ${targetShortcut.name}`
      );

      const fromIndex = this.shortcuts.findIndex(
        (s) => s.id === this.draggedShortcut.id
      );
      const toIndex = this.shortcuts.findIndex(
        (s) => s.id === targetShortcut.id
      );

      if (fromIndex !== -1 && toIndex !== -1) {
        // Reorder the array
        const [movedItem] = this.shortcuts.splice(fromIndex, 1);
        this.shortcuts.splice(toIndex, 0, movedItem);

        // Save and re-render
        await this.saveShortcuts();
        this.renderCustomShortcuts();
        this.showNotification("Shortcuts reordered", "success");
      }
    }

    return false;
  }

  handleDragEnd(e) {
    e.currentTarget.classList.remove("dragging");
    const cards = document.querySelectorAll(".shortcut-card-new");
    cards.forEach((card) => card.classList.remove("drag-over"));
    this.draggedShortcut = null;
  }

  // Debug method to check storage status
  async debugStorageStatus() {
    try {
      console.group("📊 Storage Debug Info");

      // Check Chrome storage
      const chromeData = await chrome.storage.local.get(["shortcuts"]);
      console.log("Chrome Storage:", chromeData);

      // Check localStorage
      const localData = localStorage.getItem("productivity-shortcuts");
      console.log("LocalStorage:", localData ? JSON.parse(localData) : null);

      // Current shortcuts in memory
      console.log("Memory shortcuts:", this.shortcuts);

      // Storage space usage
      const usage = await chrome.storage.local.getBytesInUse();
      console.log("Storage usage (bytes):", usage);

      console.groupEnd();
    } catch (error) {
      console.error("Debug storage check failed:", error);
    }
  }

  // Manual save trigger for debugging
  async forceSave() {
    await this.saveShortcuts();
    await this.debugStorageStatus();
    console.log("Manual save completed - check console for details");
  }

  // Cleanup when tab is closed
  destroy() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
    if (this.sessionUpdateInterval) {
      clearInterval(this.sessionUpdateInterval);
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const dashboard = new ProductivityDashboard();

  // Update greeting every hour and days remaining
  setInterval(() => {
    dashboard.setupGreeting();
    dashboard.updateDaysRemaining();
  }, 3600000);

  // Clean up when tab is closed
  window.addEventListener("beforeunload", () => {
    dashboard.destroy();
  });
});

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "reminderTriggered") {
    // Update tip text to show reminder was triggered
    const tipElement = document.getElementById("tip-text");
    if (tipElement) {
      const originalTip = tipElement.textContent;
      tipElement.textContent = "Reminder: Time to drink water and take a walk";

      setTimeout(() => {
        tipElement.textContent = originalTip;
      }, 15000);
    }
  }
});
