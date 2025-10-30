// --- Thrive Wellness UI Logic (Vanilla JS - Patched for Config) ---
'use strict';

// UI.JS: Script loaded and executing

//  console.log('UI.JS: Script loaded and executing');

// --- State ---
let currentView = 'main';
let timerState = {
    isRunning: false,
    // time: will be set from background or default config
    isBreak: false,
    defaultWorkTimeFormatted: "25:00" // Fallback default
};
let gardenState = { count: 0, level: 0 };
let previousGardenLevel = -1;
let currentStretchIndex = 0;
let stretchesViewed = 0;
let breathingCyclesCompleted = 0;

// --- Activity History State ---
let activityHistory = {
    workSessions: [],
    breakSessions: [],
    stretches: [],
    breathing: []
};

// --- Stretch Data ---
const stretches = [
    { id: 'neck-side', title: "Side Neck Stretch", description: "Sit up straight and gently tilt your head towards one shoulder, feeling a light stretch. Hold for 15 seconds, then repeat on the other side.", videoSrc: 'videos/stretch-neck-side.mp4' },
    { id: 'neck-rotation', title: "Neck Rotation", description: "Slowly turn your head to look over one shoulder, keeping your chin level. Hold for 15 seconds, then repeat on the other side.", videoSrc: 'videos/stretch-neck-rotation.mp4' },
    { id: 'shoulder-roll', title: "Shoulder Rolls", description: "Sit or stand tall. Roll your shoulders upwards towards your ears, then back, then down in a smooth, circular motion. Repeat 5-10 times.", videoSrc: 'videos/stretch-shoulder-roll.mp4' },
    { id: 'overhead-reach', title: "Overhead Side Reach", description: "Sit tall. Reach one arm straight up towards the ceiling. Gently lean your upper body to the opposite side. Hold for 15 seconds, repeat other side.", videoSrc: 'videos/stretch-overhead-reach.mp4' },
    { id: 'triceps-stretch', title: "Triceps Stretch", description: "Raise one arm overhead, bend your elbow so your hand touches your upper back. Use your other hand to gently push the elbow down. Hold 15 seconds, repeat other arm.", videoSrc: 'videos/stretch-triceps.mp4' },
    { id: 'wrist-flex-ext', title: "Wrist Flexion/Extension", description: "Extend one arm forward, palm down. Gently bend your wrist down with your other hand. Hold 15s. Then gently bend wrist up. Hold 15s. Repeat other wrist.", videoSrc: 'videos/stretch-wrist-flex-ext.mp4' },
    { id: 'finger-stretch', title: "Finger Stretch", description: "Extend your fingers wide apart for a few seconds. Then make a gentle fist. Repeat 5-10 times for each hand.", videoSrc: 'videos/stretch-finger.mp4' },
    { id: 'torso-twist', title: "Seated Torso Twist", description: "Sit tall with feet flat. Gently twist your upper body to one side, using the chair back for light support if needed. Hold for 15 seconds, repeat other side.", videoSrc: 'videos/stretch-torso-twist.mp4' },
    { id: 'upper-back-hug', title: "Upper Back Stretch", description: "Clasp your hands in front of you and round your upper back, pushing your hands forward. Feel the stretch between your shoulder blades. Hold 15 seconds.", videoSrc: 'videos/stretch-upper-back.mp4' },
    { id: 'chest-opener', title: "Chest Opener", description: "Sit or stand tall. Clasp your hands behind your lower back. Gently pull your shoulders back and lift your chest. Hold for 15 seconds.", videoSrc: 'videos/stretch-chest-opener.mp4' }
];
let quoteInterval;
let breathingInterval;
let breathingAnimationTimeout;
let breathingTimerInterval;
let aiModelReady = false;

// --- Quotes & Icons ---
const motivationalQuotes = [
    "The secret of getting ahead is getting started.",
    "Well done is better than well said.",
    "Strive for progress, not perfection.",
    "Your mind is powerful. Fill it with positive thoughts.",
    "A little progress each day adds up to big results.",
    "Take a deep breath and start again.",
    "Success is the sum of small efforts repeated day in and day out.",
    "The only way to do great work is to love what you do.",
    "Focus on being productive instead of busy.",
    "Small daily improvements are the key to staggering long-term results.",
    "The best way to predict the future is to create it.",
    "Don't watch the clock; do what it does. Keep going.",
    "Your work is going to fill a large part of your life, so choose wisely.",
    "The future depends on what you do today.",
    "Stay focused, stay positive, and keep moving forward.",
    "Every expert was once a beginner.",
    "The journey of a thousand miles begins with a single step.",
    "Quality over quantity in everything you do.",
    "Your attitude determines your direction.",
    "Great things never come from comfort zones."
];
const gardenMessages = [
    "Your wellness journey has begun! Keep nurturing your seed with healthy habits.", // 1
    "Look! A tiny sprout. Keep up the great work, consistency is key!",              // 2
    "Getting stronger! Your little plant is enjoying those wellness breaks.",         // 3
    "Growing steadily! You're building some wonderful healthy routines.",           // 4
    "Look how leafy! Your commitment to well-being is really showing.",             // 5
    "Thriving! Your wellness tree is full and happy. Can you help it bloom?",        // 6
    "Beautiful blossoms! You've achieved peak wellness. Keep shining!"              // 7
];

