# DevIntervue — Deployment Guide (Render + MongoDB Atlas)

Live architecture: **one Docker container** (Express API + built React
frontend + Yjs WebSocket, all on one port) on Render, **MongoDB Atlas**
free tier for data, **public Piston API** for code execution, and the
existing **Clerk** / **Stream** SaaS accounts for auth/video/chat.

```
Browser ──HTTPS──▶ Render web service (devintervue.onrender.com)
                     ├─ /api/*            → Express REST
                     ├─ /collab/* (WS)    → Yjs collaboration
                     └─ /*               → React static bundle
                         │            ┌─── MongoDB Atlas (DB_URL)
                         ├────────────┼─── Clerk (auth)
                         ├────────────┼─── Stream (video/chat)
                         └────────────┘─── Piston (code execution — see below;
                                              needs self-hosting, not public API)
```

No separate frontend hosting is needed: with `NODE_ENV=production` the
backend serves `frontend/dist` itself (see `backend/src/server.js`), and the
frontend defaults to same-origin `/api` when `VITE_API_URL` is unset.

## Prerequisites

- This repo pushed to GitHub (Render deploys from a repo)
- A [Render](https://render.com) account (free tier is enough for demo)
- A [MongoDB Atlas](https://cloud.mongodb.com) account (free M0 cluster)
- Your existing Clerk and Stream API keys

## Step 1 — MongoDB Atlas (5 min)

1. Create a free **M0** cluster (any region close to you).
2. Database Access → Add user: username/password, role *readWriteAnyDatabase*
   (or Atlas admin for simplicity on a demo project).
3. Network Access → **Allow access from anywhere** (`0.0.0.0/0`) — required
   because Render uses dynamic IPs.
4. Connect → Drivers → copy the connection string, e.g.
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/devintervue?retryWrites=true&w=majority`

## Step 2 — Deploy on Render

**Option A — Blueprint (fastest):** Render Dashboard → New → Blueprint →
select the repo. `render.yaml` creates the web service with a `/health`
health check. Then fill in the `sync: false` variables below.

**Option B — manual:** New → Web Service → select repo → Runtime: **Docker**,
Dockerfile path `./Dockerfile` → plan Free → Health check path `/health`.

### Environment variables

| Key | Where | Notes |
|---|---|---|
| `DB_URL` | runtime | Atlas connection string from step 1 |
| `CLERK_SECRET_KEY` | runtime | Clerk dashboard → API keys |
| `STREAM_API_KEY` / `STREAM_API_SECRET` | runtime | Stream dashboard |
| `VITE_CLERK_PUBLISHABLE_KEY` | **build time** | Clerk publishable key — must be set *before* the first build |
| `VITE_STREAM_API_KEY` | **build time** | Stream key — must be set *before* the first build |
| `PISTON_API_URL` | preset | `https://emkc.org/api/v2/piston` (public hosted executor) |
| `NODE_ENV` / `PORT` | preset | `production` / `3000` |

> If you add the `VITE_*` keys after the first build, trigger **Manual Deploy →
> Clear build cache & deploy** so the frontend bundle picks them up.

## Step 3 — Clerk production settings

Clerk Dashboard → your app → **Allowed origins / redirect URLs**: add
`https://<your-service>.onrender.com`. (Without this, sign-in redirects fail
on the live domain.)

## Step 4 — Verify live

1. `https://<your-service>.onrender.com/health` → `{"msg":"api is up and running"}`
2. Sign in, create a session, join from a second browser/incognito window.
3. Type in one editor — the other updates live (cursor label visible).
4. Run JS/Python/Java on the Problem page (public Piston handles it).
5. End the session as host; participant returns to the dashboard.

> Free-tier Render services **sleep after ~15 min idle** — first load can take
> ~50 s to wake. For viva day, open the URL once beforehand to warm it up.

## Code execution — read this before relying on "Run code"

The public Piston API (`emkc.org`) went **whitelist-only on 15 Feb 2026**:
`GET /api/v2/piston/runtimes` still works, but `POST /execute` is rejected
without an authorized token, and tokens are **not issued for individual,
portfolio, or university projects**. So on a Render-only deploy, "Run code"
returns a clear `Server misconfiguration: missing PISTON_AUTH_TOKEN` error
instead of running anything. Everything else (auth, video, chat, live
collab editing, problems, sessions) works fine.

Your options for working code execution:

**A. Self-host Piston on a VPS (recommended for viva).** One ~$5–6/mo VPS
(Hetzner/DigitalOcean) runs the existing `docker-compose.yml`, which already
includes the Piston service plus automatic runtime installation. Then set
`PISTON_API_URL=http://<your-vps>:2000/api/v2` (no token needed for your own
instance). This is the only path with zero compromises.

**B. Request a whitelist token.** Only if your use qualifies as non-commercial
educational use at the maintainer's discretion — see the "Important Note" in
[engineer-man/piston](https://github.com/engineer-man/piston#public-api).
Set it as `PISTON_AUTH_TOKEN` alongside the default `PISTON_API_URL`.

**C. Ship without live execution.** Fine for demonstrating the collaboration
platform itself; the Run button shows the misconfiguration message.

> Why not Piston on Render/Railway? Piston's sandbox needs `--privileged`
> Docker containers, which these platforms don't offer — that's why the
> Blueprint doesn't include it.

## Alternative — full self-host on a VPS (Docker)

If you have a VPS (Hetzner/DigitalOcean ~$5/mo), the production
`docker-compose.yml` runs everything including **self-hosted Piston**:

```bash
# on the server
git clone <your-repo> && cd DevIntervue
cp backend/.env.example backend/.env        # fill in keys
cp frontend/.env.example frontend/.env      # fill in keys
docker compose up -d --build
```

For this path, build production images instead of the dev servers:
override `backend`/`frontend` services to `build: .` with the root
`Dockerfile`, or keep the dev compose for development only.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Build fails: `VITE_CLERK_PUBLISHABLE_KEY is not defined` | Build-time keys missing → set them, then redeploy with cleared cache |
| Sign-in loops / redirect error | Live domain not in Clerk allowed origins |
| `MongoServerSelectionError` | Atlas IP allowlist missing `0.0.0.0/0`, or wrong DB password |
| Editor stuck on "Connecting" | WSS blocked — check the `/collab` upgrade isn't stripped by a proxy; Render supports WebSockets natively |
| Code run fails | Public Piston is whitelist-only (Feb 2026) — self-host Piston on a VPS (option A above) or set PISTON_AUTH_TOKEN |
