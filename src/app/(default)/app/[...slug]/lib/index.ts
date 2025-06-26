import { Prisma, Screen } from "@prisma/client";

export const downloadTrace = (
  trace: Prisma.TraceGetPayload<{
    include: {
      app: true;
      screens: true;
      task: true;
    };
  }>
) => {
  // Replace all screen sources with dereferenced URLs
  let screens = trace.screens.map((screen: Screen) => ({
    ...screen,
    src: screen.src.replace(
      `${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL!}`,
      `${process.env.NEXT_PUBLIC_DEPLOYMENT_URL!}/cdn`
    ),
  }));

  let exportedData = {
    ...trace,
    screens: screens,
  };

  const fileData = JSON.stringify(exportedData, null, 2);
  const blob = new Blob([fileData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `inspectData-${trace.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
