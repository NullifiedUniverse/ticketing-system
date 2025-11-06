
// --- State ---
let config = null; // { eventId, apiKey, apiBaseUrl }
let isScanningSetup = false;
let html5QrCode;
let isPaused = false;
let scanMode = 'check-in'; // 'check-in' or 'check-out'

// --- DOM Elements ---
const eventIdDisplay = document.getElementById('event-id-display');
const scanStatus = document.getElementById('scan-status');
const actionButton = document.getElementById('action-button');
const scanControls = document.getElementById('scan-controls');
const scanModeToggle = document.getElementById('scan-mode-toggle');
const resultPopup = document.getElementById('result-popup');
const resultCard = document.getElementById('result-card');
const resultIcon = document.getElementById('result-icon');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const readerOverlay = document.getElementById('reader-overlay');
const readerPlaceholder = document.getElementById('reader-placeholder');

// --- Functions ---
function showResult(type, title, message) {
    resultTitle.textContent = title;
    resultMessage.textContent = message;
    resultCard.classList.remove('border-green-500', 'border-red-500', 'border-yellow-500');
    if (type === 'success') resultCard.classList.add('border-green-500');
    else if (type === 'error') resultCard.classList.add('border-red-500');
    else resultCard.classList.add('border-yellow-500');
    resultIcon.innerHTML = type === 'success' ? '✅' : (type === 'error' ? '❌' : '⚙️');
    resultPopup.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    setTimeout(() => resultPopup.classList.add('opacity-0', 'scale-95', 'pointer-events-none'), 2000);
}

async function onScanSuccess(decodedText, decodedResult) {
    if (isPaused) return;
    isPaused = true;
    navigator.vibrate?.(100);

    if (isScanningSetup) {
        try {
            const parsedConfig = JSON.parse(decodedText);
            if (parsedConfig.eventId && parsedConfig.apiKey && parsedConfig.apiBaseUrl) {
                config = parsedConfig;
                eventIdDisplay.textContent = `Event: ${config.eventId}`;
                showResult('success', 'Setup Complete!', `Scanning for ${config.eventId}`);
                stopScanning();
                setTimeout(() => startScanning(false), 500);
            } else throw new Error('Invalid setup code.');
        } catch (e) {
            showResult('error', 'Setup Failed', 'Not a valid setup QR code.');
            setTimeout(() => { isPaused = false; }, 2000);
        }
        return;
    }

    if (!config) {
        showResult('error', 'Not Configured', 'Please scan a setup code first.');
        setTimeout(() => { isPaused = false; }, 2000);
        return;
    }

    scanStatus.textContent = `Validating...`;
    scanStatus.classList.remove('scanning-dots');
    try {
        const response = await fetch(`${config.apiBaseUrl}/update-ticket-status/${config.eventId}/${decodedText}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': config.apiKey },
            body: JSON.stringify({ action: scanMode })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        showResult('success', result.data.message, '');
    } catch (error) {
        showResult('error', 'Validation Failed', error.message);
    } finally {
        setTimeout(() => { updateScanStatus(false); isPaused = false; }, 2000);
    }
}

function onScanFailure(error) { /* Ignore */ }

function updateScanStatus(isSetup) {
    scanStatus.textContent = isSetup ? 'Scan setup QR from admin panel' : `Scanning for ${scanMode.replace('-', ' ')}`;
    scanStatus.classList.add('scanning-dots');
}

function startScanning(isSetup) {
    isScanningSetup = isSetup;
    scanStatus.textContent = 'Starting camera...';
    scanStatus.classList.remove('scanning-dots');
    readerPlaceholder.style.display = 'none';

    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, onScanSuccess, onScanFailure)
        .then(() => {
            readerOverlay.style.display = 'block';
            scanControls.style.display = isSetup ? 'none' : 'flex';
            updateScanStatus(isSetup);
            actionButton.textContent = 'Stop Scanning';
            isPaused = false;
        }).catch(err => {
            scanStatus.textContent = 'Camera permission denied.';
            readerPlaceholder.style.display = 'block';
        });
}

function stopScanning() {
    html5QrCode.stop().then(() => {
        scanStatus.textContent = 'Scanner stopped.';
        scanStatus.classList.remove('scanning-dots');
        actionButton.textContent = 'Scan Setup Code';
        readerOverlay.style.display = 'none';
        scanControls.style.display = 'none';
        readerPlaceholder.style.display = 'block';
        isScanningSetup = false;
    }).catch(err => { });
}

document.addEventListener('DOMContentLoaded', () => {
    html5QrCode = new Html5Qrcode("reader");
});

actionButton.addEventListener('click', () => {
    html5QrCode.getState() === Html5QrcodeScannerState.SCANNING ? stopScanning() : startScanning(true);
});

scanModeToggle.addEventListener('change', (e) => {
    scanMode = e.target.checked ? 'check-out' : 'check-in';
    updateScanStatus(false);
});