// --- Enhanced Animated Plant Icons (SVG Strings) ---
const plantIcons = [
    // Level 1 (Seed) - Subtle pulse/bounce
    `<svg class="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"> <style> .seed-pulse { animation: seedPulse 3s ease-in-out infinite; transform-origin: center; } @keyframes seedPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } } </style> <g class="seed-pulse"> <path d="M70 160 Q70 180 90 180 H 110 Q 130 180 130 160 V 150 H 70 Z" fill="#f2a28c"></path> <rect fill="#e59179" height="10" rx="3" width="70" x="65" y="145"></rect> <ellipse cx="100" cy="140" rx="15" ry="10" fill="#a0522d"></ellipse> <path d="M 93 138 C 95 141 97 141 99 138" stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round"/> <path d="M 101 138 C 103 141 105 141 107 138" stroke="#4a3728" stroke-width="1.5" fill="none" stroke-linecap="round"/> </g> </svg>`,
    // Level 2 (Sprout) - Small wiggle
    `<svg class="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"> <g class="animate-happyWiggle" style="transform-origin: 100px 160px; animation-duration: 6s; animation-timing-function: linear;"> <path d="M70 160 Q70 180 90 180 H 110 Q 130 180 130 160 V 150 H 70 Z" fill="#f2a28c"></path> <rect fill="#e59179" height="10" rx="3" width="70" x="65" y="145"></rect> <path d="M 100 150 Q 100 130 100 110 T 105 100" stroke="#a1e0a4" stroke-width="6" fill="none" stroke-linecap="round"/> <circle cx="97" cy="115" r="2" fill="#4a3728"></circle> <circle cx="103" cy="115" r="2" fill="#4a3728"></circle> </g> </svg>`,
    // Level 3 (Small Plant) - Gentle wiggle
    `<svg class="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"> <g class="animate-happyWiggle" style="transform-origin: 100px 160px; animation-duration: 5s;"> <path d="M70 160 Q70 180 90 180 H 110 Q 130 180 130 160 V 150 H 70 Z" fill="#f2a28c"></path> <rect fill="#e59179" height="10" rx="3" width="70" x="65" y="145"></rect> <rect fill="#8b5e3c" height="30" rx="3" width="10" x="95" y="120"></rect> <circle cx="90" cy="115" r="12" fill="#8fdb93"></circle> <circle cx="110" cy="115" r="12" fill="#8fdb93"></circle> <circle cx="96" cy="118" r="2.5" fill="#4a3728" class="origin-center animate-blink" style="animation-delay: 0.5s;"></circle> <circle cx="104" cy="118" r="2.5" fill="#4a3728" class="origin-center animate-blink"></circle> <path d="M 98 125 Q 100 127 102 125" fill="none" stroke="#4a3728" stroke-linecap="round" stroke-width="1.5"></path> </g> </svg>`,
    // Level 4 (Medium Plant - Enhanced)
    `<svg class="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"> <g class="animate-happyWiggle" style="transform-origin: 100px 160px;"> <path d="M70 160 Q70 180 90 180 H 110 Q 130 180 130 160 V 150 H 70 Z" fill="#f2a28c"></path> <rect fill="#e59179" height="10" rx="3" width="70" x="65" y="145"></rect> <rect fill="#8b5e3c" height="40" rx="4" width="12" x="94" y="110"></rect> <circle cx="85" cy="100" r="18" fill="#a1e0a4"></circle> <circle cx="115" cy="100" r="18" fill="#a1e0a4"></circle> <circle cx="100" cy="90" r="20" fill="#8fdb93"></circle> <circle cx="75" cy="115" r="8" fill="#a1e0a4"></circle> <circle cx="125" cy="115" r="8" fill="#a1e0a4"></circle> <circle cx="92" cy="95" r="3" fill="#4a3728" class="origin-center animate-blink" style="animation-delay: 0.1s;"></circle> <circle cx="108" cy="95" r="3" fill="#4a3728" class="origin-center animate-blink"></circle> <path d="M 98 105 Q 100 108 102 105" fill="none" stroke="#4a3728" stroke-linecap="round" stroke-width="2"></path> </g> </svg>`,
    // Level 5 (Large Plant - Enhanced)
    `<svg class="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"> <g class="animate-happyWiggle" style="transform-origin: 100px 160px;"> <path d="M70 160 Q70 180 90 180 H 110 Q 130 180 130 160 V 150 H 70 Z" fill="#f2a28c"></path> <rect fill="#e59179" height="10" rx="3" width="70" x="65" y="145"></rect> <rect fill="#8b5e3c" height="50" rx="4" width="14" x="93" y="100"></rect> <path d="M 93 125 Q 80 115 75 105" stroke="#8b5e3c" stroke-width="5" fill="none" stroke-linecap="round"/> <path d="M 107 125 Q 120 115 125 105" stroke="#8b5e3c" stroke-width="5" fill="none" stroke-linecap="round"/> <circle cx="100" cy="70" r="30" fill="#8fdb93"></circle> <circle cx="75" cy="85" r="25" fill="#a1e0a4"></circle> <circle cx="125" cy="85" r="25" fill="#a1e0a4"></circle> <circle cx="65" cy="105" r="10" fill="#a1e0a4"></circle> <circle cx="135" cy="105" r="10" fill="#a1e0a4"></circle> <circle cx="90" cy="105" r="8" fill="#a1e0a4"></circle> <circle cx="110" cy="105" r="8" fill="#a1e0a4"></circle> <circle cx="90" cy="75" r="3.5" fill="#4a3728" class="origin-center animate-blink" style="animation-delay: 0.3s;"></circle> <circle cx="110" cy="75" r="3.5" fill="#4a3728" class="origin-center animate-blink"></circle> <path d="M 98 88 Q 100 92 102 88" fill="none" stroke="#4a3728" stroke-linecap="round" stroke-width="2.5"></path> </g> </svg>`,
    // Level 6 (Full Tree - Enhanced)
    `<svg class="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"> <g class="animate-happyWiggle" style="transform-origin: 100px 160px;"> <circle cx="100" cy="65" fill="#8fdb93" r="45"></circle> <circle cx="70" cy="75" fill="#a1e0a4" r="35"></circle> <circle cx="130" cy="75" fill="#a1e0a4" r="35"></circle> <circle cx="90" cy="95" r="6" fill="#a1e0a4"></circle> <circle cx="110" cy="95" r="6" fill="#a1e0a4"></circle> <circle cx="100" cy="105" r="7" fill="#8fdb93"></circle> <rect fill="#8b5e3c" height="50" rx="4" width="16" x="92" y="110"></rect> <g fill="#4a3728"> <circle class="origin-center animate-blink" cx="88" cy="68" r="3" style="animation-delay: 0.2s;"></circle> <circle class="origin-center animate-blink" cx="112" cy="68" r="3"></circle> <path d="M 95 82 Q 100 88 105 82" fill="none" stroke="#4a3728" stroke-linecap="round" stroke-width="2.5"></path> </g> </g> <path d="M70 160 Q70 180 90 180 H 110 Q 130 180 130 160 V 150 H 70 Z" fill="#f2a28c"></path> <rect fill="#e59179" height="10" rx="3" width="70" x="65" y="145"></rect> </svg>`,
    // Level 7 (Flowering Tree - Enhanced)
    `<svg class="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"> <style> .flower-bloom { animation: bloom 1.5s ease-out forwards; transform-origin: center; transform: scale(0); } @keyframes bloom { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } } .flower-sway { animation: sway 3s ease-in-out infinite alternate; } @keyframes sway { from { transform: rotate(-2deg); } to { transform: rotate(2deg); } } </style> <g class="animate-happyWiggle" style="transform-origin: 100px 160px;"> <circle cx="100" cy="65" fill="#8fdb93" r="45"></circle> <circle cx="70" cy="75" fill="#a1e0a4" r="35"></circle> <circle cx="130" cy="75" fill="#a1e0a4" r="35"></circle> <circle cx="85" cy="105" r="8" fill="#a1e0a4"></circle> <circle cx="115" cy="105" r="8" fill="#a1e0a4"></circle> <rect fill="#8b5e3c" height="50" rx="4" width="16" x="92" y="110"></rect> <g fill="#4a3728"> <circle class="origin-center animate-blink" cx="88" cy="68" r="3" style="animation-delay: 0.2s;"></circle> <circle class="origin-center animate-blink" cx="112" cy="68" r="3"></circle> <path d="M 95 82 Q 100 88 105 82" fill="none" stroke="#4a3728" stroke-linecap="round" stroke-width="2.5"></path> </g> <g class="flower-bloom" style="animation-delay: 0.2s;"> <g class="flower-sway" style="transform-origin: 100px 35px;"> <circle cx="100" cy="35" r="8" fill="#fbcfe8"></circle> <circle cx="100" cy="35" r="3" fill="#f9a8d4"></circle> </g> </g> <g class="flower-bloom" style="animation-delay: 0.5s;"> <g class="flower-sway" style="transform-origin: 75px 45px; animation-delay: -0.5s;"> <circle cx="75" cy="45" r="7" fill="#fbcfe8"></circle> <circle cx="75" cy="45" r="2.5" fill="#f9a8d4"></circle> </g> </g> <g class="flower-bloom" style="animation-delay: 0.8s;"> <g class="flower-sway" style="transform-origin: 125px 45px; animation-delay: -1s;"> <circle cx="125" cy="45" r="7" fill="#fbcfe8"></circle> <circle cx="125" cy="45" r="2.5" fill="#f9a8d4"></circle> </g> </g> </g> <path d="M70 160 Q70 180 90 180 H 110 Q 130 180 130 160 V 150 H 70 Z" fill="#f2a28c"></path> <rect fill="#e59179" height="10" rx="3" width="70" x="65" y="145"></rect> </svg>`
];

// --- DOM Cache ---
let dom = {};

function cacheDOMElements() {
    dom.views = document.querySelectorAll('.view');
    dom.backButtons = document.querySelectorAll('.back-button');
    dom.navButtons = document.querySelectorAll('button[data-target-view]');

    // Add Activity History view to DOM cache
    const activityHistoryView = document.getElementById('view-activity-history');
    if (activityHistoryView) {
        // Ensure it's in the views collection
        const viewsArray = Array.from(dom.views);
        if (!viewsArray.includes(activityHistoryView)) {
            viewsArray.push(activityHistoryView);
            dom.views = viewsArray;
        }
    }

    // Main View
    dom.timerDisplay = document.getElementById('timer-display');
    dom.timerSessionLabel = document.getElementById('timer-session-label');
    dom.timerStartBtn = document.getElementById('timer-start'); // Correct ID
    dom.timerStopBtn = document.getElementById('timer-stop');   // Correct ID
    dom.timerResetBtn = document.getElementById('timer-reset'); // Correct ID
    dom.plantContainer = document.getElementById('plant-container');
    dom.gardenMessage = document.getElementById('garden-message');
    dom.gardenCount = document.getElementById('garden-count');
    dom.gardenLevel = document.getElementById('garden-level');
    dom.quoteText = document.getElementById('quote-text');
    dom.chatNavButton = document.querySelector('[data-target-view="chat"]');

    // Stretches View
    dom.stretchDoneBtn = document.getElementById('stretch-done');

    // Breathing View
    dom.breathingCircle = document.getElementById('breathing-circle');
    dom.breathingText = document.getElementById('breathing-text');
    dom.breathingTimer = document.getElementById('breathing-timer'); // Cached
    dom.breathingStartBtn = document.getElementById('breathing-start'); // Still cache, even if hidden
    dom.breathingDoneBtn = document.getElementById('breathing-done'); // Still cache, even if hidden

    // Chat View
    dom.chatView = document.getElementById('view-chat');
    dom.chatMessages = document.getElementById('chat-messages');
    dom.chatLoadingIndicator = document.getElementById('chat-loading-indicator');
    dom.chatForm = document.getElementById('chat-form');
    dom.chatInput = document.getElementById('chat-input');
    dom.chatSuggestions = document.getElementById('chat-suggestions');
    dom.suggestionButtons = document.querySelectorAll('.suggestion-btn');

    // Stretch View
    dom.stretchVideo = document.getElementById('stretch-video');
    dom.stretchTitle = document.getElementById('stretch-title');
    dom.stretchDescription = document.getElementById('stretch-description');
    dom.stretchPrev = document.getElementById('stretch-prev');
    dom.stretchNext = document.getElementById('stretch-next');

    // Overlay
    dom.overlay = document.getElementById('timer-overlay');
    dom.overlayTitle = document.getElementById('overlay-title');
    dom.overlayMessage = document.getElementById('overlay-message');
    dom.overlayTimer = document.getElementById('overlay-timer');
    dom.overlayTimerDisplay = document.getElementById('overlay-timer-display');
    dom.overlayStartBreakBtn = document.getElementById('overlay-start-break');
    dom.overlaySkipBreakBtn = document.getElementById('overlay-skip-break');

    // Proactive Overlay
    dom.proactiveOverlay = document.getElementById('proactive-overlay');
    dom.proactiveTitle = document.getElementById('proactive-title');
    dom.proactiveMessage = document.getElementById('proactive-message');
    dom.proactiveDismissBtn = document.getElementById('proactive-dismiss');

    // Audio
    dom.alarmAudio = document.getElementById('alarm-audio');
}

