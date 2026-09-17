import { ArrowRight, Bookmark, BookOpen, BrainCircuit, FlaskConical, Target, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useBookmarks } from "@/hooks/useBookmarks";
import { INFINITE_PRACTICE_BATCHES } from "@/hooks/useInfinitePractice";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const { bookmarks } = useBookmarks();

  usePageMeta({
    title: "JEE & NEET Practice Engine | 170k+ Free Sample Questions & Mocks — Wegenz",
    description: "Free chapterwise question practice simulator and mock test engine for JEE Main, JEE Advanced, and NEET. Practise 170,000+ high-yield sample questions, curated drills, and authentic PYQs with real exam timers and KaTeX solutions.",
    canonical: "/",
    ogImage: "/wegenz-wordmark.jpg",
  });

  return (
    <div className="min-h-screen w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur sticky top-0 z-50 transition-colors">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/wegenz-primary-mark-96.webp"
              alt="Wegenz Logo"
              width="36"
              height="36"
              decoding="async"
              className="h-9 w-9 rounded-xl object-cover shadow-sm shadow-indigo-200 dark:shadow-indigo-950 border border-slate-200/50 dark:border-slate-800"
            />
            <div>
              <span className="text-base font-black tracking-tight text-slate-950 dark:text-white">
                Wegenz <span className="text-indigo-600 dark:text-indigo-400">Practice</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 px-2 py-0.5 rounded-full">
                170,000+ Questions &amp; Mocks
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link
              href="/practice/11th_JEE?bookmarks=open"
              data-testid="link-home-saved-bookmarks"
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-300 transition hover:bg-amber-100 dark:hover:bg-amber-900/40 shadow-xs cursor-pointer"
              title="Open your saved bookmarked questions"
            >
              <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-600 dark:text-amber-400" />
              <span>Saved Bookmarks {bookmarks.length > 0 ? `(${bookmarks.length})` : ""}</span>
            </Link>
            <a
              href="https://pyqs.wegenz.in/"
              target="_blank"
              rel="noopener"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 transition hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-xs cursor-pointer"
              title="Explore official PYQ shift papers & chapter weightage analytics on PYQBox"
            >
              <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Official PYQs &amp; Shifts (PYQBox)</span>
            </a>
            <div
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-xs shadow-xs"
              title="All systems operational"
            >
              <span className="status-dot-wrapper">
                <span className="status-dot"></span>
              </span>
              <span className="font-['JetBrains_Mono',monospace] text-[11px] font-semibold tracking-tight text-emerald-800 dark:text-emerald-300">
                All Systems Operational
              </span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-indigo-100 dark:border-slate-800 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950/40 p-6 sm:p-10 relative shadow-xs">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between relative z-10">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 shadow-sm">
                <BrainCircuit className="h-3.5 w-3.5" /> ⚡ Infinite Practice, Sample Questions &amp; CBT Mock Simulator
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                JEE &amp; NEET Practice &amp; Test Engine<span className="text-indigo-600 dark:text-indigo-400">.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
                Practise 170,000+ high-yield sample questions, curated chapterwise problem sets, and authentic previous year questions. Build custom test sessions with real CBT timers, challenge codes, instant KaTeX solutions, and video solutions.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href="https://pyqs.wegenz.in/"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Looking specifically for official exam shift papers, year filters (2002–2026) &amp; weightage analytics? Explore Wegenz PYQBox &rarr;
                </a>
              </div>
            </div>
            <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 sm:flex">
              <Target className="h-10 w-10" />
            </div>
          </div>
        </section>

        <div className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Choose your track</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">What are you preparing for? JEE &amp; NEET Practice Tracks</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {INFINITE_PRACTICE_BATCHES.map((batch) => {
              const isJee = batch.name.includes("JEE");
              return (
                <Link
                  key={batch.id}
                  href={`/practice/${batch.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-100 dark:hover:shadow-none"
                >
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                      isJee
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                        : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isJee ? <BookOpen className="h-7 w-7" /> : <FlaskConical className="h-7 w-7" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-slate-900 dark:text-white">{batch.name}</span>
                    <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{batch.detail}</span>
                  </span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Real-time Timers</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Configurable 1m, 2m, or 3m time limits per question to simulate realistic exam pressure.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-3">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">KaTeX Math &amp; Formulas</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Crisp mathematical symbols, chemical formulas, and structural formulas rendered instantly.
            </p>
          </div>
          <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mb-3">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Complete Explanations</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Detailed step-by-step text solutions and direct links to full video solutions.
            </p>
          </div>
        </section>

        {/* Semantic FAQ & Knowledge Base for Search Engine Ranking */}
        <section className="mt-16 border-t border-slate-100 dark:border-slate-800/80 pt-10">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Frequently Asked Questions</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Mastering JEE &amp; NEET PYQ Practice</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">How do I practice JEE Main and JEE Advanced PYQs on Wegenz?</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Select Class 11th or 12th JEE, pick your target chapters across Physics, Chemistry, and Mathematics, set your desired question count, and practice under real CBT exam conditions with per-question timers.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Is Wegenz Infinite Practice completely free?</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Yes, 100% free with unlimited custom practice sets, detailed KaTeX step-by-step explanations, and comprehensive video solutions for every question without any paywall.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Can I practice previous year questions chapterwise?</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Yes, you can filter and select specific chapters across single or multiple subjects simultaneously, allowing focused revision on your high-yield chapters.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Can I challenge friends to the exact same test?</h3>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Every generated practice session produces a unique share code. Share the challenge link with peers to take the identical question set and compare score, accuracy, and pace.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
