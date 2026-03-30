# 維港AI 圖片生成器 — Vercel 部署指南（Gemini 版）

## 架構
```
瀏覽器 → /api/gemini (Vercel) → Gemini API
                                ├── gemini-2.0-flash  (生成 Prompt)
                                └── imagen-3.0        (生成圖片)
GEMINI_API_KEY 存在 Vercel 伺服器，不暴露給瀏覽器
```

## 部署步驟（約15分鐘）

### 1. GitHub
- 專案儲存庫：<https://github.com/ICE614-Y/vitor-Gemini>
- 主要檔案：`api/gemini.js`、`public/index.html`、`vercel.json`

### 2. Vercel
- 前往 vercel.com，用 GitHub 登入
- 點「Add New Project」→ Import **`vitor-Gemini`**
- Framework Preset 選「Other」
- 點「Deploy」

### 3. 設定 Gemini API Key（重要）
- 進入 Vercel 項目 → Settings → Environment Variables
- 新增：
  - Name:  GEMINI_API_KEY
  - Value: AIzaSy... （你的 Gemini Key）
- 儲存後點「Redeploy」

### 4. 使用
- 打開 Vercel 給你的網址
- 貼入 Caption → 選風格 → 生成

## 取得 Gemini API Key
1. 前往 https://aistudio.google.com
2. 左側「Get API Key」→「Create API Key」
3. 複製 AIzaSy... 開頭的 Key
4. 確認 Imagen API 已啟用（免費方案有每日限額）
