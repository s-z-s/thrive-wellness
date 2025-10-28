# Aegis - Your AI Wellness Companion (Chrome Extension)

**Version:** 1.0 (Hackathon MVP)
**Date:** October 24, 2025

## 1\. Introduction & Vision

**Vision:** To create a healthier and more productive work environment for desk workers by seamlessly integrating well-being into their daily digital workflow.

**Problem:** Desk jobs often lead to a sedentary lifestyle, causing physical ailments (back pain, eye strain), mental fatigue, burnout, and stress. Existing wellness tools can be intrusive or disconnected from work patterns.

**Solution:** Aegis is an intelligent Chrome extension acting as a proactive wellness companion. It uses on-device AI (Gemini Nano via the `LanguageModel` API) and browser events to provide timely, personalized suggestions for movement, focus, and mental resets, respecting user privacy.

## 2\. Key Features

  * **Pomodoro Timer:** Helps users focus with work/break cycles.
      * *UI Logic:* `ui.js` (start/stop/reset buttons, display updates)
      * *Core Logic:* `background.js` (interval management, time calculation, state changes)
      * *Configuration:* `config.js` (`pomodoroWorkMinutes`, `pomodoroBreakMinutes`)
  * **Desk Stretches:** A simple view with guided desk-friendly exercises.
      * *UI Logic:* `ui.js` (view switching, 'Done' button)
      * *Content:* `index.html` (text descriptions)
      * *Styling:* `style.css` (list item layout)
  * **Breathing Helper:** An animated guide for calming breathing exercises (Box Breathing pattern).
      * *UI Logic:* `ui.js` (view switching, starting/stopping animation, updating text/timer)
      * *Animation:* `style.css` (keyframes for circle scaling/color), `ui.js` (applying animation classes)
  * **ThriveBot AI Coach:** (Experimental - Requires Chrome Dev + Flags) An on-device AI chatbot for wellness questions.
      * *UI Logic:* `ui.js` (view switching, handling input, displaying messages)
      * *Core Logic:* `background.js` (checking AI availability, creating session via `LanguageModel`, sending prompts, receiving responses)
      * *API Dependency:* `LanguageModel` API (built into Chrome Dev)
  * **Thrive Garden (Gamification):** Visually tracks user progress by growing a virtual plant as activities are completed.
      * *UI Logic:* `ui.js` (rendering plant SVG based on level, updating count)
      * *State Management:* `background.js` (receives activity completion triggers), `ui.js` (updates count), `chrome.storage.local` (persistent storage)
  * **Proactive Notifications:** Periodically checks user activity and suggests breaks using AI (if available) or a default message.
      * *Core Logic:* `background.js` (uses `chrome.alarms` for scheduling, `chrome.idle` to check activity state, `LanguageModel` for AI message, `chrome.notifications` to display)
      * *Configuration:* `config.js` (notification timing and idle threshold)

## 3\. Technical Overview

  * **Platform:** Chrome Extension (Manifest V3)
  * **Languages:** HTML, CSS, JavaScript (Vanilla JS - No frameworks/libraries)
  * **Core Chrome APIs:**
      * `chrome.runtime`: Communication between UI and background, lifecycle events.
      * `chrome.storage.local`: Saving garden progress.
      * `chrome.alarms`: Scheduling periodic checks for notifications.
      * `chrome.idle`: Detecting user activity/inactivity.
      * `chrome.notifications`: Displaying break reminders.
  * **AI API (Experimental):**
      * `LanguageModel` API (Global object in compatible Chrome versions)
      * **Requirement:** Google Chrome **Dev** channel (v127+), specific flags enabled (`chrome://flags`), and the on-device model component downloaded (`chrome://components`). See Setup section.

## 4\. File Structure & Code Location

```
aegis-extension/
│
├── icons/                  # Extension icons (16x16, 48x48, 128x128 PNGs)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── manifest.json           # Extension configuration, permissions, CSP
├── index.html              # HTML structure for the popup UI (all views)
├── style.css               # CSS rules for styling the UI
├── ui.js                   # Frontend JavaScript: Handles UI events, view switching, DOM updates, communication with background.js
├── background.js           # Service Worker: Handles core logic (timer, AI, alarms, idle checks, notifications), communication with ui.js
├── config.js               # Configurable timings for timer and notifications
└── README.md               # This file
```

## 5\. Configuration

Timings for the Pomodoro timer and proactive notifications can be adjusted for testing by editing the values (in minutes) inside `config.js`. **Remember to reload the extension** in `chrome://extensions` after making changes.

## 6\. Setup & Installation (for AI Features)

1.  **Use Chrome Dev:** Install and open the Google Chrome **Dev** browser (v127+).
2.  **Enable Flags:** Go to `chrome://flags` in Chrome Dev:
      * Enable `#prompt-api-for-gemini-nano` (or search "Prompt API").
      * Enable `#optimization-guide-on-device-model` (or search "Optimization Guide").
      * Enable any other related "Optimization Guide" flags.
3.  **Relaunch** Chrome Dev.
4.  **Download Model:** Go to `chrome://components`, find "Optimization Guide On-Device Model", and click "Check for update". Wait for it to download/update.
5.  **Load Extension:** Go to `chrome://extensions`, enable "Developer mode", click "Load unpacked", and select the `aegis-extension` folder.
6.  **Troubleshooting:** If AI still doesn't work, ensure all flags are enabled, the component is updated, and try removing/re-loading the extension. Check the background script console for errors (`chrome://extensions` -\> Aegis Details -\> Service worker link).

## 7\. Future Enhancements

  * More diverse stretch/exercise options with visuals.
  * Different breathing techniques.
  * More sophisticated AI context (e.g., understanding current website category via Topics API).
  * User settings page (e.g., custom timer durations, notification frequency).
  * More complex gamification (streaks, unlocking items).