// --- View Navigation ---
function showView(viewName) {
    dom.views.forEach(view => {
        if (view.id === `view-${viewName}`) {
            view.classList.remove('hidden');
        } else {
            view.classList.add('hidden');
        }
    });

    // Stop breathing session if navigating away
    if (currentView === 'breathing' && viewName !== 'breathing') {
          stopBreathingSession();
    }
      // Start breathing session automatically when navigating TO it
      if (viewName === 'breathing' && currentView !== 'breathing') {
          startBreathingSession();
    }

    // Load initial suggestions when navigating TO chat
    if (viewName === 'chat' && currentView !== 'chat') {
        // Load initial suggestions immediately without loading text
        loadInitialSuggestions();
    }

    // Initialize stretch view when navigating TO stretches
    if (viewName === 'stretches' && currentView !== 'stretches') {
        stretchesViewed = 0; // Reset counter when entering stretches view
        displayStretch(0);
    }

    // Initialize breathing view when navigating TO breathing
    if (viewName === 'breathing' && currentView !== 'breathing') {
        breathingCyclesCompleted = 0; // Reset counter when entering breathing view
    }

    // Initialize activity history view when navigating TO activity-history
    if (viewName === 'activity-history' && currentView !== 'activity-history') {
        // Activity history is loaded when the menu item is clicked
        loadActivityHistory();
    }

    // Update current view AFTER all checks
    currentView = viewName;

    currentView = viewName; // Update current view *after* checks
}


// --- Timer Functions ---
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function startTimer() {
    //  console.log("Start button clicked");
    timerState.isRunning = true;
    if (dom.timerStartBtn) dom.timerStartBtn.classList.add('hidden');
    if (dom.timerStopBtn) dom.timerStopBtn.classList.remove('hidden');
    if (dom.timerResetBtn) dom.timerResetBtn.classList.remove('hidden');
    chrome.runtime.sendMessage({ command: 'startTimer' });
}

function stopTimer() {
    //  console.log("Stop button clicked");
    timerState.isRunning = false;
    if (dom.timerStartBtn) dom.timerStartBtn.classList.remove('hidden');
    if (dom.timerStopBtn) dom.timerStopBtn.classList.add('hidden');
    if (dom.timerResetBtn) dom.timerResetBtn.classList.remove('hidden');
    chrome.runtime.sendMessage({ command: 'stopTimer' });
}

function resetTimer() {
    //  console.log("Reset button clicked");
    timerState.isRunning = false;
    if (dom.timerStartBtn) dom.timerStartBtn.classList.remove('hidden');
    if (dom.timerStopBtn) dom.timerStopBtn.classList.add('hidden');
    if (dom.timerResetBtn) dom.timerResetBtn.classList.add('hidden');
    chrome.runtime.sendMessage({ command: 'resetTimer' });
    // Immediately update display to default work time from state
    if (dom.timerDisplay) dom.timerDisplay.textContent = timerState.defaultWorkTimeFormatted;
    if (dom.timerSessionLabel) dom.timerSessionLabel.textContent = 'Work';
}


function updateTimerDisplay(time, isBreak, isRunning) {
      //  console.log("UI Update Timer:", time, isBreak, isRunning);
    if (dom.timerDisplay) dom.timerDisplay.textContent = time;
    if (dom.timerSessionLabel) dom.timerSessionLabel.textContent = isBreak ? 'Break' : 'Work';
    timerState.isRunning = isRunning; // Update local state for button toggling
    if (isRunning) {
        if (dom.timerStartBtn) dom.timerStartBtn.classList.add('hidden');
        if (dom.timerStopBtn) dom.timerStopBtn.classList.remove('hidden');
        if (dom.timerResetBtn) dom.timerResetBtn.classList.remove('hidden');
    } else {
        if (dom.timerStartBtn) dom.timerStartBtn.classList.remove('hidden');
        if (dom.timerStopBtn) dom.timerStopBtn.classList.add('hidden');
        if (dom.timerResetBtn) dom.timerResetBtn.classList.add('hidden');
    }
}

// --- Garden Functions ---
function updateGardenDisplay() {
    // Calculate level based on progressive requirements
    let level = 1; // Start from level 1
    const count = gardenState.count;

    if (count >= 5) level = 2;      // Level 2: 5 activities
    if (count >= 10) level = 3;     // Level 3: 10 activities
    if (count >= 15) level = 4;     // Level 4: 15 activities
    if (count >= 25) level = 5;     // Level 5: 25 activities (10 more)
    if (count >= 45) level = 6;     // Level 6: 45 activities (20 more)
    if (count >= 75) level = 7;     // Level 7: 75 activities (30 more)

    gardenState.level = level;

    if (dom.gardenCount) dom.gardenCount.textContent = gardenState.count;
    if (dom.gardenLevel) dom.gardenLevel.textContent = gardenState.level;

    // Get the SVG string and update container (level 1 uses index 0, level 2 uses index 1, etc.)
    const iconIndex = Math.max(0, gardenState.level - 1); // Convert level 1-7 to array index 0-6
    const svgString = plantIcons[iconIndex] || plantIcons[0];
    if (dom.plantContainer) dom.plantContainer.innerHTML = svgString;

    // Get and display the message (level 1 uses index 0, level 2 uses index 1, etc.)
    const messageIndex = Math.max(0, gardenState.level - 1); // Convert level 1-7 to array index 0-6
    const message = gardenMessages[messageIndex] || gardenMessages[0];
    if (dom.gardenMessage) dom.gardenMessage.textContent = message;

    // Update progress indicator
    updateProgressIndicator();

    console.log("Garden state updated:", gardenState);
    console.log("Progress should be updated");

    // Grow Animation Logic - only when level increases and not on initial load
    if (gardenState.level > previousGardenLevel && previousGardenLevel !== -1 && dom.plantContainer) {
        dom.plantContainer.classList.add('animate-growAndBounce');
        setTimeout(() => {
            dom.plantContainer?.classList.remove('animate-growAndBounce');
        }, 1000);
    }

    // Update previous level
    previousGardenLevel = gardenState.level;
}

