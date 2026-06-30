from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import date, datetime
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
ROADMAP_PATH = DATA_DIR / "roadmap.md"
MAINTENANCE_PATH = DATA_DIR / "maintenance.json"
SITE_SETTINGS_PATH = DATA_DIR / "site-settings.json"
SITE_SETTINGS_PATH = DATA_DIR / "site-settings.json"
NOTES_PATH = DATA_DIR / "notes.json"

DEFAULT_MAINTENANCE_MESSAGE = "Website is currently down. Please come back later."
TIMEFRAME_OPTIONS = {"1 week", "2 weeks", "3 weeks", "4 weeks"}

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
    subcategoryPath: list[str] = Field(default_factory=list)
    status: str
    github: str = ""
    demo: str = ""
    links: list[dict[str, str]] = Field(default_factory=list)
    image: str = ""
    techs: list[str] = Field(default_factory=list)
    progress: int = 0
    hiddenNotes: str = ""
    featured: bool = False
    visibility: str = "public"
    timeframe: str = "2 weeks"


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    subcategoryPath: list[str] | None = None
    status: str | None = None
    github: str | None = None
    demo: str | None = None
    links: list[dict[str, str]] | None = None
    image: str | None = None
    techs: list[str] | None = None
    progress: int | None = None
    hiddenNotes: str | None = None
    featured: bool | None = None
    visibility: str | None = None
    timeframe: str | None = None


class TaskBase(BaseModel):
    title: str
    status: str
    priority: str
    category: str
    month: str
    notes: str = ""
    projectId: str
    startDate: str = ""
    endDate: str | None = None
    timeframe: str = "2 weeks"


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    priority: str | None = None
    category: str | None = None
    month: str | None = None
    notes: str | None = None
    projectId: str | None = None
    startDate: str | None = None
    endDate: str | None = None
    timeframe: str | None = None


class ReorderTaskItem(BaseModel):
    id: str
    status: str | None = None


class ReorderTasksBody(BaseModel):
    tasks: list[ReorderTaskItem]


class ContextBody(BaseModel):
    content: str


class ChatBody(BaseModel):
    message: str


class MaintenanceBody(BaseModel):
    enabled: bool
    message: str = DEFAULT_MAINTENANCE_MESSAGE


class SiteTab(BaseModel):
    label: str
    href: str = "/projects"
    icon: str = ""
    desc: str = ""
    showInNav: bool = True
    showInInterests: bool = True
    children: list["SiteTab"] = Field(default_factory=list)


class SiteSettingsBody(BaseModel):
    tabs: list[SiteTab] = Field(default_factory=list)


class NoteEntry(BaseModel):
    id: str
    title: str
    projectId: str = ""
    summary: str = ""
    content: str = ""
    tags: list[str] = Field(default_factory=list)
    published: bool = True
    updatedAt: str = ""


class NotesBody(BaseModel):
    notes: list[NoteEntry] = Field(default_factory=list)


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
        json.dump(data, f, indent=2, ensure_ascii=False)


