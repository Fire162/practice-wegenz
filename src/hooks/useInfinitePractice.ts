import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { apiUrl, apiFetch } from "@/lib/apiUrl";

const MINUTE = 60_000;

export const INFINITE_PRACTICE_BATCHES = [
  { id: "11th_JEE", name: "11th JEE", detail: "Practice for Class 11 JEE (Physics, Chemistry, Maths)" },
  { id: "12th_JEE", name: "12th JEE", detail: "Practice for Class 12 JEE (Physics, Chemistry, Maths)" },
  { id: "11th_NEET", name: "11th NEET", detail: "Practice for Class 11 NEET (Botany, Chemistry, Physics, Zoology)" },
  { id: "12th_NEET", name: "12th NEET", detail: "Practice for Class 12 NEET (Botany, Chemistry, Physics, Zoology)" },
] as const;

export interface InfinitePracticeSubject {
  subjectId: string;
  englishName: string;
  hindiName?: string | null;
  icon?: string | null;
  chaptersCount?: number;
  totalQuestions?: number;
}

export interface InfinitePracticeChapter {
  chapterId: string;
  englishName: string;
  hindiName?: string | null;
  subjectId: string;
  classId: string;
  questionCount?: string | number;
}

export interface InfinitePracticeOption {
  text?: string;
  imageUrl?: string;
  isCorrect?: boolean;
}

export interface InfinitePracticeParentQuestion {
  content?: string;
  solutions?: unknown[];
  options?: unknown[];
}

export interface InfinitePracticeQuestion {
  questionId: string;
  content: string;
  plainQuestionText?: string;
  type: number;
  typeTitle: string;
  difficulty: number;
  options: InfinitePracticeOption[];
  solutions: any[];
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  parentQuestion?: InfinitePracticeParentQuestion | null;
  numericAnswer?: string | number | null;
}

export interface InfinitePracticeSession {
  testId: string;
  questions: InfinitePracticeQuestion[];
}

export interface StartInfinitePracticeInput {
  examCategory?: string;
  difficultyLevel?: number[];
  questionTypes?: number[];
  questionsCount: number;
  chapters: {
    chapterId: string;
    classId: string;
    chapterName?: string;
    subjectId?: string;
    subjectName?: string;
  }[];
  subjectId?: string;
  subjectName?: string;
  subjectNames?: string[];
  subjectIds?: string[];
  subjectQuestionCounts?: Record<string, number>;
  language?: string;
}

export interface SubmitInfinitePracticeInput {
  questionId: string;
  chapterId?: string;
  questionNumber?: number;
  difficulty?: number;
  type?: number;
  status: "ATTEMPTED" | "SKIPPED";
  markedSolutions?: number[];
  timeTaken?: number;
  textAnswer?: string;
}

export interface SubmitInfinitePracticeResult {
  score?: number;
  accuracy?: number;
}

export interface InfinitePracticeSolutionOption {
  text?: string;
  imageUrl?: string;
  isCorrect?: boolean;
}

export interface InfinitePracticeSolution {
  text?: string;
  videoSolution?: {
    type?: number;
    url?: string;
  };
  otherSolution?: string | null;
}

export interface InfinitePracticeQuestionSolution {
  questionId: string;
  content: string;
  plainQuestionText?: string;
  options?: InfinitePracticeSolutionOption[];
  solutions?: InfinitePracticeSolution[];
  type?: number;
  difficulty?: number;
  chapterId?: string;
  chapterName?: string;
  subjectId?: string;
  subjectName?: string;
  status?: string;
  markedSolutions?: number[];
  timeTaken?: number;
  questionNumber?: number;
  parentQuestion?: InfinitePracticeParentQuestion | null;
  numericAnswer?: string | number | null;
}

export interface InfinitePracticeTestSolution {
  _id: string;
  score: number;
  userScore?: number;
  accuracy: number;
  totalCorrectQuestions?: number;
  totalIncorrectQuestions?: number;
  totalSkippedQuestions?: number;
  questionsResponses?: InfinitePracticeQuestionSolution[];
}

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload as { error?: { message?: string } } | null)?.error?.message ||
      (typeof (payload as any)?.error === "string" ? (payload as any).error : null) ||
      fallback;
    throw new Error(message);
  }
  return payload as T;
}

