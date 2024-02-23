import { prisma } from "@/lib/prisma";
import { Trace } from "@prisma/client";
import { isObjectIdOrHexString } from "mongoose";

interface GetTraceParams {
  limit?: number;
  page?: number;
}

export async function getTraces({ limit = 10, page = 1 }: GetTraceParams = {}) {
  let traces: Trace[] = [];

  try {
    traces = (await prisma.trace.findMany({
      take: limit,
      skip: (page - 1) * limit,
      include: {
        app: true,
        screens: true,
      },
    })) as Trace[];
  } catch (err: any) {
    console.error(err);
    throw new Error("Failed to fetch traces.");
  }

  return traces;
}

export async function getTrace(id: string) {
  let trace: Trace | null = null;

  if (!id || !isObjectIdOrHexString(id)) {
    return null;
  }
  try {
    trace = await prisma.trace.findUnique({
      where: {
        id,
      },
      include: {
        app: true,
      },
    });
  } catch {
    throw new Error("Failed to fetch trace.");
  }

  return trace;
}

export async function getTraceByApp(id: string) {
  let trace: Trace[] = [] as Trace[];

  if (!id || !isObjectIdOrHexString(id)) {
    let e = new Error("Invalid app id.");
    e.name = "TypeError";
    throw e;
  }
  try {
    trace = await prisma.trace.findMany({
      where: {
        appId: id,
      },
      include: {
        app: true,
        screens: true,
      },
    });
  } catch (err) {
    console.error(err);
    throw new Error("Failed to fetch trace.");
  }

  return trace;
}

// export async function updateTraceRelations() {

//   console.log("Updating trace relations...");
//   // get all traces
//   const traces = await prisma.trace.findMany({
//     include: {
//       app: true,
//       screens: true,
//     },
//   });

//   console.log(`Found ${traces.length} traces`);

//   // for each trace, go thru the screens and update each screen to have a trace field containing the trace id
//   for (const trace of traces) {
//     console.log(`Updating trace ${trace.id}`);
//     // progress in form [traces done/total]
//     console.log(`[${traces.indexOf(trace) + 1}/${traces.length}]`);

//     for (const screen of trace.screensIds) {
//       await prisma.screen.update({
//         where: {
//           id: screen,
//         },
//         data: {
//           trace: {
//             connect: {
//               id: trace.id,
//             },
//           },
//         },
//       });
//     }
//   }
// }