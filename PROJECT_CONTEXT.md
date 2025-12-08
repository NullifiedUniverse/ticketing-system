# Project Context & Architecture Memory

## 1. Project Overview
**TicketSystem** is a full-stack event management solution comprising a React Admin Dashboard, a Node.js/Express Backend, and a standalone mobile-optimized QR Scanner.

## 2. Architecture

### Frontend (`/frontend`)
*   **Framework:** React 18
*   **Styling:** Tailwind CSS with a custom "Deep Cosmos" theme (Glassmorphism, Neon gradients).
*   **State Management:** Context API (`EventContext`, `LanguageContext`).
*   **Routing:** Hash-based routing (`#dashboard`, `#email`) for simplicity within a single-page app.
*   **Animations:** Framer Motion (`AnimatePresence`, `layoutId` for smooth transitions).
*   **Key Components:**
    *   `Gatekeeper.js`: Client-side hash-based auth (User: `Null`, Pass: `980122`).
    *   `Dashboard.js`: Main hub with real-time stats.
    *   `EmailDashboard.js`: Batch email sender with selective targeting and preview.
    *   `Scanner`: A standalone HTML/JS app served by the backend.

### Backend (`/backend`)
*   **Runtime:** Node.js / Express.
*   **Database:** Firebase Firestore (Google Cloud).
*   **Service Layer:**
    *   `ticketService.js`: The core logic engine. Implements a **Read-Through / Write-Through Cache** strategy.
        *   **Performance:** Uses in-memory `Map` for 0ms reads.
        *   **Consistency:** Syncs via Firestore `onSnapshot` listeners.
        *   **Scanning Strategy:** "Cache-Validated Atomic Update". Validation happens in memory (fast), persistence happens via `await db.update` (safe, 1 RTT). Transactional logic was replaced with this for speed.
    *   `emailService.js`: Handles image generation (Canvas) and sending (Nodemailer).

### Scanner (`/scanner/scanner.html`)
*   **Tech:** Vanilla HTML/JS + Tailwind CDN + `html5-qrcode` library.
*   **Optimization:**
    *   Optimistic UI: Shows "Processing" immediately upon scan.
    *   Library Loading: Tries local `node_modules` version first, falls back to CDN.
    *   Config: Persists event tokens in `localStorage`.

## 3. Key Features & Decisions

*   **Real-Time Sync:** The backend listens to Firestore. If one admin checks in a user, all other admins (and the cache) update instantly.
*   **Batch Emailing:** Supports filtering by status or manual selection. Uses chunking (concurrency limit: 5) and exponential backoff for reliability.
*   **CSV Handling:** robust CSV parsing logic (`csvParser.js`) that handles quoted fields and various line endings.
*   **Security:**
    *   Scanner uses a short-lived JWT (token logic in `scannerToken.js`).
    *   Admin panel protected by `Gatekeeper` (client-side hash check).
    *   Ngrok abuse header (`ngrok-skip-browser-warning`) added to scanner fetch requests.

## 4. Recent Major Refactors

1.  **UI Overhaul:** Switched to "Deep Cosmos" theme. Dark `Slate-950` background, radial gradients, high-contrast glass panels, and `will-change-transform` optimization.
2.  **Performance Tuning:**
    *   Wrapped `TicketRow` in `React.memo`.
    *   Removed `layout` prop from list containers to fix "zooming" glitches.
    *   Implemented "Cache-First" backend logic to reduce scan latency from ~800ms to ~150ms.
3.  **Resilience:**
    *   Scanner "Start Camera" button re-enables on error.
    *   Backend cache hydration is non-blocking for the scanner (Cold Cache Fallback) but blocking for the Dashboard (completeness guarantee).

## 5. Future Todos / known Constraints
*   **Ngrok:** The system relies on Ngrok for external access. The local tunnel URL changes on restart.
*   **Email:** Currently uses Gmail SMTP. For high volume, switch to SendGrid/AWS SES.
*   **Offline Mode:** The scanner requires internet. A future upgrade could implement a PWA service worker for offline queuing.
