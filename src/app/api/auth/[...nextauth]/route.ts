import { handlers } from "@/lib/auth/auth";

// Force Node.js runtime to avoid edge compatibility issues
export const runtime = "nodejs";

export const { GET, POST } = handlers;
