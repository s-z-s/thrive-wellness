// --- Thrive Wellness Configuration ---
// Edit these values (in minutes) for testing purposes.
// Reload the extension in chrome://extensions after changing.

// ** Use 'var' for service worker global scope compatibility with importScripts **
var config = {
    // Pomodoro Timer Settings (in minutes)
    pomodoroWorkMinutes: 25,     // WORK SESSION: Default duration for a work session (25 minutes)
    pomodoroBreakMinutes: 5,     // BREAK SESSION: Default duration for a break session (5 minutes)

    // Break Timer Modal Settings
    breakTimerEnabled: true,     // Enable/disable break timer modal
    breakTimerAutoStart: true,   // Auto-start break timer when work session ends
    breakTimerShowModal: true,   // Show modal overlay during break

    // Proactive Notification Settings
    notificationInitialDelayMinutes: 30,  // How long to wait after browser start/install (30 minutes)
    notificationPeriodMinutes: 30,        // How often to check (30 minutes) for proactive activity
    notificationIdleThresholdMinutes: 15, // How many minutes of *continuous* inactivity counts as "idle"

    // AI Content Extraction Settings
    minContentLength: 50,        // Minimum content length required for AI analysis
    maxContentLength: 1000,      // Maximum content length to send to AI (to avoid token limits)
    contentFallbackThreshold: 150, // Minimum content length from main element before falling back to body

    // Settings Defaults (for UI initialization)
    defaultWellnessReminders: true,      // Default state for wellness reminders
    defaultWorkSessionReminder: true,    // Default state for work session reminder button
    defaultSoundNotifications: true,     // Default state for sound notifications
};
// Log to confirm execution