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

export default function NavigationBar() {
  return (
    <nav className="sticky z-40 top-0 flex w-full h-16 justify-center bg-white dark:bg-black border-b border-neutral-200 dark:border-neutral-800">
      <div className="flex w-full max-w-screen-2xl px-4 py-4 justify-between">
        <div className="flex basis-1/2 h-full">
          <Link
            href={"/"}
            className="text-2xl font-title tracking-tighter"
            style={{ fontWeight: 900, fontStretch: "ultra-expanded" }}
          >
            ODIM
          </Link>
        </div>
        <div className="flex basis-1/2 h-full gap-6 justify-end items-center">
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
