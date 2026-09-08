import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import renderMathInElement from "katex/contrib/auto-render";
import "katex/dist/katex.min.css";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock,
  Copy,
  ExternalLink,
  FileQuestion,
  FlaskConical,
  Loader2,
  Minus,
  MinusCircle,
  Play,
  Plus,
  RotateCcw,
  Scale,
  Share2,
  ShieldAlert,
  Sliders,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageMeta } from "@/hooks/usePageMeta";
import {
  INFINITE_PRACTICE_BATCHES,
  useGetSharedInfinitePractice,
  useInfinitePracticeMultiSubjectChapters,
  useInfinitePracticeSubjects,
  useInfinitePracticeSolution,
  useShareInfinitePractice,
  useStartInfinitePractice,
  useSubmitInfinitePractice,
  type InfinitePracticeChapter,
  type InfinitePracticeQuestion,
  type InfinitePracticeQuestionSolution,
  type InfinitePracticeTestSolution,
  type InfinitePracticeSubject,
  type SubmitInfinitePracticeInput,
} from "@/hooks/useInfinitePractice";

type RoomState = "selection" | "question" | "complete";

const QUESTION_PRESETS = [5, 10, 15, 20, 25, 30, 45, 60, 75, 90, 100];
const DIFFICULTIES = [
  { value: 1, label: "Easy", detail: "Build confidence" },
  { value: 2, label: "Medium", detail: "Stay exam-ready" },
  { value: 3, label: "Hard", detail: "Stretch your ceiling" },
];
const QUESTION_TYPES = [
  { value: 1, label: "Single Choice (SCQ)", detail: "One correct option" },
  { value: 2, label: "Multiple Choice (MCQ)", detail: "One or more correct" },
  { value: 3, label: "Numerical / Integer", detail: "Exact number or decimal" },
  { value: 8, label: "Comprehension", detail: "Passage-based" },
  { value: 6, label: "Fill in the Blanks", detail: "Cloze type" },
];
const TIME_LIMIT_OPTIONS = [
  { value: 0, label: "No Limit", detail: "Practise freely" },
  { value: 60, label: "1 min / Q", detail: "Speed challenge (60s)" },
  { value: 120, label: "2 mins / Q", detail: "JEE / NEET standard (120s)" },
  { value: 180, label: "3 mins / Q", detail: "Deep analytical (180s)" },
];

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatClock(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function stripUnsafeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/<div class="[^"]*min-h-\[46px\][^"]*">[\s\S]*?<\/div>/gi, "")
    .replace(/<div class="[^"]*data-edge="true"[^"]*">[\s\S]*?<\/div>/gi, "");
}

function mathmlTextToTex(value: string) {
  return value
    .replace(/−/g, "-")
    .replace(/×/g, "\\times ")
    .replace(/⋅/g, "\\cdot ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/∞/g, "\\infty ")
    .replace(/π/g, "\\pi ")
    .replace(/θ/g, "\\theta ")
    .replace(/α/g, "\\alpha ")
    .replace(/β/g, "\\beta ")
    .replace(/γ/g, "\\gamma ")
    .replace(/Δ/g, "\\Delta ")
    .replace(/∑/g, "\\sum ")
    .replace(/∏/g, "\\prod ")
    .replace(/∈/g, "\\in ")
    .replace(/∉/g, "\\notin ")
    .replace(/∴/g, "\\therefore ");
}

function mathmlNodeToTex(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return mathmlTextToTex(node.textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as Element;
  const tag = element.localName.toLowerCase();
  const children = Array.from(element.childNodes);
  const meaningfulChildren = children.filter((child) => {
    if (child.nodeType !== Node.ELEMENT_NODE) return child.textContent?.trim();
    const childTag = (child as Element).localName.toLowerCase();
    return childTag !== "none" && childTag !== "mprescripts";
  });
  const childTex = (index: number) => mathmlNodeToTex(meaningfulChildren[index]);
  const allTex = meaningfulChildren.map((child) => mathmlNodeToTex(child)).join("");

  switch (tag) {
    case "math":
    case "mrow":
    case "mstyle":
    case "semantics":
    case "mphantom":
    case "menclose":
      return allTex;
    case "annotation":
    case "annotation-xml":
      return "";
    case "mi":
    case "mn":
    case "mtext":
    case "mo":
      return mathmlTextToTex(element.textContent || "");
    case "mfrac":
      return `\\frac{${childTex(0)}}{${childTex(1)}}`;
    case "msup":
      return `${childTex(0)}^{${childTex(1)}}`;
    case "msub":
      return `${childTex(0)}_{${childTex(1)}}`;
    case "msubsup":
      return `${childTex(0)}_{${childTex(1)}}^{${childTex(2)}}`;
    case "msqrt":
      return `\\sqrt{${allTex}}`;
    case "mroot":
      return `\\sqrt[${childTex(1)}]{${childTex(0)}}`;
    case "mfenced": {
      const open = element.getAttribute("open") ?? "(";
      const close = element.getAttribute("close") ?? ")";
      const separator = element.getAttribute("separators")?.[0] ?? ",";
      const body = meaningfulChildren
        .map((child) => mathmlNodeToTex(child))
        .join(separator);
      return `\\left${open}${body}\\right${close}`;
    }
    case "mover":
      return `\\overset{${childTex(1)}}{${childTex(0)}}`;
    case "munder":
      return `\\underset{${childTex(1)}}{${childTex(0)}}`;
    case "munderover":
      return `\\underset{${childTex(1)}}{\\overset{${childTex(2)}}{${childTex(0)}}}`;
    case "mspace":
      return "\\ ";
    case "mtable":
      return `\\begin{matrix}${Array.from(element.children)
        .map((row) => mathmlNodeToTex(row))
        .join("\\\\") }\\end{matrix}`;
    case "mtr":
      return Array.from(element.children).map((cell) => mathmlNodeToTex(cell)).join(" & ");
    case "mtd":
      return allTex;
    case "mmultiscripts": {
      const base = mathmlNodeToTex(children[0]);
      const postSub = children[1] && (children[1] as Element).localName?.toLowerCase() !== "none"
        ? mathmlNodeToTex(children[1])
        : "";
      const postSup = children[2] && (children[2] as Element).localName?.toLowerCase() !== "none"
        ? mathmlNodeToTex(children[2])
        : "";
      const prescriptMarker = children.findIndex(
        (child) =>
          child.nodeType === Node.ELEMENT_NODE &&
          (child as Element).localName.toLowerCase() === "mprescripts",
      );
      const preSubNode = prescriptMarker === -1 ? undefined : children[prescriptMarker + 1];
      const preSupNode = prescriptMarker === -1 ? undefined : children[prescriptMarker + 2];
      const preSub = preSubNode && (preSubNode as Element).localName?.toLowerCase() !== "none"
        ? mathmlNodeToTex(preSubNode)
        : "";
      const preSup = preSupNode && (preSupNode as Element).localName?.toLowerCase() !== "none"
        ? mathmlNodeToTex(preSupNode)
        : "";
      return `${preSup ? `^{${preSup}}` : ""}${preSub ? `_{${preSub}}` : ""}${base}${postSub ? `_{${postSub}}` : ""}${postSup ? `^{${postSup}}` : ""}`;
    }
    default:
      return allTex;
  }
}

function normalizeEscapedLatexText(value: string) {
  let normalized = value;
  let previous = "";
  while (normalized !== previous) {
    previous = normalized;
    normalized = normalized.replace(/\\\\(?=[A-Za-z()[\]$])/g, "\\");
  }
  return normalized;
}

function normalizeMathContent(html?: string) {
  if (!html || typeof DOMParser === "undefined") return html || "";

  const sanitized = stripUnsafeHtml(html);
  const parsed = new DOMParser().parseFromString(`<div>${sanitized}</div>`, "text/html");
  const container = parsed.body.firstElementChild;
  if (!container) return sanitized;

  container.querySelectorAll("math").forEach((math) => {
    const tex = mathmlNodeToTex(math).replace(/\s+/g, " ").trim();
    if (!tex) return;
    const display = math.getAttribute("display") === "block";
    const left = display ? "\\[" : "\\(";
    const right = display ? "\\]" : "\\)";
    math.replaceWith(parsed.createTextNode(`${left}${tex}${right}`));
  });

  const normalizeTextNodes = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent = normalizeEscapedLatexText(node.textContent || "");
      return;
    }
    Array.from(node.childNodes).forEach(normalizeTextNodes);
  };
  normalizeTextNodes(container);

  return container.innerHTML;
}

function HtmlContent({
  html,
  className = "",
  testId,
}: {
  html?: string;
  className?: string;
  testId?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const normalizedHtml = useMemo(() => normalizeMathContent(html), [html]);

  useLayoutEffect(() => {
    if (!contentRef.current) return;

    contentRef.current.innerHTML = normalizedHtml;
    renderMathInElement(contentRef.current, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
      strict: false,
      trust: false,
    });
  }, [normalizedHtml]);

  if (!normalizedHtml) return null;
  return (
    <div
      ref={contentRef}
      className={`practice-html [&_img]:mx-auto [&_img]:max-w-full [&_img]:object-contain [&_p]:mb-2 [&_table]:max-w-full [&_table]:overflow-auto ${className}`}
      data-testid={testId}
    />
  );
}