function updateProgressIndicator() {
    const count = gardenState.count;
    let currentLevelMin = 0;
    let nextLevelMin = 5; // Default for reaching level 2

    // Determine current level range
    if (count >= 75) {
        currentLevelMin = 75; // Max level reached
        nextLevelMin = 75;
    } else if (count >= 45) {
        currentLevelMin = 45;
        nextLevelMin = 75;
    } else if (count >= 25) {
        currentLevelMin = 25;
        nextLevelMin = 45;
    } else if (count >= 15) {
        currentLevelMin = 15;
        nextLevelMin = 25;
    } else if (count >= 10) {
        currentLevelMin = 10;
        nextLevelMin = 15;
    } else if (count >= 5) {
        currentLevelMin = 5;
        nextLevelMin = 10;
    } else {
        currentLevelMin = 0;
        nextLevelMin = 5;
    }

    // Calculate progress percentage
    let progressPercent = 0;
    if (nextLevelMin > currentLevelMin) {
        progressPercent = ((count - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
    } else {
        progressPercent = 100; // Max level
    }

    // Update the progress border
    const gardenCountElement = document.getElementById('garden-count');
    const progressContainer = document.querySelector('.progress-container');

    console.log("Progress percent:", progressPercent);

    if (gardenCountElement) {
        gardenCountElement.style.setProperty('--progress-percent', `${progressPercent}%`);
        console.log("Set CSS variable on garden-count:", `${progressPercent}%`);
    }

    if (progressContainer) {
        progressContainer.style.setProperty('--progress-percent', `${progressPercent}%`);
        console.log("Set CSS variable on progress-container:", `${progressPercent}%`);
    }
}

function completeActivity() {
    gardenState.count++;
    updateGardenDisplay();
    chrome.storage.local.set({ garden: gardenState });

    // Record activity for history
    recordActivity('garden', { timestamp: Date.now(), count: gardenState.count });
}

function handleStretchCompletion() {
    if (stretchesViewed >= 3) {
        // Show success modal with activity point celebration
        showStretchSuccessModal();
    } else {
        // Show confirmation modal asking if they really want to stop
        showStretchConfirmationModal();
    }
}

function showStretchConfirmationModal() {
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.id = 'stretch-confirmation-modal';
    modal.className = 'stretch-modal-overlay';
    modal.innerHTML = `
        <div class="stretch-modal-content">
            <div class="stretch-modal-icon">🤔</div>
            <h3 class="stretch-modal-title">Are you sure?</h3>
            <p class="stretch-modal-message">
                You've only done ${stretchesViewed} out of 10 stretches.
                To earn an activity point, you need to do at least 3 stretches.
                <br><br>
                <strong>Keep going for that wellness boost!</strong>
            </p>
            <div class="stretch-modal-buttons">
                <button class="stretch-btn stretch-btn-primary" id="stretch-continue">Continue Stretching</button>
                <button class="stretch-btn stretch-btn-secondary" id="stretch-finish-anyway">Finish Anyway</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById('stretch-continue').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('stretch-finish-anyway').addEventListener('click', () => {
        modal.remove();
        showView('main');
    });
}

function showStretchSuccessModal() {
    // Create success modal
    const modal = document.createElement('div');
    modal.id = 'stretch-success-modal';
    modal.className = 'stretch-modal-overlay';
    modal.innerHTML = `
        <div class="stretch-modal-content">
            <div class="stretch-modal-icon">🎉</div>
            <h3 class="stretch-modal-title">Great Job!</h3>
            <p class="stretch-modal-message">
                You completed ${stretchesViewed} stretches and earned yourself an activity point!
                <br><br>
                Your wellness journey is growing stronger! 🌱
            </p>
            <div class="activity-reward stretch-reward">
                <div class="reward-icon">🌱</div>
                <p class="reward-text">+1 Activity Point Earned!</p>
            </div>
            <div class="stretch-modal-buttons">
                <button class="stretch-btn stretch-btn-primary" id="stretch-celebrate">Awesome!</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Award activity point
    completeActivity();

    // Record stretch activity - count as 1 session, not individual stretches
    recordActivity('stretches', { timestamp: Date.now(), count: 1 });

    // Add event listener
    document.getElementById('stretch-celebrate').addEventListener('click', () => {
        modal.remove();
        showView('main');
    });
}

function handleBreathingCompletion() {
    if (breathingCyclesCompleted >= 3) {
        // Show success modal with activity point celebration
        showBreathingSuccessModal();
    } else {
        // Show confirmation modal asking if they really want to stop
        showBreathingConfirmationModal();
    }
}

function showBreathingConfirmationModal() {
    // Create confirmation modal
    const modal = document.createElement('div');
    modal.id = 'breathing-confirmation-modal';
    modal.className = 'stretch-modal-overlay';
    modal.innerHTML = `
        <div class="stretch-modal-content">
            <div class="stretch-modal-icon">🧘</div>
            <h3 class="stretch-modal-title">Almost There!</h3>
            <p class="stretch-modal-message">
                You've completed ${breathingCyclesCompleted} breathing cycles.
                To earn an activity point, you need to complete at least 3 full cycles.
                <br><br>
                <strong>Just a few more deep breaths for that wellness boost!</strong>
            </p>
            <div class="stretch-modal-buttons">
                <button class="stretch-btn stretch-btn-primary" id="breathing-continue">Continue Breathing</button>
                <button class="stretch-btn stretch-btn-secondary" id="breathing-finish-anyway">Finish Anyway</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    document.getElementById('breathing-continue').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('breathing-finish-anyway').addEventListener('click', () => {
        modal.remove();
        showView('main');
    });
}

function showBreathingSuccessModal() {
    // Create success modal
    const modal = document.createElement('div');
    modal.id = 'breathing-success-modal';
    modal.className = 'stretch-modal-overlay';
    modal.innerHTML = `
        <div class="stretch-modal-content">
            <div class="stretch-modal-icon">🌬️</div>
            <h3 class="stretch-modal-title">Peace Achieved!</h3>
            <p class="stretch-modal-message">
                You completed ${breathingCyclesCompleted} breathing cycles and earned an activity point!
                <br><br>
                Your mind is calmer and your wellness garden grows! 🧘‍♀️
            </p>
            <div class="activity-reward stretch-reward">
                <div class="reward-icon">🌱</div>
                <p class="reward-text">+1 Activity Point Earned!</p>
            </div>
            <div class="stretch-modal-buttons">
                <button class="stretch-btn stretch-btn-primary" id="breathing-celebrate">Namaste!</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Award activity point
    completeActivity();

    // Record breathing activity - count as 1 session, not individual cycles
    recordActivity('breathing', { timestamp: Date.now(), count: 1 });

    // Add event listener
    document.getElementById('breathing-celebrate').addEventListener('click', () => {
        modal.remove();
        showView('main');
    });
}

function displayStretch(index) {
    const stretch = stretches[index];
    if (dom.stretchVideo) {
        dom.stretchVideo.src = stretch.videoSrc;
        dom.stretchVideo.load();
    }
    if (dom.stretchTitle) dom.stretchTitle.textContent = stretch.title;
    if (dom.stretchDescription) dom.stretchDescription.textContent = stretch.description;

    if (dom.stretchPrev) dom.stretchPrev.disabled = (index === 0);
    if (dom.stretchNext) dom.stretchNext.disabled = (index === stretches.length - 1);

    currentStretchIndex = index;
    stretchesViewed = Math.max(stretchesViewed, index + 1); // Track highest stretch viewed
}

// --- Breathing Animation ---
function startBreathingSession() {
    //  console.log("Starting breathing session"); // Debug log
    // Buttons are hidden in this version, no need to toggle
    // dom.breathingStartBtn.classList.add('hidden');
    // dom.breathingDoneBtn.classList.remove('hidden');

    const sequence = [
        { text: 'Inhale', duration: 4000, class: 'inhale' },
        { text: 'Hold', duration: 4000, class: 'hold' },
        { text: 'Exhale', duration: 6000, class: 'exhale' },
        { text: 'Hold', duration: 2000, class: 'hold' },
    ];
    let sequenceIndex = 0;
    let timeInStep = 0; // ms remaining in current step

    // Clear any existing intervals/timeouts first
    stopBreathingSession();

    function runSequence() {
        const step = sequence[sequenceIndex % sequence.length];
        timeInStep = step.duration; // Reset timer for the step

        // Update Text
        if (dom.breathingText) dom.breathingText.textContent = step.text;

        // Update Animation Class
        if (dom.breathingCircle) {
            dom.breathingCircle.className = 'breathing-circle'; // Reset classes
            // Use requestAnimationFrame for smoother class application
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                   if (dom.breathingCircle) dom.breathingCircle.classList.add(step.class);
                });
            });
        }

        // Start countdown timer for the number
        let remainingSeconds = Math.ceil(step.duration / 1000);
        updateBreathingTimerDisplay(remainingSeconds); // Initial display

        breathingTimerInterval = setInterval(() => {
            remainingSeconds--;
            if (remainingSeconds > 0) {
                updateBreathingTimerDisplay(remainingSeconds);
            } else {
                updateBreathingTimerDisplay(''); // Clear display when done
                clearInterval(breathingTimerInterval);
                breathingTimerInterval = null;
            }
        }, 1000);

        // Set timeout for next step in sequence
        sequenceIndex++;
        breathingInterval = setTimeout(runSequence, step.duration);

        // Track completed cycles (each full sequence of 4 steps = 1 cycle)
        if (sequenceIndex % 4 === 0) {
            breathingCyclesCompleted++;
            console.log(`Breathing cycle ${breathingCyclesCompleted} completed`);
        }
    }

    // Initial state before starting animation
    if (dom.breathingText) dom.breathingText.textContent = 'Get Ready...';
    if (dom.breathingTimer) dom.breathingTimer.textContent = '4'; // Starting with Inhale 4s
    if (dom.breathingCircle) dom.breathingCircle.className = 'breathing-circle';

    // Delay before starting the first step
    breathingInterval = setTimeout(runSequence, 1500); // Give user a moment
}


function updateBreathingTimerDisplay(seconds) {
     if (dom.breathingTimer) {
         // Display number only if > 0, otherwise empty
         dom.breathingTimer.textContent = seconds > 0 ? seconds : '';
     } else {
         console.error("breathingTimer element not found in updateBreathingTimerDisplay"); // Debug log for TypeError
     }
}


function stopBreathingSession() {
    //  console.log("Stopping breathing session"); // Debug log
    if (breathingInterval) clearTimeout(breathingInterval);
    if (breathingAnimationTimeout) clearTimeout(breathingAnimationTimeout);
    if (breathingTimerInterval) clearInterval(breathingTimerInterval);
    breathingInterval = null;
    breathingAnimationTimeout = null;
    breathingTimerInterval = null;

    // Reset visual state only if elements exist
    if (dom.breathingText) dom.breathingText.textContent = ''; // Clear text
    if (dom.breathingTimer) dom.breathingTimer.textContent = ''; // Clear timer number
    if (dom.breathingCircle) dom.breathingCircle.className = 'breathing-circle'; // Reset classes
    // Buttons hidden
    // if(dom.breathingStartBtn) dom.breathingStartBtn.classList.remove('hidden');
    // if(dom.breathingDoneBtn) dom.breathingDoneBtn.classList.add('hidden');
}

// --- Chat Functions ---
function addChatMessage(sender, text) {
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', sender);

    if (sender === 'bot') {
        const content = document.createElement('div');
        content.classList.add('chat-content');
        bubble.appendChild(content);
        content.innerHTML = text;
    } else {
        const span = document.createElement('span');
        span.textContent = text;
        bubble.appendChild(span);
    }

    if (dom.chatMessages) {
        dom.chatMessages.appendChild(bubble);
        // Scroll to bottom for new messages
        dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    }
}

function handleChatSubmit(e) {
    e.preventDefault();
    if (!dom.chatInput) return;
    const prompt = dom.chatInput.value.trim();
    if (!prompt) return;

    // Add user message
    addChatMessage('user', prompt);
    dom.chatInput.value = '';

    // Hide suggestions after first message
    if (dom.chatSuggestions) dom.chatSuggestions.style.display = 'none';

    // Show thinking indicator while waiting for AI response
    showThinkingIndicator();

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
        console.warn("UI: Chat message request timed out");
        hideThinkingIndicator();
        addChatMessage('bot', "Sorry, the AI response timed out. Please try again.");
    }, 30000); // 30 second timeout

    chrome.runtime.sendMessage({ command: 'sendChatMessage', prompt: prompt }, (response) => {
        clearTimeout(timeoutId); // Clear timeout on response

        if (chrome.runtime.lastError) {
            console.error("UI: Chat message error:", chrome.runtime.lastError);
            hideThinkingIndicator();
            addChatMessage('bot', "Error communicating with AI: " + chrome.runtime.lastError.message);
            return;
        }

        // Hide thinking indicator
        hideThinkingIndicator();

        // Parse the AI response as JSON
        let aiResponse;
        try {
            if (typeof response === 'string') {
                aiResponse = JSON.parse(response);
            } else {
                aiResponse = response;
            }
        } catch (e) {
            console.error("UI: Failed to parse AI response as JSON:", e);
            addChatMessage('bot', "Sorry, there was an error processing the AI response.");
            return;
        }

        // Parse nested AI response structure
        const parsedData = parseNestedAIResponse(aiResponse);
        let responseText = parsedData.response;
        const followUpQuestions = parsedData.followUpQuestions;

        // Convert responseText to string if it's an object
        if (typeof responseText === 'object' && responseText !== null) {
            console.warn("UI: Response text is an object, converting to string");
            responseText = JSON.stringify(responseText);
        }

        // Format and add bot response
        const formattedResponse = formatMarkdownResponse(responseText);

        // Add follow-up questions as clickable elements within the message if available
        let fullMessage = formattedResponse;
        if (followUpQuestions.length > 0) {
            const followUpHtml = '<div class="follow-up-questions"><p><strong>Follow-up questions:</strong></p>' +
                followUpQuestions.map(q => `<button class="follow-up-btn" data-question="${q}">${q}</button>`).join('') +
                '</div>';
            fullMessage += followUpHtml;
        }

        addChatMessage('bot', fullMessage);

        // Add event listeners for follow-up buttons
        if (followUpQuestions.length > 0) {
            setTimeout(() => {
                const followUpButtons = document.querySelectorAll('.follow-up-btn');
                followUpButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const question = button.getAttribute('data-question');
                        if (question) {
                            handleChatSubmitFromSuggestion(question);
                        }
                    });
                });
            }, 100);
        }

        // Scroll to the top of the new AI response
        setTimeout(() => {
            if (dom.chatMessages) {
                const lastMessage = dom.chatMessages.lastElementChild;
                if (lastMessage) {
                    lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, 100);
    });
}

