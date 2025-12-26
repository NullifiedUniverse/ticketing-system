# 🎫 TicketSystem - Enterprise Event Management

**System by NullifiedGalaxy**

A high-performance, real-time ticket management and raffle system designed for modern events. Featuring a secure Node.js/Express backend with Firestore persistence, and a reactive React frontend with advanced visual effects.

## 🚀 Key Features

### 🖥️ Dashboard (Command Center)
*   **Real-Time Analytics:** Live check-in velocity, occupancy stats, and scanner heartbeat monitoring.
*   **Ticket Management:** Issue, edit, and void tickets instantly. Support for batch CSV imports.
*   **Email Integration:** Send branded QR codes directly to attendees with customizable HTML templates.
*   **Security:** Role-based access control (mock) and persistent session handling.

### 🎲 Celestial Raffle System
*   **Visual Spectacle:** HTML5 Canvas-based "Starfield" animation engine.
*   **Dramatic Reveals:** Multi-phase animation (Stars -> Constellation -> Meteor -> Reveal).
*   **Fairness:** Random winner selection from the checked-in attendee pool.
*   **Persistence:** State survives server restarts (Firestore-backed).
*   **Queue Management:** Support for "Title | Name | Image" prize queuing.

### 📱 Scanner App
*   **Universal Compatibility:** Runs in any modern browser with camera access.
*   **Offline-Capable:** Local caching for high-speed scanning even with flaky internet.
*   **Visual Feedback:** Instant success/fail cues with haptic vibration support.

## 🛠️ Technology Stack

*   **Frontend:** React 18, Tailwind CSS, Framer Motion, HTML5 Canvas.
*   **Backend:** Node.js, Express, Firebase Admin SDK (Firestore).
*   **Security:** Helmet, Express Rate Limit, Input Sanitization.
*   **DevOps:** Optimized build scripts, separation of concerns.

## 📦 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-repo/TicketSystem.git
    cd TicketSystem
    ```

2.  **Backend Setup**
    *   Navigate to `backend/`.
    *   Install dependencies: `npm install`
    *   Configure Firebase: Place your `serviceAccountKey.json` in `backend/` or configure env vars.
    *   Start Server: `npm start` (Runs on Port 3001)

3.  **Frontend Setup**
    *   Navigate to `frontend/`.
    *   Install dependencies: `npm install`
    *   Build for Production: `npm run build` (Artifacts are served by Backend)
    *   *Dev Mode:* `npm start` (Runs on Port 3000)

## 📖 API Documentation

See `docs/API.md` for detailed endpoint references.

### Raffle Control Syntax
When adding prizes in the queue, use the following format:
*   `Prize Name` (Simple)
*   `Prize Name | image.png` (With uploaded image)
*   `Prize Title | Prize Name | image.png` (Full format)

## 🔒 Security Note
This system implements standard security practices including HTTP headers (Helmet), Rate Limiting, and Input Validation. Ensure your Firebase rules are configured correctly in production.

---
*Built with ❤️ for seamless event experiences.*