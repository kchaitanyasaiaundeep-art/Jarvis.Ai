// J.A.R.V.I.S. Core Script - Secure API Key Version

// Check if API key is stored in your browser, otherwise prompt for it once
let apiKey = localStorage.getItem('jarvis_gemini_key');
if (!apiKey) {
    apiKey = prompt("Enter your Gemini API key (stored securely in your browser only):");
    if (apiKey) {
        localStorage.setItem('jarvis_gemini_key', apiKey.trim());
    }
}

const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const voiceOverlay = document.getElementById('voiceOverlay');
const voiceOutputText = document.getElementById('voiceOutputText');
const voiceStatusText = document.getElementById('voiceStatusText');

// Browser Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isListening = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        voiceStatusText.innerText = "Listening...";
    };

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        voiceOutputText.innerText = `"${speechResult}"`;
        sendToGemini(speechResult, true);
    };

    recognition.onend = () => {
        isListening = false;
    };
}

// UI Controls for Voice Mode Overlay
function openVoiceOverlay() {
    voiceOverlay.classList.add('active');
}

function closeVoiceOverlay() {
    voiceOverlay.classList.remove('active');
    if (speechSynthesis.speaking) speechSynthesis.cancel();
}

function toggleSpeechRecognition() {
    if (!recognition) {
        alert("Speech recognition is not supported on this browser.");
        return;
    }
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

// Append text bubbles to the chat interface
function appendTextBubble(text, isUser) {
    const div = document.createElement('div');
    div.className = `message-bubble ${isUser ? 'user-message' : 'jarvis-message'}`;
    
    if (!isUser) {
        div.innerHTML = `<div class="ai-icon"></div><div>${text}</div>`;
    } else {
        div.innerText = text;
    }

    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Handle keyboard text entry
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        const text = userInput.value.trim();
        if (text) {
            appendTextBubble(text, true);
            userInput.value = '';
            sendToGemini(text, false);
        }
    }
}

// Communication with Gemini API Endpoint
async function sendToGemini(promptText, isVoiceMode) {
    if (!apiKey) {
        alert("No API key found. Please refresh and enter your key.");
        return;
    }

    if (isVoiceMode) voiceStatusText.innerText = "Thinking...";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `You are JARVIS, an advanced AI assistant. Keep answers concise, intelligent, and natural. User asks: ${promptText}` }] }]
            })
        });

        const data = await response.json();

        if (data.error) {
            const errorMsg = `API Error: ${data.error.message}`;
            if (isVoiceMode) voiceOutputText.innerText = errorMsg;
            else appendTextBubble(errorMsg, false);
            return;
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
            if (isVoiceMode) {
                voiceOutputText.innerText = reply;
                voiceStatusText.innerText = "Speaking...";
                speakText(reply);
            } else {
                appendTextBubble(reply, false);
            }
        } else {
            const errStr = "Debug JSON: " + JSON.stringify(data);
            if (isVoiceMode) voiceOutputText.innerText = errStr;
            else appendTextBubble(errStr, false);
        }

    } catch (err) {
        const netErr = "Network error connecting to model.";
        if (isVoiceMode) voiceOutputText.innerText = netErr;
        else appendTextBubble(netErr, false);
    }
}

// Text-to-Speech Output Handler
function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    utterance.onend = () => {
        voiceStatusText.innerText = "Listening...";
        if (recognition) recognition.start();
    };
    window.speechSynthesis.speak(utterance);
    }
  
