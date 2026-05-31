"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  CandidateTaskApp,
  setCandidateTaskStatus,
  setCandidateTaskAppTakenStatus,
  getCandidateTaskApps,
} from "@/lib/actions";
import { toast } from "sonner";
import { useDebounce } from "@uidotdev/usehooks";

interface CandidateTaskContextType {
  // State
  candidateTaskApps: CandidateTaskApp[];
  totalCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  search: string;
  selectedGenres: string[];
  excludeGenres: string[];
  showTaken: boolean;
  // Actions
  setSearch: (search: string) => void;
  setSelectedGenres: (genres: string[]) => void;
  setExcludeGenres: (genres: string[]) => void;
  setShowTaken: (show: boolean) => void;
  handleSetAppTaken: (id: string, isTaken: boolean) => Promise<void>;
  handleSetTaskStatus: (
    id: string,
    taskIndex: number,
    status: "open" | "hidden"
  ) => Promise<boolean>;
  loadMore: () => void;
  resetFilters: () => void;
  fetchCandidateTaskApps: () => void;
}

const CandidateTaskContext = createContext<CandidateTaskContextType | null>(
  null
);

export function CandidateTaskProvider({ children }: { children: ReactNode }) {
  const [candidateTaskApps, setCandidateTaskApps] = useState<
    CandidateTaskApp[]
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [excludeGenres, setExcludeGenres] = useState<string[]>([]);
  const [showTaken, setShowTaken] = useState(false);
  const [, setPage] = useState(1);
  const pageRef = useRef(1);

  const debouncedSearch = useDebounce(search, 500);
  const pageSize = 100;

  // Fetch with current filters
  const fetchCandidateTaskApps = useCallback(
    async (isLoadMore = false) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
          pageRef.current = 1;
          setPage(1);
        }

        const nextPage = isLoadMore ? pageRef.current + 1 : 1;
        const res = await getCandidateTaskApps({
          isTaken: showTaken,
          page: nextPage,
          pageSize,
          search: debouncedSearch,
          selectedGenres,
          excludeGenres,
        });

        if (res.ok && res.data) {
          if (isLoadMore) {
            setCandidateTaskApps((prev) => [
              ...prev,
              ...res.data!.candidateTaskApps,
            ]);
            pageRef.current = nextPage;
            setPage(nextPage);
          } else {
            setCandidateTaskApps(res.data.candidateTaskApps);
            pageRef.current = 1;
            setPage(1);
          }
          setTotalCount(res.data.totalCount);
          setHasMore(res.data.hasMore);
        }
      } catch (error) {
        console.error("Failed to fetch candidate task apps:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [showTaken, pageSize, debouncedSearch, selectedGenres, excludeGenres]
  );

  // Auto-fetch when filters change
  useEffect(() => {
    fetchCandidateTaskApps();
  }, [fetchCandidateTaskApps]);

  const handleSetAppTaken = async (id: string, isTaken: boolean) => {
    setCandidateTaskApps((prev) => prev.filter((app) => app.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));

    const result = await setCandidateTaskAppTakenStatus({ id, isTaken });
    if (!result.ok) {
      toast.error(result.message);
    }
  };

  const handleSetTaskStatus = async (
    id: string,
    taskIndex: number,
    status: "open" | "hidden"
  ) => {
    const result = await setCandidateTaskStatus({ id, taskIndex, status });
    if (!result.ok || !result.data) {
      toast.error(result.message);
      return false;
    }

    setCandidateTaskApps((prev) =>
      prev.map((app) =>
        app.id === id ? result.data!.candidateTaskApp : app
      )
    );
    toast.success(status === "hidden" ? "Task hidden" : "Task restored");
    return true;
  };

  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchCandidateTaskApps(true);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedGenres([]);
    setExcludeGenres([]);
    pageRef.current = 1;
    setPage(1);
  };

  return (
    <CandidateTaskContext.Provider
      value={{
        candidateTaskApps,
        totalCount,
        isLoading,
        isLoadingMore,
        hasMore,
        search,
        selectedGenres,
        excludeGenres,
        showTaken,
        setSearch,
        setSelectedGenres,
        setExcludeGenres,
        setShowTaken,
        handleSetAppTaken,
        handleSetTaskStatus,
        loadMore,
        resetFilters,
        fetchCandidateTaskApps,
      }}
    >
      {children}
    </CandidateTaskContext.Provider>
  );
}

export function useCandidateTask() {
  const context = useContext(CandidateTaskContext);
  if (!context) {
    throw new Error(
      "useCandidateTask must be used within CandidateTaskProvider"
    );
  }
  return context;
}
