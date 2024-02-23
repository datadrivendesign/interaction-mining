export function GET() {
  return Response.json(
    { acknowledged: 1, message: "Working!" },
    { status: 200 }
  );
}
