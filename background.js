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

// --- Utility Functions ---
function formatTime(seconds) { /* ... keep ... */
     const m = Math.floor(seconds / 60); const s = seconds % 60;
     return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
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

function injectProactiveOverlay(title, message) {
     // This function runs in the context of the webpage
     const overlay = document.createElement('div');
     overlay.id = 'aegis-proactive-overlay';
     overlay.innerHTML = `
         <div class="aegis-overlay-content">
             <div class="aegis-overlay-icon">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                     <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                 </svg>
             </div>
             <div class="aegis-overlay-text">
                 <h4>${title}</h4>
                 <p>${message}</p>
                 <button class="aegis-overlay-stretches-btn">
                     View more stretches
                 </button>
             </div>
             <button class="aegis-overlay-dismiss">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                     <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                 </svg>
             </button>
         </div>
     `;

     // Add styles
     const style = document.createElement('style');
     style.textContent = `
         #aegis-proactive-overlay {
             position: fixed;
             bottom: 20px;
             right: 20px;
             max-width: 350px;
             z-index: 2147483647;
             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
             animation: aegisSlideIn 0.3s ease-out;
             pointer-events: auto;
         }

         @keyframes aegisSlideIn {
             from { opacity: 0; transform: translateX(100%); }
             to { opacity: 1; transform: translateX(0); }
         }

         .aegis-overlay-content {
             background-color: #ffffff;
             border-radius: 12px;
             padding: 16px;
             box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
             border: 1px solid #e5e7eb;
             display: flex;
             align-items: flex-start;
             gap: 12px;
             position: relative;
         }

         .aegis-overlay-icon {
             width: 32px;
             height: 32px;
             background-color: #78A193;
             border-radius: 50%;
             display: flex;
             align-items: center;
             justify-content: center;
             color: white;
             flex-shrink: 0;
         }

         .aegis-overlay-icon svg {
             width: 16px;
             height: 16px;
         }

         .aegis-overlay-text {
             flex: 1;
             min-width: 0;
         }

         .aegis-overlay-text h4 {
             margin: 0 0 4px 0;
             font-size: 14px;
             font-weight: 600;
             color: #1f2937;
         }

         .aegis-overlay-text p {
             margin: 0 0 8px 0;
             font-size: 13px;
             color: #6b7280;
             line-height: 1.4;
         }

         .aegis-overlay-stretches-btn {
             background: none;
             border: 1px solid #78A193;
             color: #78A193;
             padding: 4px 8px;
             border-radius: 4px;
             font-size: 11px;
             font-weight: 500;
             cursor: pointer;
             display: inline-flex;
             align-items: center;
             gap: 4px;
             transition: all 0.2s ease;
         }

         .aegis-overlay-stretches-btn:hover {
             background-color: #78A193;
             color: white;
         }

         .aegis-overlay-dismiss {
             background: none;
             border: none;
             padding: 4px;
             cursor: pointer;
             color: #9ca3af;
             border-radius: 4px;
             display: flex;
             align-items: center;
             justify-content: center;
             flex-shrink: 0;
             transition: background-color 0.2s ease, color 0.2s ease;
         }

         .aegis-overlay-dismiss:hover {
             background-color: #f3f4f6;
             color: #6b7280;
         }

         .aegis-overlay-dismiss svg {
             width: 14px;
             height: 14px;
         }
     `;

     // Remove any existing overlay first
     const existing = document.getElementById('aegis-proactive-overlay');
     if (existing) {
         existing.remove();
     }

     // Add to page
     document.head.appendChild(style);
     document.body.appendChild(overlay);

     // Add dismiss functionality
     const dismissBtn = overlay.querySelector('.aegis-overlay-dismiss');
     dismissBtn.addEventListener('click', () => {
         overlay.remove();
         style.remove();
     });

     // Add stretches button functionality
     const stretchesBtn = overlay.querySelector('.aegis-overlay-stretches-btn');
     stretchesBtn.addEventListener('click', () => {
         // Since we can't open popup from content script, send message to background to open popup
         chrome.runtime.sendMessage({ command: 'openStretchesPopup' });
         // Remove overlay after clicking
         overlay.remove();
         style.remove();
     });

     // Auto-dismiss after 8 seconds
     setTimeout(() => {
         if (document.body.contains(overlay)) {
             overlay.remove();
             style.remove();
         }
     }, 8000);
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

async function getContextualBreakSuggestion() {
    //  console.log("Aegis: Getting contextual break suggestion...");

     try {
         // Get active tab with retry logic
         let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
         let activeTab = tabs[0];

         // Retry once if no tab found (sometimes query returns empty)
         if (!activeTab || !activeTab.id) {
            //  console.log("Aegis: No active tab found on first try, retrying...");
             await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
             tabs = await chrome.tabs.query({ active: true, currentWindow: true });
             activeTab = tabs[0];
         }

         if (!activeTab || !activeTab.id) {
            //  console.warn("Aegis: No active tab found after retry");
             return null;
         }

         // Skip chrome:// pages where scripting is not allowed
         if (activeTab.url?.startsWith('chrome://') || activeTab.url?.startsWith('chrome-extension://')) {
             //  console.log("Aegis: Skipping chrome:// or extension page");
             return null;
         }

         // Check if we have permission for this host
         try {
             await chrome.scripting.executeScript({
                 target: { tabId: activeTab.id },
                 func: () => true // Simple test script
             });
         } catch (permError) {
             //  console.log("Aegis: No permission for this host, using fallback");
             return null;
         }

         // Inject content script to get text content
         const results = await chrome.scripting.executeScript({
             target: { tabId: activeTab.id },
             func: getTextContent
         });

         const pageText = results?.[0]?.result;
         if (!pageText || typeof pageText !== 'string' || pageText.trim().length === 0) {
             console.warn("Aegis: No text content retrieved from page");
             return null;
         }

         // Truncate text to reasonable length (first 1000 characters)
         const truncatedText = pageText.substring(0, 1000).trim();
         if (truncatedText.length < 50) {
             console.warn("Aegis: Text content too short for analysis");
             return null;
         }

         //  console.log("Aegis: Retrieved text for analysis, length:", truncatedText.length);

         // Get AI suggestion focused on desk job fitness and ergonomics - simplified prompt for notifications
         const aiPrompt = `You are Aegis, a wellness assistant. Suggest ONE short wellness tip (max 15 words) for desk workers.

Focus on quick actions:
- Neck/shoulder stretches
- Eye exercises
- Wrist movements
- Standing breaks
- Breathing exercises

Examples:
"Roll your shoulders backward slowly"
"Blink rapidly and look away from screen"
"Stretch your arms overhead"

Respond with just one short wellness tip:`;

         const aiResponse = await aiSession.prompt(aiPrompt);
         //  console.log("Aegis: AI contextual suggestion:", aiResponse);

         // Handle empty or whitespace-only responses
         if (!aiResponse || aiResponse.trim().length === 0) {
             console.warn("Aegis: AI returned empty response");
             return null;
         }

         // Log the raw response for debugging
         //  console.log("Aegis: Raw AI response length:", aiResponse.length, "characters");

         // Extract and validate the AI response
         let suggestion = aiResponse.trim();

         //  console.log("Aegis: Processing suggestion:", JSON.stringify(suggestion));

         // Remove any markdown or extra formatting
         suggestion = suggestion.replace(/\*\*.*?\*\*/g, '').trim();
         suggestion = suggestion.replace(/^["']|["']$/g, '').trim(); // Remove quotes

         //  console.log("Aegis: After cleanup:", JSON.stringify(suggestion));

         // If still empty after cleanup, try to extract from between ** markers
         if (!suggestion || suggestion.length === 0) {
             const boldMatch = aiResponse.match(/\*\*(.*?)\*\*/);
             if (boldMatch && boldMatch[1]) {
                 suggestion = boldMatch[1].trim();
                 //  console.log("Aegis: Extracted from bold markers:", JSON.stringify(suggestion));
             }
         }

         // If response is too long, try to extract just the main suggestion
         if (suggestion.length > 50) {
             // Look for sentence-ending punctuation and take the first complete sentence
             const sentences = suggestion.split(/[.!?]+/);
             const firstSentence = sentences[0]?.trim();
             if (firstSentence && firstSentence.length > 10 && firstSentence.length <= 50) {
                 suggestion = firstSentence + '.';
             }
         }

         // Final validation - accept any non-empty response
         if (suggestion && suggestion.length >= 1) {
            //  console.log("Aegis: Using AI contextual suggestion:", suggestion);
             return suggestion;
         } else {
            //  console.warn("Aegis: AI response is empty after processing");
             return null;
         }

     } catch (e) {
        //  console.warn("Aegis: Error getting contextual break suggestion:", e);
         return null;
     }
}

function getTextContent() {
     // Function to be injected into the page
     return document.body.innerText || '';
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
        }
    })();
    // Return true only for async operations
    return (message.command === 'sendChatMessage' || message.command === 'checkAI' ||
            message.command === 'startTimer' || message.command === 'stopTimer' || message.command === 'resetTimer' ||
            message.command === 'startBreakFromOverlay' || message.command === 'skipBreakFromOverlay' || message.command === 'overlayBreakComplete');
});

