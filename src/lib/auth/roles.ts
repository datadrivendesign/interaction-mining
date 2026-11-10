import { Role } from "@prisma/client";
import type { Session } from "next-auth";
import type { ActionPayload } from "@/lib/actions/types";

/**
 * Role checks in one place. `Session.user.role` is typed `string`, so a
 * comparison like `role !== Role.ADMIN` compiles against any value; routing
 * every check through here means adding a role is a change to this file, not
 * a hunt through 33 call sites.
 *
 * Tiers: USER (worker) < REVIEWER (Cat's staff, first-pass review) < ADMIN.
 * A REVIEWER check is satisfied by an ADMIN as well.
 */

type MaybeSession = Session | null | undefined;

export function hasRole(session: MaybeSession, ...roles: Role[]): boolean {
  const role = session?.user?.role;
  return role !== undefined && (roles as string[]).includes(role);
}

/** ADMIN only. */
export function isAdmin(session: MaybeSession): boolean {
  return hasRole(session, Role.ADMIN);
}

/** REVIEWER or ADMIN. */
export function isReviewer(session: MaybeSession): boolean {
  return hasRole(session, Role.REVIEWER, Role.ADMIN);
}

/** Failure payload for a role check, so action messages stay uniform. */
export function roleDenied<T>(
  message = "User is not authorized.",
): ActionPayload<T> {
  return { ok: false, message, data: null };
}
