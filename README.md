<!-- System Generation by NullifiedGalaxy -->
# Null's Ticketing System

**Null's Ticketing System** is an enterprise-grade, self-hosted event management solution designed for speed, reliability, and ease of use. It features a real-time React dashboard, a high-performance mobile QR scanner, and a robust Node.js backend with Firebase integration.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Key Features

*   **Real-Time Dashboard:** Monitor check-ins, sales, and attendance live.
*   **Universal Scanner:** Web-based QR scanner works on any device (iOS/Android) with a camera. No app install required.
*   **Offline-Ready:** Scanner handles spotty connections gracefully with robust error feedback.
*   **Email Automation:** Bulk send tickets with custom designs and QR codes directly to attendees.
*   **Secure Architecture:** Powered by Firebase Firestore and secured via Ngrok tunneling for safe remote access.

## 📂 Project Structure

*   **`backend/`**: Node.js/Express API, Firebase logic, Email Service.
*   **`frontend/`**: React Admin Dashboard (Tailwind CSS).
*   **`scanner/`**: Standalone HTML5 QR Scanner client.
*   **`documentation/`**: Detailed user guides and technical references.

## 🛠️ Quick Start

### Prerequisites
1.  **Node.js** (v16+)
2.  **Firebase Project** (Firestore enabled)
3.  **Ngrok Account** (For public scanner access)

### 1. Backend Setup
```bash
cd backend
npm install
```
*   Place your `serviceAccountKey.json` (from Firebase) in the `backend/` folder.
*   Create a `.env` file (see `documentation/CONFIGURATION.md`).
*   Start the server:
    ```bash
    npm start
    ```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run build
```
*   The backend automatically serves the built frontend at `http://localhost:3001`.

## 📖 Documentation

For detailed instructions, please refer to the `documentation/` directory:

*   [**User Guide**](documentation/USER_GUIDE.md): How to create events, manage tickets, and scan.
*   [**Configuration**](documentation/CONFIGURATION.md): Environment variables and email setup.

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
*Built with ❤️ by the Null's System Team.*