# Workspace Context — LocalAI

This file summarizes the current LocalAI project state, how to run it locally, how to expose the backend with ngrok, and how to host the frontend on Vercel while using a single ngrok tunnel.

---

## Project files

- `server.js` — Express server that proxies chat requests to a local LM at `http://127.0.0.1:1234/v1/chat/completions`. It now binds to `0.0.0.0` by default (reads `HOST` env var) and listens on port `3000`.
- `public/index.html` — Simple frontend UI. It posts JSON `{ message }` to `/api/chat`. Client-side code was updated to show a "Sending..." indicator, surface errors, and disable the Send button while awaiting responses.
- `WORKSPACE_CONTEXT.md` — This file.

## How the system works

- The browser frontend (served by the Node server or by a static host) sends a POST to `/api/chat` on the server.
- The Express server forwards the request to the locally-running model endpoint at `127.0.0.1:1234` and returns the model reply to the browser.
- When using ngrok, the public ngrok URL forwards incoming requests to the local Node server; the Node server still talks to the model on `127.0.0.1`.

## Local dev — commands

Start the server (from repository root):
```powershell
node server.js
```

Test the API with PowerShell:
```powershell
(Invoke-RestMethod -Uri http://localhost:3000/api/chat -Method POST -Body (@{message='Hello'} | ConvertTo-Json) -ContentType 'application/json') | ConvertTo-Json -Depth 5
```

Or test with curl (Windows); ensure your shell escapes JSON correctly:
```powershell
curl.exe -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"message\":\"Hello\"}"
```

## NGROK — single tunnel for remote frontend

1. Start your local server (see above).
2. Start ngrok to forward port `3000`:
```bash
ngrok http 3000
```
3. Copy the HTTPS forwarding URL (e.g. `https://abcd-1234.ngrok.io`).
4. Use that URL as the backend base URL in your frontend app (see CORS and auth notes below). Example API path: `https://abcd-1234.ngrok.io/api/chat`.

Notes:
- One ngrok tunnel is sufficient — Vercel-hosted frontend will call the ngrok URL directly.
- Free ngrok URLs rotate after restart; use paid reserved subdomain for a stable URL.

## Vercel deployment flow

1. Push your frontend code to GitHub.
2. Deploy to Vercel from that repo.
3. Configure an environment variable on Vercel (e.g. `NEXT_PUBLIC_API_URL`) with your current ngrok HTTPS URL so the deployed site will call the tunnel.

## CORS and HTTPS

- Because Vercel serves over HTTPS, use ngrok's HTTPS forwarding URL to avoid mixed-content errors.
- Add CORS in `server.js` to allow your Vercel origin, or use a permissive `*` origin for quick testing (not recommended for production).

Example CORS middleware (install `cors`):
```js
const cors = require('cors');
app.use(cors({ origin: 'https://your-vercel-domain.vercel.app' }));
```

## Recommended basic auth / API key (security)

Add a lightweight API key check before `/api/chat` to prevent public abuse.

Example (in `server.js`):
```js
app.use((req, res, next) => {
  const key = req.get('x-api-key');
  if (!key || key !== process.env.API_KEY) return res.status(401).send('Unauthorized');
  next();
});
```

Then set `API_KEY` locally and include header `x-api-key` in fetch requests from your frontend.

## Firewall on Windows (if exposing to LAN)

Allow port 3000 through Windows firewall (example PowerShell):
```powershell
netsh advfirewall firewall add rule name="LocalAI 3000" dir=in action=allow protocol=TCP localport=3000
```

## Environment variables recommended

- `HOST` — (optional) hostname to bind the Node server. Defaults to `0.0.0.0`.
- `API_KEY` — secret string used by the server to authorize incoming requests.

## Troubleshooting

- If the frontend reports a CORS error, ensure `server.js` uses `cors()` with the correct origin and that you are using the ngrok HTTPS URL.
- If your ngrok URL returns 502/404, confirm your Node server is running and listening on port 3000 and that ngrok is connected.
- If the server returns an error when contacting the model, verify the model process is running on `127.0.0.1:1234` and check its logs.

---

If you want, I can:
- Add the `cors` + `API_KEY` middleware to `server.js` now.
- Generate a small README with deploy steps to Vercel including env var examples.
- Add a tiny `.env.example` file to the repo.