function parseNestedAIResponse(aiResponse) {
    try {
        console.log("parseNestedAIResponse input:", aiResponse);

        // Handle the case where aiResponse.response is an object containing response and followUpQuestions
        if (aiResponse && aiResponse.response && typeof aiResponse.response === 'object' && aiResponse.response.response) {
            console.log("Nested object structure detected");

            const innerResponse = aiResponse.response;

            // Check if innerResponse.response is a markdown code block with JSON
            if (typeof innerResponse.response === 'string' && innerResponse.response.startsWith('```json') && innerResponse.response.endsWith('```')) {
                console.log("Markdown code block in nested object detected");

                // Extract JSON from code block
                const jsonStart = innerResponse.response.indexOf('\n') + 1;
                const jsonEnd = innerResponse.response.lastIndexOf('\n');
                const jsonString = innerResponse.response.substring(jsonStart, jsonEnd).trim();

                console.log("Extracted JSON string:", jsonString);

                const innerData = JSON.parse(jsonString);
                console.log("Parsed inner data:", innerData);

                return {
                    response: innerData.response || "Sorry, couldn't get a response.",
                    followUpQuestions: innerData.followUpQuestions || innerResponse.followUpQuestions || []
                };
            } else {
                // Use the nested object directly
                console.log("Using nested object directly");
                return {
                    response: innerResponse.response || "Sorry, couldn't get a response.",
                    followUpQuestions: innerResponse.followUpQuestions || []
                };
            }
        }

        // If aiResponse already has response and followUpQuestions as direct properties
        if (aiResponse && typeof aiResponse.response === 'string') {
            console.log("Direct response string detected");

            // Check if response is a markdown code block with JSON
            if (aiResponse.response.startsWith('```json') && aiResponse.response.endsWith('```')) {
                console.log("Markdown code block detected");

                // Extract JSON from code block
                const jsonStart = aiResponse.response.indexOf('\n') + 1;
                const jsonEnd = aiResponse.response.lastIndexOf('\n');
                const jsonString = aiResponse.response.substring(jsonStart, jsonEnd).trim();

                console.log("Extracted JSON string:", jsonString);

                const innerData = JSON.parse(jsonString);
                console.log("Parsed inner data:", innerData);

                return {
                    response: innerData.response || "Sorry, couldn't get a response.",
                    followUpQuestions: innerData.followUpQuestions || aiResponse.followUpQuestions || []
                };
            } else {
                // Use the direct response and followUpQuestions
                console.log("Using direct response");
                return {
                    response: aiResponse.response,
                    followUpQuestions: aiResponse.followUpQuestions || []
                };
            }
        }

        // Fallback for other cases
        console.warn("Unexpected response format:", aiResponse);
        return { response: "Sorry, couldn't get a response.", followUpQuestions: aiResponse?.followUpQuestions || [] };
    } catch (e) {
        console.error("Failed to parse nested AI response:", e);
        return { response: "Sorry, there was an error processing the AI response.", followUpQuestions: [] };
    }
}

function formatMarkdownResponse(text) {
    // Handle case where text is not a string
    if (typeof text !== 'string') {
        console.error("formatMarkdownResponse: text is not a string:", text);
        return "<p>Error: Invalid response format</p>";
    }

    // Split into lines for processing
    const lines = text.split('\n');
    const result = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let currentListItems = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Handle code blocks
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                // End of code block
                result.push(`<pre><code>${codeBlockContent.join('\n')}</code></pre>`);
                codeBlockContent = [];
                inCodeBlock = false;
            } else {
                // Start of code block
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }

        // Handle headers
        if (line.startsWith('# ')) {
            result.push(`<h1>${formatInlineElements(line.substring(2).trim())}</h1>`);
        } else if (line.startsWith('## ')) {
            result.push(`<h2>${formatInlineElements(line.substring(3).trim())}</h2>`);
        } else if (line.startsWith('### ')) {
            result.push(`<h3>${formatInlineElements(line.substring(4).trim())}</h3>`);
        } else if (line.startsWith('#### ')) {
            result.push(`<h4>${formatInlineElements(line.substring(5).trim())}</h4>`);
        }
        // Handle list items
        else if (line.match(/^(\s*)- /) || line.match(/^(\s*)\* /) || line.match(/^(\s*)\d+\. /)) {
            const content = line.replace(/^(\s*)(- |\* |\d+\. )/, '').trim();
            currentListItems.push(`<li>${formatInlineElements(content)}</li>`);
        }
        // Handle empty lines (paragraph breaks)
        else if (line.trim() === '') {
            // Close any open list
            if (currentListItems.length > 0) {
                result.push('<ul>' + currentListItems.join('') + '</ul>');
                currentListItems = [];
            }
            // Don't add empty paragraphs
        }
        // Regular paragraphs
        else {
            // Close any open list first
            if (currentListItems.length > 0) {
                result.push('<ul>' + currentListItems.join('') + '</ul>');
                currentListItems = [];
            }
            result.push(`<p>${formatInlineElements(line)}</p>`);
        }
    }

    // Close any remaining list
    if (currentListItems.length > 0) {
        result.push('<ul>' + currentListItems.join('') + '</ul>');
    }

    // Join result
    const html = result.join('');
    return html;
}

function formatInlineElements(text) {
    return text
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function handleChatSubmitFromSuggestion(question) {
    // Add user message
    addChatMessage('user', question);
    // Hide suggestions
    if (dom.chatSuggestions) dom.chatSuggestions.style.display = 'none';

    // Show thinking indicator while waiting for AI response
    showThinkingIndicator();

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
        console.warn("UI: Suggestion chat request timed out");
        hideThinkingIndicator();
        addChatMessage('bot', "Sorry, the AI response timed out. Please try again.");
    }, 30000); // 30 second timeout

    chrome.runtime.sendMessage({ command: 'sendChatMessage', prompt: question }, (response) => {
        clearTimeout(timeoutId); // Clear timeout on response

        if (chrome.runtime.lastError) {
            console.error("UI: Suggestion chat error:", chrome.runtime.lastError);
            hideThinkingIndicator();
            addChatMessage('bot', "Error communicating with AI: " + chrome.runtime.lastError.message);
            return;
        }

        // Hide thinking indicator
        hideThinkingIndicator();

        // Parse the AI response as JSON
        let aiResponse;
        try {
            if (typeof response === 'string') {
                aiResponse = JSON.parse(response);
            } else {
                aiResponse = response;
            }
        } catch (e) {
            console.error("UI: Failed to parse AI response as JSON:", e);
            addChatMessage('bot', "Sorry, there was an error processing the AI response.");
            return;
        }

        console.log("Raw AI response:", aiResponse);
        console.log("Response type:", typeof aiResponse);
        if (aiResponse && typeof aiResponse === 'object') {
            console.log("Response properties:", Object.keys(aiResponse));
            console.log("Response.response:", aiResponse.response);
            console.log("Response.followUpQuestions:", aiResponse.followUpQuestions);
        }

        // Parse nested AI response structure
        const parsedData = parseNestedAIResponse(aiResponse);
        let responseText = parsedData.response;
        const followUpQuestions = parsedData.followUpQuestions;

        console.log("Parsed response:", responseText);
        console.log("Follow-up questions:", followUpQuestions);

        // Convert responseText to string if it's an object
        if (typeof responseText === 'object' && responseText !== null) {
            console.warn("UI: Response text is an object, converting to string");
            responseText = JSON.stringify(responseText);
        }

        // Format and add bot response
        const formattedResponse = formatMarkdownResponse(responseText);

        // Add follow-up questions as clickable elements within the message if available
        let fullMessage = formattedResponse;
        if (followUpQuestions.length > 0) {
            const followUpHtml = '<div class="follow-up-questions"><p><strong>Follow-up questions:</strong></p>' +
                followUpQuestions.map(q => `<button class="follow-up-btn" data-question="${q}">${q}</button>`).join('') +
                '</div>';
            fullMessage += followUpHtml;
        }

        addChatMessage('bot', fullMessage);

        // Add event listeners for follow-up buttons
        if (followUpQuestions.length > 0) {
            setTimeout(() => {
                const followUpButtons = document.querySelectorAll('.follow-up-btn');
                followUpButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const question = button.getAttribute('data-question');
                        if (question) {
                            handleChatSubmitFromSuggestion(question);
                        }
                    });
                });
            }, 100);
        }

        // Scroll to the top of the new AI response
        setTimeout(() => {
            if (dom.chatMessages) {
                const lastMessage = dom.chatMessages.lastElementChild;
                if (lastMessage) {
                    lastMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }, 100);
    });
}

