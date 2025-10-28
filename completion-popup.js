// --- Thrive Wellness Completion Popup Script ---
'use strict';

let breakTimerInterval = null;
let breakTimeRemaining = 0;

// Get URL parameters to determine popup type
const urlParams = new URLSearchParams(window.location.search);
const isBreak = urlParams.get('isBreak') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const breakTimer = document.getElementById('break-timer');
    const timerDisplay = document.getElementById('timer-display');
    const startBreakBtn = document.getElementById('start-break-btn');
    const skipBreakBtn = document.getElementById('skip-break-btn');

    // Configure popup based on type
    if (isBreak) {
        // Break completion
        popupTitle.textContent = "Break Complete!";
        popupMessage.textContent = "Ready to get back to work?";
        breakTimer.classList.add('hidden');
        startBreakBtn.textContent = "Start Work";
        skipBreakBtn.textContent = "Continue Break";
    } else {
        // Work completion
        popupTitle.textContent = "Work Session Complete!";
        popupMessage.textContent = "Great job! Time for a well-deserved break.";
        breakTimer.classList.remove('hidden');
        startBreakBtn.textContent = "Start Break";
        skipBreakBtn.textContent = "Skip Break";
    }

    // Event listeners
    startBreakBtn.addEventListener('click', () => {
        if (isBreak) {
            // Start work after break
            chrome.runtime.sendMessage({ command: 'startBreakFromOverlay' });
        } else {
            // Start break after work
            startBreakTimer();
        }
        window.close();
    });

    skipBreakBtn.addEventListener('click', () => {
        if (isBreak) {
            // Continue break
            chrome.runtime.sendMessage({ command: 'skipBreakFromOverlay' });
        } else {
            // Skip break
            chrome.runtime.sendMessage({ command: 'skipBreakFromOverlay' });
        }
        window.close();
    });

    // Play alarm sound
    playAlarmSound();
});

function startBreakTimer() {
    // Get break time from background
    chrome.runtime.sendMessage({ command: 'getBreakTime' }, (response) => {
        if (response && response.breakTime) {
            breakTimeRemaining = response.breakTime;
            updateTimerDisplay();

            breakTimerInterval = setInterval(() => {
                breakTimeRemaining--;
                updateTimerDisplay();

                if (breakTimeRemaining <= 0) {
                    clearInterval(breakTimerInterval);
                    breakTimerInterval = null;
                    // Auto-complete break
                    chrome.runtime.sendMessage({ command: 'overlayBreakComplete' });
                    window.close();
                }
            }, 1000);
        }
    });
}

function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        const minutes = Math.floor(breakTimeRemaining / 60);
        const seconds = breakTimeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function playAlarmSound() {
    // Create a simple beep sound
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

        //  console.log("Aegis: Completion popup alarm played");
    } catch (e) {
        console.warn("Aegis: Completion popup alarm failed:", e);
    }
}