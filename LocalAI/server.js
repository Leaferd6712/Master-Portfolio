const express = require("express");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.ALLOW_ORIGIN || "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-api-key, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Optional API key guard
const API_KEY = process.env.API_KEY;
function checkApiKey(req, res) {
  if (!API_KEY) return true;
  if (req.get("x-api-key") !== API_KEY) {
    res.status(401).send("Unauthorized");
    return false;
  }
  return true;
}

// Generic upstream proxy helper
async function proxyTo(baseUrl, path, req, res) {
  try {
    const target = baseUrl + path;
    const opts = { method: req.method, headers: {} };
    if (req.get("content-type")) opts.headers["content-type"] = req.get("content-type");
    if (req.get("authorization")) opts.headers["authorization"] = req.get("authorization");
    if (req.method !== "GET" && req.method !== "HEAD") {
      opts.body = JSON.stringify(req.body || {});
      if (!opts.headers["content-type"]) opts.headers["content-type"] = "application/json";
    }
    const upstream = await fetch(target, opts);
    const text = await upstream.text();
    const ctype = upstream.headers.get("content-type");
    if (ctype) res.setHeader("content-type", ctype);
    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(502).json({ error: "Proxy error: " + (err && err.message ? err.message : String(err)) });
  }
}

// Simple chat endpoint (backward compat)
app.post("/api/chat", async (req, res) => {
  if (!checkApiKey(req, res)) return;
  try {
    const message = req.body.message || "";
    const upstream = await fetch("http://127.0.0.1:1234/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.LOCAL_AI_MODEL || "qwen2.5-coder-3b-instruct",
        messages: [{ role: "user", content: message }],
      }),
    });
    const data = await upstream.json().catch(() => null);
    res.json({ reply: data && data.choices && data.choices[0] ? data.choices[0].message.content : "No response" });
  } catch (err) {
    res.json({ reply: "Error: " + (err && err.message ? err.message : String(err)) });
  }
});

// Proxy /v1/... to LM Studio (regex works in both Express 4 and 5)
app.use(/^\/v1(\/.*)?$/, (req, res) => {
  if (!checkApiKey(req, res)) return;
  proxyTo("http://127.0.0.1:1234", req.originalUrl, req, res);
});

// Proxy /backend/... to FastAPI — strips /backend prefix
app.use(/^\/backend(\/.*)?$/, (req, res) => {
  if (!checkApiKey(req, res)) return;
  const path = req.originalUrl.replace(/^\/backend/, "") || "/";
  proxyTo("http://127.0.0.1:8000", path, req, res);
});

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3000;
app.listen(PORT, HOST, () => {
  console.log("Proxy running on http://localhost:" + PORT);
  console.log("  /v1/*      -> LM Studio  127.0.0.1:1234");
  console.log("  /backend/* -> FastAPI    127.0.0.1:8000");
});
