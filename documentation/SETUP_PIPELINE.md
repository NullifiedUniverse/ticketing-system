# The "I Just Want It To Work" Setup Guide 🍼 (For the Technically Impaired)

So, you want to run this ticketing system but don't know what a "Node.js" or "Terminal" is? **This guide is for you.**

Follow these steps exactly. Do not skip anything. Or do, and enjoy your failure.

---

## Phase 1: Download the Tools
You need two programs on your computer before we start.

1.  **Download Node.js (LTS Version)**
    *   Go to: [https://nodejs.org/](https://nodejs.org/)
    *   Click the green button that says **"LTS"** (Recommended for most users).
    *   Install it like any other program. Just keep clicking "Next".
2.  **Download Git (Optional but recommended)**
    *   Go to: [https://git-scm.com/downloads](https://git-scm.com/downloads)
    *   Download and install for your OS.

---

## Phase 2: The Database (Firebase)
This is the hardest part. Take a deep breath.

1.  Go to [https://console.firebase.google.com/](https://console.firebase.google.com/) and log in with your Google account.
2.  Click **"Create a project"**.
    *   Name it: `MyTicketSystem` (or whatever you want).
    *   Disable Google Analytics (you don't need it).
    *   Click **Create Project**.
3.  **Setup the Database:**
    *   On the left menu, click **Build** -> **Firestore Database**.
    *   Click **Create Database**.
    *   Select **Test Mode** (Important!).
    *   Click **Enable**.
4.  **Get the Key (The Secret File):**
    *   Click the **Gear Icon ⚙️** (Project Settings) next to "Project Overview" on the top left.
    *   Go to the **Service accounts** tab.
    *   Click **Generate new private key** -> **Generate Key**.
    *   A file will download (e.g., `myticketsystem-firebase-adminsdk...json`).
    *   **Keep this file safe!** We will use it in Phase 4.

---

## Phase 3: The Code
1.  Download this project code (Click **Code** -> **Download ZIP** on GitHub, or clone it if you know how).
2.  Unzip it to a folder (e.g., `C:\TicketSystem`).

---

## Phase 4: Putting the Key in the Right Place
1.  Open the folder where you unzipped the code.
2.  Open the `backend` folder.
3.  Find the file you downloaded from Firebase in Phase 2.
4.  **Rename** that file to: `serviceAccountKey.json`.
5.  **Move** it into the `backend` folder.
    *   *Check:* You should see `backend/serviceAccountKey.json`.

---

## Phase 5: The Settings File (.env)
1.  Still in the `backend` folder, create a new text file.
2.  Name it `.env` (Yes, just `.env`. If Windows complains, name it `.env.` and it will fix it).
3.  Open it with Notepad.
4.  Paste this exact text inside:
    ```env
    PORT=3001
    NODE_ENV=development
    JWT_SECRET=supersecretpassword123
    API_KEY=admin123
    
    # Email Settings (Optional for now, you can skip if just testing)
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=your-email@gmail.com
    SMTP_PASS=your-app-password
    ```
5.  Save and close.

---

## Phase 6: Liftoff 🚀
Now we turn it on.

1.  **Open Terminal / Command Prompt:**
    *   **Windows:** Right-click inside the `TicketSystem` folder -> "Open in Terminal" (or type `cmd` in the address bar).
    *   **Mac:** Open Terminal and `cd` to the folder.

2.  **Install & Start Backend:**
    *   Type this and hit Enter:
        ```bash
        cd backend
        npm install
        npm start
        ```
    *   If you see "Server running on port 3001", **IT WORKED!** Leave this window open. Don't touch it.

3.  **Install & Start Frontend:**
    *   Open a **NEW** Terminal window (do not close the first one).
    *   Go to the project folder again.
    *   Type this:
        ```bash
        cd frontend
        npm install
        npm start
        ```
    *   A website should pop up at `http://localhost:3000`... eventually.

**You are done!** 🎉 Try not to break it immediately.

---

## Phase 7: Panic 😱
Just kidding. (Mostly).

*   **If things break:** Check the black windows (Terminals) for red text. Red is bad.
*   **If the scanner doesn't work:** You probably ignored the HTTPS warning. Go back to Phase 6.
*   **If the logs are empty:** Check your pulse.

