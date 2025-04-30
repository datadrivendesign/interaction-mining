"use server";
import { Prisma, Redaction } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isValidObjectId } from "mongoose";
import { ActionPayload } from "./types";

interface GetRedactionsParams {
  id?: string;
  screenId?: string;
  limit?: number;
  page?: number;
  includes?: Prisma.RedactionInclude;
}

export async function getRedactions({
  id,
  screenId,
  includes,
}: GetRedactionsParams): Promise<ActionPayload<Redaction[]>> {
  const { screen } = includes || {};
  let redactions = [];

  if (id && !isValidObjectId(id)) {
    return { ok: false, message: "Invalid id provided.", data: null };
  }

  if (screenId && !isValidObjectId(screenId)) {
    return { ok: false, message: "Invalid screenId provided.", data: null };
  }

  const query: Prisma.RedactionWhereInput = {
    ...(id ? { id } : {}),
    ...(screenId ? { screenId } : {}),
  };

  try {
    redactions = await prisma.redaction.findMany({
      where: query,
      include: {
        screen,
      },
    });

    if (!redactions) {
      return {
        ok: false,
        message: "No redactions found.",
        data: null,
      };
    }

    return {
      ok: true,
      message: "Redactions found.",
      data: redactions,
    };
  } catch (err: any) {
    console.error(err);
    return {
      ok: false,
      message: "Failed to fetch redactions.",
      data: null,
    };
  }
}

export async function createRedaction(
  redaction: Prisma.RedactionCreateInput
): Promise<ActionPayload<Redaction>> {
  try {
    const newRedaction = await prisma.redaction.create({
      data: redaction,
    });

    return {
      ok: true,
      message: "Redaction created successfully.",
      data: newRedaction,
    };
  } catch (err: any) {
    console.error(err);
    return {
      ok: false,
      message: "Failed to create redaction.",
      data: null,
    };
  }
}

export async function updateRedaction(
  id: string,
  redaction: Prisma.RedactionUpdateInput
): Promise<ActionPayload<Redaction>> {
  if (!isValidObjectId(id)) {
    return { ok: false, message: "Invalid id provided.", data: null };
  }

  try {
    const updatedRedaction = await prisma.redaction.update({
      where: { id },
      data: redaction,
    });

    return {
      ok: true,
      message: "Redaction updated successfully.",
      data: updatedRedaction,
    };
  } catch (err: any) {
    console.error(err);
    return {
      ok: false,
      message: "Failed to update redaction.",
      data: null,
    };
  }
}

export async function deleteRedaction(
  id: string
): Promise<ActionPayload<Redaction>> {
  if (!isValidObjectId(id)) {
    return { ok: false, message: "Invalid id provided.", data: null };
  }

  try {
    const deletedRedaction = await prisma.redaction.delete({
      where: { id },
    });

    return {
      ok: true,
      message: "Redaction deleted successfully.",
      data: deletedRedaction,
    };
  } catch (err: any) {
    console.error(err);
    return {
      ok: false,
      message: "Failed to delete redaction.",
      data: null,
    };
  }
}