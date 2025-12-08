# TicketSystem Documentation

## Table of Contents
1.  [Project Overview](#project-overview)
2.  [Installation](#installation)
3.  [Architecture](#architecture)
4.  [Features](#features)
5.  [Usage Guide](#usage-guide)
6.  [Scanner Setup](#scanner-setup)
7.  [Troubleshooting](#troubleshooting)

---

## Project Overview
TicketSystem is a real-time event management and ticketing solution. It consists of three main components:
*   **Admin Dashboard:** A React-based web interface for managing events, tickets, and emails.
*   **Backend API:** A Node.js/Express server that handles business logic, database (Firestore) synchronization, and email dispatch.
*   **Mobile Scanner:** A standalone HTML5/JS web app for scanning QR codes at event gates.

## Installation

### Prerequisites
*   Node.js (v16+)
*   npm
*   A Firebase Project (with Firestore enabled)
*   A Gmail account (for SMTP) or other SMTP credentials
*   Ngrok Account (for public access)

### Setup Steps

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd TicketSystem
    ```

2.  **Backend Setup:**
    *   Navigate to `backend/`:
        ```bash
        cd backend
        npm install
        ```
    *   Create a `.env` file in `backend/` with the following:
        ```env
        PORT=3001
        # Firebase Admin SDK Service Account (Path to JSON file)
        GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json 
        
        # Ngrok
        NGROK_AUTHTOKEN=your_ngrok_token
        NGROK_REGION=jp  # or 'us', 'eu', etc.

        # Email (Gmail App Password recommended)
        SMTP_HOST=smtp.gmail.com
        SMTP_PORT=465
        SMTP_USER=your_email@gmail.com
        SMTP_PASS=your_app_password
        SMTP_SECURE=true
        ```
    *   Place your Firebase Service Account JSON file in the `backend/` folder.

3.  **Frontend Setup:**
    *   Navigate to `frontend/`:
        ```bash
        cd ../frontend
        npm install
        npm run build
        ```
    *   The backend is configured to serve the `frontend/build` folder automatically.

4.  **Running the System:**
    *   Start the backend (which serves everything):
        ```bash
        cd ../backend
        npm start
        ```
    *   The server will start on port 3001 and attempt to open an Ngrok tunnel.
    *   Check the console output for the **Public URL**.

---

## Architecture

### "Deep Cosmos" Design System
The UI features a custom "Deep Cosmos" theme using Tailwind CSS.
*   **Glassmorphism:** Heavy use of `backdrop-blur` and semi-transparent gradients (`glass-panel` class).
*   **Animations:** Powered by Framer Motion (`layoutId` for shared element transitions).
*   **Performance:** Interactions use `will-change-transform` to ensure 60fps animations.

### "Cache-First" Backend
The `ticketService.js` implements a sophisticated caching strategy for speed:
*   **Reads:** 0ms latency. Data is served directly from in-memory Maps.
*   **Writes:** "Cache-Validated Atomic Updates". Validation checks memory (instant), then sends a single atomic update to Firestore.
*   **Sync:** A real-time `onSnapshot` listener keeps the memory cache in sync with Firestore changes from other sources.

---

## Features

### 1. Event Management
*   Create multiple events (e.g., "Concert 2025", "Meetup").
*   Switch between events instantly without page reloads.
*   Real-time stats (Checked In, On Leave, Remaining).

### 2. Ticket Management
*   **Create:** Issue tickets manually via the dashboard.
*   **Import:** Bulk import attendees via CSV (Name, Email).
*   **Search:** Instant client-side filtering.
*   **Export:** Download current view as CSV.

### 3. Email Studio
*   **Batch Sending:** Send QR codes to all attendees or a **selected subset** (checkboxes).
*   **Customization:** Upload a background image, set custom subject/sender, and add pre/post text.
*   **Preview:** See exactly how the email will look before sending.
*   **Reliability:** Uses chunking (5 concurrent emails) and exponential backoff for failures.

### 4. Gatekeeper
*   The admin dashboard is protected by a client-side "Gatekeeper".
*   **Credentials:**
    *   Username: `Null`
    *   Password: `980122`

---

## Scanner Setup

The scanner is a web app designed for mobile phones.

1.  **Open Dashboard:** Go to the Admin Dashboard.
2.  **Click "Scanner Setup":** (Top Right or Quick Actions).
3.  **Choose Mode:**
    *   **Local Mode (Recommended):** If phone and PC are on the same Wi-Fi. Extremely fast (~5ms).
    *   **Public Mode:** Uses Ngrok. Works over 4G/LTE. Slower (~200ms).
4.  **Scan the QR:** Point your phone's camera at the setup QR code.
5.  **Start Scanning:** The phone will configure itself and link to the selected event.

**Scanner Features:**
*   **Optimistic UI:** Beeps and shows "Processing" immediately upon scan.
*   **Offline Resilience:** Auto-reconnects if the camera feed freezes.
*   **Anti-Tamper:** Disables context menus and DevTools on the phone.

---

## Troubleshooting

### Camera freezes or stops working
*   Refresh the page.
*   Ensure you gave camera permissions.
*   If on iOS, ensure you are using Safari (or a browser that supports WebRTC).
*   Click "Retry Camera" if the button appears.

### "Library Error" on Scanner
*   The scanner attempts to load `html5-qrcode` from the local server.
*   If that fails, it falls back to a CDN (`unpkg.com`).
*   Ensure the backend server is running.

### Email not sending
*   Check `backend/logs/combined.log` or console output.
*   Ensure `SMTP_PASS` is an **App Password**, not your regular Gmail password.
*   Check if `NGROK_REGION` is set correctly if you are encountering geo-blocks.

### Dashboard data looks stale
*   The "Live" indicator in the header should be **Green** or **Pulsing Blue**.
*   If Red, check your internet connection or server status.
*   Refresh the page to force a full re-sync.
