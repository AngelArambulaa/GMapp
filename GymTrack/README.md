# GymApp — Step 1: Frontend Shell

This is the first step of the project. The goal here is to get the
React app running with routing, auth, and the two dashboards working
**without any backend** — all data is mocked.

---

## What's included

- ✅ Vite + React + TailwindCSS configured
- ✅ Login & Register pages (with role picker)
- ✅ Auth context with mock login (no API needed yet)
- ✅ Route guards (athlete vs coach)
- ✅ Shared AppLayout with header and bottom navigation
- ✅ Athlete Dashboard (mock data)
- ✅ Coach Dashboard (mock data)

## What's NOT included yet (next steps)

- ⬜ Log Session page
- ⬜ History page
- ⬜ Progress charts
- ⬜ Routine Builder
- ⬜ Find Athletes page
- ⬜ Real API calls (comes after backend is set up)

---

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Test accounts (mock — no backend needed)

| Role    | Email              | Password |
|---------|--------------------|----------|
| Athlete | athlete@test.com   | 12345678 |
| Coach   | coach@test.com     | 12345678 |

You can also register a new account using the Sign up page.

---

## File structure

```
src/
├── contexts/
│   └── AuthContext.jsx      ← mock login/register, swap with real API later
├── components/
│   ├── layout/
│   │   └── AppLayout.jsx    ← header + bottom nav (shared by all pages)
│   └── ui/
│       └── Spinner.jsx
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── athlete/
│   │   └── Dashboard.jsx    ← mock data at the top of the file
│   └── coach/
│       └── Dashboard.jsx    ← mock data at the top of the file
├── App.jsx                  ← all routes + route guards
├── main.jsx
└── index.css                ← Tailwind + reusable classes
```

---

## How to verify everything works

1. `npm run dev` — no errors in terminal
2. Go to `/login` — you see the login form with test accounts hint
3. Login as **athlete** → lands on athlete dashboard with bottom nav (Home, Log, History, Progress)
4. Logout → login as **coach** → lands on coach dashboard with different bottom nav
5. Go to `/register` → create a new account as either role → redirects to correct dashboard
6. Refresh the page → you stay logged in (localStorage)
7. Logout → you can't access `/` or `/coach` without logging in

---

## Next step

Once this is working, the next step adds the remaining athlete pages:
**Log Session**, **History**, and **Progress** — still with mock data.
