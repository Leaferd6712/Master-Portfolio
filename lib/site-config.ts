import type { SiteSettings, SiteTab, TimeframeOption } from "@/lib/api";

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  "1 week",
  "2 weeks",
  "3 weeks",
  "4 weeks",
];

export const DEFAULT_SITE_TABS: SiteTab[] = [
  {
    label: "AI / ML",
    href: "/projects?category=AI%20%2F%20ML",
    icon: "🧠",
    desc: "YOLO models, classifiers, vision systems, and neural nets.",
    showInNav: true,
    showInInterests: true,
    children: [
      {
        label: "AI",
        href: "/projects?category=AI",
        icon: "",
        desc: "Applied AI systems and experiments.",
        showInNav: false,
        showInInterests: false,
        children: [],
      },
      {
        label: "ML / Vision",
        href: "/projects?category=ML%20%2F%20Vision",
        icon: "",
        desc: "Object detection and segmentation work.",
        showInNav: false,
        showInInterests: false,
        children: [
          {
            label: "Object detection models",
            href: "/projects?category=Object%20detection%20models",
            icon: "",
            desc: "Detection pipelines and model experiments.",
            showInNav: false,
            showInInterests: false,
            children: [],
          },
          {
            label: "Instance segmentation models",
            href: "/projects?category=Instance%20segmentation%20models",
            icon: "",
            desc: "Segmentation systems and mask-based experiments.",
            showInNav: false,
            showInInterests: false,
            children: [],
          },
        ],
      },
    ],
  },
  {
    label: "Games",
    href: "/projects?category=Games",
    icon: "🎮",
    desc: "Interactive games, simulations, and playful prototypes.",
    showInNav: true,
    showInInterests: true,
    children: [],
  },
  {
    label: "CAD",
    href: "/projects?category=CAD",
    icon: "📐",
    desc: "3D design, prints, prototypes, and Fusion 360 builds.",
    showInNav: true,
    showInInterests: true,
    children: [],
  },
  {
    label: "Backend",
    href: "/projects?category=Backend",
    icon: "⚙️",
    desc: "APIs, tools, dashboards, and server-side systems.",
    showInNav: true,
    showInInterests: true,
    children: [],
  },
  {
    label: "Tools",
    href: "/projects?category=Tools",
    icon: "🧰",
    desc: "Utilities, mini web apps, and practical automation.",
    showInNav: true,
    showInInterests: true,
    children: [],
  },
  {
    label: "Notes",
    href: "/notes",
    icon: "📝",
    desc: "Project notes and technical write-ups.",
    showInNav: true,
    showInInterests: false,
    children: [],
  },
  {
    label: "Contact",
    href: "/contact",
    icon: "@",
    desc: "Get in touch.",
    showInNav: true,
    showInInterests: false,
    children: [],
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  tabs: DEFAULT_SITE_TABS,
};

export function cloneSiteTabs(tabs: SiteTab[]): SiteTab[] {
  return tabs.map((tab) => ({
    ...tab,
    children: cloneSiteTabs(tab.children ?? []),
  }));
}

export function cloneDefaultSiteTabs(): SiteTab[] {
  return cloneSiteTabs(DEFAULT_SITE_TABS);
}

export function normalizeDashboardSaveError(message: string): string {
  if (message.includes("Invalid auth token") || message.includes("Missing auth token")) {
    return "Your dashboard session expired. Sign in again, then retry saving.";
  }
  if (message.includes("Cannot reach backend")) {
    return "The dashboard could not reach the backend. Check BACKEND_API_URL or your local backend tunnel, then retry.";
  }
  return message;
}