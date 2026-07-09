import { Router } from "express";
import { getCategories } from "../modules/category/category.controller";

const router = Router();

router.get("/", getCategories);

export default router;