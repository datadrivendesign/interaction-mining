"use client";

import Link from "next/link";;

import {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  SetStateAction,
} from "react";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import { Search } from "lucide-react";

import { Input, InputIcon, InputRoot } from "@/components/ui/input-icon";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSearch } from "@/lib/hooks/app";
import { MobileIcon } from "@radix-ui/react-icons";
import { TitleMarquee } from "@/components/marquee";
import { Platform, prettyOS } from "@/lib/utils";

const GalleryContext = createContext<{
  search: {
    query: string;
    where?: Prisma.AppWhereInput;
  };
  setSearch?: React.Dispatch<SetStateAction<{ query: string; where: Prisma.AppWhereInput; }>>;
}>({
  search: {
    query: "",
    where: { Trace: { some: {} } } as Prisma.AppWhereInput,
  },
  setSearch: () => { },
});

export function GalleryRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  const [search, setSearch] = useState({
    query: "",
    where: { Trace: { some: {} } } as Prisma.AppWhereInput,
  });

  return (
    <GalleryContext.Provider
      value={{
        search,
        setSearch
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function GallerySearch() {
  const { search, setSearch } = useContext(GalleryContext);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch?.({
        query: e.target.value,
        where: search.where!, // Preserve existing filters
      });
    },
    [setSearch, search.where]
  );

  const handleSetOS = useCallback(
    (os: Platform) => {
      setSearch?.({
        query: search.query,
        where: {
          ...search.where,
          os: os,
        },
      });
    },
    [setSearch, search.query, search.where]
  );

  return (
    <div className="flex items-center gap-2 lg:gap-4">
      <InputRoot className="w-full md:w-96">
        <InputIcon>
          <Search className="text-muted-foreground" />
        </InputIcon>
        <Input placeholder="Search for apps"
          value={search.query}
          onChange={handleSearchChange}
          className="w-full"
        />
      </InputRoot>
      <Select defaultValue="android" onValueChange={handleSetOS}>
        <SelectTrigger className="max-w-45 h-full!">
          <SelectValue placeholder="Select a platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Platforms</SelectLabel>
            <SelectItem value={Platform.IOS}>
              <MobileIcon />{prettyOS(Platform.IOS)}
            </SelectItem>
            <SelectItem value={Platform.ANDROID}>
              <MobileIcon />{prettyOS(Platform.ANDROID)}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Gallery() {
  const { search } = useContext(GalleryContext);
  const params = useMemo(() => ({
    query: search.query,
    where: search.where,
    limit: 500,
    page: 1,
  }), [search]);

  const { apps = [], loading: isAppsLoading } = useAppSearch(params);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 p-4 lg:p-6">
      {apps.length > 0 ? (apps.map((app: any, index: number) => (
        <Link
          key={index}
          href={`/app/${app.id}`}
          className="flex w-full min-w-0 overflow-hidden"
        >
          <Image
            src={app.metadata.icon}
            alt={`${app.metadata.name} icon`}
            width={0}
            height={0}
            sizes="100vw"
            className="flex grow-0 shrink-0 basis-12 rounded-xl mr-4 aspect-square drop-shadow-md"
          />
          <div className="flex flex-col grow min-w-0 justify-center">
            <TitleMarquee mode="hover" title={app.metadata.name} className="min-w-0">
              <h2 className="text-sm font-medium leading-tight tracking-tight">{app.metadata.name}</h2>
            </TitleMarquee>
            <span className="text-sm text-muted-foreground line-clamp-1 leading-tight truncate">
              {app.metadata.company || "Unknown Company"}
            </span>
          </div>
        </Link>
      ))) : (
        isAppsLoading ? (
          <div className="col-span-full text-center text-muted-foreground">
            Loading apps...
          </div>) : (
          <div className="col-span-full text-center text-muted-foreground">
            No apps found matching your search criteria.
          </div>
        )
      )}
    </div>
  );
}