const SUBJECT_ICON_MAP: Record<string, string> = {
  chemistry: "https://penpencil-static-content.s3.ap-south-1.amazonaws.com/5b09189f7285894d9130ccd0/wii0tbw6xlxlev54ytfq5ue9v.png",
  physics: "https://penpencil-static-content.s3.ap-south-1.amazonaws.com/5b09189f7285894d9130ccd0/gqke5anv3yz429uazlutc2b6e.png",
  botany: "https://penpencil-static-content.s3.ap-south-1.amazonaws.com/5b09189f7285894d9130ccd0/c61pj6j1mv53n7l8hxx4fj2zn.png",
  zoology: "https://penpencil-static-content.s3.ap-south-1.amazonaws.com/5b09189f7285894d9130ccd0/5nv6tyhods9vnjekijembhhyl.png",
  maths: "https://penpencil-static-content.s3.ap-south-1.amazonaws.com/5b09189f7285894d9130ccd0/pxop6t8zw4q5faxhnz9puzigr.png",
  mathematics: "https://penpencil-static-content.s3.ap-south-1.amazonaws.com/5b09189f7285894d9130ccd0/pxop6t8zw4q5faxhnz9puzigr.png",
  biology: "https://penpencil-static-content.s3.ap-south-1.amazonaws.com/5b09189f7285894d9130ccd0/c61pj6j1mv53n7l8hxx4fj2zn.png",
};

function getSubjectIconUrl(name: string): string | null {
  const lower = name.toLowerCase().trim();
  for (const [key, url] of Object.entries(SUBJECT_ICON_MAP)) {
    if (lower.includes(key)) return url;
  }
  return null;
}

function subjectIcon(subject: InfinitePracticeSubject) {
  const customUrl = getSubjectIconUrl(subject.englishName) || (subject.icon && subject.icon.startsWith("http") ? subject.icon : null);
  if (customUrl) {
    return <img src={customUrl} alt={subject.englishName} className="h-7 w-7 object-contain" />;
  }
  const name = subject.englishName.toLowerCase();
  if (name.includes("physics")) return <Zap className="h-5 w-5 text-amber-500" />;
  if (name.includes("chem")) return <FlaskConical className="h-5 w-5 text-emerald-500" />;
  return <Target className="h-5 w-5 text-indigo-500" />;
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-rose-200 bg-white px-6 text-center"
      data-testid="state-practice-error"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <CircleHelp className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900">Could not load Infinite Practice</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{message}</p>
      <button
        data-testid="button-practice-retry"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
      >
        <RotateCcw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}

