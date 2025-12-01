const ngrok = require('@ngrok/ngrok');
const config = require('./config');
const os = require('os');

let url = null;
let urlType = null; // 'ngrok', 'local'
let listener = null;

const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    let bestCandidate = 'localhost';

    // 1. Prioritize Wi-Fi / Wireless
    for (const name of Object.keys(interfaces)) {
        const lowerName = name.toLowerCase();
        // Skip virtual adapters
        if (lowerName.includes('vethernet') || lowerName.includes('virtual') || lowerName.includes('wsl') || lowerName.includes('docker') || lowerName.includes('pseudo')) {
            continue;
        }
        
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                // High priority
                if (lowerName.includes('wi-fi') || lowerName.includes('wireless')) {
                    return iface.address;
                }
                // Medium priority (Ethernet, etc.) - store for later if no Wi-Fi found
                bestCandidate = iface.address;
            }
        }
    }
    return bestCandidate;
};

const start = async () => {
    // 1. Try Ngrok
    try {
        console.log("Attempting to start ngrok tunnel...");
        
        const token = process.env.NGROK_AUTHTOKEN;
        if (!token) {
             console.warn("WARNING: No NGROK_AUTHTOKEN found in environment variables.");
             // We can try without token, but it likely fails or has limits.
             // The new library typically requires a token or setup.
             throw new Error("NGROK_AUTHTOKEN is required for @ngrok/ngrok.");
        }
        
        console.log(`Ngrok Token found: ${token.substring(0, 4)}... (hidden)`);

        // Using the new @ngrok/ngrok API
        listener = await ngrok.connect({ 
            addr: config.port, 
            authtoken: token 
        });
        
        url = listener.url();
        urlType = 'ngrok';
        
        console.log(`
----------------------------------------------------------------`);
        console.log(`SUCCESS: Ngrok tunnel opened!`);
        console.log(`Scanner Link: ${url}/scanner`);
        console.log(`(Must use HTTPS for camera access on Android)`);
        console.log(`----------------------------------------------------------------
`);
        return url;
    } catch (error) {
        console.error('\n!!! Ngrok failed to start !!!');
        console.error('Reason:', error.message);
        console.error('Troubleshooting: Check your NGROK_AUTHTOKEN in backend/.env');
    }

    // 2. Fallback to Local IP
    const ip = getLocalIp();
    url = `http://${ip}:${config.port}`;
    urlType = 'local';
    
    console.log(`
----------------------------------------------------------------`);
    console.log(`FALLBACK: Using Local Network IP: ${url}`);
    console.log(`Note: Your phone must be on the SAME Wi-Fi network as this computer.`);
    console.log(`----------------------------------------------------------------
`);
    
    return url;
};

const stop = async () => {
    try {
        if (listener) {
            await listener.close();
            listener = null;
        }
        console.log('Tunnel stopped');
    } catch (error) {
        console.error('Error stopping tunnel:', error);
    }
};

const getUrl = () => url;
const getUrlType = () => urlType;

module.exports = { start, stop, getUrl, getUrlType, getLocalIp };