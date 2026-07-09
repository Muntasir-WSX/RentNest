import { Router } from "express";
import { Role } from "../../prisma/generated/prisma/client";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import {
  getAllPropertiesForAdmin,
  getAllRentalsForAdmin,
  getAllUsers,
  updateUserStatus,
} from "../modules/admin/admin.controller";

const router = Router();

router.get("/users", requireAuth, requireRole(Role.ADMIN), getAllUsers);
router.patch("/users/:id", requireAuth, requireRole(Role.ADMIN), updateUserStatus);
router.get("/properties", requireAuth, requireRole(Role.ADMIN), getAllPropertiesForAdmin);
router.get("/rentals", requireAuth, requireRole(Role.ADMIN), getAllRentalsForAdmin);

export default router;