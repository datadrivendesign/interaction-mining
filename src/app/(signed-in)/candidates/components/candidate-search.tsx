import { Input, InputIcon, InputRoot } from "@/components/ui/input-icon";
import { Filter, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCandidateTask } from "@/app/(signed-in)/candidates/components/candidate-task-context";

const iosAppGenres = [
  "Books",
  "Business",
  "Developer Tools",
  "Education",
  "Entertainment",
  "Finance",
  "Food & Drink",
  "Games",
  "Graphics & Design",
  "Health & Fitness",
  "Lifestyle",
  "Kids",
  "Magazines & Newspapers",
  "Medical",
  "Music",
  "Navigation",
  "News",
  "Photo & Video",
  "Productivity",
  "Reference",
  "Shopping",
  "Social Networking",
  "Sports",
  "Travel",
  "Utilities",
  "Weather",
];

enum ButtonClickState {
  NotSelected = 0,
  Selected = 1,
  Excluded = 2,
}

export const CandidateTaskSearch = () => {
  const {
    search,
    setSearch,
    totalCount,
    selectedGenres,
    setSelectedGenres,
    excludeGenres,
    setExcludeGenres,
    resetFilters,
    showTaken,
  } = useCandidateTask();
  const [showFilters, setShowFilters] = useState(false);

  const [buttonClickStates, setButtonClickStates] = useState<{
    [genre: string]: ButtonClickState;
  }>(
    Object.fromEntries(
      iosAppGenres.map((genre) => [genre, ButtonClickState.NotSelected]),
    ),
  );

  const handleButtonClick = (genre: string) => {
    let newClickState = (buttonClickStates[genre] + 1) % 3;
    setButtonClickStates((prev) => ({
      ...prev,
      [genre]: newClickState,
    }));
    if (newClickState === ButtonClickState.Selected) {
      // remove genre from excluded genres
      if (excludeGenres.includes(genre)) {
        setExcludeGenres(excludeGenres.filter((g) => g !== genre));
      }
      // add genre to selected genres
      setSelectedGenres([...selectedGenres, genre]);
    } else if (newClickState === ButtonClickState.Excluded) {
      // remove genre from selected genres
      if (selectedGenres.includes(genre)) {
        setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      }
      // add genre to excluded genres
      setExcludeGenres([...excludeGenres, genre]);
    } else {
      // remove genre from both selected and excluded genres
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      setExcludeGenres(excludeGenres.filter((g) => g !== genre));
    }
  };

  const activeFilterCount = selectedGenres.length + excludeGenres.length;

  const handleAllButtonClick = () => {
    setButtonClickStates(
      Object.fromEntries(
        iosAppGenres.map((genre) => [genre, ButtonClickState.NotSelected]),
      ),
    );
    resetFilters();
  };

  return (
    <div className="flex flex-col gap-2 lg:gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <InputRoot className="w-full md:w-96">
          <InputIcon>
            <Search className="text-muted-foreground" />
          </InputIcon>
          <Input
            placeholder="Search for apps"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            className="w-full"
          />
        </InputRoot>
        <Badge variant="secondary" className="h-full px-3">
          {totalCount} Apps {showTaken ? "Taken" : "Left"}
        </Badge>
        <Button
          type="button"
          variant={showFilters ? "default" : "outline"}
          className="h-full"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          <Filter className="text-muted-foreground" />
          Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </Button>
      </div>
      {activeFilterCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {selectedGenres.map((genre) => (
            <Badge
              key={`selected-${genre}`}
              className="bg-green-100 text-green-900 hover:bg-green-100 dark:bg-green-950 dark:text-green-200"
            >
              Include {genre}
            </Badge>
          ))}
          {excludeGenres.map((genre) => (
            <Badge
              key={`excluded-${genre}`}
              className="bg-red-100 text-red-900 hover:bg-red-100 dark:bg-red-950 dark:text-red-200"
            >
              Exclude {genre}
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleAllButtonClick}
          >
            <X className="size-4" />
            Clear
          </Button>
        </div>
      ) : null}
      {showFilters ? (
        <div className="rounded-md border bg-background p-3">
          <div className="mb-2 text-xs text-muted-foreground">
            Click once to include a genre, twice to exclude it.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {iosAppGenres.map((genre) => (
              <Button
                key={genre}
                type="button"
                variant="secondary"
                size="sm"
                className={`h-8 ${
                  selectedGenres.includes(genre)
                    ? "bg-green-500/50 hover:bg-green-600/50 dark:bg-green-400/50 dark:hover:bg-green-500/50"
                    : ""
                } ${
                  excludeGenres.includes(genre)
                    ? "bg-red-500/50 hover:bg-red-600/50 dark:bg-red-400/50 dark:hover:bg-red-500/50"
                    : ""
                }`}
                onClick={() => handleButtonClick(genre)}
              >
                <Filter
                  className={`text-muted-foreground ${
                    selectedGenres.includes(genre)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
                {genre}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
