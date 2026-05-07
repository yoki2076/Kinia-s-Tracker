# ✈️ Trip App — GitHub Pages + Firebase 部署指南

## 📁 專案結構

```
trip-app/
├── index.html            ← 首頁（新增）
├── 記帳.html
├── 購物紀錄.html
├── arts-tracker.html
├── routine_tracker.html
├── wishlist.html
├── firebase-config.js    ← Firebase 設定（需填入你的金鑰）
├── auth-guard.js         ← Google 登入保護（自動注入）
└── README.md
```

---

## 🔧 Step 1：建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點 **「新增專案」**，輸入名稱（例如 `my-trip-app`）
3. 停用 Google Analytics（可選）→ 點「建立專案」

---

## 🔑 Step 2：取得 Firebase 設定

1. 在 Firebase Console 首頁點 **「</>」（網頁應用程式）**
2. 輸入應用程式暱稱 → 點「Register app」
3. 複製 `firebaseConfig` 物件中的內容

打開 `firebase-config.js`，把 `YOUR_API_KEY` 等全部換成你的：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "my-trip-app.firebaseapp.com",
  projectId: "my-trip-app",
  storageBucket: "my-trip-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

---

## 🔐 Step 3：啟用 Google 登入

1. 在 Firebase Console → **Authentication** → **Sign-in method**
2. 點 **Google** → 啟用 → 填入「專案支援電子郵件」→ 儲存

---

## 🗄️ Step 4：建立 Firestore 資料庫

1. Firebase Console → **Firestore Database** → 點「建立資料庫」
2. 選 **「以正式模式啟動」**（之後再設定規則）
3. 選擇伺服器位置（建議 `asia-east1` 台灣/香港）

### 設定安全規則（重要！）

點 **規則** 標籤，貼上以下內容：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 每個使用者只能讀寫自己的資料
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

點「發布」。

---

## 📦 Step 5：啟用 Firebase Storage（照片上傳用）

1. Firebase Console → **Storage** → 點「開始使用」
2. 選擇正式模式 → 設定地區 → 完成

### Storage 安全規則：

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🌐 Step 6：新增 GitHub Pages 網域到 Firebase

> **這步很重要！** 否則 Google 登入會被封鎖。

1. Firebase Console → **Authentication** → **Settings** → **已授權的網域**
2. 點「新增網域」
3. 輸入：`你的帳號.github.io`

---

## 🚀 Step 7：上傳到 GitHub Pages

### 方法 A：直接上傳（最簡單）

1. 到 [github.com](https://github.com) 建立新的 Repository
   - 名稱可以是 `trip-app` 或任意名稱
   - 設為 **Public**
2. 點「uploading an existing file」
3. 把整個 `trip-app/` 資料夾內所有檔案拖曳上傳
4. 點 **Commit changes**
5. 到 **Settings** → **Pages** → **Source** 選 `main` branch → 儲存
6. 等 1-2 分鐘，網址就是：`https://你的帳號.github.io/trip-app/`

### 方法 B：用 Git（推薦）

```bash
cd trip-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的帳號/trip-app.git
git push -u origin main
```

---

## ✅ 完成後的資料結構

Firebase Firestore 會自動建立以下路徑：

```
users/
  └── {uid}/
        └── data/
              ├── budget       ← 記帳資料
              ├── shopping     ← 購物紀錄
              ├── arts         ← 藝文記錄
              ├── routine      ← 日常計畫
              ├── wishlist     ← 願望清單
              └── placelist    ← 景點清單
```

---

## 🔍 常見問題

### Q: 登入後跳回原頁，但頁面顯示未登入？
確認有在 Firebase 的「已授權網域」加入你的 GitHub Pages 網址。

### Q: 手機登入跳轉後資料沒載入？
正常現象，手機使用 redirect 方式登入，`auth-guard.js` 已處理 redirect 結果。

### Q: Firestore 寫入失敗？
檢查 Firestore 安全規則是否正確設定，並確認已啟用 Authentication。

### Q: Storage 圖片上傳失敗？
確認 Storage 安全規則允許 `users/{userId}/` 路徑的讀寫。
