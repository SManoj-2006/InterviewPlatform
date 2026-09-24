# DevIntervue — Viva Preparation

Short, honest answers to questions examiners typically ask. Know the *why*,
not just the *what*.

## Project overview

**Q: What does DevIntervue do, in one minute?**
A: It's a web platform for live pair-programming and technical interviews.
Two users join a session, get a video call and chat channel automatically,
and edit the same code in real time with per-user cursors. Code runs in
JavaScript, Python or Java through a sandboxed executor, and there's a
practice section with judge-style problems. Auth is handled by Clerk.

**Q: What problem does it solve?**
A: Remote technical interviews usually juggle three tools — a video app, a
shared doc, and a code runner. DevIntervue puts the interview room, the
collaborative editor, and code execution in one place, so the interviewer
sees the candidate think and type in real time.

## Architecture & design

**Q: Draw/explain the architecture.**
A: React SPA talks to a Node/Express backend two ways: REST (`/api/*`) for
sessions, auth, chat tokens and code execution; and a WebSocket endpoint
(`/collab/:sessionId`) for live editing. MongoDB stores users and sessions.
Three managed services: Clerk (identity), Stream (video/chat), Piston
(sandboxed code execution). See `docs/ARCHITECTURE.md` for the diagram.

**Q: Why Yjs? Why not just send keystrokes over Socket.io?**
A: Raw keystrokes need a central authority to order concurrent edits
(operational transform) or you get divergent documents. Yjs is a CRDT: every
replica applies updates in any order and still converges to the same text,
with no lock server. `y-websocket` adds rooms and presence (awareness) for
cursors almost for free.

**Q: What is a CRDT, briefly?**
A: A data structure designed so concurrent updates from different replicas can
be merged in any order with the same result — "conflict-free". Yjs's text
type (YATA algorithm) tags each character with a unique ID and neighbour
links, so two inserts at the same position get a deterministic order.

**Q: What happens if the WebSocket disconnects mid-session?**
A: The editor banner switches from *Live* to *Offline* and the manual
`Refresh Code` path (which polls the MongoDB snapshot) takes over. Edits are
not lost — Yjs also replays missed updates on reconnect, and the server
re-seeds the document from MongoDB if it restarted.

**Q: How do you stop one user from editing another session's code?**
A: Three layers: (1) the upgrade handler only claims `/collab/*` paths;
(2) the Clerk JWT in the query string is verified; (3) the session is loaded
from MongoDB and the socket is closed unless the user is the host or a
participant **and** the session status is `active`. Each session also gets an
isolated Yjs document keyed by session id.

## Backend

**Q: How does authentication work end-to-end?**
A: The React app uses Clerk components for sign-in. Every API call carries the
Clerk JWT as a bearer token (axios interceptor). `clerkMiddleware()` verifies
it; `protectRoute` then atomically upserts the user (`findOneAndUpdate` with
`$setOnInsert`, so concurrent first-requests can't create duplicates) and
syncs the user to Stream Chat.

**Q: Why does code execution go through your backend instead of calling Piston from the browser?**
A: Three reasons: the Piston token/URL stays server-side; we can validate the
language and cap code size before spending sandbox CPU; and we can rate-limit
(30 executions / 10 min per IP) to prevent abuse.

**Q: What does the rate limiter do?**
A: `express-rate-limit` with two tiers: 300 requests / 15 min per IP across
`/api`, and a stricter 30 / 10 min on `/api/code/execute` since execution is
the expensive operation.

**Q: Why did you make Stream clients lazy?**
A: They were constructed at module import time, so a missing env var crashed
the whole process with a cryptic `secretOrPrivateKey must have a value`
error — even when just importing the module in tests. Lazy getters defer
construction to first use, and `validateEnv()` fails fast at startup with a
clear message naming the missing variable.

## Frontend

**Q: How does the editor stay in sync with what gets executed?**
A: `y-monaco` binds the Monaco model to the shared `Y.Text`. A React effect
mirrors the Yjs text into local state (used by Run), and a debounced effect
persists it to MongoDB. So Run always executes what's on screen, live or not.

**Q: How is the judge output comparison done?**
A: `outputsMatch()` in `src/lib/judge.js` (identical copy on both sides).
It normalises both strings — CRLF→LF, trim, drop blank lines, collapse inner
whitespace, strip spaces inside brackets and around commas — then compares
strictly. This avoids false failures from trailing spaces or `[1,2,3]` vs
`[ 1, 2, 3 ]`.

## Testing

**Q: What did you test, and how?**
A: 16 backend tests with Node's built-in `node:test` (no framework to
install): judge normalisation/matching, Piston execute-URL construction, env
validation, and server wiring — importing `server.js` must not open ports or
need a DB, `/health` must respond, and unauthenticated API access must be
rejected. `server.js` was refactored to export `app`/`httpServer` and only
start listening under `startServer()` so tests can import it safely.

**Q: Why not Jest/Vitest?**
A: Zero extra dependencies and it runs anywhere Node 20+ exists — one less
thing to break in evaluation environments.

## Limitations & future work (answer honestly)

**Q: What are the limitations?**
A: Yjs documents live in server memory — a restart drops live docs (though
MongoDB snapshots re-seed them). Only two roles exist (host/participant);
awareness doesn't scale to dozens of cursors; the judge only checks stdout
equality, not performance or hidden tests; no submission history.

**Q: What would you add next?**
A: Timed contest mode with scoring, submission history + similarity checks,
3+ participant roles (interviewer/observer), and interview scheduling.
