import Link from "next/link";

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "finished" | "in progress" | "planned";
  github?: string;
  demo?: string;
  image?: string;
  techs: string[];
}

const statusStyles: Record<string, string> = {
  finished:
    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  "in progress":
    "bg-sky-500/15 text-sky-400 border border-sky-500/25",
  planned:
    "bg-zinc-700/40 text-zinc-400 border border-zinc-600/30",
};

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group flex flex-col bg-zinc-900 rounded-xl border border-zinc-800 hover:border-sky-500/40 transition-all duration-300 overflow-hidden">
      {/* Thumbnail */}
      <Link
        href={`/projects/${project.id}`}
        className="h-44 bg-zinc-800 flex items-center justify-center overflow-hidden"
      >
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 7h18M3 12h18M3 17h18"
              />
            </svg>
            <span className="text-xs">{project.category}</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Title + status */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-white font-semibold text-base leading-snug">
            <Link
              href={`/projects/${project.id}`}
              className="hover:text-sky-300 transition-colors"
            >
              {project.title}
            </Link>
          </h3>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
              statusStyles[project.status] ?? statusStyles.planned
            }`}
          >
            {project.status}
          </span>
        </div>

        {/* Description */}
        <p className="text-zinc-400 text-sm leading-relaxed flex-1 line-clamp-3">
          {project.description}
        </p>

        {/* Tech stack */}
        <div className="flex flex-wrap gap-1.5">
          {project.techs.map((tech) => (
            <span
              key={tech}
              className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-700"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex gap-4 mt-auto pt-1">
          <Link
            href={`/projects/${project.id}`}
            className="text-sm text-zinc-300 hover:text-white transition-colors font-medium"
          >
            Details →
          </Link>
          {project.github && (
            <Link
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-sky-400 hover:text-sky-300 transition-colors font-medium"
            >
              GitHub →
            </Link>
          )}
          {project.demo && (
            <Link
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Live Demo →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
