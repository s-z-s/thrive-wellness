// --- Thrive Wellness Background Service Worker (Final Config Load Attempt) ---
'use strict';

// *No initial config declaration here*

// Attempt to load config.js. It MUST declare `var config`.
try {
    importScripts('config.js');
    // If successful, 'config' is now globally available from config.js
    if (typeof config === 'undefined') {
        // This case should ideally not happen if config.js is correct
        console.error("Aegis: config.js loaded but 'config' variable is missing. Using defaults.");
        // Define config here ONLY if import succeeded but var was missing
        var config = { // Use 'var' to ensure it's in the same scope importScripts expects
            pomodoroWorkMinutes: 25, pomodoroBreakMinutes: 5,
            notificationInitialDelayMinutes: 30, notificationPeriodMinutes: 60,
            notificationIdleThresholdMinutes: 15,
        };
    } else {
         //  console.log("Aegis: Successfully loaded config.js. Using config:", config);
    }
} catch (e) {
    // This catches errors ONLY if importScripts itself fails (e.g., file not found, syntax error)
    console.error("Aegis: Failed to import or parse config.js. Using fallback defaults.", e);
    // Define config here ONLY if importScripts failed
    var config = { // Use 'var' to match the scope expected if import worked
        pomodoroWorkMinutes: 25, pomodoroBreakMinutes: 5,
        notificationInitialDelayMinutes: 30, notificationPeriodMinutes: 60,
        notificationIdleThresholdMinutes: 15,
    };
}

// --- Timer State (uses the 'config' variable defined above) ---
let timerInterval = null;
// Ensure config exists before calculating these (should always exist now)
const workTimeSeconds = (config.pomodoroWorkMinutes || 25) * 60;
const breakTimeSeconds = (config.pomodoroBreakMinutes || 5) * 60;
console.log("BG: Config loaded - workTimeSeconds:", workTimeSeconds, "breakTimeSeconds:", breakTimeSeconds);
let timerState = {
    isRunning: false, time: workTimeSeconds, isBreak: false,
    workTime: workTimeSeconds, breakTime: breakTimeSeconds,
};

// --- Pending Timer Completion State ---
let pendingTimerCompletion = null;
let alarmPlayed = false;

// --- AI State ---
let aiSession = null;
let aiModelReady = false;

// --- Settings State ---
let settings = {
    wellnessReminders: config.defaultWellnessReminders,
    workSessionReminder: config.defaultWorkSessionReminder,
    soundNotifications: config.defaultSoundNotifications
};

// --- Utility Functions ---
function formatTime(seconds) { /* ... keep ... */
     const m = Math.floor(seconds / 60); const s = seconds % 60;
     return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
 }

// --- Settings Functions ---
function applySettings(newSettings) {
    settings = { ...settings, ...newSettings };
    console.log("Thrive Wellness: Applied settings:", settings);

    // Apply wellness reminders setting
    if (settings.wellnessReminders) {
        // Ensure alarm is set
        chrome.alarms.get('proactiveNotification', (alarm) => {
            if (!alarm) {
                chrome.alarms.create('proactiveNotification', {
                    delayInMinutes: config.notificationInitialDelayMinutes,
                    periodInMinutes: config.notificationPeriodMinutes
                });
                console.log("Thrive Wellness: Wellness reminders enabled - alarm created");
            }
        });
    } else {
        // Clear alarm if reminders are disabled
        chrome.alarms.clear('proactiveNotification');
        console.log("Thrive Wellness: Wellness reminders disabled - alarm cleared");
    }
}

function loadSettings() {
    chrome.storage.local.get('thrive-settings', (data) => {
        if (data['thrive-settings']) {
            settings = { ...settings, ...data['thrive-settings'] };
            applySettings(settings);
            console.log("Thrive Wellness: Settings loaded from storage:", settings);
        } else {
            // First time - apply defaults
            applySettings(settings);
        }
    });
}
function sendMessageToPopup(message) { /* ... keep ... */
     chrome.runtime.sendMessage(message, (response) => {
         if (chrome.runtime.lastError && chrome.runtime.lastError.message !== "The message port closed before a response was received.") {
              console.warn("Aegis: sendMessageToPopup error:", chrome.runtime.lastError.message);
         }
     });
 }

async function openPopupAndSendMessage(message) {
     try {
         // Check if we're in an extension context that supports popup opening
         if (typeof chrome !== 'undefined' && chrome.action && chrome.action.openPopup) {
             //  console.log("Aegis: Attempting to open popup...");
             await chrome.action.openPopup();
             // Small delay to ensure popup is ready
             setTimeout(() => {
                 // Instead of sending message, directly call the function when popup opens
                 if (message.command === 'showTimerCompletionOverlay') {
                     // The popup will handle showing the overlay and playing sound
                     //  console.log("Aegis: Popup opened for timer completion");
                 }
             }, 100);
         } else {
             console.warn("Aegis: Popup opening not supported in this context");
         }
     } catch (e) {
         console.warn("Aegis: Could not open popup:", e);
     }
 }
function showNotification(id, title, message) { /* ... keep ... */
     chrome.notifications.create(id, { type: 'basic', iconUrl: 'icons/icon128.png', title: title, message: message, priority: 2 });
 }
async function playAlarmSound() {
      // Check settings before playing sound
      if (!settings.soundNotifications) {
          console.log("Thrive Wellness: Sound notifications disabled, skipping alarm sound");
          return;
      }

      //  console.log("Aegis: Attempting to play alarm sound via offscreen document...");

      try {
          // Create offscreen document if it doesn't exist
          const existingContexts = await chrome.runtime.getContexts({
              contextTypes: ['OFFSCREEN_DOCUMENT']
          });

          let offscreenDocument = existingContexts.find(c => c.documentUrl?.endsWith('offscreen.html'));

          if (!offscreenDocument) {
              //  console.log("Aegis: Creating offscreen document for audio playback");
              await chrome.offscreen.createDocument({
                  url: 'offscreen.html',
                  reasons: ['AUDIO_PLAYBACK'],
                  justification: 'Play alarm sound when Pomodoro timer completes'
              });
              //  console.log("Aegis: Offscreen document created");
          }

          // Send message to offscreen document to play audio
          const response = await chrome.runtime.sendMessage({
              action: 'playAlarm'
          });

          if (response?.success) {
              //  console.log("Aegis: Alarm played via offscreen document");
          } else {
              console.warn("Aegis: Offscreen document failed to play alarm");
              // Fallback to system beep
              playSystemBeep();
          }

      } catch (e) {
          console.warn("Aegis: Offscreen document audio failed:", e);
          // Fallback to system beep
          playSystemBeep();
      }
  }

