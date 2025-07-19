import { Router } from "express";
import upload from "../utils/multer.js";
import { addMenu, getAllMenus, getMenuById } from "../controller/menuController.js";

const router = Router();

router.post("/menus", upload.single("image"), addMenu);
router.get("/menus", getAllMenus);
router.get("/menus/:id", getMenuById);

export default router;