def _read_json_object(path: Path, default: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        return default
    return data


def _write_json_object(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _push_file_to_github(local_path: Path, repo_path: str, message: str) -> bool:
    """Push a local file to GitHub. Returns True if successful, False if disabled or failed."""
    if not all([GITHUB_TOKEN, GITHUB_USERNAME, GITHUB_REPO]):
        # GitHub sync is optional - just return silently if not configured
        return False

    try:
        # Read current local file content
        with open(local_path, "r", encoding="utf-8") as f:
            content = f.read()

        # GitHub API endpoint
        api_url = f"https://api.github.com/repos/{GITHUB_USERNAME}/{GITHUB_REPO}/contents/{repo_path}"
        headers = {
            "Authorization": f"token {GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
        }

        # Get current file SHA (needed for updates)
        get_response = requests.get(api_url, headers=headers, timeout=10)
        sha = get_response.json().get("sha") if get_response.status_code == 200 else None

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


def _push_projects_to_github() -> bool:
    return _push_file_to_github(
        PROJECTS_PATH,
        "backend/data/projects.json",
        "Auto-sync: Update projects.json from dashboard",
    )


def _push_tasks_to_github() -> bool:
    return _push_file_to_github(
        TASKS_PATH,
        "backend/data/tasks.json",
        "Auto-sync: Update tasks.json from dashboard",
    )


def _push_context_to_github() -> bool:
    return _push_file_to_github(
        CONTEXT_PATH,
        "backend/data/context.md",
        "Auto-sync: Update context.md from dashboard",
    )


def _push_roadmap_to_github() -> bool:
    return _push_file_to_github(
        ROADMAP_PATH,
        "backend/data/roadmap.md",
        "Auto-sync: Update roadmap.md from dashboard",
    )


def _push_maintenance_to_github() -> bool:
    return _push_file_to_github(
        MAINTENANCE_PATH,
        "backend/data/maintenance.json",
        "Auto-sync: Update maintenance.json from dashboard",
    )


def _push_site_settings_to_github() -> bool:
    return _push_file_to_github(
        SITE_SETTINGS_PATH,
        "backend/data/site-settings.json",
        "Auto-sync: Update site-settings.json from dashboard",
    )


def _push_notes_to_github() -> bool:
    return _push_file_to_github(
        NOTES_PATH,
        "backend/data/notes.json",
        "Auto-sync: Update notes.json from dashboard",
    )


def _github_sync_enabled() -> bool:
    return bool(GITHUB_TOKEN and GITHUB_USERNAME and GITHUB_REPO)


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


def _parse_iso_date(value: str | None) -> date | None:
    if value is None:
        return None
    raw = value.strip()
    if not raw:
        return None
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must use YYYY-MM-DD format")


def _normalize_timeframe(value: Any) -> str:
    raw = str(value or "").strip()
    return raw if raw in TIMEFRAME_OPTIONS else "2 weeks"


def _normalize_project(item: dict[str, Any]) -> dict[str, Any]:
    clean = dict(item)
    clean["subcategoryPath"] = [
        str(part).strip()
        for part in clean.get("subcategoryPath", [])
        if str(part).strip()
    ] if isinstance(clean.get("subcategoryPath"), list) else []
    clean["progress"] = max(0, min(100, _project_progress(clean)))
    clean["featured"] = bool(clean.get("featured", False))
    clean["visibility"] = "draft" if str(clean.get("visibility", "")).strip() == "draft" else "public"
    clean["timeframe"] = _normalize_timeframe(clean.get("timeframe"))
    return clean


def _require_existing_project(project_id: str, projects: list[dict[str, Any]]) -> None:
    normalized = project_id.strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="projectId is required")

    for project in projects:
        if str(project.get("id", "")).strip() == normalized:
            return

    raise HTTPException(status_code=400, detail="Linked project was not found")


def _validate_task_payload(item: dict[str, Any], projects: list[dict[str, Any]]) -> dict[str, Any]:
    project_id = str(item.get("projectId", "")).strip()
    _require_existing_project(project_id, projects)

    start_raw = str(item.get("startDate", "")).strip()
    end_raw = str(item.get("endDate", "")).strip()
    start = _parse_iso_date(start_raw) if start_raw else None
    end = _parse_iso_date(end_raw) if end_raw else None

    if start and end and end < start:
        raise HTTPException(status_code=400, detail="endDate cannot be before startDate")

    item["projectId"] = project_id
    item["startDate"] = start.isoformat() if start else ""
    item["endDate"] = end.isoformat() if end else ""
    item["timeframe"] = _normalize_timeframe(item.get("timeframe"))
    return item


def _project_progress(project: dict[str, Any]) -> int:
    raw = project.get("progress", 0)
    try:
        return int(raw)
    except Exception:
        return 0


def _sync_tasks_from_projects(tasks: list[dict[str, Any]], projects: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], bool]:
    changed = False
    project_by_id = {str(project.get("id", "")).strip(): project for project in projects}
    existing_project_ids = {
        str(task.get("projectId", "")).strip()
        for task in tasks
        if str(task.get("projectId", "")).strip()
    }

    for project in projects:
        project_id = str(project.get("id", "")).strip()
        if not project_id:
            continue

        if _project_progress(project) >= 100:
            continue

        if project_id in existing_project_ids:
            continue

        item = {
            "id": _next_task_id(tasks),
            "title": str(project.get("title", "Untitled project")),
            "status": "in progress" if _project_progress(project) > 0 else "planned",
            "priority": "high" if _project_progress(project) >= 75 else "medium",
            "category": str(project.get("category", "Project")) or "Project",
            "month": datetime.now().strftime("%B"),
            "notes": "Auto-created from project progress.",
            "projectId": project_id,
            "startDate": "",
            "endDate": "",
            "timeframe": _normalize_timeframe(project.get("timeframe")),
        }
        tasks.append(item)
        existing_project_ids.add(project_id)
        changed = True

    for task in tasks:
        linked_project_id = str(task.get("projectId", "")).strip()
        if not linked_project_id:
            continue

        project = project_by_id.get(linked_project_id)
        if not project:
            continue

        if _project_progress(project) >= 100 and str(task.get("status", "")).strip() != "done":
            task["status"] = "done"
            changed = True

        start_raw = str(task.get("startDate", "")).strip()
        if "timeframe" not in task or task.get("timeframe") not in TIMEFRAME_OPTIONS:
            task["timeframe"] = "2 weeks"
            changed = True
        if start_raw and "endDate" not in task:
            task["endDate"] = ""
            changed = True

    return tasks, changed


