import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPortfolioContextSummary } from '../lib/portfolio-context.js';

test('buildPortfolioContextSummary includes portfolio context, projects, and tasks', () => {
  const summary = buildPortfolioContextSummary({
    contextText: 'Owner: Mathias. Focus: AI, robotics, and web tools.',
    projects: [
      { title: 'Blob Game', status: 'in progress', category: 'Games' },
    ],
    tasks: [
      { title: 'Learn Python', status: 'planned', priority: 'high', month: 'June' },
    ],
  });

  assert.match(summary, /Owner: Mathias/);
  assert.match(summary, /Blob Game/);
  assert.match(summary, /Learn Python/);
  assert.match(summary, /AI, robotics/);
});
