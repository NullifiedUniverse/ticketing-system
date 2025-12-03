<!-- System Generation by NullifiedGalaxy -->
# User Guide - Null's Ticketing System

Welcome to **Null's Board**. If you are reading this, you have likely been coerced into managing an event. This guide will walk you through the entire lifecycle of an event, from its optimistic creation to the inevitable chaos of final admission.

### Prerequisites
*   A working computer (optional, but recommended).
*   Coffee. Lots of it.
*   A sense of impending doom.

---

## 1. Dashboard Overview

Access the dashboard at `http://localhost:3001` (or your Ngrok URL).

### **Sidebar Navigation**
*   **Events List:** Switch between different active events instantly.
*   **Create Event:** Initialize a new event bucket.
*   **Quick Tools:** Access Email Dashboard and Raffles.

### **Live Stats**
The top cards show real-time metrics (assuming the backend hasn't crashed):
*   **Contained:** Active check-ins. (People currently breathing your air).
*   **AWOL:** Attendees who scanned "Check Out" (temporarily left to escape).
*   **At Large:** Valid tickets not yet used. The threat is still out there.

**Pro Tip:** If 'Contained' is higher than 'Total Captured', you have a ghost problem. Call a priest.

---

## 2. Creating a Containment Zone (Events)

### **Creating an Event**
1.  Click **"+ Create Event"** in the sidebar.
2.  Enter a unique ID (e.g., `winter-gala-2025`).
3.  The system automatically initializes the database collections.

### **Nuking Evidence (Deleting)**
1.  Hover over the event name in the sidebar.
2.  Click the **Trash Icon**.
3.  **Warning:** This obliterates all ticket data for that event. There is no "Undo". It's gone. Forever.

---

## 3. Managing Tickets

### ** issuing Tickets**
1.  Use the **"Issue Ticket"** form on the dashboard.
2.  Enter **Name** and **Email**.
3.  Click **Generate Ticket**.
4.  A QR code popup will appear immediately for quick testing.

### **Manual Actions**
In the ticket list, you can:
*   **Capture:** Manually incarcerate a user without scanning. Useful for bypassing security protocols or for people who "forgot" their phone.
*   **Mark (QR):** Stare directly into the matrix. View/Print the QR code.
*   **Retcon:** Alter the timeline. Fix name typos before they notice you spelled "Jon" as "Jawn".
*   **Purge:** Erase a subject from existence. It was just a bad dream.

### **Mass Conscription (Batch Import)**
1.  In the **Quick Actions** section.
2.  Click **"Mass Conscription (CSV)"**.
3.  Upload a CSV file. Format: `Name, Email`. Don't mess it up.
4.  Watch as the system assimilates your victims.

---

## 4. Spamming Infrastructure (Email)

Navigate to the **Email** section via the sidebar.

1.  **Settings:**
    *   **Background Image:** Upload a custom ticket design (PNG/JPG).
    *   **Messages:** Add custom text before/after the QR code image.
    *   **Coordinates:** Fine-tune QR and Text position on your background.
2.  **Preview:** Click "Preview" on any user row to see exactly what they will receive.
3.  **Sending:**
    *   **Send One:** Send to a specific individual.
    *   **Batch Send:** Blast tickets to ALL attendees in the list. Hope you checked for typos. The system handles rate limiting automatically.

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
*   **"The Machine Rejects You" (Permission Denied):** Ensure you allowed Camera access. The browser doesn't trust you.
*   **"Security Theater" (HTTPS Required):** Android is paranoid. Use the `ngrok` link (https), not the IP address.
*   **Scanner won't load:** Have you tried turning it off and on again? Seriously.
*   **Soul not found:** That's a personal problem. We can't help you there.
