// Popup script for StandUp.exe timer control
class TimerControlPopup {
  constructor() {
    this.timerToggle = document.getElementById("timer-toggle");
    this.statusIndicator = document.getElementById("status-indicator");
    this.statusText = document.getElementById("status-text");
    this.statusDescription = document.getElementById("status-description");
    this.toggleLabel = document.getElementById("toggle-label");
    this.disabledNotice = document.getElementById("disabled-notice");
    this.init();
  }

  async init() {
    await this.loadTimerState();
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.timerToggle) {
      this.timerToggle.addEventListener("change", (e) => {
        this.toggleTimer(e.target.checked);
      });
    }
  }

  async loadTimerState() {
    try {
      const result = await chrome.storage.local.get(["isWorkingMode"]);
      const isEnabled = result.isWorkingMode !== false; // Default to true
      this.updateUI(isEnabled);
    } catch (error) {
      console.error("Error loading timer state:", error);
      this.updateUI(true); // Default to enabled
    }
  }

  async toggleTimer(isEnabled) {
    try {
      // Save the new state
      await chrome.storage.local.set({ isWorkingMode: isEnabled });

      // Send message to background script to toggle working mode
      await chrome.runtime.sendMessage({
        action: "toggleWorkingMode",
        isActive: isEnabled,
      });

      // Update the UI
      this.updateUI(isEnabled);
    } catch (error) {
      console.error("Error toggling timer:", error);
      // Revert the toggle on error
      this.timerToggle.checked = !isEnabled;
    }
  }

  updateUI(isEnabled) {
    // Update toggle state
    this.timerToggle.checked = isEnabled;

    // Update status indicator
    if (isEnabled) {
      this.statusIndicator.classList.remove("disabled");
      this.statusIndicator.classList.add("enabled");
      this.statusText.textContent = "Active";
      this.statusDescription.textContent =
        "You'll receive health reminders every 45 minutes.";
      this.toggleLabel.textContent = "Timer Enabled";
      this.disabledNotice.style.display = "none";
    } else {
      this.statusIndicator.classList.remove("enabled");
      this.statusIndicator.classList.add("disabled");
      this.statusText.textContent = "Disabled";
      this.statusDescription.textContent =
        "Health reminders are currently turned off.";
      this.toggleLabel.textContent = "Timer Disabled";
      this.disabledNotice.style.display = "flex";
    }
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new TimerControlPopup();
});
