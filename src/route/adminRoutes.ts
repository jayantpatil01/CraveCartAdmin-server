import { Router } from "express";
import { adminLogin, Hey } from "../controller/adminController.js";

const router = Router();
router.post('/login', adminLogin);
router.get('/Hey',Hey)

export default router;
