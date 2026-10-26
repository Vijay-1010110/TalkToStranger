# ⚡ Stranger — Minimalist Anonymous Talk to Stranger Platform

A high-performance, distraction-free "Talk to Stranger" web application featuring **Text Chat**, **Voice Call**, and **Video Chat**. Built with a **100% free-tier architecture** using direct **WebRTC Peer-to-Peer (P2P)** communication and free public STUN servers—requiring zero paid APIs, zero third-party subscriptions, and zero recurring server costs.

---

## 🌐 How to Host & Make It Live for Free (100% $0)

Because this app uses **WebRTC**, modern browsers (Chrome, Safari, iOS, Android) strictly require **HTTPS / SSL** to grant camera and microphone permissions (except on `localhost`). 

The methods below provide **free automatic HTTPS certificates** and **persistent WebSocket signaling**.

---

### Option 1: 24/7 Cloud Hosting on Render.com (Recommended)

Render offers a generous **Free Web Service** tier with native persistent WebSocket support, automatic HTTPS, and direct GitHub deployments.

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/talkToStranger.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to **[Render.com](https://render.com)** and sign in with GitHub (Free, no credit card required).
   - Click **New +** → **Web Service**.
   - Select your `talkToStranger` repository.
   - Configure:
     - **Name**: `stranger-chat` (or any name you like)
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`
   - Click **Create Web Service**.

3. Render will build the Vite frontend and start the Express signaling server, giving you a live URL:
   `https://stranger-chat.onrender.com`

---

### Option 2: Deploy via Docker (Fly.io or Koyeb)

The repository includes a production multi-stage `Dockerfile`:

- **Fly.io**:
  ```bash
  # Install flyctl
  fly launch
  fly deploy
  ```
- **Koyeb**:
  - Connect your GitHub repository to **[koyeb.com](https://www.koyeb.com)**, select Dockerfile build, and deploy on the free nano tier.

---

### Option 3: Instant Live Test Link in 30 Seconds (No Sign-up)

If you want an immediate live HTTPS URL right now to test between your phone and computer without pushing to GitHub first, you can use a free tunnel:

```bash
# In your terminal while 'npm start' or 'npm run dev' is running on port 5000:
npx localtunnel --port 5000
```
This gives you an instant public HTTPS link (e.g. `https://stranger-xyz.loca.lt`) that works across all devices and mobile phones over the internet!

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Node.js, Express, Socket.io (WebSocket signaling & in-memory matchmaking queue).
- **Authentication**: JWT tokens + bcryptjs + file-backed persistent database (`data/database.json`).
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons.
- **Real-Time Protocol**: WebRTC (`RTCPeerConnection`, `RTCDataChannel`, Google STUN: `stun.l.google.com:19302`).

---

## 🧪 Testing

Run the automated simulation test:
```bash
npm test
```
