# 系統配置參考 (Configuration Reference)

## 環境變數 (`backend/.env`)

請在 `backend/` 目錄下建立一個 `.env` 檔案。

### **伺服器設定 (Server Settings)**
| 變數名稱 | 描述 | 預設值 |
| :--- | :--- | :--- |
| `PORT` | 後端伺服器運行的連接埠。 | `3001` |
| `NODE_ENV` | 執行環境 (`development` 或 `production`)。 | `development` |
| `JWT_SECRET` | 用於簽署掃描器 Token 的密鑰。 | *(必填)* |
| `API_KEY` | 系統操作的主金鑰 (Master Key)。 | *(必填)* |

### **Ngrok (遠端存取)**
| 變數名稱 | 描述 |
| :--- | :--- |
| `NGROK_AUTHTOKEN` | 您的 Auth Token，請至 [dashboard.ngrok.com](https://dashboard.ngrok.com) 取得。 |

### **Email (SMTP 設定)**
發送電子票券所需。

| 變數名稱 | 描述 | 範例 (Gmail) |
| :--- | :--- | :--- |
| `SMTP_HOST` | SMTP 伺服器主機名稱 | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP 連接埠 | `465` (SSL) 或 `587` (TLS) |
| `SMTP_SECURE` | 是否使用 SSL? | `true` |
| `SMTP_USER` | 您的 Email 地址 | `user@gmail.com` |
| `SMTP_PASS` | **應用程式密碼 (App Password)** | `abcd efgh ijkl mnop` |

---

## Firebase 設定

1.  前往 [Firebase Console](https://console.firebase.google.com/)。
2.  建立一個新專案。
3.  **Firestore Database:** 建立資料庫 (開發時建議先選擇 **Test Mode**)。
4.  **Service Account (服務帳戶):**
    *   前往 Project Settings (專案設定) -> Service Accounts (服務帳戶)。
    *   點擊 "Generate new private key" (產生新的私鑰)。
    *   將下載的檔案儲存為 `backend/serviceAccountKey.json`。
