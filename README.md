# 🎫 TicketSystem - Enterprise Event Ecosystem

**Engineered by Null**

A high-performance, full-stack event management suite featuring real-time synchronization, high-fidelity visual effects, and robust security. This system was designed to handle everything from ticket issuance and validation to cinematic prize raffles.

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Node Definitions
    subgraph Frontend ["✨ Reactive Frontend Layer"]
        direction TB
        A[Admin Dashboard]:::react
        C[QR Scanner PWA]:::html
        G[Celestial Raffle]:::canvas
    end
    
    subgraph Backend ["⚙️ Core Backend Layer"]
        direction TB
        B[Node.js API]:::node
        E[Email Service]:::service
        F[Network Manager]:::service
    end
    
    subgraph Persistence ["☁️ Data Layer"]
        D[(Firestore Database)]:::db
    end

    %% Connections
    A <==>|REST/WS| B
    C <==>|Sync| B
    G <==>|State Poll| B
    B <==>|Read/Write| D
    B -.->|SMTP| E
    F -->|Tunneling| B
    
    %% Styles
    classDef react fill:#e3f2fd,stroke:#0288d1,stroke-width:2px,color:#01579b
    classDef html fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#e65100
    classDef canvas fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c
    classDef node fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20
    classDef service fill:#fafafa,stroke:#757575,stroke-width:1px,stroke-dasharray: 5 5
    classDef db fill:#eceff1,stroke:#455a64,stroke-width:3px,color:#263238
```

## 🧠 System Logic & Data Flow

### 🎟️ The Ticket Lifecycle
Visualizing the high-speed journey from issuance to check-in.

```mermaid
sequenceDiagram
    participant Admin
    participant System as ⚙️ Core System
    participant Attendee
    participant Scanner as 📱 Smart Scanner
    participant DB as ☁️ Firestore

    Admin->>System: Issue Ticket (Batch/Single)
    System->>DB: Store Ticket Data
    System->>Attendee: Email QR Code
    
    Note right of Attendee: Event Day
    
    Attendee->>Scanner: Present QR Code
    Scanner->>Scanner: Local Cache Check (0ms Latency)
    Scanner->>System: Async Status Update
    System->>DB: Persist Check-in
    DB->>Admin: ⚡ Real-time Dashboard Update
```

### 🎲 Celestial Raffle Engine
The physics-based state machine powering the cinematic reveal.

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Rolling : Operator Clicks START
    
    state Rolling {
        [*] --> Selection : RNG Algorithm
        Selection --> Physics : Generate Starfield
        Physics --> Trajectory : Calculate Comet Path
    }
    
    Rolling --> Revealed : Animation Complete (8s)
    Revealed --> Idle : Operator Clicks NEXT
    
    note right of Rolling
        Visuals sync across 
        all connected screens
        instantly via WebSockets
    end note
```

### 🌐 Smart Network Topology
Automatic switching mechanism for uninterrupted operations.

```mermaid
graph TB
    %% Nodes
    subgraph Cloud ["🌍 Public Internet"]
        Ngrok(Ngrok Tunnel):::cloud
        Firebase[(Firebase Cloud)]:::cloud
    end
    
    subgraph Local ["🏢 Local Venue Network"]
        Server[Node.js Host]:::server
        Dash[Dashboard Monitor]:::client
        ScannerA[Scanner A (Local WiFi)]:::device
    end
    
    subgraph Remote ["📶 Remote / 4G"]
        ScannerB[Scanner B (Cellular)]:::device
    end

    %% Links
    Server <==>|Secure Tunnel| Ngrok
    Server <==>|SDK| Firebase
    
    ScannerA <-->|LAN IP (Fast)| Server
    ScannerB <-->|Public URL| Ngrok
    Dash <-->|Localhost| Server
    
    %% Styles
    classDef cloud fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef server fill:#37474f,stroke:#263238,stroke-width:4px,color:white
    classDef client fill:#f5f5f5,stroke:#616161,stroke-width:2px
    classDef device fill:#fff8e1,stroke:#ff8f00,stroke-width:2px
```

## 🚀 Core Modules

### 1. Command Center (Dashboard)
*   **Real-time Analytics:** Occupancy tracking and check-in velocity charts.
*   **Active Monitoring:** Heartbeat tracking for all connected scanner devices.
*   **Smart Networking:** Automatic detection and toggling between Local (LAN) and Cloud (Ngrok) tunnels.

### 2. Celestial Raffle System
*   **Cinematic Experience:** A dedicated canvas-driven display with starfield physics and shockwave effects.
*   **Dynamic Queuing:** Manage prizes with a "Title | Name | Image" syntax.
*   **Responsive Layout:** Optimized for both 16:9 and ultra-wide (3120x1144) displays.

### 3. Smart Scanner
*   **Zero-Latency:** Local caching allows for rapid scanning even in high-density environments.
*   **Universal:** Standalone HTML/JS app compatible with any modern mobile browser.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Framer Motion, HTML5 Canvas, Recharts |
| **Backend** | Node.js, Express, Firebase Admin SDK, Winston, Multer |
| **Security** | Helmet, Express Rate Limit, Joi Validation, Session Auth |
| **Networking** | Ngrok integration, dynamic IP discovery |

---

## 📦 Setup & Installation

### Prerequisites
*   Node.js (v16+)
*   Firebase Project with Firestore enabled
*   SMTP credentials (for email features)

### Quick Start

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Null/TicketSystem.git
    cd TicketSystem
    ```

2.  **Backend Configuration**
    *   Place your `serviceAccountKey.json` in `/backend`.
    *   Create `/backend/.env` with:
        ```env
        PORT=3001
        NGROK_AUTHTOKEN=your_token
        EMAIL_USER=your_email
        EMAIL_PASS=your_app_password
        ```
    *   `cd backend && npm install && npm start`

3.  **Frontend Configuration**
    *   `cd frontend && npm install && npm run build`
    *   The backend will automatically serve the production build on port 3001.

---

## 📖 Usage Guide

### Raffle Control
Use the **Raffle Control** link in the dashboard sidebar.
*   **To add a prize with an image:**
    1.  Upload image using the built-in uploader.
    2.  Use syntax: `Grand Prize | iPhone 15 Pro | background-12345.png`
*   **To start:** Click **START**. The display will animate for 8 seconds before allowing the **NEXT** draw.

### Scanner Setup
1.  Open the Dashboard and select an event.
2.  Click **Scanner Setup** (📱) to generate a configuration QR.
3.  Scan the QR with any phone to instantly link it to the system.

---

## 🤝 Contribution
Contributions are welcome. Please ensure that:
*   Components follow the "Bento Box" design language.
*   Security headers and rate-limiting remain intact.
*   New API endpoints are documented in `docs/API.md`.

## 📜 License
System developed by **Null**. All rights reserved. 

---
*Generated for peak performance and visual elegance.*
