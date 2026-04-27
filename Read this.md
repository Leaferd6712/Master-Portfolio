# READ THIS — Context File for Next AI
> Last updated: April 27, 2026
> Written by: GitHub Copilot (Claude Sonnet 4.6)
> Purpose: Brief the next AI agent on everything it needs to know to continue this project.

---

## WHAT THIS IS

A personal "Operating System" portfolio website. Not just a portfolio — a full control center.

- **Public side**: Clean portfolio showing all projects, filterable by category.
- **Private side** (`/dashboard`): Task manager, roadmap, project manager, AI chat panel — all password-protected.

The goal is that the owner NEVER edits HTML manually. Projects are added via a form → saved to JSON → public portfolio updates automatically.

---

## CRITICAL: WHAT HAS NOT BEEN DONE YET (DO THIS FIRST)

This project was created **manually** — files were written by hand without running `create-next-app` or any install scripts. The school laptop could not run scripts.

### STEP 1 — Install dependencies (run this first, on any non-restricted machine)
```bash
cd C:\Users\663208\portfolio
npm install
```

### STEP 2 — Verify it runs
```bash
npm run dev
```
Then open http://localhost:3000 — the public pages, project detail pages, and dashboard prototype routes should render.

### STEP 3 — Fix any TypeScript/import errors
- If you see errors about `@/data/projects.json`, check `tsconfig.json` has `"resolveJsonModule": true` (it does).
- If you see module not found for `next/font/google`, that's fine — it resolves after `npm install`.

---

## CURRENT STATE: Expanded static prototype complete

### What is built
| File | Status | Notes |
|------|--------|-------|
| `package.json` | ✅ | Next.js 14.2.3, React 18, Tailwind 3 |
| `tsconfig.json` | ✅ | Standard Next.js config |
| `next.config.js` | ✅ | Minimal |
| `tailwind.config.ts` | ✅ | Content paths set |
| `postcss.config.js` | ✅ | |
| `app/globals.css` | ✅ | Tailwind directives + dark scrollbar |
| `app/layout.tsx` | ✅ | Root layout with Navbar + Footer |
| `app/page.tsx` | ✅ | Home: hero, interests, featured projects |
| `app/projects/page.tsx` | ✅ | All projects, search + category filter (client component) |
| `app/ai/page.tsx` | ✅ | Filtered ML/Vision projects |
| `app/games/page.tsx` | ✅ | Filtered Games projects |
| `app/cad/page.tsx` | ✅ | Placeholder (no CAD data yet) |
| `app/backend-tools/page.tsx` | ✅ | Filtered Backend/Tools projects |
| `app/notes/page.tsx` | ✅ | Placeholder (backend needed for notes) |
| `app/contact/page.tsx` | ✅ | Contact links |
| `app/projects/[id]/page.tsx` | ✅ | Individual project detail page |
| `app/dashboard/login/page.tsx` | ✅ | Static login placeholder |
| `app/dashboard/page.tsx` | ✅ | Dashboard overview |
| `app/dashboard/tasks/page.tsx` | ✅ | Task manager prototype |
| `app/dashboard/roadmap/page.tsx` | ✅ | Month-by-month roadmap prototype |
| `app/dashboard/projects/page.tsx` | ✅ | Project manager prototype |
| `app/dashboard/context/page.tsx` | ✅ | context.md editor prototype |
| `app/dashboard/ai/page.tsx` | ✅ | AI panel prototype |
| `components/Navbar.tsx` | ✅ | Sticky, responsive, active link highlight |
| `components/dashboard/DashboardShell.tsx` | ✅ | Shared private-side layout |
| `components/dashboard/TaskStatusBadge.tsx` | ✅ | Shared task state badge |
| `components/ProjectCard.tsx` | ✅ | Reusable card, exports `Project` type |
| `components/Footer.tsx` | ✅ | Hidden ⚙ link to /dashboard |
| `data/projects.json` | ✅ | Seed data with owner's real projects |
| `data/tasks.json` | ✅ | Seed task data |
| `lib/api.ts` | ✅ | Phase 1 returns local JSON; Phase 3+ uses fetch |

### What is NOT built yet
- FastAPI backend in `/backend/` (Phase 2)
- Real auth / login system
- CRUD wiring for tasks and projects
- Real AI chat requests
- Real `context.md` loading/saving
- Published notes system

---

## ARCHITECTURE

