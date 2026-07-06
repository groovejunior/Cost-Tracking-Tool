# Spend — Personal Expense Tracker (PWA)

A mobile-first expense tracker that installs on your iPhone home screen like a native app.

## What's in this project

| File | Purpose |
|------|---------|
| `index.html` | Page structure (the skeleton) |
| `styles.css` | Visual design (colors, layout) |
| `app.js` | App logic and behavior |
| `sw.js` | Service worker for offline support |
| `manifest.webmanifest` | PWA identity card for iOS/Android |
| `assets/` | App icons |

## Run locally

You need a local web server (opening `index.html` directly won't enable PWA features).

```bash
cd "/Users/carlomuller/Documents/Cost Tracking App"
python3 -m http.server 4173
```

Then open: http://localhost:4173

Note: Service worker is disabled on localhost to avoid caching issues during development.

## Deploy to GitHub Pages (required for iPhone install)

iOS only allows PWA installation from HTTPS websites.

### 1. Create a GitHub repository

1. Go to https://github.com/new
2. Name it `spend` (or any name you like)
3. Keep it **Public**
4. Do **not** add a README (we already have one)
5. Click **Create repository**

### 2. Push your code

Replace `YOUR_USERNAME` with your GitHub username:

```bash
cd "/Users/carlomuller/Documents/Cost Tracking App"
git init
git add .
git commit -m "Initial Spend PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/spend.git
git push -u origin main
```

### 3. Enable GitHub Pages

1. Open your repo on GitHub
2. Go to **Settings** → **Pages**
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**
4. Choose branch: `main`, folder: `/ (root)`
5. Click **Save**
6. Wait 1–2 minutes for the site to publish

Your app will be live at:

`https://YOUR_USERNAME.github.io/spend/`

## Install on iPhone

1. Open **Safari** on your iPhone (Chrome won't work for PWA install)
2. Visit your GitHub Pages URL
3. Tap the **Share** button (square with arrow)
4. Tap **Add to Home Screen**
5. Tap **Add**

The Spend icon should appear on your home screen. Open it — it should run full-screen without browser bars.

## Verify it works

- [ ] App opens full-screen (no Safari address bar)
- [ ] Add an expense — it appears on Home and Expenses
- [ ] Close and reopen — data is still there (localStorage)
- [ ] Turn on Airplane Mode, reopen app — still loads (service worker)

## Regenerate icons

```bash
python3 scripts/generate_icons.py
```
