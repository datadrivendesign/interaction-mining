import { getScreens } from "@/lib/actions/screen";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit")
    ? Number.parseInt(searchParams.get("limit")!, 10)
    : 10;
  const page = searchParams.get("page")
    ? Number.parseInt(searchParams.get("page")!, 10)
    : 1;

  let screens = [];

  try {
    screens = await getScreens({
      limit,
      page,
    });
  } catch {
    return Response.json(
      { message: "Failed to fetch screens" },
      { status: 500 }
    );
  }

  return Response.json(
    { message: "OK: Found screens", screens },
    { status: 200 }
  );
}