```
portfolio/                    ← Next.js app (Vercel)
├── app/                      ← All pages (App Router)
│   ├── layout.tsx            ← Root layout (Navbar + Footer)
│   ├── page.tsx              ← Home
│   ├── projects/             ← Main projects page (search + filter)
│   │   └── [id]/page.tsx     ← Project detail page
│   ├── ai/                   ← ML/Vision filtered view
│   ├── games/                ← Games filtered view
│   ├── cad/                  ← CAD placeholder
│   ├── backend-tools/        ← Backend/Tools filtered view
│   ├── notes/                ← Notes placeholder
│   ├── contact/              ← Contact page
│   └── dashboard/            ← PRIVATE prototype surface
│       ├── layout.tsx        ← Wrapper for dashboard routes
│       ├── login/page.tsx    ← Static password form placeholder
│       ├── page.tsx          ← Dashboard home (today's tasks)
│       ├── tasks/page.tsx    ← Task manager prototype
│       ├── roadmap/page.tsx  ← 2026 roadmap (May–December)
│       ├── projects/page.tsx ← Project manager prototype
│       ├── context/page.tsx  ← context.md editor prototype
│       └── ai/page.tsx       ← AI panel prototype
├── components/
│   ├── Navbar.tsx
│   ├── ProjectCard.tsx       ← Also exports `Project` type
│   └── Footer.tsx
├── data/
│   ├── projects.json         ← Phase 1 seed data (frontend reads this)
│   └── tasks.json            ← Phase 1 seed data
└── lib/
    └── api.ts                ← All API calls. Phase 1: returns local JSON.
                                 Phase 3+: fetches from FastAPI.

backend/                      ← FastAPI (Railway) — BUILD IN PHASE 2
├── main.py
├── data/
│   ├── projects.json         ← Live data (backend owns this file)
│   ├── tasks.json
│   └── context.md
├── requirements.txt
└── .env                      ← DASHBOARD_PASSWORD, AI_API_KEY
```

---

## TECH STACK

| Layer | Tech | Host |
|-------|------|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Vercel |
| Backend | FastAPI + Python | Railway |
| Storage (Phase 1) | JSON files (local, served by Next.js) | Local |
| Storage (Phase 3+) | JSON files on Railway server | Railway |
| Storage (Later) | Supabase (Postgres) — drop-in swap of data layer | Supabase |
| AI | Provider-agnostic (OpenAI / Gemini / Groq via env var) | — |

---

## DATA SCHEMAS

### Project (in `data/projects.json`)
```json
{
  "id": "string (url-slug, e.g. mini-market)",
  "title": "string",
  "description": "string",
  "category": "ML / Vision | Games | CAD | Backend | Tools",
  "status": "finished | in progress | planned",
  "github": "string (URL or empty)",
  "demo": "string (URL or empty)",
  "image": "string (URL or empty — relative path or external URL)",
  "techs": ["string"]
}
```

### Task (in `data/tasks.json`)
```json
{
  "id": "string",
  "title": "string",
  "status": "idea | planned | in progress | done",
  "priority": "high | medium | low",
  "category": "Python | ML | Vision | CAD | Games | Backend",
  "month": "May | June | July | August | September | October | November | December",
  "notes": "string"
}
```

---

## DESIGN SYSTEM

- **Background**: `bg-zinc-950` (`#09090b`)
- **Cards**: `bg-zinc-900`
- **Accent**: `text-sky-400` / `bg-sky-500`
- **Body text**: `text-zinc-400`
- **Headings**: `text-white`
- **Borders**: `border-zinc-800`, hover: `hover:border-sky-500/40`
- **Status — finished**: emerald green
- **Status — in progress**: sky blue
- **Status — planned**: zinc gray

---

## NEXT PHASES TO BUILD

### Phase 2 — FastAPI Backend
Create `/backend/` folder with:
```
backend/
├── main.py           ← All routes (see API table below)
├── requirements.txt  ← fastapi, uvicorn, python-dotenv
├── data/
│   ├── projects.json ← Copy from portfolio/data/projects.json
│   ├── tasks.json    ← Copy from portfolio/data/tasks.json
│   └── context.md    ← See template below
└── .env              ← DASHBOARD_PASSWORD=yourpassword, PORT=8000
```

API routes to implement:
| Method | Route | Auth required |
|--------|-------|---------------|
| GET | `/projects` | No |
| POST | `/projects` | Yes |
| PUT | `/projects/{id}` | Yes |
| DELETE | `/projects/{id}` | Yes |
| GET | `/tasks` | Yes |
| POST | `/tasks` | Yes |
| PUT | `/tasks/{id}` | Yes |
| DELETE | `/tasks/{id}` | Yes |
| GET | `/context` | Yes |
| PUT | `/context` | Yes |
| POST | `/auth/login` | No (it IS the auth) |
| POST | `/ai/chat` | Yes |

Auth strategy:
- `POST /auth/login` receives `{ "password": "..." }`, checks against env var `DASHBOARD_PASSWORD`
- If match, returns `{ "token": "<sha256(password)>" }`
- All protected routes check `Authorization: Bearer <token>` header
- Token stored as `httpOnly` cookie in Next.js via a route handler

