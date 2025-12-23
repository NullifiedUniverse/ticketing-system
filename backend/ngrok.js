const ngrok = require('@ngrok/ngrok');
const config = require('./config');
const os = require('os');

let url = null;
let urlType = null; // 'ngrok', 'local'
let listener = null;

const getLocalIp = () => {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const name of Object.keys(interfaces)) {
        const lowerName = name.toLowerCase();
        
        // Extended Filter for Virtual/VPN Adapters
        if (
            lowerName.includes('vethernet') || 
            lowerName.includes('virtual') || 
            lowerName.includes('wsl') || 
            lowerName.includes('docker') || 
            lowerName.includes('pseudo') ||
            lowerName.includes('vmware') ||
            lowerName.includes('vbox') ||
            lowerName.includes('vpn') ||
            lowerName.includes('tap') ||
            lowerName.includes('tun')
        ) {
            continue;
        }
        
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                // Score the interface
                let score = 0;
                if (lowerName.includes('wi-fi') || lowerName.includes('wireless')) score += 10;
                if (lowerName.includes('eth')) score += 5;
                if (iface.address.startsWith('192.168.')) score += 2;
                if (iface.address.startsWith('10.')) score += 1;

                candidates.push({ ip: iface.address, score, name });
            }
        }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    
    // Return primary candidate or localhost
    return candidates.length > 0 ? candidates[0].ip : 'localhost';
};

const getLocalIps = () => {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const name of Object.keys(interfaces)) {
        const lowerName = name.toLowerCase();
        
        // Extended Filter
        if (
            lowerName.includes('vethernet') || 
            lowerName.includes('virtual') || 
            lowerName.includes('wsl') || 
            lowerName.includes('docker') || 
            lowerName.includes('pseudo') ||
            lowerName.includes('vmware') ||
            lowerName.includes('vbox') ||
            lowerName.includes('vpn') ||
            lowerName.includes('tap') ||
            lowerName.includes('tun')
        ) {
            continue;
        }
        
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                let score = 0;
                if (lowerName.includes('wi-fi') || lowerName.includes('wireless')) score += 10;
                if (lowerName.includes('eth')) score += 5;
                if (iface.address.startsWith('192.168.')) score += 2;

                candidates.push({ ip: iface.address, score });
            }
        }
    }

    return candidates.sort((a, b) => b.score - a.score).map(c => c.ip);
};

const start = async () => {
    // 1. Try Ngrok
    try {
        console.log("Attempting to start ngrok tunnel...");
        
        const token = process.env.NGROK_AUTHTOKEN;
        const region = process.env.NGROK_REGION || 'us'; // Default to US, allow override
        
        if (!token) {
             console.warn("WARNING: No NGROK_AUTHTOKEN found in environment variables.");
             throw new Error("NGROK_AUTHTOKEN is required for @ngrok/ngrok.");
        }
        
        console.log(`Ngrok Token found: ${token.substring(0, 4)}... (hidden)`);
        console.log(`Ngrok Region: ${region.toUpperCase()}`);

        // Using the new @ngrok/ngrok API
        listener = await ngrok.connect({ 
            addr: config.port, 
            authtoken: token,
            region: region // Specify the region here
        });
        
        url = listener.url();
        urlType = 'ngrok';
        
        console.log(`
----------------------------------------------------------------`);
        console.log(`SUCCESS: Ngrok tunnel opened!`);
        console.log(`Region:  ${region.toUpperCase()}`);
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

module.exports = { start, stop, getUrl, getUrlType, getLocalIp, getLocalIps };