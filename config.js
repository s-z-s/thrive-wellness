// --- Thrive Wellness Configuration ---
// Edit these values (in minutes) for testing purposes.
// Reload the extension in chrome://extensions after changing.

// ** Use 'var' for service worker global scope compatibility with importScripts **
var config = {
    // Pomodoro Timer Settings (in minutes)
    pomodoroWorkMinutes: 0.1,    // WORK SESSION: Default duration for a work session (0.2 = 12 seconds for testing)
    pomodoroBreakMinutes: 0.1,     // BREAK SESSION: Default duration for a break session (0.1 = 6 seconds for testing)

    // Break Timer Modal Settings
    breakTimerEnabled: true,     // Enable/disable break timer modal
    breakTimerAutoStart: true,   // Auto-start break timer when work session ends
    breakTimerShowModal: true,   // Show modal overlay during break

    // Proactive Notification Settings
    notificationInitialDelayMinutes: 0.1, // How long to wait after browser start/install (Low for testing)
    notificationPeriodMinutes: 0.1,       // How often to check (Low for testing)
    notificationIdleThresholdMinutes: 0.25, // How many minutes of *continuous* inactivity counts as "idle" (Minimum 15 seconds)
};
// Log to confirm execution
//  console.log("Aegis: config.js executed, var config declared.");