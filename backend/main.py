from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
PROJECTS_PATH = DATA_DIR / "projects.json"
TASKS_PATH = DATA_DIR / "tasks.json"
CONTEXT_PATH = DATA_DIR / "context.md"
MAINTENANCE_PATH = DATA_DIR / "maintenance.json"

DEFAULT_MAINTENANCE_MESSAGE = "Website is currently down. Please come back later."

PASSWORD = os.getenv("DASHBOARD_PASSWORD", "change-this-password")

# GitHub sync configuration
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")
GITHUB_REPO = os.getenv("GITHUB_REPO")
GITHUB_BRANCH = os.getenv("GITHUB_BRANCH", "main")

app = FastAPI(title="Portfolio Backend", version="1.0.0")

cors_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginBody(BaseModel):
    password: str


class ProjectBase(BaseModel):
    title: str
    description: str
    category: str
    status: str
    github: str = ""
    demo: str = ""
    links: list[dict[str, str]] = Field(default_factory=list)
    image: str = ""
    techs: list[str] = Field(default_factory=list)
    progress: int = 0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    status: str | None = None
    github: str | None = None
    demo: str | None = None
    links: list[dict[str, str]] | None = None
    image: str | None = None
    techs: list[str] | None = None
    progress: int | None = None


class TaskBase(BaseModel):
    title: str
    status: str
    priority: str
    category: str
    month: str
    notes: str = ""


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    priority: str | None = None
    category: str | None = None
    month: str | None = None
    notes: str | None = None


class ContextBody(BaseModel):
    content: str


class ChatBody(BaseModel):
    message: str


class MaintenanceBody(BaseModel):
    enabled: bool
    message: str = DEFAULT_MAINTENANCE_MESSAGE


def _read_json(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise HTTPException(status_code=500, detail=f"Invalid JSON in {path.name}")
    return data


def _write_json(path: Path, data: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def _push_to_github() -> bool:
    """Push projects.json to GitHub. Returns True if successful, False if disabled or failed."""
    if not all([GITHUB_TOKEN, GITHUB_USERNAME, GITHUB_REPO]):
        # GitHub sync is optional - just return silently if not configured
        return False
    
    try:
        # Read current projects.json
        with open(PROJECTS_PATH, "r", encoding="utf-8") as f:
            content = f.read()
        
        # GitHub API endpoint
        api_url = f"https://api.github.com/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/backend/data/projects.json"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
        }
        
        # Get current file SHA (needed for updates)
        get_response = requests.get(api_url, headers=headers, timeout=10)
        sha = get_response.json().get("sha") if get_response.status_code == 200 else None
        
        # Prepare commit message
        message = "Auto-sync: Update projects.json from dashboard"
        
        # Prepare payload
        payload = {
            "message": message,
            "content": __import__("base64").b64encode(content.encode()).decode(),
            "branch": GITHUB_BRANCH,
        }
        if sha:
            payload["sha"] = sha
        
        # Push to GitHub
        push_response = requests.put(api_url, json=payload, headers=headers, timeout=10)
        
        if push_response.status_code in [200, 201]:
            print(f"✓ GitHub sync successful: {message}")
            return True
        else:
            print(f"✗ GitHub sync failed: {push_response.status_code} - {push_response.text}")
            return False
    except Exception as e:
        print(f"✗ GitHub sync error: {e}")
        return False


def _token_from_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def _token_from_authorization(authorization: str | None) -> str | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    return authorization.split(" ", 1)[1].strip()


def _is_valid_token(token: str | None) -> bool:
    if not token:
        return False
    return token == _token_from_password(PASSWORD)


def _has_valid_auth_header(authorization: str | None) -> bool:
    return _is_valid_token(_token_from_authorization(authorization))


def _require_token(authorization: str | None = Header(default=None)) -> str:
    token = _token_from_authorization(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Missing auth token")

    if not _is_valid_token(token):
        raise HTTPException(status_code=401, detail="Invalid auth token")

    return token


def _slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value)
    return value.strip("-") or "project"


def _next_project_id(title: str, projects: list[dict[str, Any]]) -> str:
    base = _slugify(title)
    existing = {str(item.get("id", "")).strip() for item in projects}
    if base not in existing:
        return base

    n = 2
    while f"{base}-{n}" in existing:
        n += 1
    return f"{base}-{n}"


def _next_task_id(tasks: list[dict[str, Any]]) -> str:
    numeric_ids = []
    for task in tasks:
        raw = str(task.get("id", "")).strip()
        if raw.isdigit():
            numeric_ids.append(int(raw))

    return str((max(numeric_ids) + 1) if numeric_ids else 1)


def _read_maintenance() -> dict[str, Any]:
    default_state = {
        "enabled": False,
        "message": DEFAULT_MAINTENANCE_MESSAGE,
    }

    if not MAINTENANCE_PATH.exists():
        return default_state

    with MAINTENANCE_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        return default_state

    enabled = data.get("enabled")
    message = data.get("message")

    return {
        "enabled": bool(enabled),
        "message": message.strip() if isinstance(message, str) and message.strip() else DEFAULT_MAINTENANCE_MESSAGE,
    }


def _write_maintenance(data: dict[str, Any]) -> None:
    MAINTENANCE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MAINTENANCE_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


@app.get("/")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "portfolio-backend"}


