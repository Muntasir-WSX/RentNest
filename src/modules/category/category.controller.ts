import type { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { sendSuccess } from "../../utils/apiResponse";

export async function getCategories(req: Request, res: Response) {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res.status(httpStatus.OK).json(
    sendSuccess(categories, "Categories fetched successfully"),
  );
}