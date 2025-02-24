import { notFound } from "next/navigation";
import Link from "next/link";
import { Minus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getCapture } from "@/lib/actions";

export default async function Page({
  params,
}: {
  params: Promise<{ captureId: string }>;
}) {
  const { captureId } = await params;

  const { data: capture } = await getCapture({ id: captureId }).then(
    (capture) => {
      if (!capture.ok) {
        notFound();
      } else {
        return capture;
      }
    }
  );

  return (
    <div className="flex w-dvw min-h-dvh justify-center items-start md:items-center p-8 md:p-16">
      <Card className="w-full max-w-screen-md">
        <CardHeader>
          <CardTitle>Launch ODIM</CardTitle>
          <CardDescription>
            Choose the method that works best for you to launch ODIM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row w-full gap-6">
            <div className="flex flex-col md:w-1/2">
              <article className="flex flex-col">
                <h2 className="text-lg font-semibold mb-2">
                  Scanning a QR code
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-4">
                  Point the camera on your phone or tablet at this QR code to
                  launch ODIM.
                </p>
                {capture.id ? (
                  <QRCodeSVG
                    className="w-full max-w-3xs h-auto rounded-xl object-contain aspect-square p-4 bg-white"
                    value={`${process.env.NEXT_PUBLIC_DEPLOYMENT_URL}/capture/${captureId}/upload`}
                  />
                ) : (
                  <div className="w-full max-w-3xs h-auto rounded-xl object-contain aspect-square p-4 bg-neutral-200 dark:bg-neutral-800 animate-pulse"></div>
                )}
              </article>
            </div>
            <div className="flex flex-col md:w-1/2">
              <article className="flex flex-col">
                <h2 className="text-lg font-semibold mb-2">
                  Using a capture session code
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 font-medium mb-4">
                  Go to{" "}
                  <Link className="underline" href="/capture/upload">
                    odim.app/capture/upload
                  </Link>{" "}
                  and enter the following capture session code:
                </p>
                <div className="flex items-center gap-2 has-[:disabled]:opacity-50">
                  {capture.otp && (
                    <>
                      <div className="flex items-center">
                        {capture.otp
                          .substring(0, 3)
                          .split("")
                          .map((digit, index) => (
                            <div
                              key={index}
                              className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800"
                            >
                              {digit}
                            </div>
                          ))}
                      </div>
                      <div role="separator">
                        <Minus />
                      </div>
                      <div className="flex items-center">
                        {capture.otp
                          .substring(3, 6)
                          .split("")
                          .map((digit, index) => (
                            <div
                              key={index}
                              className="relative flex h-9 w-9 items-center justify-center border-y border-r border-neutral-200 text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-neutral-800"
                            >
                              {digit}
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </article>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