function playGeneratedBeep() {
     //  console.log("Aegis: Playing generated beep as fallback");

     // Create a simple beep sound using Web Audio API
     // Note: AudioContext in service workers may have restrictions
     try {
         // Use a more compatible approach for service workers
         if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
             const AudioCtx = window.AudioContext || window.webkitAudioContext;
             const audioContext = new AudioCtx();

             // Resume context if suspended (required by some browsers)
             if (audioContext.state === 'suspended') {
                 //  console.log("Aegis: AudioContext suspended, resuming...");
                 audioContext.resume().then(() => {
                     //  console.log("Aegis: AudioContext resumed, playing beep");
                     playBeep(audioContext);
                 }).catch((e) => {
                     console.warn("Aegis: Failed to resume AudioContext:", e);
                     playFallbackBeep();
                 });
             } else {
                 //  console.log("Aegis: AudioContext ready, playing beep");
                 playBeep(audioContext);
             }
         } else {
             console.warn("Aegis: Web Audio API not supported");
             // Fallback: try to play a data URL beep
             playFallbackBeep();
         }
     } catch (e) {
         console.warn("Aegis: Could not play generated beep:", e);
         // Fallback beep
         playFallbackBeep();
     }
 }

function playBeep(audioContext) {
     //  console.log("Aegis: Creating beep with AudioContext");

     try {
         const oscillator = audioContext.createOscillator();
         const gainNode = audioContext.createGain();

         oscillator.connect(gainNode);
         gainNode.connect(audioContext.destination);

         oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // Frequency in Hz
         oscillator.type = 'sine'; // Waveform type

         gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Volume
         gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5); // Fade out

         oscillator.start(audioContext.currentTime);
         oscillator.stop(audioContext.currentTime + 0.5); // Duration 0.5 seconds

         //  console.log("Aegis: Beep scheduled to play");
     } catch (e) {
         console.warn("Aegis: Error creating beep:", e);
     }
 }

function playFallbackBeep() {
     //  console.log("Aegis: Playing fallback beep");

     // Create a simple beep using data URL
     try {
         const audio = new Audio();
         // Generate a simple beep sound as data URL (1kHz, 0.5s)
         const sampleRate = 44100;
         const duration = 0.5;
         const numSamples = sampleRate * duration;
         const buffer = new ArrayBuffer(44 + numSamples * 2);
         const view = new DataView(buffer);

         // WAV header
         const writeString = (offset, string) => {
             for (let i = 0; i < string.length; i++) {
                 view.setUint8(offset + i, string.charCodeAt(i));
             }
         };

         writeString(0, 'RIFF');
         view.setUint32(4, 36 + numSamples * 2, true);
         writeString(8, 'WAVE');
         writeString(12, 'fmt ');
         view.setUint32(16, 16, true);
         view.setUint16(20, 1, true);
         view.setUint16(22, 1, true);
         view.setUint32(24, sampleRate, true);
         view.setUint32(28, sampleRate * 2, true);
         view.setUint16(32, 2, true);
         view.setUint16(34, 16, true);
         writeString(36, 'data');
         view.setUint32(40, numSamples * 2, true);

         // Generate sine wave samples
         for (let i = 0; i < numSamples; i++) {
             const sample = Math.sin(2 * Math.PI * 1000 * i / sampleRate) * 0.3;
             view.setInt16(44 + i * 2, sample * 32767, true);
         }

         audio.src = 'data:audio/wav;base64,' + btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
         audio.volume = 0.8;
         const playPromise = audio.play();
         if (playPromise !== undefined) {
             playPromise.then(() => {
                 //  console.log("Aegis: Fallback beep played successfully");
             }).catch(e => {
                 console.warn("Fallback beep failed:", e);
             });
         }
     } catch (e) {
         console.warn("Fallback beep creation failed:", e);
     }
 }

function showProactivePopupOverlay(title, message) {
     // Inject content script to show overlay on the active tab
     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         if (tabs[0] && tabs[0].id) {
             chrome.scripting.executeScript({
                 target: { tabId: tabs[0].id },
                 func: injectProactiveOverlay,
                 args: [title, message]
             }).catch(e => {
                 console.warn("Aegis: Failed to inject proactive overlay:", e);
             });
         }
     });
 }

