import { Router } from "express";
import { Role } from "../../prisma/generated/prisma/client";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { createReview } from "../modules/review/review.controller";

const router = Router();

router.post("/", requireAuth, requireRole(Role.TENANT, Role.ADMIN), createReview);

export default router;