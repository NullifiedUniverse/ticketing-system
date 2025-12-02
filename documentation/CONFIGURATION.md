# Configuration Reference

## Environment Variables (`backend/.env`)

Create a `.env` file in the `backend/` directory.

### **Server Settings**
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the backend runs on. | `3001` |
| `NODE_ENV` | `development` or `production`. | `development` |
| `JWT_SECRET` | Secret key for signing scanner tokens. | *(Required)* |
| `API_KEY` | Master key for system operations. | *(Required)* |

### **Ngrok (Remote Access)**
| Variable | Description |
| :--- | :--- |
| `NGROK_AUTHTOKEN` | Your auth token from [dashboard.ngrok.com](https://dashboard.ngrok.com). |

### **Email (SMTP)**
Required for sending tickets.

| Variable | Description | Example (Gmail) |
| :--- | :--- | :--- |
| `SMTP_HOST` | SMTP Server Hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP Port | `465` (SSL) or `587` (TLS) |
| `SMTP_SECURE` | Use SSL? | `true` |
| `SMTP_USER` | Your Email Address | `user@gmail.com` |
| `SMTP_PASS` | **App Password** | `abcd efgh ijkl mnop` |

---

## Firebase Setup

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project.
3.  **Firestore Database:** Create database (Start in **Test Mode** for development).
4.  **Service Account:**
    *   Project Settings -> Service Accounts.
    *   "Generate new private key".
    *   Save file as `backend/serviceAccountKey.json`.