def _sync_project_from_task(task: dict[str, Any], projects: list[dict[str, Any]]) -> bool:
    linked_project_id = str(task.get("projectId", "")).strip()
    if not linked_project_id:
        return False

    for idx, project in enumerate(projects):
        if str(project.get("id", "")).strip() != linked_project_id:
            continue

        if str(task.get("status", "")).strip() != "done":
            return False

        progress = _project_progress(project)
        status = str(project.get("status", "")).strip()
        if progress >= 100 and status == "finished":
            return False

        updated = dict(project)
        updated["progress"] = 100
        updated["status"] = "finished"
        projects[idx] = updated
        return True

    return False


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


def _default_site_settings() -> dict[str, Any]:
    return {
        "tabs": [
            {
                "label": "Robotics",
                "href": "/projects",
                "icon": "🤖",
                "desc": "Building autonomous systems and physical computing projects.",
                "showInNav": False,
                "showInInterests": True,
                "children": [],
            },
            {
                "label": "AI / ML",
                "href": "/ai",
                "icon": "🧠",
                "desc": "YOLO models, classifiers, vision systems, and neural nets.",
                "showInNav": True,
                "showInInterests": True,
                "children": [
                    {
                        "label": "AI",
                        "href": "/ai",
                        "icon": "",
                        "desc": "Applied AI systems and experiments.",
                        "showInNav": False,
                        "showInInterests": False,
                        "children": [],
                    },
                    {
                        "label": "ML / Vision",
                        "href": "/ai",
                        "icon": "",
                        "desc": "Object detection and segmentation work.",
                        "showInNav": False,
                        "showInInterests": False,
                        "children": [
                            {
                                "label": "Object detection models",
                                "href": "/ai",
                                "icon": "",
                                "desc": "",
                                "showInNav": False,
                                "showInInterests": False,
                                "children": [],
                            },
                            {
                                "label": "Instance segmentation models",
                                "href": "/ai",
                                "icon": "",
                                "desc": "",
                                "showInNav": False,
                                "showInInterests": False,
                                "children": [],
                            },
                        ],
                    },
                ],
            },
            {
                "label": "Coding",
                "href": "/projects",
                "icon": "💻",
                "desc": "Python, TypeScript, system design, and backend APIs.",
                "showInNav": False,
                "showInInterests": True,
                "children": [],
            },
            {
                "label": "Games",
                "href": "/games",
                "icon": "🎮",
                "desc": "Mini simulations, 2D games, and interactive experiences.",
                "showInNav": True,
                "showInInterests": True,
                "children": [],
            },
            {
                "label": "CAD",
                "href": "/cad",
                "icon": "📐",
                "desc": "3D design, prints, prototypes, and Fusion 360 projects.",
                "showInNav": True,
                "showInInterests": True,
                "children": [],
            },
            {
                "label": "Backend",
                "href": "/backend-tools",
                "icon": "⚙️",
                "desc": "APIs, tools, dashboards, and server-side systems.",
                "showInNav": True,
                "showInInterests": True,
                "children": [],
            },
            {
                "label": "Notes",
                "href": "/notes",
                "icon": "📝",
                "desc": "Project notes and technical write-ups.",
                "showInNav": True,
                "showInInterests": False,
                "children": [],
            },
            {
                "label": "Contact",
                "href": "/contact",
                "icon": "@",
                "desc": "Get in touch.",
                "showInNav": True,
                "showInInterests": False,
                "children": [],
            },
        ]
    }


