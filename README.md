# Master Portfolio — deploy and run

Live frontend: [https://mathias-master-portfolio.vercel.app](https://mathias-master-portfolio.vercel.app)

The Vercel site is only the Next.js frontend. It does **not** talk to `127.0.0.1` on your laptop. Dashboard login and data go:

**Browser → Vercel `/api/*` → ngrok HTTPS URL + `/backend` → LocalAI Node on port 3000 → FastAPI on port 8000**

You do **not** need `npm run dev` to use the live site. You **do** need FastAPI, the Node proxy, and ngrok running on the laptop the whole time the live site should work.

## Architecture

| Piece | Port | Role |
| --- | --- | --- |
| FastAPI (`backend/`) | 8000 | Login, projects, tasks, maintenance. Stays private on the laptop. |
| LocalAI (`LocalAI/server.js`) | 3000 | Node proxy. ngrok must point here. `/backend/*` → FastAPI, `/v1/*` → LM Studio. |
| ngrok | tunnels 3000 | Public HTTPS URL that Vercel calls. |
| Vercel | — | Hosts the Next.js site. `BACKEND_API_URL` must include `/backend`. |
| LM Studio (optional, local AI chat) | 1234 | Local model server for `/dashboard/ai` Local AI. |
| Gemini API (optional) | — | Cloud chat in `/dashboard/ai` Gemini AI. Uses `GEMINI_API_KEY` or a key pasted in the dashboard. |

`.next` is a local Next.js cache. Ignore it. Vercel builds its own copy. It is not required for this deploy path.

## Vercel environment variables

In Vercel → Project → Settings → Environment Variables:

| Name | Value |
| --- | --- |
| `BACKEND_API_URL` | `https://<your-ngrok-host>/backend` (no trailing slash) |
| `NGROK_SKIP_BROWSER_WARNING` | `1` |
| `GEMINI_API_KEY` | Optional. Google AI Studio key for the Gemini AI section. |
| `GEMINI_MODEL` | Optional. Default `gemini-3.6-flash`. Allowlist: `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`. |

Current host used on this project:

`https://prelude-divisible-untoasted.ngrok-free.dev/backend`

Use **exactly** the hostname ngrok prints under **Forwarding**. Free ngrok domains may end in `.ngrok-free.dev` or `.ngrok-free.app`. Those are different hostnames — do not swap the suffix. Redeploy on Vercel after changing env vars.

## Every time you want the live site to work

Keep **four terminals** open (LM Studio only if you need **Local AI** chat. Gemini AI uses Google’s API instead).

### Terminal 1 — FastAPI

```powershell
cd C:\Users\663208\Downloads\Master-Portfolio\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Check: [http://127.0.0.1:8000/](http://127.0.0.1:8000/) should return:

```json
{"status":"ok","service":"portfolio-backend"}
```

If `uvicorn` is not on PATH, keep using `python -m uvicorn`. Dashboard password is `DASHBOARD_PASSWORD` in `backend/.env`.

### Terminal 2 — LM Studio (Local AI chat only)

Open LM Studio, load a model, start the local server on port 1234. Skip this if you only use **Gemini AI** on `/dashboard/ai`.

### Terminal 3 — Node proxy (required before ngrok)

```powershell
cd C:\Users\663208\Downloads\Master-Portfolio\LocalAI
npm install
node server.js
```

Leave it running. You should see that the proxy is on `http://localhost:3000`.

Routes:

- `/backend/*` → FastAPI `127.0.0.1:8000`
- `/v1/*` → LM Studio `127.0.0.1:1234`

Check: [http://127.0.0.1:3000/backend](http://127.0.0.1:3000/backend) should return the same FastAPI JSON.

### Terminal 4 — ngrok

```powershell
ngrok http 3000
```

Tunnel **3000**, not 8000. Copy the HTTPS Forwarding URL.

Checks:

1. Open `https://<ngrok-host>/backend` — same FastAPI JSON (click through ngrok’s browser warning if shown).
2. Confirm Vercel `BACKEND_API_URL` is that host plus `/backend`.
3. Use the live site: [https://mathias-master-portfolio.vercel.app](https://mathias-master-portfolio.vercel.app)

If the ngrok hostname changed, update Vercel and redeploy.

## Local frontend (optional)

Only if you want to develop the Next.js app on this machine:

```powershell
cd C:\Users\663208\Downloads\Master-Portfolio
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `.env.local` should have `BACKEND_API_URL=http://127.0.0.1:8000` (direct to FastAPI, no `/backend` and no ngrok). You cannot run this on port 3000 at the same time as `LocalAI/server.js`.

## Troubleshooting

**ERR_NGROK_8012** — ngrok is up, but nothing is listening on localhost:3000. Start `node server.js` in `LocalAI`. FastAPI on 8000 alone is not enough.

**502 / Cannot reach backend** — Vercel reached Next.js, then could not reach `BACKEND_API_URL`. Usual causes: ngrok stopped, Node proxy stopped, FastAPI stopped, or Vercel still has an old ngrok URL.

**Health OK on port 8000 but live site 502** — expected if 3000/ngrok are down. Vercel never calls 8000 directly.

**Wrong TLD** — do not change `.dev` to `.app` (or the reverse) unless ngrok’s Forwarding line says so.

**Local AI chat 502** — LM Studio is not running on 1234. Unrelated to FastAPI. Gemini AI does not need LM Studio.
