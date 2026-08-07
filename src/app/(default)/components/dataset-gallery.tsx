"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { MobileIcon } from "@radix-ui/react-icons";

import { InputRoot, InputIcon, Input } from "@/components/ui/input-icon";
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
import Image from "next/image";
import Link from "next/link";
import { TitleMarquee } from "@/components/marquee";
import { Button } from "@/components/ui/button";
import { Platform } from "@/lib/utils";
import { isProduction } from "@/lib/utils/env";
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";

export default function DatasetGallery() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState(Platform.ANDROID);
  // FIXME: disable UI selection of iOS in prod for now, still in dev
  const isProd = isProduction();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isIOSDisabled = isProd && !isAdmin;

  const params = useMemo(
    () => ({
      query: search,
      where: { os: platform, Trace: { some: {} } },
      limit: 48,
      page: 1,
    }),
    [search, platform],
  );

  const { apps, loading } = useAppSearch(params);

  return (
    <>
      <div className="mb-4 flex w-full items-center justify-between gap-2 lg:gap-4">
        <InputRoot className="w-full">
          <InputIcon>
            <Search size={20} className="text-muted-foreground" />
          </InputIcon>
          <Input
            placeholder="Search for apps"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputRoot>
        <Select
          defaultValue={Platform.ANDROID}
          onValueChange={(value) => setPlatform(value)}
        >
          <SelectTrigger className="h-full! w-full max-w-32">
            <SelectValue placeholder="Select a platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Platforms</SelectLabel>
              <SelectItem value={Platform.ANDROID}>
                <MobileIcon /> Android
              </SelectItem>
              {!isIOSDisabled && (
                <SelectItem value={Platform.IOS}>
                  <MobileIcon /> iOS
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Link className="hidden md:block" href="/explore">
          <Button>
            Explore dataset <ArrowRight size={24} />
          </Button>
        </Link>
      </div>
      {loading || apps.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-lg font-medium text-muted-foreground">
            No apps to show.
          </span>
        </div>
      ) : (
        <div className="grid w-full grid-cols-8 gap-2 sm:grid-cols-12 lg:grid-cols-16">
          {apps.map((app) => (
            <Link
              href={`/app/${app.id}`}
              key={app.id}
              className="group col-span-1 aspect-square overflow-hidden rounded-t-xl *:transition-transform *:duration-300 *:ease-in-out *:group-hover:-translate-y-5 lg:rounded-t-lg"
            >
              <Image
                className="mb-1 h-full w-full rounded-xl object-cover lg:rounded-lg"
                src={app.metadata.icon}
                alt={app.metadata.name}
                width={0}
                height={0}
                sizes="100vw"
              />
              <TitleMarquee title={app.metadata.name} mode="visibility">
                <p className="w-full text-center text-xs font-medium tracking-tight">
                  {app.metadata.name}
                </p>
              </TitleMarquee>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
