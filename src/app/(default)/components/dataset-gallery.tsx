"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MobileIcon } from "@radix-ui/react-icons";

import { InputRoot, InputIcon, Input } from "@/components/ui/input-icon";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppSearch } from "@/lib/hooks/app";
import Image from "next/image";
import Link from "next/link";
import { TitleMarquee } from "@/components/marquee";

export default function DatasetGallery() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("android");

  const params = useMemo(() => ({
    query: search,
    where: { os: platform, Trace: { some: {} } },
    limit: 24,
    page: 1,
  }), [search, platform]);

  const { apps, loading } = useAppSearch(params);

  return (
    <>
      <div className="flex items-center justify-between w-full gap-2 lg:gap-4 mb-4">
        <InputRoot className="w-full">
          <InputIcon>
            <Search size={20} className="text-muted-foreground" />
          </InputIcon>
          <Input placeholder="Search for apps" value={search} onChange={e => setSearch(e.target.value)} />
        </InputRoot>
        <Select defaultValue="android" onValueChange={value => setPlatform(value)}>
          <SelectTrigger className="max-w-45 h-full!">
            <SelectValue placeholder="Select a platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Platforms</SelectLabel>
              <SelectItem value="ios"><MobileIcon /> iOS</SelectItem>
              <SelectItem value="android"><MobileIcon /> Android</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {loading || apps.length === 0 ? (
        <div className="flex justify-center items-center w-full h-full">
          <span className="text-lg font-medium text-muted-foreground">No apps to show.</span>
        </div>
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 lg:grid-cols-8 w-full gap-2 lg:gap-4">
          {apps.map(app => (
            <Link href={`/app/${app.id}`} key={app.id} className="group col-span-1 aspect-square overflow-hidden rounded-t-xl lg:rounded-t-2xl *:group-hover:-translate-y-5 *:transition-transform *:duration-300 *:ease-in-out">
              <Image
                className="object-cover w-full h-full rounded-xl lg:rounded-2xl mb-1"
                src={app.metadata.icon}
                alt={app.metadata.name}
                width={0}
                height={0}
                sizes="100vw"
              />
              <TitleMarquee title={app.metadata.name} mode="visibility">
                <p className="w-full text-center text-xs font-medium tracking-tight">{app.metadata.name}</p>
              </TitleMarquee>
            </Link>
          ))}
        </div>
      )
      }
    </>
  )
}