export function useInfinitePracticeSubjects(batchId: string) {
  return useQuery({
    queryKey: ["infinitePracticeSubjects", batchId],
    queryFn: async () => {
      const response = await apiFetch(
        apiUrl(`/api/subjects?batchId=${encodeURIComponent(batchId)}`),
      );
      return readJson<{
        success: boolean;
        data: {
          examCategory: string;
          exams: unknown[];
          subjects: InfinitePracticeSubject[];
        };
      }>(response, "Could not load practice subjects.");
    },
    enabled: Boolean(batchId?.trim()),
    staleTime: MINUTE * 30,
    gcTime: MINUTE * 120,
  });
}

export function useInfinitePracticeChapters(
  subjectId: string,
  batchId = "11th_JEE",
) {
  return useQuery({
    queryKey: ["infinitePracticeChapters", batchId, subjectId],
    queryFn: async () => {
      const response = await apiFetch(
        apiUrl(
          `/api/chapters?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}`,
        ),
      );
      return readJson<{
        success: boolean;
        data: InfinitePracticeChapter[];
      }>(response, "Could not load chapters for this subject.");
    },
    enabled: Boolean(batchId?.trim()) && Boolean(subjectId),
    staleTime: MINUTE * 30,
    gcTime: MINUTE * 120,
  });
}

export function useInfinitePracticeMultiSubjectChapters(
  subjectIds: string[],
  batchId = "11th_JEE",
) {
  return useQueries({
    queries: subjectIds.map((subjectId) => ({
      queryKey: ["infinitePracticeChapters", batchId, subjectId],
      queryFn: async () => {
        const response = await apiFetch(
          apiUrl(
            `/api/chapters?batchId=${encodeURIComponent(batchId)}&subjectId=${encodeURIComponent(subjectId)}`,
          ),
        );
        const res = await readJson<{
          success: boolean;
          data: InfinitePracticeChapter[];
        }>(response, "Could not load chapters for this subject.");
        return {
          subjectId,
          chapters: res.data || [],
        };
      },
      enabled: Boolean(batchId?.trim()) && Boolean(subjectId),
      staleTime: MINUTE * 30,
      gcTime: MINUTE * 120,
    })),
  });
}