### Phase 3 — Connect Frontend to Backend
1. Add `NEXT_PUBLIC_API_URL=https://your-backend.railway.app` to Vercel env vars
2. In `lib/api.ts`: in `getProjects()` and `getTasks()`, delete the local return and uncomment the fetch block
3. Test: `npm run build` should succeed

### Phase 4 — Dashboard Pages
Build these pages in `app/dashboard/`:
- `layout.tsx`: check cookie `token` → redirect to `/dashboard/login` if missing
- `login/page.tsx`: password input → POST to `/auth/login` → store cookie
- `page.tsx`: today's tasks (status !== "done"), quick-add task
- `tasks/page.tsx`: full task manager (CRUD)
- `roadmap/page.tsx`: tasks grouped by month, May–December 2026
- `projects/page.tsx`: project manager form (add/edit/delete → calls API)

### Phase 5 — AI Chat
- `ai/page.tsx` in dashboard: chat UI
- Backend `POST /ai/chat` loads `tasks.json` + `context.md` as system prompt
- Suggested prompts: "Break this into tasks", "What should I do next?", "Improve my roadmap"

---

## OWNER CONTEXT (About the person whose portfolio this is)

- **Interests**: Robotics, AI/ML, coding, game development, CAD/3D design
- **Current projects**: Mini Market Simulation, Blob Game (in progress); Dodge Master, KartBlitz (finished); YOLO Detector (finished); AI Hub (in progress)
- **2026 goal**: Build and document all projects, learn FastAPI + React + system design, deploy everything
- **Learning**: Python (advanced), beginning TypeScript/Next.js, Fusion 360 CAD
- **Constraint**: School laptop — cannot always run scripts. Prefer creating files manually when blocked.
- **Deployment**: Vercel (frontend), Railway (backend). No experience yet — needs step-by-step.

---

## THINGS TO PERSONALIZE (still placeholder values)

These need to be updated with real info:
1. `app/layout.tsx` — replace `"YourName"` in metadata title
2. `app/page.tsx` — replace `YourName` in the hero section
3. `components/Navbar.tsx` — replace `YourName` in the logo
4. `components/Footer.tsx` — replace GitHub URL and email
5. `app/contact/page.tsx` — replace GitHub URL and email
6. `data/projects.json` — replace all GitHub URLs with real repo links, add real images
7. `data/tasks.json` — replace with your actual current tasks

---

## DEPLOYMENT CHECKLIST (Vercel)

1. `git init` in `C:\Users\663208\portfolio`
2. `git add .` and `git commit -m "initial commit"`
3. Push to a GitHub repo (github.com → New repo → push)
4. Go to vercel.com → Import Git Repository → select the repo
5. Framework: Next.js (auto-detected)
6. Root directory: leave empty (it's the repo root)
7. Click Deploy
8. Once deployed, add env var `NEXT_PUBLIC_API_URL` (leave empty for now, fill in Phase 3)

---

## context.md TEMPLATE (create this as `/backend/data/context.md` in Phase 2)

```
# My Context File

## Goals
- Build a complete personal operating system by end of 2026
- Learn full-stack: Python backend, TypeScript frontend, APIs, AI integration
- Document every project properly

## Current Focus
- Finishing Mini Market Simulation and Blob Game
- Learning Next.js and TypeScript basics
- Setting up portfolio infrastructure

## Active Projects
- Mini Market Simulation (Games, Python/Pygame) — in progress
- Blob Game (Games, Python/Pygame) — in progress
- AI Hub (Backend, FastAPI/React) — in progress

## Roadmap Rules
- May–June: finish in-progress games, deploy portfolio
- July–August: build FastAPI backend, connect frontend
- September–October: dashboard + task system
- November–December: AI chat integration

## Constraints
- School laptop: cannot always run npm/scripts
- Limited time: ~2–3 hours per day on weekdays
```

---

## IMPORTANT NOTES FOR NEXT AI

1. **Do NOT break the `Project` type export** in `components/ProjectCard.tsx` — it is imported by `lib/api.ts`, `app/page.tsx`, `app/projects/page.tsx`, and all category pages.

2. **`app/projects/page.tsx` is a client component** (`"use client"`) because it uses `useState` for filters. The other category pages are server components and import directly from JSON.

3. **`lib/api.ts` has commented-out fetch blocks** — these are Phase 3 upgrade points. Do not delete the comments.

4. **Category values in `projects.json` must exactly match** the strings used in filter buttons: `"ML / Vision"`, `"Games"`, `"CAD"`, `"Backend"`, `"Tools"`.

5. **The Footer has a hidden `⚙` link** to `/dashboard` — intentionally dark (`text-zinc-800`) so visitors don't notice it.

6. **The backend folder does not exist yet.** When building Phase 2, create `/backend/` as a sibling to the `portfolio/` folder (or as a separate repo).