function ChapterRow({
  chapter,
  selected,
  onClick,
}: {
  chapter: InfinitePracticeChapter;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      data-testid={`button-chapter-${chapter.chapterId}`}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
        selected
          ? "border-indigo-500 bg-indigo-50 text-indigo-950"
          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-transparent"
        }`}
      >
        <Check className="h-3 w-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{chapter.englishName}</span>
        <span className="mt-0.5 block text-[11px] text-slate-500">
          {Number(chapter.questionCount || 0).toLocaleString("en-IN")} questions
        </span>
      </span>
    </button>
  );
}

function SelectionPanel({
  batchId,
  batchName,
  sharedCode,
  onStarted,
}: {
  batchId: string;
  batchName: string;
  sharedCode?: string | null;
  onStarted: (
    session: { testId: string; questions: InfinitePracticeQuestion[] },
    timeLimitSeconds: number,
  ) => void;
}) {
  const subjectsQuery = useInfinitePracticeSubjects(batchId);
  const startPractice = useStartInfinitePractice(batchId);
  const sharedQuery = useGetSharedInfinitePractice(sharedCode);
  const subjects = subjectsQuery.data?.data.subjects ?? [];

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  
  // Total questions count (1 - 100)
  const [totalQuestionCount, setTotalQuestionCount] = useState<number>(15);
  // Allocation mode: "EQUAL" | "CUSTOM"
  const [allocationMode, setAllocationMode] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  // Per-subject question counts map (subjectId -> count)
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState<Record<string, number>>({});

  const [difficulty, setDifficulty] = useState<number[]>([1, 2, 3]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([1, 2, 3, 6, 8]);
  const [timeLimit, setTimeLimit] = useState(0);

  // Initialize with first subject when subjects load if none selected
  useEffect(() => {
    if (subjects.length > 0 && selectedSubjectIds.length === 0 && !sharedCode) {
      setSelectedSubjectIds([subjects[0].subjectId]);
    }
  }, [subjects, sharedCode]);

  // Keep subjectQuestionCounts in sync with selectedSubjectIds and totalQuestionCount
  useEffect(() => {
    if (selectedSubjectIds.length === 0) {
      setSubjectQuestionCounts({});
      return;
    }

    if (allocationMode === "EQUAL") {
      const activeCount = selectedSubjectIds.length;
      const base = Math.floor(totalQuestionCount / activeCount);
      const rem = totalQuestionCount % activeCount;

      const nextCounts: Record<string, number> = {};
      selectedSubjectIds.forEach((sId, index) => {
        nextCounts[sId] = base + (index < rem ? 1 : 0);
      });
      setSubjectQuestionCounts(nextCounts);
    } else {
      // In CUSTOM mode, preserve existing values or assign fallback
      setSubjectQuestionCounts((prev) => {
        const next = { ...prev };
        selectedSubjectIds.forEach((sId) => {
          if (typeof next[sId] !== "number") {
            next[sId] = Math.max(1, Math.floor(totalQuestionCount / selectedSubjectIds.length));
          }
        });
        // Remove deselected subjects
        Object.keys(next).forEach((sId) => {
          if (!selectedSubjectIds.includes(sId)) {
            delete next[sId];
          }
        });
        return next;
      });
    }
  }, [selectedSubjectIds, totalQuestionCount, allocationMode]);

  // Total active questions calculation
  const effectiveTotalQuestions = useMemo(() => {
    if (allocationMode === "CUSTOM") {
      return Object.values(subjectQuestionCounts).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }
    return totalQuestionCount;
  }, [allocationMode, subjectQuestionCounts, totalQuestionCount]);

  // Fetch chapters for all selected subjects concurrently
  const chaptersQueries = useInfinitePracticeMultiSubjectChapters(selectedSubjectIds, batchId);

  // Group chapters by subject
  const subjectChaptersMap = useMemo(() => {
    const map: Record<
      string,
      {
        subject: InfinitePracticeSubject;
        chapters: InfinitePracticeChapter[];
        isLoading: boolean;
        isError: boolean;
      }
    > = {};

    selectedSubjectIds.forEach((sId, idx) => {
      const subj = subjects.find((s) => s.subjectId === sId);
      if (!subj) return;
      const query = chaptersQueries[idx];
      map[sId] = {
        subject: subj,
        chapters: query?.data?.chapters || [],
        isLoading: query ? query.isLoading : true,
        isError: query ? query.isError : false,
      };
    });
    return map;
  }, [selectedSubjectIds, subjects, chaptersQueries]);

  // Flat list of all available chapters across selected subjects
  const allAvailableChapters = useMemo(() => {
    const list: InfinitePracticeChapter[] = [];
    selectedSubjectIds.forEach((sId) => {
      const data = subjectChaptersMap[sId];
      if (data?.chapters) {
        list.push(...data.chapters);
      }
    });
    return list;
  }, [selectedSubjectIds, subjectChaptersMap]);

  // Selected chapters details for starting test
  const allSelectedChapters = useMemo(() => {
    const list: Array<{
      chapterId: string;
      classId: string;
      chapterName: string;
      subjectId: string;
      subjectName: string;
    }> = [];

    selectedSubjectIds.forEach((sId) => {
      const data = subjectChaptersMap[sId];
      if (!data) return;
      data.chapters.forEach((ch) => {
        if (chapterIds.includes(ch.chapterId)) {
          list.push({
            chapterId: ch.chapterId,
            classId: ch.classId,
            chapterName: ch.englishName,
            subjectId: sId,
            subjectName: data.subject.englishName,
          });
        }
      });
    });
    return list;
  }, [selectedSubjectIds, subjectChaptersMap, chapterIds]);

  const toggleSubject = (sId: string) => {
    setSelectedSubjectIds((current) => {
      if (current.includes(sId)) {
        const subjChapters = subjectChaptersMap[sId]?.chapters || [];
        const removeSet = new Set(subjChapters.map((c) => c.chapterId));
        setChapterIds((prev) => prev.filter((id) => !removeSet.has(id)));
        return current.filter((id) => id !== sId);
      } else {
        return [...current, sId];
      }
    });
  };

  const selectAllSubjects = () => {
    setSelectedSubjectIds(subjects.map((s) => s.subjectId));
  };

  const clearAllSubjects = () => {
    setSelectedSubjectIds([]);
    setChapterIds([]);
  };

  const toggleChapter = (chapterId: string) => {
    setChapterIds((current) =>
      current.includes(chapterId)
        ? current.filter((item) => item !== chapterId)
        : [...current, chapterId],
    );
  };

  const selectAllForSubject = (sId: string) => {
    const subjChapters = subjectChaptersMap[sId]?.chapters || [];
    const newIds = subjChapters.map((c) => c.chapterId);
    setChapterIds((prev) => Array.from(new Set([...prev, ...newIds])));
  };

  const clearForSubject = (sId: string) => {
    const subjChapters = subjectChaptersMap[sId]?.chapters || [];
    const removeSet = new Set(subjChapters.map((c) => c.chapterId));
    setChapterIds((prev) => prev.filter((id) => !removeSet.has(id)));
  };

  const selectAllChaptersGlobally = () => {
    setChapterIds(allAvailableChapters.map((ch) => ch.chapterId));
  };

  const clearAllChaptersGlobally = () => {
    setChapterIds([]);
  };

  const toggleDifficulty = (value: number) => {
    setDifficulty((current) => {
      if (current.includes(value)) {
        return current.length === 1 ? current : current.filter((item) => item !== value);
      }
      return [...current, value].sort();
    });
  };

  const toggleType = (typeVal: number) => {
    setSelectedTypes((current) => {
      if (current.includes(typeVal)) {
        return current.length === 1 ? current : current.filter((item) => item !== typeVal);
      }
      return [...current, typeVal].sort();
    });
  };

  const updateSubjectCount = (sId: string, count: number) => {
    const validCount = Math.max(0, Math.min(100, count));
    setSubjectQuestionCounts((prev) => ({
      ...prev,
      [sId]: validCount,
    }));
  };

  const start = () => {
    if (selectedSubjectIds.length === 0 || allSelectedChapters.length === 0) return;
    if (effectiveTotalQuestions <= 0) return;

    const selectedSubjects = subjects.filter((s) => selectedSubjectIds.includes(s.subjectId));

    startPractice.mutate(
      {
        subjectIds: selectedSubjectIds,
        subjectNames: selectedSubjects.map((s) => s.englishName),
        chapters: allSelectedChapters,
        questionsCount: effectiveTotalQuestions,
        subjectQuestionCounts: allocationMode === "CUSTOM" ? subjectQuestionCounts : undefined,
        difficultyLevel: difficulty,
        questionTypes: selectedTypes,
        language: "English",
      },
      {
        onSuccess: (sessionData) => {
          onStarted(sessionData, timeLimit);
        },
      },
    );
  };

  const startSharedTestNow = () => {
    if (!sharedQuery.data) return;
    onStarted(
      {
        testId: `shared-${sharedQuery.data.code}-${Date.now()}`,
        questions: sharedQuery.data.questions,
      },
      sharedQuery.data.timeLimitSeconds,
    );
  };

  const noFreeSessions =
    startPractice.error instanceof Error &&
    /no free sessions left/i.test(startPractice.error.message);

  if (subjectsQuery.isLoading) {
    return (
      <div className="space-y-5" data-testid="state-practice-loading">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    );
  }

  if (subjectsQuery.isError) {
    return <ErrorState message={subjectsQuery.error.message} onRetry={() => subjectsQuery.refetch()} />;
  }

  if (subjects.length === 0) {
    return (
      <div
        className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center"
        data-testid="state-practice-empty"
      >
        <BookOpen className="mb-4 h-10 w-10 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-900">No practice subjects are available</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          This practice catalog does not have published subjects for {batchName} yet.
        </p>
      </div>
    );
  }

  const isMultiSubject = selectedSubjectIds.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 pb-16 lg:pb-0"
      data-testid="panel-practice-selection"
    >
      {/* Shared Test Challenge Banner */}
      {sharedQuery.data && (
        <div className="overflow-hidden rounded-3xl border-2 border-indigo-500 bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-6 shadow-md">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                <Users className="h-3.5 w-3.5" /> Shared Practice Challenge
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                You were invited to a practice challenge!
              </h3>
              <p className="text-sm text-slate-600">
                {sharedQuery.data.questions.length} questions &bull;{" "}
                {sharedQuery.data.subjectNames?.length
                  ? sharedQuery.data.subjectNames.join(", ")
                  : "Mixed Subjects"}{" "}
                &bull;{" "}
                {sharedQuery.data.timeLimitSeconds > 0
                  ? `${sharedQuery.data.timeLimitSeconds / 60}m / question limit`
                  : "No time limit"}
              </p>
            </div>
            <button
              onClick={startSharedTestNow}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              <Play className="h-4 w-4 fill-white" /> Start Challenge Now
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Choose Subject Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
              Step 01 / Choose subject
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">What do you want to practise?</h2>
            <p className="mt-2 text-sm text-slate-500">Choose one or more subjects, then select your chapters.</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedSubjectIds.length === 1 && (
              <span className="hidden items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 sm:inline-flex">
                <CheckCircle2 className="h-3.5 w-3.5" /> 1 subject selected
              </span>
            )}
            {selectedSubjectIds.length > 1 && (
              <span className="hidden items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-800 sm:inline-flex">
                <CheckCircle2 className="h-3.5 w-3.5" /> {selectedSubjectIds.length} subjects selected
              </span>
            )}
            <button
              data-testid="button-select-all-subjects"
              onClick={selectAllSubjects}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              Select all
            </button>
            <span className="text-slate-300">&bull;</span>
            <button
              data-testid="button-clear-all-subjects"
              onClick={clearAllSubjects}
              className="text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {subjects.map((subject) => {
            const isSelected = selectedSubjectIds.includes(subject.subjectId);
            return (
              <button
                key={subject.subjectId}
                data-testid={`button-subject-${subject.subjectId}`}
                aria-pressed={isSelected}
                onClick={() => toggleSubject(subject.subjectId)}
                className={`flex min-h-[88px] items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 text-indigo-950 shadow-sm"
                    : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-indigo-300"
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {subjectIcon(subject)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{subject.englishName}</span>
                  {subject.hindiName && (
                    <span className="mt-0.5 block text-xs text-slate-500">{subject.hindiName}</span>
                  )}
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2 & Aside Configuration Section */}
      <section className="grid gap-5 lg:grid-cols-[1fr_310px]">
        {/* Step 2 / Pick Chapters */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                Step 02 / Pick chapters
              </p>
              <h2 className="text-xl font-bold text-slate-900">Practice exactly what you need</h2>
            </div>
            {allAvailableChapters.length > 0 && (
              <button
                data-testid="button-select-all-chapters"
                onClick={
                  chapterIds.length === allAvailableChapters.length
                    ? clearAllChaptersGlobally
                    : selectAllChaptersGlobally
                }
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                {chapterIds.length === allAvailableChapters.length ? "Clear all" : "Select all"}
              </button>
            )}
          </div>

          <div className="mt-5">
            {selectedSubjectIds.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
                Select a subject to see its chapters.
              </div>
            ) : !isMultiSubject ? (
              /* Single Subject: Clean direct grid */
              (() => {
                const singleSubjectId = selectedSubjectIds[0];
                const subjectData = subjectChaptersMap[singleSubjectId];
                const chapters = subjectData?.chapters || [];

                if (subjectData?.isLoading) {
                  return (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[1, 2, 3, 4].map((item) => (
                        <Skeleton key={item} className="h-16 rounded-xl" />
                      ))}
                    </div>
                  );
                }
                if (subjectData?.isError) {
                  return (
                    <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                      Failed to load chapters for this subject.
                    </p>
                  );
                }
                if (chapters.length === 0) {
                  return (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                      No chapters are available for this subject.
                    </p>
                  );
                }

                return (
                  <div className="grid max-h-[460px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {chapters.map((chapter) => (
                      <ChapterRow
                        key={chapter.chapterId}
                        chapter={chapter}
                        selected={chapterIds.includes(chapter.chapterId)}
                        onClick={() => toggleChapter(chapter.chapterId)}
                      />
                    ))}
                  </div>
                );
              })()
            ) : (
              /* Multiple Subjects: Clean grouped subject sections with dedicated controls */
              <div className="max-h-[560px] space-y-5 overflow-y-auto pr-1">
                {selectedSubjectIds.map((sId) => {
                  const subjectData = subjectChaptersMap[sId];
                  const subj = subjectData?.subject;
                  if (!subj) return null;

                  const subjChapters = subjectData.chapters || [];
                  const selectedInSubj = subjChapters.filter((ch) =>
                    chapterIds.includes(ch.chapterId),
                  );
                  const isAllSubjSelected =
                    subjChapters.length > 0 && selectedInSubj.length === subjChapters.length;

                  return (
                    <div
                      key={sId}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                            {subjectIcon(subj)}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{subj.englishName}</span>
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                            {selectedInSubj.length}/{subjChapters.length} ch
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            data-testid={`button-select-all-${sId}`}
                            onClick={() =>
                              isAllSubjSelected ? clearForSubject(sId) : selectAllForSubject(sId)
                            }
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            {isAllSubjSelected ? "Clear" : `Select all for ${subj.englishName}`}
                          </button>
                        </div>
                      </div>

                      {subjectData.isLoading ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-14 rounded-xl" />
                          ))}
                        </div>
                      ) : subjChapters.length === 0 ? (
                        <p className="text-xs text-slate-400">No chapters found for this subject.</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {subjChapters.map((chapter) => (
                            <ChapterRow
                              key={chapter.chapterId}
                              chapter={chapter}
                              selected={chapterIds.includes(chapter.chapterId)}
                              onClick={() => toggleChapter(chapter.chapterId)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Aside Configuration Sidebar */}
        <aside className="sticky top-6 flex flex-col self-start rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5 sm:p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Sparkles className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-indigo-950">Build your own question set</h3>
          <p className="mt-2 text-sm leading-6 text-indigo-900/70">
            Choose difficulty, select question distribution, and start practising (max 100 questions per set).
          </p>

          <div className="mt-6 space-y-5 border-t border-indigo-200/70 pt-5">
            {/* Difficulty */}
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-indigo-950">Difficulty</legend>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((item) => (
                  <button
                    key={item.value}
                    data-testid={`button-difficulty-${item.value}`}
                    aria-pressed={difficulty.includes(item.value)}
                    title={item.detail}
                    onClick={() => toggleDifficulty(item.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      difficulty.includes(item.value)
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-indigo-200 bg-white text-indigo-700 hover:border-indigo-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Question Types */}
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-indigo-950">Question Types</legend>
              <div className="flex flex-wrap gap-1.5">
                {QUESTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    data-testid={`button-type-${t.value}`}
                    aria-pressed={selectedTypes.includes(t.value)}
                    title={t.detail}
                    onClick={() => toggleType(t.value)}
                    className={`rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all ${
                      selectedTypes.includes(t.value)
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-indigo-200 bg-white text-indigo-700 hover:border-indigo-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Time Limit / Boundation */}
            <fieldset>
              <legend className="mb-3 text-sm font-bold text-indigo-950">Time Limit / Boundation</legend>
              <div className="flex flex-wrap gap-2">
                {TIME_LIMIT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    data-testid={`button-time-limit-${opt.value}`}
                    aria-pressed={timeLimit === opt.value}
                    title={opt.detail}
                    onClick={() => setTimeLimit(opt.value)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      timeLimit === opt.value
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-indigo-200 bg-white text-indigo-700 hover:border-indigo-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Questions Configuration (Total & Subject-wise Allocation) */}
            <div className="space-y-3 rounded-2xl border border-indigo-200/80 bg-white/70 p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-indigo-950">
                  Questions ({effectiveTotalQuestions})
                </label>
                {isMultiSubject && (
                  <div className="flex rounded-lg border border-indigo-200 bg-indigo-50/60 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      data-testid="mode-split-equal"
                      onClick={() => setAllocationMode("EQUAL")}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 transition ${
                        allocationMode === "EQUAL"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-indigo-700 hover:text-indigo-950"
                      }`}
                    >
                      <Scale className="h-3 w-3" /> Equal split
                    </button>
                    <button
                      type="button"
                      data-testid="mode-split-custom"
                      onClick={() => setAllocationMode("CUSTOM")}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 transition ${
                        allocationMode === "CUSTOM"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-indigo-700 hover:text-indigo-950"
                      }`}
                    >
                      <Sliders className="h-3 w-3" /> Custom
                    </button>
                  </div>
                )}
              </div>

              {/* Mode: Equal Split */}
              {(!isMultiSubject || allocationMode === "EQUAL") && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {QUESTION_PRESETS.map((count) => (
                      <button
                        key={count}
                        data-testid={`button-question-count-${count}`}
                        aria-pressed={totalQuestionCount === count}
                        onClick={() => setTotalQuestionCount(count)}
                        className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-bold transition-all ${
                          totalQuestionCount === count
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-indigo-200 bg-white text-indigo-700 hover:border-indigo-300"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>

                  {/* Custom Number Input & Slider */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={totalQuestionCount}
                      onChange={(e) => setTotalQuestionCount(Number(e.target.value))}
                      className="h-1.5 flex-1 cursor-pointer accent-indigo-600"
                    />
                    <div className="flex items-center rounded-lg border border-indigo-200 bg-white px-2 py-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={totalQuestionCount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= 1 && val <= 100) setTotalQuestionCount(val);
                        }}
                        className="w-10 text-center text-xs font-bold text-indigo-950 focus:outline-none"
                      />
                      <span className="text-[10px] font-semibold text-slate-400">/100</span>
                    </div>
                  </div>

                  {isMultiSubject && selectedSubjectIds.length > 0 && (
                    <p className="text-[11px] font-medium leading-4 text-indigo-900/70">
                      Divided equally:{" "}
                      {selectedSubjectIds
                        .map((sId) => {
                          const subj = subjects.find((s) => s.subjectId === sId);
                          return `${subjectQuestionCounts[sId] || 0} ${subj?.englishName || ""}`;
                        })
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Mode: Custom Per-Subject Split */}
              {isMultiSubject && allocationMode === "CUSTOM" && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-slate-500">
                    Set specific question count for each subject (max 100 total):
                  </p>
                  <div className="space-y-2">
                    {selectedSubjectIds.map((sId) => {
                      const subj = subjects.find((s) => s.subjectId === sId);
                      const currentCount = subjectQuestionCounts[sId] || 0;
                      return (
                        <div
                          key={sId}
                          className="flex items-center justify-between rounded-xl border border-indigo-100 bg-white p-2"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-[10px]">
                              {subj ? subjectIcon(subj) : null}
                            </span>
                            <span className="truncate text-xs font-bold text-slate-800">
                              {subj?.englishName || "Subject"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateSubjectCount(sId, currentCount - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={currentCount}
                              onChange={(e) => updateSubjectCount(sId, Number(e.target.value))}
                              className="h-7 w-12 rounded-lg border border-indigo-200 text-center text-xs font-bold text-indigo-950 focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateSubjectCount(sId, currentCount + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between border-t border-indigo-100 pt-2 text-xs">
                    <span className="font-semibold text-slate-500">Total configured:</span>
                    <span
                      className={`font-bold ${
                        effectiveTotalQuestions > 100
                          ? "text-rose-600 font-mono"
                          : "text-indigo-950 font-mono"
                      }`}
                    >
                      {effectiveTotalQuestions} / 100 questions
                    </span>
                  </div>
                  {effectiveTotalQuestions > 100 && (
                    <p className="text-[11px] font-semibold text-rose-600">
                      Total cannot exceed 100 questions.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Start Button */}
            <button
              data-testid="button-start-practice"
              disabled={
                selectedSubjectIds.length === 0 ||
                allSelectedChapters.length === 0 ||
                effectiveTotalQuestions <= 0 ||
                effectiveTotalQuestions > 100 ||
                startPractice.isPending ||
                noFreeSessions
              }
              onClick={start}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            >
              {startPractice.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Building {effectiveTotalQuestions} Questions
                </>
              ) : (
                <>
                  {noFreeSessions
                    ? "Sessions unavailable"
                    : `Start practising (${effectiveTotalQuestions} Qs)`}{" "}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {startPractice.isError && (
              <p
                className={`text-xs font-medium leading-5 ${
                  noFreeSessions ? "text-amber-800" : "text-rose-700"
                }`}
                data-testid="status-practice-start-error"
              >
                {noFreeSessions
                  ? `Is batch (${batchName}) ke free Infinite Practice sessions ab available nahi hain. Kisi doosre supported batch ya baad mein dobara try karein.`
                  : startPractice.error.message}
              </p>
            )}
          </div>
        </aside>
      </section>

      {/* Mobile Sticky Bottom Start Bar */}
      {allSelectedChapters.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">
                {allSelectedChapters.length} ch &bull; {effectiveTotalQuestions} questions
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {isMultiSubject && allocationMode === "CUSTOM" ? "Custom split" : "Equal split"} &bull;{" "}
                {timeLimit > 0 ? `${timeLimit / 60}m/Q` : "No limit"}
              </p>
            </div>
            <button
              data-testid="button-start-practice-mobile"
              disabled={
                startPractice.isPending ||
                noFreeSessions ||
                effectiveTotalQuestions <= 0 ||
                effectiveTotalQuestions > 100
              }
              onClick={start}
              className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {startPractice.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Start ({effectiveTotalQuestions} Qs) <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function QuestionRoom({
  batchId,
  batchName,
  session,
  timeLimitSeconds = 0,
  onComplete,
  onExit,
}: {
  batchId: string;
  batchName?: string;
  session: { testId: string; questions: InfinitePracticeQuestion[] };
  timeLimitSeconds?: number;
  onComplete: (result: InfinitePracticeTestSolution) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<string, SubmitInfinitePracticeInput>>({});
  const [submitError, setSubmitError] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
  const submitTest = useSubmitInfinitePractice(session.testId);
  const loadSolution = useInfinitePracticeSolution(session.testId);
  const shareTest = useShareInfinitePractice();
  const startedAt = useRef(Date.now());
  const question = session.questions[index];
  const progress = (index / session.questions.length) * 100;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
    setElapsedSeconds(0);
    setSelected(answers[session.questions[index]?.questionId]?.markedSolutions ?? []);
    setSubmitError("");

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [answers, index, session.questions]);

  // Auto skip/advance if time limit is reached for question
  useEffect(() => {
    if (timeLimitSeconds > 0 && elapsedSeconds >= timeLimitSeconds) {
      if (submitTest.isPending || loadSolution.isPending) return;
      const currentAns = makeAnswer(selected.length > 0 ? "ATTEMPTED" : "SKIPPED");
      if (currentAns) {
        const nextAnswers = { ...answers, [currentAns.questionId]: currentAns };
        setAnswers(nextAnswers);
        if (index < session.questions.length - 1) {
          setIndex((v) => v + 1);
        } else {
          submitCurrentTest(nextAnswers);
        }
      }
    }
  }, [elapsedSeconds, timeLimitSeconds]);

  const makeAnswer = (
    status: SubmitInfinitePracticeInput["status"] = "ATTEMPTED",
  ): SubmitInfinitePracticeInput | null => {
    if (!question) return null;
    if (status === "ATTEMPTED" && selected.length === 0) return null;
    return {
      questionId: question.questionId,
      status,
      timeTaken: Math.max(1000, Date.now() - startedAt.current),
      chapterId: question.chapterId,
      questionNumber: index + 1,
      markedSolutions: status === "SKIPPED" ? [] : selected,
      difficulty: question.difficulty,
      type: question.type,
    };
  };

  const completeAnswers = (currentAnswers: Record<string, SubmitInfinitePracticeInput>) =>
    session.questions.map((item, itemIndex) => (
      currentAnswers[item.questionId] ?? {
        questionId: item.questionId,
        status: "SKIPPED" as const,
        timeTaken: 0,
        chapterId: item.chapterId,
        questionNumber: itemIndex + 1,
        markedSolutions: [],
        difficulty: item.difficulty,
        type: item.type,
      }
    ));

  const submitCurrentTest = async (currentAnswers: Record<string, SubmitInfinitePracticeInput>) => {
    if (submitTest.isPending || loadSolution.isPending) return;
    setSubmitError("");
    try {
      await submitTest.mutateAsync({ questionsResponse: completeAnswers(currentAnswers) });
      const result = await loadSolution.mutateAsync();
      onComplete(result);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not submit this test.");
    }
  };

  const next = async () => {
    const answer = makeAnswer();
    if (!answer) return;
    const nextAnswers = { ...answers, [answer.questionId]: answer };
    setAnswers(nextAnswers);
    if (index < session.questions.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    await submitCurrentTest(nextAnswers);
  };

  const previous = () => {
    if (index === 0 || submitTest.isPending || loadSolution.isPending) return;
    const answer = makeAnswer();
    if (answer) setAnswers((current) => ({ ...current, [answer.questionId]: answer }));
    setIndex((value) => value - 1);
  };

  const skip = async () => {
    const answer = makeAnswer("SKIPPED");
    if (!answer) return;
    const nextAnswers = { ...answers, [answer.questionId]: answer };
    setAnswers(nextAnswers);
    if (index < session.questions.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    await submitCurrentTest(nextAnswers);
  };

  const submit = async () => {
    const answer = makeAnswer(selected.length > 0 ? "ATTEMPTED" : "SKIPPED");
    const nextAnswers = answer
      ? { ...answers, [answer.questionId]: answer }
      : answers;
    setAnswers(nextAnswers);
    await submitCurrentTest(nextAnswers);
  };

  const handleShareInRoom = async () => {
    try {
      const subjectNames = Array.from(new Set(session.questions.map((q) => q.subjectName).filter(Boolean))) as string[];
      const res = await shareTest.mutateAsync({
        batchId,
        batchName,
        subjectNames,
        timeLimitSeconds,
        questions: session.questions,
      });
      const shareUrl = `${window.location.origin}/practice/${batchId}?test=${res.code}`;

      if (navigator.share) {
        await navigator.share({
          title: `Wegenz Infinite Practice Challenge (${session.questions.length} Questions)`,
          text: `Take this ${session.questions.length}-question practice challenge on Wegenz!`,
          url: shareUrl,
        }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback("Copied test link!");
        setTimeout(() => setShareFeedback(""), 3000);
      }
    } catch {
      setShareFeedback("Could not generate share link");
      setTimeout(() => setShareFeedback(""), 3000);
    }
  };

  if (!question) return null;

  const secondsRemaining = timeLimitSeconds > 0 ? Math.max(0, timeLimitSeconds - elapsedSeconds) : 0;
  const isTimeRunningOut = timeLimitSeconds > 0 && secondsRemaining <= 15;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl"
      data-testid="panel-practice-question"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            data-testid="button-leave-practice"
            onClick={onExit}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Exit practice"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">Infinite Practice</p>
            <p className="text-sm font-semibold text-slate-700">
              Question {index + 1} <span className="font-normal text-slate-400">of {session.questions.length}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* In-Room Share Button */}
          <button
            type="button"
            onClick={handleShareInRoom}
            disabled={shareTest.isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            title="Share this test set with friends"
          >
            <Share2 className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden sm:inline">{shareFeedback || "Share"}</span>
          </button>

          <span className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 sm:inline-flex">
            <Target className="h-3.5 w-3.5 text-indigo-600" /> {question.subjectName || "JEE 2026"}
          </span>
          <button
            data-testid="button-submit-test"
            disabled={submitTest.isPending || loadSolution.isPending}
            onClick={submit}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitTest.isPending || loadSolution.isPending
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...</>
              : "Submit test"}
          </button>
        </div>
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full bg-indigo-600" />
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={question.questionId}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="practice-question-canvas rounded-3xl border border-slate-200 p-5 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                {question.chapterName || "Practice question"}
              </span>
              {question.type === 2 && (
                <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                  Multiple Correct
                </span>
              )}
              {question.type === 8 && (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                  Comprehension
                </span>
              )}
              {(question.type === 3 || (!question.options || question.options.length === 0)) && (
                <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                  Numerical / Integer
                </span>
              )}
            </div>

            {/* Question Timer at top corner right side */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold font-mono tracking-tight transition-colors ${
                  timeLimitSeconds > 0
                    ? isTimeRunningOut
                      ? "bg-rose-100 text-rose-700 animate-pulse border border-rose-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
                title={timeLimitSeconds > 0 ? `Time left for this question (${formatClock(secondsRemaining)})` : "Time spent on this question"}
              >
                <Timer className={`h-3.5 w-3.5 ${isTimeRunningOut ? "text-rose-600 animate-spin" : "text-slate-500"}`} />
                {timeLimitSeconds > 0 ? (
                  <span>{formatClock(secondsRemaining)} / {formatClock(timeLimitSeconds)}</span>
                ) : (
                  <span>{formatClock(elapsedSeconds)}</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-slate-400">{question.typeTitle || "Question"}</span>
            </div>
          </div>

          {/* Parent Passage / Context if Comprehension Question */}
          {question.parentQuestion?.content && (
            <div className="mb-6 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <span>📖 Reading Passage / Context</span>
              </div>
              <HtmlContent
                html={question.parentQuestion.content}
                className="text-sm leading-relaxed text-slate-800 [&_img]:my-3 [&_img]:max-h-[300px]"
              />
            </div>
          )}

          <HtmlContent
            html={question.content || question.plainQuestionText}
            className="mb-7 text-[17px] leading-8 text-slate-900 [&_img]:my-4 [&_img]:max-h-[420px]"
            testId="text-practice-question"
          />

          {/* Options List for Option-based Questions */}
          {question.options && question.options.length > 0 ? (
            <div className="space-y-3" role="radiogroup" aria-label={`Answers for question ${index + 1}`}>
              {question.options.map((option, optionIndex) => {
                const isSelected = selected.includes(optionIndex + 1);
                return (
                  <button
                    key={`${question.questionId}-${optionIndex}`}
                    data-testid={`button-option-${optionIndex + 1}`}
                    role={question.type === 2 ? "checkbox" : "radio"}
                    aria-checked={isSelected}
                    disabled={submitTest.isPending || loadSolution.isPending}
                    onClick={() =>
                      setSelected((current) =>
                        question.type === 2
                          ? current.includes(optionIndex + 1)
                            ? current.filter((value) => value !== optionIndex + 1)
                            : [...current, optionIndex + 1]
                          : [optionIndex + 1],
                      )
                    }
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all disabled:cursor-default ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : question.type === 2
                          ? "border-2 border-slate-300 bg-white text-slate-600"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {question.type === 2 && isSelected ? "✓" : String.fromCharCode(65 + optionIndex)}
                    </span>
                    <HtmlContent
                      html={option.text}
                      className="min-w-0 flex-1 pt-0.5 text-sm leading-6 text-slate-800 [&_p]:mb-0"
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            /* Numeric / Integer Keypad & Input Box */
            <div className="my-6 rounded-2xl border border-sky-200 bg-sky-50/40 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-800 mb-2">
                Enter Numerical / Integer Value:
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 4.5 or 12"
                  value={selected[0] !== undefined ? selected[0] : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelected(val === "" ? [] : [Number(val)]);
                  }}
                  className="h-11 w-48 rounded-xl border border-slate-300 bg-white px-3.5 text-base font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                {selected.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-4 border-t border-slate-100 pt-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                {question.type === 2
                  ? "Select all correct options"
                  : question.type === 3 || (!question.options || question.options.length === 0)
                  ? "Type your numerical answer"
                  : "Select an option"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  data-testid="button-previous-question"
                  disabled={index === 0 || submitTest.isPending || loadSolution.isPending}
                  onClick={previous}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <button
                  data-testid="button-skip-question"
                  disabled={submitTest.isPending || loadSolution.isPending}
                  onClick={skip}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Skip question
                </button>
                <button
                  data-testid={
                    index === session.questions.length - 1
                      ? "button-submit-test-final"
                      : "button-next-question"
                  }
                  disabled={selected.length === 0 || submitTest.isPending || loadSolution.isPending}
                  onClick={next}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {submitTest.isPending || loadSolution.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      {index === session.questions.length - 1 ? "Submit & finish" : "Next question"}{" "}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
            {submitError && (
              <div
                className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700"
                data-testid="status-practice-submit-error"
              >
                {submitError}
              </div>
            )}
          </div>
        </motion.article>
      </AnimatePresence>
    </motion.div>
  );
}

type VideoType = "youtube" | "dash" | "direct";

interface ActiveVideoModalData {
  type: VideoType;
  videoId?: string;
  url: string;
  title: string;
}

function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = cleanUrl.match(regExp);
  return match && match[1] ? match[1] : null;
}

function getVideoType(url?: string | null): VideoType | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  if (getYouTubeId(cleanUrl)) return "youtube";
  if (/\.mpd(\?.*)?$/i.test(cleanUrl) || cleanUrl.includes(".mpd")) return "dash";
  return "direct";
}

function DashPlayer({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isProtected, setIsProtected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let player: any = null;
    let cancelled = false;

    async function initPlayer() {
      try {
        const dashjs = await import("dashjs");
        if (cancelled || !videoRef.current) return;

        player = dashjs.MediaPlayer().create();
        player.initialize(videoRef.current, url, true);

        player.on(dashjs.MediaPlayer.events.CAN_PLAY, () => {
          if (!cancelled) {
            setIsLoading(false);
            setIsProtected(false);
          }
        });

        player.on(dashjs.MediaPlayer.events.ERROR, (e: any) => {
          console.warn("[dashjs] Stream error:", e);
          if (!cancelled) {
            setIsLoading(false);
            setIsProtected(true);
          }
        });
      } catch (err) {
        console.error("Failed to load dashjs", err);
        if (!cancelled) {
          setIsLoading(false);
          setIsProtected(true);
        }
      }
    }

    initPlayer();

    return () => {
      cancelled = true;
      if (player) {
        try {
          player.reset();
        } catch {}
      }
    };
  }, [url]);

  if (isProtected) {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-10 text-center text-slate-300 min-h-[320px] sm:min-h-[420px] bg-slate-950">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-4 shadow-inner">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h4 className="text-base font-bold text-white sm:text-lg">Protected CloudFront Video Stream</h4>
        <p className="mt-2 max-w-lg text-xs sm:text-sm text-slate-400 leading-relaxed">
          This MPEG-DASH stream is hosted on PhysicsWallah&apos;s private CloudFront CDN (<code className="text-slate-200 bg-slate-800 px-1 py-0.5 rounded text-[11px]">d1d34p8vz63oiq.cloudfront.net</code>) with AWS Restricted Viewer Access. CloudFront requires signed tokens (<code className="text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded text-[11px]">Key-Pair-Id / Policy / Signature</code>) to stream.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 3000);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" /> {copied ? "Stream URL Copied!" : "Copy Stream URL"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Try Direct Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 text-slate-300">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
          <p className="text-xs font-medium">Connecting to MPEG-DASH stream…</p>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function DirectPlayer({ url }: { url: string }) {
  return (
    <div className="relative w-full aspect-video bg-black flex items-center justify-center">
      <video
        src={url}
        controls
        autoPlay
        playsInline
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function Completion({
  batchId,
  batchName,
  session,
  timeLimitSeconds = 0,
  result,
  onRetry,
  onRestart,
}: {
  batchId: string;
  batchName?: string;
  session: { testId: string; questions: InfinitePracticeQuestion[] };
  timeLimitSeconds?: number;
  result: InfinitePracticeTestSolution;
  onRetry: () => void;
  onRestart: () => void;
}) {
  const [filterTab, setFilterTab] = useState<"ALL" | "CORRECT" | "INCORRECT" | "SKIPPED">("ALL");
  const [shareFeedback, setShareFeedback] = useState("");
  const [highlightedQNum, setHighlightedQNum] = useState<number | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeVideo, setActiveVideo] = useState<ActiveVideoModalData | null>(null);
  const shareTest = useShareInfinitePractice();

  useEffect(() => {
    // Prefetch dashjs in background so .mpd videos open with zero delay
    import("dashjs").catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeVideo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveVideo(null);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeVideo]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 450);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const questionSolutions = useMemo(() => {
    if (result.questionsResponses && result.questionsResponses.length > 0) {
      return result.questionsResponses;
    }
    return session.questions.map((q, idx) => ({
      questionId: q.questionId,
      content: q.content,
      plainQuestionText: q.plainQuestionText,
      options: q.options,
      solutions: q.solutions,
      type: q.type,
      difficulty: q.difficulty,
      chapterId: q.chapterId,
      chapterName: q.chapterName,
      subjectId: q.subjectId,
      subjectName: q.subjectName,
      status: "SKIPPED",
      markedSolutions: [],
      timeTaken: 0,
      questionNumber: idx + 1,
      parentQuestion: q.parentQuestion || null,
      numericAnswer: q.numericAnswer ?? null,
    }));
  }, [result.questionsResponses, session.questions]);

  const totalTimeTakenMs = useMemo(() => {
    return questionSolutions.reduce((acc, q) => acc + (q.timeTaken || 0), 0);
  }, [questionSolutions]);

  const getQuestionStatus = (item: InfinitePracticeQuestionSolution): "CORRECT" | "INCORRECT" | "SKIPPED" => {
    if (item.status === "CORRECT" || item.status === "INCORRECT" || item.status === "SKIPPED") {
      return item.status;
    }
    const marked = item.markedSolutions || [];
    if (marked.length === 0) return "SKIPPED";
    const correctIndices = (item.options ?? [])
      .map((opt, idx) => (opt.isCorrect ? idx + 1 : null))
      .filter((val): val is number => val !== null);
    if (correctIndices.length > 0) {
      const isCorrect =
        correctIndices.length === marked.length &&
        correctIndices.every((val) => marked.includes(val));
      return isCorrect ? "CORRECT" : "INCORRECT";
    }
    const sessionQ = session.questions.find((q) => q.questionId === item.questionId);
    const numAns = item.numericAnswer ?? sessionQ?.numericAnswer;
    if (numAns !== undefined && numAns !== null) {
      const userNum = Number(marked[0]);
      const correctNum = Number(numAns);
      const isNumCorrect =
        !isNaN(userNum) && !isNaN(correctNum)
          ? Math.abs(userNum - correctNum) < 0.001
          : String(marked[0]).trim().toLowerCase() === String(numAns).trim().toLowerCase();
      return isNumCorrect ? "CORRECT" : "INCORRECT";
    }
    return "INCORRECT";
  };

  const totalQuestions = session.questions.length || questionSolutions.length || 0;
  const totalCorrect =
    result.totalCorrectQuestions ??
    questionSolutions.filter((q) => getQuestionStatus(q) === "CORRECT").length;
  const totalIncorrect =
    result.totalIncorrectQuestions ??
    questionSolutions.filter((q) => getQuestionStatus(q) === "INCORRECT").length;
  const totalSkipped =
    result.totalSkippedQuestions ??
    questionSolutions.filter((q) => getQuestionStatus(q) === "SKIPPED").length;
  const accuracy =
    result.accuracy !== undefined
      ? result.accuracy
      : totalCorrect + totalIncorrect > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;
  const score = result.userScore ?? result.score ?? totalCorrect * 4 - totalIncorrect * 1;

  const performanceTier = useMemo(() => {
    if (accuracy >= 80) {
      return {
        label: "Outstanding",
        badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300/40",
        iconColor: "text-emerald-600 bg-emerald-100",
        barColor: "bg-emerald-500",
        icon: Trophy,
        subtitle: "Exceptional mastery! You dominated this practice set with high speed and accuracy.",
      };
    }
    if (accuracy >= 50) {
      return {
        label: "Good Effort",
        badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-300/40",
        iconColor: "text-indigo-600 bg-indigo-100",
        barColor: "bg-indigo-600",
        icon: Zap,
        subtitle: "Solid work! You have a good grasp of the core concepts. Review missed questions below.",
      };
    }
    return {
      label: "Keep Practising",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-800 ring-1 ring-amber-300/40",
      iconColor: "text-amber-600 bg-amber-100",
      barColor: "bg-amber-500",
      icon: Target,
      subtitle: "Every attempt builds strength. Dive into the detailed step-by-step solutions below.",
    };
  }, [accuracy]);

  const filteredQuestions = useMemo(() => {
    if (filterTab === "ALL") return questionSolutions;
    return questionSolutions.filter((q) => getQuestionStatus(q) === filterTab);
  }, [questionSolutions, filterTab]);

  const handleJumpToQuestion = (qNumber: number, status: "CORRECT" | "INCORRECT" | "SKIPPED") => {
    if (filterTab !== "ALL" && filterTab !== status) {
      setFilterTab("ALL");
    }
    setHighlightedQNum(qNumber);
    setTimeout(() => {
      const target = document.getElementById(`review-question-${qNumber}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 80);
    setTimeout(() => {
      setHighlightedQNum((curr) => (curr === qNumber ? null : curr));
    }, 2500);
  };

  const handleShare = async () => {
    try {
      const subjectNames = Array.from(
        new Set(session.questions.map((q) => q.subjectName).filter(Boolean)),
      ) as string[];
      const res = await shareTest.mutateAsync({
        batchId,
        batchName,
        subjectNames,
        timeLimitSeconds,
        questions: session.questions,
      });

      const shareUrl = `${window.location.origin}/practice/${batchId}?test=${res.code}`;

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl).catch(() => {});
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Wegenz Infinite Practice: ${session.questions.length} Questions Test`,
            text: `Try this exact ${session.questions.length}-question practice set on Wegenz!`,
            url: shareUrl,
          });
          setShareFeedback("Shared successfully!");
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            setShareFeedback("Test link copied to clipboard!");
          }
        }
      } else {
        setShareFeedback("Test link copied to clipboard!");
      }
      setTimeout(() => setShareFeedback(""), 3500);
    } catch {
      setShareFeedback("Failed to generate share link");
      setTimeout(() => setShareFeedback(""), 3500);
    }
  };

  const TierIcon = performanceTier.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-4xl rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8 md:p-10"
      data-testid="state-practice-complete"
    >
      {/* Motivational Hero Section */}
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm sm:h-20 sm:w-20">
          <div
            className={`flex h-full w-full items-center justify-center rounded-2xl ${performanceTier.iconColor}`}
          >
            <TierIcon className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {batchName && (
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {batchName}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${performanceTier.badgeClass}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {performanceTier.label}
          </span>
        </div>

        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Practice set finished
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
          {totalCorrect + totalIncorrect === 0
            ? "You skipped all questions in this session. Review the step-by-step solutions below and give it another shot!"
            : performanceTier.subtitle}
        </p>

        {/* Hero Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          <button
            data-testid="button-practice-retry-same"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" /> Retry this test
          </button>

          <button
            data-testid="button-practice-share"
            disabled={shareTest.isPending}
            onClick={handleShare}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 active:scale-[0.98]"
          >
            {shareTest.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {shareFeedback || "Share challenge"}
          </button>

          <button
            data-testid="button-practice-again"
            onClick={onRestart}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 text-slate-500" /> New set
          </button>
        </div>
      </div>

      {/* Primary Metrics: Score, Accuracy Gauge, Time & Pace */}
      <div className="mt-10 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Score */}
        <div
          data-testid="stat-score"
          className="flex flex-col justify-between rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-indigo-50/20 p-4 text-left"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-600">
            <span>Score</span>
            <Award className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold text-indigo-950 sm:text-3xl">
              {score > 0 ? `+${score}` : score}
            </p>
            <p className="mt-0.5 text-xs text-indigo-600/80">
              Max {totalQuestions * 4} pts
            </p>
          </div>
        </div>

        {/* Accuracy with Progress Gauge */}
        <div
          data-testid="stat-accuracy"
          className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Accuracy</span>
            <Target className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {accuracy}%
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${performanceTier.barColor}`}
                style={{ width: `${Math.min(100, Math.max(0, accuracy))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Time */}
        <div
          data-testid="stat-total-time"
          className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Total Time</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {totalTimeTakenMs > 0 ? formatDuration(totalTimeTakenMs) : "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {timeLimitSeconds > 0 ? `${timeLimitSeconds}s / Q limit` : "No time limit"}
            </p>
          </div>
        </div>

        {/* Avg Pace */}
        <div
          data-testid="stat-avg-pace"
          className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-2xs"
        >
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <span>Avg Pace</span>
            <Timer className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {totalTimeTakenMs > 0
                ? formatDuration(
                    Math.round(totalTimeTakenMs / Math.max(1, questionSolutions.length)),
                  )
                : "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Per question</p>
          </div>
        </div>
      </div>

      {/* Semantic Breakdown Cards: Correct, Incorrect, Skipped */}
      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {/* Correct Card */}
        <div
          data-testid="stat-card-correct"
          className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 text-left sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Correct
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-950 sm:text-4xl">
            {totalCorrect}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs font-medium text-emerald-700">
            <span>
              {totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}% of test
            </span>
            <span className="font-bold">+{totalCorrect * 4} pts</span>
          </div>
        </div>

        {/* Incorrect Card */}
        <div
          data-testid="stat-card-incorrect"
          className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-4 text-left sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Incorrect
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-rose-950 sm:text-4xl">
            {totalIncorrect}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs font-medium text-rose-700">
            <span>
              {totalQuestions > 0 ? Math.round((totalIncorrect / totalQuestions) * 100) : 0}% of test
            </span>
            <span className="font-bold">-{totalIncorrect * 1} pts</span>
          </div>
        </div>

        {/* Skipped Card */}
        <div
          data-testid="stat-card-skipped"
          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-left sm:p-5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Skipped
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200/70 text-slate-600">
              <MinusCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            {totalSkipped}
          </p>
          <div className="mt-1 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>
              {totalQuestions > 0 ? Math.round((totalSkipped / totalQuestions) * 100) : 0}% of test
            </span>
            <span className="font-bold">0 pts</span>
          </div>
        </div>
      </div>

      {/* Quick Jump Question Navigation Palette */}
      {questionSolutions.length > 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 text-left">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Question Palette
              </span>
              <span className="text-xs text-slate-400">
                ({questionSolutions.length} questions)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Correct
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Incorrect
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Skipped
              </span>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {questionSolutions.map((item, idx) => {
              const trueIndex = questionSolutions.findIndex((q) => q.questionId === item.questionId);
              const qNum = item.questionNumber ?? (trueIndex >= 0 ? trueIndex + 1 : idx + 1);
              const qStatus = getQuestionStatus(item);
              const isPillHighlighted = highlightedQNum === qNum;
              const pillStyles =
                qStatus === "CORRECT"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
                  : qStatus === "INCORRECT"
                  ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300"
                  : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:border-slate-300";

              return (
                <button
                  key={item.questionId || idx}
                  type="button"
                  data-testid={`palette-pill-${qNum}`}
                  onClick={() => handleJumpToQuestion(qNum, qStatus)}
                  title={`Jump to Question ${qNum} (${qStatus.toLowerCase()})`}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 ${
                    isPillHighlighted ? "ring-2 ring-indigo-500 ring-offset-2 scale-105 " : ""
                  }${pillStyles}`}
                >
                  {qNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Filter Tabs */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1">
          {(
            [
              { key: "ALL", label: "All", count: totalQuestions, icon: null, activeColor: "" },
              {
                key: "CORRECT",
                label: "Correct",
                count: totalCorrect,
                icon: CheckCircle2,
                activeColor: "text-emerald-600",
              },
              {
                key: "INCORRECT",
                label: "Incorrect",
                count: totalIncorrect,
                icon: XCircle,
                activeColor: "text-rose-600",
              },
              {
                key: "SKIPPED",
                label: "Skipped",
                count: totalSkipped,
                icon: MinusCircle,
                activeColor: "text-slate-500",
              },
            ] as const
          ).map((tab) => {
            const isActive = filterTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                data-testid={`filter-tab-${tab.key.toLowerCase()}`}
                onClick={() => setFilterTab(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-white text-slate-950 shadow-xs ring-1 ring-slate-950/5"
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
                }`}
              >
                {Icon && <Icon className={`h-3.5 w-3.5 ${tab.activeColor}`} />}
                <span>{tab.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-slate-100 text-slate-700"
                      : "bg-slate-200/60 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs font-medium text-slate-500">
          Showing {filteredQuestions.length} of {totalQuestions} questions
        </p>
      </div>

      {/* Filter Empty State */}
      {filteredQuestions.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {filterTab === "CORRECT"
              ? "No correct questions yet. Don't be discouraged — mistakes are where real learning happens!"
              : filterTab === "INCORRECT"
              ? "Flawless! You didn't get any questions incorrect in this set. 🎉"
              : filterTab === "SKIPPED"
              ? "You attempted every single question in this set! 🎯"
              : "No questions found."}
          </p>
          <button
            type="button"
            data-testid="button-view-all-questions"
            onClick={() => setFilterTab("ALL")}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            View all {totalQuestions} questions <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Detailed Question Review Cards */}
      {filteredQuestions.length > 0 && (
        <div className="mt-6 space-y-6 text-left">
          {filteredQuestions.map((item, itemIndex) => {
            const trueIndex = questionSolutions.findIndex((q) => q.questionId === item.questionId);
            const qNum = item.questionNumber ?? (trueIndex >= 0 ? trueIndex + 1 : itemIndex + 1);
            const qStatus = getQuestionStatus(item);
            const sessionQ =
              session.questions.find((sq) => sq.questionId === item.questionId) ||
              session.questions[trueIndex >= 0 ? trueIndex : itemIndex];
            const options =
              item.options && item.options.length > 0
                ? item.options
                : sessionQ?.options || [];
            const solution = item.solutions?.[0] || sessionQ?.solutions?.[0];
            const markedSolutions = item.markedSolutions || [];
            const isHighlighted = highlightedQNum === qNum;
            const parentContent = item.parentQuestion?.content || sessionQ?.parentQuestion?.content;

            return (
              <article
                key={`${item.questionId}-${qNum}`}
                id={`review-question-${qNum}`}
                data-testid={`solution-card-${qNum}`}
                className={`scroll-mt-6 rounded-3xl border bg-white p-5 shadow-xs transition-all duration-300 sm:p-7 ${
                  isHighlighted
                    ? "border-indigo-500 ring-2 ring-indigo-500/40 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header: Question Number, Status Badge, Time, and Chapter */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Question {qNum}
                    </span>
                    {qStatus === "CORRECT" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Correct (+4)
                      </span>
                    )}
                    {qStatus === "INCORRECT" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                        <XCircle className="h-3.5 w-3.5" /> Incorrect (-1)
                      </span>
                    )}
                    {qStatus === "SKIPPED" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                        <MinusCircle className="h-3.5 w-3.5" /> Skipped (0)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {(item.subjectName || sessionQ?.subjectName) && (
                      <span className="rounded-lg bg-indigo-50/60 px-2 py-0.5 font-semibold text-indigo-700">
                        {item.subjectName || sessionQ?.subjectName}
                      </span>
                    )}
                    {(item.chapterName || sessionQ?.chapterName) && (
                      <span className="hidden max-w-[200px] truncate rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-600 sm:inline-block">
                        {item.chapterName || sessionQ?.chapterName}
                      </span>
                    )}
                    {item.timeTaken !== undefined && item.timeTaken > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatDuration(item.timeTaken)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comprehension / Passage Context if present */}
                {parentContent && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Passage / Context
                    </span>
                    <HtmlContent
                      html={parentContent}
                      className="mt-2 text-sm leading-relaxed text-slate-700"
                    />
                  </div>
                )}

                {/* Question Prompt with KaTeX */}
                <div className="mt-4">
                  <HtmlContent
                    html={item.content}
                    className="text-sm sm:text-base leading-relaxed text-slate-900 font-medium"
                  />
                </div>

                {/* Options List with Selection vs Correct Comparison */}
                {options.length > 0 ? (
                  <div className="mt-6 space-y-3">
                    {options.map((option, optIdx) => {
                      const optNumber = optIdx + 1;
                      const optLetter = String.fromCharCode(65 + optIdx);
                      const isOptionCorrect = Boolean(option.isCorrect);
                      const isUserChoice = markedSolutions.includes(optNumber);

                      let cardStyle = "border-slate-200 bg-white text-slate-700";
                      let letterStyle = "bg-slate-100 text-slate-600";
                      let badge = null;

                      if (isOptionCorrect && isUserChoice) {
                        cardStyle =
                          "border-2 border-emerald-500 bg-emerald-50/60 text-emerald-950 ring-1 ring-emerald-500/20";
                        letterStyle = "bg-emerald-600 text-white font-bold";
                        badge = (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                            <Check className="h-3.5 w-3.5" /> Correct • Your Choice
                          </span>
                        );
                      } else if (isOptionCorrect && !isUserChoice) {
                        cardStyle =
                          "border-2 border-emerald-400 bg-emerald-50/30 text-emerald-950";
                        letterStyle =
                          "border-2 border-emerald-500 bg-emerald-100 text-emerald-800 font-bold";
                        badge = (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            <Check className="h-3.5 w-3.5" /> Correct Answer
                          </span>
                        );
                      } else if (!isOptionCorrect && isUserChoice) {
                        cardStyle =
                          "border-2 border-rose-400 bg-rose-50/60 text-rose-950 ring-1 ring-rose-400/20";
                        letterStyle = "bg-rose-600 text-white font-bold";
                        badge = (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                            <X className="h-3.5 w-3.5" /> Your Choice (Incorrect)
                          </span>
                        );
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`flex flex-col gap-2 rounded-2xl border p-3.5 transition-all sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:p-4 ${cardStyle}`}
                        >
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${letterStyle}`}
                            >
                              {optLetter}
                            </span>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <HtmlContent
                                html={option.text}
                                className="text-sm leading-6 text-slate-800 [&_p]:mb-0"
                              />
                              {option.imageUrl && (
                                <img
                                  src={option.imageUrl}
                                  alt={`Option ${optLetter}`}
                                  className="mt-2 max-h-44 rounded-lg border border-slate-200 bg-white object-contain"
                                />
                              )}
                            </div>
                          </div>
                          {badge && <div className="self-end sm:self-center">{badge}</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Numerical / Integer Question Summary */
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Numerical Value Comparison
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div
                        className={`rounded-xl border p-3.5 ${
                          qStatus === "CORRECT"
                            ? "border-emerald-300 bg-emerald-50/60 text-emerald-950"
                            : qStatus === "INCORRECT"
                            ? "border-rose-300 bg-rose-50/60 text-rose-950"
                            : "border-slate-200 bg-white text-slate-800"
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-500">
                          Your Answer:
                        </span>
                        <p className="mt-1 text-base font-bold">
                          {markedSolutions.length > 0
                            ? markedSolutions.join(", ")
                            : "Skipped / Unattempted"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-3.5 text-emerald-950">
                        <span className="text-xs font-semibold text-emerald-700">
                          Correct Value:
                        </span>
                        <p className="mt-1 text-base font-bold text-emerald-900">
                          {sessionQ?.numericAnswer !== undefined &&
                          sessionQ?.numericAnswer !== null
                            ? String(sessionQ.numericAnswer)
                            : "Refer to step-by-step solution below"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step-by-Step Solution Box */}
                {(solution?.text || solution?.videoSolution?.url) && (
                  <div className="mt-5 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 to-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100/80 bg-indigo-50/60 px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                        <BookOpen className="h-4 w-4 text-indigo-600" />
                        <span>Step-by-Step Solution</span>
                      </div>
                      {solution?.videoSolution?.url && (() => {
                        const vType = getVideoType(solution.videoSolution.url);
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveVideo({
                                type: vType || "direct",
                                videoId: vType === "youtube" ? getYouTubeId(solution.videoSolution.url)! : undefined,
                                url: solution.videoSolution.url!,
                                title: `Question ${qNum}: ${item.subjectName || ""} - ${item.chapterName || ""}`,
                              })
                            }
                            data-testid={`button-video-solution-${qNum}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5 fill-white" /> Watch Video Solution
                          </button>
                        );
                      })()}
                    </div>
                    {solution?.text && (
                      <div className="p-4 sm:p-5 text-sm leading-relaxed text-slate-700 font-normal">
                        <HtmlContent html={solution.text} />
                      </div>
                    )}
                    {solution?.otherSolution && (
                      <div className="border-t border-indigo-100/60 p-4 sm:p-5 text-sm text-slate-600">
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                          Alternative Method
                        </p>
                        <HtmlContent html={solution.otherSolution} />
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Footer Bottom Actions Bar */}
      <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50/60 p-6 text-center sm:p-8">
        <h3 className="text-lg font-bold text-slate-900">Ready for another challenge?</h3>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Try another round to solidify your understanding or explore new chapters.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            data-testid="button-practice-footer-retry"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
          >
            <RotateCcw className="h-4 w-4" /> Retry this test
          </button>
          <button
            data-testid="button-practice-footer-new"
            onClick={onRestart}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4 text-slate-500" /> New set
          </button>
          <button
            data-testid="button-practice-footer-share"
            disabled={shareTest.isPending}
            onClick={handleShare}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100"
          >
            {shareTest.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {shareFeedback || "Share challenge"}
          </button>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          data-testid="button-back-to-top"
          className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-lg backdrop-blur-sm transition-all hover:bg-slate-50 active:scale-95"
        >
          <ArrowUp className="h-4 w-4 text-indigo-600" /> Back to top
        </button>
      )}

      {/* In-Page YouTube Video Solution Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: "spring", duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
            >
              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      activeVideo.type === "youtube"
                        ? "bg-red-600/20 text-red-500"
                        : activeVideo.type === "dash"
                        ? "bg-purple-600/20 text-purple-400"
                        : "bg-indigo-600/20 text-indigo-400"
                    }`}
                  >
                    <Play
                      className={`h-4 w-4 ${
                        activeVideo.type === "youtube" ? "fill-red-500" : "fill-current"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        activeVideo.type === "youtube"
                          ? "text-red-400"
                          : activeVideo.type === "dash"
                          ? "text-purple-400"
                          : "text-indigo-400"
                      }`}
                    >
                      {activeVideo.type === "youtube"
                        ? "YouTube Video Solution"
                        : activeVideo.type === "dash"
                        ? "MPEG-DASH Stream"
                        : "Video Solution"}
                    </p>
                    <h4 className="truncate text-sm font-semibold text-white sm:text-base">
                      {activeVideo.title}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={activeVideo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                    title={activeVideo.type === "youtube" ? "Open in YouTube" : "Open URL"}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      {activeVideo.type === "youtube" ? "Open in YouTube" : "Open URL"}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveVideo(null)}
                    data-testid="button-close-video-modal"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white cursor-pointer"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Video Player according to format */}
              {activeVideo.type === "youtube" && activeVideo.videoId ? (
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?autoplay=1&rel=0&modestbranding=1`}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
              ) : activeVideo.type === "dash" ? (
                <DashPlayer url={activeVideo.url} />
              ) : (
                <DirectPlayer url={activeVideo.url} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function InfinitePractice() {
  const { batchId = "" } = useParams<{ batchId: string }>();
  const [roomState, setRoomState] = useState<RoomState>("selection");
  const [session, setSession] = useState<{ testId: string; questions: InfinitePracticeQuestion[] } | null>(null);
  const [timeLimitPerQuestion, setTimeLimitPerQuestion] = useState(0);
  const [testResult, setTestResult] = useState<InfinitePracticeTestSolution | null>(null);
  const matchedBatch = INFINITE_PRACTICE_BATCHES.find((b) => b.id === batchId || b.name === batchId);
  const batchName = matchedBatch?.name || "Infinite Practice";

  const sharedCode = useMemo(() => {
    if (typeof window === "undefined") return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("test") || null;
  }, []);

  usePageMeta({
    title: `Infinite Practice | ${batchName} | Wegenz`,
    description: `Choose a subject and chapter to practise questions from ${batchName} on Wegenz.`,
    canonical: `/practice/${batchId}`,
  });

  const startQuestionRoom = (
    nextSession: { testId: string; questions: InfinitePracticeQuestion[] },
    timeLimitSeconds: number,
  ) => {
    setSession(nextSession);
    setTimeLimitPerQuestion(timeLimitSeconds);
    setTestResult(null);
    setRoomState("question");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const retryCurrentTest = () => {
    if (!session) return;
    setTestResult(null);
    setRoomState("question");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen w-full bg-white text-slate-900" data-testid="page-infinite-practice">
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {roomState === "selection" && (
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                  <FileQuestion className="h-3.5 w-3.5" /> Your practice room
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Infinite Practice<span className="text-indigo-600">.</span>
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
                  Pick a subject, chapter, difficulty, and question count. Practise at your own pace.
                </p>
              </div>
              <Link
                data-testid="link-practice-back"
                href="/"
                className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:self-auto"
              >
                <ArrowLeft className="h-4 w-4" /> All tracks
              </Link>
            </div>
            <SelectionPanel
              batchId={batchId}
              batchName={batchName}
              sharedCode={sharedCode}
              onStarted={startQuestionRoom}
            />
          </div>
        )}
        {roomState === "question" && session && (
          <QuestionRoom
            batchId={batchId}
            batchName={batchName}
            session={session}
            timeLimitSeconds={timeLimitPerQuestion}
            onComplete={(result) => {
              setTestResult(result);
              setRoomState("complete");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onExit={() => {
              if (window.confirm("Are you sure you want to exit? Your practice test progress will be lost.")) {
                setSession(null);
                setRoomState("selection");
              }
            }}
          />
        )}
        {roomState === "complete" && testResult && session && (
          <Completion
            batchId={batchId}
            batchName={batchName}
            session={session}
            timeLimitSeconds={timeLimitPerQuestion}
            result={testResult}
            onRetry={retryCurrentTest}
            onRestart={() => {
              if (typeof window !== "undefined" && window.location.search) {
                window.history.replaceState({}, "", window.location.pathname);
              }
              setSession(null);
              setTestResult(null);
              setRoomState("selection");
            }}
          />
        )}
      </main>
    </div>
  );
}