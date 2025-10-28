// --- Offscreen Document for Audio Playback ---
// This allows audio to play even when the browser is not active

let audioElement = null;

// Initialize audio element
function initAudio() {
    audioElement = document.getElementById('alarm-audio');
    if (audioElement) {
        //  console.log("Offscreen: Audio element initialized");
        audioElement.addEventListener('canplay', () => {
            //  console.log("Offscreen: Audio can play");
        });
        audioElement.addEventListener('error', (e) => {
            console.warn("Offscreen: Audio error:", e);
        });
    } else {
        console.warn("Offscreen: Audio element not found");
    }
}

// Play alarm sound
function playAlarm() {
    if (audioElement) {
        // Reset to beginning
        audioElement.currentTime = 0;
        audioElement.volume = 0.8;

        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                //  console.log("Offscreen: Alarm played successfully");
            }).catch(e => {
                console.warn("Offscreen: Alarm play failed:", e);
            });
        }
    } else {
        console.warn("Offscreen: Audio element not ready");
    }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'playAlarm') {
        //  console.log("Offscreen: Received playAlarm message");
        playAlarm();
        sendResponse({ success: true });
    }
    return true; // Keep message channel open
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAudio);

// Also try to initialize immediately in case DOM is already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudio);
} else {
    initAudio();
}