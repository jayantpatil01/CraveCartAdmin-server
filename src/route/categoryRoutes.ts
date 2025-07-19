import { Router } from "express";
import upload from "../utils/multer.js";
import { addCategory, getAllCategories, getCategoryById } from "../controller/categoryController.js";

const router = Router();

router.post("/categories", upload.single("image"), addCategory);
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategoryById);

export default router;
