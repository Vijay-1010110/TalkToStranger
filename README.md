# ⚡ Talk to Stranger — Best Free Omegle Alternative

A high-performance, distraction-free "Talk to Stranger" web application featuring **Text Chat**, **Voice Call**, and **Video Chat**. Built with a **100% free-tier architecture** using direct **WebRTC Peer-to-Peer (P2P)** communication and free public Google STUN servers—requiring zero paid APIs, zero third-party subscriptions, and zero recurring server costs.

🌐 **Live URL**: [https://talktostranger-9my8.onrender.com](https://talktostranger-9my8.onrender.com)  
🔍 **SEO & Google Search Guide**: [`SEO_AND_GOOGLE_RANKING_GUIDE.md`](./SEO_AND_GOOGLE_RANKING_GUIDE.md)  
🌐 **Hosting & DevOps Registry**: [`HOSTING_AND_ACCOUNTS.md`](./HOSTING_AND_ACCOUNTS.md)

---

## ✨ Key Features & Capabilities

- **🚀 1-Click Instant Pairing**: Anonymous matchmaking in less than a second (no login or account required).
- **🔒 Direct P2P Encryption**: Video, voice, and data channels flow browser-to-browser via WebRTC (`stun.l.google.com:19302`).
- **⚧️ Pre-Start Gender Selection**: Choose your gender (Male / Female / Other) shown to your partner.
- **💬 Dual-Color Chat Feed**: Left-aligned stranger bubbles (dark slate) and right-aligned sender bubbles (cobalt blue) with live typing indicators.
- **🔲 Dual Video Canvas Switcher**: Toggle between **Normal PiP Mode** (stranger large, self floating in corner) and **Equal 50:50 Split Canvas** (side-by-side or stacked).
- **🛑 Prominent STOP Button**: Direct 1-click exit back to the Home screen, cleanly releasing all media streams.
- **🔄 Automatic Re-Matching**: When one partner leaves, skips, or disconnects, the other partner automatically begins searching for another stranger immediately.
- **🎥 Device Switcher & Privacy Revoke**: Flip between front/back cameras, select microphones, or completely power down hardware access at the OS level.
- **🌐 External Web Co-Browse**: Synchronized live co-browsing interface for sharing websites and web tools.
- **🕵️ Hidden Tester Mode**: Online user count is hidden from public visitors so low initial counts don't discourage traffic. Testers can tap the "Stranger" logo 5 times or add `?test=1` to view live counts.
- **🔍 Comprehensive SEO**: Built-in Google Search Console verification (`googleb22af8257abd7c68`), OpenGraph tags, JSON-LD FAQ schemas, and sitemaps for ranking on "alternative for omegle" and "talk to stranger".

---

## 🌐 Live Deployment & Hosting

### Primary 24/7 Hosting (Render.com)
- **Production URL**: `https://talktostranger-9my8.onrender.com`
- **Deploy Config**: Node 20 runtime, Auto-deploy on push to `main`.
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Node.js, Express 5, Socket.io (WebSocket signaling & FIFO matchmaking engine).
- **Authentication**: JWT tokens + bcryptjs + persistent database (`data/database.json`).
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons.
- **Real-Time Protocol**: WebRTC (`RTCPeerConnection`, `RTCDataChannel`, Google STUN: `stun.l.google.com:19302`).
- **Search Engine Optimization**: Google Search Console verified property, `robots.txt`, `sitemap.xml`, OpenGraph, Twitter Cards, JSON-LD `WebApplication` & `FAQPage` schemas.

---

## 🧪 Testing

Run automated multi-client simulation test:
```bash
npm test
```
Run automatic re-match test:
```bash
node tests/auto_rematch.test.js
```
