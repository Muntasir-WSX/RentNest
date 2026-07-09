import { Router } from "express";
import {
  getProperties,
  getPropertyById,
} from '../modules/property/property.controller.js';

const router = Router();

router.get("/", getProperties);
router.get("/:id", getPropertyById);

export default router;