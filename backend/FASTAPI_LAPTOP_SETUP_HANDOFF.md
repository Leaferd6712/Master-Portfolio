# FastAPI Laptop Setup Handoff

Prepared so someone else can finish setup, connect the frontend, and run the backend locally.

Live site (Vercel) does **not** call this port directly. Production path: ngrok → LocalAI `:3000` `/backend` → this FastAPI `:8000`. Full steps: repo `README.md` and `main.md`. No Railway.

## 1) What is already working

- Python 3.12.x is installed.
- FastAPI backend runs locally at `http://127.0.0.1:8000/`.
- FastAPI, Uvicorn, and Pydantic are installed in user Python.
- `backend/venv` exists, but `pip` inside that venv fails with `Access is denied` on this laptop.

## 2) Current problem

- Running `pip` inside activated venv fails with `Access is denied`.
- Running `pip` outside venv works.
- Running `uvicorn` as a direct command may fail in PATH.
- Frontend/backend connection must be tested and confirmed after backend start.

## 3) Recommended approach for this laptop

- Do not rely on `backend/venv` unless permissions are repaired.
- Use system/user Python and run Uvicorn via module:
  - `python -m uvicorn main:app --host 127.0.0.1 --port 8000`
- Keep backend local first.
- If frontend/backend are cross-origin, keep CORS enabled in FastAPI.

## 4) Exact setup steps

1. Open PowerShell.
2. Go to backend folder:
   - `cd "C:\Users\663208\Downloads\Master-Portfolio\backend"`
3. Use system Python, not broken venv.
4. Start backend:
   - `python -m uvicorn main:app --host 127.0.0.1 --port 8000`
5. Open `http://127.0.0.1:8000/` and verify JSON health response.
6. Start frontend (repo root) and test dashboard/public pages.
7. If frontend lives on another origin/port, ensure backend CORS allows that origin.
8. For another device later, replace localhost with reachable IP/tunnel/hosted URL.

## 5) Commands to run

```powershell
cd "C:\Users\663208\Downloads\Master-Portfolio\backend"
deactivate
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

## 6) If packages must be installed again

Install to user environment, not broken venv:

```powershell
cd "C:\Users\663208\Downloads\Master-Portfolio\backend"
python -m pip install --user fastapi uvicorn pydantic
```

If `uvicorn` is not found as command, continue with `python -m uvicorn ...`.

## 7) Frontend connection details

**Local Next.js** (`npm run dev`): `.env.local` `BACKEND_API_URL=http://127.0.0.1:8000` (no `/backend`). Conflicts with LocalAI because both want port 3000.

**Live Vercel site**: Next `/app/api/*` on Vercel fetches `BACKEND_API_URL` which must be the ngrok host **plus `/backend`**, e.g. `https://prelude-divisible-untoasted.ngrok-free.dev/backend`. LocalAI strips `/backend` and forwards here.

Direct fetch example (only if bypassing the proxy):

```ts
fetch("http://127.0.0.1:8000/projects")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

## 8) CORS status and fix

CORS middleware is already present in `backend/main.py` and uses `CORS_ORIGINS` env var.

For local frontend on port 3000, backend `.env` should include:

```env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Development-only permissive fallback (not for production):

```py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 9) Quick troubleshooting

- If browser opens `http://127.0.0.1:8000/` and shows `portfolio-backend`, FastAPI is running.
- That is **not** enough for the live Vercel site. Also start `LocalAI` `node server.js` on 3000 and `ngrok http 3000`.
- **ERR_NGROK_8012**: nothing on 3000.
- **502 on Vercel**: cannot reach ngrok `/backend` (proxy/ngrok/URL).
- If `uvicorn` command fails, use `python -m uvicorn`.
- If venv keeps failing, leave it and use user Python.

## 10) One-line summary

Skip broken venv, run FastAPI with `python -m uvicorn` on 8000, then LocalAI on 3000 + ngrok 3000 for the live site.
