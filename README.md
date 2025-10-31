# Thrive Wellness - Your AI Wellness Companion (Chrome Extension)

**Version:** 2.1 (Smart Notifications & Settings)
**Date:** October 31, 2025

## 1\. Introduction & Vision

**Vision:** To create a healthier and more productive work environment for desk workers by seamlessly integrating well-being into their daily digital workflow through gamification and AI-powered guidance.

**Problem:** Desk jobs often lead to a sedentary lifestyle, causing physical ailments (back pain, eye strain), mental fatigue, burnout, and stress. Existing wellness tools can be intrusive or disconnected from work patterns.

**Solution:** Thrive Wellness is an intelligent Chrome extension acting as a proactive wellness companion. It combines Pomodoro timers, gamified progress tracking, AI coaching, and guided wellness exercises to create an engaging and effective wellness routine that respects user privacy.

## 2\. Key Features

   * **Enhanced Pomodoro Timer:** Advanced focus timer with work/break cycles, completion overlays, and badge notifications.
       * *UI Logic:* `ui.js` (start/stop/reset buttons, display updates, overlay management, timer badge display)
       * *Core Logic:* `background.js` (interval management, time calculation, state changes, alarm sound playback)
       * *Configuration:* `config.js` (`pomodoroWorkMinutes`, `pomodoroBreakMinutes`)
       * *Features:* Real-time badge updates, completion sound alerts, automatic session transitions
   * **Interactive Desk Stretches:** 10 guided desk-friendly exercises with video demonstrations and completion tracking.
       * *UI Logic:* `ui.js` (view switching, navigation, 'Done' button, stretch completion modals)
       * *Content:* `videos/` (MP4 video files), `ui.js` (stretch data array with titles and descriptions)
       * *Styling:* `style.css` (responsive video layout, navigation controls)
       * *Features:* Progress tracking, activity point rewards, confirmation modals for early completion
   * **Advanced Breathing Helper:** Animated Box Breathing guide with visual feedback, audio cues, and cycle tracking.
       * *UI Logic:* `ui.js` (view switching, starting/stopping animation, updating text/timer, cycle completion)
       * *Animation:* `style.css` (keyframes for circle scaling/color transitions), `ui.js` (4-phase sequence management)
       * *Features:* 4-phase breathing cycle (inhale/hold/exhale/hold), automatic progression, activity rewards
   * **Thrive Wellness Coach:** AI-powered chatbot for personalized wellness guidance with markdown formatting.
       * *UI Logic:* `ui.js` (view switching, handling input, displaying messages, follow-up questions, thinking indicators)
       * *Core Logic:* `background.js` (checking AI availability, creating session via `LanguageModel`, sending prompts, receiving responses)
       * *API Dependency:* `LanguageModel` API (built into Chrome Dev with on-device model)
       * *Features:* Nested JSON response parsing, clickable follow-up suggestions, markdown rendering, conversation history
   * **7-Level Thrive Tree (Advanced Gamification):**
       * Progressive level system requiring increasing activities (1->5→10→15→25→45→75+)
       * 7 unique animated SVG illustrations with CSS animations and effects
       * Level-specific encouraging messages and progress indicators
       * Grow animations triggered on level advancement with bounce effects
       * *UI Logic:* `ui.js` (rendering plant SVG based on level, updating count, animation triggers, progress bars)
       * *State Management:* `background.js` (receives activity completion triggers), `ui.js` (updates count), `chrome.storage.local` (persistent storage)
       * *Features:* Visual progress tracking, level-up celebrations, motivational messages
   * **Smart Proactive Notifications:** AI-powered break suggestions with activity monitoring, contextual awareness, and action buttons.
       * *Core Logic:* `background.js` (uses `chrome.alarms` for scheduling, `chrome.idle` to check activity state, `LanguageModel` for AI message/action generation, `chrome.notifications` to display, `chrome.scripting` for overlay injection)
       * *Configuration:* `config.js` (notification timing, idle threshold, content extraction settings)
       * *Features:* Content-aware suggestions, proactive overlay popups with action buttons (View Stretches/Start Breathing), idle state detection, customizable timing, smart content extraction from web pages
   * **Comprehensive Settings Panel:** User-customizable preferences for notifications, sounds, and UI elements.
       * *UI Logic:* `ui.js` (settings view, toggle switches, save/load functionality)
       * *State Management:* `background.js` (settings persistence, real-time application), `chrome.storage.local` (cross-session storage)
       * *Configuration:* `config.js` (default settings values)
       * *Features:* Wellness reminders toggle, work session reminder button toggle, sound notifications toggle, conditional UI elements, immediate effect application
   * **Activity History & Analytics:** Comprehensive tracking with today's summary, charts and detailed activity logs.
       * *UI Logic:* `ui.js` (tab switching, chart rendering, table population, data visualization, today's activities summary)
       * *Data Management:* `background.js` (activity recording, storage management)
       * *Visualization:* Chart.js integration for weekly/monthly trend analysis
       * *Features:* Today's activity summary (work sessions, desk stretches, breathing sessions), work sessions, break sessions, stretch completions, breathing cycles, interactive charts, detailed tables
   * **Completion Popups & Overlays:** Dedicated popup windows and overlays for session completions with action buttons.
       * *Files:* `completion-popup.html`, `completion-popup.js`, `ui.js` (overlay management)
       * *Features:* Timer display, break start/skip options, activity rewards, sound alerts, auto-dismiss
   * **Audio Management:** Offscreen document audio playback for reliable sound notifications.
       * *Files:* `offscreen.html`, `offscreen.js`
       * *Features:* Background audio playback, alarm sounds, HTML5 audio API integration

## 3\. Technical Overview

  * **Platform:** Chrome Extension (Manifest V3)
  * **Languages:** HTML, CSS, JavaScript (Vanilla JS - No frameworks/libraries)
  * **Architecture:** Service Worker + Popup UI pattern
  * **Core Chrome APIs:**
      * `chrome.runtime`: Communication between UI and background, lifecycle events.
      * `chrome.storage.local`: Saving tree progress, user preferences, and settings.
      * `chrome.alarms`: Scheduling periodic checks for notifications.
      * `chrome.idle`: Detecting user activity/inactivity.
      * `chrome.notifications`: Displaying break reminders.
      * `chrome.windows`: Managing completion popup windows.
      * `chrome.tabs`: Permission for extension functionality.
      * `chrome.scripting`: Injecting content scripts for overlay display and content extraction.
      * `chrome.action`: Managing extension popup and badge display.
  * **AI Integration:**
      * `LanguageModel` API (Global object in compatible Chrome versions)
      * Advanced JSON parsing for nested AI responses
      * Follow-up question suggestions with clickable UI elements
      * **Requirement:** Google Chrome **Dev** channel (v127+), specific flags enabled (`chrome://flags`), and the on-device model component downloaded (`chrome://components`). See Setup section.
  * **UI Framework:** Custom CSS with Tailwind-inspired utility classes
  * **Animations:** CSS keyframes for smooth transitions and gamification effects
  * **Audio:** HTML5 Audio API for timer completion sounds
  * **Video:** HTML5 Video elements for stretch demonstrations

## 4\. File Structure & Code Location

```
thrive-wellness-extension/
│
├── icons/                  # Extension icons (16x16, 48x48, 128x128 PNGs)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
│
├── videos/                 # MP4 video files for desk stretches
│   ├── stretch-neck-side.mp4
│   ├── stretch-neck-rotation.mp4
│   ├── stretch-shoulder-roll.mp4
│   ├── stretch-overhead-reach.mp4
│   ├── stretch-triceps.mp4
│   ├── stretch-wrist-flex-ext.mp4
│   ├── stretch-finger.mp4
│   ├── stretch-torso-twist.mp4
│   ├── stretch-upper-back.mp4
│   └── stretch-chest-opener.mp4
│
├── manifest.json           # Extension configuration, permissions, CSP
├── index.html              # HTML structure for the popup UI (all views)
├── style.css               # CSS rules for styling the UI with animations
├── ui.js                   # Frontend JavaScript: Handles UI events, view switching, DOM updates, communication with background.js
├── background.js           # Service Worker: Handles core logic (timer, AI, alarms, idle checks, notifications), communication with ui.js
├── config.js               # Configurable timings for timer and notifications
├── completion-popup.html   # Dedicated popup for session completions
├── completion-popup.js     # Logic for completion popup interactions
├── offscreen.html          # Offscreen document for audio playback
├── offscreen.js            # Audio management in offscreen context
├── alarm.wav               # Audio file for timer completion sounds
├── tailwind-config.js      # Tailwind CSS configuration (unused)
├── tailwind.css            # Tailwind CSS (unused)
├── .gitignore              # Git ignore rules for Chrome extension development
└── README.md               # This documentation file
```

## 5\. Configuration

The extension includes comprehensive configuration options in `config.js`:

### Timer & Notification Settings
* `pomodoroWorkMinutes`: Work session duration (default: 25 minutes)
* `pomodoroBreakMinutes`: Break session duration (default: 5 minutes)
* `notificationInitialDelayMinutes`: Initial delay before first notification (default: 30 minutes)
* `notificationPeriodMinutes`: Interval between notifications (default: 30 minutes)
* `notificationIdleThresholdMinutes`: Inactivity threshold for notifications (default: 15 minutes)

### AI Content Extraction Settings
* `minContentLength`: Minimum webpage content length for AI analysis (default: 50 characters)
* `maxContentLength`: Maximum content length sent to AI (default: 1000 characters)
* `contentFallbackThreshold`: Minimum main content length before falling back to body text (default: 150 characters)

### UI & Behavior Settings
* `overlayAutoDismissSeconds`: How long notification overlays stay visible (default: 8 seconds)
* `defaultWellnessReminders`: Default state for wellness reminder notifications (default: true)
* `defaultWorkSessionReminder`: Default state for work session reminder button (default: true)
* `defaultSoundNotifications`: Default state for sound notifications (default: true)

**Remember to reload the extension** in `chrome://extensions` after making configuration changes.

## 6\. Setup & Installation (for AI Features)

1.  **Use Chrome Dev:** Install and open the Google Chrome browser (v127+).
2.  **Enable Flags:** Go to `chrome://flags` in Chrome:
      * Enable `#prompt-api-for-gemini-nano` (or search "Prompt API").
      * Enable `#optimization-guide-on-device-model` (or search "Optimization Guide").
      * Enable any other related "Optimization Guide" flags.
3.  **Relaunch** Chrome.
4.  **Download Model:** Go to `chrome://components`, find "Optimization Guide On-Device Model", and click "Check for update". Wait for it to download/update.
5.  **Load Extension:** Go to `chrome://extensions`, enable "Developer mode", click "Load unpacked", and select the `aegis-extension` folder.
6.  **Troubleshooting:** If AI still doesn't work, ensure all flags are enabled, the component is updated, and try removing/re-loading the extension. Check the background script console for errors (`chrome://extensions` -\> Thrive Details -\> Service worker link).

## 7\. Tree Level Progression

The Thrive Tree implements a progressive difficulty system to encourage long-term engagement:

| Level | Activities Required | Cumulative Total | Plant Stage |
|-------|-------------------|------------------|-------------|
| 1 | 5 | 5 | Seed |
| 2 | 5 | 10 | Sprout |
| 3 | 5 | 15 | Small Plant |
| 4 | 10 | 25 | Medium Plant |
| 5 | 20 | 45 | Large Plant |
| 6 | 30 | 75 | Full Tree |
| 7 | - | 75+ | Flowering Tree |

**Activities include:** Completing Pomodoro sessions, finishing breathing exercises, and completing desk stretches.

## 8\. Recent Updates (v2.1)

### Smart Action Button Notifications
* **AI-Powered Action Recommendations:** Proactive notifications now include contextual action buttons (View Stretches/Start Breathing) based on AI analysis of user activity
* **Smart Content Extraction:** Enhanced webpage content analysis using semantic HTML prioritization, noise filtering, and fallback strategies for better AI context
* **Dynamic Overlay System:** Notification overlays with conditional action buttons that respect user settings and timer state

### Comprehensive Settings Panel
* **Wellness Reminders Toggle:** Enable/disable all proactive notifications
* **Work Session Reminder Button:** Control visibility of "Start Work Session" button in notifications (auto-enabled with wellness reminders)
* **Sound Notifications Toggle:** Control timer completion sounds and audio cues
* **Persistent Settings:** All preferences saved across browser sessions with immediate effect application
* **Conditional UI:** Settings dynamically show/hide based on other preferences

### Enhanced Configuration System
* **Centralized Config:** All key settings moved to `config.js` with descriptive comments
* **Production Values:** Timer and notification timings set to production-ready defaults
* **AI Content Settings:** Configurable parameters for content extraction and analysis
* **UI Behavior Settings:** Customizable overlay timing and default preferences

## 9\. Future Enhancements

   * **Advanced AI Features:** Integration with web activity analysis, personalized wellness plans
   * **Social Features:** Wellness challenges, progress sharing, community support
   * **Extended Gamification:** Achievement badges, streak tracking, unlockable themes
   * **Health Integration:** Connection with fitness trackers, sleep data, nutrition apps
   * **Accessibility:** Voice guidance, screen reader support, customizable UI themes
   * **Cross-Platform:** Mobile app companion, web dashboard
   * **Analytics:** Usage insights, wellness trend tracking, personalized recommendations