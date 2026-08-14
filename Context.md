# FULL INSTRUCTIONS: Portfolio System Setup & Deployment

> **Last Updated**: August 14, 2026  
> **Status**: Live frontend on Vercel. Backend stays on the laptop, reached through ngrok + LocalAI (port 3000). **This project does not use Railway.**

Canonical run/deploy steps: `README.md` and `main.md`. This file still has older planning notes further down; ignore Railway / `NEXT_PUBLIC_API_URL` there.

---

## Table of Contents
1. [What This Code Does](#what-this-code-does)
2. [First-Time Local Setup](#first-time-local-setup)
3. [How to Use the App](#how-to-use-the-app)
4. [Getting an AI API Key](#getting-an-ai-api-key)
5. [Live Site: Vercel + ngrok + LocalAI](#live-site-vercel--ngrok--localai)
6. [Post-Deploy Testing](#post-deploy-testing)
7. [Personalization](#personalization)
8. [Troubleshooting](#troubleshooting)

---

## What This Code Does

This is a **personal operating system** portfolio website with both public and private sides:

### 🌐 Public Side (Anyone Can See)
- **Home page**: Your intro, interests, featured projects
- **Projects page**: All projects with search + category filters
- **Category pages**: AI/ML, Games, CAD, Backend/Tools
- **Project details**: Individual project pages with links
- **Contact**: Your GitHub, email, and links

### 🔒 Private Side (Password Protected)
- **Login**: `/dashboard/login` — requires password
- **Dashboard home**: Today's tasks, quick-add task, stats
- **Task Manager**: Create/edit/delete tasks with status tracking
- **Roadmap**: Monthly view of tasks (May–December 2026)
- **Project Manager**: Add/edit/delete projects via form
- **Context Editor**: Edit your planning brain file (context.md)
- **AI Panel**: Chat with backend AI to get planning suggestions

### 🧠 How Data Works
1. Backend stores everything in JSON files: projects, tasks, context.
2. Frontend calls backend through Next.js API proxy (secure httpOnly cookies).
3. When you add a project in the dashboard, it appears on the public portfolio instantly.
4. No manual HTML editing — everything is managed through forms.

---

## First-Time Local Setup

### Prerequisites
- **Node.js 18+** (get it from [nodejs.org](https://nodejs.org))
- **Python 3.10+** (get it from [python.org](https://www.python.org))
- **Git** (optional, for version control)

### Step 1: Install Frontend Dependencies
```bash
cd path/to/master-portfolio
npm install
```

This installs Next.js, React, TypeScript, Tailwind, and other packages.

### Step 2: Create Backend Environment File
Copy the example environment file:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` in your text editor and set:
```
DASHBOARD_PASSWORD=your-strong-password-here
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

**Tips:**
- Use a strong password (mix of uppercase, lowercase, numbers, symbols).
- This password is used to log into `/dashboard/login` locally.

### Step 3: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
cd ..
```

This installs FastAPI, Uvicorn, and other Python packages.

If this laptop shows `Access is denied` when running `pip` inside `backend/venv`, skip the venv and install with user Python:
```bash
cd backend
python -m pip install --user -r requirements.txt
cd ..
```

### Step 4: Start Backend (Terminal 1)
```bash
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Leave this running.

### Step 5: Two ways to run

**A — Live Vercel site (normal).** Do **not** run `npm run dev`. Start FastAPI (already running), then LocalAI on 3000, then `ngrok http 3000`. See [Live Site](#live-site-vercel--ngrok--localai).

**B — Local Next.js only.** From repo root: `npm run dev` and open http://localhost:3000. Set `.env.local` to `BACKEND_API_URL=http://127.0.0.1:8000` (no `/backend`). This uses port 3000, so you cannot run `LocalAI/server.js` at the same time.

---

## How to Use the App

### Public Portfolio Pages (No Login Required)
1. **Home**: http://localhost:3000
   - See your hero text, interests, featured projects
   
2. **All Projects**: http://localhost:3000/projects
   - Search projects by title/tech
   - Filter by category (All, ML / Vision, Games, CAD, Backend, Tools)
   
3. **Category Pages**:
   - AI/ML: http://localhost:3000/ai
   - Games: http://localhost:3000/games
   - CAD: http://localhost:3000/cad
   - Backend/Tools: http://localhost:3000/backend-tools
   
4. **Project Details**: http://localhost:3000/projects/project-id
   - Click any project card to see full details
   
5. **Contact**: http://localhost:3000/contact
   - Links to your GitHub and email

### Private Dashboard (Login Required)

#### Login
1. Go to **http://localhost:3000/dashboard/login**
2. Enter your `DASHBOARD_PASSWORD` from `backend/.env`
3. Click "Sign in"
4. You're redirected to `/dashboard` and see the overview

#### Dashboard Home
- **Today's focus**: Shows active tasks (not done)
- **Quick add task**: Create a task with title, category, priority, month
- **Stats**: Total tasks, projects, active builds

#### Task Manager (`/dashboard/tasks`)
- **Add task**: Form at top to create new task
- **Kanban board**: Four columns (idea, planned, in progress, done)
- **Move tasks**: Dropdown on each card to change status
- **Delete tasks**: Red "Delete" button to remove

#### Roadmap (`/dashboard/roadmap`)
- **Monthly view**: May–December 2026
- **Progress bars**: Shows % complete for each month
- **Task cards**: See all tasks grouped by month
- **Auto-update**: Changes instantly when you modify tasks

#### Project Manager (`/dashboard/projects`)
- **Add project form** (left side):
  - Title, description, category, status, GitHub link, demo link, tech stack
  - Click "Add project" to save
  
- **Projects table** (right side):
  - Lists all projects
  - Change status via dropdown
  - Delete projects with red button
  - Any changes appear on `/projects` and category pages instantly

#### Context Editor (`/dashboard/context`)
- **Textarea**: Edit your planning brain file
- **Save button**: Persists to backend `context.md`
- Used by AI panel for context when suggesting work

#### AI Panel (`/dashboard/ai`)
- **Suggested prompts**: Quick-start buttons (Break into tasks, What's next, etc.)
- **Chat**: Type messages in textarea
- **Send**: Get AI responses that reference your tasks/roadmap
- **Note**: Currently returns planning suggestions; if you wire a real LLM, it gives smarter responses

#### Logout
- Bottom left of dashboard: "Logout" button clears session and redirects to login

---

## Getting an AI API Key

### Why You Need This
The current AI endpoint in the dashboard returns static suggestions. If you want real LLM responses (OpenAI, Google Gemini, Groq), you need an API key.

### Option 1: OpenAI (ChatGPT)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Click **API keys** in left menu
4. Click **Create new secret key**
5. Copy the key (starts with `sk-`)
6. Save it if you use a cloud LLM; live AI chat currently uses LM Studio on port 1234.

**Cost**: Pay-as-you-go. ~$0.01–$0.05 per chat request depending on model.

### Option 2: Google Gemini
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click **Get API key**
3. Click **Create API key in new project**
4. Copy the key
5. Save it

**Cost**: Free tier available (60 requests/minute). Paid plans start at $0.075/1M tokens.

### Option 3: Groq (Fast & Free)
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up
3. Click **API keys**
4. Click **Create API Key**
5. Copy the key
6. Save it

**Cost**: Free (generous free tier). Fastest inference of all three.

### Store Your Key for Later
Save this somewhere safe if you switch off LM Studio. The live path today is LocalAI → LM Studio on `127.0.0.1:1234`.

---

## Live Site: Vercel + ngrok + LocalAI

This is the working production path. **No Railway.** You do **not** need `npm run dev` on the laptop for the live site.

**Browser → Vercel `/api/*` → `BACKEND_API_URL` (ngrok + `/backend`) → LocalAI Node :3000 → FastAPI :8000**

Live frontend: https://mathias-master-portfolio.vercel.app

### Vercel env vars

| Name | Value |
| --- | --- |
| `BACKEND_API_URL` | `https://prelude-divisible-untoasted.ngrok-free.dev/backend` (no trailing slash) |
| `NGROK_SKIP_BROWSER_WARNING` | `1` |

Use the exact host ngrok prints (`.dev` vs `.app` are different). Redeploy after changing env.

### Every session — four processes

**Terminal 1 — FastAPI**

```powershell
cd C:\Users\663208\Downloads\Master-Portfolio\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Confirm http://127.0.0.1:8000/ returns `{"status":"ok","service":"portfolio-backend"}`.

**Terminal 2 — LM Studio (AI chat only)**  
Start the local server on port 1234.

**Terminal 3 — Node proxy (required before ngrok)**

```powershell
cd C:\Users\663208\Downloads\Master-Portfolio\LocalAI
npm install
node server.js
```

- `/backend/*` → FastAPI 8000  
- `/v1/*` → LM Studio 1234  

Confirm http://127.0.0.1:3000/backend returns the same JSON.

**Terminal 4 — ngrok**

```powershell
ngrok http 3000
```

Tunnel **3000**, not 8000. Confirm https://prelude-divisible-untoasted.ngrok-free.dev/backend shows the FastAPI JSON.

`.next` is a local Next cache. Ignore it. Vercel builds its own.

---

## Post-Deploy Testing

### Test 1: Public Pages Load
1. Open your Vercel frontend URL (e.g., `https://your-portfolio-abc.vercel.app`)
2. Check home page loads
3. Visit `/projects`, `/ai`, `/games`, `/cad`, `/backend-tools`
4. All should show your projects

### Test 2: Dashboard Login Works
1. Go to `/dashboard/login`
2. Enter your `DASHBOARD_PASSWORD`
3. Click "Sign in"
4. Should redirect to `/dashboard`

### Test 3: Add a Project
1. In dashboard, go to `/dashboard/projects`
2. Fill in project form (title, description, etc.)
3. Click "Add project"
4. Refresh dashboard; project appears in table
5. Go to `/projects` on public site; new project appears

### Test 4: Add/Move Tasks
1. Go to `/dashboard/tasks`
2. Type a task title and click "Add task"
3. Task appears in "idea" column
4. Use status dropdown to move it to "planned", "in progress", "done"
5. Go to `/dashboard/roadmap`; task appears in correct month

### Test 5: Save Context
1. Go to `/dashboard/context`
2. Edit the markdown text
3. Click "Save"
4. You should see "Saved" message
5. Refresh page; text persists

### Test 6: AI Chat
1. Go to `/dashboard/ai`
2. Click a suggested prompt or type a message
3. Click "Send"
4. Backend responds with planning suggestions

---

## Personalization

### 1. Your Name (Replace "YourName")

**File**: `app/layout.tsx`
```typescript
// Find this line:
title: "YourName — Portfolio",

// Replace with:
title: "Your Real Name — Portfolio",
```

**File**: `app/page.tsx`
```typescript
// Find this line:
<h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight">
  YourName
</h1>

// Replace with:
<h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight">
  Your Real Name
</h1>
```

**File**: `components/Navbar.tsx`
```typescript
// Find this line:
YourName<span className="text-sky-400">.</span>

// Replace with:
Your Real Name<span className="text-sky-400">.</span>
```

### 2. Your Contact Info

**File**: `components/Footer.tsx`
```typescript
// Find and replace:
<a href="https://github.com/yourusername" ...>GitHub</a>
<a href="mailto:your@email.com" ...>Email</a>

// With your real GitHub URL and email:
<a href="https://github.com/your-username" ...>GitHub</a>
<a href="mailto:your.email@example.com" ...>Email</a>
```

**File**: `app/contact/page.tsx`
```typescript
// Find and replace contact links similarly
```

### 3. Your Projects

**File**: `data/projects.json`

Replace the placeholder projects with your real ones. Example:
```json
[
  {
    "id": "my-first-project",
    "title": "My First Real Project",
    "description": "What this project does and why it's cool",
    "category": "ML / Vision",
    "status": "finished",
    "github": "https://github.com/yourusername/my-project",
    "demo": "https://my-project-demo.com",
    "image": "https://link-to-image.jpg",
    "techs": ["Python", "TensorFlow", "OpenCV"]
  }
]
```

**Important**: Match category exactly to one of: `ML / Vision`, `Games`, `CAD`, `Backend`, `Tools`

### 4. Your Tasks

**File**: `data/tasks.json`

Replace with your actual tasks:
```json
[
  {
    "id": "1",
    "title": "Build my first AI model",
    "status": "in progress",
    "priority": "high",
    "category": "ML",
    "month": "May",
    "notes": "Using TensorFlow"
  }
]
```

---

## Troubleshooting

### pip fails in venv with Access is denied

- Symptom: `pip` works outside `backend/venv`, but fails when venv is activated.
- Temporary fix on this laptop: do not use `backend/venv` until permissions are repaired.
- Use user Python and run:

```bash
cd backend
deactivate
python -m pip install --user fastapi uvicorn pydantic
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

If `uvicorn` command is not recognized, continue using `python -m uvicorn ...`.

### ERR_NGROK_8012
ngrok is up; nothing is listening on localhost:3000. Start `node server.js` in `LocalAI`. FastAPI on 8000 alone is not enough.

### 502 / Cannot reach backend on the live site
Vercel cannot reach `BACKEND_API_URL`. Start FastAPI + Node proxy + ngrok. Confirm Vercel URL is the current ngrok host + `/backend` (no trailing slash). Health OK on port 8000 does not prove the live path.

### Dashboard login rejects password
**Solution**:
1. Double-check `DASHBOARD_PASSWORD` in `backend/.env`
2. Ensure no extra spaces before/after password
3. Restart FastAPI after changing

### New projects don't appear on public site
**Solution**:
1. Verify backend is saving to `backend/data/projects.json`
2. Refresh public site (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
3. Check browser console for errors (F12)

### Build fails on Vercel
**Solution**:
1. Check all environment variables are set
2. Review Vercel build logs (click "View Function Logs")
3. Ensure `BACKEND_API_URL` doesn't have trailing slash

### Tasks/Projects not persisting after refresh
**Solution**:
1. Check `backend/data/` exists and has JSON files
2. FastAPI must be running on this laptop (data lives here, not on Vercel)
3. Check backend error logs for write permission issues

### AI chat 502
LM Studio is not running on 1234, or LocalAI `/v1` proxy is down. Unrelated to FastAPI login.

---

## Next Steps (Optional Enhancements)

### 1. Add Real LLM Integration
Modify `backend/main.py` to call OpenAI, Gemini, or Groq instead of returning static responses.

### 2. Switch Storage to Database
Migrate from JSON files to Supabase PostgreSQL for durability and scalability.

### 3. Add Image Upload
Allow uploading project images instead of linking to external URLs.

### 4. Add Published Notes
Create a public `/notes` section that pulls from context.md or a notes database.

### 5. Add Analytics
Track portfolio views and dashboard usage with simple analytics.

---

## Support & Resources

- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **ngrok Docs**: https://ngrok.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Summary Checklist

- [ ] FastAPI runs on http://127.0.0.1:8000
- [ ] LocalAI `node server.js` runs on port 3000
- [ ] `ngrok http 3000` is up
- [ ] Vercel `BACKEND_API_URL` is ngrok HTTPS host + `/backend`
- [ ] Vercel `NGROK_SKIP_BROWSER_WARNING` is `1`
- [ ] Live site login and dashboard work
- [ ] Can add/edit/delete projects and tasks
- [ ] Personalization complete (name, contact, projects)

Once all items are checked, your portfolio is live!

---

**Questions or stuck?** Re-read the section for your step or check Troubleshooting.

Good luck! 🚀



The archive below is historical planning text. **Deploy/Railway sections in it are obsolete.** Use `README.md` / `main.md` for how the live site actually runs.

This is the old context files of my project: # READ THIS — Context File for Next AI
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

backend/                      ← FastAPI on laptop :8000 (reached via LocalAI /backend + ngrok)
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
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS | Vercel |
| Proxy | LocalAI Express (`server.js`) | Laptop :3000, ngrok tunnel |
| Backend | FastAPI + Python | Laptop :8000 (private) |
| Storage | JSON files in `backend/data/` | This laptop |
| AI chat | LM Studio (OpenAI-compatible) | Laptop :1234 |

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

### Phase 3 — Connect Frontend to Backend (done)
Vercel `BACKEND_API_URL` = ngrok HTTPS host + `/backend`. Next `/app/api/*` proxies to FastAPI through LocalAI. Do not use `NEXT_PUBLIC_API_URL` or Railway.

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
- **Deployment**: Vercel frontend + laptop FastAPI via LocalAI (port 3000) and ngrok. No Railway.

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

## DEPLOYMENT CHECKLIST (current)

1. Frontend already on Vercel: https://mathias-master-portfolio.vercel.app
2. Set `BACKEND_API_URL` = `https://<ngrok-host>/backend` and `NGROK_SKIP_BROWSER_WARNING` = `1`
3. Each session: FastAPI :8000, `node server.js` :3000, `ngrok http 3000`
4. Do not use Railway. Do not point Vercel at `127.0.0.1`.

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

My full process plan is to 

Use AI to build your full portfolio system (public pages + private dashboard + AI + tasks + project manager)

Add your current projects + move your to-do list and roadmap into the system

Start following your 2026 plan and build new projects while updating everything inside the portfolio system

Right now in this stage i am doing using ai to build my portfolio

This is what my portfolio should include 

🧠 YOUR PORTFOLIO = “PERSONAL OPERATING SYSTEM”
Think of this as:

One website that stores everything you’ve ever built + everything you plan to build

Not just a portfolio — a control center

🏗️ CORE STRUCTURE
🌐 1. PUBLIC SIDE (what people see)
Pages:
🏠 Home
short intro (who you are)

what you’re interested in (robotics, AI, coding)

featured projects (top 3–5)

quick links

📁 Projects (MAIN PAGE)
This is the most important page.

Features:
project cards

filters:

ML / Vision

Games

CAD

Backend

Tools

search bar

Each project card:

title

description

tech used

status (finished / in progress)

image or GIF

link to GitHub

link to demo

🧠 AI / Machine Learning
all your:

YOLO projects

classifiers

segmentation

future ML work

🎮 Games
mini market simulation

dodge master

kartblitz

blob game

Each should have:

screenshot

play/demo link

short explanation

🧱 CAD / 3D Design
Fusion 360 designs

renders

STL downloads (later)

⚙️ Backend / Tools
AI hub

APIs

utilities

systems you build

📝 Notes / Learning
(optional but powerful)

what you learned

short writeups

experiments

📬 Contact
email / links

🔒 2. PRIVATE SIDE (YOUR SYSTEM)
Route:

/dashboard
This is YOUR space only.

📊 Dashboard (main page)
Shows:

today’s tasks

current focus

progress

quick add task

✅ Task Manager
Features:

create/edit/delete tasks

status:

idea

planned

in progress

done

priority

category:

Python

ML

Vision

CAD

Games

Backend

🗺️ Roadmap Page
Your 2026 roadmap:

May → December

tasks per month

progress tracking

🤖 AI Chat Panel
This is powerful.

You can say:

“break this into tasks”

“improve my roadmap”

“what should I do next”

“organize my projects”

AI should:

read your tasks

read roadmap

read context.md

suggest edits

📄 context.md Editor
This is your brain file

Contains:

your goals

your interests

your current projects

your roadmap rules

Editable inside the website.

📁 Project Manager (IMPORTANT)
Instead of editing HTML manually:

You add projects through a form:

title

description

category

GitHub link

image

status

👉 This automatically updates your portfolio

🔧 HOW EDITING WORKS (NO HTML EDITING)
You will NOT:

manually write HTML for every project

Instead:

You build:
“Admin System”
Form → saves data → renders UI

Example flow:
You:

go to /dashboard/projects

click “Add Project”

fill form

System:

saves to JSON or database

updates frontend automatically

🧠 DATA STRUCTURE
Start simple:

projects.json
[
  {
    "title": "Mini Market Simulation",
    "category": "Games",
    "status": "in progress",
    "github": "...",
    "description": "...",
    "image": "..."
  }
]
tasks.json
[
  {
    "title": "Finish Python basics",
    "status": "in progress",
    "priority": "high"
  }
]
context.md
Plain text file:

your goals

roadmap

ideas

constraints

⚙️ TECH STACK (FINAL)
Frontend
Next.js (Vercel)

Backend
FastAPI

Storage
JSON → later database

AI
API call via backend

🔐 SECURITY (keep it simple)
For now:

/dashboard protected by:

password OR

simple token

Later upgrade if needed.

🚀 BUILD ORDER (CRITICAL)
Phase 1 (Week 1–2)
frontend pages (static)

deploy on Vercel

Phase 2
backend (FastAPI)

simple API endpoints

Phase 3
connect frontend ↔ backend

Phase 4
task system

project manager

Phase 5
AI chat

context.md integration

🔥 FINAL RESULT (END OF 2026)
You will have:

Public:
clean portfolio

all projects organized

easy to explore

Private:
full task system

roadmap manager

AI assistant

project manager

Skills gained:
frontend

backend

APIs

AI integration

system design

real software engineering thinking

🧭 MOST IMPORTANT RULE
This is NOT just a website.

This is:

The system that runs your entire learning journey


This is a bit more context

# 🧠 USER CONTEXT — MASTER FILE (2026)

## 👤 About Me
- Student (Year 8 in 2026)
- Interested in:
  - Robotics engineering
  - AI / Machine Learning
  - Software development
  - CAD / 3D design
- I like both:
  - building real systems
  - experimenting with ideas

---

## 🎯 Main Goals (2026)

1. Learn Python properly (reduce reliance on AI)
2. Understand machine learning beyond just object detection
3. Improve computer vision (counting, tracking, real systems)
4. Build a full portfolio website with all projects
5. Create an AI-powered task + roadmap system
6. Learn backend + API development
7. Improve CAD skills (Fusion 360)
8. Explore hardware, microcontrollers, and PCB
9. Organize all work into one clean system
10. Finish more projects instead of starting too many

---

## 🧭 Learning Priorities (ORDER)

1. Python fundamentals
2. Git + project structure
3. General machine learning
4. Computer vision (advanced)
5. Backend + APIs
6. Deep learning (PyTorch)
7. CAD (Fusion 360)
8. Hardware / PCB
9. Game development (secondary)
10. Monetization (last priority)

---

## ⚠️ Constraints / Weaknesses

- I rely too much on AI for coding
- I start many projects but don’t finish them
- My coding fundamentals are weak
- CAD is currently a weakness
- I sometimes lose structure and direction

---

## 💪 Strengths

- Strong interest in robotics + AI
- Experience with YOLO and vision projects
- Comfortable experimenting and trying ideas
- Have many project ideas already
- Willing to learn difficult concepts

---

## 🧠 Learning Style

- Learn best by building projects
- Prefer a mix of:
  - tutorials
  - hands-on work
- Need structure to stay consistent
- Need clear tasks to avoid getting lost

---

## 📆 Time Availability

- ~20 minutes to 2 hours per day (self work)
- FTC time is separate and NOT included
- This system is only for personal projects

---

## 🚫 Important Rules

- Do NOT include FTC tasks in plans
- Focus only on self-projects
- Do not overload with too many tasks
- Always prioritize finishing over starting new things
- Keep roadmap realistic but challenging

---

## 🧩 Current Projects

### 🤖 Vision / ML
- Visual Recognition Projects (main collection)
- Australian Bills Detection (unfinished)
- Weed / Plant Segmentation
- Rock Paper Scissors Detection
- Pothole Detection
- Human Detection Alarm

---

### 🎮 Games
- Mini Market Simulation (needs backend)
- Dodge Master
- KartBlitz (unfinished)
- Blob Game

---

### 🌐 Web / Tools
- Connections Web App
- AI Quiz Hub (unfinished)
- HTML Utility Hub (word counter etc.)
- Flashcard Maker
- Class Timer
- Popup Tool

---

### 🧪 Other
- F1 Machine Learning Model (paused)

---

## 🏗️ Portfolio System Goals

I am building a website that includes:

### Public:
- Portfolio (all projects)
- Categories:
  - ML / Vision
  - Games
  - CAD
  - Backend / Tools

### Private (/dashboard):
- Task manager
- Roadmap (2026)
- AI chat assistant
- context.md editor
- Project manager (no manual HTML editing)

---

## 🤖 AI Assistant Role

The AI should:
- Help plan tasks
- Break down projects
- Improve roadmap
- Suggest next steps
- Organize ideas
- Reduce clutter
- Help me stay consistent

The AI should NOT:
- Overcomplicate things
- Add unnecessary tasks
- Ignore my priorities
- Include FTC-related work

---

## 📌 Task System Structure

Tasks should include:
- title
- description
- category (Python, ML, Vision, CAD, Games, Backend)
- priority
- status:
  - idea
  - planned
  - in progress
  - done

---

## 🗺️ Roadmap Structure

Months:
- May → December 2026

Each month should:
- have clear focus
- include learning + building
- include at least one finished outcome

---

## 🧠 Project Philosophy

- Fewer, better projects > many unfinished ones
- Every project must have:
  - README
  - explanation
  - screenshots or demo
- Projects should connect to portfolio
- Projects should improve real skills

---

## 🎮 Game Development Rules

- Only work on ONE game at a time
- Improve existing games before starting new ones
- Use games to learn:
  - logic
  - UI
  - backend
- Do not let games take over main priorities

---

## 💰 Monetization (LOW PRIORITY)

- AI tools could be monetized later
- Not a focus in 2026
- Only consider after skills + portfolio are strong

---

## 🔄 How AI Should Use This File

When responding, the AI should:
- consider my goals
- consider my current skill level
- prioritize learning fundamentals
- avoid overwhelming me
- give structured, actionable steps

---

## 🧭 Current Focus (UPDATE THIS OFTEN)

(Currently working on:)
- [fill this in]

(Current main goal:)
- [fill this in]

(Current blockers:)
- [fill this in]

---
These are some of my road maps: 

🧭 2026 Roadmap 

 

 

🏗️ [May] Portfolio Shell & Python Foundations 

Title: 🏗️ [May] Portfolio Shell & Python Foundations 

Description: 

Learn: Python basics from scratch; Git basics (beyond pushing). 

Build: Master portfolio skeleton (Home, About, Projects, ML, CAD, Games). 

AI System: Set up context.md system for the AI assistant. 

Game: Choose 1 game (e.g., KartBlitz) to clean up and fix README. 

Due Date: May 31, 2026 

 

 

🐍 [June] Python Core & Utility Tools 

Title: 🐍 [June] Python Core & Utility Tools 

Description: 

Learn: Variables, loops, functions, lists/dicts, classes, and debugging. 

Build: 2 small Python tools from scratch (one utility, one mini-project). 

Game: Start a small prototype focused on a simple gameplay loop. 

Due Date: June 30, 2026 

 

 

🧹 [July] Git Workflow & Clean Code 

Title: 🧹 [July] Git Workflow & Clean Code 

Description: 

Learn: Branches, merges, commit habits, and virtual environments. 

Build: Reorganize old repos; split messy code into clear folders. 

Game: Rebuild a core mechanic of an existing game (e.g., Mini Market or Dodge Master) using better structure. 

Due Date: July 31, 2026 

 

 

📊 [August] General ML & Data Experiments 

Title: 📊 [August] General ML & Data Experiments 

Description: 

Learn: Train/test splits, regression, clustering, and evaluation metrics (Confusion Matrix). 

Build: One classification project and one regression project. 

Game: Add one specific functional feature to an existing game. 

Due Date: August 31, 2026 

 

 

👁️ [September] CV Depth & Object Tracking 

Title: 👁️ [Sept] CV Depth & Object Tracking 

Description: 

Learn: OpenCV basics, preprocessing, edge detection, and tracking logic. 

Build: Tracking/counting project (e.g., trash detection or bill counting) and upgrade an old YOLO repo. 

Game: Implement a visual UI feature (leaderboard or inventory). 

Due Date: September 30, 2026 

 

 

🧠 [October] Deep Learning & PyTorch 

Title: 🧠 [Oct] Deep Learning & PyTorch 

Description: 

Learn: Tensors, training loops, loss functions, and neural network structure. 

Build: One small PyTorch project; experiment with training setups. 

Game: Focus on polish, performance, or a progression system. 

Due Date: October 31, 2026 

 

 

🛠️ [November] Backend & AI API Hub 

Title: 🛠️ [Nov] Backend & AI API Hub 

Description: 

Learn: APIs, Request/Response flow, and simple databases. 

Build: Student Hub backend; AI project assistant that reads context.md. 

Game: Final polish of a single game or pause to finish the Hub. 

Due Date: November 30, 2026 

 

 

📐 [December] CAD, Hardware & Portfolio Completion 

Title: 📐 [Dec] CAD, Hardware & Portfolio Completion 

Description: 

Learn: Fusion 360 (sketching, assemblies, tolerances) and microcontrollers. 

Build: One useful 3D printable part and a hardware-inspired concept. 

Portfolio: Add demo videos/images to all repos; final website review. 

Due Date: December 31, 2026 

 

 

🔄 2026 Maintenance Checklist (Recurring) 

Title: 🔄 Monthly Check-In 

Description: 

Did I finish 1 learning milestone? 

Did I finish 1 project feature? 

Did I polish 1 repo? 

Are there only 3 active things on my plate? (Move rest to backlog). 

Due Date: Last day of every month 

 

 

If you want, I can next: 

turn this into a Notion AI database version (way more powerful than Google Tasks) 

or convert it into a weekly FTC + ML schedule so it’s actually executable day-by-day 

 This is a solid framework, but "learn Python" is a bit like saying "learn to cook"—it’s too broad to execute daily. To make Document 2 truly actionable for OneNote, we need to break these down into "Day 1–7" style sprints with specific project names and technical requirements. 

Here is the upgraded, hyper-specific version of your detailed task plan. 

 
 

🎯 DOCUMENT 2: THE 2026 MASTER EXECUTION PLAN 

🔵 MAY — “THE ARCHITECT” (System Building) 

Main Goal: Build the "Command Center" where all future work will live. 

🛠 Build Tasks 

Portfolio Website (The Shell): 

Setup a clean folder structure: /assets, /css, /js, /projects. 

Page 1: A "Terminal-style" landing page showing your current "System Status" (e.g., Current Project: KartBlitz). 

Page 2: A dedicated "Hardware Lab" section for 3D prints and robotics. 

AI Task Hub (The Core): 

Frontend: Simple HTML input fields for "Task Name," "Priority," and "Category." 

Storage: Use localStorage so your tasks stay there even if you refresh. 

Logic: A "Filter" button to see only "Robotics" or "Coding" tasks. 

🧠 Learning Sprint 

Week 1: HTML Boilerplate + Flexbox for layout. 

Week 2: JavaScript fetch() basics (for later API use). 

Week 3: CSS Variables (to easily switch between "Dark Mode" and "Racing Mode"). 

 
 

🟢 JUNE — “THE LOGICIAN” (Python Core) 

Main Goal: Stop "Vibe-Coding" and start architecting. 

🛠 Build Tasks (Choose 2) 

F1 Telemetry Parser: A CLI tool where you input a lap time or sector data, and it calculates the % difference to a "Target Lap." 

PC Part Inventory: A script that reads a .json file of your current hardware and prints a "Compatibility Report." 

Study Timer: A Pomodoro timer that logs your focus sessions to a .txt file automatically. 

🧠 Specific Skills 

Handling Dictionariies and Lists (crucial for ML later). 

Error Handling: Using try/except so your code doesn't crash when you type something wrong. 

 
 

🟡 JULY — “THE CLEANER” (Git & Polish) 

Main Goal: Make your code look like a professional wrote it. 

🛠 Build Tasks 

The "Grand Cleanup": 

Take KartBlitz (or a similar JS project) and move all the physics logic into a separate physics.js file. 

Create a proper README.md with: "How to Run," "Controls," and "Known Issues." 

Git Workflow: 

Start using Branches. Never code on the main branch. Create a feature-ui branch, finish it, and then merge. 

 
 

🟠 AUGUST — “THE ANALYST” (Non-Vision ML) 

Main Goal: Predicting numbers and categories. 

🛠 Build Tasks 

Project "Podium Predictor": Use a CSV of race data to predict if a driver will finish in the Top 10 based on grid position and tire choice. 

Benchmark Classifier: A model that takes GPU specs (VRAM, Clock Speed) and predicts if it's "Entry," "Mid," or "High" tier. 

🧠 Learning 

Scikit-Learn: Learn train_test_split. 

Metrics: Understand why Accuracy isn't everything (Precision vs. Recall). 

 
 

🔴 SEPTEMBER — “THE OBSERVER” (OpenCV Upgrade) 

Main Goal: Moving beyond just "training" a YOLO model to actually using the data. 

🛠 Build Tasks 

OpenCV Filters: Build a script that detects a specific color (like "Racing Red") and draws a bounding box around it in real-time. 

The Tracking Layer: 

Upgrade a YOLO script to include a Counter. If an object crosses a specific y-coordinate on the screen, increment a variable. 

Example: Count how many times a ball passes through a hoop or a car passes a line. 

 
 

🟣 OCTOBER — “THE NEURAL NET” (Deep Learning) 

Main Goal: Understanding the "Brain" of the AI. 

🛠 Build Tasks 

Handwritten Digit Recognizer: The "Hello World" of Deep Learning using MNIST. 

PyTorch Tensors: Rewrite a simple math calculation using only Tensors. 

Hyperparameter Tuning: Run the same model 3 times with different "Learning Rates" and graph the results. 

 
 

🔵 NOVEMBER — “THE INTEGRATOR” (Backend) 

Main Goal: Connecting your AI Hub to a real "Brain." 

🛠 Build Tasks 

The FastAPI Server: 

Build a local API that your Portfolio can "talk" to. 

Create a /tasks endpoint that lets you add tasks from your website and saves them to a permanent database (SQLite). 

Context.md Integration: 

Write a script that reads your context.md (which summarizes your progress) and sends it to an LLM API to get a "Weekly Goal" generated for you. 

 
 

⚫ DECEMBER — “THE ENGINEER” (CAD & Hardware) 

Main Goal: Physical manifestation of your code. 

🛠 Build Tasks 

The Speaker Project: * Design the Hex-Shell in Fusion 360. 

Constraint: Ensure the internal volume matches the speaker driver specs for better bass. 

Laser Cutting: Design the flat-panel housing. Use "Finger Joints" to snap the wood/acrylic together without complex curves. 

PCB/Microcontroller: 

Wire up an ESP32 or Arduino to control the speaker's volume or RGB lighting via code you wrote in June. 

 
 

🛑 THE "ONE-IN, ONE-OUT" RULE 

Before adding a new feature to Document 2, you must mark one task in the current month as DONE. 

Next Step? 

I can give you the exact file structure for your May Portfolio project, or we can write the first 10 lines of Python for your June CLI tool. Which one should we tackle first? 

 Read memory

Let me ask a few quick questions before I finalize the plan. 

Analyzing your answers...

Here is your full plan:

---

## Plan: Personal Operating System — Portfolio + Dashboard

**TL;DR:** Build a Next.js public portfolio + private `/dashboard` backed by a FastAPI server. Data lives in JSON files on the server. The admin system (project/task forms) writes to those files, so you never touch HTML again. AI chat is designed now and wired in Phase 5. Deployed: Next.js on Vercel, FastAPI on Railway.

---

### Phase 1 — Frontend Skeleton (Week 1–2)

**Goal:** All public pages exist as static UI. No backend needed yet. Deploy to Vercel.

1. Scaffold Next.js 14 app with App Router: `npx create-next-app@latest portfolio --typescript --tailwind --app`
2. Create the global layout (`app/layout.tsx`) — navbar with links: Home, Projects, AI/ML, Games, CAD, Backend, Notes, Contact
3. Build **Home page** (`app/page.tsx`) — intro section, interests, featured projects (hardcoded for now), quick links
4. Build **Projects page** (`app/projects/page.tsx`) — project cards grid, filter buttons (ML/Vision, Games, CAD, Backend, Tools), search bar — all driven by a local `data/projects.json` file read at build time
5. Build **AI/ML page** (`app/ai/page.tsx`) — filtered view of projects where `category === "ML"`, same card component
6. Build **Games page** (`app/games/page.tsx`) — same filtered view, screenshot + play link emphasis
7. Build **CAD page** (`app/cad/page.tsx`) — gallery layout, render images, placeholder STL download
8. Build **Backend/Tools page** (`app/backend/page.tsx`) — filtered view
9. Build **Notes page** (`app/notes/page.tsx`) — simple list of markdown files read from `data/notes/`
10. Build **Contact page** (`app/contact/page.tsx`) — email, GitHub, LinkedIn links
11. Create `data/projects.json` and `data/tasks.json` with your real data (use the schema below)
12. Deploy to Vercel — connect GitHub repo, set root as project folder

*All filter/search logic runs client-side in Phase 1. No API calls yet.*

---

### Phase 2 — FastAPI Backend (parallel with Phase 1 tail)

**Goal:** A working REST API that reads/writes JSON files. Runs locally and on Railway.

13. Create `/backend` folder: `fastapi`, `uvicorn`, `python-dotenv` in `requirements.txt`
14. Create `main.py` with these endpoints:

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/projects` | return all projects |
| POST | `/projects` | add project |
| PUT | `/projects/{id}` | edit project |
| DELETE | `/projects/{id}` | delete project |
| GET | `/tasks` | return all tasks |
| POST | `/tasks` | add task |
| PUT | `/tasks/{id}` | edit/update task |
| DELETE | `/tasks/{id}` | delete task |
| GET | `/context` | return context.md text |
| PUT | `/context` | save new context.md text |
| POST | `/auth/login` | check password, return session token |
| POST | `/ai/chat` | proxy AI request (Phase 5) |

15. Auth middleware: every mutating route (`POST/PUT/DELETE`) checks `Authorization: Bearer <token>` header. Token = SHA-256 hash of password stored in `.env` as `DASHBOARD_PASSWORD`. No user database needed.
16. JSON read/write: simple helper `load_json(path)` / `save_json(path, data)` — data stored in `/backend/data/projects.json` and `/backend/data/tasks.json`
17. CORS: allow only your Vercel domain + localhost
18. Deploy to Railway: connect GitHub, set start command `uvicorn main:app --host 0.0.0.0 --port $PORT`, add `DASHBOARD_PASSWORD` env var

---

### Phase 3 — Connect Frontend ↔ Backend

**Goal:** Public portfolio now reads live data from API. Filter/search still client-side.

19. Add `NEXT_PUBLIC_API_URL` env var in Vercel pointing to your Railway URL
20. Update `app/projects/page.tsx` to `fetch()` from `/projects` at request time (`async` server component)
21. Same for AI/ML, Games, CAD, Backend pages — they all call the same endpoint and filter by `category`
22. Add a `lib/api.ts` client helper that wraps `fetch` and attaches the auth token for dashboard calls

---

### Phase 4 — Private Dashboard

**Goal:** Full task manager, roadmap, and project manager at `/dashboard`. Protected by password.

24. Create `app/dashboard/layout.tsx` — checks for auth cookie; if missing, redirects to `/dashboard/login`
25. **Login page** (`app/dashboard/login/page.tsx`) — password form → `POST /auth/login` → store token in `httpOnly` cookie via Next.js route handler
26. **Dashboard home** (`app/dashboard/page.tsx`) — today's tasks (filter `status !== "done"`), current focus, quick-add task form
27. **Task Manager** (`app/dashboard/tasks/page.tsx`):
    - List all tasks with status badges
    - Inline status change (idea → planned → in progress → done)
    - Priority indicator (high/medium/low)
    - Category filter (Python, ML, Vision, CAD, Games, Backend)
    - Add/edit/delete via API calls to `/tasks`
28. **Roadmap page** (`app/dashboard/roadmap/page.tsx`):
    - Month columns: May → December 2026
    - Tasks grouped by `month` field
    - Progress bar per month (done / total)
    - Drag task to different month (optional — can skip to Phase 5)
29. **Project Manager** (`app/dashboard/projects/page.tsx`):
    - List all projects
    - "Add Project" button → form modal: title, description, category (dropdown), GitHub link, demo link, image URL, status
    - Edit/delete existing projects
    - All changes hit the API → JSON file updates → public portfolio reflects changes immediately
30. **context.md Editor** (`app/dashboard/context/page.tsx`):
    - Textarea loaded from `GET /context`
    - Save button → `PUT /context`
    - Show last-saved timestamp

---

### Phase 5 — AI Chat Panel

**Goal:** AI reads your tasks + context.md and gives suggestions. Provider-agnostic by design.

31. Add AI provider config to `.env`: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`
32. `POST /ai/chat` endpoint in FastAPI:
    - Loads `tasks.json` + `context.md` as system context
    - Sends user message + context to AI provider
    - Returns assistant reply
    - Provider is swappable (OpenAI / Gemini / Groq) via env var — implement an adapter pattern
33. **AI Chat Panel** (`app/dashboard/ai/page.tsx`):
    - Chat UI: message history, input box, send button
    - Suggested prompts: "Break this into tasks", "Improve my roadmap", "What should I do next", "Organize my projects"
    - Responses can include structured task suggestions (JSON block) that you can one-click add to tasks

---

### Data Schemas

**`projects.json` item:**
```
id, title, description, category, status, github, demo, image, techs[]
```

**`tasks.json` item:**
```
id, title, status, priority, category, month, notes
```

---

### Relevant Files

- `portfolio/app/` — all Next.js pages
- `portfolio/lib/api.ts` — auth-aware fetch wrapper for dashboard
- `portfolio/data/projects.json` — initial seed data (Phase 1)
- `backend/main.py` — all FastAPI routes
- `backend/data/projects.json` — live data (backend owns this)
- `backend/.env` — `DASHBOARD_PASSWORD`, `AI_API_KEY`
- `backend/requirements.txt` — `fastapi`, `uvicorn`, `python-dotenv`

---

### Verification

1. Phase 1: `npm run dev` → all 8 public pages load, project cards render from local JSON, filters work
2. Phase 2: `uvicorn main:app --reload` → test all endpoints with Postman or `curl`; unauthenticated `POST /projects` returns 401
3. Phase 3: Deploy preview on Vercel → projects page shows data from Railway API
4. Phase 4: Visit `/dashboard` without login → redirected to `/dashboard/login`; after login → add a project → visit public `/projects` → new project appears
5. Phase 5: Send "What should I do next?" in AI panel → response references actual tasks from `tasks.json`

---

### Decisions

- **Auth:** Hardcoded password in `.env`, token = hashed password, stored in `httpOnly` cookie — no user DB needed
- **Storage:** JSON files for all phases described; migration to Supabase/SQLite is a drop-in swap of the FastAPI data layer only
- **AI provider:** Abstracted behind `/ai/chat` — wire in whichever provider you pick later by changing env vars
- **No HTML editing:** All project/task changes go through forms → API → JSON. The frontend always reads from the API.
- **Out of scope for now:** STL file uploads, multi-user auth, markdown-rendered notes editor (plain textarea is fine to start)

---

**Ready to start with Phase 1?** Switch to Agent mode and it will scaffold the Next.js project and build all 8 public pages.


Master Portfolio & Personal Operating System (OS) SpecificationLast Updated: April 27, 2026  Status: Production-Ready Blueprint  Target Audience: GitHub Copilot / Next AI Agent & Project Owner  Core Vision: A unified, form-driven control center that eliminates manual HTML editing.  Table of ContentsUser Profile & 2026 Learning StrategySystem Architecture & Core DesignData Schemas2026 Master Execution RoadmapLocal Development SetupCloud Deployment GuidePost-Deploy Testing & Troubleshooting1. User Profile & 2026 Learning Strategy👤 Profile OverviewAcademic Level: Year 8 Student in 2026.  Core Core Interests: Robotics engineering, AI/Machine Learning, full-stack software development, and Fusion 360 CAD design.  Philosophy: Prioritize building real systems, completing existing initiatives, and reducing over-reliance on AI by mastering core programming fundamentals.  🚫 Strict Operational RulesNo FTC Tasks: This workspace is exclusively dedicated to personal projects; FIRST Tech Challenge work must remain completely separate.  One Game at a Time: Limit game development to a single active title to prevent project abandonment.  The One-In, One-Out Rule: Before introducing a new feature or project to the roadmap, at least one current task must be fully marked as completed.  2. System Architecture & Core DesignThe system acts as a Personal Operating System split into a public portfolio and a secure admin panel.  portfolio/                    ← Next.js Frontend (Deployed on Vercel)
├── app/                      
│   ├── layout.tsx            ← Root layout (Navbar + Footer)
│   ├── page.tsx              ← Home Page
│   ├── projects/             ← Main Gallery (Search & Filter)
│   │   └── [id]/page.tsx     ← Dynamic Project Detail Page
│   ├── ai/                   ← ML/Vision Filtered View
│   ├── games/                ← Games Filtered View
│   ├── cad/                  ← CAD Blueprint Gallery
│   ├── backend-tools/        ← System Tools Filtered View
│   ├── contact/              ← Contact Details Page
│   └── dashboard/            ← Secure Admin Shell
│       ├── login/page.tsx    ← Session Authentication Gate
│       ├── tasks/page.tsx    ← Kanban Task Interface
│       ├── roadmap/page.tsx  ← Dynamic 2026 Schedule
│       ├── projects/page.tsx ← Project Database Forms
│       └── context/page.tsx  ← context.md Direct Editor
└── lib/
    └── api.ts                ← Fetch wrapper (Swaps from local JSON to FastAPI)

backend/                      ← FastAPI Backend (Deployed on Railway)
├── main.py                   ← Routing, Middleware, & AI Proxies
├── requirements.txt          ← Python Dependencies
└── data/                     ← Persistent Flat-File JSON Storage
    ├── projects.json         
    ├── tasks.json            
    └── context.md            
⚙️ Technology Stack MappingFrontend Layer: Next.js 14 (App Router), TypeScript, Tailwind CSS, deployed via Vercel.  Backend Layer: FastAPI, Uvicorn, Python-dotenv, deployed via Railway.  Storage Engine: Local flat-file JSON storage (upgradable to Supabase PostgreSQL later).  AI Engine: Provider-agnostic API router supporting OpenAI, Google Gemini, and Groq.  🌐 Endpoints MatrixHTTP MethodRouteAuthentication RequiredFunctional PurposeGET/projectsNoFetches the public project portfolio data.  POST/projectsYesAppends a new project record to the database.  PUT/projects/{id}YesUpdates an existing project record.  DELETE/projects/{id}YesDeletes a project record from the database.  GET/tasksYesRetrieves user tasks for the admin Kanban board.  POST/tasksYesCreates a new development or learning task.  PUT/tasks/{id}YesModifies statuses, priorities, or months for a task.  DELETE/tasks/{id}YesPermanently removes a task.  GET/contextYesLoads the raw context.md file contents.  PUT/contextYesOverwrites and saves updates to context.md.  POST/auth/loginNoValidates passwords and issues secure session tokens.  POST/ai/chatYesInjects project context into LLM chats for advice.  3. Data Schemas📁 Projects Data Schema (projects.json)JSON{
  "id": "mini-market-simulation",
  "title": "Mini Market Simulation",
  "description": "An interactive Pygame environment modeling market operations.",
  "category": "Games",
  "status": "in progress",
  "github": "https://github.com/username/repo",
  "demo": "https://demo.com",
  "image": "/assets/market.gif",
  "techs": ["Python", "Pygame"]
}
⚠️ Constraint: The category string field must exactly match one of the predefined target values: ML / Vision, Games, CAD, Backend, or Tools.  📋 Tasks Data Schema (tasks.json)JSON{
  "id": "101",
  "title": "Master Python try/except blocks",
  "status": "in progress",
  "priority": "high",
  "category": "Python",
  "month": "June",
  "notes": "Essential for protecting CLI parsing routines from input runtime errors."
}
4. 2026 Master Execution Roadmap🏗️ May: Portfolio Shell & FoundationsLearning Sprint: Master HTML boilerplate code, CSS Flexbox layouts, and basic asynchronous JavaScript fetch() operations.  Build Targets: Scaffold the Next.js static layout, configure the context.md template, and build an input dashboard backed by local browser storage.  Project Review: Clean up codebase file structures and write a professional README.md for KartBlitz.  🐍 June: Python Core & Utility ToolsLearning Sprint: Deep-dive into structured data forms (dictionaries and nested lists), complex loop mechanics, and strict runtime error handling.  Build Targets: Code an F1 Telemetry CLI parser, a local PC Hardware Compatibility reporting tool, and an automated text-logged Pomodoro study timer.  Project Review: Transition active game development focus to solidifying single-game loop logic blocks.  🧹 July: Git Workflow & Code ArchitectureLearning Sprint: Establish standard branching mechanisms (feature-ui staging workflows), explicit split-directory patterns, and virtual environments.  Build Targets: Refactor old monolithic scripts into clean, multi-file modular codebases (e.g., separating game physics engines into isolated utility files).  Project Review: Audit and structure core code components for Mini Market Simulation and Dodge Master.  📊 August: Mathematical Machine LearningLearning Sprint: Study numerical data preparation methods, training vs. testing splits, data classification routines, regression mapping, and evaluation matrices.  Build Targets: Train an F1 race results podium predictor script alongside a GPU specification tier classifier.  Project Review: Integrate at least one highly functional standalone feature to an existing game project.  👁️ September: OpenCV & Object TrackingLearning Sprint: Understand raw image preprocessing matrices, custom edge-detection calculations, and sequential coordinate-tracking logic formulas.  Build Targets: Program a color-isolated real-time tracking script alongside a directional counting system for bounding boxes crossing specific coordinate lines.  Project Review: Re-engineer past YOLO object detection code repositories to process and use the captured metadata streams.  🧠 October: Deep Learning & PyTorchLearning Sprint: Understand internal neural network layouts, deep tensor math structures, explicit training loops, and loss convergence optimization functions.  Build Targets: Implement a handwritten digit classifier model from scratch utilizing the classic MNIST dataset.  Project Review: Optimize active execution loops for rendering performance and introduce a systematic player progression feature.  🛠️ November: Full-Stack Backend & AI IntegrationLearning Sprint: Learn client-server request/response communication flows, RESTful API endpoint configuration, and SQL query structures.  Build Targets: Write a production FastAPI server using persistent SQLite databases, and configure an internal AI context endpoint.  Project Review: Implement a backend ingestion routine that feeds context.md straight into an LLM API to output tailored developmental goals.  📐 December: CAD, Hardware, & DeploymentsLearning Sprint: Master parametric design rules, component tolerance assembly strategies, laser-cutting assembly joins, and microcontrollers.  Build Targets: Design and 3D print the tailored custom speaker enclosures (Alpha Bot / Hex-Shell Turtle), wiring up an internal ESP32 or Arduino system.  Project Review: Capture rich demo media for all active project milestones, run absolute compiler checks, and complete the comprehensive system deployment.  5. Local Development Setup📦 Step 1: Install Frontend DependenciesBashcd path/to/master-portfolio
npm install
ℹ️ Installs Next.js, React, TypeScript, Tailwind CSS, and all necessary node modules.  🔐 Step 2: Configure Backend Environment VariablesDuplicate the provided sample configuration file:  Bashcp backend/.env.example backend/.env
Open backend/.env in your text editor and specify your local values:  Ini, TOMLDASHBOARD_PASSWORD=your-strong-custom-password
PORT=8000
CORS_ORIGINS=http://localhost:3000
🐍 Step 3: Install Backend Python DependenciesBashcd backend
pip install -r requirements.txt
cd ..
💡 Windows Permissions Workaround: If your system triggers an Access is denied alert inside backend/venv, run the installation via the user space instead:  Bashpython -m pip install --user -r requirements.txt
🚀 Step 4: Boot Up Both EnvironmentsTerminal 1 (FastAPI Backend):  Bashcd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
Terminal 2 (Next.js Frontend):  Bashnpm run dev
Open your browser and navigate to http://localhost:3000.  6. Cloud Deployment Guide🚂 Part A: FastAPI Backend on RailwayPrepare Source Code: Initialize Git locally, commit your updates, and push the codebase to a new repository on GitHub.  Provision Resource: Create a new project workspace inside your Railway dashboard and select Deploy from GitHub repo.  Adjust Root Directory: Access your project settings tab and modify the Root Directory from / over to backend.  Configure Explicit Build & Start Directives:  Build Command: pip install -r requirements.txtStart Command: uvicorn main:app --host 0.0.0.0 --port $PORTSet Production Environment Variables: Under the variables view tab, configure your system parameters:  DASHBOARD_PASSWORD = your-secure-production-passwordPORT = 8000CORS_ORIGINS = [https://your-portfolio-abc.vercel.app](https://your-portfolio-abc.vercel.app),http://localhost:3000 (Update this value once your Vercel address is live)  AI_API_KEY = your-secret-api-key-string (Optional)  📐 Part B: Next.js Frontend on VercelLink Repository: Access your Vercel dashboard account, create a new project workspace, and import your portfolio GitHub repository.  Environment Variables Config: Under your Vercel project deployment wizard, insert the target environment parameters:  Key: BACKEND_API_URLValue: Your live Railway deployment domain (e.g., [https://backend-production.up.railway.app](https://backend-production.up.railway.app)).  Run Production Compilation: Click Deploy and let the automated compilation script finish building your web app.  Complete the CORS Connection Loop: Copy the newly created Vercel live production URL and append it into the CORS_ORIGINS variable inside your Railway settings view.  7. Post-Deploy Testing & Troubleshooting🧪 Verification Testing PlaybookTest 1 (Public View Availability): Navigate to your live production Vercel address and verify that the layout and the dynamic filters load cleanly without rendering faults.  Test 2 (Security Authentication Gate): Access /dashboard/login, supply your configured DASHBOARD_PASSWORD, and confirm that the system correctly saves authentication cookies and grants access to the admin interface.  Test 3 (Data Persistence Operations): Use the administrative project manager form to save a dummy project entry, then return to your public gallery to check that the newly created card renders instantly.  Test 4 (Roadmap Processing Engine): Create a task assigned to a target calendar month and verify that the timeline visualization updates its progress metrics automatically.  🛠️ Common Incidents & Solutions❌ Terminal output returns "Uvicorn command not recognized"Root Cause: The global system executable path has not resolved correctly.  Mitigation: Invoke the server instance directly via Python's module routing layer instead:  Bashpython -m uvicorn main:app --host 127.0.0.1 --port 8000
❌ The dashboard interface reports "Cannot connect to backend"Root Cause: Invalid CORS rules or misconfigured environment paths.  Mitigation: Check that your production Vercel BACKEND_API_URL points exactly to your active Railway link, and verify that there are no trailing forward slashes (/) appended to your variables.  ❌ The deployment engine crashes during compilation on VercelRoot Cause: Broken static imports or missing project environment variables.  Mitigation: Launch your local console and inspect the complete build step by executing npm run build locally; fix any discovered compiler layout exceptions before pushing updates to your GitHub branch.  