export function useStartInfinitePractice(batchId: string) {
  return useMutation({
    mutationFn: async (input: StartInfinitePracticeInput): Promise<InfinitePracticeSession> => {
      const batchMapping: Record<string, string> = {
        "676e4dee1ec923bc192f38c9": "11th_JEE",
        "65dc6fbabb55350018d555b7": "12th_JEE",
        "676e5677418e84037bd6247c": "11th_NEET",
        "65dc6fbaf5bcd500180102cd": "12th_NEET",
      };
      const grade = batchMapping[batchId] || batchId || "11th_JEE";

      // Group selected chapters by subjectId
      const subjectToChaptersMap: Record<string, string[]> = {};
      const subjectToNameMap: Record<string, string> = {};

      input.chapters.forEach((ch) => {
        const sKey = ch.subjectId || ch.subjectName || "default";
        if (!subjectToChaptersMap[sKey]) {
          subjectToChaptersMap[sKey] = [];
        }
        if (ch.chapterName) {
          subjectToChaptersMap[sKey].push(ch.chapterName.trim());
        }
        if (ch.subjectName) {
          subjectToNameMap[sKey] = ch.subjectName;
        }
      });

      const activeSubjectKeys = Object.keys(subjectToChaptersMap);
      const rawQuestions: any[] = [];

      // Determine per-subject question targets
      const subjectAllocations: Record<string, number> = {};
      if (input.subjectQuestionCounts && Object.keys(input.subjectQuestionCounts).length > 0) {
        activeSubjectKeys.forEach((sKey) => {
          subjectAllocations[sKey] = input.subjectQuestionCounts?.[sKey] ?? 0;
        });
      } else if (activeSubjectKeys.length > 1) {
        const total = Math.min(Math.max(1, input.questionsCount), 100);
        const base = Math.floor(total / activeSubjectKeys.length);
        const remainder = total % activeSubjectKeys.length;
        activeSubjectKeys.forEach((sKey, index) => {
          subjectAllocations[sKey] = base + (index < remainder ? 1 : 0);
        });
      } else if (activeSubjectKeys.length === 1) {
        subjectAllocations[activeSubjectKeys[0]] = Math.min(Math.max(1, input.questionsCount), 100);
      }

      // Query per subject if multiple subjects or specific allocations exist
      if (activeSubjectKeys.length > 1 && Object.keys(subjectAllocations).length > 0) {
        const fetchPromises = activeSubjectKeys.map(async (sKey) => {
          const count = subjectAllocations[sKey] || 0;
          if (count <= 0) return [];

          const sName = subjectToNameMap[sKey] || sKey;
          const chNames = subjectToChaptersMap[sKey] || [];

          let qParams = `grade=${encodeURIComponent(grade)}&count=${count}&subjects=${encodeURIComponent(sName)}`;
          if (chNames.length > 0) {
            qParams += `&chapters=${encodeURIComponent(chNames.join(","))}`;
          }
          if (input.questionTypes && input.questionTypes.length > 0) {
            qParams += `&types=${encodeURIComponent(input.questionTypes.join(","))}`;
          }
          if (input.difficultyLevel && input.difficultyLevel.length > 0) {
            qParams += `&difficulty=${encodeURIComponent(input.difficultyLevel.join(","))}`;
          }

          const resp = await apiFetch(apiUrl(`/api/random?${qParams}`));
          if (!resp.ok) return [];
          const data = await resp.json().catch(() => null);
          return data?.questions || [];
        });

        const results = await Promise.all(fetchPromises);
        results.forEach((qList) => rawQuestions.push(...qList));
      }

      // Fallback if multi-subject didn't yield enough or single subject mode
      if (rawQuestions.length === 0) {
        const allSubjectNames = [
          ...(input.subjectNames || []),
          ...(input.subjectName ? [input.subjectName] : []),
        ].filter(Boolean);

        const selectedChapterNames = input.chapters
          ?.map((ch) => ch.chapterName?.trim())
          .filter((name): name is string => Boolean(name)) || [];

        const totalCount = Math.min(Math.max(1, input.questionsCount), 100);
        let queryParams = `grade=${encodeURIComponent(grade)}&count=${totalCount}`;
        if (allSubjectNames.length > 0) {
          queryParams += `&subjects=${encodeURIComponent(allSubjectNames.join(","))}`;
        }
        if (selectedChapterNames.length > 0) {
          queryParams += `&chapters=${encodeURIComponent(selectedChapterNames.join(","))}`;
        }
        if (input.questionTypes && input.questionTypes.length > 0) {
          queryParams += `&types=${encodeURIComponent(input.questionTypes.join(","))}`;
        }
        if (input.difficultyLevel && input.difficultyLevel.length > 0) {
          queryParams += `&difficulty=${encodeURIComponent(input.difficultyLevel.join(","))}`;
        }

        const fallbackResp = await apiFetch(apiUrl(`/api/random?${queryParams}`));
        if (!fallbackResp.ok) {
          throw new Error("Could not create practice set. Please try again in a moment.");
        }
        const fallbackData = await fallbackResp.json();
        rawQuestions.push(...(fallbackData?.questions || []));
      }

      if (rawQuestions.length === 0) {
        throw new Error("No questions available for this selection.");
      }

      const questions: InfinitePracticeQuestion[] = rawQuestions.map((item: any, idx: number) => {
        const q = item.question || item;
        return {
          questionId: q.questionId || `pyq-${idx}`,
          content: q.content,
          plainQuestionText: q.plainQuestionText,
          type: q.type ?? 1,
          typeTitle: q.typeTitle || "Single Choice Question",
          difficulty: q.difficulty ?? 1,
          options: (q.options || []).map((opt: any) => ({
            text: opt.text,
            imageUrl: opt.imageUrl,
            isCorrect: Boolean(opt.isCorrect),
          })),
          solutions: q.solutions || [],
          chapterId: q.chapterId || "",
          chapterName: q.chapterName || item.chapter,
          subjectId: q.subjectId || input.subjectId,
          subjectName: q.subjectName || item.subject,
          parentQuestion: q.parentQuestion || null,
          numericAnswer: q.numericAnswer ?? (q.answers?.[0] || null),
        };
      });

      const sessionResult = {
        testId: `session-${Date.now()}`,
        questions,
      };
      localSessionQuestions.set(sessionResult.testId, questions);
      return sessionResult;
    },
  });
}

// In-memory store for test sessions
const localSessionQuestions = new Map<string, InfinitePracticeQuestion[]>();
const localSessionAnswers = new Map<string, SubmitInfinitePracticeInput[]>();

export function registerLocalPracticeSession(
  testId: string,
  questions: InfinitePracticeQuestion[],
) {
  localSessionQuestions.set(testId, questions);
}

export function useSubmitInfinitePractice(testId: string) {
  return useMutation({
    mutationFn: async (
      input: { questionsResponse: SubmitInfinitePracticeInput[] },
    ): Promise<SubmitInfinitePracticeResult> => {
      localSessionAnswers.set(testId, input.questionsResponse);
      return { score: 0, accuracy: 100 };
    },
  });
}

