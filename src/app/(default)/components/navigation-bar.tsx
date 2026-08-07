"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Role } from "@prisma/client";
import LogoSm from "@/public/logo_sm.svg";

export default function NavigationBar() {
  return (
    <nav className="sticky top-0 z-40 flex w-full justify-center border-b border-muted-background bg-background">
      <div className="flex w-full max-w-screen-2xl justify-between p-4 lg:px-6 lg:py-4">
        <div className="flex h-full basis-1/2 items-center gap-4 lg:gap-6">
          <Link
            href={"/"}
            className="text-2xl leading-none font-semibold tracking-tighter"
          >
            <LogoSm className="block h-8 w-auto fill-foreground" />
          </Link>
          <Link href="/explore">
            <span className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:text-muted-foreground/90">
              Explore
            </span>
          </Link>
          <Link href="/contribute">
            <span className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:text-muted-foreground/90">
              Get Involved
            </span>
          </Link>
        </div>
        <div className="flex h-full basis-1/2 items-center justify-end gap-4 lg:gap-6">
          <Link href="/archive/rico" target="_blank">
            <span className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors duration-150 ease-in-out hover:text-muted-foreground/90">
              Rico Dataset <ArrowUpRight className="ml-0.5 size-4" />
            </span>
          </Link>
          <SessionContent />
        </div>
      </div>
    </nav>
  );
}

function SessionContent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <>
        <Avatar>
          <AvatarFallback className="animate-pulse" />
        </Avatar>
      </>
    );
  }
  return session ? (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage src={session.user?.image ?? ""} alt="User avatar" />
            <AvatarFallback>
              {session.user?.email?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard`}>Dashboard</Link>
          </DropdownMenuItem>

          {session.user?.role === Role.ADMIN && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/tasks`}>Admin Dashboard</Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  ) : (
    <Button
      variant="default"
      size="sm"
      onClick={() => signIn(undefined, { callbackUrl: `/` })}
    >
      Sign In
    </Button>
  );
}
