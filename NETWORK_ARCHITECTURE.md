# Network Architecture & Failover Strategy

## Overview
The TicketSystem uses a robust, race-to-success networking strategy to ensure seamless connectivity between the Dashboard (Host) and Scanners (Clients), even in complex network environments like Mobile Hotspots or strict Firewalls.

## Core Components

### 1. Centralized Network Service (`backend/services/networkService.js`)
- **Role:** Single source of truth for network configuration.
- **Functions:**
    - Discovers all available local IPv4 interfaces.
    - Manages the Cloud Tunnel (Ngrok).
    - Prioritizes IP addresses based on heuristic scoring.

### 2. IP Prioritization Strategy
The system scores network interfaces to guess the most likely "reachable" LAN IP:
- **Hotspots/Bridges (172.x.x.x):** Score +2. Prioritized for iPhone Hotspots.
- **Standard LAN (192.168.x.x):** Score +2.
- **Enterprise LAN (10.x.x.x):** Score +1.
- **WiFi/Ethernet Interfaces:** Bonus score based on name.
- **Virtual Adapters:** Explicitly ignored (Docker, WSL, VMware).

### 3. Failover & Discovery Logic (Client-Side)
Both the Scanner and Dashboard implement a "Race-to-Success" pattern:

1.  **Discovery:** Client fetches `/api/system/network-config`.
2.  **Candidates:** The response includes `publicUrl` (Cloud) and a list of `localUrls`.
3.  **Race:** The client pings ALL candidates simultaneously (`Promise.any`-like logic).
4.  **Selection:** The **first** URL to respond with 200 OK is selected as the active `apiBaseUrl`.
5.  **Fallback:** If all pings fail (e.g., offline), the system falls back to the primary Local IP or previously known good config.

## API Endpoints

### `GET /api/system/network-config`
Returns the complete network topology.
```json
{
  "status": "success",
  "data": {
    "publicUrl": "https://xyz.ngrok-free.app",
    "localUrls": ["http://192.168.1.5:3001", "http://172.20.10.2:3001"],
    "preferredLocalUrl": "http://172.20.10.2:3001",
    "status": "online", // or 'local-only'
    "type": "ngrok", // or 'local'
    "timestamp": 1735123456789
  }
}
```

### `POST /api/scanner/heartbeat/:eventId`
Used by scanners to report their status and negotiated connection type.
- **Payload:** `{ deviceId, type: 'LAN' | 'NGROK', battery }`
- **Behavior:** Updates the dashboard's "Live Scanners" list.

## Security Posture
- **Permissions-Policy:** Explicitly sets `camera=*` to allow scanner functionality.
- **CORS:** Currently `*` to allow seamless LAN/Cloud switching (prototyping phase).
- **Scanner Auth:** Token-based authentication for sensitive operations.

## Failover Scenarios

| Scenario | Behavior |
| :--- | :--- |
| **Internet Lost** | Scanner auto-switches to LAN IP (Background Optimizer). |
| **Cloud Tunnel Down** | Dashboard generates QR codes pointing to Local IP. |
| **Moved to New Network** | Server restarts -> New IP discovery -> Scanner requires re-link (or auto-discovery if on same subnet). |
| **Slow Cloud Connection** | "Smart Connect" logic prioritizes LAN if available. |