// --- Quote Function ---
function updateQuote() {
    const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    if (dom.quoteText) dom.quoteText.textContent = `"${quote}"`;
}

// --- Overlay Functions ---
let overlayBreakInterval = null;
let overlayBreakTime = 0;

function showTimerCompletionOverlay(isBreak) {
    console.log("UI: showTimerCompletionOverlay called with isBreak:", isBreak);

    if (!dom.overlay) {
        console.warn("UI: overlay element not found");
        return;
    }

    if (isBreak) {
        // Break session completed
        console.log("UI: Setting up break completion overlay");
        dom.overlayTitle.textContent = "Break Complete!";
        dom.overlayMessage.textContent = "Ready to start your work session?";
        dom.overlayTimer.classList.remove('hidden');
        dom.overlayStartBreakBtn.textContent = "Start Work";
        dom.overlaySkipBreakBtn.textContent = "Continue Break";

        // Update timer label for break completion
        const timerLabel = document.getElementById('overlay-timer-label');
        if (timerLabel) timerLabel.textContent = "Next work session time";

        // Initialize overlay timer display with work time from config
        chrome.runtime.sendMessage({ command: 'getWorkTime' }, (response) => {
            if (response && response.workTime) {
                overlayBreakTime = response.workTime;
                updateOverlayTimerDisplay();
            }
        });
    } else {
        // Work session completed
        console.log("UI: Setting up work completion overlay");
        dom.overlayTitle.textContent = "Work Session Complete!";
        dom.overlayMessage.textContent = "Great job! Time for a well-deserved break.";
        dom.overlayTimer.classList.remove('hidden');
        dom.overlayStartBreakBtn.textContent = "Start Break";
        dom.overlaySkipBreakBtn.textContent = "Skip Break";

        // Update timer label for work completion
        const timerLabel = document.getElementById('overlay-timer-label');
        if (timerLabel) timerLabel.textContent = "Break time remaining";

        // Initialize overlay timer display with break time from config
        chrome.runtime.sendMessage({ command: 'getBreakTime' }, (response) => {
            if (response && response.breakTime) {
                overlayBreakTime = response.breakTime;
                updateOverlayTimerDisplay();
            }
        });
    }

    dom.overlay.classList.remove('hidden');
    // Auto-focus the primary button
    if (dom.overlayStartBreakBtn) dom.overlayStartBreakBtn.focus();

    console.log("UI: Overlay displayed");
}

function hideTimerCompletionOverlay() {
    if (!dom.overlay) return;

    dom.overlay.classList.add('hidden');
    if (overlayBreakInterval) {
        clearInterval(overlayBreakInterval);
        overlayBreakInterval = null;
    }
}

function startOverlayBreakTimer() {
    if (!dom.overlayTimerDisplay) return;

    console.log("UI: Starting overlay break timer");

    // Get break time from config
    chrome.runtime.sendMessage({ command: 'getBreakTime' }, (response) => {
        console.log("UI: Received break time response:", response);

        if (response && response.breakTime) {
            overlayBreakTime = response.breakTime;
            console.log("UI: Setting overlay break time to:", overlayBreakTime);
            updateOverlayTimerDisplay();

            overlayBreakInterval = setInterval(() => {
                overlayBreakTime--;
                updateOverlayTimerDisplay();

                if (overlayBreakTime <= 0) {
                    clearInterval(overlayBreakInterval);
                    overlayBreakInterval = null;
                    // Only auto-hide overlay if user hasn't manually started the break
                    // The overlay should stay open until user interacts with it
                    console.log("UI: Break timer completed, but keeping overlay open for user interaction");
                }
            }, 1000);
        } else {
            console.warn("UI: Could not get break time from config, response:", response);
        }
    });
}

function updateOverlayTimerDisplay() {
    if (dom.overlayTimerDisplay) {
        const minutes = Math.floor(overlayBreakTime / 60);
        const seconds = overlayBreakTime % 60;
        dom.overlayTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// --- Proactive Overlay Functions ---
function showProactiveOverlay(title, message) {
    if (!dom.proactiveOverlay || !dom.proactiveTitle || !dom.proactiveMessage) return;

    dom.proactiveTitle.textContent = title;
    dom.proactiveMessage.textContent = message;
    dom.proactiveOverlay.classList.remove('hidden');

    // Auto-hide after 8 seconds
    setTimeout(() => {
        hideProactiveOverlay();
    }, 8000);
}

function hideProactiveOverlay() {
    if (dom.proactiveOverlay) {
        dom.proactiveOverlay.classList.add('hidden');
    }
}

function playAlarmSoundInPopup() {
    //  console.log("Aegis: Playing alarm sound using HTML5 audio element");

    // Use the pre-loaded HTML5 audio element
    if (dom.alarmAudio) {
        try {
            // Reset to beginning in case it was played before
            dom.alarmAudio.currentTime = 0;
            dom.alarmAudio.volume = 0.8;

            const playPromise = dom.alarmAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    //  console.log("Aegis: HTML5 audio alarm played successfully");
                }).catch(e => {
                    console.warn("Aegis: HTML5 audio play failed:", e);
                    // Fallback to generated beep
                    playGeneratedBeepInPopup();
                });
            } else {
                console.warn("Aegis: HTML5 audio play promise undefined");
                playGeneratedBeepInPopup();
            }
        } catch (e) {
            console.warn("Aegis: HTML5 audio setup failed:", e);
            playGeneratedBeepInPopup();
        }
    } else {
        console.warn("Aegis: HTML5 audio element not found");
        playGeneratedBeepInPopup();
    }
}

function playGeneratedBeepInPopup() {
    //  console.log("Aegis: Playing generated beep in popup");

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        //  console.log("Aegis: Generated beep played successfully in popup");
    } catch (e) {
        console.warn("Aegis: Popup generated beep failed:", e);
    }
}