export function useInfinitePracticeSolution(
  testId: string,
  fallbackQuestions?: InfinitePracticeQuestion[],
) {
  return useMutation({
    mutationFn: async (): Promise<InfinitePracticeTestSolution> => {
      let questions = localSessionQuestions.get(testId) || [];
      if (questions.length === 0 && fallbackQuestions && fallbackQuestions.length > 0) {
        localSessionQuestions.set(testId, fallbackQuestions);
        questions = fallbackQuestions;
      }
      const answers = localSessionAnswers.get(testId) || [];
      const answerMap = new Map(answers.map((a) => [a.questionId, a]));

      let correct = 0;
      let incorrect = 0;
      let skipped = 0;

      const questionsResponses = questions.map((q, idx) => {
        const ans = answerMap.get(q.questionId);
        const isAttempted = ans?.status === "ATTEMPTED" && (ans.markedSolutions?.length ?? 0) > 0;

        const correctIndices = (q.options || [])
          .map((opt: any, optIdx: number) => (opt.isCorrect ? optIdx + 1 : null))
          .filter((val): val is number => val !== null);

        const marked = ans?.markedSolutions || [];
        let isAnswerCorrect = false;

        if (isAttempted) {
          if (correctIndices.length > 0) {
            isAnswerCorrect =
              correctIndices.length === marked.length &&
              correctIndices.every((val) => marked.includes(val));
          } else if (q.numericAnswer !== undefined && q.numericAnswer !== null && marked.length > 0) {
            const userNum = Number(marked[0]);
            const correctNum = Number(q.numericAnswer);
            isAnswerCorrect =
              !isNaN(userNum) && !isNaN(correctNum)
                ? Math.abs(userNum - correctNum) < 0.001
                : String(marked[0]).trim().toLowerCase() === String(q.numericAnswer).trim().toLowerCase();
          }
        }

        if (!isAttempted) {
          skipped++;
        } else if (isAnswerCorrect) {
          correct++;
        } else {
          incorrect++;
        }

        return {
          questionId: q.questionId,
          content: q.content,
          plainQuestionText: q.plainQuestionText,
          options: (q.options || []).map((opt: any) => ({
            text: opt.text,
            imageUrl: opt.imageUrl,
            isCorrect: Boolean(opt.isCorrect),
          })),
          solutions: (q as any).solutions || [],
          type: q.type,
          difficulty: q.difficulty,
          chapterId: q.chapterId,
          chapterName: q.chapterName,
          subjectId: q.subjectId,
          subjectName: q.subjectName,
          status: isAttempted ? (isAnswerCorrect ? "CORRECT" : "INCORRECT") : "SKIPPED",
          markedSolutions: marked,
          timeTaken: ans?.timeTaken || 0,
          questionNumber: idx + 1,
          parentQuestion: q.parentQuestion || null,
          numericAnswer: q.numericAnswer ?? null,
        };
      });

      const totalAttempted = correct + incorrect;
      const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 0;
      const userScore = correct * 4 - incorrect * 1;

      return {
        _id: testId,
        score: userScore,
        userScore: userScore,
        accuracy,
        totalCorrectQuestions: correct,
        totalIncorrectQuestions: incorrect,
        totalSkippedQuestions: skipped,
        questionsResponses,
      };
    },
  });
}

export interface SharedInfinitePracticeData {
  code: string;
  batchId: string;
  batchName: string;
  subjectNames: string[];
  timeLimitSeconds: number;
  questions: InfinitePracticeQuestion[];
  createdAt: number;
}

export function useShareInfinitePractice() {
  return useMutation({
    mutationFn: async (payload: {
      batchId: string;
      batchName?: string;
      subjectNames?: string[];
      timeLimitSeconds: number;
      questions: InfinitePracticeQuestion[];
    }): Promise<{ ok: boolean; code: string; timeLimitSeconds: number; count: number }> => {
      const resp = await apiFetch(apiUrl("/api/share"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        throw new Error("Failed to share practice test");
      }
      return resp.json();
    },
  });
}

export function useGetSharedInfinitePractice(code?: string | null) {
  return useQuery({
    queryKey: ["shared-infinite-practice", code],
    queryFn: async (): Promise<SharedInfinitePracticeData | null> => {
      if (!code) return null;
      const resp = await apiFetch(apiUrl(`/api/share/${encodeURIComponent(code)}`));
      if (!resp.ok) return null;
      const res = await resp.json();
      return res.data || null;
    },
    enabled: Boolean(code?.trim()),
    staleTime: MINUTE * 15,
  });
}
