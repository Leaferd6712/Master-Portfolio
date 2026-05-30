# FastAPI Laptop Setup Handoff

Prepared so someone else can finish setup, connect the frontend, and run the backend locally.

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

Current app uses Next.js route handlers (`/app/api/*`) that proxy to backend.

- Backend base URL is read from env in `app/api/_lib/backend.ts`.
- Default fallback is `http://localhost:8000`.
- For this laptop local run, set:
  - `BACKEND_API_URL=http://127.0.0.1:8000`

Direct fetch example (only if bypassing Next proxy):

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

- If browser opens `http://127.0.0.1:8000/`, backend is running.
- If `uvicorn` command fails, use `python -m uvicorn`.
- If venv keeps failing, leave it and use user Python.
- Same-machine frontend/backend: localhost or 127.0.0.1 are both fine.
- Other-device access: use LAN IP, tunnel, or deployment URL.

## 10) One-line summary

Keep backend local and stable first, skip broken venv, run with `python -m uvicorn`, verify API in browser, then connect frontend and test end-to-end.
