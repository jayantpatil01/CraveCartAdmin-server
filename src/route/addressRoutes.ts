import express from "express";
import { addAddress, getUserAddresses } from "../controller/addressController.js";

const router = express.Router();

router.post("/address/:userId", addAddress);
router.get("/address/:userId", getUserAddresses);

export default router;
