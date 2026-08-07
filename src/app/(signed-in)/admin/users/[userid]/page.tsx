import { getUser } from "@/lib/actions";
import { notFound } from "next/navigation";
import { InfoColumn } from "./components/info-column";
import { CapturesColumn } from "./components/captures-column";

export default async function ManageUserPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;

  const userRes = await getUser(
    userid,
    {},
    { select: { id: true, name: true, email: true, role: true, image: true } },
  );
  if (!userRes.ok) {
    notFound();
  }
  const user = userRes.data;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-16 md:grid-cols-4">
        <InfoColumn user={user} />
        <CapturesColumn userId={userid} />
      </div>
    </div>
  );
}
