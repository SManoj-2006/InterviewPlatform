import { useUser } from "@clerk/clerk-react";
import { ArrowRightIcon, SparklesIcon, ZapIcon } from "lucide-react";

function WelcomeSection({ onCreateSession }) {
  const { user } = useUser();

  return (
    <div className="relative overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-10 size-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-tight">
                Welcome back, {user?.firstName || "there"}!
              </h1>
              <p className="text-lg text-base-content/60 mt-2">
                Ready to level up your coding skills?
              </p>
            </div>
          </div>
          <button
            onClick={onCreateSession}
            className="group shrink-0 px-8 py-4 bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center gap-3 text-white font-bold text-lg">
              <ZapIcon className="w-6 h-6" />
              <span>Create Session</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeSection;
