# TicketMaster Pro

TicketMaster Pro is a comprehensive and secure event ticketing system designed for efficient management of attendees and seamless ticket validation. It features a modern web-based administration dashboard, a highly optimized real-time QR code scanning solution, and a robust backend powered by Node.js and Firebase.

## Features

- **Admin Dashboard:** A sleek, responsive dashboard built with React for real-time event monitoring and management.
- **Event Lifecycle:** Create, manage, and delete multiple events effortlessly.
- **Ticket Management:** Instantly issue new tickets, edit attendee details, and manage status manually if needed.
- **Real-time Analytics:** Dashboard auto-refreshes every 5 seconds to show live check-in counts and status updates.
- **High-Performance Scanner:** 
    - **Optimized Mobile UI:** Full-screen camera view, large high-contrast feedback toasts, and haptic feedback.
    - **Offline-Capable Library:** Intelligent loading of scanning libraries (Local fallback + CDN) ensures reliability.
    - **Smart Feedback:** Distinct visual states for Valid (Green), Warning/Already-In (Yellow), and Error (Red).
    - **Speed:** Optimized for rapid scanning with minimal latency.
- **Cross-Network Capability:** Integrated `ngrok` tunneling allows mobile devices on any network (4G/5G) to communicate with your local server securely.

## Project Structure

The project is organized into three main parts:

- `frontend/`: The React-based admin dashboard (Built with Tailwind CSS & Framer Motion).
- `backend/`: The Node.js/Express API server with Firebase Firestore integration.
- `scanner/`: A standalone, lightweight HTML/JS client for QR code ticket scanning.

## Getting Started

### Prerequisites

- Node.js (v18+) and npm
- A Firebase project with Firestore enabled.

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  **Firebase Service Account Key:**
    *   Go to your Firebase project settings.
    *   Navigate to "Service accounts" and click "Generate new private key".
    *   Rename the downloaded JSON file to `serviceAccountKey.json` and place it in the `backend/` directory.
4.  Create a `.env` file in the `backend` directory:
    ```
    PORT=3001
    JWT_SECRET=your_super_secret_jwt_key
    API_KEY=your_secret_api_key_for_scanners
    ```
5.  Start the backend server:
    ```bash
    npm start
    ```
    The server will start on port 3001, and an `ngrok` public URL will be logged to the console automatically.

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Build the frontend (Required for the backend to serve it):
    ```bash
    npm run build
    ```
    *Note: The backend server is configured to serve the static files from `frontend/build`. You do not need to run `npm start` in the frontend directory for production usage, only for development.*

## Usage

### 1. Admin Dashboard
Open `http://localhost:3001` in your browser.
-   **Create Event:** Click the "+ Create Event" button in the sidebar.
-   **Manage:** Select an event to view statistics and tickets. Use the icons to Edit, Delete, or manually Check-In attendees.
-   **Delete Event:** Use the trash icon in the sidebar to remove an event and all its data.

### 2. Ticket Scanner
1.  **Setup:** In the Dashboard header, click **"Scanner Setup"**.
2.  **Open Scanner:** Scan the QR code displayed with your mobile device's camera app, or navigate to the `ngrok` URL provided in the server logs followed by `/scanner` (e.g., `https://xxxx.ngrok.io/scanner`).
3.  **Configure:** On your mobile device, the scanner will ask to "Scan Setup QR Code". Point it at the **same** QR code on your Dashboard screen.
4.  **Scan Tickets:** Once configured, the scanner is ready. Point it at attendee tickets to validate them.
    -   **Green:** Valid Ticket.
    -   **Yellow:** Warning (e.g., Already Checked In).
    -   **Red:** Invalid Ticket or Network Error.

## Troubleshooting

-   **Scanner not loading?** Ensure your mobile device has camera permissions enabled for the site. The scanner uses a robust loader that attempts to load libraries locally first, then via CDN.
-   **Changes not showing?** If you modify frontend code, remember to run `npm run build` in the `frontend` folder and restart the backend.
-   **"Network Timeout"?** The scanner requires a connection to the backend. Ensure the `ngrok` tunnel is active and your phone has internet access.

## Security Notes

-   **`serviceAccountKey.json`**: This file contains sensitive credentials and is ignored by git.
-   **Environment Variables**: Secrets are managed via `.env`.