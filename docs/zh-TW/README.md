# Null's Board (票務系統)

歡迎使用 **Null's Board (原 TicketControl)**。這是一個為現代活動設計的綜合票務管理解決方案。本文件提供繁體中文的詳細指南。

## 文件目錄

1.  [**使用者指南 (User Guide)**](./USER_GUIDE.md)
    *   了解如何管理活動、發送票券以及操作掃描器。
2.  [**系統配置 (Configuration)**](./CONFIGURATION.md)
    *   環境變數設定、Firebase 連線與 Email 伺服器設置。
3.  [**API 文件 (API Reference)**](./API.md)
    *   後端 API 端點說明與整合指南。

## 快速開始

> **剛接觸程式？** 請看我們的 **[超簡單新手安裝教學](./SETUP_PIPELINE.md)**！🍼

1.  確認您已完成 [系統配置](./CONFIGURATION.md)。
2.  啟動後端伺服器：
    ```bash
    cd backend
    npm start
    ```
3.  啟動前端介面：
    ```bash
    cd frontend
    npm start
    ```
4.  前往 `http://localhost:3000` 開始使用。

---
*由 NullifiedGalaxy 開發*
