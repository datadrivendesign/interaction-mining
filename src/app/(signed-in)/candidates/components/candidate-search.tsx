import { CandidateTaskApp } from "@/lib/actions";
import { Input, InputIcon, InputRoot } from "@/components/ui/input-icon";
import { Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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

export const CandidateTaskSearch = ({
  search,
  setSearch,
  filteredCount,
  selectedGenres,
  setSelectedGenres,
  excludeGenres,
  setExcludeGenres,
}: {
  search: string;
  setSearch: (search: string) => void;
  filteredCount: number;
  selectedGenres: string[];
  setSelectedGenres: (genres: string[]) => void;
  excludeGenres: string[];
  setExcludeGenres: (genres: string[]) => void;
}) => {
  const [buttonClickStates, setButtonClickStates] = useState<{
    [genre: string]: ButtonClickState;
  }>(
    Object.fromEntries(
      iosAppGenres.map((genre) => [genre, ButtonClickState.NotSelected])
    )
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

  const handleAllButtonClick = () => {
    setButtonClickStates(
      Object.fromEntries(
        iosAppGenres.map((genre) => [genre, ButtonClickState.NotSelected])
      )
    );
    setSelectedGenres([]);
    setExcludeGenres([]);
  };

  return (
    <div className="flex flex-col gap-2 lg:gap-4">
      <div className="flex flex-wrap gap-2 items-center">
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
          {filteredCount} apps
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant="secondary"
          className="h-full"
          onClick={handleAllButtonClick}
        >
          All
        </Button>
        {iosAppGenres.map((genre) => (
          <Button
            key={genre}
            variant="secondary"
            className={`h-full ${
              selectedGenres.includes(genre)
                ? "bg-green-500/50 hover:bg-green-600/50"
                : ""
            } ${
              excludeGenres.includes(genre)
                ? "bg-red-500/50 hover:bg-red-600/50"
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
  );
};
