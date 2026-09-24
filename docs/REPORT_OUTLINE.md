# DevIntervue — Final-Year Project Report Outline

A chapter-by-chapter skeleton. Fill each section from the code and from
`docs/ARCHITECTURE.md`; keep screenshots in an appendix, not in the chapters.

## 1. Title page / certificate / declaration / acknowledgement
Standard institute format.

## 2. Abstract (200–250 words)
- Problem: remote interviews split across video app + shared doc + code runner.
- Solution: DevIntervue — one room with video, chat, real-time collaborative
  editor, sandboxed execution, practice problems.
- Key techniques: MERN stack, Yjs CRDT for conflict-free editing, Clerk JWT
  auth, Piston sandboxing, rate limiting, automated tests, Docker deployment.
- Outcome: working demo with two-user live sessions; 16 automated backend tests.

## 3. Table of contents / list of figures / list of tables

## 4. Introduction
- 4.1 Background: growth of remote hiring, pair programming.
- 4.2 Problem statement.
- 4.3 Objectives (numbered, testable — e.g. "two users edit the same file
  with <200 ms sync latency on LAN").
- 4.4 Scope and limitations (2-user sessions, stdout-only judging, in-memory
  Yjs docs).

## 5. Literature survey / existing systems
- LeetCode Playground, CodePair, CodeSandbox Live, Live Share.
- Comparison table: real-time editing, video, execution, auth, self-hostable.
- Gap analysis → why DevIntervue.

## 6. System requirements
- 6.1 Functional requirements (FR-1…FR-n: register/login, create/join/end
  session, live edit, run code, judge practice problem, chat, video).
- 6.2 Non-functional requirements (auth on every request, rate limits,
  JSON errors, env validation, graceful offline fallback).
- 6.3 Hardware/software requirements (Node 20+, MongoDB, Docker; API keys:
  Clerk, Stream).

## 7. System design
- 7.1 Architecture overview — copy the component diagram from
  `docs/ARCHITECTURE.md` §2; explain the two planes (REST + WebSocket).
- 7.2 Use-case diagram — actors: Guest, Member, Host, Participant.
  Use cases: sign up/in, create session, join session, edit code live,
  run code, chat, video call, end session, practise problems.
- 7.3 ER diagram — User / Session with fields, keys, relationships
  (from `docs/ARCHITECTURE.md` §4).
- 7.4 Data-flow diagrams — Level 0 (context) and Level 1
  (from `docs/ARCHITECTURE.md` §6).
- 7.5 Sequence diagrams (pick two):
  - Join session → JWT verify → Yjs handshake → awareness exchange.
  - Run code → auth → rate limit → validate → Piston → stdout → judge compare.
- 7.6 Real-time sync design — CRDT concept, YATA in one paragraph, update
  broadcast flow, awareness channel, persistence/debounce strategy,
  offline fallback (from `docs/ARCHITECTURE.md` §3).

## 8. Implementation
- 8.1 Tech stack justification (table + one line each).
- 8.2 Module breakdown — backend (`server.js`, `collab.js`, controllers,
  middleware) and frontend (hooks, editor binding, pages).
- 8.3 Key algorithms / logic:
  - Output normalisation for judging (show `judge.js`, explain each rule).
  - Session membership check on WebSocket upgrade (pseudo-code).
  - Debounced persistence of Yjs text to MongoDB.
- 8.4 Security measures — JWT verification (REST + WS), session-membership
  authorisation, rate limiting, input validation, Piston proxy (no token in
  browser), CORS allow-list, env validation, lazy SDK clients.
- 8.5 Challenges faced — e.g. import-casing crash on Linux, Stream client
  import-time crash, `/health` behind auth middleware, `y-websocket` v3
  server-utils removal (pinned to v2.1.0). One short paragraph each:
  symptom → root cause → fix.

## 9. Testing
- 9.1 Test strategy — unit (judge, URL builder, env), integration (server
  wiring with ephemeral port), manual two-browser sessions.
- 9.2 Test cases table — ID, description, input, expected, actual, status
  (derive from `backend/tests/`).
- 9.3 Results — 16/16 passing; manual demo checklist (from README).
- 9.4 Known issues.

## 10. Results and discussion
- Screenshots: dashboard, live session with two cursors, output panel,
  practice problem pass/fail.
- What the numbers show (tests passing, demo working); what didn't get built.

## 11. Conclusion and future scope
- Restate objectives → status. Future: contest mode, submission history,
  plagiarism checks, 3+ roles, scheduling, CI/CD.

## 12. References
- Yjs docs / YATA paper, Piston API, Stream docs, Clerk docs, Mongoose,
  Express rate-limit — IEEE format.

## Appendices
- A: API reference table (from README).
- B: Environment variable reference (from `.env.example` files).
- C: How to run (Docker + local, from README).
- D: Code listings (only the interesting 2–3 files: `collab.js`, `judge.js`).

---

### Diagram checklist (draw before writing chapters 7–8)
- [ ] System architecture (component) diagram
- [ ] Use-case diagram
- [ ] ER diagram
- [ ] DFD Level 0 and Level 1
- [ ] Sequence: live-edit sync
- [ ] Sequence: code execution + judging