@app.post("/auth/login")
def login(body: LoginBody) -> dict[str, str]:
    if body.password != PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"token": _token_from_password(body.password)}


@app.get("/maintenance")
def get_maintenance() -> dict[str, Any]:
    return _read_maintenance()


@app.put("/maintenance", dependencies=[Depends(_require_token)])
def update_maintenance(body: MaintenanceBody) -> dict[str, Any]:
    payload = {
        "enabled": body.enabled,
        "message": body.message.strip() if body.message.strip() else DEFAULT_MAINTENANCE_MESSAGE,
    }
    _write_maintenance(payload)
    return payload


@app.get("/projects")
def get_projects(authorization: str | None = Header(default=None)) -> list[dict[str, Any]]:
    maintenance = _read_maintenance()
    if maintenance.get("enabled") and not _has_valid_auth_header(authorization):
        raise HTTPException(status_code=503, detail=str(maintenance.get("message", DEFAULT_MAINTENANCE_MESSAGE)))
    return _read_json(PROJECTS_PATH)


@app.post("/projects", dependencies=[Depends(_require_token)])
def add_project(body: ProjectCreate) -> dict[str, Any]:
    projects = _read_json(PROJECTS_PATH)
    item = body.model_dump()
    item["id"] = _next_project_id(body.title, projects)
    projects.append(item)
    _write_json(PROJECTS_PATH, projects)
    _push_to_github()  # Auto-sync to GitHub
    return item


@app.put("/projects/{project_id}", dependencies=[Depends(_require_token)])
def update_project(project_id: str, body: ProjectUpdate) -> dict[str, Any]:
    projects = _read_json(PROJECTS_PATH)
    patch = body.model_dump(exclude_none=True)

    for index, item in enumerate(projects):
        if str(item.get("id")) == project_id:
            updated = {**item, **patch}
            projects[index] = updated
            _write_json(PROJECTS_PATH, projects)
            _push_to_github()  # Auto-sync to GitHub
            return updated

    raise HTTPException(status_code=404, detail="Project not found")


@app.delete("/projects/{project_id}", dependencies=[Depends(_require_token)])
def remove_project(project_id: str) -> dict[str, str]:
    projects = _read_json(PROJECTS_PATH)
    next_projects = [item for item in projects if str(item.get("id")) != project_id]

    if len(next_projects) == len(projects):
        raise HTTPException(status_code=404, detail="Project not found")

    _write_json(PROJECTS_PATH, next_projects)
    _push_to_github()  # Auto-sync to GitHub
    return {"ok": "true"}


@app.get("/tasks", dependencies=[Depends(_require_token)])
def get_tasks() -> list[dict[str, Any]]:
    return _read_json(TASKS_PATH)


@app.post("/tasks", dependencies=[Depends(_require_token)])
def add_task(body: TaskCreate) -> dict[str, Any]:
    tasks = _read_json(TASKS_PATH)
    item = body.model_dump()
    item["id"] = _next_task_id(tasks)
    tasks.append(item)
    _write_json(TASKS_PATH, tasks)
    return item


@app.put("/tasks/{task_id}", dependencies=[Depends(_require_token)])
def update_task(task_id: str, body: TaskUpdate) -> dict[str, Any]:
    tasks = _read_json(TASKS_PATH)
    patch = body.model_dump(exclude_none=True)

    for index, item in enumerate(tasks):
        if str(item.get("id")) == task_id:
            updated = {**item, **patch}
            tasks[index] = updated
            _write_json(TASKS_PATH, tasks)
            return updated

    raise HTTPException(status_code=404, detail="Task not found")


@app.delete("/tasks/{task_id}", dependencies=[Depends(_require_token)])
def remove_task(task_id: str) -> dict[str, str]:
    tasks = _read_json(TASKS_PATH)
    next_tasks = [item for item in tasks if str(item.get("id")) != task_id]

    if len(next_tasks) == len(tasks):
        raise HTTPException(status_code=404, detail="Task not found")

    _write_json(TASKS_PATH, next_tasks)
    return {"ok": "true"}


@app.get("/context", dependencies=[Depends(_require_token)])
def get_context() -> dict[str, str]:
    if not CONTEXT_PATH.exists():
        return {"content": ""}
    return {"content": CONTEXT_PATH.read_text(encoding="utf-8")}


@app.put("/context", dependencies=[Depends(_require_token)])
def update_context(body: ContextBody) -> dict[str, str]:
    CONTEXT_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONTEXT_PATH.write_text(body.content, encoding="utf-8")
    return {"ok": "true"}


@app.post("/ai/chat", dependencies=[Depends(_require_token)])
def chat(body: ChatBody) -> dict[str, str]:
    tasks = _read_json(TASKS_PATH)
    open_tasks = [task for task in tasks if str(task.get("status")) != "done"]

    summary = [
        f"You asked: {body.message.strip()}",
        f"Open tasks right now: {len(open_tasks)}",
        "Recommended next step: pick one high-priority in-progress item and finish it before starting a new one.",
    ]

    if open_tasks:
        top = open_tasks[0]
        summary.append(
            f"Suggested focus: {top.get('title', 'Next task')} ({top.get('month', 'this month')}, {top.get('priority', 'medium')} priority)."
        )

    return {"reply": "\n".join(summary)}