function injectProactiveOverlay(title, message, aiAction, showWorkSessionButton) {
    // This function runs in the context of the webpage

    // Remove any existing overlay first
    const existing = document.getElementById('thrive-proactive-overlay');
    if (existing) existing.remove();

    // --- 1. Create AI Action Button HTML ---
    let aiButtonHTML = '';
    if (aiAction === 'stretches') {
        aiButtonHTML = `<button class="thrive-overlay-action-btn stretches" data-action="stretches">
                          View Stretches
                        </button>`;
    } else if (aiAction === 'breathing') {
        aiButtonHTML = `<button class="thrive-overlay-action-btn stretches" data-action="breathing">
                          Guided Breathing
                        </button>`;
    }

    // --- 2. Create Pomodoro Button HTML (if work session reminder is enabled AND timer is NOT running) ---
    let pomodoroButtonHTML = '';
    if (showWorkSessionButton) {
        pomodoroButtonHTML = `<button class="thrive-overlay-action-btn pomodoro-start" data-action="startTimer">
                                Start Work Session
                              </button>`;
    }

    // --- 3. Create Overlay ---
    const overlay = document.createElement('div');
    overlay.id = 'thrive-proactive-overlay';
    overlay.innerHTML = `
        <div class="thrive-overlay-content">
            <div class="thrive-overlay-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                   <path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5.054a11.955 11.955 0 01-1.439 6.273.957.957 0 00-.024.083l-.001.002.001.002.001.003c.003.006.006.012.01.018a13.481 13.481 0 005.105 5.093 13.442 13.442 0 004.184 1.558.96.96 0 00.08.006l.004.001.005-.001.002-.001a13.4 13.4 0 004.18-1.557 13.475 13.475 0 005.105-5.093c.004-.006.007-.012.01-.018l.001-.003.001-.002-.001-.002a.957.957 0 00-.024-.083A11.955 11.955 0 0117.834 5.054 11.954 11.954 0 0110 1.944zM9 11a1 1 0 112 0v2a1 1 0 11-2 0v-2zM9 8a1 1 0 000 2h.01a1 1 0 100-2H9z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="thrive-overlay-text">
                <h4>${title}</h4>
                <p>${message}</p>
                <div class="thrive-overlay-buttons">
                    ${aiButtonHTML}
                    ${pomodoroButtonHTML}
                </div>
            </div>
            <button class="thrive-overlay-dismiss">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                   <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </button>
        </div>
    `;

    // --- 4. Add Styles (with new button styles) ---
    const style = document.createElement('style');
    style.textContent = `
        #thrive-proactive-overlay {
            position: fixed; bottom: 20px; right: 20px;
            max-width: 380px; z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: thriveSlideIn 0.3s ease-out; pointer-events: auto;
        }
        @keyframes thriveSlideIn { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
        .thrive-overlay-content {
            background-color: #ffffff; border-radius: 12px; padding: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15); border: 1px solid #e5e7eb;
            display: flex; align-items: flex-start; gap: 12px; position: relative;
        }
        .thrive-overlay-icon {
            width: 32px; height: 32px; background-color: #78A193; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: white; flex-shrink: 0;
        }
        .thrive-overlay-icon svg { width: 16px; height: 16px; }
        .thrive-overlay-text { flex: 1; min-width: 0; }
        .thrive-overlay-text h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1f2937; }
        .thrive-overlay-text p { margin: 0 0 12px 0; font-size: 13px; color: #6b7280; line-height: 1.4; }

        .thrive-overlay-buttons {
            display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-start;
        }
        .thrive-overlay-action-btn {
            border: 1px solid #d1d5db; background-color: #f9fafb; color: #374151;
            padding: 6px 10px; border-radius: 6px; font-size: 12px;
            font-weight: 500; cursor: pointer; display: inline-flex;
            align-items: center; gap: 4px; transition: all 0.2s ease;
            white-space: nowrap;
        }
        .thrive-overlay-action-btn:hover { background-color: #f3f4f6; border-color: #adb5bd; }

        /* AI Action Button Styles */
        .thrive-overlay-action-btn.stretches { border-color: #78A193; color: #78A193; }
        .thrive-overlay-action-btn.stretches:hover { background-color: #78A193; color: white; }
        .thrive-overlay-action-btn.breathing { border-color: #60a5fa; color: #60a5fa; }
        .thrive-overlay-action-btn.breathing:hover { background-color: #60a5fa; color: white; }

        /* New Pomodoro Button Style (Primary) */
        .thrive-overlay-action-btn.pomodoro-start {
            background-color: #78A193;
            border-color: #78A193;
            color: white;
        }
        .thrive-overlay-action-btn.pomodoro-start:hover {
            background-color: #6a9083; /* A bit darker */
            border-color: #6a9083;
        }

        .thrive-overlay-dismiss {
            background: none; border: none; padding: 4px; cursor: pointer; color: #9ca3af;
            border-radius: 4px; display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: all 0.2s ease;
        }
        .thrive-overlay-dismiss:hover { background-color: #f3f4f6; color: #6b7280; }
        .thrive-overlay-dismiss svg { width: 14px; height: 14px; }
    `;

    // --- 5. Add to Page and Attach Listeners ---
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    // Dismiss Listener
    overlay.querySelector('.thrive-overlay-dismiss')?.addEventListener('click', () => {
        overlay.remove(); style.remove();
    });

    // Action Button Listeners (using event delegation)
    overlay.querySelector('.thrive-overlay-buttons')?.addEventListener('click', (e) => {
        const target = e.target.closest('.thrive-overlay-action-btn');
        if (!target) return;

        const action = target.dataset.action;

        if (action === 'stretches' || action === 'breathing') {
            chrome.runtime.sendMessage({ command: 'openAppView', view: action });
        } else if (action === 'startTimer') {
            chrome.runtime.sendMessage({ command: 'startTimerFromOverlay' });
        }

        overlay.remove(); style.remove();
    });

    // Auto-dismiss after configured seconds
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            overlay.remove(); style.remove();
        }
    }, config.overlayAutoDismissSeconds * 1000);
}
function updateTimerBadge() {
     try {
         if (timerState.isRunning) {
             const minutes = Math.floor(timerState.time / 60);
             const seconds = timerState.time % 60;
             const badgeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
             const badgeColor = timerState.isBreak ? '#10b981' : '#3b82f6'; // Green for break, blue for work

             chrome.action.setBadgeText({ text: badgeText }, () => {
                 if (chrome.runtime.lastError) {
                     console.warn("Aegis: Badge text error:", chrome.runtime.lastError.message);
                 } else {
                     //  console.log("Aegis: Updated badge text:", badgeText);
                 }
             });

             chrome.action.setBadgeBackgroundColor({ color: badgeColor }, () => {
                 if (chrome.runtime.lastError) {
                     console.warn("Aegis: Badge color error:", chrome.runtime.lastError.message);
                 } else {
                     //  console.log("Aegis: Updated badge color:", badgeColor, timerState.isBreak ? 'break' : 'work');
                 }
             });
         } else {
             chrome.action.setBadgeText({ text: '' }, () => {
                 if (chrome.runtime.lastError) {
                     console.warn("Aegis: Clear badge error:", chrome.runtime.lastError.message);
                 } else {
                     //  console.log("Aegis: Cleared badge");
                 }
             });
         }
     } catch (e) {
         console.warn("Aegis: Badge update failed:", e);
     }
 }

function updateTimer() { /* ... keep ... */
      if (!timerState.isRunning) { if (timerInterval) clearInterval(timerInterval); timerInterval = null; updateTimerBadge(); return; }
      timerState.time -= 1;
      updateTimerBadge(); // Update badge every second
      sendMessageToPopup({ command: 'updateTimer', time: formatTime(timerState.time), isBreak: timerState.isBreak, isRunning: timerState.isRunning });
      if (timerState.time <= 0) {
          //  console.log("Aegis: Timer reached zero.");
          if (timerInterval) clearInterval(timerInterval); timerInterval = null;
          timerState.isRunning = false;
          updateTimerBadge(); // Clear badge
          // Play alarm sound (only once per completion)
          if (!alarmPlayed) {
              playAlarmSound();
              alarmPlayed = true;
          }
          // Show completion notification badge
          showCompletionBadge();
          if (timerState.isBreak) {
              //  console.log("Aegis: Break finished. Showing notification.");
              showNotification('pomodoro-break-end', "Break Complete!", `Ready to start your ${config.pomodoroWorkMinutes}-minute work session.`);
              timerState.isBreak = false; timerState.time = timerState.workTime;
              // Store pending completion for when popup opens
              pendingTimerCompletion = { isBreak: true };
              // Record break session completion and increment activity count
              recordActivity('break', { timestamp: Date.now(), duration: timerState.breakTime });
              incrementActivitiesCompleted();
              // Try to show overlay immediately if popup is open, otherwise open popup
              sendMessageToPopup({ command: 'showTimerCompletionOverlay', isBreak: true });
              // Also try to open popup to show completion
              try {
                  chrome.action.openPopup().catch(() => {
                      // Popup opening failed, but that's ok - notification and badge will show
                      //  console.log("Aegis: Could not open popup, but notification sent");
                  });
              } catch (e) {
                  //  console.log("Aegis: Popup opening not supported");
              }
          } else {
              //  console.log("Aegis: Work session finished. Showing notification.");
              showNotification('pomodoro-work-end', "Work Session Complete!", `Great job! Time for a ${config.pomodoroBreakMinutes}-minute break.`);
              timerState.isBreak = true; timerState.time = timerState.breakTime;
              // Store pending completion for when popup opens
              pendingTimerCompletion = { isBreak: false };
              // Record work session completion and increment activity count
              recordActivity('work', { timestamp: Date.now(), duration: timerState.workTime });
              incrementActivitiesCompleted();
              // Try to show overlay immediately if popup is open, otherwise open popup
              sendMessageToPopup({ command: 'showTimerCompletionOverlay', isBreak: false });
              // Also try to open popup to show completion
              try {
                  chrome.action.openPopup().catch(() => {
                      // Popup opening failed, but that's ok - notification and badge will show
                      //  console.log("Aegis: Could not open popup, but notification sent");
                  });
              } catch (e) {
                  //  console.log("Aegis: Popup opening not supported");
              }
          }
          sendMessageToPopup({ command: 'updateTimer', time: formatTime(timerState.time), isBreak: timerState.isBreak, isRunning: timerState.isRunning });
      }
      }

