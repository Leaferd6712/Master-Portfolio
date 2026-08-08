Opening Backend Service

TERMINAL 1 — FastAPI backend
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000

TERMINAL 2 — LM Studio
Open the LM Studio app, load your model at http://127.0.0.1:1234

TERMINAL 3 — Node proxy
cd LocalAI
node server.js

TERMINAL 4 — ngrok 
ngrok http 3000

