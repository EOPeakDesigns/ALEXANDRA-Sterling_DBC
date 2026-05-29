# Alexandra Sterling — Digital Business Card

A production-ready **PWA digital business card** for **Alexandra Sterling, Creative Designer**. Built with vanilla HTML, CSS, and JavaScript — no framework, no build step, deploy anywhere.

**Live demo:** _Add your Vercel URL after deployment_

---

## Highlights

- **Mobile-first** — Optimized for iPhone Safari, Android Chrome, and installed PWA
- **One-tap contact** — WhatsApp, call, Gmail, Maps, website, vCard download
- **Action Flower** — QR code, save contact, and share from the avatar hub
- **Studio Moment video** — Lazy-loaded YouTube embed in an accessible modal
- **Installable PWA** — Add to Home Screen with offline caching via Service Worker
- **Accessible** — Skip link, focus trap, ARIA, reduced motion, 44px touch targets
- **SEO & social** — Open Graph, Twitter Cards, canonical URL, sitemap

---

## Tech Stack

| Layer | Details |
|-------|---------|
| Markup | Semantic HTML5 |
| Styles | CSS custom properties, mobile-first responsive system |
| Scripts | ES6 modules, component architecture |
| Data | `data/card.json` — single source of truth |
| PWA | Web manifest + Service Worker (`sw.js`) |
| Hosting | [Vercel](https://vercel.com) (static) |

---

## Project Structure

```
├── index.html                 # Entry point
├── vercel.json                # Vercel headers & routing
├── sw.js                      # Service Worker (offline cache)
├── robots.txt
├── sitemap.xml
├── data/
│   └── card.json              # Owner, contact, media, social, labels
├── assets/
│   ├── images/                # Owner.webp, MYQR.png
│   └── icons/favicon/         # PWA icons + site.webmanifest
├── styles/
│   ├── variables.css          # Theme tokens
│   ├── base.css               # Reset, safe-area, typography
│   ├── components.css         # Card, modals, action flower
│   ├── animations.css
│   └── responsive.css         # Breakpoints 320px → 4K
└── js/
    ├── main.js                # App orchestrator
    ├── components/            # UI components
    └── utils/                 # vCard, share, clipboard, contacts
```

---

## Deploy to GitHub + Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — Alexandra Sterling digital business card"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### 2. Connect Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Framework Preset:** Other
4. **Build Command:** _(leave empty)_
5. **Output Directory:** `./` _(root)_
6. Click **Deploy**

Vercel reads `vercel.json` automatically for security headers and cache rules.

### 3. Post-deploy checklist

- [ ] Update `sitemap.xml` — replace `YOUR-VERCEL-URL.vercel.app` with your live domain
- [ ] Test on real iPhone Safari and Android Chrome
- [ ] Test **Add to Home Screen** (PWA install banner)
- [ ] Share link — confirm Open Graph preview shows profile photo
- [ ] Hard refresh once after deploy so Service Worker updates (`dbc-v14`)

### 4. Custom domain (optional)

In Vercel → Project → **Settings → Domains**, add your domain (e.g. `card.creativedesign.studio`). HTTPS is automatic.

---

## Local Development

> **Important:** Run a local server. Opening `index.html` directly (`file://`) disables PWA, Service Worker, and `card.json` fetch.

```bash
# Python
python -m http.server 8765

# Node.js
npx serve .

# PHP
php -S localhost:8765
```

Open `http://localhost:8765`

---

## Customize Content

Edit **`data/card.json`** — no HTML changes needed for most updates:

```json
{
  "owner": { "fullName": "...", "role": "...", "slogan": "..." },
  "contact": { "phone": "...", "email": "...", "websiteUrl": "..." },
  "media": {
    "avatar": "assets/images/Owner.webp",
    "qrCode": "assets/images/MYQR.png",
    "showcaseVideo": {
      "src": "",
      "embedUrl": "https://www.youtube.com/embed/VIDEO_ID?playsinline=1&rel=0&modestbranding=1"
    }
  },
  "social": [ { "platform": "instagram", "url": "...", "label": "..." } ],
  "labels": { "showcasePlay": "...", "installApp": "..." }
}
```

After editing `card.json`, bump `CACHE_VERSION` in `sw.js` and redeploy so returning visitors get fresh data.

### Replace images

| File | Purpose |
|------|---------|
| `assets/images/Owner.webp` | Profile photo (recommended: 400×400, WebP) |
| `assets/images/MYQR.png` | QR code for contact modal |

---

## Mobile & PWA Notes

- **Safe areas** — `env(safe-area-inset-*)` on body and install banner (notch devices)
- **YouTube modal** — Lazy `data-src` + `transform: none` on video modal fixes iOS blank iframe bug
- **Touch targets** — Action Flower, play button, and contact actions are ≥ 44px
- **Install banner** — Shows on mobile when not in standalone mode; dismiss persists via `localStorage`
- **Offline** — Core assets cached; YouTube requires network when playing video

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome / Edge 90+ | Full |
| Safari iOS 14+ | Full (incl. PWA install) |
| Firefox 90+ | Full |
| Samsung Internet | Full |

---

## Security

- No inline scripts or styles
- External links use `noopener noreferrer`
- Security headers via `vercel.json` (X-Content-Type-Options, Referrer-Policy, etc.)
- Service Worker scoped to same-origin only

---

## License

MIT — free to use, modify, and deploy for personal or client projects.

---

**Alexandra Sterling** · Creative Designer · _From Thought to Masterpiece_