function showCompletionBadge() {
     try {
         chrome.action.setBadgeText({ text: '!' }, () => {
             if (chrome.runtime.lastError) {
                 console.warn("Aegis: Completion badge error:", chrome.runtime.lastError.message);
             } else {
                 //  console.log("Aegis: Showed completion badge");
             }
         });
         chrome.action.setBadgeBackgroundColor({ color: '#ef4444' }, () => {
             if (chrome.runtime.lastError) {
                 console.warn("Aegis: Completion badge color error:", chrome.runtime.lastError.message);
             }
         });
     } catch (e) {
         console.warn("Aegis: Completion badge failed:", e);
     }
 }

function clearCompletionBadge() {
     try {
         chrome.action.setBadgeText({ text: '' }, () => {
             if (chrome.runtime.lastError) {
                 console.warn("Aegis: Clear completion badge error:", chrome.runtime.lastError.message);
             } else {
                 //  console.log("Aegis: Cleared completion badge");
             }
         });
     } catch (e) {
         console.warn("Aegis: Clear completion badge failed:", e);
     }
 }

function incrementActivitiesCompleted() {
      // Get current garden state and increment count
      chrome.storage.local.get('garden', (data) => {
          let gardenState = data.garden || { count: 0, level: 0 };
          gardenState.count++;
          gardenState.level = Math.min(5, Math.floor(gardenState.count / 5));

          // Save updated state
          chrome.storage.local.set({ garden: gardenState }, () => {
              if (chrome.runtime.lastError) {
                  console.warn("Aegis: Failed to save garden state:", chrome.runtime.lastError.message);
              } else {
                  //  console.log("Aegis: Activities completed incremented to:", gardenState.count);
                  // Notify popup to update garden display
                  sendMessageToPopup({ command: 'updateGarden', garden: gardenState });
              }
          });
      });
  }

function recordActivity(type, data) {
    // Load existing history
    chrome.storage.local.get('activityHistory', (result) => {
        const history = result.activityHistory || {
            workSessions: [],
            breakSessions: [],
            stretches: [],
            breathing: []
        };

        // Add new activity based on type
        switch(type) {
            case 'work':
                history.workSessions.push(data);
                break;
            case 'break':
                history.breakSessions.push(data);
                break;
            case 'stretches':
                history.stretches.push(data);
                break;
            case 'breathing':
                history.breathing.push(data);
                break;
        }

        // Keep only last 100 entries per category to prevent storage bloat
        Object.keys(history).forEach(key => {
            if (history[key].length > 100) {
                history[key] = history[key].slice(-100);
            }
        });

        // Save updated history
        chrome.storage.local.set({ activityHistory: history });
    });
}

// --- AI Functions ---
async function initializeAI() {
     //  console.log("Aegis: Starting AI initialization...");

     try {
         // Check if LanguageModel API exists
         if (typeof LanguageModel === 'undefined') {
             console.warn("Aegis: LanguageModel API not available (requires Chrome Dev + flags)");
             aiModelReady = false;
             return;
         }

         if (typeof LanguageModel.availability !== 'function') {
             console.warn("Aegis: LanguageModel.availability not available");
             aiModelReady = false;
             return;
         }

         if (typeof LanguageModel.create !== 'function') {
             console.warn("Aegis: LanguageModel.create not available");
             aiModelReady = false;
             return;
         }

         //  console.log("Aegis: LanguageModel API detected, checking availability...");
         const availability = await LanguageModel.availability();
         //  console.log("Aegis: AI Model availability result:", availability);

         if (availability === 'available') {
             //  console.log("Aegis: Creating AI session...");
             aiSession = await LanguageModel.create();
             aiModelReady = true;
             //  console.log("Aegis: AI session created successfully!");
         } else if (availability === 'no') {
             console.warn("Aegis: AI Model not available (model not downloaded)");
             aiModelReady = false;
         } else if (availability === 'after-download') {
             console.warn("Aegis: AI Model needs download");
             aiModelReady = false;
         } else {
             console.warn(`Aegis: AI Model status: ${availability}`);
             aiModelReady = false;
         }
     } catch (e) {
         console.error("Aegis: Error during AI initialization:", e);
         console.error("Aegis: Error details:", e.message, e.name, e.stack);
         aiModelReady = false;
     }

     //  console.log("Aegis: AI initialization complete. Ready:", aiModelReady);
 }
async function getAIResponse(prompt) { /* ... keep ... */
       if (!aiModelReady || !aiSession) { console.error("Aegis: AI session not ready for prompt."); return { response: "AI features aren't ready...", followUpQuestions: [] }; }
       try {
           const systemPrompt = "You are ThriveBot, an AI wellness coach for desk workers. Always respond with a JSON object containing:\n- 'response': Your wellness advice structured in engaging markdown format (use headers, bold, lists, etc. for better readability)\n- 'followUpQuestions': Array of 3 relevant follow-up questions as plain text (no markdown formatting)\n\nExample format:\n{\n  \"response\": \"## Welcome! 👋\\n\\n**Great to connect!** Here are some tips for staying healthy at your desk.\\n\\n### Key Points:\\n- Stay hydrated\\n- Take regular breaks\\n- Stretch often\",\n  \"followUpQuestions\": [\n    \"What are some easy stretches I can do?\",\n    \"How often should I take breaks?\",\n    \"What snacks help with focus?\"\n  ]\n}";
           const rawResponse = await aiSession.prompt(`System: ${systemPrompt}\nUser: ${prompt}\nThriveBot:`);

           try {
               // Try to parse as JSON
               const parsed = JSON.parse(rawResponse);
               if (parsed.response && Array.isArray(parsed.followUpQuestions)) {
                   return parsed;
               }
           } catch (parseError) {
               // If JSON parsing fails, wrap the response in our format
               console.warn("Aegis: AI response not valid JSON, wrapping manually");
           }

           // Fallback: wrap the raw response
           return {
               response: rawResponse,
               followUpQuestions: [
                   "What are some easy stretches I can do at my desk?",
                   "How often should I be taking breaks?",
                   "What kind of snacks are good for focus?"
               ]
           };
       } catch (e) { console.error("Aegis: Error during AI prompt:", e); return { response: "Sorry, error processing request: " + (e.name || e.message), followUpQuestions: [] }; }
   }

