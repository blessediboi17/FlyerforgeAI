// ==========================================
// FLYERFORGE ENGINE - CORE JAVASCRIPT
// ==========================================

// State Management
let currentTab = 'chat';
let uploadedFile = null;
const HF_MODEL_URL = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell";

// DOM Element Selectors
const navChat = document.getElementById('nav-chat');
const navStudio = document.getElementById('nav-studio');
const chatView = document.getElementById('chat-view');
const studioView = document.getElementById('studio-view');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.getElementById('close-modal');
const apiKeyInput = document.getElementById('api-key-input');
const saveKeyBtn = document.getElementById('save-key-btn');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const fileInput = document.getElementById('file-input');
const fileBadge = document.getElementById('file-badge');
const fileName = document.getElementById('file-name');
const removeFileBtn = document.getElementById('remove-file');
const canvasPlaceholder = document.getElementById('canvas-placeholder');
const generatedImage = document.getElementById('generated-image');
const studioActions = document.getElementById('studio-actions');
const downloadBtn = document.getElementById('download-btn');
const refineBtn = document.getElementById('refine-btn');

// ==========================================
// 1. APP NAVIGATION & UI TABS
// ==========================================
function switchTab(tab) {
    currentTab = tab;
    if (tab === 'chat') {
        // Active Chat UI state
        navChat.classList.add('text-indigo-400');
        navChat.classList.remove('text-slate-500');
        navStudio.classList.add('text-slate-500');
        navStudio.classList.remove('text-indigo-400');
        chatView.classList.remove('hidden');
        studioView.classList.add('hidden');
    } else {
        // Active Studio Canvas UI state
        navStudio.classList.add('text-indigo-400');
        navStudio.classList.remove('text-slate-500');
        navChat.classList.add('text-slate-500');
        navChat.classList.remove('text-indigo-400');
        studioView.classList.remove('hidden');
        chatView.classList.add('hidden');
    }
}

navChat.addEventListener('click', () => switchTab('chat'));
navStudio.addEventListener('click', () => switchTab('studio'));

// ==========================================
// 2. API KEY MANAGEMENT (LOCAL STORAGE)
// ==========================================
// Load saved token on startup
window.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('hf_api_token');
    if (savedKey) {
        apiKeyInput.value = savedKey;
    } else {
        // Gently alert user to add a key if missing
        setTimeout(() => { settingsModal.classList.remove('hidden'); }, 1000);
    }
});

settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => settingsModal.classList.add('hidden'));
saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('hf_api_token', key);
        alert('API Token Saved Securely to Phone Browser!');
        settingsModal.classList.add('hidden');
    } else {
        alert('Please enter a valid Hugging Face token.');
    }
});

// ==========================================
// 3. IMAGE UPLOAD HANDLING (FIX FEATURE)
// ==========================================
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadedFile = file;
        fileName.textContent = file.name;
        fileBadge.classList.remove('hidden');
    }
});

removeFileBtn.addEventListener('click', () => {
    uploadedFile = null;
    fileInput.value = '';
    fileBadge.classList.add('hidden');
});

// ==========================================
// 4. CORE CHAT & AI PICTURE INFERENCE
// ==========================================
function appendMessage(sender, text, imageUrl = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `flex items-start space-x-3 max-w-[85%] ${sender === 'user' ? 'self-end flex-row-reverse space-x-reverse' : ''}`;
    
    const icon = sender === 'user' ? 'fa-user text-indigo-400' : 'fa-robot text-cyan-400';
    const bgClass = sender === 'user' ? 'bg-indigo-600 border-indigo-500 rounded-tr-none' : 'bg-slate-900 border-slate-800 rounded-tl-none';

    let contentHTML = `<p class="text-sm leading-relaxed">${text}</p>`;
    if (imageUrl) {
        contentHTML += `<img src="${imageUrl}" class="mt-2 rounded-xl max-w-full h-auto border border-slate-700 shadow" alt="Attachment" />`;
    }

    msgDiv.innerHTML = `
        <div class="bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center border border-slate-700 shrink-0">
            <i class="fa-solid ${icon} text-xs"></i>
        </div>
        <div class="${bgClass} border rounded-2xl p-3.5 shadow-md">
            ${contentHTML}
        </div>
    `;
    
    chatView.appendChild(msgDiv);
    chatView.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

async function forgeGraphic(promptText) {
    const token = localStorage.getItem('hf_api_token');
    if (!token) {
        alert("Hold up! Tap the settings icon at the top right to paste your Hugging Face API Token first.");
        settingsModal.classList.remove('hidden');
        return;
    }

    // Step 4a: Auto-enhance the prompt for ultra professional design layouts
    let enhancedPrompt = `Professional clean graphic design, ${promptText}, sharp crisp typography, balanced layout, premium brand aesthetic, 8k resolution, vector elements, high commercial print quality, no messy artifact distortions`;
    
    if (uploadedFile) {
        enhancedPrompt += `, modifying and mastering the uploaded composition layouts cleanly`;
    }

    appendMessage('ai', 'Forging your graphic assets now... Please sit tight, this takes about 5 to 10 seconds.');

    try {
        const response = await fetch(HF_MODEL_URL, {
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({ inputs: enhancedPrompt }),
        });

        if (!response.ok) {
            throw new Error(`API returned an error code: ${response.status}`);
        }

        // Convert return image stream blob directly to an executable URL object
        const imageBlob = await response.blob();
        const finalImgUrl = URL.createObjectURL(imageBlob);

        // Update the Main Chat Log View
        appendMessage('ai', 'Boom! Here is your professional design layout. I have sent it straight to your Studio Canvas as well.', finalImgUrl);

        // Update the Studio View Elements
        canvasPlaceholder.classList.add('hidden');
        generatedImage.src = finalImgUrl;
        generatedImage.classList.remove('hidden');
        studioActions.classList.remove('hidden');

        // Swap viewport focus to view the layout instantly
        setTimeout(() => switchTab('studio'), 800);

    } catch (error) {
        console.error(error);
        appendMessage('ai', `Ah man, something went wrong during generation. Check your API token or check your phone internet connection. Error details: ${error.message}`);
    }
}

// Event Bindings for text submissions
sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (!text && !uploadedFile) return;

    let attachedUrl = null;
    if (uploadedFile) {
        attachedUrl = URL.createObjectURL(uploadedFile);
    }

    appendMessage('user', text || "Fix this image design details:", attachedUrl);
    userInput.value = '';
    
    // Pass execution off to inference logic
    forgeGraphic(text || "masterful cleanup modification");
    
    // Flush upload state clean
    uploadedFile = null;
    fileInput.value = '';
    fileBadge.classList.add('hidden');
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// ==========================================
// 5. STUDIO WORKSPACE INTERACTION CONTROLS
// ==========================================
downloadBtn.addEventListener('click', () => {
    if (!generatedImage.src) return;
    
    // Create a temporary link element to trigger structural download
    const dlLink = document.createElement('a');
    dlLink.href = generatedImage.src;
    dlLink.download = `FlyerForge-${Date.now()}.jpg`;
    document.body.appendChild(dlLink);
    dlLink.click();
    document.body.removeChild(dlLink);
});

refineBtn.addEventListener('click', () => {
    switchTab('chat');
    userInput.placeholder = "Tell me what changes or corrections to make...";
    userInput.focus();
});
