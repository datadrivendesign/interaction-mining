import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100dvh-64px)] w-dvw items-center justify-center p-8 md:p-16">
      <Card className="w-full max-w-screen-sm">
        <CardHeader>
          <CardTitle>Not Found</CardTitle>
          <CardDescription>
            The trace you are looking for does not exist.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
