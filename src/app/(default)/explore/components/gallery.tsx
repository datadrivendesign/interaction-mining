"use client";

import Link from "next/link";

import {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  SetStateAction,
  useEffect,
} from "react";
import Image from "next/image";
import { App, Prisma, Role } from "@prisma/client";
import { Loader2, Search } from "lucide-react";

import { Input, InputIcon, InputRoot } from "@/components/ui/input-icon";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSearch } from "@/lib/hooks/app";
import { MobileIcon } from "@radix-ui/react-icons";
import { TitleMarquee } from "@/components/marquee";
import { cn, Platform, prettyOS } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { isProduction } from "@/lib/utils/env";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminPagination } from "@/components/ui/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { platform } from "node:os";

const GalleryContext = createContext<{
  apps: App[];
  totalCount: number;
  isLoading: boolean;
  itemsPerPage: number;
  search: {
    query: string;
    where?: Prisma.AppWhereInput;
  };
  setSearch?: React.Dispatch<
    SetStateAction<{ query: string; where: Prisma.AppWhereInput }>
  >;
  platform: Platform;
  setPlatform: React.Dispatch<SetStateAction<Platform>>;
  page: number;
  setPage: React.Dispatch<SetStateAction<number>>;
}>({
  apps: [],
  totalCount: 0,
  isLoading: false,
  itemsPerPage: 44,
  search: {
    query: "",
    where: { Trace: { some: {} } } as Prisma.AppWhereInput,
  },
  setSearch: () => {},
  platform: Platform.ANDROID,
  setPlatform: () => {},
  page: 1,
  setPage: () => {},
});

export function GalleryRoot({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const page = searchParams.get("page")
    ? parseInt(searchParams.get("page")!)
    : 1;
  const queryTerm = searchParams.get("query") || "";

  const isProd = isProduction();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isIOSDisabled = isProd && !isAdmin;
  const queryPlatform = isIOSDisabled
    ? Platform.ANDROID
    : searchParams.get("platform") || Platform.ANDROID;

  const [search, setSearch] = useState({
    query: queryTerm,
    where: { Trace: { some: {} } } as Prisma.AppWhereInput,
  });
  const [platform, setPlatform] = useState<Platform>(queryPlatform);
  const [currentPage, setCurrentPage] = useState(page);

  const itemsPerPage = 44;
  const params = useMemo(
    () => ({
      query: search.query,
      where: {
        ...search.where,
        os: platform,
      },
      limit: itemsPerPage,
      page: page,
    }),
    [search, platform, page]
  );

  const {
    apps = [],
    totalCount = 0,
    loading: isLoading,
  } = useAppSearch(params);

  // sync URL param with state
  useEffect(() => {
    setCurrentPage(page);
    setPlatform(queryPlatform);
    setSearch({
      query: queryTerm,
      where: { Trace: { some: {} } } as Prisma.AppWhereInput,
    });
  }, [page, queryPlatform, queryTerm]);

  return (
    <GalleryContext.Provider
      value={{
        apps,
        totalCount,
        isLoading,
        itemsPerPage,
        search,
        setSearch,
        platform,
        setPlatform,
        page: currentPage,
        setPage: setCurrentPage,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function GallerySearch() {
  const router = useRouter();
  const { platform, search, setSearch, setPlatform, totalCount } =
    useContext(GalleryContext);
  // FIXME: disable UI selection of iOS in prod for now, still in testing
  const { data: session } = useSession();
  const isProd = isProduction();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isIOSDisabled = isProd && !isAdmin;

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearch?.({
        query: query,
        where: search.where!, // Preserve existing filters
      });
      const queryParams = new URLSearchParams();
      queryParams.set("page", "1");
      queryParams.set("platform", platform);
      if (query) {
        queryParams.set("query", query);
      }
      router.push(`/explore?${queryParams.toString()}`);
    },
    [setSearch, search.where, router, platform]
  );

  const handleSetOS = useCallback(
    (os: Platform) => {
      const queryParams = new URLSearchParams();
      queryParams.set("page", "1");
      queryParams.set("platform", os);
      if (search.query) {
        queryParams.set("query", search.query);
      }
      setPlatform(os);
      router.push(`/explore?${queryParams.toString()}`);
    },
    [setPlatform, router, search.query]
  );

  console.log("platform", platform);

  return (
    <div className="flex items-center gap-2 lg:gap-4">
      <Badge variant="secondary" className="h-full px-3">
        {totalCount} Apps
      </Badge>
      <InputRoot className="w-full md:w-96">
        <InputIcon>
          <Search className="text-muted-foreground" />
        </InputIcon>
        <Input
          placeholder="Search for apps"
          value={search.query}
          onChange={handleSearchChange}
          className="w-full"
        />
      </InputRoot>
      <Select value={platform} onValueChange={handleSetOS}>
        <SelectTrigger className="w-full max-w-32 h-full!">
          <SelectValue placeholder="Select a platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Platforms</SelectLabel>
            <SelectItem value={Platform.ANDROID}>
              <MobileIcon />
              {prettyOS(Platform.ANDROID)}
            </SelectItem>
            {!isIOSDisabled && (
              <SelectItem value={Platform.IOS}>
                <MobileIcon />
                {prettyOS(Platform.IOS)}
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

export function Gallery() {
  const router = useRouter();
  const {
    apps,
    platform,
    search,
    totalCount,
    isLoading,
    itemsPerPage,
    page,
    setPage,
  } = useContext(GalleryContext);

  // pagination logic
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const handlePageChange = useCallback(
    (page: number) => {
      const queryParams = new URLSearchParams();
      queryParams.set("page", page.toString());
      if (search.query) {
        queryParams.set("query", search.query);
      }
      if (platform) {
        queryParams.set("platform", platform);
      }
      setPage(page);
      router.push(`/explore?${queryParams.toString()}`);
    },
    [setPage, router, search.query, platform]
  );

  return (
    <>
      {isLoading && (
        <div className="flex flex-col col-span-full justify-center items-center text-center text-muted-foreground">
          <Loader2 className="animate-spin w-8 h-8" />
          <span className="text-md font-medium leading-tight tracking-tight mt-2">
            Loading apps...
          </span>
        </div>
      )}

      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 p-4 lg:p-6",
          isLoading && "opacity-50"
        )}
      >
        {apps.length > 0 ? (
          apps.map((app: any, index: number) => (
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
                <TitleMarquee
                  mode="hover"
                  title={app.metadata.name}
                  className="min-w-0"
                >
                  <h2 className="text-sm font-medium leading-tight tracking-tight">
                    {app.metadata.name}
                  </h2>
                </TitleMarquee>
                <span className="text-sm text-muted-foreground line-clamp-1 leading-tight truncate">
                  {app.metadata.company || "Unknown Company"}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center text-muted-foreground">
            No apps found matching your search criteria.
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="w-full flex justify-center">
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}
