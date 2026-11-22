# IPL Auction Arena – Online

Your game, now playable by 10 friends anywhere with just a link. No logins.

## Deploy free on Render (about 5 minutes)
1. Create a free GitHub account, make a **new repository**, and upload everything in this folder
   (`server.js`, `package.json`, `README.md`, `index.html`).
2. Go to https://render.com, sign up, click **New + → Web Service**, and connect that repository.
3. Settings: **Runtime** Node · **Build Command** `npm install` · **Start Command** `npm start` · **Instance type** Free.
4. Click **Create Web Service**. After a minute you get a URL like `https://your-game.onrender.com`.

## How to play
1. Host opens the URL, enters a name, clicks **Create new room**. A 5-letter room code appears.
2. Host taps **Share on WhatsApp**. Friends open the link (code is pre-filled), type a name, tap **Join room**.
3. Everyone picks a team. Host presses **Start auction**.
4. 💬 button (bottom-left): text chat and 🎧 **Join voice**.

## Things worth knowing
- **Free Render sleeps after ~15 min idle.** Open the URL a minute before game time to wake it.
  Game state lives in server memory, so a restart/redeploy ends running games. Don't redeploy during a game.
- **If the host drops**, another player is promoted automatically and the auction continues.
  If a friend's phone reconnects, they keep their team.
- **Voice** is peer-to-peer (WebRTC). It works for most networks; a few strict mobile/corporate networks
  need a TURN server (not included). Text chat always works.
- Run several games at once: each room has its own code.
- Test locally: `npm install && npm start`, then open http://localhost:3000
