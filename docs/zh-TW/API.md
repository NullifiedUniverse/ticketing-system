# API 文件 (API Reference)

後端提供了一系列 RESTful API 用於管理活動、票券以及掃描器整合。

**Base URL:** `/api/admin` (管理端) 或 `/api/scanner` (掃描端)

---

## 1. 活動管理 (Event Management)

### 取得所有活動
*   **URL:** `GET /api/admin/events`
*   **描述:** 取得系統中所有活動的列表。

### 建立活動
*   **URL:** `POST /api/admin/create-event`
*   **Body:**
    ```json
    {
      "eventId": "event-name-id"
    }
    ```
*   **描述:** 初始化一個新的活動。

### 刪除活動
*   **URL:** `DELETE /api/admin/delete-event/:eventId`
*   **描述:** 刪除指定活動及其所有相關票券資料。

---

## 2. 票券管理 (Ticket Management)

### 建立票券 (單張)
*   **URL:** `POST /api/admin/create-ticket/:eventId`
*   **Body:**
    ```json
    {
      "attendeeName": "王小明",
      "attendeeEmail": "ming@example.com"
    }
    ```

### 批次匯入參加者
*   **URL:** `POST /api/admin/import/:eventId`
*   **Body:**
    ```json
    [
      { "attendeeName": "User A", "attendeeEmail": "a@example.com" },
      { "attendeeName": "User B", "attendeeEmail": "b@example.com" }
    ]
    ```
*   **描述:** 透過 JSON 陣列批次建立票券。

### 取得票券列表
*   **URL:** `GET /api/admin/tickets/:eventId`
*   **描述:** 取得指定活動的所有票券詳細資訊。

### 更新票券狀態 (報到/離場)
*   **URL:** `POST /api/admin/update-ticket-status/:eventId/:ticketId`
*   **Body:**
    ```json
    {
      "action": "check-in" // 或 "check-out"
    }
    ```

---

## 3. Email 服務 (Email Service)

### 上傳背景圖片
*   **URL:** `POST /api/admin/email/upload-bg`
*   **Body:** Form-Data, Key: `background` (File)
*   **描述:** 上傳用於電子票券的背景圖片。

### 發送單張票券
*   **URL:** `POST /api/admin/email/send-one`
*   **Body:**
    ```json
    {
      "eventId": "event-id",
      "ticketId": "ticket-uuid",
      "bgFilename": "background-timestamp.jpg",
      "config": { ... },
      "messageBefore": "...",
      "messageAfter": "..."
    }
    ```

### 批次發送票券
*   **URL:** `POST /api/admin/email/send-batch`
*   **Body:**
    ```json
    {
      "eventId": "event-id",
      "bgFilename": "...",
      "config": { ... },
      "messageBefore": "...",
      "messageAfter": "..."
    }
    ```
*   **描述:** 觸發該活動所有票券的批次發送作業。

---

## 4. 掃描器整合 (Scanner Routes)

**Base URL:** `/api/scanner`

### 取得精簡票券數據
*   **URL:** `GET /api/scanner/data/:eventId`
*   **描述:** 僅回傳 ID、狀態與姓名，供行動裝置快速同步使用。

### 掃描票券 (更新狀態)
*   **URL:** `POST /api/scanner/update-ticket-status/:eventId/:ticketId`
*   **Body:**
    ```json
    {
      "action": "check-in"
    }
    ```