def _sanitize_site_tabs(tabs: Any) -> list[dict[str, Any]]:
    if not isinstance(tabs, list):
        return []

    clean_tabs: list[dict[str, Any]] = []
    for tab in tabs:
        if not isinstance(tab, dict):
            continue
        label = str(tab.get("label", "")).strip()
        if not label:
            continue
        href = str(tab.get("href", "")).strip() or "/projects"
        if not href.startswith("/") and not href.startswith("http"):
            href = f"/{href}"
        clean_tabs.append(
            {
                "label": label,
                "href": href,
                "icon": str(tab.get("icon", "")).strip(),
                "desc": str(tab.get("desc", "")).strip(),
                "showInNav": bool(tab.get("showInNav", True)),
                "showInInterests": bool(tab.get("showInInterests", True)),
                "children": _sanitize_site_tabs(tab.get("children", [])),
            }
        )
    return clean_tabs


def _sanitize_site_settings(data: dict[str, Any]) -> dict[str, Any]:
    clean_tabs = _sanitize_site_tabs(data.get("tabs", []))

    return {"tabs": clean_tabs}


def _read_site_settings() -> dict[str, Any]:
    return _sanitize_site_settings(
        _read_json_object(SITE_SETTINGS_PATH, _default_site_settings())
    )


def _sanitize_notes(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []

    clean_notes: list[dict[str, Any]] = []
    for note in data:
        if not isinstance(note, dict):
            continue
        title = str(note.get("title", "")).strip()
        content = str(note.get("content", "")).strip()
        if not title and not content:
            continue
        clean_notes.append(
            {
                "id": str(note.get("id", "")).strip() or _slugify(title or "note"),
                "title": title or "Untitled note",
                "projectId": str(note.get("projectId", "")).strip(),
                "summary": str(note.get("summary", "")).strip(),
                "content": content,
                "tags": [
                    str(tag).strip()
                    for tag in note.get("tags", [])
                    if str(tag).strip()
                ] if isinstance(note.get("tags"), list) else [],
                "published": bool(note.get("published", True)),
                "updatedAt": str(note.get("updatedAt", "")).strip()
                or datetime.utcnow().isoformat(timespec="seconds") + "Z",
            }
        )
    return clean_notes


def _read_notes() -> list[dict[str, Any]]:
    return _sanitize_notes(_read_json(NOTES_PATH))


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
    _push_maintenance_to_github()  # Auto-sync to GitHub
    return payload


@app.get("/site-settings")
def get_site_settings() -> dict[str, Any]:
    return _read_site_settings()


@app.put("/site-settings", dependencies=[Depends(_require_token)])
def update_site_settings(body: SiteSettingsBody) -> dict[str, Any]:
    payload = _sanitize_site_settings(body.model_dump())
    _write_json_object(SITE_SETTINGS_PATH, payload)
    _push_site_settings_to_github()  # Auto-sync to GitHub
    return payload


@app.get("/notes")
def get_notes(authorization: str | None = Header(default=None)) -> list[dict[str, Any]]:
    notes = _read_notes()
    if _has_valid_auth_header(authorization):
        return notes
    return [note for note in notes if note.get("published")]


@app.put("/notes", dependencies=[Depends(_require_token)])
def update_notes(body: NotesBody) -> list[dict[str, Any]]:
    payload = _sanitize_notes([note.model_dump() for note in body.notes])
    _write_json(NOTES_PATH, payload)
    _push_notes_to_github()
    return payload


@app.get("/projects")
def get_projects(authorization: str | None = Header(default=None)) -> list[dict[str, Any]]:
    maintenance = _read_maintenance()
    is_admin = _has_valid_auth_header(authorization)
    if maintenance.get("enabled") and not is_admin:
        raise HTTPException(status_code=503, detail=str(maintenance.get("message", DEFAULT_MAINTENANCE_MESSAGE)))

    projects = [_normalize_project(project) for project in _read_json(PROJECTS_PATH)]
    if is_admin:
        return projects

    # Never expose internal planning notes to public clients.
    public_projects: list[dict[str, Any]] = []
    for item in projects:
        if str(item.get("visibility", "public")) == "draft":
            continue
        sanitized = dict(item)
        sanitized.pop("hiddenNotes", None)
        public_projects.append(sanitized)
    return public_projects


@app.post("/projects", dependencies=[Depends(_require_token)])
def add_project(body: ProjectCreate) -> dict[str, Any]:
    projects = _read_json(PROJECTS_PATH)
    item = _normalize_project(body.model_dump())
    item["id"] = _next_project_id(body.title, projects)
    projects.append(item)
    _write_json(PROJECTS_PATH, projects)
    _push_projects_to_github()  # Auto-sync to GitHub
    return item


@app.put("/projects/{project_id}", dependencies=[Depends(_require_token)])
def update_project(project_id: str, body: ProjectUpdate) -> dict[str, Any]:
    projects = _read_json(PROJECTS_PATH)
    patch = body.model_dump(exclude_none=True)

    for index, item in enumerate(projects):
        if str(item.get("id")) == project_id:
            updated = _normalize_project({**item, **patch})
            projects[index] = updated
            _write_json(PROJECTS_PATH, projects)
            _push_projects_to_github()  # Auto-sync to GitHub
            return updated

    raise HTTPException(status_code=404, detail="Project not found")


@app.delete("/projects/{project_id}", dependencies=[Depends(_require_token)])
def remove_project(project_id: str) -> dict[str, str]:
    projects = _read_json(PROJECTS_PATH)
    next_projects = [item for item in projects if str(item.get("id")) != project_id]

    if len(next_projects) == len(projects):
        raise HTTPException(status_code=404, detail="Project not found")

    _write_json(PROJECTS_PATH, next_projects)
    _push_projects_to_github()  # Auto-sync to GitHub
    return {"ok": "true"}


@app.get("/tasks", dependencies=[Depends(_require_token)])
def get_tasks() -> list[dict[str, Any]]:
    tasks = _read_json(TASKS_PATH)
    projects = _read_json(PROJECTS_PATH)
    tasks, changed = _sync_tasks_from_projects(tasks, projects)
    if changed:
        _write_json(TASKS_PATH, tasks)
        _push_tasks_to_github()  # Auto-sync to GitHub
    return tasks


@app.post("/tasks", dependencies=[Depends(_require_token)])
def add_task(body: TaskCreate) -> dict[str, Any]:
    tasks = _read_json(TASKS_PATH)
    projects = _read_json(PROJECTS_PATH)
    item = _validate_task_payload(body.model_dump(), projects)
    item["id"] = _next_task_id(tasks)
    tasks.append(item)
    _write_json(TASKS_PATH, tasks)
    _push_tasks_to_github()  # Auto-sync to GitHub

    if _sync_project_from_task(item, projects):
        _write_json(PROJECTS_PATH, projects)
        _push_projects_to_github()  # Auto-sync to GitHub

    return item


@app.put("/tasks/reorder", dependencies=[Depends(_require_token)])
def reorder_tasks(body: ReorderTasksBody) -> list[dict[str, Any]]:
    tasks = _read_json(TASKS_PATH)
    tasks_by_id = {str(task.get("id", "")).strip(): task for task in tasks}

    ordered: list[dict[str, Any]] = []
    used_ids: set[str] = set()

    for row in body.tasks:
        task_id = str(row.id).strip()
        if not task_id or task_id in used_ids:
            continue

        base = tasks_by_id.get(task_id)
        if not base:
            continue

        updated = dict(base)
        if row.status is not None:
            updated["status"] = row.status

        ordered.append(updated)
        used_ids.add(task_id)

    for task in tasks:
        task_id = str(task.get("id", "")).strip()
        if task_id in used_ids:
            continue
        ordered.append(task)

    projects = _read_json(PROJECTS_PATH)
    project_changed = False
    for task in ordered:
        if _sync_project_from_task(task, projects):
            project_changed = True

    _write_json(TASKS_PATH, ordered)
    _push_tasks_to_github()  # Auto-sync to GitHub

    if project_changed:
        _write_json(PROJECTS_PATH, projects)
        _push_projects_to_github()  # Auto-sync to GitHub

    return ordered


@app.put("/tasks/{task_id}", dependencies=[Depends(_require_token)])
def update_task(task_id: str, body: TaskUpdate) -> dict[str, Any]:
    tasks = _read_json(TASKS_PATH)
    patch = body.model_dump(exclude_none=True)
    projects = _read_json(PROJECTS_PATH)

    for index, item in enumerate(tasks):
        if str(item.get("id")) == task_id:
            updated = {**item, **patch}
            updated = _validate_task_payload(updated, projects)
            tasks[index] = updated

            project_changed = _sync_project_from_task(updated, projects)

            _write_json(TASKS_PATH, tasks)
            _push_tasks_to_github()  # Auto-sync to GitHub

            if project_changed:
                _write_json(PROJECTS_PATH, projects)
                _push_projects_to_github()  # Auto-sync to GitHub

            return updated

    raise HTTPException(status_code=404, detail="Task not found")


@app.delete("/tasks/{task_id}", dependencies=[Depends(_require_token)])
def remove_task(task_id: str) -> dict[str, str]:
    tasks = _read_json(TASKS_PATH)
    next_tasks = [item for item in tasks if str(item.get("id")) != task_id]

    if len(next_tasks) == len(tasks):
        raise HTTPException(status_code=404, detail="Task not found")

    _write_json(TASKS_PATH, next_tasks)
    _push_tasks_to_github()  # Auto-sync to GitHub
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
    _push_context_to_github()  # Auto-sync to GitHub
    return {"ok": "true"}


@app.get("/roadmap", dependencies=[Depends(_require_token)])
def get_roadmap() -> dict[str, str]:
    if not ROADMAP_PATH.exists():
        return {"content": ""}
    return {"content": ROADMAP_PATH.read_text(encoding="utf-8")}


@app.put("/roadmap", dependencies=[Depends(_require_token)])
def update_roadmap(body: ContextBody) -> dict[str, Any]:
    ROADMAP_PATH.parent.mkdir(parents=True, exist_ok=True)
    ROADMAP_PATH.write_text(body.content, encoding="utf-8")
    synced = _push_roadmap_to_github()  # Auto-sync to GitHub
    return {
        "ok": "true",
        "githubSynced": synced,
        "githubSyncEnabled": _github_sync_enabled(),
    }


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


@app.get("/download-data", dependencies=[Depends(_require_token)])
def download_data():
    """Create a zip of backend data files and return it for download.

    Requires valid auth token (dashboard admin).
    """
    import io
    import zipfile
    from fastapi.responses import StreamingResponse

    files = []
    for p in (PROJECTS_PATH, TASKS_PATH, CONTEXT_PATH, ROADMAP_PATH, MAINTENANCE_PATH, SITE_SETTINGS_PATH, NOTES_PATH):
        try:
            if p.exists():
                files.append(p)
        except Exception:
            # ignore path errors
            continue

    if not files:
        raise HTTPException(status_code=404, detail="No data files found")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for p in files:
            # Add each file to the archive using only the filename
            z.write(str(p), arcname=p.name)

    buf.seek(0)
    headers = {"Content-Disposition": 'attachment; filename="portfolio-data.zip"'}
    return StreamingResponse(buf, media_type="application/zip", headers=headers)
