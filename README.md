# T58 Edge Analytics

Trading backtest journal — playbooks, custom tags, trade log, and analytics —
with Google sign-in and cross-device sync via Firebase.

## 1. Get your Firebase config (2 min)

1. Go to https://console.firebase.google.com and open your **t58-edge-analytics** project.
2. Click the gear icon (top left) → **Project settings**.
3. Scroll to **Your apps**. If there's no web app yet, click the **</>** (web) icon to create one — name it anything (e.g. "T58 Edge Web"). You do NOT need Firebase Hosting checked.
4. Copy the `firebaseConfig` object it shows you (apiKey, authDomain, projectId, etc.).
5. Open `src/firebase.js` in this project and paste your values into the `firebaseConfig` object, replacing the placeholders.

## 2. Turn on Google sign-in (1 min)

1. In the Firebase console, left sidebar → **Build → Authentication**.
2. Click **Get started** (if you haven't already).
3. Go to the **Sign-in method** tab → click **Google** → toggle **Enable** → pick a support email → **Save**.

## 3. Create the database (1 min)

1. Left sidebar → **Build → Firestore Database** → **Create database**.
2. Choose a location close to you → **Start in production mode** → **Create**.
3. Go to the **Rules** tab, delete what's there, and paste in the contents of `firestore.rules` (included in this project) → **Publish**.

That's it for Firebase setup — no billing card, no paid plan needed. Everything here runs on Firebase's free "Spark" tier.

## 4. Run it locally

```bash
npm install
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). Click **Continue with Google** and you're in.

## 5. Put it online for free (so you can use it on your phone too)

The easiest option is **Vercel**:

1. Push this folder to a GitHub repo (create one on github.com, then in this folder run):
   ```bash
   git init
   git add .
   git commit -m "T58 Edge Analytics"
   git branch -M main
   git remote add origin <your-empty-github-repo-url>
   git push -u origin main
   ```
2. Go to https://vercel.com → sign up (free) → **Add New Project** → import that GitHub repo.
3. Vercel auto-detects Vite. Just click **Deploy**.
4. In a minute you'll get a live URL like `t58-edge-analytics.vercel.app`.

**One extra Firebase step once you have that URL:** in Firebase console →
Authentication → Settings → **Authorized domains** → **Add domain** → paste your
Vercel URL (e.g. `t58-edge-analytics.vercel.app`). Without this, Google sign-in
will fail on the live site (localhost is already authorized by default).

## 6. Install it on your phone / desktop like an app

This is a PWA (Progressive Web App), so once it's live on your Vercel URL:

- **iPhone (Safari):** open the URL → Share icon → **Add to Home Screen**.
- **Android (Chrome):** open the URL → ⋮ menu → **Install app** (or **Add to Home screen**).
- **Laptop/desktop (Chrome/Edge):** open the URL → click the install icon in the address bar (or ⋮ menu → **Install T58 Edge Analytics**).

It'll open in its own window with no browser bar, and you'll see it right alongside your other apps.

## Notes on how data is stored

- Each user's settings (playbooks, tags, theme) live in Firestore at `users/{yourUserId}`.
- Each trade is its own document at `users/{yourUserId}/trades/{tradeId}`, so screenshots
  attached to one trade never bloat the others.
- Screenshots are compressed client-side before upload to keep everything on the free tier
  comfortably (no Firebase Storage / billing plan required).
- Data updates in real time — if you log a trade on your phone, it'll appear on your laptop
  automatically next time it's open.

## Project structure

```
src/
  firebase.js   – your Firebase config + auth helpers (edit this file first)
  App.jsx       – the entire app: dashboard, playbooks, tags, trade log, analytics
  main.jsx      – React entry point
firestore.rules – copy into Firebase console → Firestore → Rules
vite.config.js  – build + PWA config
```
