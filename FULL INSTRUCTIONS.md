# FULL INSTRUCTIONS: Portfolio System Setup & Deployment

> **Last Updated**: April 27, 2026  
> **Status**: Production-ready. Backend + Frontend fully wired with auth, CRUD, and AI integration.

---

## Table of Contents
1. [What This Code Does](#what-this-code-does)
2. [First-Time Local Setup](#first-time-local-setup)
3. [How to Use the App](#how-to-use-the-app)
4. [Getting an AI API Key](#getting-an-ai-api-key)
5. [Deploy Backend on Railway](#deploy-backend-on-railway)
6. [Deploy Frontend on Vercel](#deploy-frontend-on-vercel)
7. [Post-Deploy Testing](#post-deploy-testing)
8. [Personalization](#personalization)
9. [Troubleshooting](#troubleshooting)

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

### Step 4: Start Backend (Terminal 1)
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Leave this running.

### Step 5: Start Frontend (Terminal 2)
In a new terminal, from the project root:
```bash
npm run dev
```

You should see:
```
> Local:        http://localhost:3000
```

### Step 6: Open in Browser
Go to **http://localhost:3000** in your web browser. You should see your portfolio home page.

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
6. Save it (you'll need it during Railway setup)

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
Save this somewhere safe (e.g., a password manager or note app). You'll add it to Railway environment variables later.

---

## Deploy Backend on Railway

### Step 1: Push Code to GitHub
```bash
cd path/to/master-portfolio
git init
git add .
git commit -m "Initial portfolio commit"
```

Then on [github.com](https://github.com):
1. Create a new public or private repository
2. Push your local code to GitHub (follow GitHub's instructions)

### Step 2: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click **Sign up** (use GitHub for easy login)
3. Complete onboarding

### Step 3: Create Backend Service on Railway
1. In Railway dashboard, click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your portfolio repository
4. Click **Connect**

### Step 4: Configure Backend Settings
Railway will auto-detect and show the root directory. You need to change it:
1. Click **Settings** for your deployment
2. Find **Root Directory**
3. Change from root to: `backend`
4. Click **Save**

### Step 5: Set Build & Start Commands
1. In project settings, find **Build Command**
   - Set to: `pip install -r requirements.txt`
2. Find **Start Command**
   - Set to: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 6: Add Environment Variables
1. Click the **Variables** tab
2. Add each variable:
   - **DASHBOARD_PASSWORD**: Your strong password
   - **PORT**: `8000`
   - **CORS_ORIGINS**: `https://your-frontend-domain.vercel.app,http://localhost:3000`
     - (You'll update this after deploying frontend)
   - **AI_API_KEY** (optional): Your OpenAI/Gemini/Groq key if you want real AI

3. Click **Deploy**

### Step 7: Get Your Backend URL
After deployment completes:
1. Click your project
2. Look for **Deployment** or **Domain** tab
3. Copy the URL (looks like `https://your-backend-xyz.up.railway.app`)
4. Save this URL — you need it for Vercel

---

## Deploy Frontend on Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click **Sign up** (use GitHub for easy login)
3. Complete onboarding

### Step 2: Import GitHub Repository
1. In Vercel dashboard, click **Add New** → **Project**
2. Click **Import Git Repository**
3. Find your portfolio repo and click **Import**

### Step 3: Configure Project Settings
1. **Framework**: Next.js (auto-detected)
2. **Root Directory**: Leave empty (it's at repo root)
3. Click **Configure**

### Step 4: Add Environment Variables
1. Before deploying, go to **Environment Variables**
2. Add:
   - **Name**: `BACKEND_API_URL`
   - **Value**: Your Railway backend URL from Step 7 above (e.g., `https://your-backend-xyz.up.railway.app`)
3. Click **Add**
4. Click **Deploy**

Vercel will build and deploy. This takes ~2–3 minutes.

### Step 5: Get Your Frontend URL
After deployment:
1. Click your project
2. Copy the **Production** domain (looks like `your-portfolio-abc.vercel.app`)
3. Save this URL

### Step 6: Update Railway CORS
Go back to Railway and update **CORS_ORIGINS** to include your Vercel domain:
```
https://your-portfolio-abc.vercel.app,http://localhost:3000
```

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

### "Cannot connect to backend" when testing dashboard
**Solution**: 
1. Check backend is running locally (`uvicorn main:app ...`)
2. Check `BACKEND_API_URL` in Vercel matches your Railway URL exactly
3. Check Railway `CORS_ORIGINS` includes your Vercel domain

### Dashboard login rejects password
**Solution**:
1. Double-check `DASHBOARD_PASSWORD` in `backend/.env` (local) or Railway (deployed)
2. Ensure no extra spaces before/after password
3. Restart backend after changing

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

### Railway deployment fails
**Solution**:
1. Check build command: `pip install -r requirements.txt`
2. Check start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Review Railway logs for Python errors

### Tasks/Projects not persisting after refresh
**Solution**:
1. Check backend `/backend/data/` folder exists and has JSON files
2. On Railway, ensure you're using persistent storage (Railway default)
3. Check backend error logs for write permission issues

### AI panel always returns same response
**Solution**:
1. Current `/ai/chat` endpoint returns a static planning response
2. To enable real LLM responses:
   - Add `AI_API_KEY` to Railway env vars
   - Modify `backend/main.py` `/ai/chat` route to call OpenAI/Gemini/Groq
   - Redeploy backend

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
- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Summary Checklist

- [ ] Local setup complete (npm install, backend/.env created)
- [ ] Backend runs locally on http://0.0.0.0:8000
- [ ] Frontend runs locally on http://localhost:3000
- [ ] Can login to dashboard with password
- [ ] Can add/edit/delete projects and tasks
- [ ] Code pushed to GitHub
- [ ] Backend deployed on Railway
- [ ] Frontend deployed on Vercel
- [ ] Backend URL added to Vercel env vars
- [ ] All public pages load and show data
- [ ] Personalization complete (name, contact, projects)

Once all items are checked, your portfolio is live!

---

**Questions or stuck?** Re-read the section for your step or check Troubleshooting.

Good luck! 🚀
