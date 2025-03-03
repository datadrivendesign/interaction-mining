import { getScreen } from "@/lib/actions/screen";
import { NextRequest } from "next/server";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let screen;

  try {
    const { id } = await params;
    screen = await getScreen(id);
  } catch (err: any) {
    return Response.json(
      // { message: "Failed to fetch screen.", screen: {} },
      { message: err.toString(), screen: {} },
      { status: 500 }
    );
  }

  return Response.json({ message: "Found screen.", screen }, { status: 200 });
}
