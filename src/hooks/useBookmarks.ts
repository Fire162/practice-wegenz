import { useState, useEffect, useCallback } from "react";
import type { InfinitePracticeQuestion } from "./useInfinitePractice";

const STORAGE_KEY = "wegenz_infinite_practice_bookmarks_v1";
const BOOKMARKS_EVENT = "wegenz_bookmarks_updated";

export function getStoredBookmarks(): InfinitePracticeQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InfinitePracticeQuestion[];
  } catch {
    return [];
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<InfinitePracticeQuestion[]>([]);

  useEffect(() => {
    setBookmarks(getStoredBookmarks());

    const handleUpdate = () => {
      setBookmarks(getStoredBookmarks());
    };

    window.addEventListener(BOOKMARKS_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const saveBookmarks = useCallback((next: InfinitePracticeQuestion[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(BOOKMARKS_EVENT));
    } catch (err) {
      console.error("Failed to persist bookmarks to localStorage", err);
    }
  }, []);

  const toggleBookmark = useCallback((question: InfinitePracticeQuestion) => {
    if (!question || !question.questionId) return;
    const current = getStoredBookmarks();
    const exists = current.some((q) => q.questionId === question.questionId);
    let next: InfinitePracticeQuestion[];
    if (exists) {
      next = current.filter((q) => q.questionId !== question.questionId);
    } else {
      next = [question, ...current];
    }
    saveBookmarks(next);
  }, [saveBookmarks]);

  const removeBookmark = useCallback((questionId: string) => {
    const current = getStoredBookmarks();
    const next = current.filter((q) => q.questionId !== questionId);
    saveBookmarks(next);
  }, [saveBookmarks]);

  const clearBookmarks = useCallback(() => {
    saveBookmarks([]);
  }, [saveBookmarks]);

  const isBookmarked = useCallback(
    (questionId: string) => {
      return bookmarks.some((q) => q.questionId === questionId);
    },
    [bookmarks],
  );

  const bookmarkedIds = bookmarks.map((q) => q.questionId);

  return {
    bookmarks,
    bookmarkedIds,
    toggleBookmark,
    removeBookmark,
    clearBookmarks,
    isBookmarked,
  };
}
