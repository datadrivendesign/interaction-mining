"use client";

import { useEffect, useState, useMemo } from "react";
import { CandidateTaskApp, getCandidateTaskApps } from "@/lib/actions";
import { CandidateTaskGallery } from "./components/candidate-gallery";
import { CandidateTaskSearch } from "./components/candidate-search";

export default function Page() {
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [excludeGenres, setExcludeGenres] = useState<string[]>([]);
  const [candidateTaskApps, setCandidateTaskApps] = useState<
    CandidateTaskApp[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCandidateTaskApps = async () => {
      try {
        setIsLoading(true);
        const res = await getCandidateTaskApps({ isTaken: false });
        if (res.ok && res.data) {
          setCandidateTaskApps(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch candidate task apps:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCandidateTaskApps();
  }, []);

  // Memoized filtered results for performance
  const filteredApps = useMemo(() => {
    console.log("selectedGenres:", selectedGenres.length);
    console.log("excludeGenres:", excludeGenres.length);
    if (
      !search.trim() &&
      selectedGenres.length === 0 &&
      excludeGenres.length === 0
    )
      return candidateTaskApps;

    const searchLower = search.toLowerCase();
    return candidateTaskApps
      .filter((candidate) => {
        return candidate.app.metadata.name.toLowerCase().includes(searchLower);
      })
      .filter((candidate) => {
        if (selectedGenres.length > 0) {
          return candidate.app.metadata.genre.some((genre) =>
            selectedGenres.includes(genre)
          );
        }
        return true;
      })
      .filter((candidate) => {
        if (excludeGenres.length > 0) {
          return !candidate.app.metadata.genre.some((genre) =>
            excludeGenres.includes(genre)
          );
        }
        return true;
      });
  }, [candidateTaskApps, search, selectedGenres, excludeGenres]);

  if (isLoading) {
    return (
      <div className="flex w-dvw min-h-dvh justify-center items-start p-8 md:p-16">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Candidates</h1>
          <div className="text-muted-foreground">Loading apps...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-dvw min-h-dvh justify-center items-start p-8 md:p-16">
      <div className="flex flex-col gap-4 w-full">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <CandidateTaskSearch
          search={search}
          setSearch={setSearch}
          filteredCount={filteredApps.length}
          selectedGenres={selectedGenres}
          setSelectedGenres={setSelectedGenres}
          excludeGenres={excludeGenres}
          setExcludeGenres={setExcludeGenres}
        />
        <CandidateTaskGallery filteredApps={filteredApps} search={search} />
      </div>
    </div>
  );
}
