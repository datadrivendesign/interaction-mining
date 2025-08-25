"use client";

import { useEffect, useState, useMemo } from "react";
import { CandidateTaskApp, getCandidateTaskApps } from "@/lib/actions";
import { CandidateTaskGallery } from "./components/candidate-gallery";
import { CandidateTaskSearch } from "./components/candidate-search";
import { useDebounce } from "@uidotdev/usehooks";

export default function Page() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [excludeGenres, setExcludeGenres] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const [candidateTaskApps, setCandidateTaskApps] = useState<
    CandidateTaskApp[]
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchCandidateTaskApps();
  }, [debouncedSearch, selectedGenres, excludeGenres]);

  // Fetch with current filters
  const fetchCandidateTaskApps = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setPage(1); // Reset to first page on new search/filter
      }

      const res = await getCandidateTaskApps({
        isTaken: false,
        page: isLoadMore ? page + 1 : 1,
        pageSize,
        search: debouncedSearch,
        selectedGenres,
        excludeGenres,
      });

      if (res.ok && res.data) {
        if (isLoadMore) {
          // Append new results
          setCandidateTaskApps((prev) => [
            ...prev,
            ...res.data!.candidateTaskApps,
          ]);
          setPage((prev) => prev + 1);
        } else {
          // Replace results
          setCandidateTaskApps(res.data.candidateTaskApps);
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
  };

  // Load more function
  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchCandidateTaskApps(true);
    }
  };

  // Reset filters and search
  const resetFilters = () => {
    setSearch("");
    setSelectedGenres([]);
    setExcludeGenres([]);
    setPage(1);
  };

  return (
    <div className="flex w-dvw min-h-dvh justify-center items-start p-8 md:p-16">
      <div className="flex flex-col gap-4 w-full">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <CandidateTaskSearch
          search={search}
          setSearch={setSearch}
          totalCount={totalCount}
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          excludeGenres={excludeGenres}
          setExcludeGenres={setExcludeGenres}
          resetFilters={resetFilters}
        />
        <CandidateTaskGallery
          filteredApps={candidateTaskApps}
          search={search}
          hasMore={hasMore}
          onLoadMore={loadMore}
          isLoadingMore={isLoadingMore}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
