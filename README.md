# CodeCollab - Full Stack Pair Programming Platform

CodeCollab is a MERN-based real-time coding collaboration platform with:
- Clerk authentication
- live coding sessions
- Stream video + chat integration
- problem-based coding practice
- secure backend code execution proxy (Piston)

## Tech Stack

- Frontend: React, Vite, React Query, Clerk, Monaco Editor, Tailwind + DaisyUI
- Backend: Node.js, Express, MongoDB (Mongoose), Clerk Express middleware, Stream server SDK
- Code execution: self-hosted Piston (recommended)

## Core Features

- Authenticated dashboard with active and recent sessions
- Create / join / end pair-programming sessions
- Session-level video call + chat channel
- Multi-language code editor (JavaScript, Python, Java)
- Shared session code persisted in MongoDB
- In-page `Refresh Code` control for loading the latest shared editor state
- Judge-style output panel using expected output matching

## API Endpoints (Short Reference)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | No | Health check |
| `GET` | `/api/chat/token` | Yes | Stream token for video/chat client |
| `POST` | `/api/sessions` | Yes | Create coding session |
| `GET` | `/api/sessions/active` | Yes | List active sessions |
| `GET` | `/api/sessions/my-recent` | Yes | List recent completed sessions |
| `GET` | `/api/sessions/:id` | Yes | Fetch session details |
| `POST` | `/api/sessions/:id/join` | Yes | Join session as participant |
| `PATCH` | `/api/sessions/:id/code` | Yes | Save shared code and language |
| `POST` | `/api/sessions/:id/end` | Yes | End session (host only) |
| `POST` | `/api/code/execute` | Yes | Execute code through backend proxy |

## Project Structure

- `frontend/`: React client
- `backend/`: API server and business logic
- `backend/src/controllers/`: route handlers
- `backend/src/middleware/protectRoute.js`: auth, atomic user provisioning, and Stream user synchronization
- `backend/src/controllers/codeController.js`: code execution proxy to Piston
- `backend/src/controllers/sessionController.js`: session lifecycle and shared code persistence

## Environment Setup

### Backend (`backend/.env`)

Minimum expected variables:

```env
PORT=3000
DB_URL=<mongodb_connection_string>
NODE_ENV=development
CLIENT_URL=http://localhost:5173

INNGEST_EVENT_KEY=<inngest_event_key>
INNGEST_SIGNING_KEY=<inngest_signing_key>

STREAM_API_KEY=<stream_api_key>
STREAM_API_SECRET=<stream_api_secret>

# Self-hosted Piston (recommended)
PISTON_API_URL=http://localhost:2000/api/v2
# optional for self-hosted, required for hosted emkc endpoint
PISTON_AUTH_TOKEN=
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_CLERK_PUBLISHABLE_KEY=<clerk_publishable_key>
VITE_STREAM_API_KEY=<stream_api_key>
```

## Local Development

1. Install dependencies:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

2. Start backend:

```bash
npm run dev --prefix backend
```

3. Start frontend:

```bash
npm run dev --prefix frontend
```

### Authentication

Sign in through the application's Clerk sign-in button. Inngest does not require
an interactive login; it is used for backend event functions. Axios attaches the
active Clerk bearer token to protected API requests.

## One-Command Docker Dev Stack

Run the complete stack (Mongo + Piston + runtime installer + backend + frontend):

```bash
docker compose up -d
```

The Compose stack recreates the following services when containers have been
deleted: MongoDB, Piston, the Piston runtime initializer, the backend, and the
frontend. Backend and frontend dependency installation is skipped when the
persistent Node module volumes are already populated.

Useful commands:

```bash
docker compose logs -f
docker compose down
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Piston API: `http://localhost:2000/api/v2`
- MongoDB: `mongodb://localhost:27018`

Note: If you already run a Piston container on the host (for example `piston_api`),
the backend can be configured to use that container instead of the compose-managed
Piston. Set `PISTON_API_URL` in `backend/.env` or in `docker-compose.yml` to
`http://host.docker.internal:2000/api/v2` so the backend container will reach the
host-bound Piston instance. Alternatively, connect your existing container to
the Compose network or remove the compose piston service to avoid duplicate
containers.

The Compose Piston initializer may fail when the host cannot reach GitHub release
assets. This does not affect authentication, video, chat, or editor synchronization;
it only prevents the corresponding execution runtime from being installed.

## Self-Hosted Piston Setup (No Public Token Needed)

1. Run Piston container:

```bash
docker rm -f piston_api
docker volume create piston_data
docker run --privileged -dit -p 2000:2000 -v piston_data:/piston --name piston_api ghcr.io/engineer-man/piston
```

2. Install runtimes used by the app:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:2000/api/v2/packages -ContentType "application/json" -Body '{"language":"node","version":"18.15.0"}'
Invoke-RestMethod -Method Post -Uri http://localhost:2000/api/v2/packages -ContentType "application/json" -Body '{"language":"python","version":"3.10.0"}'
Invoke-RestMethod -Method Post -Uri http://localhost:2000/api/v2/packages -ContentType "application/json" -Body '{"language":"java","version":"15.0.2"}'
```

3. Verify runtimes:

```powershell
Invoke-RestMethod -Method Get -Uri http://localhost:2000/api/v2/runtimes
```

## Reliability Improvements Included

- atomic Mongo user provisioning from Clerk claims on first protected request
- automatic synchronization of authenticated users to Stream Chat
- Clerk bearer token injection for all Axios API requests
- safer session flow with ObjectId validation
- idempotent session join behavior for retry/refresh
- participant persistence after successful Stream membership
- Stream Video client lifecycle cleanup that avoids repeated joins from session polling
- increased Stream server request timeout for slower provider responses
- session code and language persistence with membership authorization
- editor refresh control that reloads shared code without a page reload
- conditional Docker dependency installation for faster container recovery
- corrected Stream user image payload
- robust Piston execute URL handling for hosted and self-hosted bases

## Demo Checklist

- sign in with two Clerk accounts
- create session from account A
- join session from account B
- verify video + chat connect
- edit code in account A, then use `Refresh Code` in account B to load the latest saved code
- switch languages and confirm the selected language is shared
- run JS/Python/Java code in both problem and session pages
- end session and confirm participant redirect to dashboard

## Future Scope

- team sessions with >2 participants
- real-time collaborative editor using WebSocket events or OT/CRDT
- contest mode with timed scoring
- plagiarism detection and submission history
- CI/CD deployment pipeline with observability
