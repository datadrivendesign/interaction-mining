import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { 
  Cake, 
  CircleDot, 
  Plus, 
  Clock, 
  Play, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Edit,
  Eye as EyeIcon,
  Pencil
} from "lucide-react";
import { User, CaptureStatus } from "@prisma/client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { googleImageAdapter } from "../lib/image";
import { prettyOS, prettyTime } from "@/lib/utils";
import { auth } from "@/lib/auth/auth";
import { getCaptures, getTraces } from "@/lib/actions";

const statusConfig = {
  [CaptureStatus.CREATED]: {
    label: "Created",
    icon: Clock,
    color: "bg-blue-500",
    textColor: "text-blue-500",
    description: "Upload your recording to start"
  },
  [CaptureStatus.PROCESSING]: {
    label: "Processing", 
    icon: Play,
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
    description: "Needs to be processed"
  },
  [CaptureStatus.REVIEWING]: {
    label: "Reviewing",
    icon: Eye,
    color: "bg-purple-500", 
    textColor: "text-purple-500",
    description: "Currently in review"
  }
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const user = session?.user as User;

  const [capturesData, tracesData] = await Promise.all([
    getCaptures({
      userId: session.user.id,
      includes: { app: true, task: true },
    }),
    getTraces({
      userId: session.user.id,
      includes: { app: true, task: true },
    }),
  ]);

  if (!capturesData.ok || !tracesData.ok) {
    notFound();
  }

  const captures = capturesData.data;
  const traces = tracesData.data;

  // Group captures by status
  const capturesByStatus = captures.reduce((acc, capture) => {
    if (!acc[capture.status]) {
      acc[capture.status] = [];
    }
    acc[capture.status].push(capture);
    return acc;
  }, {} as Record<CaptureStatus, typeof captures>);

  const totalCaptures = captures.length;
  const approvedCaptures = capturesByStatus[
    CaptureStatus.APPROVED
  ]?.length || 0;
  const pendingCaptures = totalCaptures - approvedCaptures;

  return (
    <main className="flex flex-col grow justify-start items-center min-w-dvw min-h-dvh bg-neutral-50 dark:bg-neutral-950">
      <div className="flex w-full max-w-screen-xl p-6 gap-6">
        {/* User Profile Card */}
        <Card className="flex flex-col w-80 p-6 h-fit">
          <aside>
            <Avatar className="w-full h-auto aspect-square mb-4">
              <AvatarImage
                src={googleImageAdapter(user?.image ?? "", 512)}
                alt="User avatar"
              />
              <AvatarFallback>
                <div className="w-full h-full bg-muted-background flex items-center justify-center">
                  <span className="text-2xl font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                </div>
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-3">
              <div>
                <h1 className="text-xl font-semibold">{user?.name}</h1>
                <span className="text-muted-foreground text-sm">{user?.email}</span>
              </div>
              
              {/* Stats */}
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted-background rounded-lg">
                  <div className="flex items-center">
                    <CircleDot className="mr-2 size-4 text-blue-500" />
                    <span className="text-sm">Total Captures</span>
                  </div>
                  <span className="font-semibold tabular-nums">{totalCaptures}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted-background rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="mr-2 size-4 text-green-500" />
                    <span className="text-sm">Approved Traces</span>
                  </div>
                  <span className="font-semibold tabular-nums">{approvedCaptures}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted-background rounded-lg">
                  <div className="flex items-center">
                    <Clock className="mr-2 size-4 text-yellow-500" />
                    <span className="text-sm">Pending Captures</span>
                  </div>
                  <span className="font-semibold tabular-nums">{pendingCaptures}</span>
                </div>
              </div>

              <span className="inline-flex items-center text-muted-foreground text-sm">
                <Cake className="mr-1 size-4" />
                Contributer since{" "}
                {prettyTime(new Date(user?.createdAt), {
                  format: "yyyy",
                })}
              </span>
            </div>
          </aside>
        </Card>

        {/* Main Content */}
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Manage your captures and traces</p>
            </div>
            <Link href="/capture/new">
              <Button>
                <Plus className="mr-2 size-4" /> New Capture
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="captures" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="captures">Captures</TabsTrigger>
              <TabsTrigger value="traces">Traces</TabsTrigger>
            </TabsList>
            
            <TabsContent value="captures" className="mt-6">
              {totalCaptures > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {Object.entries(statusConfig)
                    .filter(([status]) => status !== CaptureStatus.APPROVED)
                    .map(([status, config]) => {
                      const statusCaptures = capturesByStatus[status as CaptureStatus] || [];
                      const Icon = config.icon;
                      return (
                        <Card key={status} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Icon 
                                  className={`size-5 ${config.textColor}`}
                                />
                                <h3 className="font-semibold">
                                  {config.label}
                                </h3>
                                <Badge variant="secondary" className="ml-2">
                                  {statusCaptures.length}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {statusCaptures.length > 0 ? (
                              <div className="space-y-3">
                                {statusCaptures.map((capture) => (
                                  <CaptureCard 
                                    key={capture.id} 
                                    capture={capture} 
                                    status={status as CaptureStatus}
                                  />
                                ))}
                              </div>
                            ) : (
                              <div 
                                className="flex items-center justify-center py-8 text-muted-foreground"
                              >
                                <AlertCircle className="mr-2 size-4" />
                                No {config.label.toLowerCase()} captures
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  }
                </div>
              ) : (
                <Card className="p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="size-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No captures yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by creating your first capture to begin contributing to the dataset.
                    </p>
                    <Link href="/capture/new">
                      <Button>
                        <Plus className="mr-2 size-4" /> Create First Capture
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="traces" className="mt-6">
              {traces.length > 0 ? (
                <div className="space-y-4">
                  {traces.map((trace) => (
                    <Card key={trace.id}>
                      <CardHeader className="flex flex-row justify-between gap-4 space-y-0">
                        <div className="flex gap-4">
                          {trace.app?.metadata?.icon ? (
                            <Image
                              src={trace.app?.metadata?.icon}
                              alt="App Icon"
                              className="w-16 h-16 rounded-2xl object-cover"
                              width={64}
                              height={64}
                            />
                          ) : (
                            <div className="size-16 rounded-2xl bg-muted-background animate-pulse" />
                          )}
                          <div className="flex flex-col w-full">
                            <h3 className="text-foreground font-semibold">
                              {trace.app?.metadata?.name ?? "Unnamed App"} ({prettyOS(trace.task?.os)})
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {trace.description || "No description"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {prettyTime(trace.created)}
                            </p>
                          </div>
                        </div>
                        <Link href={`/app/${trace.appId}`}>
                          <Button size="sm" variant="secondary">
                            <EyeIcon className="mr-2 size-4" />
                            View
                          </Button>
                        </Link>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <CheckCircle className="size-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No traces yet</h3>
                    <p className="text-muted-foreground">
                      Traces will appear here once you complete and approve captures.
                    </p>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

function CaptureCard({ capture, status }: { capture: any, status: CaptureStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const getActionButton = () => {
    switch (status) {
      case CaptureStatus.CREATED:
        return (
          <Link href={`/capture/${capture.id}/start`}>
            <Button size="sm" variant="default">
              <Play className="mr-2 size-3" />
              Start
            </Button>
          </Link>
        );
      case CaptureStatus.PROCESSING:
        return (
          <Link href={`/capture/${capture.id}/edit`}>
            <Button size="sm" variant="default">
              <Pencil className="mr-2 size-3" />
              Process
            </Button>
          </Link>
        );
      case CaptureStatus.REVIEWING:
        return (
          <Link href={`/capture/${capture.id}/evaluate`}>
            <Button size="sm" variant="default">
              <Eye className="mr-2 size-3" />
              Review
            </Button>
          </Link>
        );
      default:
        return (
          <Link href={`/capture/${capture.id}/edit`}>
            <Button size="sm" variant="outline">
              <Edit className="mr-2 size-3" />
              Edit
            </Button>
          </Link>
        );
    }
  };

  return (
    <div className="flex flex-row items-center justify-between p-3 border rounded-lg hover:bg-muted-background transition-colors">
      <div className="flex flex-col items-center text-center space-x-3">
        {capture.app?.metadata?.icon ? (
          <Image
            src={capture.app?.metadata?.icon}
            alt="App Icon"
            className="w-10 h-10 rounded-lg object-cover"
            width={40}
            height={40}
          />
        ) : (
          <div className="size-10 rounded-lg bg-muted-background animate-pulse" />
        )}
        <h4 className="font-medium text-sm">
          {capture.app?.metadata?.name ?? "Unnamed App"}
        </h4>
      </div>
      <div className="flex flex-col h-full justify-evenly content-evenly items-center text-center ml-2">
        {getActionButton()}
        <p className="text-xs text-muted-foreground self-end">
          {prettyOS(capture.task?.os)} • {capture.task?.description?.slice(0, 30)}{`${capture.task?.description?.length > 30 ? "..." : ""}`}
        </p>
      </div>
    </div>
  );
}
