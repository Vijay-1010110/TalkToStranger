# 🌐 Hosting, Accounts & DevOps Registry

This file maintains a centralized record of all cloud services, hosting providers, accounts, and deployment configurations for **TalkToStranger**.

---

## 📌 Active Services & Accounts Registry

| Service | Account / Email | Purpose | Plan / Cost | Status | Live URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GitHub** | `Vijay-1010110` | Source Code & CI/CD | Free ($0) | ✅ Active | [Repo Link](https://github.com/Vijay-1010110/TalkToStranger) |
| **Render** | `thirdparty597@gmail.com` | Primary Web Service (24/7 HTTPS) | Free ($0) | ✅ Live & Verified | [`talktostranger-9my8.onrender.com`](https://talktostranger-9my8.onrender.com) |
| **Cloudflare** | Quick Tunnel | Ephemeral local dev link | Free ($0) | ⚠️ Expired when idle | Use Render HTTPS for phones |
| **Google STUN** | Cluster (`stun.l.google.com:19302`) | P2P NAT Traversal | Free ($0) | ✅ Active | Built-in |

---

## 🛠️ Service 1: Render.com (Primary 24/7 Hosting)

- **Account Email**: `thirdparty597@gmail.com`
- **Service Type**: Web Service
- **Source Code**: Public Git URL `https://github.com/Vijay-1010110/TalkToStranger`
- **Branch**: `main`

### Deployment Specifications:
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: `Free` ($0/month, 750 free hours/month)
- **Auto-Deploy**: Enabled on Git push to `main`

### Environment Variables on Render:
| Key | Recommended Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `10000` | Render standard port |
| `JWT_SECRET` | *(Random 32-char string)* | Secures user tokens |

---

## 🐳 Service 2: Koyeb / Fly.io (Secondary / Backup Container)

- **Config Files**: [`Dockerfile`](./Dockerfile) (Multi-stage build) & [`fly.toml`](./fly.toml)
- **Build Target**: Node 20 Alpine Linux
- **Port Exposed**: `5000` (Docker internal) / `10000` (Render)
- **Status**: Standby container configuration ready

---

## 🔒 Security Best Practices
- **Never commit passwords, private keys, or actual JWT secrets into Git.**
- Use Render's **Environment** tab in their dashboard to store sensitive keys.
- Media streams are 100% Peer-to-Peer (WebRTC) and never touch or store on server disks.

---

## 📱 Mobile Phone Testing & WebRTC HTTPS Requirements

### Why did the temporary tunnel or link fail to load on mobile?
1. **Cloudflare Quick Tunnel Idle Expiration**:
   Quick tunnels (`trycloudflare.com`) without a persistent registered cloudflared service have a short TTL and expire automatically after inactivity (`error="Unauthorized: Tunnel not found"`).
2. **Strict Mobile WebRTC Security (HTTPS Only)**:
   Modern mobile browsers (iOS Safari and Android Chrome) strictly block access to `navigator.mediaDevices.getUserMedia()` unless the site is served over a valid **HTTPS** origin or `localhost`.
3. **The Solution**:
   Always open the permanent Render production HTTPS URL:
   `https://talktostranger-9my8.onrender.com`
   This provides full SSL certificates, permanent 24/7 uptime, and camera/mic permissions across mobile phones.

---

## 🔄 Deployment Checklist
- [x] WebRTC P2P Text, Voice, and Video engine tested
- [x] Multi-screen & foldables layout engine responsive
- [x] Unique online user tracking implemented
- [x] SEO meta tags, OpenGraph preview, and sitemap generated
- [x] Git repository pushed to `Vijay-1010110/TalkToStranger`
- [ ] Connect repository on Render dashboard with `thirdparty597@gmail.com`
- [ ] Verify green "Live" status on Render