async function generateInitialSuggestions() {
      if (!aiModelReady || !aiSession) {
          console.warn("Aegis: AI not ready for initial suggestions");
          return [
              "How can I improve my posture while working?",
              "What are some quick desk stretches?",
              "How do I stay focused during long work sessions?",
              "What should I do during my break time?"
          ];
      }

      try {
          const prompt = `You are ThriveBot, a wellness coach for desk workers. Generate 4 diverse, practical questions that desk workers commonly ask about wellness, productivity, and health. Make them specific and actionable. Return only the questions, one per line, no numbering or bullets.`;
          const response = await aiSession.prompt(prompt);
          const suggestions = response.split('\n').filter(line => line.trim().length > 0).slice(0, 4);
          console.log("Aegis: Generated initial suggestions:", suggestions);
          return suggestions.length >= 4 ? suggestions : [
              "How can I improve my posture while working?",
              "What are some quick desk stretches?",
              "How do I stay focused during long work sessions?",
              "What should I do during my break time?"
          ];
      } catch (e) {
          console.error("Aegis: Error generating initial suggestions:", e);
          return [
              "How can I improve my posture while working?",
              "What are some quick desk stretches?",
              "How do I stay focused during long work sessions?",
              "What should I do during my break time?"
          ];
      }
  }

async function generateFollowUpQuestions(userMessage, botResponse) {
      if (!aiModelReady || !aiSession) {
          console.warn("Aegis: AI not ready for follow-up questions");
          return [];
      }

      try {
          const prompt = `Based on this conversation, generate 3-4 relevant follow-up questions the user might ask next. Keep them concise and natural.

User: ${userMessage}
ThriveBot: ${botResponse}

Return only the questions, one per line, no numbering or bullets. Focus on wellness, productivity, and desk worker health topics.`;
          const response = await aiSession.prompt(prompt);
          const questions = response.split('\n').filter(line => line.trim().length > 0 && line.includes('?')).slice(0, 4);
          console.log("Aegis: Generated follow-up questions:", questions);
          return questions;
      } catch (e) {
          console.error("Aegis: Error generating follow-up questions:", e);
          return [];
      }
  }
// --- "Robust Parsing" getContextualBreakSuggestion ---
// This version has improved parsing logic in Step 7.

async function getContextualBreakSuggestion() {
    console.log("Thrive Wellness: Getting contextual break suggestion...");
    if (!aiModelReady || !aiSession) {
        console.warn("Thrive Wellness: AI session not ready");
        return null;
    }

    try {
        // --- 1. Get Active Tab & URL (Same as before) ---
        let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        let activeTab = tabs?.[0];
        if (!activeTab?.id) {
            await new Promise(resolve => setTimeout(resolve, 100));
            tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            activeTab = tabs?.[0];
        }
        if (!activeTab?.id || !activeTab.url) {
            console.warn("Thrive Wellness: No active tab found");
            return null;
        }
        const url = activeTab.url;
        const hostname = new URL(url).hostname;

        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
            console.log("Thrive Wellness: Skipping internal page");
            return null;
        }

        // --- 2. Execute Smart Content Script (Same as before) ---
        let scriptResults;
        try {
            scriptResults = await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: getSmartTextContent // Assumes getSmartTextContent is defined
            });
        } catch (scriptError) {
            console.warn("Thrive Wellness: Scripting error:", scriptError.message);
            return null;
        }

        // --- 3. Process Result Object (Same as before) ---
        const resultData = scriptResults?.[0]?.result;
        if (!resultData) {
             console.warn("Thrive Wellness: No data from content script.");
             return null;
        }
        const pageTitle = resultData.title || '';
        const bodyText = resultData.bodyText || '';
        const truncatedText = bodyText.substring(0, config.maxContentLength);

        if (truncatedText.length < config.minContentLength) {
            console.log("Thrive Wellness: Cleaned text too short.");
            return null;
        }

        // --- 4. Determine URL Hint (Same as before) ---
        let urlHint = 'Unknown';
        if (hostname.includes('youtube.com')) urlHint = 'Likely Video Site';
        else if (hostname.includes('github.com') || hostname.includes('stackoverflow.com')) urlHint = 'Likely Dev Site';
        else if (hostname.includes('gmail.com') || hostname.includes('outlook.com')) urlHint = 'Likely Communication Site';
        else if (hostname.includes('docs.google.com') || hostname.includes('notion.so')) urlHint = 'Likely Writing Site';
        else if (hostname.includes('news') || hostname.includes('reddit.com')) urlHint = 'Likely News/Social Site';

        // --- 5. "Non-Invasive" AI Prompt (This is perfect, DO NOT CHANGE) ---
        const aiPrompt = `Analyze the webpage content to infer the user's task *category* (e.g., Coding, Reading, Writing).
Then, create a single, supportive notification sentence (max 20 words) that:
1.  Uses a general phrase to *allude* to the task category.
2.  Suggests a relevant **PHYSICAL micro-break**.

**ALLOWED PHYSICAL ACTIONS:**
- Eye Breaks (e.g., "refocus your eyes", "look away 20s")
- Stretches (e.g., "roll your shoulders", "do a wrist stretch")
- Movement (e.g., "stand up and stretch", "check your posture")
- Breathing (e.g., "take 3 deep breaths")

**CRITICAL RULE:**
Do NOT state the specific task (BAD: "Reviewing emails?", "Planning energy solutions?").
Instead, use a general phrase *alluding* to the task.

**GOOD EXAMPLES (Allusion + Physical Action):**
- "Looks like a deep focus session! Time to roll your shoulders."
- "Lots of typing! How about a quick wrist stretch?"
- "Engaged in some heavy reading? Don't forget to refocus your eyes."
- "A good moment to stand up and reset your posture."

**BAD EXAMPLES (Invasive / Abstract):**
- "Reviewing communications?" (Invasive)
- "Planning your energy solutions?" (Invasive)
- "Take a pause and visualize." (Not a physical action)

Page Title: "${pageTitle}"
URL Type: [${urlHint}]
Content Snippet:
"""
${truncatedText}
"""

Supportive Notification (using "Allusion + Physical Action" format):`;

        // --- 6. Call AI (Same as before) ---
        console.log("Thrive Wellness: Sending final non-invasive prompt...");
        let aiResponse;
        try {
            aiResponse = await aiSession.prompt(aiPrompt);
            console.log("Thrive Wellness: Raw AI String response:", JSON.stringify(aiResponse));
        } catch (aiError) {
            console.error("Thrive Wellness: AI prompt error:", aiError);
            return null;
        }

        if (!aiResponse || aiResponse.trim().length === 0) {
            console.warn("Thrive Wellness: AI returned empty string response");
            return null;
        }

        // --- 7. NEW Robust String Parsing Logic ---
        let suggestion = null;
        try {
            const responseLines = aiResponse.trim().split('\n');
            
            // Find the *first* non-empty line to use as our suggestion
            for (const line of responseLines) {
                const trimmedLine = line.trim();
                if (trimmedLine.length > 0) {
                    suggestion = trimmedLine;
                    break;
                }
            }

            if (!suggestion) {
                 console.warn("Thrive Wellness: Could not find any valid text in AI response.");
                 return null;
            }

            // Now, aggressively clean up that first line
            suggestion = suggestion
                .replace(/\*\*Notification Sentence:\*\*/i, '') // Old prefix
                .replace(/^Notification:/i, '')                // **NEW: Catches "Notification:"**
                .replace(/^Suggestion:/i, '')                  // Other possible prefix
                .replace(/^Supportive Notification:/i, '')      // Other possible prefix
                .replace(/^\[Your Output\]/i, '')             // Other possible prefix
                .replace(/\*\*/g, '')                         // Remove all markdown asterisks
                .replace(/^["']|["']$/g, '')                 // Remove surrounding quotes
                .trim();                                      // Final trim

            // Final validation
            if (suggestion && suggestion.length > 5 && suggestion.length < 150) {
                console.log(`Thrive Wellness: Parsed final suggestion: "${suggestion}"`);
                return suggestion; // This will now be "Lots of messages! Take a short stretch..."
            } else {
                console.warn("Thrive Wellness: AI string response was invalid after cleanup:", JSON.stringify(suggestion));
                return null; 
            }
        } catch (e) {
            console.error("Thrive Wellness: Error in parsing AI response:", e);
            return null;
        }

    } catch (e) {
        console.error("Thrive Wellness: Error in getContextualBreakSuggestion:", e);
        return null;
    }
}

