# DevIntervue — System Architecture

## 1. Overview

DevIntervue is a client–server web application with a real-time collaboration plane
alongside the classic request/response API. Three external managed services are
used (Clerk for identity, Stream for video/chat, Piston for sandboxed code
execution); everything else is first-party code.

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        BROWSER (React SPA)                    │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Dashboard /│  │ Session Page │  │ Problem Practice     │  │
│  │ Auth pages │  │ Monaco+Yjs   │  │ Monaco + judge       │  │
│  └─────┬──────┘  └──────┬───────┘  └──────────┬───────────┘  │
│        │ HTTPS          │ WSS /collab/:id    │ HTTPS          │
└────────┼────────────────┼────────────────────┼───────────────┘
         │                │                    │
         ▼                ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                 │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ REST API     │  │ Yjs WS server    │  │ Piston proxy   │  │
│  │ /api/*       │  │ /collab/:id      │  │ /api/code/     │  │
│  │ Clerk JWT    │  │ Clerk JWT +      │  │ execute        │  │
│  │ verified     │  │ session member   │  │ (rate-limited) │  │
│  └──────┬───────┘  └────────┬─────────┘  └───────┬────────┘  │
└─────────┼──────────────────┼────────────────────┼────────────┘
          │                  │                    │
          ▼                  ▼                    ▼
   ┌─────────────┐    ┌─────────────┐     ┌──────────────┐
   │  MongoDB    │    │ In-memory   │     │    Piston    │
   │  (Mongoose) │    │ Yjs docs    │     │  (sandboxed  │
   │  users,     │    │ (1 per      │     │   runtimes)  │
   │  sessions   │    │  session)   │     └──────────────┘
   └─────────────┘    └─────────────┘
          ▲
          │  users/sessions/video tokens
          ▼
┌──────────────────────────────────────────────────────────────┐
│  MANAGED SERVICES:  Clerk (auth) · Stream (video/chat)        │
└──────────────────────────────────────────────────────────────┘
```

### Component responsibilities

| Component | Responsibility |
|---|---|
| `backend/src/server.js` | Wires Express app, creates one shared HTTP server, attaches the Yjs upgrade handler. Exports `app`/`httpServer` so tests can import without starting anything. |
| `backend/src/lib/collab.js` | WebSocket server for `/collab/:sessionId`. Verifies the Clerk JWT from the query string, loads the session from MongoDB, allows only host/participants of **active** sessions, keeps one Yjs `Doc` per session in memory. |
| `backend/src/controllers/*` | REST handlers: sessions lifecycle, code persistence, Piston proxy, Stream chat token. |
| `backend/src/middleware/protectRoute.js` | `requireAuth()` + atomic `findOneAndUpdate` user provisioning + Stream user upsert. |
| `backend/src/middleware/rateLimit.js` | `express-rate-limit`: 300 req/15 min globally on `/api`, 30 exec/10 min on `/api/code/execute`. |
| `frontend/src/hooks/useCollab.js` | Creates the Yjs `Doc`, `WebsocketProvider` (room = session id), and awareness (name + colour cursor). |
| `frontend/src/components/CodeEditorPanel.jsx` | Binds Monaco to the Yjs text type via `y-monaco`; shows Live/Connecting/Offline badge; falls back to manual refresh when offline. |
| `frontend/src/lib/judge.js` + `backend/src/lib/judge.js` | Identical normalisation/matching logic on both sides (kept in sync by convention; tested on the backend). |

## 3. Real-Time Collaboration Design (Yjs CRDT)

### Why a CRDT?

Two users typing concurrently produce conflicting operations (insert at the same
offset, delete-then-insert races). A **CRDT (Conflict-free Replicated Data Type)**
lets every replica apply operations in any order and still converge to the same
document — no central lock server, no operational-transform server logic.

Yjs implements the YATA algorithm: each character is an item with a unique ID
`(clientID, clock)` and links to its neighbours. Concurrent inserts at the same
position are ordered deterministically by client ID, so all replicas agree.

### Sync flow

```
User A types ──▶ Monaco ──▶ y-monaco binding ──▶ Y.Text ──▶ y-websocket
                                                              │ (binary update)
                                                              ▼
                                              ┌───────────────────────────┐
                                              │ backend /collab/:sessionId │
                                              │ 1. verify Clerk JWT       │
                                              │ 2. session active + member?│
                                              │ 3. apply update to Doc    │
                                              │ 4. broadcast to room      │
                                              └─────────────┬─────────────┘
                                                            │ binary update
                                                            ▼
User B ◀── y-monaco ◀── Y.Text ◀── y-websocket ◀─────────────┘

Awareness (cursor/selection/name/colour) travels on a separate lightweight
channel and is NOT persisted — it is ephemeral presence state.
```

### Persistence strategy

- Yjs docs live **in memory** on the backend, one per session (fast broadcast).
- The frontend **debounces** Yjs text changes (~1s) and `PATCH`es them to
  `/api/sessions/:id/code`, so MongoDB always holds a recent snapshot.
- On (re)join, the Yjs doc is **seeded** from the MongoDB snapshot, so a user
  who joins late (or after a server restart) sees the current code.
- If the socket drops, the editor banner flips to **Offline** and the old
  manual `Refresh Code` path (MongoDB poll) takes over — graceful degradation.

### Security of the sync channel

1. Upgrade requests to paths not starting with `/collab` are ignored (the
   handler only claims its own namespace).
2. The Clerk JWT is passed as `?token=` and verified with `clerkClient.verifyToken`.
3. The session is fetched from MongoDB; the socket is closed with `4401`/`4404`
   unless the user is the host or a participant **and** the session is `active`.
4. Room isolation: provider room name = session id; the backend keeps a
   `Map<sessionId, Y.Doc>` so updates never cross sessions.

## 4. Data Model (ER Diagram)

```
┌─────────────────────────┐         ┌─────────────────────────┐
│          User           │         │         Session         │
├─────────────────────────┤         ├─────────────────────────┤
│ _id (ObjectId)          │         │ _id (ObjectId)          │
│ clerkId (unique, idx)   │         │ title                   │
│ name                    │         │ host : ObjectId ────────┼──┐ references
│ email                   │         │ participants: [ObjectId]┼──┘ User
│ profileImage            │         │ status: active|completed│
│ createdAt / updatedAt   │         │ language (js/py/java)   │
└─────────────────────────┘         │ code (string snapshot)  │
                                    │ callId (Stream call)    │
                                    │ createdAt / updatedAt   │
                                    └─────────────────────────┘

Relationships:
  User 1 ── N Session   (as host)
  User N ── N Session   (as participants)
```

Indexes: `User.clerkId` (unique, used on every authenticated request),
`Session.status` (dashboard queries filter on it).

## 5. Request Lifecycles

### 5.1 Authenticated REST request

```
Browser ── Authorization: Bearer <Clerk JWT> ──▶ Express
  ▶ cors (allow-list) ──▶ express.json ──▶ clerkMiddleware (attaches req.auth)
  ▶ /api rate limiter ──▶ protectRoute: requireAuth() → upsert User (atomic)
      → upsert Stream user ──▶ controller ──▶ Mongoose ──▶ MongoDB
  ◀ JSON response (errors always JSON via the error-handling middleware)
```

### 5.2 Code execution

```
Browser POST /api/code/execute { language, code, stdin? }
  ▶ auth + strict rate limit (30 / 10 min per IP)
  ▶ validate language allow-list + code size cap
  ▶ backend → POST {PISTON_API_URL}/execute { language, version, files, stdin }
  ◀ Piston runs in a sandbox, returns { run: { stdout, stderr, code } }
  ◀ backend forwards run result (Piston URL/token never exposed to browser)
```

### 5.3 Practice-problem judging

```
Browser runs code via Piston → compares actual vs expected with outputsMatch()
normalise: CRLF→LF · trim · drop blank lines · collapse inner whitespace ·
           strip spaces inside [] and around commas
match = normalised strings strictly equal
```

## 6. Data-Flow Diagram (Level 1)

```
                ┌──────────┐  credentials   ┌──────────┐
                │  Member  ├───────────────▶│  Clerk   │
                │ (browser)│◀───────────────│ (auth)   │
                └────┬─────┘   JWT/token    └──────────┘
                     │ video/chat tokens
                     │ code edits (WS) ┌──────────────┐
                     ├────────────────▶│ Yjs collab   │
                     │ REST            │ server       │
                     ▼                 └──────┬───────┘
              ┌─────────────┐                 │ snapshots
              │ Express API ├────────────────▶│ MongoDB  │
              └──────┬──────┘                 └────────────┘
                     │ execute
                     ▼
              ┌─────────────┐
              │   Piston    │──▶ sandboxed run ──▶ stdout/stderr
              └─────────────┘
```

## 7. Deployment

Single `docker-compose.yml`: `mongo` (persistent volume), `piston`
(+ `piston-init` one-shot runtime installer), `backend` (env-validated at boot),
`frontend` (Vite dev server in dev profile). All inter-service URLs are
parameterised via `${VAR:-default}` — no hardcoded IPs.

## 8. Key Design Decisions (for the viva)

1. **Yjs over manual refresh / OT** — CRDTs converge without a central
   ordering server; `y-websocket` gives us rooms + awareness out of the box.
2. **Backend Piston proxy** — keeps execution credentials server-side, lets us
   rate-limit and validate before burning sandbox CPU.
3. **Lazy Stream clients** — constructing SDK clients at import time crashed the
   process on missing keys; lazy getters + `validateEnv()` give clear errors.
4. **Shared judge utils** — identical normalisation on frontend and backend
   prevents "works in preview, fails in judge" confusion; backend copy is unit-tested.
5. **`node:test` over Jest** — zero new dependencies, runs anywhere Node 20+ exists.