chrome.alarms.onAlarm.addListener(async (alarm) => { /* ... keep ... */
     if (alarm.name === 'proactiveNotification') {
        //  console.log("Aegis: Proactive alarm triggered.");
         if (typeof chrome.idle === 'undefined') { console.error("Aegis: Idle API unavailable."); return; }
         const idleThresholdSeconds = config.notificationIdleThresholdMinutes * 60;
         chrome.idle.queryState(idleThresholdSeconds, async (state) => {
            //  console.log(`Aegis: Idle state (${idleThresholdSeconds}s): ${state}`);
             if (state === 'active') {
                 let title = "Friendly Reminder";
                 let message = "Time for a micro-break! Stretch or look away for a moment.";

                 // Try to get contextual break suggestion
                 if (aiModelReady && aiSession) {
                     try {
                         const contextualSuggestion = await getContextualBreakSuggestion();
                         if (contextualSuggestion) {
                             title = "Aegis Wellness";
                             message = contextualSuggestion;
                             //  console.log("Aegis: Using AI contextual suggestion:", message);
                         } else {
                             //  console.log("Aegis: AI contextual suggestion failed, using fallback");
                         }
                     } catch (e) {
                         console.error("Aegis: Error getting contextual suggestion:", e);
                        //  console.log("Aegis: Using fallback notification");
                     }
                 } else {
                    //  console.log("Aegis: AI not ready, using fallback notification.");
                 }

                //  console.log("Aegis: Showing PROACTIVE notification:", title, message);
                 showNotification(`proactive-notif-${Date.now()}`, title, message);

                 // Show proactive popup overlay on screen
                 showProactivePopupOverlay(title, message);
             } else {
                 //  console.log("Aegis: User idle/locked, skipping proactive.");
             }
         });
     }
 });

chrome.runtime.onInstalled.addListener(() => { /* ... keep ... */
    //  console.log("Aegis installed/updated.");
    chrome.alarms.create('proactiveNotification', { delayInMinutes: config.notificationInitialDelayMinutes, periodInMinutes: config.notificationPeriodMinutes });
    //  console.log(`Aegis: Alarm set. Delay: ${config.notificationInitialDelayMinutes}m, Period: ${config.notificationPeriodMinutes}m.`);
    initializeAI();
});
chrome.runtime.onStartup.addListener(() => { /* ... keep ... */
    //  console.log("Aegis starting.");
     chrome.alarms.get('proactiveNotification', (alarm) => { if (!alarm) { chrome.alarms.create('proactiveNotification', { delayInMinutes: config.notificationInitialDelayMinutes, periodInMinutes: config.notificationPeriodMinutes }); } else { //  console.log("Aegis: Alarm exists."); 
    } });
    initializeAI();
});

// Initial AI check
//  console.log("Aegis: Service worker started. Init AI...");
initializeAI();

// Also initialize AI on startup to ensure it's ready
chrome.runtime.onStartup.addListener(async () => {
    //  console.log("Aegis: Browser startup detected, initializing AI...");
    await initializeAI();
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