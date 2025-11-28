# TicketMaster Pro

TicketMaster Pro is a comprehensive and secure event ticketing system designed for efficient management of attendees and seamless ticket validation. It features a modern web-based administration dashboard, a real-time QR code scanning solution, and a robust backend powered by Node.js and Firebase.

## Features

- **Admin Dashboard:** A sleek, responsive dashboard built with React for real-time event monitoring.
- **Event Management:** Create and manage multiple events.
- **Ticket Creation:** Easily issue new tickets for attendees.
- **Real-time Analytics:** View live statistics, including total tickets, check-ins, and more.
- **Cross-Network QR Scanning:** A standalone HTML scanner can be used on any mobile device with a camera to scan tickets and validate them against the backend, even across different networks, thanks to `ngrok` integration.
- **Secure Authentication:** JWT-based authentication for both the admin dashboard and the QR code scanners.

## Project Structure

The project is organized into three main parts:

- `frontend/`: The React-based admin dashboard.
- `backend/`: The Node.js/Express API server with Firebase integration.
- `scanner/`: A standalone HTML file for QR code ticket scanning.

## Getting Started

### Prerequisites

- Node.js and npm
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
4.  Create a `.env` file in the `backend` directory and add the following, replacing the placeholder values:
    ```
    # A secret key for signing JWT tokens
    JWT_SECRET=your_super_secret_jwt_key

    # A secret key for authenticating scanner clients
    API_KEY=your_secret_api_key_for_scanners
    ```
5.  **Create Admin User:**
    To create an initial admin user (username: `admin`, password: `password`), run the following commands:
    ```bash
    npm install -g bcrypt # Install bcrypt globally if not already installed
    node -e "require('./firebase'); const bcrypt = require('bcrypt'); const { db } = require('./firebase'); async function createUser() { const username = 'admin'; const password = 'password'; const passwordHash = await bcrypt.hash(password, 10); await db.collection('users').doc(username).set({ passwordHash }); console.log('Admin user created successfully.'); } createUser().catch(e => console.error(e));"
    ```
    *   **Important:** Change the default password immediately after logging in. For production, implement a secure user registration system.
6.  Start the backend server in development mode:
    ```bash
    npm start
    ```
    The server will start, and an `ngrok` public URL will be logged to the console.

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Ensure the `API_BASE_URL` in `frontend/src/config.js` is an empty string:
    ```javascript
    export const API_BASE_URL = '';
    ```
    The frontend development server is configured to proxy API requests to the backend, so a direct URL is not needed here.
4.  Start the frontend development server:
    ```bash
    npm start
    ```
    The admin dashboard will open in your browser.

## Usage

### Admin Dashboard

-   **Login:** Use the default credentials `admin` / `password` to log in.
-   **Create/Select Event:** Create a new event or select a recent one from the dropdown.
-   **Manage Tickets:** Once an event is loaded, you can create new tickets, view existing ones, and see live check-in statistics.

### Using the Ticket Scanner

1.  **Generate a Setup QR Code:** In the admin dashboard, once an event is loaded, click the "Show Setup QR" button to generate a QR code.
2.  **Configure the Scanner:** Open the `scanner/scanner.html` file on a mobile device or any computer with a camera. Scan the Setup QR Code generated from the dashboard.
3.  **Scan Tickets:** The scanner is now configured for the specific event and can be used to scan attendee tickets. It will display whether the ticket is valid, already checked-in, or invalid.

## Security Notes

-   **`serviceAccountKey.json`**: This file contains sensitive credentials and should **never** be committed to version control. The `.gitignore` file is configured to ignore it.
-   **Password Hashing**: The default admin password is 'password'. For a production environment, you should implement a more robust user management system with securely stored passwords.
-   **Environment Variables**: All secrets and keys are managed through a `.env` file in the backend, which should not be committed to your repository.
