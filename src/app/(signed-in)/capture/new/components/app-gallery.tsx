import { Input, InputIcon, InputRoot } from "@/components/ui/input-icon";
import { Platform } from "@/lib/utils";
import { useAppSearch } from "@/lib/hooks/app";
import { Search } from "lucide-react";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export default function AppGallery({ 
  platform,
  app,
  setApp
} : { 
  platform: Platform,
  app: { name: string; id: string;},
  setApp:Dispatch<SetStateAction<{ name: string; id: string; }>>
}) {
  const [search, setSearch] = useState("");

  const params = useMemo(() => ({
    query: search,
    where: { os: platform },
    limit: 10,
    page: 1,
  }), [search, platform]);
  const { apps: searchApps, loading } = useAppSearch(params);

  return (
    <>
      <div className="flex items-center justify-between w-full mt-3">
      <InputRoot className="w-[50%]">
        <InputIcon>
          <Search size={20} className="text-muted-foreground  " />
        </InputIcon>
        <Input placeholder="Search for apps" value={search} onChange={e => setSearch(e.target.value)} />
      </InputRoot>
      </div>
      {loading || searchApps.length === 0 ? (
        <div className="flex justify-center items-center w-full h-full bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg">
          <span className="text-lg font-medium text-muted-foreground">No apps to show.</span>
        </div>
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-8 w-full gap-2 lg:gap-4 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg">
          {searchApps.map(searchApp => (
            <TooltipProvider key={`tooltip-${searchApp.id}`}>              
              <Tooltip>
                <TooltipTrigger asChild>                
                  <div
                    className={`flex flex-col items-center content-center justify-center cursor-pointer hover:bg-neutral-400 rounded-lg ${searchApp.metadata.name === app.name ? "bg-neutral-400" : ""}`} 
                    onClick={() => setApp({
                      name: searchApp.metadata.name, 
                      id: searchApp.packageName
                    })}
                  >
                    <Image
                      className="object-cover rounded-xl lg:rounded-2xl mb-1"
                      key={`img-${searchApp.id}`}
                      src={searchApp.metadata.icon}
                      alt={searchApp.metadata.name}
                      width={40}
                      height={40}
                      sizes="100vw"
                    />
                    <Label className="text-sm text-center self-center overflow-hidden overflow-ellipsis whitespace-nowrap w-full max-w-full">
                      {searchApp.metadata.name}
                    </Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{searchApp.metadata.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )
      }
    </>
  );
}