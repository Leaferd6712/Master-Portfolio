# Workspace Context — LocalAI

Express proxy on **port 3000**. The live Vercel site reaches this laptop through **ngrok → this process**, which then forwards to FastAPI and LM Studio.

Canonical laptop steps: repo `README.md` and `main.md`. This project does **not** use Railway.

## Project files

- `server.js` — Express on `0.0.0.0:3000` (override with `HOST` / `PORT`).
- `public/index.html` — Optional local chat UI posting to `/api/chat`.
- `WORKSPACE_CONTEXT.md` — This file.

## Routes

| Path | Upstream |
| --- | --- |
| `/backend/*` | FastAPI `http://127.0.0.1:8000` (prefix stripped) |
| `/v1/*` | LM Studio `http://127.0.0.1:1234` |
| `POST /api/chat` | LM Studio chat completions |

Vercel Next.js calls `{BACKEND_API_URL}/auth/login`. Vercel `BACKEND_API_URL` must be:

`https://<ngrok-host>/backend`

Current: `https://prelude-divisible-untoasted.ngrok-free.dev/backend`

## How the live site works

1. FastAPI on **8000**
2. This proxy on **3000** (`node server.js`) — **must be up before ngrok**
3. `ngrok http 3000`
4. Vercel `BACKEND_API_URL` = ngrok HTTPS host + `/backend`
5. Vercel `NGROK_SKIP_BROWSER_WARNING` = `1`

You do **not** need `npm run dev` for the live site. Do not tunnel port 8000.

## Start

```powershell
cd C:\Users\663208\Downloads\Master-Portfolio\LocalAI
npm install
node server.js
```

You should see the proxy on `http://localhost:3000`.

Confirm: http://127.0.0.1:3000/backend → FastAPI `{"status":"ok","service":"portfolio-backend"}`

Optional local chat test:

```powershell
curl.exe -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"message\":\"Hello\"}"
```

## ngrok

```powershell
ngrok http 3000
```

Use the **Forwarding** HTTPS host exactly (`.ngrok-free.dev` and `.ngrok-free.app` are different). Do not invent a suffix.

## CORS / HTTPS

Vercel talks to ngrok from its servers (Next `/api/*`), not from the browser to FastAPI. Still use the ngrok **HTTPS** URL. `server.js` already sends permissive CORS headers.

## Troubleshooting

- **ERR_NGROK_8012** — ngrok reached the laptop; nothing on 3000. Start `node server.js`.
- **502 on Vercel** — proxy, FastAPI, or ngrok down, or Vercel still has an old host / missing `/backend`.
- **AI errors** — LM Studio must be on `127.0.0.1:1234`.
