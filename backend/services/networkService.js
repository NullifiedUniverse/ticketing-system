const ngrok = require('@ngrok/ngrok');
const config = require('../config');
const os = require('os');
const logger = require('../utils/logger');

class NetworkService {
    constructor() {
        this.tunnelUrl = null;
        this.tunnelType = 'local'; // 'ngrok' or 'local'
        this.listener = null;
    }

    getLocalIps() {
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
                    
                    // Prioritize IPs
                    if (iface.address.startsWith('192.168.')) score += 2;
                    if (iface.address.startsWith('172.')) score += 2; // Hotspot / Docker Bridge
                    if (iface.address.startsWith('10.')) score += 1;

                    candidates.push({ ip: iface.address, score });
                }
            }
        }

        // Return sorted list of Full URLs
        return candidates
            .sort((a, b) => b.score - a.score)
            .map(c => `http://${c.ip}:${config.port}`)
            .concat([`http://localhost:${config.port}`]);
    }

    getNetworkConfig() {
        const localUrls = this.getLocalIps();
        const primaryLocalUrl = localUrls.length > 0 ? localUrls[0] : `http://localhost:${config.port}`;
        
        return {
            publicUrl: this.tunnelUrl, // Can be null
            localUrls: localUrls,
            preferredLocalUrl: primaryLocalUrl,
            status: this.tunnelUrl ? 'online' : 'local-only',
            type: this.tunnelType,
            timestamp: Date.now()
        };
    }

    async startTunnel() {
        // 1. Try Ngrok
        try {
            logger.info("Attempting to start ngrok tunnel...");
            
            const token = process.env.NGROK_AUTHTOKEN;
            const region = process.env.NGROK_REGION || 'us'; 
            
            if (!token) {
                 logger.warn("WARNING: No NGROK_AUTHTOKEN found. Skipping Cloud Tunnel.");
                 return;
            }
            
            this.listener = await ngrok.connect({ 
                addr: config.port, 
                authtoken: token,
                region: region 
            });
            
            this.tunnelUrl = this.listener.url();
            this.tunnelType = 'ngrok';
            
            console.log('\n================================================================');
            console.log(`🚀  PUBLIC SERVER LINK (Ngrok):`);
            console.log(`👉  ${this.tunnelUrl}`);
            console.log('================================================================\n');
            
            logger.info(`SUCCESS: Ngrok tunnel opened at ${this.tunnelUrl} (${region})`);
            return this.tunnelUrl;

        } catch (error) {
            logger.error(`Ngrok failed to start: ${error.message}`);
            // Don't crash, just stay local
        }
    }

    async stopTunnel() {
        try {
            if (this.listener) {
                await this.listener.close();
                this.listener = null;
                this.tunnelUrl = null;
                this.tunnelType = 'local';
            }
            logger.info('Tunnel stopped');
        } catch (error) {
            logger.error('Error stopping tunnel:', error);
        }
    }
}

module.exports = new NetworkService();