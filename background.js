// Simplified background script: hourly notification + sound (no complex logic)
const ALARM_NAME = "hourly_health_reminder";
const PERIOD_MINUTES = 60; // 1 hour

async function createHourlyAlarm() {
  // Clear existing to avoid duplicates
  await chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: PERIOD_MINUTES, // first reminder after 1 hour
    periodInMinutes: PERIOD_MINUTES,
  });
  console.log("Hourly health reminder alarm scheduled every", PERIOD_MINUTES, "minutes");
}

function fireReminder() {
  const id = `hourly-${Date.now()}`;
  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "icons/icon48.png",
    title: "Time to Move!",
    message: "Stand up, stretch, drink water, rest your eyes.",
    priority: 2,
    requireInteraction: false,
  });

  // Simple sound using TTS (works in service worker) if permission available
  if (chrome.tts) {
    try {
      chrome.tts.speak("Time to move. Stand up and stretch.", { enqueue: false, rate: 1.0 });
    } catch (e) {
      console.warn("TTS failed", e);
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  createHourlyAlarm();
  // Optional immediate first notification on install
  fireReminder();
});

chrome.runtime.onStartup.addListener(() => {
  createHourlyAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    fireReminder();
  }
});

// Allow manual trigger from other parts (if ever needed)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.action === "triggerHourlyReminderNow") {
    fireReminder();
  }
});
