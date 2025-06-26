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
    <nav className="sticky z-40 top-0 flex w-full justify-center bg-background border-b border-muted-background">
      <div className="flex w-full max-w-screen-2xl p-4 lg:px-6 lg:py-4 justify-between">
        <div className="flex items-center basis-1/2 h-full gap-4 lg:gap-6 ">
          <Link
            href={"/"}
            className="text-2xl font-semibold leading-none tracking-tighter"
          >
            <LogoSm className="block w-auto h-8 fill-foreground" />
          </Link>
          <Link href="/explore">
            <span className="inline-flex items-center text-sm text-muted-foreground hover:text-muted-foreground/90 font-medium transition-colors duration-150 ease-in-out">
              Explore
            </span>
          </Link>
          <Link href="/contribute">
            <span className="inline-flex items-center text-sm text-muted-foreground hover:text-muted-foreground/90 font-medium transition-colors duration-150 ease-in-out">
              Contribute
            </span>
          </Link>
        </div>
        <div className="flex basis-1/2 h-full justify-end items-center">
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
              <Link href={`/admin`}>Admin Dashboard</Link>
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
