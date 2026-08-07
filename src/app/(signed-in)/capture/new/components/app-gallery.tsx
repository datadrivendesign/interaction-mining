import { Input, InputIcon, InputRoot } from "@/components/ui/input-icon";
import { Platform } from "@/lib/utils";
import { useAppSearch } from "@/lib/hooks/app";
import { Check, Loader2, Search } from "lucide-react";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PLACEHOLDER_COUNT = 8;

function GridPlaceholders({ prefix }: { prefix: string }) {
  return (
    <>
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
        <div
          key={`placeholder-${prefix}-${i}`}
          className="pointer-events-none invisible"
        >
          <div className="flex flex-col items-center">
            <div className="w-40 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function AppGallery({
  platform,
  app,
  setApp,
}: {
  platform: Platform;
  app: { name: string; id: string };
  setApp: Dispatch<SetStateAction<{ name: string; id: string }>>;
}) {
  const [search, setSearch] = useState("");

  const params = useMemo(
    () => ({
      query: search,
      where: { os: platform },
      limit: 10,
      page: 1,
      allowIOS: true,
    }),
    [search, platform],
  );
  const { apps: searchApps, loading } = useAppSearch(params);

  return (
    <>
      <div className="mt-3 flex w-full items-center justify-between">
        <InputRoot className="w-[100%]">
          <InputIcon>
            <Search size={20} className="text-muted-foreground" />
          </InputIcon>
          <Input
            placeholder="Search for apps"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputRoot>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-100 p-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 dark:bg-neutral-800">
        {loading ? (
          <>
            <GridPlaceholders prefix="loading" />
            <div className="col-span-full flex flex-row items-center justify-center gap-2 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-lg font-medium">Loading apps...</span>
            </div>
          </>
        ) : searchApps.length === 0 ? (
          <>
            <GridPlaceholders prefix="empty" />
            <div className="col-span-full flex items-center justify-center text-center text-muted-foreground">
              <span className="text-lg font-medium">No apps to show.</span>
            </div>
          </>
        ) : (
          <>
            {searchApps.map((searchApp) => {
              const isSelected = searchApp.packageName === app.id;

              return (
                <TooltipProvider key={`tooltip-${searchApp.id}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`focus-within:ring-primary hover:border-primary/40 relative flex min-h-20 cursor-pointer items-center gap-2 rounded-lg border p-2 text-left transition focus-within:ring-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-primary/40 ring-2"
                            : "border-transparent"
                        }`}
                        onClick={() =>
                          setApp({
                            name: searchApp.metadata.name,
                            id: searchApp.packageName,
                          })
                        }
                      >
                        {isSelected ? (
                          <div className="bg-primary text-primary-foreground absolute top-1 right-1 flex size-5 items-center justify-center rounded-full">
                            <Check className="size-3" />
                          </div>
                        ) : null}
                        <Image
                          className="shrink-0 rounded-xl object-cover lg:rounded-2xl"
                          key={`img-${searchApp.id}`}
                          src={searchApp.metadata.icon}
                          alt={searchApp.metadata.name}
                          width={40}
                          height={40}
                          sizes="100vw"
                        />
                        <Label className="line-clamp-2 min-w-0 flex-1 text-sm leading-tight break-words">
                          {searchApp.metadata.name}
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {isSelected
                          ? `${searchApp.metadata.name} selected`
                          : searchApp.metadata.name}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
