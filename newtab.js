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
      timer: null,
      sessionStartTime: null,
      sittingDuration: 45 * 60 * 1000, // 45 minutes in milliseconds
      breakDuration: 2 * 60 * 1000, // 2 minutes in milliseconds
      restDuration: 5 * 60 * 1000, // 5 minutes rest before next session
      currentPhase: "sitting", // 'sitting', 'break', 'rest'
      tabBlinkInterval: null,
      originalTitle: document.title,
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

    this.init();
  }

  init() {
    this.setupGreeting();
    this.setupEventListeners();
    this.initializeAnimatedNumbers();
    this.startTimeUpdate();
    this.updateDaysRemaining();
    this.loadShortcuts();
    this.initializeHealthReminder();

    // Ensure tab is not blinking on page load
    this.stopTabBlinking();

    // Add debug info for shortcuts (only in console, no notifications)
    console.log("Dashboard initialized. Current shortcuts:", this.shortcuts);
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
        hour12: false,
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
  // HEALTH REMINDER SYSTEM - COMPLETELY REWRITTEN
  // =============================================================================

  async initializeHealthReminder() {
    try {
      console.log("Initializing Health Reminder System...");

      // Clear any old storage data that might conflict
      await chrome.storage.local.remove([
        "globalTimerState",
        "globalStartTime",
        "timerPhase",
        "phaseStartTime",
      ]);

      // Get or create session data
      const result = await chrome.storage.local.get(["healthSession"]);
      const now = Date.now();

      if (!result.healthSession) {
        // Start new session
        await this.startNewHealthSession();
      } else {
        // Resume existing session
        await this.resumeHealthSession(result.healthSession);
      }

      // Start the main timer loop
      this.startHealthTimer();
      console.log("Health Reminder System initialized successfully");
    } catch (error) {
      console.error("Failed to initialize health reminder:", error);
      // Fallback - start new session
      await this.startNewHealthSession();
      this.startHealthTimer();
    }
  }

  async startNewHealthSession() {
    const now = Date.now();
    const session = {
      phase: "sitting",
      phaseStartTime: now,
      sessionStartTime: now,
    };

    await chrome.storage.local.set({ healthSession: session });
    this.healthReminder.currentPhase = "sitting";
    this.healthReminder.sessionStartTime = now;

    console.log("NEW SESSION STARTED - 45 minute sitting timer begins");
    console.log(
      `DEBUG - New session time: ${now}, Phase: ${this.healthReminder.currentPhase}`
    );
    console.log(
      `DEBUG - Sitting duration: ${this.healthReminder.sittingDuration}ms (${
        this.healthReminder.sittingDuration / 60000
      } minutes)`
    );

    // Force immediate display update with new session time
    this.updateHealthDisplay();
  }

  async resumeHealthSession(session) {
    const now = Date.now();
    this.healthReminder.currentPhase = session.phase;
    this.healthReminder.sessionStartTime = session.phaseStartTime;

    console.log(`Resuming health session - Phase: ${session.phase}`);

    // Check if we need to advance to next phase
    const elapsed = now - session.phaseStartTime;

    switch (session.phase) {
      case "sitting":
        if (elapsed >= this.healthReminder.sittingDuration) {
          await this.triggerBreakTime();
        }
        break;
      case "break":
        if (elapsed >= this.healthReminder.breakDuration) {
          await this.startRestPhase();
        }
        break;
      case "rest":
        if (elapsed >= this.healthReminder.restDuration) {
          await this.startNewHealthSession();
        }
        break;
    }
  }

  startHealthTimer() {
    // Clear any existing timer
    if (this.healthReminder.timer) {
      clearInterval(this.healthReminder.timer);
    }

    // Clear any old timers that might still be running
    if (this.healthReminder.sittingTimer) {
      clearInterval(this.healthReminder.sittingTimer);
      this.healthReminder.sittingTimer = null;
    }
    if (this.healthReminder.breakTimer) {
      clearInterval(this.healthReminder.breakTimer);
      this.healthReminder.breakTimer = null;
    }
    if (this.healthReminder.syncInterval) {
      clearInterval(this.healthReminder.syncInterval);
      this.healthReminder.syncInterval = null;
    }

    // Start main timer that updates every second
    this.healthReminder.timer = setInterval(() => {
      this.updateHealthDisplay();
    }, 1000);

    // Initial update
    this.updateHealthDisplay();
  }

  async updateHealthDisplay() {
    const now = Date.now();
    const elapsed = now - this.healthReminder.sessionStartTime;

    switch (this.healthReminder.currentPhase) {
      case "sitting":
        await this.updateSittingDisplay(elapsed);
        break;
      case "break":
        await this.updateBreakDisplay(elapsed);
        break;
      case "rest":
        await this.updateRestDisplay(elapsed);
        break;
    }
  }

  async updateSittingDisplay(elapsed) {
    const remaining = Math.max(
      0,
      this.healthReminder.sittingDuration - elapsed
    );

    console.log(
      `DEBUG - Sitting: elapsed=${Math.floor(
        elapsed / 1000
      )}s, remaining=${Math.floor(remaining / 1000)}s, sessionStart=${
        this.healthReminder.sessionStartTime
      }`
    );

    if (remaining === 0) {
      // Time for break!
      await this.triggerBreakTime();
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
    this.hideRestActions();
  }

  async updateBreakDisplay(elapsed) {
    const remaining = Math.max(0, this.healthReminder.breakDuration - elapsed);

    if (remaining === 0) {
      // Break finished, start rest phase
      await this.startRestPhase();
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    // Update display
    this.setTimerDisplay(`BREAK ${timeString}`, "#ffffff");
    this.setHealthTip(
      "Great! Take this time to walk, stretch, or step outside"
    );
    this.hideRestActions();
  }

  async updateRestDisplay(elapsed) {
    const remaining = Math.max(0, this.healthReminder.restDuration - elapsed);

    console.log(
      `DEBUG - Rest: elapsed=${Math.floor(
        elapsed / 1000
      )}s, remaining=${Math.floor(remaining / 1000)}s`
    );

    if (remaining === 0) {
      // Rest finished, start new sitting session
      console.log("REST PERIOD FINISHED - Starting new session...");
      await this.startNewHealthSession();
      return;
    }

    // Update display
    this.setTimerDisplay("REST", "#2196F3");
    this.setHealthTip("Well done! Next sitting timer starts in 5 minutes");
    this.showRestActions();
  }

  async triggerBreakTime() {
    console.log("BREAK TIME TRIGGERED!");

    // Update phase
    this.healthReminder.currentPhase = "break";
    this.healthReminder.sessionStartTime = Date.now();

    // Save to storage
    await chrome.storage.local.set({
      healthSession: {
        phase: "break",
        phaseStartTime: this.healthReminder.sessionStartTime,
        sessionStartTime: this.healthReminder.sessionStartTime,
      },
    });

    // Show break notification
    this.showBreakNotification();

    // Start tab blinking
    this.startTabBlinking();

    // Show break modal
    this.showBreakModal();
  }

  async startBreakPhase() {
    console.log("Break phase started by user");

    // Stop tab blinking and hide modal
    this.stopTabBlinking();
    this.hideBreakModal();

    // Phase is already set to 'break', just continue with timer
    console.log("Break timer running for 2 minutes");
  }

  async skipBreakPhase() {
    console.log("Break phase skipped by user");

    // Stop tab blinking and hide modal
    this.stopTabBlinking();
    this.hideBreakModal();

    // Go directly to rest phase
    await this.startRestPhase();
  }

  async startRestPhase() {
    console.log("Rest phase started");

    // Update phase
    this.healthReminder.currentPhase = "rest";
    this.healthReminder.sessionStartTime = Date.now();

    // Save to storage
    await chrome.storage.local.set({
      healthSession: {
        phase: "rest",
        phaseStartTime: this.healthReminder.sessionStartTime,
        sessionStartTime: this.healthReminder.sessionStartTime,
      },
    });
  }

  async returnFromRest() {
    console.log("User returned early from rest");
    await this.startNewHealthSession();
  }

  // =============================================================================
  // UI UPDATE METHODS
  // =============================================================================

  setTimerDisplay(text, color = "#ffffff") {
    if (this.animatedNumbers.reminderTimer) {
      this.animatedNumbers.reminderTimer.setValue(text);
    } else {
      const timerElement = document.getElementById("reminder-timer");
      if (timerElement) {
        timerElement.textContent = text;
        timerElement.style.color = color;
      }
    }

    // Debug: Log current phase and display
    console.log(
      `Health Reminder - Phase: ${this.healthReminder.currentPhase}, Display: ${text}`
    );
  }

  setHealthTip(text) {
    const tipElement = document.getElementById("health-tip-text");
    if (tipElement) {
      tipElement.textContent = text;
    }
  }

  showRestActions() {
    const restActions = document.getElementById("rest-actions");
    if (restActions) {
      restActions.style.display = "block";
    }
  }

  hideRestActions() {
    const restActions = document.getElementById("rest-actions");
    if (restActions) {
      restActions.style.display = "none";
    }
  }

  showBreakModal() {
    const modal = document.getElementById("break-reminder-modal");
    if (modal) {
      modal.classList.remove("hidden");
    }
  }

  hideBreakModal() {
    const modal = document.getElementById("break-reminder-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  // =============================================================================
  // NOTIFICATION AND TAB BLINKING METHODS
  // =============================================================================

  showBreakNotification() {
    // Browser notification
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        const notification = new Notification("Time for a Health Break! 🚶", {
          body: "You've been sitting for 45 minutes. Take a 2-minute break to move around!",
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23ff4444'/><text x='50' y='60' text-anchor='middle' font-size='40' fill='white'>!</text></svg>",
          tag: "health-break",
          requireInteraction: true,
        });
        setTimeout(() => notification.close(), 10000);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            this.showBreakNotification();
          }
        });
      }
    }

    // Play sound
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiN0fPOeSsFJHHDwcgELAAAVDVmKAoEAAAAcwBGVAAOAOAGcADwBQAA"
      );
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  }

  startTabBlinking() {
    this.stopTabBlinking();

    let isBlinking = false;
    this.healthReminder.tabBlinkInterval = setInterval(() => {
      if (isBlinking) {
        document.title = this.healthReminder.originalTitle;
        this.setFavicon(
          "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23333'/></svg>"
        );
      } else {
        document.title = "⚠️ BREAK TIME! MOVE YOUR BODY! ⚠️";
        this.setFavicon(
          "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23ff4444'/><text x='50' y='60' text-anchor='middle' font-size='40' fill='white'>!</text></svg>"
        );
      }
      isBlinking = !isBlinking;
    }, 600);
  }

  stopTabBlinking() {
    if (this.healthReminder.tabBlinkInterval) {
      clearInterval(this.healthReminder.tabBlinkInterval);
      this.healthReminder.tabBlinkInterval = null;
    }
    document.title = this.healthReminder.originalTitle;
    this.setFavicon(
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23333'/></svg>"
    );

    // Remove visual alert classes
    const healthWidget = document.querySelector(".health-reminder-widget");
    const timerDisplay = document.getElementById("reminder-timer");
    if (healthWidget) healthWidget.classList.remove("break-alert");
    if (timerDisplay) timerDisplay.classList.remove("break-alert");
  }

  setFavicon(iconUrl) {
    const existingFavicon = document.querySelector("link[rel*='icon']");
    if (existingFavicon) existingFavicon.remove();

    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/svg+xml";
    favicon.href = iconUrl;
    document.head.appendChild(favicon);
  }

  async startNewGlobalSession() {
    const now = Date.now();
    const globalState = {
      globalTimerState: "sitting",
      globalStartTime: now,
      timerPhase: "sitting",
      phaseStartTime: now,
    };

    await chrome.storage.local.set(globalState);

    this.healthReminder.globalStartTime = now;
    this.healthReminder.isOnBreak = false;
    this.healthReminder.isOnRest = false;

    // Reset health tip text
    const tipElement = document.getElementById("health-tip-text");
    if (tipElement) {
      tipElement.textContent =
        "Stay active! Regular movement boosts productivity and health";
    }

    // Hide "I'm Back" button when starting new session
    const restActions = document.getElementById("rest-actions");
    if (restActions) {
      restActions.style.display = "none";
    }

    this.startReminderDisplay();
    console.log("New global health session started");
  }

  async syncWithGlobalTimer(globalData) {
    const now = Date.now();
    const { globalStartTime, timerPhase, phaseStartTime } = globalData;

    this.healthReminder.globalStartTime = globalStartTime;

    switch (timerPhase) {
      case "sitting":
        const sittingElapsed = now - phaseStartTime;
        if (sittingElapsed >= this.healthReminder.sittingDuration) {
          // Should be on break
          await this.syncToBreakPhase();
        } else {
          this.healthReminder.isOnBreak = false;
          this.healthReminder.isOnRest = false;
          this.startReminderDisplay();
        }
        break;

      case "break":
      case "break-active":
        this.healthReminder.isOnBreak = true;
        this.healthReminder.isOnRest = false;
        const breakElapsed = now - phaseStartTime;
        if (breakElapsed >= this.healthReminder.breakDuration) {
          // Should be on rest
          await this.syncToRestPhase();
        } else {
          // Start the break timer display if not already running
          if (!this.healthReminder.breakTimer) {
            this.startBreakTimerFromSync(phaseStartTime);
          }
        }
        break;

      case "rest":
        this.healthReminder.isOnBreak = false;
        this.healthReminder.isOnRest = true;
        const restElapsed = now - phaseStartTime;
        if (restElapsed >= this.healthReminder.restartDelay) {
          // Should start new sitting session
          await this.startNewGlobalSession();
        } else {
          this.showRestState();
        }
        break;
    }

    console.log(`Synced with global timer - Phase: ${timerPhase}`);
  }

  startGlobalSync() {
    // Sync with global state every 5 seconds
    this.healthReminder.syncInterval = setInterval(async () => {
      try {
        const result = await chrome.storage.local.get([
          "timerPhase",
          "phaseStartTime",
        ]);
        if (result.timerPhase && result.phaseStartTime) {
          await this.syncWithGlobalTimer(result);
        }
      } catch (error) {
        console.warn("Global sync failed:", error);
      }
    }, 5000);
  }

  async syncToBreakPhase() {
    const now = Date.now();
    await chrome.storage.local.set({
      timerPhase: "break",
      phaseStartTime: now,
    });

    this.healthReminder.isOnBreak = true;
    this.healthReminder.isOnRest = false;
    this.showBreakReminder();
  }

  async syncToRestPhase() {
    const now = Date.now();
    await chrome.storage.local.set({
      timerPhase: "rest",
      phaseStartTime: now,
    });

    this.healthReminder.isOnBreak = false;
    this.healthReminder.isOnRest = true;
    this.showRestState();
  }

  startReminderDisplay() {
    console.log("Timer debug - startReminderDisplay called");
    this.updateReminderDisplay();

    // Clear any existing timer
    if (this.healthReminder.sittingTimer) {
      clearInterval(this.healthReminder.sittingTimer);
    }

    // Start the sitting timer display
    this.healthReminder.sittingTimer = setInterval(() => {
      this.updateReminderDisplay();

      // Check if 45 minutes have passed
      const result = chrome.storage.local.get(["phaseStartTime"]);
      result.then((data) => {
        if (data.phaseStartTime) {
          const elapsed = Date.now() - data.phaseStartTime;
          if (
            elapsed >= this.healthReminder.sittingDuration &&
            !this.healthReminder.isOnBreak
          ) {
            this.triggerBreakTime();
          }
        }
      });
    }, 1000);

    console.log("Timer debug - Timer interval started");
  }

  async triggerBreakTime() {
    // Clear the sitting timer
    if (this.healthReminder.sittingTimer) {
      clearInterval(this.healthReminder.sittingTimer);
      this.healthReminder.sittingTimer = null;
    }

    await this.syncToBreakPhase();
  }

  updateReminderDisplay() {
    chrome.storage.local
      .get(["phaseStartTime", "timerPhase"])
      .then((result) => {
        console.log("Timer debug - Storage result:", result);

        if (!result.phaseStartTime || !result.timerPhase) {
          console.log(
            "Timer debug - Missing phase data, initializing new session"
          );
          // If no phase data exists, start a new session
          this.startNewGlobalSession();
          return;
        }

        const elapsed = Date.now() - result.phaseStartTime;
        console.log(
          "Timer debug - Phase:",
          result.timerPhase,
          "Elapsed:",
          Math.floor(elapsed / 1000),
          "seconds"
        );

        if (result.timerPhase === "sitting") {
          const remaining = Math.max(
            0,
            this.healthReminder.sittingDuration - elapsed
          );
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          const timeString = `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;

          console.log("Timer debug - Displaying:", timeString);

          // Update with animation
          if (this.animatedNumbers.reminderTimer) {
            this.animatedNumbers.reminderTimer.setValue(timeString);
          } else {
            const timerElement = document.getElementById("reminder-timer");
            if (timerElement) {
              timerElement.textContent = timeString;
              timerElement.style.color = "";
              console.log("Timer debug - Updated element with:", timeString);
            } else {
              console.error(
                "Timer debug - Element 'reminder-timer' not found!"
              );
            }
          }

          // Hide "I'm Back" button during sitting phase
          const restActions = document.getElementById("rest-actions");
          if (restActions) {
            restActions.style.display = "none";
          }
        }

        // Update health tip
        this.updateHealthTip(elapsed);
      })
      .catch((error) => {
        console.error("Timer debug - Storage error:", error);
      });
  }

  updateHealthTip(elapsed) {
    const tipElement = document.getElementById("health-tip-text");
    if (tipElement) {
      const tips = [
        "Stay active! Regular movement boosts productivity and health",
        "Remember to blink often and focus on distant objects",
        "Keep your water bottle nearby - hydration is key",
        "Good posture helps prevent back and neck pain",
        "Deep breathing exercises can reduce stress and improve focus",
      ];

      // Change tip every 10 minutes
      const tipIndex = Math.floor(elapsed / 600000) % tips.length;
      tipElement.textContent = tips[tipIndex];
    }
  }

  startTabBlinking() {
    // Stop any existing blinking
    this.stopTabBlinking();

    let isBlinking = false;
    this.healthReminder.tabBlinkInterval = setInterval(() => {
      if (isBlinking) {
        document.title = this.healthReminder.originalTitle;
        this.setFavicon(
          "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23333'/></svg>"
        );
      } else {
        document.title = "⚠️ BREAK TIME! MOVE YOUR BODY! ⚠️";
        this.setFavicon(
          "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23ff4444'/><text x='50' y='60' text-anchor='middle' font-size='40' fill='white'>!</text></svg>"
        );
      }
      isBlinking = !isBlinking;
    }, 600); // Faster blinking for more attention

    // Try to show browser notification
    this.showBrowserNotification();
  }

  stopTabBlinking() {
    if (this.healthReminder.tabBlinkInterval) {
      clearInterval(this.healthReminder.tabBlinkInterval);
      this.healthReminder.tabBlinkInterval = null;
    }
    // Reset to original title and favicon
    document.title = this.healthReminder.originalTitle;
    this.setFavicon(
      "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23333'/></svg>"
    );

    // Remove visual alert classes
    const healthWidget = document.querySelector(".health-reminder-widget");
    const timerDisplay = document.getElementById("reminder-timer");
    if (healthWidget) {
      healthWidget.classList.remove("break-alert");
    }
    if (timerDisplay) {
      timerDisplay.classList.remove("break-alert");
    }
  }

  setFavicon(iconUrl) {
    // Remove existing favicon
    const existingFavicon = document.querySelector("link[rel*='icon']");
    if (existingFavicon) {
      existingFavicon.remove();
    }

    // Add new favicon
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.type = "image/svg+xml";
    favicon.href = iconUrl;
    document.head.appendChild(favicon);
  }

  showBrowserNotification() {
    // Check if notifications are supported and request permission
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        // Create notification
        const notification = new Notification("Time for a Health Break! 🚶", {
          body: "You've been sitting for 45 minutes. Take a 2-minute break to move around!",
          icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23ff4444'/><text x='50' y='60' text-anchor='middle' font-size='40' fill='white'>!</text></svg>",
          tag: "health-break",
          requireInteraction: true,
        });

        // Auto-close notification after 10 seconds if user doesn't interact
        setTimeout(() => {
          notification.close();
        }, 10000);
      } else if (Notification.permission !== "denied") {
        // Request permission
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            this.showBrowserNotification(); // Retry now that we have permission
          }
        });
      }
    }
  }

  showBreakReminder() {
    // Only show modal if not already shown and not currently on break
    const modal = document.getElementById("break-reminder-modal");
    if (!modal.classList.contains("hidden") || this.healthReminder.isOnBreak)
      return;

    // Start tab blinking animation
    this.startTabBlinking();

    // Add visual alert to the health reminder widget
    const healthWidget = document.querySelector(".health-reminder-widget");
    const timerDisplay = document.getElementById("reminder-timer");
    if (healthWidget) {
      healthWidget.classList.add("break-alert");
    }
    if (timerDisplay) {
      timerDisplay.classList.add("break-alert");
    }

    // Show the modal
    modal.classList.remove("hidden");

    // Play a gentle notification sound (if browser allows)
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjiN0fPOeSsFJHHDwcgELAAAVDVmKAoEAAAAcwBGVAAOAOAGcADwBQAA"
      );
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio errors (some browsers block autoplay)
      });
    } catch (e) {
      // Ignore audio errors
    }

    console.log("Break reminder shown - 45 minutes of sitting completed");
  }

  async startBreak() {
    const modal = document.getElementById("break-reminder-modal");
    modal.classList.add("hidden");

    // Stop tab blinking when break starts
    this.stopTabBlinking();

    // Stop the sitting timer to prevent conflicts
    if (this.healthReminder.sittingTimer) {
      clearInterval(this.healthReminder.sittingTimer);
      this.healthReminder.sittingTimer = null;
    }

    // Update global state to break phase with timer
    const now = Date.now();
    await chrome.storage.local.set({
      timerPhase: "break-active",
      phaseStartTime: now,
    });

    this.healthReminder.isOnBreak = true;
    const breakStartTime = now;

    console.log(
      "Break timer starting - break duration:",
      this.healthReminder.breakDuration
    );

    // Start break countdown
    this.healthReminder.breakTimer = setInterval(() => {
      const elapsed = Date.now() - breakStartTime;
      const remaining = Math.max(
        0,
        this.healthReminder.breakDuration - elapsed
      );

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      console.log("Break timer update - remaining:", timeString);

      // Update break countdown with animation
      if (this.animatedNumbers.breakCountdown) {
        this.animatedNumbers.breakCountdown.setValue(timeString);
      } else {
        const countdownElement = document.getElementById("break-countdown");
        if (countdownElement) {
          countdownElement.textContent = timeString;
        }
      }

      // Update reminder timer to show break countdown
      if (this.animatedNumbers.reminderTimer) {
        this.animatedNumbers.reminderTimer.setValue("BREAK " + timeString);
      } else {
        const timerElement = document.getElementById("reminder-timer");
        if (timerElement) {
          timerElement.textContent = "BREAK " + timeString;
          timerElement.style.color = "#ffffff"; // White color for black/white theme
        }
      }

      // End break after 2 minutes
      if (remaining <= 0) {
        this.endBreak();
      }
    }, 1000);

    // Update health tip during break
    const tipElement = document.getElementById("health-tip-text");
    if (tipElement) {
      tipElement.textContent =
        "Great! Take this time to walk, stretch, or step outside";
    }

    console.log("Break started - 2 minute timer active");
  }

  startBreakTimerFromSync(breakStartTime) {
    console.log("Timer debug - Starting break timer from sync");

    // Clear any existing break timer
    if (this.healthReminder.breakTimer) {
      clearInterval(this.healthReminder.breakTimer);
    }

    // Start break countdown from the given start time
    this.healthReminder.breakTimer = setInterval(() => {
      const elapsed = Date.now() - breakStartTime;
      const remaining = Math.max(
        0,
        this.healthReminder.breakDuration - elapsed
      );

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      console.log("Timer debug - Break timer showing:", timeString);

      // Update break countdown with animation
      if (this.animatedNumbers.breakCountdown) {
        this.animatedNumbers.breakCountdown.setValue(timeString);
      } else {
        const countdownElement = document.getElementById("break-countdown");
        if (countdownElement) {
          countdownElement.textContent = timeString;
        }
      }

      // Update main reminder timer to show break status
      if (this.animatedNumbers.reminderTimer) {
        this.animatedNumbers.reminderTimer.setValue("BREAK " + timeString);
      } else {
        const timerElement = document.getElementById("reminder-timer");
        if (timerElement) {
          timerElement.textContent = "BREAK " + timeString;
          timerElement.style.color = "#ffffff"; // White color for black/white theme
          console.log(
            "Timer debug - Updated main timer with:",
            "BREAK " + timeString
          );
        }
      }

      // Hide "I'm Back" button during break phase
      const restActions = document.getElementById("rest-actions");
      if (restActions) {
        restActions.style.display = "none";
      }

      // End break after duration
      if (remaining <= 0) {
        this.endBreak();
      }
    }, 1000);

    // Update health tip during break
    const tipElement = document.getElementById("health-tip-text");
    if (tipElement) {
      tipElement.textContent =
        "Great! Take this time to walk, stretch, or step outside";
    }
  }

  async skipBreak() {
    const modal = document.getElementById("break-reminder-modal");
    modal.classList.add("hidden");

    // Stop tab blinking when break is skipped
    this.stopTabBlinking();

    // Stop the sitting timer to prevent conflicts
    if (this.healthReminder.sittingTimer) {
      clearInterval(this.healthReminder.sittingTimer);
      this.healthReminder.sittingTimer = null;
    }

    // Update global state to rest phase
    await this.syncToRestPhase();

    console.log("Break skipped - will restart timer in 5 minutes");
  }

  async endBreak() {
    // Clear break timer
    if (this.healthReminder.breakTimer) {
      clearInterval(this.healthReminder.breakTimer);
      this.healthReminder.breakTimer = null;
    }

    // Update global state to rest phase
    await this.syncToRestPhase();

    console.log("Break completed - 5 minute rest period before next timer");
  }

  showRestState() {
    this.healthReminder.isOnBreak = false;
    this.healthReminder.isOnRest = true;

    // Update display
    if (this.animatedNumbers.reminderTimer) {
      this.animatedNumbers.reminderTimer.setValue("REST");
    } else {
      const timerElement = document.getElementById("reminder-timer");
      if (timerElement) {
        timerElement.textContent = "REST";
        timerElement.style.color = "#2196F3";
      }
    }

    const tipElement = document.getElementById("health-tip-text");
    if (tipElement) {
      tipElement.textContent =
        "Well done! Next sitting timer starts in 5 minutes";
    }

    // Show the "I'm Back" button during rest state
    const restActions = document.getElementById("rest-actions");
    if (restActions) {
      restActions.style.display = "block";
    }

    // Check for rest period completion
    chrome.storage.local.get(["phaseStartTime"]).then((result) => {
      if (result.phaseStartTime) {
        const elapsed = Date.now() - result.phaseStartTime;
        const remaining = this.healthReminder.restartDelay - elapsed;

        if (remaining <= 0) {
          this.startNewGlobalSession();
        } else {
          setTimeout(() => {
            this.startNewGlobalSession();
          }, remaining);
        }
      }
    });
  }

  // Fallback to local timer if global sync fails
  startLocalHealthReminder() {
    console.warn("Using local health reminder as fallback");
    this.healthReminder.globalStartTime = Date.now();
    this.startReminderDisplay();
  }

  updateDaysRemaining() {
    const now = new Date();
    const endOfYear = new Date(2025, 11, 31, 23, 59, 59, 999); // December 31, 2025
    const startOfYear = new Date(2025, 0, 1); // January 1, 2025

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

    // Health reminder modal controls
    document
      .getElementById("start-break")
      .addEventListener("click", () => this.startBreakPhase());
    document
      .getElementById("skip-break")
      .addEventListener("click", () => this.skipBreakPhase());

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
      card.target = "_blank";

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

    // Position and show the context menu
    contextMenu.style.left = `${event.pageX}px`;
    contextMenu.style.top = `${event.pageY}px`;
    contextMenu.classList.remove("hidden");

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
      this.shortcuts[shortcutIndex].name = newName;
      this.shortcuts[shortcutIndex].url = newUrl;

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
