import { CaptureStatus, Role } from "@prisma/client";
import type { TaskStage } from "./types";

/**
 * Constructs URL for user captures panel with filters
 * @param userId Mongo user ObjectID to filter captures with
 * @param page page number to grab captures from
 * @param appIds Mongo app ObjectIDs to filter captures with
 * @param status Capture status to filter captures with
 * @returns URL string for user captures panel with filters
 */
export const constructUserCapturesURL = (
  userId: string,
  page: number,
  appIds: string[],
  status: CaptureStatus | "",
) => {
  const queryParams = new URLSearchParams();
  queryParams.set("page", page.toString());
  if (appIds.length > 0) {
    queryParams.set("apps", appIds.join(","));
  }
  if (status !== "") {
    queryParams.set("status", status);
  }
  return `/admin/users/${userId}?${queryParams.toString()}`;
};

/**
 * Constructs URL for users panel with filters
 * @param page page number to grab users from
 * @param users Mongo user ObjectIDs to filter users with
 * @param role User role to filter users with
 * @returns URL string for users panel with filters
 */
export const constructUserPanelURL = (
  page: number,
  users: string[],
  role: Role | "",
) => {
  const queryParams = new URLSearchParams();
  queryParams.set("page", page.toString());
  if (users.length > 0) {
    queryParams.set("users", users.join(","));
  }
  if (role !== "") {
    queryParams.set("role", role);
  }
  return `/admin/users?${queryParams.toString()}`;
};

/**
 * Constructs URL for a review queue page with filters
 * @param basePath `/admin/tasks` or `/review/tasks`
 * @param page page number to grab tasks from
 * @param users Mongo user ObjectIDs to filter tasks with
 * @param apps Mongo app ObjectIDs to filter tasks with
 * @param stage Review queue; omitted uses the page's default
 * @returns URL string for tasks panel with filters
 */
export const constructTaskPanelURL = (
  basePath: "/admin/tasks" | "/review/tasks",
  page: number,
  users: string[],
  apps: string[],
  stage?: TaskStage,
) => {
  const queryParams = new URLSearchParams();
  queryParams.set("page", page.toString());
  if (users.length > 0) {
    queryParams.set("users", users.join(","));
  }
  if (apps.length > 0) {
    queryParams.set("apps", apps.join(","));
  }
  if (stage) {
    queryParams.set("stage", stage);
  }
  return `${basePath}?${queryParams.toString()}`;
};
