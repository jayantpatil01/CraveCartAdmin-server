import express from "express";
import { addAddress } from "./controller/addressController.js"; // adjust path

const router = express.Router();

router.post("/address/:userId", addAddress);

export default router;
