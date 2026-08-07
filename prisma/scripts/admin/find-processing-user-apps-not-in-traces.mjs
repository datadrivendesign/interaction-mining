import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    platform: { type: "string", short: "p", default: "ios" },
    user: { type: "string", short: "u", multiple: true, default: [] },
    output: { type: "string", short: "o" },
    format: { type: "string", short: "f", default: "json" },
  },
});

const platform = values.platform;
const userFilters = values.user;
const outputFormat = values.format;
const outputPath =
  values.output ??
  path.join(
    __dirname,
    `cpy-processing-user-apps-not-in-traces-${platform}.${outputFormat}`,
  );

if (!["json", "csv"].includes(outputFormat)) {
  console.error("Invalid format. Expected one of: json, csv.");
  process.exit(1);
}

function csvEscape(value) {
  const stringValue = String(value ?? "");
  if (!/[",\n]/.test(stringValue)) {
    return stringValue;
  }
  return `"${stringValue.replaceAll('"', '""')}"`;
}

function toCsv(users) {
  const columns = [
    "userId",
    "userEmail",
    "userName",
    "appId",
    "packageName",
    "appName",
    "company",
    "captureCount",
    "captureIds",
  ];

  const rows = users.flatMap((user) =>
    user.apps.map((app) => ({
      userId: user.userId,
      userEmail: user.email,
      userName: user.name,
      appId: app.appId,
      packageName: app.packageName,
      appName: app.name,
      company: app.company,
      captureCount: app.captureCount,
      captureIds: app.captureIds.join("|"),
    })),
  );

  return [
    columns.join(","),
    ...rows.map((row) =>
      columns.map((column) => csvEscape(row[column])).join(","),
    ),
  ].join("\n");
}

async function resolveUserIds(filters) {
  if (filters.length === 0) {
    return null;
  }

  const directIds = filters.filter((filter) => !filter.includes("@"));
  const emails = filters.filter((filter) => filter.includes("@"));
  const usersByEmail =
    emails.length > 0
      ? await prisma.user.findMany({
          where: {
            email: {
              in: emails,
            },
          },
          select: {
            id: true,
          },
        })
      : [];

  return [...new Set([...directIds, ...usersByEmail.map((user) => user.id)])];
}

function groupCapturesByUserApp(captures) {
  const groups = new Map();

  for (const capture of captures) {
    if (!capture.userId) {
      continue;
    }

    const key = `${capture.userId}:${capture.appId}`;
    const existing = groups.get(key);

    if (existing) {
      existing.captures.push(capture);
      existing.statuses.add(capture.status);
      existing.taskIds.add(capture.taskId);
      continue;
    }

    groups.set(key, {
      userId: capture.userId,
      appId: capture.appId,
      app: capture.app,
      user: capture.user,
      captures: [capture],
      statuses: new Set([capture.status]),
      taskIds: new Set([capture.taskId]),
    });
  }

  return Array.from(groups.values());
}

function groupAppsByUser(appGroups) {
  const usersById = new Map();

  for (const group of appGroups) {
    const existing = usersById.get(group.userId);
    const app = {
      appId: group.appId,
      packageName: group.app.packageName,
      name: group.app.metadata?.name ?? null,
      company: group.app.metadata?.company ?? null,
      url: group.app.metadata?.url ?? null,
      captureCount: group.captures.length,
      captureIds: group.captures.map((c) => c.id).sort(),
    };

    if (existing) {
      existing.apps.push(app);
      existing.appCount += 1;
      existing.captureCount += group.captures.length;
      continue;
    }

    usersById.set(group.userId, {
      userId: group.userId,
      email: group.user?.email ?? null,
      name: group.user?.name ?? null,
      appCount: 1,
      captureCount: group.captures.length,
      apps: [app],
    });
  }

  return Array.from(usersById.values())
    .map((user) => ({
      ...user,
      apps: user.apps.sort((first, second) => {
        const nameCompare = (first.name ?? "").localeCompare(second.name ?? "");
        if (nameCompare !== 0) {
          return nameCompare;
        }
        return first.packageName.localeCompare(second.packageName);
      }),
    }))
    .sort((first, second) => {
      if (second.appCount !== first.appCount) {
        return second.appCount - first.appCount;
      }
      return (first.email ?? first.userId).localeCompare(
        second.email ?? second.userId,
      );
    });
}

async function main() {
  const userIds = await resolveUserIds(userFilters);

  const captures = await prisma.capture.findMany({
    where: {
      ...(userIds ? { userId: { in: userIds } } : {}),
      app: {
        os: platform,
      },
    },
    include: {
      app: true,
      task: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  const groupedCaptures = groupCapturesByUserApp(captures);
  const appIds = [...new Set(groupedCaptures.map((group) => group.appId))];
  const taskIds = [
    ...new Set(groupedCaptures.flatMap((group) => Array.from(group.taskIds))),
  ];

  const [
    approvedCapturesForApps,
    approvedCapturesForTasks,
    tracesForApps,
    tracesForTasks,
  ] = await Promise.all([
    appIds.length > 0
      ? prisma.capture.findMany({
          where: {
            status: "APPROVED",
            appId: {
              in: appIds,
            },
          },
          select: {
            appId: true,
          },
          distinct: ["appId"],
        })
      : [],
    taskIds.length > 0
      ? prisma.capture.findMany({
          where: {
            status: "APPROVED",
            taskId: {
              in: taskIds,
            },
          },
          select: {
            taskId: true,
          },
          distinct: ["taskId"],
        })
      : [],
    appIds.length > 0
      ? prisma.trace.findMany({
          where: {
            appId: {
              in: appIds,
            },
          },
          select: {
            appId: true,
          },
          distinct: ["appId"],
        })
      : [],
    taskIds.length > 0
      ? prisma.trace.findMany({
          where: {
            taskId: {
              in: taskIds,
            },
          },
          select: {
            taskId: true,
          },
          distinct: ["taskId"],
        })
      : [],
  ]);

  const approvedAppIds = new Set(
    approvedCapturesForApps.map((capture) => capture.appId),
  );
  const approvedTaskIds = new Set(
    approvedCapturesForTasks.map((capture) => capture.taskId),
  );
  const tracedAppIds = new Set(tracesForApps.map((trace) => trace.appId));
  const tracedTaskIds = new Set(tracesForTasks.map((trace) => trace.taskId));

  const matchingAppGroups = groupedCaptures.filter((group) => {
    const allUserAppCapturesAreProcessing =
      group.statuses.size === 1 && group.statuses.has("PROCESSING");
    const hasApprovedTask = Array.from(group.taskIds).some((taskId) =>
      approvedTaskIds.has(taskId),
    );
    const hasTraceForTask = Array.from(group.taskIds).some((taskId) =>
      tracedTaskIds.has(taskId),
    );

    return (
      allUserAppCapturesAreProcessing &&
      !approvedAppIds.has(group.appId) &&
      !hasApprovedTask &&
      !tracedAppIds.has(group.appId) &&
      !hasTraceForTask
    );
  });

  const users = groupAppsByUser(matchingAppGroups);
  const appCount = matchingAppGroups.length;
  const captureCount = matchingAppGroups.reduce(
    (total, group) => total + group.captures.length,
    0,
  );

  const payload = {
    platform,
    exportedAt: new Date().toISOString(),
    filters: {
      users: userFilters,
      resolvedUserIds: userIds,
    },
    userCount: users.length,
    appCount,
    captureCount,
    users,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    outputFormat === "csv"
      ? `${toCsv(users)}\n`
      : `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Found ${appCount} ${platform} user/app groups without approved or trace references`,
  );
  console.log(`- users: ${users.length}`);
  console.log(`- captures in matching groups: ${captureCount}`);
  console.log(`- output: ${outputPath}`);
}

main()
  .catch((error) => {
    console.error(
      "Failed to find processing user/app groups without references.",
    );
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