// --- Thinking Indicator Functions ---
function showThinkingIndicator() {
    let thinkingIndicator = document.getElementById('thinking-indicator');
    if (!thinkingIndicator) {
        thinkingIndicator = document.createElement('div');
        thinkingIndicator.id = 'thinking-indicator';
        thinkingIndicator.className = 'chat-bubble bot loading thinking-indicator';
        thinkingIndicator.innerHTML = `
            <div class="chat-content">
                <div class="thinking-pulse">
                    <div class="pulse-dot"></div>
                    <div class="pulse-dot"></div>
                    <div class="pulse-dot"></div>
                </div>
                <span class="thinking-text">ThriveBot is thinking</span>
            </div>
        `;
    }

    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.appendChild(thinkingIndicator);
    }

    thinkingIndicator.style.display = 'flex';

    // Scroll to the thinking indicator
    setTimeout(() => {
        if (thinkingIndicator) {
            thinkingIndicator.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, 10);
}

function hideThinkingIndicator() {
    const thinkingIndicator = document.getElementById('thinking-indicator');
    if (thinkingIndicator) {
        thinkingIndicator.style.display = 'none';
    }
}


// --- AI Suggestion Functions ---
function loadInitialSuggestions() {
    // Use fallback suggestions immediately to avoid message passing issues
    updateSuggestionButtons([
        "How can I improve my posture while working?",
        "What are some quick desk stretches?",
        "How do I stay focused during long work sessions?",
        "What should I do during my break time?"
    ]);

    // Don't try to get AI suggestions - just use the working defaults
    // The message port issues are persistent and the defaults work fine
}


// Removed generateAndShowFollowUpSuggestions function - now handled in handleChatSubmit


function updateSuggestionButtons(suggestions) {
    if (!dom.chatSuggestions) {
        return;
    }

    // Clear existing buttons and loading message
    const existingButtons = dom.chatSuggestions.querySelectorAll('.suggestion-btn');
    existingButtons.forEach(button => button.remove());

    const loadingDiv = document.getElementById('suggestions-loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }

    // Create new buttons for each suggestion
    suggestions.forEach((suggestion, index) => {
        const newButton = document.createElement('button');
        newButton.className = 'suggestion-btn';
        newButton.setAttribute('data-question', suggestion);

        // Use different icons for variety
        const icons = ['💡', '🤔', '🎯', '📝', '💭'];
        const icon = icons[index % icons.length];

        newButton.innerHTML = `
            <span class="suggestion-icon">${icon}</span>
            <span class="suggestion-text">${suggestion}</span>
        `;

        // Add click event listener
        newButton.addEventListener('click', () => {
            const question = newButton.getAttribute('data-question');
            if (question) {
                if (dom.chatSuggestions) dom.chatSuggestions.style.display = 'none';
                handleChatSubmitFromSuggestion(question);
            }
        });

        dom.chatSuggestions.appendChild(newButton);
    });

    // Make sure the suggestions container is visible
    dom.chatSuggestions.style.display = 'flex';
    dom.chatSuggestions.style.visibility = 'visible';
    dom.chatSuggestions.style.opacity = '1';
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // DOMContentLoaded fired
    cacheDOMElements();

    // Safety Checks
    if (!dom.timerStartBtn || !dom.timerStopBtn || !dom.timerResetBtn) console.error("Timer buttons missing!");
    if (!dom.breathingCircle || !dom.breathingText || !dom.breathingTimer) console.error("Breathing elements missing!");
    if (!dom.chatForm) console.error("Chat form missing!");


    // Setup Navigation
    console.log("Setting up navigation buttons...");
    console.log("Found nav buttons:", dom.navButtons.length);
    dom.navButtons.forEach(button => {
        console.log("Attaching listener to nav button:", button.getAttribute('data-target-view'));
        button.addEventListener('click', (e) => {
            console.log("Nav button clicked, target view:", button.getAttribute('data-target-view'));
            console.log("Event target:", e.target);
            console.log("Button element:", button);
            const targetView = button.getAttribute('data-target-view');
            console.log("Target view:", targetView);
            showView(targetView);
        });
    });
    console.log("Found back buttons:", dom.backButtons.length);
    dom.backButtons.forEach(button => {
        console.log("Attaching listener to back button:", button.getAttribute('data-target-view'));
        button.addEventListener('click', () => {
            const targetView = button.getAttribute('data-target-view');
            console.log("Back button clicked, target view:", targetView);
            showView(targetView);
        });
    });

    // Setup Header Menu Button
    const menuBtn = document.getElementById('menu-btn');
    const headerMenu = document.getElementById('header-menu');

    if (menuBtn && headerMenu) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            headerMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!headerMenu.contains(e.target) && e.target !== menuBtn) {
                headerMenu.classList.add('hidden');
            }
        });
    }

    // Setup Header Menu Items
    const menuAbout = document.getElementById('menu-about');
    const menuActivityHistory = document.getElementById('menu-activity-history');
    const menuSettings = document.getElementById('menu-settings');

    if (menuAbout) {
        menuAbout.addEventListener('click', () => {
            headerMenu.classList.add('hidden');
            showView('about');
        });
    }

    if (menuActivityHistory) {
        menuActivityHistory.addEventListener('click', () => {
            headerMenu.classList.add('hidden');
            showView('activity-history');
            loadActivityHistory();
        });
    }

    if (menuSettings) {
        menuSettings.addEventListener('click', () => {
            headerMenu.classList.add('hidden');
            // For now, settings can just show an alert or navigate to a settings view
            // Since there's no settings view, we'll show an alert
            alert('Settings functionality coming soon!');
        });
    }

    // Setup Timer Listeners
    if (dom.timerStartBtn) dom.timerStartBtn.addEventListener('click', startTimer);
    if (dom.timerStopBtn) dom.timerStopBtn.addEventListener('click', stopTimer);
    if (dom.timerResetBtn) dom.timerResetBtn.addEventListener('click', resetTimer);

    // Setup Stretches Listeners
    if (dom.stretchDoneBtn) dom.stretchDoneBtn.addEventListener('click', () => {
        handleStretchCompletion();
    });

    if (dom.stretchNext) dom.stretchNext.addEventListener('click', () => {
        if (currentStretchIndex < stretches.length - 1) {
            displayStretch(currentStretchIndex + 1);
        }
    });

    if (dom.stretchPrev) dom.stretchPrev.addEventListener('click', () => {
        if (currentStretchIndex > 0) {
            displayStretch(currentStretchIndex - 1);
        }
    });

    // Setup Breathing Feeling Better Listener
    const breathingFeelingBetterBtn = document.getElementById('breathing-feeling-better');
    if (breathingFeelingBetterBtn) {
        breathingFeelingBetterBtn.addEventListener('click', () => {
            handleBreathingCompletion();
        });
    }

    // Setup Chat Listener
    if (dom.chatForm) {
        // Setup chat form listener
        if (dom.chatForm) {
            dom.chatForm.addEventListener('submit', handleChatSubmit);
        }
    } else {
        console.error("UI: chatForm not found in DOM");
    }

    // Load initial AI-generated suggestions - moved to showView('chat')
    // console.log("UI: About to load initial suggestions");
    // loadInitialSuggestions();

    // Setup Suggestion Buttons
    if (dom.suggestionButtons) {
        dom.suggestionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const question = button.getAttribute('data-question');
                if (question) {
                    // Hide suggestions and send the question
                    if (dom.chatSuggestions) dom.chatSuggestions.style.display = 'none';
                    handleChatSubmitFromSuggestion(question);
                }
            });
        });
    }

    // Setup Overlay Listeners
    if (dom.overlayStartBreakBtn) {
        dom.overlayStartBreakBtn.addEventListener('click', () => {
            hideTimerCompletionOverlay();
            chrome.runtime.sendMessage({ command: 'startBreakFromOverlay' });
            // Start the break timer when user clicks "Start Break"
            startOverlayBreakTimer();
        });
    }
    if (dom.overlaySkipBreakBtn) {
        dom.overlaySkipBreakBtn.addEventListener('click', () => {
            hideTimerCompletionOverlay();
            chrome.runtime.sendMessage({ command: 'skipBreakFromOverlay' });
        });
    }

    // Setup Proactive Overlay Listeners
    if (dom.proactiveDismissBtn) {
        dom.proactiveDismissBtn.addEventListener('click', () => {
            hideProactiveOverlay();
        });
    }

    // Load Initial Garden Data
    chrome.storage.local.get('garden', (data) => {
        if (data.garden) gardenState = data.garden;
        // Calculate initial level based on progressive requirements
        const count = gardenState.count;
        let level = 1; // Start from level 1
        if (count >= 5) level = 2;
        if (count >= 10) level = 3;
        if (count >= 15) level = 4;
        if (count >= 25) level = 5;
        if (count >= 45) level = 6;
        if (count >= 75) level = 7;
        gardenState.level = level;
        // Set previous level to prevent animation on initial load
        previousGardenLevel = gardenState.level;
        updateGardenDisplay();
    });

    // Get Initial Timer State & Config Defaults
    chrome.runtime.sendMessage({ command: 'getTimerState' }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn("Could not get timer state:", chrome.runtime.lastError.message);
            updateTimerDisplay(timerState.defaultWorkTimeFormatted, false, false); // Use fallback default
            // Hide reset button on initial load
            if (dom.timerResetBtn) dom.timerResetBtn.classList.add('hidden');
        } else if (response) {
            timerState.defaultWorkTimeFormatted = response.defaultWorkTime || "25:00"; // Store default for reset
            updateTimerDisplay(response.time, response.isBreak, response.isRunning);
            // Hide reset button if timer is not running
            if (!response.isRunning && dom.timerResetBtn) dom.timerResetBtn.classList.add('hidden');
        }
    });

    // Check AI Availability
    chrome.runtime.sendMessage({ command: 'checkAI' }, (response) => {
          if (chrome.runtime.lastError) {
              console.error("Could not check AI status:", chrome.runtime.lastError.message);
              if (dom.chatNavButton) dom.chatNavButton.classList.add('hidden');
          } else if (response?.aiModelAvailable) { // Check response exists
             aiModelReady = true;
            if (dom.chatNavButton) dom.chatNavButton.classList.remove('hidden');
         } else {
             aiModelReady = false;
             if (dom.chatNavButton) dom.chatNavButton.classList.add('hidden');
         }
     });

    // Check if popup was opened due to timer completion
    chrome.runtime.sendMessage({ command: 'checkPendingTimerCompletion' }, (response) => {
        if (response && response.showOverlay) {
            //  console.log("Aegis: Showing pending timer completion overlay");
            showTimerCompletionOverlay(response.isBreak);
            // Don't play alarm sound here - it was already played by offscreen document
        }
    });


    // Quote Rotator - Show random quote on extension open
    if (dom.quoteText) {
        updateQuote();
        // Change quote every 30 seconds instead of 10
        quoteInterval = setInterval(updateQuote, 30000);
    }

    // Listen for Timer Updates from Background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.command === 'updateTimer') {
            updateTimerDisplay(message.time, message.isBreak, message.isRunning);
        } else if (message.command === 'showTimerCompletionOverlay') {
            showTimerCompletionOverlay(message.isBreak);
            // Play alarm sound when overlay is shown
            playAlarmSoundInPopup();
        } else if (message.command === 'showProactiveOverlay') {
            showProactiveOverlay(message.title, message.message);
        } else if (message.command === 'updateGarden') {
            // Update garden state when background notifies of changes
            gardenState = message.garden;
            updateGardenDisplay();
            //  console.log("Aegis: Garden updated from background:", gardenState);
        } else if (message.command === 'navigateToStretches') {
            // Navigate to stretches view when triggered from proactive overlay
            showView('stretches');
        }
    });

    // Check URL parameters for initial view navigation
    const urlParams = new URLSearchParams(window.location.search);
    const initialView = urlParams.get('view');
    if (initialView === 'stretches') {
        showView('stretches');
    }

    // Show thinking indicator when waiting for AI response
    // This will be called when the user submits a message

    // Show main view
    showView('main');
});

// --- Activity History Functions ---

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

function loadActivityHistory() {
    chrome.storage.local.get('activityHistory', (result) => {
        const history = result.activityHistory || {
            workSessions: [],
            breakSessions: [],
            stretches: [],
            breathing: []
        };

        activityHistory = history;

        // Check if there's any activity data
        const hasData = history.workSessions.length > 0 ||
                       history.breakSessions.length > 0 ||
                       history.stretches.length > 0 ||
                       history.breathing.length > 0;

        if (!hasData) {
            showNoDataState();
        } else {
            hideNoDataState();
            populateActivityTables();
            generateDynamicCharts();
            setupChartTabs(); // Setup chart tab functionality
            setupTableTabs(); // Setup table tab functionality
        }
    });
}

