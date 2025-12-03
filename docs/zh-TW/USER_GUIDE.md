# 使用者指南 - Null's Board

歡迎使用 **Null's Board**。本指南將帶您走過活動管理的完整生命週期，從建立活動到最終的入場驗票。

---

## 1. 儀表板概覽 (Dashboard Overview)

請前往 `http://localhost:3000` (或您的 Ngrok 網址) 存取儀表板。

### **側邊欄導航 (Sidebar)**
*   **活動列表 (Events List):** 在不同的進行中活動間快速切換。
*   **建立活動 (Create Event):** 初始化一個新的活動資料庫。
*   **快速工具 (Quick Tools):** 存取 Email 儀表板與抽獎功能。

### **即時數據 (Live Stats)**
頂部的卡片顯示即時的指標：
*   **當前入場 (Currently Inside):** 已完成報到的活躍人數。
*   **暫時離場 (On Leave):** 已掃描「離場 (Check Out)」的參加者。
*   **剩餘票數 (Remaining):** 尚未使用的有效票券。

---

## 2. 管理活動 (Managing Events)

### **建立活動**
1.  點擊側邊欄的 **"+ 建立活動 (Create Event)"**。
2.  輸入一個唯一的 ID (例如：`winter-gala-2025`)。
3.  系統將會自動初始化資料庫集合。

### **刪除活動**
1.  在側邊欄中將滑鼠游標懸停在活動名稱上。
2.  點擊 **垃圾桶圖示**。
3.  **警告：** 此操作將永久刪除該活動的所有票券資料。

---

## 3. 管理票券 (Managing Tickets)

### **發行票券**
1.  使用儀表板上的 **"Issue Ticket"** 表單。
2.  輸入 **姓名 (Name)** 與 **Email**。
3.  點擊 **產生票券 (Generate Ticket)**。
4.  畫面上會立即跳出 QR Code 供快速測試使用。

### **手動操作**
在票券列表中，您可以：
*   **報到 (Check In):** 不需掃描即可手動將使用者標記為已入場。
*   **QR Code:** 檢視或列印 QR Code。
*   **編輯 (Edit):** 修正姓名或 Email 的輸入錯誤。
*   **刪除 (Delete):** 撤銷並刪除一張票券。

### **批次匯入 (Batch Import)**
1.  在儀表板的 **快速動作 (Quick Actions)** 區塊中。
2.  點擊 **"Import Attendees (CSV)"**。
3.  上傳包含 `Name` 和 `Email` 欄位的 CSV 檔案。

---

## 4. Email 系統 (Email System)

透過側邊欄前往 **Email** 區塊。

1.  **設定 (Settings):**
    *   **背景圖片:** 上傳客製化的票券設計 (PNG/JPG)。
    *   **訊息 (Messages):** 新增位於 QR Code 圖片上方或下方的客製化文字。
    *   **座標 (Coordinates):** 微調 QR Code 與文字在背景圖上的位置。
2.  **預覽 (Preview):** 點擊任何使用者列上的 "Preview"，即可預覽該使用者實際收到的票券樣式。
3.  **發送 (Sending):**
    *   **發送單封 (Send One):** 發送給特定個人。
    *   **批次發送 (Batch Send):** 將票券發送給列表中的**所有**參加者。系統會自動處理發送速率限制與重試機制。

---

## 5. 掃描器 (The Scanner)

掃描器是專為行動裝置設計的網頁應用程式。

### **設定步驟**
1.  在儀表板頂部，點擊 **"Scanner Setup" (掃描器設定)**。
2.  開啟手機相機並掃描顯示的 QR Code。
3.  開啟連結，掃描器應用程式將會載入。
4.  **連結活動:** 掃描器會要求 "Scan Setup QR"。請**再次**將手機對準儀表板上的 QR Code，以連結至特定活動。

### **操作說明**
*   **入場模式 (Check In Mode) - 預設:** 掃描有效票券並標記為「已報到 (Checked In)」。
    *   *綠色閃爍:* 成功。
    *   *黃色閃爍:* 已報到 (重複掃描)。
    *   *紅色閃爍:* 無效票券。
*   **離場模式 (Check Out Mode):** 切換底部的開關。掃描後將使用者標記為「暫時離場 (On Leave)」，允許他們稍後再次入場。

### **疑難排解**
*   **"Permission Denied" (拒絕存取):** 請確認您已允許瀏覽器存取相機權限。
*   **"HTTPS Required" (需要 HTTPS):** Android 強制要求 HTTPS 才能使用相機。請確保您使用的是 `ngrok` 連結 (https)，而非 IP 位址 (除非您已設定本地 SSL)。
