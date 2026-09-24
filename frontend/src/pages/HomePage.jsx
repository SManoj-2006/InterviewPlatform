import { Link } from "react-router";
import {
  ArrowRightIcon,
  CheckIcon,
  Code2Icon,
  LinkIcon,
  MessageSquareIcon,
  PlayIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TerminalIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
} from "lucide-react";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

const FEATURES = [
  {
    icon: Code2Icon,
    title: "Live collaborative editor",
    text: "Yjs CRDT syncs every keystroke in real time, with per-user cursors and presence colours. No refresh, no conflicts.",
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: VideoIcon,
    title: "HD video + chat",
    text: "Face-to-face video calls and a session chat channel spin up automatically with every interview room.",
    accent: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: TerminalIcon,
    title: "Multi-language execution",
    text: "Run Python, JavaScript and Java in one click through a sandboxed backend proxy. No API keys in the browser.",
    accent: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: CheckIcon,
    title: "Judge-style checking",
    text: "Practice problems with expected outputs and a tested normaliser that grades results like an online judge.",
    accent: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: UsersIcon,
    title: "Session lifecycle",
    text: "Create rooms, join idempotently, hand off participants, and end sessions — hosts stay in control throughout.",
    accent: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure by default",
    text: "Clerk JWTs verified on every API call and on the collaboration WebSocket, plus rate limiting and input validation.",
    accent: "text-accent",
    bg: "bg-accent/10",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create a session",
    text: "Pick a practice problem and difficulty, then create an interview room in one click.",
  },
  {
    n: "02",
    title: "Invite your peer",
    text: "Share the room — your partner joins from the dashboard and video connects automatically.",
  },
  {
    n: "03",
    title: "Code together live",
    text: "Edit the same code in real time, discuss over video, run it, and get judge-style verdicts.",
  },
];

const STACK = ["React 19", "Node.js", "MongoDB", "Yjs CRDT", "Clerk", "Stream", "Wandbox", "Docker"];

function HomePage() {
  return (
    <div className="bg-base-100 text-base-content overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="bg-base-100/80 backdrop-blur-md border-b border-base-300/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
              <SparklesIcon className="size-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono tracking-wider">
                DevIntervue
              </span>
              <span className="text-xs text-base-content/60 font-medium -mt-1">
                Interview together
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <SignInButton mode="modal">
              <button className="btn btn-ghost btn-sm">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="group btn btn-primary btn-sm sm:btn-md rounded-xl shadow-lg hover:shadow-xl transition-all">
                <span>Create account</span>
                <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative">
        {/* ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-20 -right-32 size-96 rounded-full bg-secondary/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 size-72 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT */}
            <div className="space-y-7">
              <div className="badge badge-primary badge-lg gap-2 py-4 px-4 shadow-md">
                <ZapIcon className="size-4" />
                Real-time pair-programming interviews
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Interview together,
                </span>
                <br />
                <span>right in the browser.</span>
              </h1>

              <p className="text-lg lg:text-xl text-base-content/70 leading-relaxed max-w-xl">
                DevIntervue pairs a live collaborative code editor with video, chat and
                one-click code execution — everything a mock technical interview needs,
                in a single room.
              </p>

              <div className="flex flex-wrap gap-3">
                <SignInButton mode="modal">
                  <button className="btn btn-primary btn-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    <PlayIcon className="size-5" />
                    Start coding now
                  </button>
                </SignInButton>
                <a href="#how-it-works" className="btn btn-outline btn-lg rounded-xl">
                  How it works
                </a>
              </div>

              {/* honest highlights */}
              <div className="flex flex-wrap gap-x-8 gap-y-3 pt-2">
                {[
                  ["3", "languages runnable"],
                  ["Live", "CRDT code sync"],
                  ["Free", "to use & deploy"],
                ].map(([value, label]) => (
                  <div key={label} className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary">{value}</span>
                    <span className="text-sm text-base-content/60 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — browser-framed product shot */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 rounded-[2rem] blur-2xl" />
              <div className="relative rounded-2xl border border-base-300 bg-base-200 shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-base-300 bg-base-100">
                  <span className="size-3 rounded-full bg-error/70" />
                  <span className="size-3 rounded-full bg-warning/70" />
                  <span className="size-3 rounded-full bg-success/70" />
                  <span className="ml-3 text-xs font-mono text-base-content/50 truncate">
                    devintervue.onrender.com/session
                  </span>
                </div>
                <img
                  src="/hero.png"
                  alt="DevIntervue live interview session"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* TECH STRIP */}
      <div className="border-y border-base-300/60 bg-base-200/50">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-base-content/40">
            Built with
          </span>
          {STACK.map((tech) => (
            <span key={tech} className="font-mono text-sm font-semibold text-base-content/70">
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-3">
            Features
          </p>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
            Everything a mock interview needs
          </h2>
          <p className="text-lg text-base-content/60">
            One room with a shared editor, video, chat and execution — no tab-switching,
            no screen-share workarounds.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card bg-base-100 border border-base-300/70 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/30 transition-all duration-300"
            >
              <div className="card-body">
                <div className={`size-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`size-6 ${f.accent}`} />
                </div>
                <h3 className="card-title text-lg">{f.title}</h3>
                <p className="text-base-content/65 text-[15px] leading-relaxed">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-base-200/60 border-y border-base-300/60 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-sm font-bold uppercase tracking-widest text-primary mb-3">
              Workflow
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-4">
              From zero to live interview in a minute
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative card bg-base-100 shadow-sm border border-base-300/70">
                <div className="card-body">
                  <span className="font-mono text-5xl font-black text-primary/15 absolute top-4 right-6 select-none">
                    {s.n}
                  </span>
                  <h3 className="card-title text-xl mb-2">{s.title}</h3>
                  <p className="text-base-content/65 text-[15px] leading-relaxed">{s.text}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRightIcon className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 size-8 text-primary/40 bg-base-100 rounded-full p-1 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent p-10 lg:p-16 text-center shadow-2xl">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-20 size-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 size-72 rounded-full bg-black/10 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
              Ready for your mock interview?
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              Create a free account, open a room, and invite a friend — you&apos;ll be
              coding together in under a minute.
            </p>
            <SignUpButton mode="modal">
              <button className="btn btn-lg bg-white text-primary border-0 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all font-bold">
                <MessageSquareIcon className="size-5" />
                Create free account
                <ArrowRightIcon className="size-5" />
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-base-300/60 bg-base-200/40">
        <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <SparklesIcon className="size-5 text-white" />
            </div>
            <div>
              <p className="font-black font-mono tracking-wider leading-none">DevIntervue</p>
              <p className="text-xs text-base-content/50 mt-1">
                BTech final-year project · MERN + Yjs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a
              href="https://github.com/SManoj-2006/InterviewPlatform"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-base-content/60 hover:text-primary transition-colors font-medium"
            >
              <Code2Icon className="size-4" />
              GitHub
            </a>
            <a
              href="https://devintervue.onrender.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-base-content/60 hover:text-primary transition-colors font-medium"
            >
              <LinkIcon className="size-4" />
              Live demo
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
