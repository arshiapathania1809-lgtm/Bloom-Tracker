# 🌸 Bloom — Your Cycle App

A premium period and hormone tracker. This package is ready to deploy as a real Progressive Web App (PWA) so you can install it on your iPhone like a native app.

---

## 📱 Get it on your iPhone in ~10 minutes

### Step 1 — Make accounts (free, ~3 min)

1. **GitHub**: go to [github.com](https://github.com) and sign up
2. **Vercel**: go to [vercel.com](https://vercel.com) and sign in **with GitHub** (easiest)

### Step 2 — Upload to Vercel

You don't need to install anything on your computer. Two options:

**Option A — Drag and drop (simplest)**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Look for "Deploy from a folder" or click "Browse" / use the drag-drop area
3. Drag this entire `bloom` folder into the upload area
4. Vercel asks for project settings — leave everything default and click **Deploy**
5. Wait ~1 minute. You'll get a URL like `https://bloom-xxxx.vercel.app`

**Option B — Through GitHub (better if you want to update later)**

1. On GitHub, create a new repository called `bloom` (keep it private if you want)
2. Use GitHub's "upload files" button to upload everything in this folder
3. On Vercel, click **Add New Project** → **Import** your `bloom` repo
4. Click Deploy. Done.

### Step 3 — Install on your iPhone

1. Open your new Vercel URL **in Safari** on your iPhone (must be Safari, not Chrome)
2. Tap the **Share** button (square with up arrow) at the bottom
3. Scroll down → **Add to Home Screen**
4. Tap **Add**

You now have a real Bloom app on your home screen. It opens full-screen, no Safari bar, with its own icon. Your data is stored on your phone (localStorage in Safari).

---

## 🛠 If you want to run it locally first (optional)

If you have Node.js installed:

```bash
npm install
npm run dev
```

Open the URL it prints. Done.

---

## 🔒 About your data

- All data is stored locally on your device (browser's localStorage)
- Nothing is sent to any server
- Clearing your browser data will erase your logs — use the **Export** button in Settings to back up
- If you want true cloud sync across devices, that requires adding a backend (Supabase or Firebase work well)

---

## 📂 What's in this folder

```
bloom/
├── src/
│   ├── App.jsx       ← the whole app
│   ├── main.jsx      ← entry point
│   └── index.css     ← global styles + iPhone safe-area handling
├── public/
│   ├── manifest.json ← PWA config (lets iOS treat it as an app)
│   ├── icon-180.png  ← Apple touch icon
│   ├── icon-192.png
│   └── icon-512.png
├── index.html        ← root HTML with PWA meta tags
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 🩺 Note

This app is for personal tracking and education. It is not a medical device and not a substitute for clinical advice. If something feels off with your cycle, please talk to a healthcare provider.
