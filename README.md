# FocusForge

Study planner + focus timer. **Plan smarter. Focus deeper.**
Built for **Expo SDK 57** (React Native 0.86, React 19.2).

```
focusforge/
├── backend/   Node.js + Express + TypeScript + Prisma + PostgreSQL
└── mobile/    Expo (React Native) app - runs on Android, iOS and the web
```

## What you need (one time)

| Tool | Requirement |
|---|---|
| Node.js | **22.13 or newer** (check with `node -v`; Expo SDK 57 needs it) |
| PostgreSQL | password `0000`, with a database named `focusforge` (create it in pgAdmin) |
| Expo Go | the version for **SDK 57** on your phone (the Play Store one) |

## 1. Backend (terminal 1)

```
cd D:\focusforge\backend
setup.cmd
```

`setup.cmd` installs packages, creates the tables, adds demo data and starts the server.
The `.env` file is already filled in (database password `0000`).
Check it works: open http://localhost:4000/health - you should see `"status":"ok"`.
Next time, start the server with `npm run dev`.

## 2. Mobile app (terminal 2)

```
cd D:\focusforge\mobile
setup.cmd
npx expo start -c
```

- **Phone:** open Expo Go, scan the QR code (same Wi-Fi as the laptop).
- **Browser:** press `w` in the terminal (or run `npm run web`).
- **Don't press `a`** unless you have the Android emulator installed.

Log in with the demo account: `alex@example.com` / `password123`.

If the app says "Cannot reach the server": make sure the backend terminal is still running and the phone is on the same
Wi-Fi, then put your laptop's address in `mobile/.env`:
`EXPO_PUBLIC_API_URL=http://YOUR-LAPTOP-IP:4000` (find it with `ipconfig`) and restart with `npx expo start -c`.

## Why `setup.cmd` and not just `npm install`?

Expo chooses the correct version of every library for SDK 57 itself (`npx expo install`). The setup script uses that,
so no version is guessed. Do **not** use `--legacy-peer-deps`: Expo advises against it and it hides real problems.

## Free web link

See [DEPLOY.md](DEPLOY.md).

## API overview (all under `/api`, JSON, `Authorization: Bearer <token>`)

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `/auth/login`, `/auth/google`, `/auth/forgot-password`, `/auth/reset-password`; `GET/PATCH/DELETE /auth/me`; `POST /auth/change-password` |
| Subjects | `GET/POST /subjects`, `GET/PATCH/DELETE /subjects/:id`, topics at `/subjects/:id/topics[/:topicId]` |
| Tasks | `GET /tasks?from&to&status&subjectId`, `POST /tasks`, `GET/PATCH/DELETE /tasks/:id`, `POST /tasks/:id/complete`, `/reopen`, `/reschedule`, `GET /tasks/:id/suggest-time` |
| Sessions | `POST /sessions` (returns XP + streak), `GET /sessions` |
| Stats | `GET /stats/home`, `GET /stats/progress?range=weekly\|monthly\|all` |
| Settings | `GET/PUT /settings` |

Password-reset codes are printed in the backend terminal unless `SMTP_*` is set in `backend/.env`.

## Notes

- Reminders and the background timer alarm are phone features; in a browser they quietly do nothing.
- Google sign-in needs your own OAuth client IDs (`mobile/.env` and `GOOGLE_CLIENT_IDS` in `backend/.env`) and a
  development build, not Expo Go.
- 25 focused minutes = 10 XP. Skipping or resetting a focus phase keeps the minutes already studied (no XP).