// This function is stringified and executed in the target tab's context
function getSmartTextContent() {
    let content = '';
    let title = document.title || '';

    // --- 1. Prioritize Semantic Main Content Elements ---
    const mainSelectors = ['article', 'main', '[role="main"]', '.post-content', '.entry-content', '#content', '#main-content']; // Add more common selectors
    let mainElement = null;
    for (const selector of mainSelectors) {
        mainElement = document.querySelector(selector);
        if (mainElement) break;
    }

    // --- 2. Extract Text & Clean Noise ---
    const noisySelectors = [
        'nav', 'footer', 'aside', 'sidebar', // Layout
        'script', 'style', 'noscript', 'button', 'input', // Non-content elements
        'header', '.header', '#header', // Headers (often contain nav)
        '.comments', '#comments', '#disqus_thread', // Comments
        '.related', '.related-posts', '.sidebar-widget', // Related/Sidebars
        '.video-suggestions', '#secondary', '#related', // YouTube specific examples
        '.ad', '[class*="advert"]', '[id*="ad"]' // Ads
    ];

    if (mainElement) {
        console.log("Thrive Wellness Content Script: Found main element:", mainElement.tagName);
        const clonedMain = mainElement.cloneNode(true);
        noisySelectors.forEach(sel => {
            clonedMain.querySelectorAll(sel).forEach(el => el.remove());
        });
        content = clonedMain.innerText;
    }

    // --- 3. Fallback to Cleaned Body Text if Main Content is Insufficient ---
    if (!content || content.replace(/\s+/g, ' ').trim().length < config.contentFallbackThreshold) { // Require more text from main or fallback
        console.log("Thrive Wellness Content Script: Main content insufficient or not found, falling back to cleaned body.");
        const clonedBody = document.body.cloneNode(true);
         noisySelectors.forEach(sel => {
            clonedBody.querySelectorAll(sel).forEach(el => el.remove());
        });
        content = clonedBody.innerText;
    }

    // --- 4. Basic Text Cleanup ---
    content = content || ''; // Ensure it's a string
    content = content.replace(/\s+/g, ' ').trim(); // Replace multiple whitespaces with single space

    console.log("Thrive Wellness Content Script: Extracted text length:", content.length);

    return {
        title: title,
        bodyText: content // Return the best text found
    };
}

