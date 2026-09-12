import { ArrowRight, Bookmark, BookOpen, BrainCircuit, FlaskConical, Target, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useBookmarks } from "@/hooks/useBookmarks";
import { INFINITE_PRACTICE_BATCHES } from "@/hooks/useInfinitePractice";

export default function Home() {
  const { bookmarks } = useBookmarks();

  usePageMeta({
    title: "Infinite Practice | Wegenz",
    description: "Choose your exam and class to start unlimited focused question practice on Wegenz.",
  });

  return (
    <div className="min-h-screen w-full bg-white text-slate-900">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-base shadow-sm shadow-indigo-200">
              W
            </span>
            <div>
              <span className="text-base font-black tracking-tight text-slate-950">
                Wegenz <span className="text-indigo-600">Practice</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                170,000+ PYQs
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/practice/11th_JEE?bookmarks=open"
              data-testid="link-home-saved-bookmarks"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 transition hover:bg-amber-100 shadow-xs cursor-pointer"
              title="Open your saved bookmarked questions"
            >
              <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
              <span>Saved Bookmarks {bookmarks.length > 0 ? `(${bookmarks.length})` : ""}</span>
            </Link>
            <div
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs shadow-xs"
              title="All systems operational"
            >
              <span className="status-dot-wrapper">
                <span className="status-dot"></span>
              </span>
              <span className="font-['JetBrains_Mono',monospace] text-[11px] font-semibold tracking-tight text-emerald-800">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 p-6 sm:p-10 relative">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between relative z-10">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
                <BrainCircuit className="h-3.5 w-3.5" /> Focused Question Simulator
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Infinite Practice<span className="text-indigo-600">.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Choose your exam and class, select subjects and chapters, and generate unlimited custom practice sets with instant solutions and video solutions.
              </p>
            </div>
            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 sm:flex">
              <Target className="h-10 w-10" />
            </div>
          </div>
        </section>

        <div className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Choose your track</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">What are you preparing for?</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {INFINITE_PRACTICE_BATCHES.map((batch) => {
              const isJee = batch.name.includes("JEE");
              return (
                <Link
                  key={batch.id}
                  href={`/practice/${batch.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100"
                >
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                      isJee ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    {isJee ? <BookOpen className="h-7 w-7" /> : <FlaskConical className="h-7 w-7" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-slate-900">{batch.name}</span>
                    <span className="mt-1 block text-sm text-slate-500">{batch.detail}</span>
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Real-time Timers</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Configurable 1m, 2m, or 3m time limits per question to simulate realistic exam pressure.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">KaTeX Math & Formulas</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Crisp mathematical symbols, chemical formulas, and structural formulas rendered instantly.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Complete Explanations</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Detailed step-by-step text solutions and direct links to full video solutions.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
