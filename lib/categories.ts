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
