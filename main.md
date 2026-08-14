# Laptop deploy notes

Live site: https://mathias-master-portfolio.vercel.app

Dashboard password: `DASHBOARD_PASSWORD` in `C:\Users\663208\Downloads\Master-Portfolio\backend\.env`

This laptop does **not** use Railway. The live Vercel site talks to this machine through ngrok → Node on 3000 → FastAPI on 8000.

You do **not** need `npm run dev` for the live site. You **do** need FastAPI, `LocalAI/server.js`, and ngrok running together. `.next` is only a local Next cache; ignore it.

## Vercel env (already set — only change if the ngrok host changes)

- `BACKEND_API_URL` = `https://prelude-divisible-untoasted.ngrok-free.dev/backend`
- `NGROK_SKIP_BROWSER_WARNING` = `1`

No trailing slash. Use the exact host ngrok prints (`.ngrok-free.dev` vs `.ngrok-free.app` are different; do not swap). Redeploy on Vercel after any env change.

## Start order (every session)

### Terminal 1 — FastAPI

```powershell
cd C:\Users\663208\Downloads\Master-Portfolio\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Confirm: http://127.0.0.1:8000/ → `{"status":"ok","service":"portfolio-backend"}`

### Terminal 2 — LM Studio (only for AI chat)

Open LM Studio, load a model (e.g. qwen2.5-coder-3b-instruct), Local Server → Start Server.

Should show: Server is running at http://127.0.0.1:1234

### Terminal 3 — Node proxy (must be up before ngrok)

```powershell
cd C:\Users\663208\Downloads\Master-Portfolio\LocalAI
npm install
node server.js
```

Leave running. Proxy on http://localhost:3000

- `/v1/*` → LM Studio 127.0.0.1:1234
- `/backend/*` → FastAPI 127.0.0.1:8000

Confirm: http://127.0.0.1:3000/backend → same FastAPI JSON

### Terminal 4 — ngrok

```powershell
ngrok http 3000
```

Tunnel **3000**, not 8000.

Confirm: https://prelude-divisible-untoasted.ngrok-free.dev/backend → same FastAPI JSON

Then use https://mathias-master-portfolio.vercel.app

## If it breaks

- **ERR_NGROK_8012** — ngrok reached the laptop, nothing on port 3000. Start `node server.js`.
- **502 on the live site** — Vercel cannot reach `BACKEND_API_URL`. Start FastAPI + Node + ngrok, and make sure the Vercel URL still matches ngrok’s Forwarding host + `/backend`.
- Opening http://127.0.0.1:8000/ only proves FastAPI. The live site still needs 3000 and ngrok.