// --- Event Listeners ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { /* ... keep ... */
    (async () => {
        switch (message.command) {
            case 'startTimer': if (!timerState.isRunning) { timerState.isRunning = true; sendMessageToPopup({ command: 'updateTimer', time: formatTime(timerState.time), isBreak: timerState.isBreak, isRunning: timerState.isRunning }); if (!timerInterval) timerInterval = setInterval(updateTimer, 1000); updateTimerBadge(); } break;
            case 'stopTimer': if (timerState.isRunning) { timerState.isRunning = false; if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } sendMessageToPopup({ command: 'updateTimer', time: formatTime(timerState.time), isBreak: timerState.isBreak, isRunning: timerState.isRunning }); updateTimerBadge(); } break;
            case 'resetTimer': timerState.isRunning = false; if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } timerState.isBreak = false; timerState.time = timerState.workTime; sendMessageToPopup({ command: 'updateTimer', time: formatTime(timerState.time), isBreak: timerState.isBreak, isRunning: timerState.isRunning }); updateTimerBadge(); break;
            case 'getTimerState': sendResponse({ time: formatTime(timerState.time), isBreak: timerState.isBreak, isRunning: timerState.isRunning, defaultWorkTime: formatTime(timerState.workTime) }); break;
            case 'getBreakTime':
                console.log("BG: getBreakTime called, returning:", timerState.breakTime);
                sendResponse({ breakTime: timerState.breakTime });
                break;
            case 'getWorkTime':
                console.log("BG: getWorkTime called, returning:", timerState.workTime);
                sendResponse({ workTime: timerState.workTime });
                break;
            case 'checkPendingTimerCompletion':
                if (pendingTimerCompletion) {
                    const completion = pendingTimerCompletion;
                    // Clear immediately when checked to prevent re-showing
                    pendingTimerCompletion = null;
                    sendResponse({ showOverlay: true, isBreak: completion.isBreak });
                } else {
                    sendResponse({ showOverlay: false, isBreak: false });
                }
                break;
            case 'clearPendingTimerCompletion':
                pendingTimerCompletion = null;
                break;
            case 'startBreakFromOverlay': timerState.isRunning = true; if (!timerInterval) timerInterval = setInterval(updateTimer, 1000); alarmPlayed = false; updateTimerBadge(); clearCompletionBadge();
                // Clear pending completion state
                pendingTimerCompletion = null;
                // Increment activities completed count when user starts work after break
                incrementActivitiesCompleted();
                // Don't record work session start - only record completion
                break;
            case 'skipBreakFromOverlay': timerState.isBreak = false; timerState.time = timerState.workTime; sendMessageToPopup({ command: 'updateTimer', time: formatTime(timerState.time), isBreak: timerState.isBreak, isRunning: timerState.isRunning }); alarmPlayed = false; updateTimerBadge(); clearCompletionBadge();
                // Clear pending completion state
                pendingTimerCompletion = null;
                // Don't increment activities when user skips break - they didn't complete the break
                // Don't record work session start - only record completion
                break;
            case 'overlayBreakComplete': timerState.isBreak = false; timerState.time = timerState.workTime; sendMessageToPopup({ command: 'updateTimer', time: formatTime(timerState.time), isBreak: timerState.isBreak, isRunning: timerState.isRunning }); alarmPlayed = false; updateTimerBadge(); clearCompletionBadge();
                // Increment activities completed count after break completion
                incrementActivitiesCompleted();
                // Don't record work session start - only record completion
                break;
            case 'openStretchesPopup':
                // Open extension popup and navigate to stretches
                try {
                    chrome.action.openPopup().then(() => {
                        // Send message to navigate to stretches view after popup opens
                        setTimeout(() => {
                            chrome.runtime.sendMessage({ command: 'navigateToStretches' });
                        }, 300);
                    }).catch(() => {
                        console.warn("Aegis: Could not open popup for stretches");
                    });
                } catch (e) {
                    console.warn("Aegis: Popup opening not supported for stretches");
                }
                break;
            case 'sendChatMessage': console.log("BG: Received sendChatMessage command:", message.prompt); const botResponse = await getAIResponse(message.prompt); console.log("BG: AI response generated:", botResponse); sendResponse({ response: botResponse }); break;
            case 'generateInitialSuggestions':
                try {
                    const suggestions = await generateInitialSuggestions();
                    sendResponse({ suggestions: suggestions });
                } catch (error) {
                    console.error("BG: Error generating initial suggestions:", error);
                    sendResponse({ suggestions: null });
                }
                return true; // Indicate async response
            case 'generateFollowUpQuestions':
                // Handle async response using Promise
                generateFollowUpQuestions(message.userMessage, message.botResponse).then(questions => {
                    sendResponse({ questions: questions });
                }).catch(error => {
                    console.error("BG: Error generating follow-up questions:", error);
                    sendResponse({ questions: null });
                });
                return true; // Keep the connection open for async response
              case 'checkAI': if (!aiModelReady) await initializeAI(); sendResponse({ aiModelAvailable: aiModelReady }); break;
  
              // ** NEW CASE **
              case 'openAppView':
                  // 1. Set the target view in storage
                  chrome.storage.local.set({ 'thrive-target-view': message.view }, () => {
                      console.log("Thrive Wellness: Target view set to", message.view);
                      // 2. Try to open the extension popup directly
                      try {
                          chrome.action.openPopup().then(() => {
                              console.log("Thrive Wellness: Popup opened successfully for view:", message.view);
                          }).catch((error) => {
                              console.warn("Thrive Wellness: Failed to open popup:", error.message);
                              // Fallback: The user will have to click the icon manually
                              console.log("Thrive Wellness: Please click the extension icon to open.");
                          });
                      } catch (e) {
                          console.warn("Thrive Wellness: Popup opening not supported:", e.message);
                          console.log("Thrive Wellness: Please click the extension icon to open.");
                      }
                  });
                  // No sendResponse needed for this
                  break;
  
              // ** NEW CASE **
              case 'startTimerFromOverlay':
                  console.log("Thrive Wellness: Starting timer from overlay click.");
                  // 1. Reset timer to a fresh work session
                  timerState.isRunning = false;
                  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
                  timerState.isBreak = false;
                  timerState.time = timerState.workTime;
  
                  // 2. Start the timer
                  timerState.isRunning = true;
                  if (!timerInterval) {
                       timerInterval = setInterval(updateTimer, 1000);
                  }
  
                  // 3. Set storage to open popup to 'main'
                  chrome.storage.local.set({ 'thrive-target-view': 'main' }, () => {
                      if (chrome.action.openPopup) {
                          chrome.action.openPopup(); // Open popup to show the running timer
                      }
                  });
                  break;
  
              // ** NEW CASE: Save Settings **
              case 'saveSettings':
                  const settings = message.settings;
                  chrome.storage.local.set({
                      'thrive-settings': settings
                  }, () => {
                      console.log("Thrive Wellness: Settings saved:", settings);
                      // Apply settings immediately
                      applySettings(settings);
                  });
                  break;
  
              // ** NEW CASE: Load Settings **
              case 'loadSettings':
                  chrome.storage.local.get('thrive-settings', (data) => {
                      const settings = data['thrive-settings'] || {
                          wellnessReminders: true,
                          workSessionReminder: true,
                          soundNotifications: true
                      };
                      sendResponse({ settings: settings });
                  });
                  return true; // Keep connection open for async response

              // ** NEW CASE **
              case 'startTimerFromOverlay':
                  console.log("Thrive Wellness: Starting timer from overlay click.");
                  // 1. Reset timer to a fresh work session
                  timerState.isRunning = false;
                  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
                  timerState.isBreak = false;
                  timerState.time = timerState.workTime;

                  // 2. Start the timer
                  timerState.isRunning = true;
                  if (!timerInterval) {
                       timerInterval = setInterval(updateTimer, 1000);
                  }

                  // 3. Set storage to open popup to 'main'
                  chrome.storage.local.set({ 'thrive-target-view': 'main' }, () => {
                      if (chrome.action.openPopup) {
                          chrome.action.openPopup(); // Open popup to show the running timer
                      }
                  });
                  break;
        }
    })();
    // Return true only for async operations
    return (message.command === 'sendChatMessage' || message.command === 'checkAI' ||
            message.command === 'startTimer' || message.command === 'stopTimer' || message.command === 'resetTimer' ||
            message.command === 'startBreakFromOverlay' || message.command === 'skipBreakFromOverlay' || message.command === 'overlayBreakComplete');
});

