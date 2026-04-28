const contactLinks = [
  {
    label: "GitHub",
    href: "https://github.com/Leaferd6712",
    icon: "🐙",
    desc: "See all my code and projects",
    external: true,
  },
  {
    label: "Email",
    href: "mailto:mcmathiaspang@gmail.com",
    icon: "📧",
    desc: "Best way to reach me directly",
    external: false,
  },
  // Add more links here (LinkedIn, Discord, etc.)
];

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="mb-12">
        <span className="text-sky-400 text-sm font-mono uppercase tracking-widest">
          Get in touch
        </span>
        <h1 className="text-4xl font-bold text-white mt-2">Contact</h1>
        <p className="text-zinc-400 mt-3 max-w-xl leading-relaxed">
          Feel free to reach out if you want to collaborate, have a question,
          or just want to say hi.
        </p>
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contactLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            className="group flex items-center gap-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-sky-500/40 rounded-xl p-5 transition-all"
          >
            <span className="text-3xl">{link.icon}</span>
            <div>
              <p className="text-white font-semibold group-hover:text-sky-400 transition-colors">
                {link.label}
              </p>
              <p className="text-zinc-500 text-sm">{link.desc}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Availability note */}
      <div className="mt-10 p-5 bg-zinc-900 rounded-xl border border-zinc-800">
        <p className="text-zinc-400 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
          Currently open to collaborations and interesting projects.
        </p>
      </div>
    </div>
  );
}
