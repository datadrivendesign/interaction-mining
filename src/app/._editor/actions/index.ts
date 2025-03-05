"use server";
import { DateTime } from "luxon";
import { Screen } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { prettyTime } from "@/lib/utils/date";

export async function splitTrace(
  screens: Screen[],
  appId: string,
  worker: string = ""
) {
  if (!screens.length) {
    throw new Error("No screens provided to split.");
  }

  const currentDateTime = DateTime.now();

  // Create a new trace
  const newTrace = await prisma.trace.create({
    data: {
      appId: appId, // Assuming all screens belong to the same app
      v: 1,
      created: new Date(),
      name: `New Split Trace ${prettyTime(currentDateTime, {
        format: "LLLL dd, yyyy",
      })}
      at
      ${prettyTime(currentDateTime, {
        format: "hh:mm a",
      })}`,
      description: "This trace was created by splitting existing screens.",
      taskId: "", // Assuming the task ID is the same for all screens
      worker: worker, // Assuming the worker is the same for all screens
    },
  });

  // Update the screens to point to the new trace
  const screenIds = screens.map((screen: Screen) => screen.id);
  await prisma.screen.updateMany({
    where: {
      id: { in: screenIds },
    },
    data: {
      traceId: newTrace.id,
    },
  });

  // Update the new trace to reference the split screens
  await prisma.trace.update({
    where: { id: newTrace.id },
    data: {
      screenIds: screenIds,
    },
  });

  return newTrace;
}

export async function deleteScreens(screens: Screen[]) {
  if (!screens.length) {
    throw new Error("No screens provided for deletion.");
  }

  try {
    // Make DELETE requests for each screen
    const deletionPromises = screens.map((screen) =>
      fetch(`${process.env.OLD_API_URL}/screens/${screen.id}`, {
        method: "DELETE",
      })
    );

    // Wait for all deletion requests to complete
    const responses = await Promise.all(deletionPromises);

    // Check if all requests were successful
    const failedDeletions = responses.filter((response) => !response.ok);

    if (failedDeletions.length > 0) {
      throw new Error(
        `${failedDeletions.length} screens failed to delete. Please try again.`
      );
    }

    return "Screens deleted successfully.";
  } catch (error) {
    console.error("Failed to delete screens:", error);
    throw new Error("An error occurred while deleting the screens.");
  }
}

// export async function deleteScreens(screens: Screen[]) {
//   if (!screens.length) {
//     throw new Error("No screens provided to delete.");
//   }

//   const screenIds = screens.map((screen) => screen.id);

//   // Set the traceId to null for the provided screens
//   await prisma.screen.updateMany({
//     where: {
//       id: { in: screenIds },
//     },
//     data: {
//       traceId: "",
//     },
//   });

//   // Optionally, delete the traces associated with these screens
//   const traceIds = screens.map((screen) => screen.traceId);
//   await prisma.trace.deleteMany({
//     where: {
//       id: { in: traceIds },
//     },
//   });

//   return `Deleted screens and traces associated with provided screen IDs.`;
// }