chrome.alarms.onAlarm.addListener(async (alarm) => { /* ... keep ... */
      if (alarm.name === 'proactiveNotification') {
         // Check if wellness reminders are enabled
         if (!settings.wellnessReminders) {
             console.log("Thrive Wellness: Wellness reminders disabled, skipping proactive notification");
             return;
         }

         //  console.log("Aegis: Proactive alarm triggered.");
          if (typeof chrome.idle === 'undefined') { console.error("Aegis: Idle API unavailable."); return; }
          const idleThresholdSeconds = config.notificationIdleThresholdMinutes * 60;
          chrome.idle.queryState(idleThresholdSeconds, async (state) => {
             //  console.log(`Aegis: Idle state (${idleThresholdSeconds}s): ${state}`);
              if (state === 'active') {
                  // 0. Get the active tab for overlay injection
                  let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                  let activeTab = tabs?.[0];
                  if (!activeTab?.id) {
                      console.warn("Thrive Wellness: No active tab found for overlay injection");
                      return;
                  }

                  // 1. Get the suggestion text (this is your existing, working function)
                  const suggestionText = await getContextualBreakSuggestion();

                  // 2. Set Fallbacks
                  let title = "Thrive Wellness";
                  let message = "Time for a micro-break! A quick stretch can help you feel refreshed.";
                  let action = 'stretches'; // Default to stretches

                  // 3. If AI Text succeeded, use it and get a recommended action
                  if (suggestionText) {
                      message = suggestionText; // Use the AI-generated text

                      // 4. SECOND AI CALL: Determine the action
                      if (aiModelReady && aiSession) {
                          try {
                              const actionPrompt = `Based on this wellness suggestion: "${suggestionText}"
Should the user 'stretches' or 'breathing'?
Respond ONLY with the single word: 'stretches', 'breathing', or 'none'.`;

                              let actionResponse = await aiSession.prompt(actionPrompt);
                              actionResponse = actionResponse.trim().toLowerCase();

                              if (actionResponse === 'stretches' || actionResponse === 'breathing') {
                                  action = actionResponse; // Use 'stretches' or 'breathing'
                              } else {
                                  action = 'none'; // AI provided an invalid action
                              }
                              console.log("Thrive Wellness: Recommended action:", action);
                          } catch (e) {
                              console.error("Thrive Wellness: AI action prompt failed:", e);
                              action = 'stretches'; // Fallback
                          }
                      }
                  }

                  // 5. Inject the overlay with text, action, AND work session button visibility
                  try {
                      await chrome.scripting.executeScript({
                          target: { tabId: activeTab.id },
                          func: injectProactiveOverlay,
                          // Pass all 4 arguments: title, message, action, showWorkSessionButton
                          args: [title, message, action, !timerState.isRunning && settings.workSessionReminder]
                      });
                      console.log("Thrive Wellness: Injected proactive overlay. Action:", action, "ShowWorkSessionButton:", !timerState.isRunning && settings.workSessionReminder);
                  } catch (e) {
                      console.warn("Thrive Wellness: Failed to inject overlay script:", e.message);
                  }
              } else {
                  //  console.log("Aegis: User idle/locked, skipping proactive.");
              }
          });
      }
   });

chrome.runtime.onInstalled.addListener(() => { /* ... keep ... */
     //  console.log("Aegis installed/updated.");
     // Only create alarm if wellness reminders are enabled (checked in applySettings)
     initializeAI();
     loadSettings(); // Load settings on install
 });
chrome.runtime.onStartup.addListener(() => { /* ... keep ... */
     //  console.log("Aegis starting.");
     initializeAI();
     loadSettings(); // Load settings on startup
 });

// Initial AI check
//  console.log("Aegis: Service worker started. Init AI...");
initializeAI();
loadSettings(); // Load settings on service worker start

// Also initialize AI on startup to ensure it's ready
chrome.runtime.onStartup.addListener(async () => {
     //  console.log("Aegis: Browser startup detected, initializing AI...");
     await initializeAI();
     loadSettings(); // Load settings on browser startup
 });

// Force AI initialization after a delay to ensure it's ready
setTimeout(async () => {
     //  console.log("Aegis: Delayed AI initialization check...");
     if (!aiModelReady) {
         await initializeAI();
     }
 }, 5000);

// Additional AI initialization attempts for reliability
setTimeout(async () => {
     //  console.log("Aegis: Second delayed AI initialization check...");
     if (!aiModelReady) {
         await initializeAI();
     }
 }, 15000);

setTimeout(async () => {
     //  console.log("Aegis: Third delayed AI initialization check...");
     if (!aiModelReady) {
         await initializeAI();
     }
 }, 30000);

// --- Completion Popup Function ---
function showCompletionPopup(isBreak) {
     // Create a separate popup window for timer completion
     const popupUrl = chrome.runtime.getURL('completion-popup.html') + `?isBreak=${isBreak}`;
     const popupOptions = {
         url: popupUrl,
         type: 'popup',
         width: 420,
         height: 300,
         focused: true,
         top: Math.round((screen.height - 300) / 2),
         left: Math.round((screen.width - 420) / 2)
     };

     try {
         chrome.windows.create(popupOptions, (window) => {
             if (chrome.runtime.lastError) {
                 console.warn("Aegis: Failed to create completion popup:", chrome.runtime.lastError.message);
                 // Fallback: try to open popup using action.openPopup
                 try {
                     chrome.action.openPopup().then(() => {
                         //  console.log("Aegis: Fallback popup opened");
                         // Send message to show overlay in the popup
                         setTimeout(() => {
                             sendMessageToPopup({ command: 'showTimerCompletionOverlay', isBreak: isBreak });
                         }, 200);
                     }).catch(e => {
                         console.warn("Aegis: Fallback popup failed:", e);
                     });
                 } catch (e) {
                     console.warn("Aegis: Fallback popup not supported:", e);
                 }
             } else {
                 //  console.log("Aegis: Completion popup created successfully");
             }
         });
     } catch (e) {
         console.warn("Aegis: Error creating completion popup:", e);
         // Fallback to overlay in existing popup
         try {
             chrome.action.openPopup().then(() => {
                 setTimeout(() => {
                     sendMessageToPopup({ command: 'showTimerCompletionOverlay', isBreak: isBreak });
                 }, 200);
             }).catch(() => {
                 console.warn("Aegis: All popup methods failed");
             });
         } catch (e) {
             console.warn("Aegis: Fallback failed:", e);
         }
     }
 }