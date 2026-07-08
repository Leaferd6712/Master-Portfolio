import fs from "node:fs/promises";
import path from "node:path";

const EXCLUDED_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "old_code",
]);

const INCLUDED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".json",
  ".md",
  ".css",
  ".html",
  ".txt",
]);

const PRIORITY_FILES = [
  "README.md",
  "package.json",
  "tsconfig.json",
  "next.config.js",
  "tailwind.config.ts",
  "app/page.tsx",
  "app/layout.tsx",
  "app/api/ai/chat/route.ts",
  "backend/main.py",
  "components/Navbar.tsx",
  "components/Footer.tsx",
  "lib/api.ts",
];

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function shouldIncludeFile(relativePath) {
  if (relativePath.startsWith("./")) {
    relativePath = relativePath.slice(2);
  }

  const ext = path.extname(relativePath).toLowerCase();
  return INCLUDED_EXTENSIONS.has(ext) || relativePath.endsWith("/README.md");
}

async function walkDirectory(rootDir, currentDir, collectedFiles) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(currentDir, entry.name);
    const relativePath = toPosixPath(path.relative(rootDir, fullPath));

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      await walkDirectory(rootDir, fullPath, collectedFiles);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (!shouldIncludeFile(relativePath)) {
      continue;
    }

    collectedFiles.push(relativePath);
  }
}

async function readFileIfPossible(rootDir, relativePath, maxCharsPerFile) {
  try {
    const absolutePath = path.join(rootDir, relativePath);
    const content = await fs.readFile(absolutePath, "utf-8");
    const trimmed = content.length > maxCharsPerFile ? content.slice(0, maxCharsPerFile) : content;
    return trimmed;
  } catch {
    return null;
  }
}

export async function buildRepositoryContextSummary({
  rootDir = process.cwd(),
  maxFiles = 20,
  maxCharsPerFile = 10000,
} = {}) {
  const collectedFiles = [];
  const rootEntries = await fs.readdir(rootDir, { withFileTypes: true }).catch(() => []);

  for (const entry of rootEntries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    if (entry.isFile()) {
      const relativePath = toPosixPath(entry.name);
      if (shouldIncludeFile(relativePath)) {
        collectedFiles.push(relativePath);
      }
    }
  }

  for (const entry of rootEntries) {
    if (entry.isDirectory() && !EXCLUDED_DIRS.has(entry.name)) {
      await walkDirectory(rootDir, path.join(rootDir, entry.name), collectedFiles);
    }
  }

  const uniqueFiles = [...new Set(collectedFiles)];
  const priorityFiles = uniqueFiles.filter((file) => PRIORITY_FILES.includes(file));
  const otherFiles = uniqueFiles.filter((file) => !priorityFiles.includes(file));
  const selectedFiles = [...priorityFiles, ...otherFiles].slice(0, maxFiles);

  if (!selectedFiles.length) {
    return "";
  }

  const sections = [
    "Repository context: the assistant can inspect the local project files below to answer questions about the codebase.",
    "Use this repository context as a source of truth for implementation details, file structure, and project architecture.",
  ];

  for (const relativePath of selectedFiles) {
    const content = await readFileIfPossible(rootDir, relativePath, maxCharsPerFile);
    if (!content) {
      continue;
    }

    sections.push(`File: ${relativePath}`);
    sections.push(content.trim());
  }

  return sections.join("\n\n");
}
