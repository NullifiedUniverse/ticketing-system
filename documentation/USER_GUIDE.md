<!-- System Generation by NullifiedGalaxy -->
# User Guide - Null's Ticketing System

Welcome to **Null's Ticketing System**. This guide will walk you through the entire lifecycle of an event, from creation to final admission.

---

## 1. Dashboard Overview

Access the dashboard at `http://localhost:3001` (or your Ngrok URL).

### **Sidebar Navigation**
*   **Events List:** Switch between different active events instantly.
*   **Create Event:** Initialize a new event bucket.
*   **Quick Tools:** Access Email Dashboard and Raffles.

### **Live Stats**
The top cards show real-time metrics:
*   **Currently Inside:** Active check-ins.
*   **On Leave:** Attendees who scanned "Check Out" (temporarily left).
*   **Remaining:** Valid tickets not yet used.

---

## 2. Managing Events

### **Creating an Event**
1.  Click **"+ Create Event"** in the sidebar.
2.  Enter a unique ID (e.g., `winter-gala-2025`).
3.  The system automatically initializes the database collections.

### **Deleting an Event**
1.  Hover over the event name in the sidebar.
2.  Click the **Trash Icon**.
3.  **Warning:** This permanently deletes all ticket data for that event.

---

## 3. Managing Tickets

### ** issuing Tickets**
1.  Use the **"Issue Ticket"** form on the dashboard.
2.  Enter **Name** and **Email**.
3.  Click **Generate Ticket**.
4.  A QR code popup will appear immediately for quick testing.

### **Manual Actions**
In the ticket list, you can:
*   **Check In:** Manually admit a user without scanning.
*   **QR Code:** View/Print the QR code.
*   **Edit:** Correct name/email typos.
*   **Delete:** Revoke a ticket.

---

## 4. Email System

Navigate to the **Email** section via the sidebar.

1.  **Settings:**
    *   **Background Image:** Upload a custom ticket design (PNG/JPG).
    *   **Messages:** Add custom text before/after the QR code image.
    *   **Coordinates:** Fine-tune QR and Text position on your background.
2.  **Preview:** Click "Preview" on any user row to see exactly what they will receive.
3.  **Sending:**
    *   **Send One:** Send to a specific individual.
    *   **Batch Send:** Blast tickets to ALL attendees in the list. The system handles rate limiting automatically.

---

## 5. The Scanner

The scanner is a web app designed for mobile use.

### **Setup**
1.  On the Dashboard header, click **"Scanner Setup"**.
2.  Open your phone's camera and scan the QR code displayed.
3.  Open the link. The scanner app will load.
4.  **Link Event:** The scanner will ask to "Scan Setup QR". Point your phone at the Dashboard QR code *again* to link it to the specific event.

### **Operation**
*   **Check In Mode (Default):** Scans valid tickets and marks them as "Checked In".
    *   *Green Flash:* Success.
    *   *Yellow Flash:* Already checked in (Duplicate scan).
    *   *Red Flash:* Invalid ticket.
*   **Check Out Mode:** Toggle the switch at the bottom. Scans mark users as "On Leave", allowing them to re-enter later.

### **Troubleshooting**
*   **"Permission Denied":** Ensure you allowed Camera access in your browser.
*   **"HTTPS Required":** Android requires HTTPS for camera access. Ensure you are using the `ngrok` link (https), not the IP address, unless you have configured local SSL.
