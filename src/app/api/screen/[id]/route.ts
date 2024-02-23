import { getScreen } from "@/lib/actions/screen";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let screen;

  try {
    screen = await getScreen(params.id);
  } catch (err: any) {
    return Response.json(
      // { message: "Failed to fetch screen.", screen: {} },
      { message: err.toString(), screen: {} },
      { status: 500 }
    );
  }

  return Response.json({ message: "Found screen.", screen }, { status: 200 });
}
