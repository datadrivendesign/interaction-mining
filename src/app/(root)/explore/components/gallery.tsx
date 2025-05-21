"use client";

import Link from "next/link";;
import { getApps } from "@/lib/actions";

import {
  createContext,
  useState,
  useContext,
  useCallback,
} from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { App } from "@prisma/client";

const GalleryContext = createContext({
  data: [] as any[],
  setData: (_: any) => {},
  filteredData: [] as any[],
  setFilteredData: (_: any) => {},
});

export function GalleryRoot({
  data,
  children,
}: {
  data: App[];
  children: React.ReactNode;
}) {
  const [_data, setData] = useState<any[]>(data);
  const [filteredData, setFilteredData] = useState<any[]>(data);
  const [search, setSearch] = useState("");

  return (
    <GalleryContext.Provider
      value={{
        data: _data,
        setData,
        filteredData,
        setFilteredData,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function GallerySearch() {
  const { data, setFilteredData } = useContext(GalleryContext);
  const [search, setSearch] = useState("");

  const handleSearch = useCallback(
    async (value: string) => {
      setSearch(value);

      if (value === "") {
        setFilteredData(data);
      } else {
        await getApps({ query: value }).then((apps) => {
          setFilteredData(apps);
        });
      }
    },
    [data, setFilteredData]
  );

  return (
    <>
      <span className="inline-flex w-full md:w-auto items-center px-2 py-1 ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 has-focus:ring-2 has-focus:ring-blue-500 rounded-lg transition-all duration-75 ">
        <Search size={16} className="text-neutral-400 mr-2" />
        <input
          className="text-base text-neutral-500 dark:text-neutral-400 tracking-tight focus:outline-hidden"
          placeholder="Search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </span>
    </>
  );
}

export function Gallery({ children }: { children?: React.FC<any> }) {
  const { filteredData } = useContext(GalleryContext);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 px-4 md:px-16 mb-16">
      {filteredData.map((app: any, index: number) => (
        <Link
          key={index}
          href={`/app/${app.id}`}
          className="flex w-full"
        >
          <Image
            src={app.metadata.icon}
            alt={`${app.metadata.name} icon`}
            width={48}
            height={48}
            className="rounded-xl mr-4 drop-shadow-md"
          />
          <div className="flex flex-col justify-center">
            <h2 className="text-base font-semibold line-clamp-1 leading-tight">
              {app.metadata.name}
            </h2>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1 leading-tight">
              {app.company}
            </span>
          </div>
        </Link>
      ))}
      {/* {data.map((data: any, index: number) => (
        <Fragment key={index}>{children(data, index)}</Fragment>
      ))} */}
    </div>
  );
}