function populateActivityTables() {
    // Populate Work & Break table
    const workBreakTable = document.getElementById('work-break-table').querySelector('tbody');
    workBreakTable.innerHTML = '';

    const allSessions = [
        ...activityHistory.workSessions.map(s => ({ ...s, type: 'Work' })),
        ...activityHistory.breakSessions.map(s => ({ ...s, type: 'Break' }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 20); // Last 20 sessions

    allSessions.forEach(session => {
        const row = document.createElement('tr');
        const dateObj = new Date(session.timestamp);
        const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const duration = session.duration ? formatTime(session.duration) : 'N/A';
        const sessionType = session.type === 'Work' ? 'Work Session' : 'Break Session';

        row.innerHTML = `
            <td>${date}</td>
            <td>${time}</td>
            <td>${sessionType}</td>
            <td>${duration}</td>
        `;
        workBreakTable.appendChild(row);
    });

    // Populate Stretches table
    const stretchesTable = document.getElementById('stretches-table').querySelector('tbody');
    stretchesTable.innerHTML = '';

    activityHistory.stretches.slice(-20).reverse().forEach(stretch => {
        const row = document.createElement('tr');
        const dateObj = new Date(stretch.timestamp);
        const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        row.innerHTML = `
            <td>${date}</td>
            <td>${time}</td>
            <td>${stretch.count || stretchesViewed} stretches</td>
        `;
        stretchesTable.appendChild(row);
    });

    // Populate Breathing table
    const breathingTable = document.getElementById('breathing-table').querySelector('tbody');
    breathingTable.innerHTML = '';

    activityHistory.breathing.slice(-20).reverse().forEach(breath => {
        const row = document.createElement('tr');
        const dateObj = new Date(breath.timestamp);
        const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        row.innerHTML = `
            <td>${date}</td>
            <td>${time}</td>
            <td>${breath.count || breathingCyclesCompleted} cycles</td>
        `;
        breathingTable.appendChild(row);
    });
}

function generateDynamicCharts() {
    // Create dynamic charts based on actual activity data
    const weeklyData = generateWeeklyDataFromHistory();
    const monthlyData = generateMonthlyDataFromHistory();

    // Create SVG-based line charts
    createWeeklyChart(weeklyData);
    createMonthlyChart(monthlyData);
}

function setupChartTabs() {
    const tabs = document.querySelectorAll('.chart-tab');
    const chartContainers = document.querySelectorAll('.chart-container');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');

            // Hide all chart containers
            chartContainers.forEach(container => container.classList.add('hidden'));

            // Show the corresponding chart container
            const chartType = tab.getAttribute('data-chart');
            const targetContainer = document.querySelector(`#${chartType}-chart`).parentElement;
            if (targetContainer) {
                targetContainer.classList.remove('hidden');
            }
        });
    });
}

function setupTableTabs() {
    const tabs = document.querySelectorAll('.table-tab');
    const tableCategories = document.querySelectorAll('.history-category');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');

            // Hide all table categories
            tableCategories.forEach(category => category.classList.add('hidden'));

            // Show the corresponding table category
            const tableType = tab.getAttribute('data-table');
            let targetTitle;
            switch(tableType) {
                case 'work-break':
                    targetTitle = 'Work & Break Sessions';
                    break;
                case 'stretches':
                    targetTitle = 'Desk Stretches';
                    break;
                case 'breathing':
                    targetTitle = 'Stress Relief';
                    break;
            }

            const categories = document.querySelectorAll('.history-category');
            categories.forEach(category => {
                const title = category.querySelector('.category-title');
                if (title && title.textContent === targetTitle) {
                    category.classList.remove('hidden');
                }
            });
        });
    });
}

function createWeeklyChart(data) {
    const container = document.getElementById('weekly-chart');
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

    const ctx = document.createElement('canvas');
    ctx.width = 280;
    ctx.height = 160;
    container.appendChild(ctx);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Work Sessions',
                    data: data.work,
                    borderColor: '#78A193',
                    backgroundColor: 'rgba(120, 161, 147, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Desk Stretches',
                    data: data.stretches,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Stress Relief',
                    data: data.breathing,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#374151',
                    bodyColor: '#374151',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e5e7eb'
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                },
                line: {
                    borderWidth: 2
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function createMonthlyChart(data) {
    const container = document.getElementById('monthly-chart');
    if (!container) return;

    // Clear any existing content
    container.innerHTML = '';

    const ctx = document.createElement('canvas');
    ctx.width = 280;
    ctx.height = 160;
    container.appendChild(ctx);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Work Sessions',
                    data: data.work,
                    borderColor: '#78A193',
                    backgroundColor: 'rgba(120, 161, 147, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Desk Stretches',
                    data: data.stretches,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Stress Relief',
                    data: data.breathing,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#374151',
                    bodyColor: '#374151',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 6,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            return context[0].label;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e5e7eb'
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                },
                line: {
                    borderWidth: 2
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function showNoDataState() {
    const content = document.querySelector('.activity-history-content');
    if (!content) return;

    // Hide charts and tables
    const chartsSection = content.querySelector('.charts-section');
    const tablesSection = content.querySelector('.history-tables');

    if (chartsSection) chartsSection.style.display = 'none';
    if (tablesSection) tablesSection.style.display = 'none';

    // Show no data message
    let noDataDiv = content.querySelector('.no-data-message');
    if (!noDataDiv) {
        noDataDiv = document.createElement('div');
        noDataDiv.className = 'no-data-message';
        noDataDiv.innerHTML = `
            <div class="no-data-content">
                <div class="no-data-icon">📊</div>
                <h3 class="no-data-title">No Activity Data Yet</h3>
                <p class="no-data-text">
                    Your wellness journey starts here! Begin building healthy habits by completing activities like work sessions, desk stretches, and breathing exercises.
                </p>
                <div class="no-data-actions">
                    <button class="no-data-btn" onclick="showView('main')">
                        <span class="material-symbols-outlined">play_arrow</span>
                        Start Your Wellness Journey
                    </button>
                </div>
                <div class="no-data-tips">
                    <h4>💡 Quick Tips to Get Started:</h4>
                    <ul>
                        <li>Complete a 25-minute work session</li>
                        <li>Try 3 desk stretches</li>
                        <li>Practice a breathing exercise</li>
                    </ul>
                </div>
            </div>
        `;
        content.appendChild(noDataDiv);
    }
    noDataDiv.style.display = 'block';
}

function hideNoDataState() {
    const content = document.querySelector('.activity-history-content');
    if (!content) return;

    // Show charts and tables
    const chartsSection = content.querySelector('.charts-section');
    const tablesSection = content.querySelector('.history-tables');

    if (chartsSection) chartsSection.style.display = 'flex';
    if (tablesSection) tablesSection.style.display = 'flex';

    // Hide no data message
    const noDataDiv = content.querySelector('.no-data-message');
    if (noDataDiv) {
        noDataDiv.style.display = 'none';
    }
}

function generateWeeklyDataFromHistory() {
    const labels = [];
    const work = [];
    const stretches = [];
    const breathing = [];

    // Generate last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();

        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

        // Count activities for this date
        const dayWork = activityHistory.workSessions.filter(session =>
            new Date(session.timestamp).toDateString() === dateStr
        ).length;

        const dayStretches = activityHistory.stretches.filter(stretch =>
            new Date(stretch.timestamp).toDateString() === dateStr
        ).length; // Count sessions, not individual stretches

        const dayBreathing = activityHistory.breathing.filter(breath =>
            new Date(breath.timestamp).toDateString() === dateStr
        ).length; // Count sessions, not individual cycles

        work.push(dayWork);
        stretches.push(dayStretches);
        breathing.push(dayBreathing);
    }

    return { labels, work, stretches, breathing };
}

function generateMonthlyDataFromHistory() {
    const labels = [];
    const work = [];
    const stretches = [];
    const breathing = [];

    // Debug: Log current activity history
    console.log('Current activity history:', activityHistory);

    // Generate last 4 weeks
    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        // Set to start of day for weekStart
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        // Set to end of day for weekEnd
        weekEnd.setHours(23, 59, 59, 999);

        const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
        const startDay = weekStart.getDate();
        const endDay = weekEnd.getDate();

        if (startMonth === endMonth) {
            labels.push(`${startMonth} ${startDay}-${endDay}`);
        } else {
            labels.push(`${startMonth} ${startDay}-${endMonth} ${endDay}`);
        }

        // Debug: Log date ranges
        console.log(`Week ${4-i} range:`, weekStart.toISOString(), 'to', weekEnd.toISOString());

        // Count activities for this week
        const weekWork = activityHistory.workSessions.filter(session => {
            const sessionDate = new Date(session.timestamp);
            const isInRange = sessionDate >= weekStart && sessionDate <= weekEnd;
            console.log('Work session:', sessionDate.toISOString(), 'vs range:', weekStart.toISOString(), '-', weekEnd.toISOString(), 'in range:', isInRange);
            return isInRange;
        }).length;

        const weekStretches = activityHistory.stretches.filter(stretch => {
            const stretchDate = new Date(stretch.timestamp);
            const isInRange = stretchDate >= weekStart && stretchDate <= weekEnd;
            console.log('Stretch:', stretchDate.toISOString(), 'vs range:', weekStart.toISOString(), '-', weekEnd.toISOString(), 'in range:', isInRange);
            return isInRange;
        }).length; // Count sessions, not individual stretches

        const weekBreathing = activityHistory.breathing.filter(breath => {
            const breathDate = new Date(breath.timestamp);
            const isInRange = breathDate >= weekStart && breathDate <= weekEnd;
            console.log('Breathing:', breathDate.toISOString(), 'vs range:', weekStart.toISOString(), '-', weekEnd.toISOString(), 'in range:', isInRange);
            return isInRange;
        }).length; // Count sessions, not individual cycles

        work.push(weekWork);
        stretches.push(weekStretches);
        breathing.push(weekBreathing);
    }

    // Debug: Log the generated data
    console.log('Generated monthly data:', { labels, work, stretches, breathing });

    return { labels, work, stretches, breathing };
}