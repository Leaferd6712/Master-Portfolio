import type { Project } from "@/components/ProjectCard";
import type { SiteTab } from "@/lib/api";

export interface CategoryNode {
  label: string;
  href: string;
  icon: string;
  desc: string;
  depth: number;
  path: string[];
}

export function flattenTabs(tabs: SiteTab[], depth = 0, parentPath: string[] = []): CategoryNode[] {
  return tabs.flatMap((tab) => {
    const path = [...parentPath, tab.label];
    return [
      {
        label: tab.label,
        href: tab.href,
        icon: tab.icon,
        desc: tab.desc,
        depth,
        path,
      },
      ...flattenTabs(tab.children ?? [], depth + 1, path),
    ];
  });
}

export function projectMatchesCategory(project: Project, category: string): boolean {
  if (category === "All") return true;
  const path = project.subcategoryPath ?? [];
  return project.category === category || path.includes(category);
}

export function publicProjects(projects: Project[]): Project[] {
  return projects.filter((project) => project.visibility !== "draft");
}

function collectDescendantLabels(tab: SiteTab): string[] {
  const labels = [tab.label];
  for (const child of tab.children ?? []) {
    labels.push(...collectDescendantLabels(child));
  }
  return labels;
}

export function buildDescendantLabelMap(tabs: SiteTab[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  function visit(nodes: SiteTab[]) {
    for (const node of nodes) {
      map[node.label] = Array.from(new Set(collectDescendantLabels(node)));
      visit(node.children ?? []);
    }
  }

  visit(tabs);
  return map;
}
