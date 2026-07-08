function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function summarizeProjects(projects) {
  if (!projects.length) return '';

  const lines = projects.slice(0, 12).map((project) => {
    const title = normalizeText(project?.title) || 'Untitled project';
    const status = normalizeText(project?.status) || 'unknown';
    const category = normalizeText(project?.category) || 'General';
    const progress = typeof project?.progress === 'number' ? ` (${project.progress}% done)` : '';
    const description = normalizeText(project?.description);
    return `- ${title} [${status}${progress}] (${category})${description ? ` — ${description}` : ''}`;
  });

  return `Portfolio projects:\n${lines.join('\n')}`;
}

function summarizeTasks(tasks) {
  if (!tasks.length) return '';

  const lines = tasks.slice(0, 12).map((task) => {
    const title = normalizeText(task?.title) || 'Untitled task';
    const status = normalizeText(task?.status) || 'unknown';
    const priority = normalizeText(task?.priority) || 'medium';
    const month = normalizeText(task?.month) || 'unknown';
    return `- ${title} [${status}, priority: ${priority}, month: ${month}]`;
  });

  return `Current tasks:\n${lines.join('\n')}`;
}

export function buildPortfolioContextSummary({ contextText = '', projects = [], tasks = [] } = {}) {
  const cleanedContext = normalizeText(contextText);
  const projectSummary = summarizeProjects(safeArray(projects));
  const taskSummary = summarizeTasks(safeArray(tasks));

  const sections = [
    'You are answering questions about the portfolio owner and their project workspace.',
    'Use the portfolio context, project list, and task list provided below as the source of truth. If the answer is not supported by the supplied context, say that you do not know rather than inventing details.',
  ];

  if (cleanedContext) {
    sections.push(`Portfolio context:\n${cleanedContext}`);
  }

  if (projectSummary) {
    sections.push(projectSummary);
  }

  if (taskSummary) {
    sections.push(taskSummary);
  }

  return sections.join('\n\n');
}
