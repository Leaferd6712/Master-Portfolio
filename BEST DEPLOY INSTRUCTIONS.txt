TERMINAL 1 — FastAPI backend

cd "C:\Users\663208\Downloads\Master-Portfolio\backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000




TERMINAL 2 — LM Studio

Open the LM Studio app, load your model (e.g. qwen2.5-coder-3b-instruct),
go to the "Local Server" tab and click "Start Server".
It binds to port 1234 automatically.

You should see: Server is running at http://127.0.0.1:1234


TERMINAL 3 — Node proxy  ← THIS MUST BE RUNNING BEFORE NGROK
--------------------------------------------------------------
cd "LocalAI"
node server.js

Leave running. You should see: Open http://localhost:3000 (bound to 0.0.0.0)

This proxy listens on port 3000 and routes:
  /v1/*      → LM Studio at 127.0.0.1:1234  (AI chat)
  /backend/* → FastAPI  at 127.0.0.1:8000   (projects, tasks, login)


TERMINAL 4 — ngrok (one tunnel, covers everything)
---------------------------------------------------
ngrok http 3000

